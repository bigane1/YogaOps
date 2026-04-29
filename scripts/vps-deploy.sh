#!/usr/bin/env bash
# Exécuté sur le VPS après `git pull`. Pré-requis : Node.js LTS, `.env` avec DATABASE_URL, secrets app.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export NODE_ENV=production

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
