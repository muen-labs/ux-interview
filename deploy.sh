#!/bin/sh
# Deploy the interview app to Fly.
#
#   ./deploy.sh                 # uses $DEEPSEEK_API_KEY, or the clipboard
#   ./deploy.sh --secrets-only  # rotate the key without redeploying
#
# Prerequisite: fly auth login   (one time, interactive)
set -e

APP=ux-interview
REGION=nrt

if ! fly auth whoami >/dev/null 2>&1; then
  echo "fly is not logged in. Run: fly auth login" >&2
  exit 1
fi

if ! fly apps list 2>/dev/null | awk '{print $1}' | grep -qx "$APP"; then
  echo "creating app $APP"
  fly apps create "$APP"
fi

if ! fly volumes list -a "$APP" 2>/dev/null | awk '{print $1}' | grep -qx "data"; then
  echo "creating volume data (1GB, $REGION)"
  fly volumes create data --size 1 --region "$REGION" -a "$APP" -y
fi

# Key resolution, narrowest first. The clipboard check refuses anything that is not shaped like a
# key: reading the clipboard is convenient, and it once shipped a session URL to the API as a key.
KEY="${DEEPSEEK_API_KEY:-}"
if [ -z "$KEY" ] && [ -f "$HOME/.kun/claire-ai/.env.local" ]; then
  KEY="$(grep -E '^VITE_DEEPSEEK_KEY=' "$HOME/.kun/claire-ai/.env.local" | head -1 | cut -d= -f2- | tr -d '"')"
fi
if [ -z "$KEY" ] && command -v pbpaste >/dev/null 2>&1; then
  CLIP="$(pbpaste)"
  case "$CLIP" in
    sk-*) KEY="$CLIP" ;;
    *) echo "clipboard does not hold an API key (starts with sk-); ignoring it" >&2 ;;
  esac
fi
if [ -z "$KEY" ]; then
  echo "no key: set DEEPSEEK_API_KEY, or copy the key to the clipboard" >&2
  exit 1
fi
printf '%s' "$KEY" | fly secrets set DEEPSEEK_API_KEY=- -a "$APP"

# The operator token mints sessions on the deployed box. Generated once and printed here —
# it is a secret, so it is never written to the repo.
ADMIN="${KIT_ADMIN_TOKEN:-$(openssl rand -hex 24)}"
printf '%s' "$ADMIN" | fly secrets set KIT_ADMIN_TOKEN=- -a "$APP"
echo "admin token (save it, shown once): $ADMIN"

if [ "${1:-}" = "--secrets-only" ]; then
  echo "secret updated; no deploy"
  exit 0
fi

fly deploy -a "$APP" --ha=false
echo
echo "health:  curl https://$APP.fly.dev/healthz"
echo "new session:"
echo "  python src/web.py --new chie-2026-11-25   # prints a URL path; swap the host for https://$APP.fly.dev"
