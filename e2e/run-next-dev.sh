#!/bin/sh
set -eu

e2e_port="${E2E_PORT:-3100}"

export NEXT_DIST_DIR=".next-e2e"

corepack pnpm db:generate
corepack pnpm exec next dev -p "$e2e_port"
