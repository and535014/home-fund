---
id: impl-home-family-fund-db-backed-dashboard-e2e
stage: implementation
status: implemented
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-db-backed-dashboard-e2e
  - arch-home-family-fund-db-backed-dashboard-e2e
  - vd-home-family-fund-db-backed-dashboard-e2e
outputs:
  - tests
  - code_changes
  - docs
trace_links:
  acceptance_criteria:
    - DB reset and migration
    - deterministic seed
    - auth fixture without dashboard fixture
    - Prisma-backed dashboard read
    - fixture smoke remains separate
reviewed_at:
---

# Implementation Log for DB-backed Dashboard E2E

## Delivery Profile
This slice supports `local_dev` under the MVP profile. It adds deterministic DB-backed browser coverage for the home dashboard while keeping the existing narrow fixture smoke E2E fast and database-independent.

## TDD / Implementation Cycles
| Cycle | Test or Check | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | DB-backed dashboard Playwright spec | Added | Created `e2e-db/dashboard.spec.ts` | Verifies June 2026 seeded income, refundable member-paid expenses, reimbursement rows, and pending recurring item. |
| 2 | Separate DB-backed Playwright command | Added | Created `playwright.db.config.ts` and `test:e2e:db` | Starts dev server with explicit `DATABASE_URL` for `home_fund_e2e`. |
| 3 | Deterministic E2E DB setup | Added | Created `e2e-db/setup-db.sh` | Drops/recreates `home_fund_e2e`, runs migrations, and seeds `e2e-finance@example.com`. |
| 4 | Auth fixture separated from dashboard fixture | Passed via existing smoke E2E | Changed homepage fixture switch to `x-e2e-dashboard-fixture: 1`; kept `x-e2e-current-member-email` for auth only | DB E2E can authenticate without bypassing Prisma-backed dashboard reads. |
| 5 | Prisma row boundary type guard | Passed type-check | Added role/capability guards in `current-member-data-source` | Handles generated Prisma relation enum values typed as `unknown` without casting the full client. |

## Coding Summary
- `test:e2e` remains the fixture smoke suite under `e2e/`.
- `test:e2e:db` is the new DB-backed suite under `e2e-db/`.
- `x-e2e-current-member-email` now means only "resolve an E2E current member".
- `x-e2e-dashboard-fixture: 1` explicitly opts into local fixture dashboard data.
- README now documents both E2E modes and the `home_fund_e2e` lifecycle.

## Deviations
- The setup script fails early with an actionable Docker daemon message before attempting Compose or Postgres commands.
- No product UI was changed for this story; the only runtime behavior change is separating fixture dashboard data from the E2E auth fixture header.

## Remaining Risks
- The DB-backed slice covers read-model rendering only; browser creation, permission matrix, reimbursement settlement, and recurring confirmation remain separate hardening stories.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm `x-e2e-dashboard-fixture` is acceptable as the explicit fixture data switch.
  - Confirm DB setup script can destructively reset only `home_fund_e2e`, not the normal `home_fund` dev database.
- must_check:
  - `corepack pnpm test:e2e` remains green without Postgres.
  - `corepack pnpm test:e2e:db` passes after Docker Desktop is running.
- unresolved_blockers:
  - None for this story.
- next_step:
  - Move to the next MVP hardening story.
