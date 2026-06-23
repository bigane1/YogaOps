#!/usr/bin/env bash
# Corrige proxy_pass nginx pour yogaops.fr -> 127.0.0.1:3000
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_NAME="yogaops"
SRC="$ROOT/scripts/nginx-yogaops-site.conf"
DEST="/etc/nginx/sites-available/$SITE_NAME"
ENABLED="/etc/nginx/sites-enabled/$SITE_NAME"

if ! command -v nginx >/dev/null 2>&1; then
  echo "nginx absent — rien a configurer"
  exit 0
fi

run_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    if sudo -n true 2>/dev/null; then
      sudo -n "$@"
    else
      echo "⚠ sudo interactif requis pour: $*"
      sudo "$@"
    fi
  else
    echo "⚠ sudo absent — impossible de modifier nginx automatiquement"
    return 1
  fi
}

fix_proxy_in_file() {
  local f="$1"
  if run_sudo grep -q "proxy_pass" "$f"; then
    run_sudo sed -i -E \
      -e 's/proxy_pass[[:space:]]+http:\/\/(127\.0\.0\.1|localhost):[0-9]+[[:space:]]*;/proxy_pass http://127.0.0.1:3000;/g' \
      -e 's/proxy_pass[[:space:]]+http:\/\/yogaops[^;]*;/proxy_pass http://127.0.0.1:3000;/g' \
      "$f"
    echo "→ proxy_pass corrige dans $f"
  fi
}

echo "=== Diagnostic / correction nginx YogaOps ==="
run_sudo grep -r "proxy_pass" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null || true

_yogaops_files=()
while IFS= read -r _f; do
  _yogaops_files+=("$_f")
done < <(run_sudo grep -rl "yogaops\.fr" /etc/nginx/ 2>/dev/null || true)

if ((${#_yogaops_files[@]})); then
  for _f in "${_yogaops_files[@]}"; do
    fix_proxy_in_file "$_f" || true
  done
else
  echo "Aucune config yogaops.fr — installation du modele $DEST"
  if [ ! -f "$SRC" ]; then
    echo "⚠ Fichier modele introuvable: $SRC"
    exit 0
  fi
  run_sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled || exit 0
  run_sudo cp "$SRC" "$DEST" || exit 0
  run_sudo ln -sf "$DEST" "$ENABLED" || exit 0
  if [ -f /etc/nginx/sites-enabled/default ]; then
    run_sudo rm -f /etc/nginx/sites-enabled/default || true
  fi
fi

if run_sudo nginx -t; then
  run_sudo systemctl reload nginx || run_sudo service nginx reload || true
  echo "=== nginx recharge ==="
else
  echo "⚠ nginx -t a echoue — correction manuelle requise (voir ci-dessous)"
  echo "  sudo grep -r proxy_pass /etc/nginx/"
  echo "  # proxy_pass doit pointer vers http://127.0.0.1:3000"
  echo "  sudo nginx -t && sudo systemctl reload nginx"
fi

exit 0
