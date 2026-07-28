#!/bin/sh
set -eu

tmp_dir="$(mktemp -d)"

if [ -f e2e/.env ]; then
  set -a
  . ./e2e/.env
  set +a
fi

cp next-env.d.ts "$tmp_dir/next-env.d.ts"
cp tsconfig.json "$tmp_dir/tsconfig.json"

restore_next_managed_files() {
  cp "$tmp_dir/next-env.d.ts" next-env.d.ts
  cp "$tmp_dir/tsconfig.json" tsconfig.json
  rm -rf "$tmp_dir"
}

trap restore_next_managed_files EXIT INT TERM

DATABASE_URL="${E2E_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e}" \
RUN_DATABASE_INTEGRATION=1 \
corepack pnpm exec vitest run \
  src/modules/fund-ledger/ledger-record-creation.integration.test.ts

DATABASE_URL="${E2E_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e}" \
RUN_DATABASE_INTEGRATION=1 \
corepack pnpm exec vitest run \
  src/modules/reimbursement/reimbursement-command.integration.test.ts

corepack pnpm exec playwright test "$@"
