---
id: impl-home-family-fund-prisma-runtime-auth-adapter
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - arch-home-family-fund
  - impl-home-family-fund-prisma-schema-foundation
  - impl-home-family-fund-better-auth-persistence-schema
  - impl-home-family-fund-google-auth-route
outputs:
  - tests
  - code_changes
  - package_changes
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
    - Contract auth/session boundary
    - Manual Google OAuth local setup
    - Quality gate static checks
reviewed_at:
---

# Implementation Log for Prisma Runtime Auth Adapter

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds Prisma 7 client generation/runtime setup, injects the Better Auth Prisma adapter into the auth factory, and keeps the generated client out of source control.

## TDD / Verification Cycles
| Cycle | Test or Check Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `prisma generate` | Passed after adding driver adapter dependency | Added `@prisma/adapter-pg` and generated Prisma client output | Prisma 7 generated client requires a driver adapter for Postgres runtime. |
| 2 | `prisma.test.ts` for database URL resolution | Passed | Added lazy Prisma runtime in `src/db/prisma.ts` | Production requires `DATABASE_URL`; local/dev can generate and instantiate with a placeholder URL. |
| 3 | Full local quality gate | Passed | Updated scripts to run `prisma generate` before dev/test/lint/type-check/build | Prevents fresh checkout failures while keeping `src/generated/` ignored. |
| 4 | Next build with auth route | Passed | Changed `createAuth` to lazily inject `createAuthDatabaseAdapter(getPrismaClient())` | Avoids route module evaluation touching database runtime during build collection. |

## Coding Summary
- Added `@prisma/adapter-pg@7.8.0` to match installed Prisma 7.8.0.
- Added `src/db/prisma.ts` with lazy `getPrismaClient`, `createPrismaClient`, and `readDatabaseUrl`.
- Updated `createAuth` to asynchronously import Prisma runtime and Better Auth Prisma adapter at request time.
- Updated auth route handler to await `createAuth`.
- Added `src/generated/` to `.gitignore`.
- Added `db:generate` and made `dev`, `test`, `lint`, `type-check`, and `build` generate the Prisma client first.
- Updated `prisma.config.ts` with a local placeholder datasource URL for non-runtime CLI operations when `DATABASE_URL` is absent.

## Refactor Summary
- Auth runtime now has three explicit layers:
  - env/config parsing in `src/auth/config.ts`
  - database adapter factory in `src/auth/prisma-adapter.ts`
  - lazy Prisma client runtime in `src/db/prisma.ts`

## Deviations
- No real database connection or migration was executed.
- `DATABASE_URL` is still required for production runtime requests, but local CLI generation can use a placeholder URL.
- Session-to-household-member mapping remains a follow-up slice.

## Remaining Risks
- Vercel/Neon runtime needs real `DATABASE_URL`, OAuth env, and migration deployment before usable login.
- Parallel local commands that both run `prisma generate` can race on the ignored generated directory; normal single-command quality gates are passing.
- Generated client output is not committed; CI/deploy must use the package scripts or run `db:generate`.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm generated client should remain ignored rather than committed.
  - Confirm local placeholder URL is acceptable for Prisma CLI generation.
- must_check:
  - Full quality gate passes from scripts.
  - Auth route builds after adapter injection.
  - This slice does not claim real persisted login has been exercised.
- acceptance_signals:
  - `prisma generate` runs successfully.
  - Next build keeps `/api/auth/[...all]` dynamic and green.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
