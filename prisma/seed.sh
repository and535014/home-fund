#!/bin/sh
set -eu

input_database_url="${DATABASE_URL:-}"
input_seed_google_account_email="${SEED_GOOGLE_ACCOUNT_EMAIL:-}"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

if [ -n "$input_database_url" ]; then
  DATABASE_URL="$input_database_url"
  export DATABASE_URL
fi

if [ -n "$input_seed_google_account_email" ]; then
  SEED_GOOGLE_ACCOUNT_EMAIL="$input_seed_google_account_email"
  export SEED_GOOGLE_ACCOUNT_EMAIL
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required for db:seed" >&2
  exit 1
fi

if [ -z "${SEED_GOOGLE_ACCOUNT_EMAIL:-}" ]; then
  echo "SEED_GOOGLE_ACCOUNT_EMAIL is required for db:seed" >&2
  exit 1
fi

seed_email=$(printf "%s" "$SEED_GOOGLE_ACCOUNT_EMAIL" | sed "s/'/''/g")

tmp_file=$(mktemp)

cleanup() {
  rm -f "$tmp_file"
}

trap cleanup EXIT

sed \
  -e "s/__SEED_GOOGLE_ACCOUNT_EMAIL__/$seed_email/g" \
  prisma/seed.sql > "$tmp_file"
prisma db execute --file "$tmp_file"
