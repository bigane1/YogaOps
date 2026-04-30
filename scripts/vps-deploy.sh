#!/usr/bin/env bash
# Exécuté sur le VPS après `git pull`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Charger nvm (désactive set -u temporairement car nvm.sh utilise des variables non liées)
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
  echo "=== Installation de nvm ==="
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
set +u
# shellcheck source=/dev/null
source "$NVM_DIR/nvm.sh"
set -u

# Installer Node.js LTS si absent
if ! command -v node >/dev/null 2>&1; then
  echo "=== Installation de Node.js LTS ==="
  set +u
  nvm install --lts
  nvm alias default node
  set -u
fi

export NODE_ENV=production

# Charger le .env local si présent (pour DATABASE_URL, etc.)
if [ -f .env ]; then
  set -o allexport
  # shellcheck source=/dev/null
  source .env
  set +o allexport
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "⚠ DATABASE_URL absent du .env — Prisma utilisera le fallback file:./dev.db"
fi

echo "=== YogaOps deploy : $(pwd) — Node $(node -v) ==="

npm ci
npx prisma migrate deploy
npx prisma generate
npm run build

PM2_APP_NAME="${PM2_APP_NAME:-yogaops}"

# pm2 global OU npx (pas besoin d’installer pm2 à la main sur le VPS)
run_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    pm2 "$@"
  elif [[ -x ./node_modules/.bin/pm2 ]]; then
    ./node_modules/.bin/pm2 "$@"
  else
    npx --yes pm2 "$@"
  fi
}

if [[ -n "${DEPLOY_RESTART_CMD:-}" ]]; then
  bash -c "$DEPLOY_RESTART_CMD"
else
  if run_pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    run_pm2 restart "$PM2_APP_NAME"
  else
    run_pm2 start npm --name "$PM2_APP_NAME" -- start
    run_pm2 save
  fi
fi
