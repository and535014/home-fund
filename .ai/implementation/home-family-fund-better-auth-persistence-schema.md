---
id: impl-home-family-fund-better-auth-persistence-schema
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - arch-home-family-fund
  - impl-home-family-fund-prisma-schema-foundation
  - impl-home-family-fund-google-auth-route
outputs:
  - tests
  - prisma_schema
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC20
  architecture_decisions:
    - ADR-10
    - ADR-12
  test_plan_items:
    - Manual Google OAuth local setup
    - Contract auth/session boundary
    - Quality gate static checks
reviewed_at:
---

# Implementation Log for Better Auth Persistence Schema

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds Better Auth persistence models to the Prisma schema and introduces a small Prisma adapter factory for future runtime wiring. It does not yet generate a Prisma client, create migrations, connect to Neon/Postgres, or inject the adapter into the live auth route.

## TDD / Verification Cycles
| Cycle | Test or Check Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | Better Auth installed-version schema inspection via `getSchema` | Identified default `user`, `session`, `account`, and `verification` tables | Added matching Prisma models | Uses the installed Better Auth 1.6.14 schema shape rather than hand-copying stale docs. |
| 2 | `db:format` and `db:validate` | Passed | Formatted and validated the Prisma schema | No database connection was made. |
| 3 | Auth config and adapter tests | Passed | Added optional database adapter injection and `createAuthDatabaseAdapter` | Keeps runtime Prisma client wiring as a separate follow-up slice. |

## Coding Summary
- Added Prisma models for Better Auth `User`, `Session`, `Account`, and `Verification`.
- Preserved Better Auth-required uniqueness and indexes for email, session token, user foreign keys, and verification identifier.
- Added `AuthDatabaseAdapter` support to `buildAuthConfig`.
- Added `createAuthDatabaseAdapter` using `better-auth/adapters/prisma` with `provider: "postgresql"` and transactions enabled.
- Added focused tests for adapter injection and adapter factory creation.

## Refactor Summary
- Auth configuration now supports optional persistence injection without requiring a generated Prisma client at import time.

## Deviations
- `createAuth` still does not inject a real Prisma adapter because generated Prisma client/runtime setup is not present yet.
- No migration files are generated.
- Better Auth `User` is intentionally separate from app-owned `Member`; session-to-member mapping remains a follow-up slice.

## Remaining Risks
- Need Prisma client generation/runtime setup before real auth persistence can be exercised.
- Need migration review before applying Better Auth tables to Neon/Postgres.
- Need session lookup that maps Better Auth `Account.accountId/providerId` or user email to app `Member.googleSubject/googleAccountEmail`.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm Better Auth models are acceptable as separate auth identity tables beside app-owned members.
  - Confirm adapter injection remains intentionally deferred until Prisma client runtime setup.
- must_check:
  - Prisma schema remains valid.
  - Auth route build stays green.
  - This slice does not claim real persisted login sessions.
- acceptance_signals:
  - Prisma format/validate pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
