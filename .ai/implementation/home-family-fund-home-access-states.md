---
id: impl-home-family-fund-home-access-states
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-authenticated-household-access
  - exp-authenticated-household-access
  - impl-home-family-fund-session-access
  - impl-home-family-fund-app-shell-dashboard
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC16
    - AC18
    - AC21
    - AC22
  bdd_scenarios:
    - Unlinked Google account cannot access household data
  test_plan_items:
    - Contract auth/session boundary
    - Report/reimbursement read models
    - Responsive workflows
reviewed_at:
---

# Implementation Log for Home Access States

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice connects the dashboard shell to the existing session access contract so the home page can represent unauthenticated, unlinked, inactive, and dashboard states before real Better Auth Google OAuth routing is wired.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `home-access.test.ts` for unauthenticated, unlinked, inactive, and active linked member dashboard states | Failed on missing module, then passed | Added `src/app/home-access.ts` | Keeps dashboard data behind `resolveHouseholdAccess`. |
| 2 | Full local quality gate | Passed | Refactored `src/app/page.tsx` to use the home access view model | Page now renders access-state UI before dashboard UI when household access is not resolved. |

## Coding Summary
- Added `buildHomeAccessView` as the app-level view model for home page access states.
- Composed `resolveHouseholdAccess`, `buildAccessHints`, `buildMonthlyReport`, and `buildMonthlyReimbursementTable`.
- Added Traditional Chinese blocked states for Google sign-in required, unlinked Google account, and inactive member account.
- Refactored dashboard rendering to use resolved member profile and role-aware access hints.
- Kept mock Google identity and mock household data local to the page until real auth and persistence are wired.

## Refactor Summary
- Moved navigation visibility generation from module-level state into a function that accepts resolved access hints.
- Kept dashboard components local to `page.tsx`; extraction can wait until a second route reuses the shell.

## Deviations
- The Google sign-in button is a non-submitting placeholder in this slice.
- This slice does not add route middleware, cookies, Better Auth handlers, OAuth provider config, or database member lookup.
- Dashboard still uses mock household records and categories.

## Remaining Risks
- Functional routes beyond `/` still need server-side route guards.
- Real Google OAuth must replace `mockGoogleIdentity` before auth is considered complete.
- Unlinked/inactive states need visual verification once real login redirects exist.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm the access-state copy and dashboard exposure boundary.
  - Confirm placeholder Google action is acceptable until OAuth wiring.
- must_check:
  - Unauthenticated or unlinked states do not expose dashboard view data.
  - Dashboard continues to use Traditional Chinese and dark semantic tokens.
  - This slice does not claim production OAuth/session wiring.
- acceptance_signals:
  - Home access tests pass.
  - Full local quality gate passes.
  - Dashboard still renders at mobile size with the fixed bottom action bar.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
