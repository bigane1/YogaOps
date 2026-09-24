#!/usr/bin/env bash
# Met à jour les clés Stripe dans le .env du VPS, puis redémarre PM2.
# Usage (sur le VPS, dans le dossier de l'app) :
#   bash scripts/update-stripe-env.sh
# ou avec variables :
#   STRIPE_SECRET_KEY='sk_live_...' \
#   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_live_...' \
#   STRIPE_WEBHOOK_SECRET='whsec_...' \
#   bash scripts/update-stripe-env.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "ERREUR: .env introuvable dans $ROOT"
  exit 1
fi

# Nettoyage Windows CRLF
sed -i 's/\r//' .env

set_env() {
  local key="$1"
  local value="$2"
  if [ -z "$value" ]; then
    return 0
  fi
  if grep -qE "^${key}=" .env; then
    # Évite les caractères spéciaux dans sed : remplace la ligne entière
    grep -vE "^${key}=" .env > .env.tmp
    printf '%s=%s\n' "$key" "$value" >> .env.tmp
    mv .env.tmp .env
  else
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
  echo "→ $key mis a jour"
}

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  read -r -p "STRIPE_SECRET_KEY (sk_live_...) : " STRIPE_SECRET_KEY
fi
if [ -z "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" ]; then
  read -r -p "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...) : " NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
fi
if [ -z "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  read -r -p "STRIPE_WEBHOOK_SECRET (whsec_... , Entree pour ignorer) : " STRIPE_WEBHOOK_SECRET || true
fi

set_env "STRIPE_SECRET_KEY" "${STRIPE_SECRET_KEY:-}"
set_env "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}"
set_env "STRIPE_WEBHOOK_SECRET" "${STRIPE_WEBHOOK_SECRET:-}"

echo ""
echo "Verification (prefixes seulement) :"
grep -E '^(STRIPE_SECRET_KEY|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY|STRIPE_WEBHOOK_SECRET)=' .env \
  | sed -E 's/=(.{12}).*/=\1.../'

PM2_APP_NAME="${PM2_APP_NAME:-yogaops}"
run_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    pm2 "$@"
  elif [[ -x ./node_modules/.bin/pm2 ]]; then
    ./node_modules/.bin/pm2 "$@"
  else
    npx --yes pm2 "$@"
  fi
}

echo ""
echo "Redemarrage PM2 ($PM2_APP_NAME)..."
run_pm2 restart "$PM2_APP_NAME" || run_pm2 restart all || true
run_pm2 save || true
echo "OK. Testez un paiement sur https://yogaops.fr/reserver"
