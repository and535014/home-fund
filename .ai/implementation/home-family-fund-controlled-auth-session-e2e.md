---
id: impl-home-family-fund-controlled-auth-session-e2e
stage: implementation
status: implemented
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-controlled-auth-session-e2e
  - arch-home-family-fund-controlled-auth-session-e2e
  - vd-home-family-fund-controlled-auth-session-e2e
outputs:
  - tests
  - code_changes
  - docs
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC3
    - AC4
    - AC5
    - AC6
    - AC7
    - AC8
    - AC9
    - AC10
  bdd_scenarios:
    - Linked active Google user sees household dashboard
    - Unlinked Google user is blocked
    - Inactive linked member is blocked
    - Production ignores controlled auth headers
  test_plan_items:
    - Unit controlled auth header parsing is production-disabled
    - Integration controlled session user goes through current-member data source
    - Contract fixed fixture header remains separate
    - E2E browser access states
    - Quality Gate existing checks remain green
reviewed_at:
---

# Implementation Log for Controlled Auth Session E2E

## Delivery Profile
This implementation supports `local_dev` under the MVP profile. It adds deterministic controlled current-member coverage without external Google OAuth and without claiming Better Auth cookie/session serialization coverage.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `server-current-member.test.ts` controlled header contract | Pass | Added `x-e2e-auth-user-id` support that creates only a session user and still uses the Prisma current-member data source | Verifies `createAuth` is not called for controlled local E2E, but `getPrismaClient` and account/member lookup are used. |
| 2 | Production-disabled contract test | Pass | Controlled auth header is ignored when `NODE_ENV=production` | Preserves the production safety boundary from ADR-4. |
| 3 | DB-backed controlled auth Playwright spec | Pass | Added `e2e-db/auth-session.spec.ts` | Covers unauthenticated, linked active, unlinked, and disabled-member browser states. |
| 4 | Controlled seed data | Pass | Added deterministic `User`, `Account`, and disabled `Member` rows to `prisma/seed.sql` | Reuses `home_fund_e2e` setup and Better Auth-compatible tables. |
| 5 | DB dashboard E2E auth path | Pass | Updated `e2e-db/dashboard.spec.ts` to use `x-e2e-auth-user-id` instead of the fixed member fixture header | Keeps fixture smoke under `e2e/` and DB-backed coverage under controlled current-member mapping. |

## Coding Summary
- Added production-disabled controlled auth support in `src/auth/server-current-member.ts`.
- Expanded `src/auth/server-current-member.test.ts` for development controlled auth and production ignore behavior.
- Seeded deterministic Better Auth-compatible users/accounts in `prisma/seed.sql`.
- Added disabled E2E member state for inactive account coverage.
- Added `e2e-db/auth-session.spec.ts` for access-state browser coverage.
- Updated DB-backed dashboard E2E to use `x-e2e-auth-user-id: user-e2e-linked`.
- Updated README wording to describe controlled auth/member mapping rather than real OAuth.

## Refactor Summary
- Kept the legacy `x-e2e-current-member-email` fixed-member shortcut for fixture smoke tests.
- Did not change homepage UI states or Better Auth production configuration.
- Did not add real Google OAuth automation.

## Deviations
- No scope deviations. The implementation follows the controlled auth header, seeded `User`/`Account`, production-disabled safety, and DB-backed E2E plan from verification design.

## Remaining Risks
- This story still does not prove Better Auth cookie format, Google callback behavior, or production deployment OAuth configuration.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm the controlled auth header returns only session identity and does not bypass account/member mapping.
  - Confirm seeded `User`/`Account` rows are acceptable in local seed data.
  - Confirm DB-backed E2E passes once Docker is reachable.
- must_check:
  - `corepack pnpm test:e2e:db` passes before commit.
  - Controlled auth E2E must not use `x-e2e-current-member-email`.
  - Production must ignore controlled auth headers.
- acceptance_signals:
  - Unit, type-check, lint, fixture E2E are green.
  - DB-backed controlled auth E2E is green in an environment with Docker daemon.
- unresolved_blockers:
  - None for this story.
- next_step:
  - verification-runner
