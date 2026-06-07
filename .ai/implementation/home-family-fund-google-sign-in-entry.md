---
id: impl-home-family-fund-google-sign-in-entry
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-google-auth-route
  - impl-home-family-fund-homepage-auth-gate
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC18
    - AC20
  bdd_scenarios:
    - Google sign-in and household authorization: Unlinked Google account cannot access household data
  test_plan_items:
    - Contract: Auth/session boundary
    - E2E: Critical happy path
    - Quality Gate: Static checks
reviewed_at:
---

# Implementation Log for Google Sign-In Entry

## Delivery Profile
This implementation targets `local_dev` for the MVP. It wires the blocked homepage Google action to Better Auth's Google social sign-in endpoint through a local POST route.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `src/auth/google-sign-in.test.ts` covering Better Auth social sign-in call and local error redirect | Red: module did not exist; then adjusted redirect status to platform default 302 | Added `src/auth/google-sign-in.ts` | Uses Better Auth `signInSocial` with provider `google`. |

## Coding Summary
- Added `startGoogleSignIn` to call `auth.api.signInSocial` with Google provider, homepage callback, and homepage error callback.
- Added `src/app/auth/google/route.ts` as a POST route that creates Better Auth and delegates to `startGoogleSignIn`.
- Updated the blocked homepage state so unauthenticated and account-not-linked actions submit to `/auth/google`.
- Left inactive-member state as a non-submit button because that state is not fixed by choosing another Google account.

## Refactor Summary
No refactor was needed after tests passed.

## Deviations
No upstream artifacts needed changes. This slice does not add client-side Better Auth hooks because the server POST route is sufficient for the MVP sign-in entry.

## Remaining Risks
- Local Google OAuth still requires real `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and a database before manual OAuth verification.
- There is not yet an E2E test for the external Google redirect.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm POST `/auth/google` is an acceptable sign-in entry path.
  - Confirm homepage callback/error callback should both return to `/` for now.
- must_check:
  - Better Auth receives request headers and Google provider body.
  - Blocked homepage buttons remain Traditional Chinese and accessible.
- acceptance_signals:
  - Google sign-in helper focused tests pass.
  - Full quality gate passes.
- unresolved_blockers:
  - None for this slice.
- next_step:
  - Add database-backed dashboard read repositories or add manual/E2E OAuth verification setup.
