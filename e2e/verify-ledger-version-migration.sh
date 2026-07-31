#!/bin/sh
set -eu

contract_database="home_fund_ledger_version_contract"
contract_database_url="postgresql://postgres:postgres@127.0.0.1:5432/${contract_database}"
repo_root=$(pwd)
temp_dir=$(mktemp -d)
temp_migrations_dir="${temp_dir}/migrations"
temp_config="${temp_dir}/prisma.config.ts"
new_migration="20260728110000_add_ledger_record_version"

cleanup() {
  docker compose exec -T postgres psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${contract_database}' AND pid <> pg_backend_pid();" \
    >/dev/null 2>&1 || true
  docker compose exec -T postgres dropdb -U postgres --if-exists "${contract_database}" \
    >/dev/null 2>&1 || true
  rm -rf "${temp_dir}"
}

trap cleanup EXIT HUP INT TERM

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker Desktop, then run: docker compose up -d" >&2
  exit 1
fi

if ! docker compose ps postgres >/dev/null 2>&1; then
  echo "Docker Compose postgres service is not available. Run: docker compose up -d" >&2
  exit 1
fi

mkdir -p "${temp_migrations_dir}"
cp "${repo_root}/prisma/schema.prisma" "${temp_dir}/schema.prisma"

for migration in "${repo_root}"/prisma/migrations/*; do
  migration_name=$(basename "${migration}")

  if [ "${migration_name}" \< "${new_migration}" ]; then
    cp -R "${migration}" "${temp_migrations_dir}/${migration_name}"
  fi
done

cat > "${temp_config}" <<EOF
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "${temp_dir}/schema.prisma",
  migrations: {
    path: "${temp_migrations_dir}",
  },
  datasource: {
    url: "${contract_database_url}",
  },
});
EOF

docker compose exec -T postgres dropdb -U postgres --if-exists "${contract_database}"
docker compose exec -T postgres createdb -U postgres "${contract_database}"

corepack pnpm exec prisma migrate deploy --config "${temp_config}"

docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"Household\" (\"id\", \"name\", \"updatedAt\") VALUES ('legacy-household', 'Legacy household', CURRENT_TIMESTAMP);"
docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"Member\" (\"id\", \"householdId\", \"displayName\", \"status\", \"updatedAt\") VALUES ('legacy-member', 'legacy-household', 'Legacy member', 'active', CURRENT_TIMESTAMP);"
docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"Category\" (\"id\", \"householdId\", \"type\", \"name\", \"updatedAt\") VALUES ('legacy-category', 'legacy-household', 'expense', 'Legacy category', CURRENT_TIMESTAMP);"
docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"LedgerRecord\" (\"id\", \"householdId\", \"type\", \"name\", \"amountCents\", \"occurredOn\", \"categoryId\", \"createdByMemberId\", \"paymentSource\", \"reimbursementStatus\", \"status\", \"updatedAt\") VALUES ('legacy-record', 'legacy-household', 'expense', 'Legacy expense', 3200, DATE '2026-07-01', 'legacy-category', 'legacy-member', 'fund', 'not_refundable', 'active', CURRENT_TIMESTAMP);"

cp -R "${repo_root}/prisma/migrations/${new_migration}" "${temp_migrations_dir}/${new_migration}"
corepack pnpm exec prisma migrate deploy --config "${temp_config}"

legacy_version=$(docker compose exec -T postgres psql -U postgres -d "${contract_database}" -At -v ON_ERROR_STOP=1 \
  -c "SELECT \"version\" FROM \"LedgerRecord\" WHERE \"id\" = 'legacy-record';")
[ "${legacy_version}" = "1" ]

version_contract=$(docker compose exec -T postgres psql -U postgres -d "${contract_database}" -At -v ON_ERROR_STOP=1 \
  -c "SELECT CASE WHEN is_nullable = 'NO' AND column_default = '1' THEN 'ok' ELSE 'failed' END FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'LedgerRecord' AND column_name = 'version';")
[ "${version_contract}" = "ok" ]

if docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"LedgerRecord\" (\"id\", \"householdId\", \"type\", \"name\", \"amountCents\", \"occurredOn\", \"categoryId\", \"createdByMemberId\", \"paymentSource\", \"reimbursementStatus\", \"status\", \"version\", \"updatedAt\") VALUES ('invalid-version-record', 'legacy-household', 'expense', 'Invalid version', 100, DATE '2026-07-01', 'legacy-category', 'legacy-member', 'fund', 'not_refundable', 'active', 0, CURRENT_TIMESTAMP);" \
  >/dev/null 2>&1; then
  echo "LedgerRecord accepted a non-positive version" >&2
  exit 1
fi

docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"LedgerRecord\" (\"id\", \"householdId\", \"type\", \"name\", \"amountCents\", \"occurredOn\", \"categoryId\", \"createdByMemberId\", \"paymentSource\", \"reimbursementStatus\", \"status\", \"updatedAt\") VALUES ('old-app-record', 'legacy-household', 'expense', 'Old app expense', 1800, DATE '2026-07-02', 'legacy-category', 'legacy-member', 'fund', 'not_refundable', 'active', CURRENT_TIMESTAMP);"
# Migration-first rollout 期間的舊版 app 不知道 version；C2.2 必須等待所有寫入 instance 升級後才啟用版本條件寫入。
docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "UPDATE \"LedgerRecord\" SET \"name\" = 'Legacy expense corrected', \"updatedAt\" = CURRENT_TIMESTAMP WHERE \"id\" = 'legacy-record';"

old_app_versions=$(docker compose exec -T postgres psql -U postgres -d "${contract_database}" -At -v ON_ERROR_STOP=1 \
  -c "SELECT string_agg(\"id\" || ':' || \"version\", ',' ORDER BY \"id\") FROM \"LedgerRecord\" WHERE \"id\" IN ('legacy-record', 'old-app-record');")
[ "${old_app_versions}" = "legacy-record:1,old-app-record:1" ]
