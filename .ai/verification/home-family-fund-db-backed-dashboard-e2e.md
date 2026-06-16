---
id: ver-home-family-fund-db-backed-dashboard-e2e
stage: verification
status: approved
delivery_profile: mvp
release_target: local_dev
inputs:
  - impl-home-family-fund-db-backed-dashboard-e2e
outputs:
  - test_results
  - quality_gate_results
trace_links:
  acceptance_criteria:
    - DB reset and migration
    - deterministic seed
    - auth fixture without dashboard fixture
    - Prisma-backed dashboard read
    - fixture smoke remains separate
reviewed_at:
---

# Verification for DB-backed Dashboard E2E

## Commands Run
| Command | Result | Notes |
|---|---|---|
| `corepack pnpm db:generate` | Pass | Re-generated Prisma client sequentially after an initial parallel generate collision. |
| `corepack pnpm test` | Pass | 24 test files, 103 tests. |
| `corepack pnpm type-check` | Pass | `tsc --noEmit` passes after Prisma client generation. |
| `corepack pnpm lint` | Pass | `eslint .` passes after Prisma client generation. |
| `corepack pnpm test:e2e` | Pass | 8 Playwright tests across desktop Chromium and Pixel 7 fixture smoke projects. |
| `sh -n e2e-db/setup-db.sh` | Pass | Shell syntax is valid. |
| `corepack pnpm test:e2e:db` | Pass | Recreated `home_fund_e2e`, applied migrations `0001_init` and `0002_add_ledger_record_name`, seeded deterministic data, and passed 2 Playwright tests. |

## Verified Behavior
- Existing fixture smoke E2E remains independent of the database.
- Homepage dashboard fixture data now requires `x-e2e-dashboard-fixture: 1`.
- E2E auth can still be resolved with `x-e2e-current-member-email`.
- The DB-backed E2E spec is scoped to deterministic seed records for `2026-06`.
- The DB setup script targets `home_fund_e2e` and requires Docker before resetting that database.

## Residual Risk
- Existing full build was not rerun in this cycle; quality gates run were unit/integration, type-check, lint, fixture E2E, DB-backed E2E, and shell syntax.
- This verification supports `local_dev` only. It does not prove production OAuth, production deployment, or real reimbursement/recurring mutation flows.

## Architecture and Domain Alignment
- ADR-1 satisfied: DB-backed E2E uses explicit `home_fund_e2e` setup and does not reset normal `home_fund`.
- ADR-2 satisfied: auth remains a non-production fixture, while dashboard data comes from Prisma-backed seed rows.
- ADR-3 satisfied: fixture smoke tests remain under `test:e2e`; DB-backed coverage runs under `test:e2e:db`.
- ADR-4 satisfied: deterministic seed data drives report, reimbursement, and pending recurring assertions.
- Domain rules covered: reports derive from persisted ledger records; fund-paid expenses are excluded from reimbursement rows; member-paid refundable expenses are grouped by payer; pending recurring items render separately.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm DB-backed coverage remains local-dev only and is not presented as real OAuth/session coverage.
  - Confirm destructive reset remains scoped to `home_fund_e2e`.
- must_check:
  - `corepack pnpm test:e2e:db` continues to pass with Docker Desktop running.
  - Later stories keep using DB-backed coverage instead of extending fixture-only confidence.
- acceptance_signals:
  - Static checks, unit/integration tests, fixture E2E, and DB-backed E2E are green.
- unresolved_blockers:
  - None for this story.
- next_step:
  - Continue to the next MVP hardening story.
