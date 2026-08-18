#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

fail() {
  echo "Production database backup failed: $*" >&2
  exit 1
}

require_env() {
  local name="$1"

  if [ -z "${!name:-}" ]; then
    fail "$name is required."
  fi
}

require_command() {
  local name="$1"

  if ! command -v "$name" >/dev/null 2>&1; then
    fail "$name is required on the runner."
  fi
}

require_env BACKUP_DATABASE_URL
require_env BACKUP_GPG_PUBLIC_KEY
require_env BACKUP_GPG_RECIPIENT_FINGERPRINT
require_env BACKUP_OUTPUT_DIR
require_env POSTGRES_MAJOR
require_env TARGET_VERSION

for command_name in awk date docker gpg gpgconf openssl sha256sum tr; do
  require_command "$command_name"
done

if ! [[ "$TARGET_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  fail "TARGET_VERSION must use strict vX.Y.Z format."
fi

if ! [[ "$POSTGRES_MAJOR" =~ ^[0-9]+$ ]] || [ "$POSTGRES_MAJOR" -lt 14 ]; then
  fail "POSTGRES_MAJOR must be a supported numeric major version."
fi

case "$BACKUP_DATABASE_URL" in
  postgres://* | postgresql://*) ;;
  *) fail "BACKUP_DATABASE_URL must be a PostgreSQL connection URL." ;;
esac

case "$BACKUP_DATABASE_URL" in
  *-pooler.*) fail "BACKUP_DATABASE_URL must use a direct/unpooled Neon endpoint." ;;
esac

expected_fingerprint="$(
  printf '%s' "$BACKUP_GPG_RECIPIENT_FINGERPRINT" |
    tr -d '[:space:]' |
    tr '[:lower:]' '[:upper:]'
)"

if ! [[ "$expected_fingerprint" =~ ^[0-9A-F]{40}$ ]]; then
  fail "BACKUP_GPG_RECIPIENT_FINGERPRINT must be a 40-character primary key fingerprint."
fi

timestamp="${BACKUP_TIMESTAMP_UTC:-$(date -u +%Y%m%dT%H%M%SZ)}"

if ! [[ "$timestamp" =~ ^[0-9]{8}T[0-9]{6}Z$ ]]; then
  fail "BACKUP_TIMESTAMP_UTC must use YYYYMMDDTHHMMSSZ format when provided."
fi

mkdir -p "$BACKUP_OUTPUT_DIR"

work_parent="${RUNNER_TEMP:-/tmp}"
work_dir="$(mktemp -d "${work_parent%/}/home-fund-production-backup.XXXXXX")"
# Keep GNUPGHOME short enough for Unix-domain socket limits on every runner OS.
gnupg_home="$(mktemp -d /tmp/home-fund-gpg.XXXXXX)"
plain_dump="$work_dir/production.dump"
public_key_file="$work_dir/backup-public-key.asc"
docker_network="home-fund-backup-${GITHUB_RUN_ID:-local}-$$"
rehearsal_container="home-fund-backup-db-${GITHUB_RUN_ID:-local}-$$"
rehearsal_database="home_fund_restore_rehearsal"
network_created=0
container_created=0

cleanup() {
  if [ "$container_created" -eq 1 ]; then
    docker rm --force "$rehearsal_container" >/dev/null 2>&1 || true
  fi

  if [ "$network_created" -eq 1 ]; then
    docker network rm "$docker_network" >/dev/null 2>&1 || true
  fi

  if [ -n "${gnupg_home:-}" ] && [ -d "$gnupg_home" ]; then
    GNUPGHOME="$gnupg_home" gpgconf --kill gpg-agent >/dev/null 2>&1 || true
    rm -rf -- "$gnupg_home"
  fi

  if [ -n "${work_dir:-}" ] && [ -d "$work_dir" ]; then
    rm -rf -- "$work_dir"
  fi
}

trap cleanup EXIT HUP INT TERM

printf '%s\n' "$BACKUP_GPG_PUBLIC_KEY" >"$public_key_file"

imported_fingerprint="$(
  GNUPGHOME="$gnupg_home" gpg \
    --batch \
    --with-colons \
    --import-options show-only \
    --import "$public_key_file" 2>/dev/null |
    awk -F: '$1 == "fpr" && !found { print toupper($10); found = 1 }'
)"

if [ "$imported_fingerprint" != "$expected_fingerprint" ]; then
  fail "The imported GPG public key does not match BACKUP_GPG_RECIPIENT_FINGERPRINT."
fi

GNUPGHOME="$gnupg_home" gpg --batch --import "$public_key_file" >/dev/null 2>&1

postgres_image="postgres:${POSTGRES_MAJOR}-alpine"
docker pull "$postgres_image" >/dev/null

server_version_num="$(
  docker run --rm \
    --env "PGDATABASE=$BACKUP_DATABASE_URL" \
    "$postgres_image" \
    psql \
    --no-psqlrc \
    --no-password \
    --tuples-only \
    --no-align \
    --set ON_ERROR_STOP=1 \
    --command 'SHOW server_version_num;' |
    tr -d '[:space:]'
)"

if ! [[ "$server_version_num" =~ ^[0-9]+$ ]]; then
  fail "Could not determine the production PostgreSQL server version."
fi

server_major=$((server_version_num / 10000))

if [ "$server_major" -ne "$POSTGRES_MAJOR" ]; then
  fail "Configured PostgreSQL major $POSTGRES_MAJOR does not match production major $server_major."
fi

echo "Creating a custom-format production backup with PostgreSQL $POSTGRES_MAJOR."
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --env "PGDATABASE=$BACKUP_DATABASE_URL" \
  --volume "$work_dir:/backup" \
  "$postgres_image" \
  pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --file=/backup/production.dump

test -s "$plain_dump" || fail "pg_dump produced an empty file."

restore_comparison_sql='SELECT concat_ws('"'"'|'"'"', (SELECT count(*)::text FROM "Household"), (SELECT count(*)::text FROM "Member"), (SELECT count(*)::text FROM "Category"), (SELECT count(*)::text FROM "LedgerRecord"), (SELECT count(*)::text FROM "RecurringRule"), (SELECT count(*)::text FROM "RecurringOccurrence"), (SELECT count(*)::text FROM "ReimbursementPayment"), (SELECT count(*)::text FROM "_prisma_migrations"), (SELECT coalesce(max("updatedAt")::text, '"'"''"'"') FROM "Household"), (SELECT coalesce(max("updatedAt")::text, '"'"''"'"') FROM "Member"), (SELECT coalesce(max("updatedAt")::text, '"'"''"'"') FROM "LedgerRecord"));'

source_restore_comparison="$(
  docker run --rm \
    --env "PGDATABASE=$BACKUP_DATABASE_URL" \
    "$postgres_image" \
    psql \
    --no-psqlrc \
    --no-password \
    --tuples-only \
    --no-align \
    --set ON_ERROR_STOP=1 \
    --command "$restore_comparison_sql"
)"

rehearsal_password="$(openssl rand -hex 24)"
docker network create "$docker_network" >/dev/null
network_created=1

docker run --detach \
  --name "$rehearsal_container" \
  --network "$docker_network" \
  --env "POSTGRES_DB=$rehearsal_database" \
  --env "POSTGRES_PASSWORD=$rehearsal_password" \
  "$postgres_image" >/dev/null
container_created=1

for _ in $(seq 1 30); do
  if docker exec "$rehearsal_container" \
    pg_isready --username postgres --dbname "$rehearsal_database" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec "$rehearsal_container" \
  pg_isready --username postgres --dbname "$rehearsal_database" >/dev/null 2>&1; then
  fail "The restore rehearsal PostgreSQL container did not become ready."
fi

echo "Restoring the backup into an isolated PostgreSQL $POSTGRES_MAJOR rehearsal database."
docker run --rm \
  --network "$docker_network" \
  --env "PGPASSWORD=$rehearsal_password" \
  --volume "$work_dir:/backup:ro" \
  "$postgres_image" \
  pg_restore \
  --exit-on-error \
  --no-owner \
  --no-acl \
  --host "$rehearsal_container" \
  --username postgres \
  --dbname "$rehearsal_database" \
  /backup/production.dump

validation_sql=$(cat <<'SQL'
DO $validation$
DECLARE
  required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    '_prisma_migrations',
    'Household',
    'Member',
    'Category',
    'LedgerRecord',
    'RecurringRule',
    'RecurringOccurrence',
    'ReimbursementPayment'
  ]
  LOOP
    IF to_regclass(format('public.%I', required_table)) IS NULL THEN
      RAISE EXCEPTION 'required table % is missing', required_table;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL
      AND rolled_back_at IS NULL
  ) THEN
    RAISE EXCEPTION 'the restored database contains an unfinished Prisma migration';
  END IF;
END
$validation$;
SQL
)

printf '%s\n' "$validation_sql" |
  docker run --rm --interactive \
    --network "$docker_network" \
    --env "PGPASSWORD=$rehearsal_password" \
    "$postgres_image" \
    psql \
    --no-psqlrc \
    --no-password \
    --host "$rehearsal_container" \
    --username postgres \
    --dbname "$rehearsal_database" \
    --set ON_ERROR_STOP=1 \
    --file - >/dev/null

restored_restore_comparison="$(
  docker run --rm \
    --network "$docker_network" \
    --env "PGPASSWORD=$rehearsal_password" \
    "$postgres_image" \
    psql \
    --no-psqlrc \
    --no-password \
    --host "$rehearsal_container" \
    --username postgres \
    --dbname "$rehearsal_database" \
    --tuples-only \
    --no-align \
    --set ON_ERROR_STOP=1 \
    --command "$restore_comparison_sql"
)"

if [ "$source_restore_comparison" != "$restored_restore_comparison" ]; then
  fail "Core table counts or selected updatedAt high-water timestamps changed during backup or did not restore exactly."
fi

backup_id="home-fund-production-pre-${TARGET_VERSION}-${timestamp}"
encrypted_file="$BACKUP_OUTPUT_DIR/${backup_id}.dump.gpg"
checksum_file="${encrypted_file}.sha256"
metadata_file="$BACKUP_OUTPUT_DIR/${backup_id}.metadata.json"

echo "Encrypting the verified backup for the configured GPG recipient."
GNUPGHOME="$gnupg_home" gpg \
  --batch \
  --yes \
  --trust-model always \
  --recipient "$expected_fingerprint" \
  --output "$encrypted_file" \
  --encrypt "$plain_dump"

test -s "$encrypted_file" || fail "GPG produced an empty encrypted backup."

(
  cd "$BACKUP_OUTPUT_DIR"
  sha256sum "$(basename "$encrypted_file")" >"$(basename "$checksum_file")"
)

source_commit="${SOURCE_COMMIT:-unknown}"
encrypted_sha256="$(awk '{print $1}' "$checksum_file")"

cat >"$metadata_file" <<EOF
{
  "backupId": "$backup_id",
  "targetVersion": "$TARGET_VERSION",
  "sourceCommit": "$source_commit",
  "createdAtUtc": "$timestamp",
  "postgresMajor": $POSTGRES_MAJOR,
  "gpgRecipientFingerprint": "$expected_fingerprint",
  "encryptedSha256": "$encrypted_sha256",
  "restoreRehearsal": "passed",
  "restoreComparison": {
    "status": "matched",
    "scope": "core table counts and selected updatedAt high-water timestamps"
  }
}
EOF

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "backup_id=$backup_id"
    echo "encrypted_file=$encrypted_file"
    echo "checksum_file=$checksum_file"
    echo "metadata_file=$metadata_file"
    echo "encrypted_sha256=$encrypted_sha256"
  } >>"$GITHUB_OUTPUT"
fi

echo "Backup $backup_id passed restore rehearsal and encryption checks."
