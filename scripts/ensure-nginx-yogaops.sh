#!/usr/bin/env bash
# Corrige proxy_pass nginx pour yogaops.fr -> 127.0.0.1:3000
set -euo pipefail

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
    sudo -n "$@" 2>/dev/null || sudo "$@"
  else
    echo "::error::sudo requis pour configurer nginx"
    exit 1
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

_yogaops_files=()
while IFS= read -r _f; do
  _yogaops_files+=("$_f")
done < <(run_sudo grep -rl "yogaops\.fr" /etc/nginx/ 2>/dev/null || true)

if ((${#_yogaops_files[@]})); then
  for _f in "${_yogaops_files[@]}"; do
    fix_proxy_in_file "$_f"
  done
else
  echo "Aucune config yogaops.fr — installation du modele $DEST"
  if [ ! -f "$SRC" ]; then
    echo "::error::Fichier modele introuvable: $SRC"
    exit 1
  fi
  run_sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  run_sudo cp "$SRC" "$DEST"
  run_sudo ln -sf "$DEST" "$ENABLED"
  if [ -f /etc/nginx/sites-enabled/default ]; then
    run_sudo rm -f /etc/nginx/sites-enabled/default
  fi
fi

run_sudo nginx -t
run_sudo systemctl reload nginx || run_sudo service nginx reload
echo "=== nginx recharge ==="
