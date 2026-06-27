#!/usr/bin/env bash
# Sync local .env variables to Vercel project environments.
#
# Prerequisites:
#   npm install          (installs vercel CLI as devDependency)
#   npx vercel login
#   npx vercel link      (link this folder to your Vercel project)
#
# Usage:
#   npm run vercel:env -- https://your-app.vercel.app
#
# The production URL is required so AUTH_URL / NEXTAUTH_URL are not set to localhost.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
PRODUCTION_URL="${1:-}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found."
  exit 1
fi

if [[ -z "$PRODUCTION_URL" ]]; then
  echo "Error: Production URL required."
  echo "Usage: npm run vercel:env -- https://your-app.vercel.app"
  exit 1
fi

if ! command -v vercel &>/dev/null && ! npx vercel --version &>/dev/null 2>&1; then
  echo "Error: Vercel CLI not found. Run: npm install"
  exit 1
fi

VERCEL_CMD="npx vercel"

# shellcheck disable=SC1090
load_env_file() {
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      if [[ "$value" =~ ^\"(.*)\"$ ]]; then
        value="${BASH_REMATCH[1]}"
      elif [[ "$value" =~ ^\'(.*)\'$ ]]; then
        value="${BASH_REMATCH[1]}"
      fi
      export "$key=$value"
    fi
  done < "$ENV_FILE"
}

load_env_file

set_env_var() {
  local name="$1"
  local value="$2"
  local target="$3"

  if [[ -z "$value" ]]; then
    echo "  skip $name ($target) — empty"
    return
  fi

  echo "  set $name ($target)"
  printf '%s' "$value" | $VERCEL_CMD env add "$name" "$target" --force --yes 2>/dev/null \
    || printf '%s' "$value" | $VERCEL_CMD env add "$name" "$target" --force
}

VARS=(
  DATABASE_URL
  AUTH_SECRET
  OPENAI_API_KEY
  R2_ENDPOINT
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET_NAME
)

ENVIRONMENTS=(production preview development)

echo "Syncing environment variables to Vercel..."
echo "Production URL: $PRODUCTION_URL"
echo ""

for target in "${ENVIRONMENTS[@]}"; do
  echo "==> $target"
  for var in "${VARS[@]}"; do
    set_env_var "$var" "${!var:-}" "$target"
  done

  if [[ -n "${R2_PUBLIC_URL:-}" ]]; then
    set_env_var "R2_PUBLIC_URL" "$R2_PUBLIC_URL" "$target"
  fi

  set_env_var "AUTH_TRUST_HOST" "true" "$target"

  if [[ "$target" == "production" ]]; then
    set_env_var "AUTH_URL" "$PRODUCTION_URL" "$target"
    set_env_var "NEXTAUTH_URL" "$PRODUCTION_URL" "$target"
  else
    # Preview/dev deployments on Vercel use dynamic URLs; trustHost handles the host.
    set_env_var "AUTH_URL" "$PRODUCTION_URL" "$target"
    set_env_var "NEXTAUTH_URL" "$PRODUCTION_URL" "$target"
  fi

  echo ""
done

echo "Done. Redeploy your Vercel project for changes to take effect."
echo "Dashboard: https://vercel.com/dashboard → Project → Settings → Environment Variables"
