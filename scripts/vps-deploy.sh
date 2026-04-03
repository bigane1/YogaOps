#!/usr/bin/env bash
# Exécuté sur le VPS après `git pull`. Pré-requis : Node.js LTS, `.env` avec DATABASE_URL, secrets app.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export NODE_ENV=production

npm ci
npx prisma migrate deploy
npx prisma generate
npm run build

PM2_APP_NAME="${PM2_APP_NAME:-yogaops}"

if [[ -n "${DEPLOY_RESTART_CMD:-}" ]]; then
  bash -c "$DEPLOY_RESTART_CMD"
elif command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$PM2_APP_NAME"
  else
    pm2 start npm --name "$PM2_APP_NAME" -- start
    pm2 save
  fi
else
  echo "Installez PM2 ou définissez DEPLOY_RESTART_CMD (ex: systemctl restart yogaops)" >&2
  exit 1
fi
