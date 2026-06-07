---
id: impl-home-family-fund-homepage-auth-gate
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-server-current-member
  - impl-home-family-fund-home-access-states
  - impl-home-family-fund-app-shell-dashboard
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
    - Integration: Identity + command handlers
    - Quality Gate: Static checks
reviewed_at:
---

# Implementation Log for Homepage Auth Gate

## Delivery Profile
This implementation targets `local_dev` for the MVP. It wires the homepage access gate to the request-level current-member resolver while keeping mock dashboard financial data in place until database-backed report repositories exist.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `src/app/home-access.test.ts` for building home views from an already resolved access result | Red: builder did not exist; then green | Added `buildHomeAccessViewFromAccess` | Lets UI consume `getCurrentMember` output directly. |
| 2 | `src/auth/server-current-member.test.ts` for `getCurrentMemberFromHeaders` default factory composition | Red: helper did not exist; then green | Added `getCurrentMemberFromHeaders` and reused it from `getCurrentMember(request)` | Supports Next Server Components using `headers()`. |

## Coding Summary
- Updated `src/app/home-access.ts` with `buildHomeAccessViewFromAccess`.
- Updated `src/auth/server-current-member.ts` with `getCurrentMemberFromHeaders(headers)`.
- Updated `src/app/page.tsx` to be an async Server Component that reads `next/headers`, resolves current member access, and renders blocked states or the dashboard from that result.
- Kept existing mock members, categories, records, and recurring occurrence data for dashboard read models.

## Refactor Summary
- `buildHomeAccessView` now delegates to `buildHomeAccessViewFromAccess`, preserving previous Google identity based behavior for tests and callers.
- Runtime factories in server current-member were narrowed to the actual contract used by this helper, keeping tests lightweight.

## Deviations
No upstream artifacts needed changes. This slice intentionally gates the homepage by real auth state but does not replace mock financial data.

## Remaining Risks
- Authenticated linked users will still see mock dashboard financial data until repository-backed dashboard reads are implemented.
- The login button remains visual only; Google sign-in action wiring is still a later UI slice.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm homepage should now block unauthenticated users by default.
  - Confirm mock dashboard data can remain temporarily after access is real.
- must_check:
  - Homepage uses request headers to resolve Better Auth session.
  - Existing blocked state copy remains Traditional Chinese.
  - Existing mobile bottom actions remain in place for dashboard state.
- acceptance_signals:
  - Home access and server current-member focused tests pass.
  - Full quality gate passes, including Next build.
- unresolved_blockers:
  - None for this slice.
- next_step:
  - Wire the Google sign-in button/action or start database-backed dashboard read repositories.
