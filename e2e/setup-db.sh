#!/bin/sh
set -eu

e2e_db_name="${E2E_DB_NAME:-home_fund_e2e}"
e2e_database_url="${E2E_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e}"
seed_email="${SEED_GOOGLE_ACCOUNT_EMAIL:-e2e-finance@example.com}"

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker Desktop, then run: docker compose up -d" >&2
  exit 1
fi

if ! docker compose ps postgres >/dev/null 2>&1; then
  echo "Docker Compose postgres service is not available. Run: docker compose up -d" >&2
  exit 1
fi

if ! docker compose exec -T postgres pg_isready -U postgres -d home_fund >/dev/null 2>&1; then
  echo "Local Postgres is not ready. Run: docker compose up -d" >&2
  exit 1
fi

docker compose exec -T postgres psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$e2e_db_name' AND pid <> pg_backend_pid();" \
  >/dev/null
docker compose exec -T postgres dropdb -U postgres --if-exists "$e2e_db_name"
docker compose exec -T postgres createdb -U postgres "$e2e_db_name"

DATABASE_URL="$e2e_database_url" corepack pnpm db:deploy
DATABASE_URL="$e2e_database_url" SEED_GOOGLE_ACCOUNT_EMAIL="$seed_email" corepack pnpm db:seed
