#!/bin/sh
# Deploy the UI to Vercel, under the personal scope.
#
# Vercel hosts the React build only. The interview API needs a disk and a process that lives for the
# length of a conversation, so it runs on Fly (see deploy.sh). Point this build at it:
#
#   vercel env add VITE_INTERVIEW_API production   # https://ux-interview.fly.dev
#
# and allow the Vercel origin on the API side:
#
#   fly secrets set KIT_ALLOW_ORIGIN=https://<project>.vercel.app -a ux-interview
set -e

SCOPE="${VERCEL_SCOPE:-thuy-phams-projects-1a27648b}"

if ! vercel whoami >/dev/null 2>&1; then
  echo "vercel is not logged in. Run: vercel login" >&2
  exit 1
fi

cd "$(dirname "$0")"
vercel deploy --prod --yes --scope "$SCOPE" "$@"
