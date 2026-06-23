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

# Convertir les fins de ligne Windows (CRLF → LF) si nécessaire
if [ -f .env ]; then
  sed -i 's/\r//' .env
fi

# VPS OVH : stockage local des images (pas Vercel Blob)
if [ -f .env ]; then
  if ! grep -qE '^UPLOAD_STORAGE=' .env; then
    echo 'UPLOAD_STORAGE=local' >> .env
    echo "→ UPLOAD_STORAGE=local ajouté au .env"
  fi
  if grep -qE '^BLOB_READ_WRITE_TOKEN=.*xxx' .env; then
    sed -i '/^BLOB_READ_WRITE_TOKEN=/d' .env
    echo "→ BLOB_READ_WRITE_TOKEN (placeholder) supprimé du .env"
  fi
fi

# Next.js et Prisma lisent .env automatiquement — pas besoin de le sourcer.
# On extrait uniquement DATABASE_URL pour le message de diagnostic, de façon sûre.
if [ -f .env ]; then
  _DB_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '\r"' || true)
else
  _DB_URL=""
fi
if [ -z "${_DB_URL:-}" ]; then
  echo "⚠ DATABASE_URL absent du .env — Prisma utilisera le fallback file:./dev.db"
fi

echo "=== YogaOps deploy : $(pwd) — Node $(node -v) ==="

mkdir -p public/uploads
chmod 755 public/uploads

# Installer toutes les dépendances (y compris dev) pour le build
npm ci --include=dev
npx prisma migrate deploy
npx prisma generate
npm run build

# Passer en mode production uniquement pour le démarrage de l'app
export NODE_ENV=production

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
