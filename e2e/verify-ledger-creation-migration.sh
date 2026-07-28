#!/bin/sh
set -eu

contract_database="home_fund_migration_contract"
contract_database_url="postgresql://postgres:postgres@127.0.0.1:5432/${contract_database}"
repo_root=$(pwd)
temp_dir=$(mktemp -d)
temp_migrations_dir="${temp_dir}/migrations"
temp_config="${temp_dir}/prisma.config.ts"
new_migration="20260717141601_deepen_ledger_record_creation"

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
  -c "INSERT INTO \"Member\" (\"id\", \"householdId\", \"displayName\", \"updatedAt\") VALUES ('legacy-member', 'legacy-household', 'Legacy member', CURRENT_TIMESTAMP);"
docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"LedgerImportBatch\" (\"id\", \"householdId\", \"fileName\", \"fileFingerprint\", \"status\", \"failedRowCount\", \"importedRowCount\", \"skippedRowCount\", \"createdByMemberId\") VALUES ('legacy-batch', 'legacy-household', 'legacy.csv', 'legacy-fingerprint', 'imported', 0, 1, 0, 'legacy-member');"
docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"LedgerImportRow\" (\"id\", \"batchId\", \"csvRowNumber\", \"rowFingerprint\", \"status\") VALUES ('legacy-row', 'legacy-batch', 1, 'legacy-row-fingerprint', 'imported');"

cp -R "${repo_root}/prisma/migrations/${new_migration}" "${temp_migrations_dir}/${new_migration}"
corepack pnpm exec prisma migrate deploy --config "${temp_config}"

legacy_values=$(docker compose exec -T postgres psql -U postgres -d "${contract_database}" -At -v ON_ERROR_STOP=1 \
  -c "SELECT batch.\"batchIdentity\" || '|' || row.\"rowIdentity\" || '|' || COALESCE(row.\"failureReason\", '') FROM \"LedgerImportBatch\" batch INNER JOIN \"LedgerImportRow\" row ON row.\"batchId\" = batch.\"id\" WHERE batch.\"id\" = 'legacy-batch' AND row.\"id\" = 'legacy-row';")
[ "${legacy_values}" = "legacy-batch:legacy-batch|legacy-row:legacy-row|" ]

docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"LedgerImportBatch\" (\"id\", \"householdId\", \"fileName\", \"fileFingerprint\", \"status\", \"failedRowCount\", \"importedRowCount\", \"skippedRowCount\", \"createdByMemberId\") VALUES ('old-app-batch', 'legacy-household', 'old-app.csv', 'old-app-fingerprint', 'imported', 0, 1, 0, 'legacy-member');"
docker compose exec -T postgres psql -U postgres -d "${contract_database}" -v ON_ERROR_STOP=1 \
  -c "INSERT INTO \"LedgerImportRow\" (\"id\", \"batchId\", \"csvRowNumber\", \"rowFingerprint\", \"status\") VALUES ('old-app-row', 'old-app-batch', 1, 'old-app-row-fingerprint', 'imported');"

batch_identity_check=$(docker compose exec -T postgres psql -U postgres -d "${contract_database}" -At -v ON_ERROR_STOP=1 \
  -c "SELECT CASE WHEN COUNT(*) = 2 AND COUNT(\"batchIdentity\") = 2 AND COUNT(DISTINCT \"batchIdentity\") = 2 THEN 'ok' ELSE 'failed' END FROM \"LedgerImportBatch\" WHERE \"id\" IN ('legacy-batch', 'old-app-batch');")
[ "${batch_identity_check}" = "ok" ]

row_identity_check=$(docker compose exec -T postgres psql -U postgres -d "${contract_database}" -At -v ON_ERROR_STOP=1 \
  -c "SELECT CASE WHEN COUNT(*) = 2 AND COUNT(\"rowIdentity\") = 2 AND COUNT(DISTINCT \"rowIdentity\") = 2 THEN 'ok' ELSE 'failed' END FROM \"LedgerImportRow\" WHERE \"id\" IN ('legacy-row', 'old-app-row');")
[ "${row_identity_check}" = "ok" ]
