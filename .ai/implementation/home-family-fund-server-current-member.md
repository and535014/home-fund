---
id: impl-home-family-fund-server-current-member
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-current-member-composition
  - impl-home-family-fund-current-member-prisma-data-source
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
    - Google sign-in and household authorization: Unlinked Google account cannot access household data
  test_plan_items:
    - Contract: Auth/session boundary
    - Integration: Identity + command handlers
    - Quality Gate: Static checks
reviewed_at:
---

# Implementation Log for Server Current Member

## Delivery Profile
This implementation targets `local_dev` for the MVP. It adds a request-level current-member helper that reads the Better Auth session from request headers, then composes the existing current-member resolver with the Prisma-backed data source.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `src/auth/server-current-member.test.ts` covering Better Auth header use, no-session behavior, and active member resolution | Red: module did not exist; then green | Added `src/auth/server-current-member.ts` | Core function remains injectable; default `getCurrentMember(request)` wires runtime auth and Prisma. |

## Coding Summary
- Added `resolveCurrentMemberFromRequest` to call `auth.api.getSession({ headers })`.
- Added `getCurrentMember(request)` to create Better Auth, create the Prisma-backed current-member data source, and resolve the app access result.
- Added tests that verify request headers are passed to Better Auth and no-session/session-user flows reach the existing domain resolver.

## Refactor Summary
No refactor was needed after tests passed.

## Deviations
No upstream artifacts needed changes. This slice does not yet replace the dashboard mock data or enforce route guards.

## Remaining Risks
- `getCurrentMember` is not yet called by pages, route handlers, or server actions.
- The homepage still uses mock financial data until repositories for dashboard reads exist.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm request headers are the intended Better Auth server session input.
  - Confirm route/page wiring should be a separate slice from helper creation.
- must_check:
  - No session returns the existing unauthenticated access result.
  - Session users flow through existing current-member composition and Prisma data source contracts.
- acceptance_signals:
  - Request-level current-member focused tests pass.
  - Full quality gate passes.
- unresolved_blockers:
  - None for this slice.
- next_step:
  - Use `getCurrentMember(request)` in a route/page boundary and replace the homepage mock identity with real access state.
