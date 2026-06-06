---
id: impl-home-family-fund-google-auth-route
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-authenticated-household-access
  - exp-authenticated-household-access
  - impl-home-family-fund-session-access
  - impl-home-family-fund-home-access-states
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC20
  bdd_scenarios:
    - Unlinked Google account cannot access household data
  test_plan_items:
    - Manual Google OAuth local setup
    - Contract auth/session boundary
    - Quality gate static checks
reviewed_at:
---

# Implementation Log for Google Auth Route

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds the Better Auth Google OAuth route entrypoint and environment contract without yet wiring persistent auth tables, Prisma adapter, session-to-member lookup, or route middleware.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `config.test.ts` for local placeholder env, production env enforcement, and Google provider config | Failed on missing module, then passed | Added `src/auth/config.ts` | Keeps OAuth env requirements explicit before real provider setup. |
| 2 | Full local build | Initially failed on Better Auth full import pulling Kysely adapter; then passed | Switched to `better-auth/minimal` and request-time auth creation | Avoids Kysely bundling until a database adapter is intentionally added. |

## Coding Summary
- Added `readAuthEnvironment` to centralize `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
- Added `buildAuthConfig` with Google social provider configuration.
- Added `createAuth` using `better-auth/minimal` so the current no-adapter slice does not pull Kysely into the Next build.
- Added `/api/auth/[...all]` route handler that creates auth lazily per request.
- Updated `.env.example` with Better Auth and Google OAuth variables.

## Refactor Summary
- Auth setup now has a single `src/auth` boundary that later slices can extend with Prisma adapter and session lookup.

## Deviations
- The route is present, but real Google sign-in still requires valid OAuth credentials.
- Better Auth persistent tables and Prisma adapter are not added in this slice.
- The home page still uses mock Google identity; it is not reading Better Auth session yet.
- Local/test builds use placeholder credentials only outside production. Production requests without required env fail fast.

## Remaining Risks
- Need a dedicated schema slice for Better Auth user/session/account tables and adapter choice.
- Need a session lookup slice to map Better Auth user/account data to `resolveHouseholdAccess`.
- Need UI action wiring so the Google sign-in button starts the auth flow.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm the env contract and lazy auth route behavior.
  - Confirm `better-auth/minimal` is acceptable until Prisma adapter wiring.
- must_check:
  - Production OAuth env remains mandatory.
  - This slice does not claim persistent sessions or route guards are complete.
  - Local quality gate passes with the auth route present.
- acceptance_signals:
  - Auth config tests pass.
  - Next build lists `/api/auth/[...all]` as a dynamic route.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
