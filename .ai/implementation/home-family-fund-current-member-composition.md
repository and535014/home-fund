---
id: impl-home-family-fund-current-member-composition
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-session-identity-mapping
  - impl-home-family-fund-session-access
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

# Implementation Log for Current Member Composition

## Delivery Profile
This implementation targets `local_dev` for the MVP. It composes the existing Better Auth identity mapping and household access resolver behind an injectable data source so request/session handling and Prisma repositories can be added in later slices without changing the core contract.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `src/auth/current-member.test.ts` covering unauthenticated user, auth user without Google account, and active member resolution | Red: module did not exist; then red on linked-account semantics | Added `src/auth/current-member.ts` with `resolveCurrentMember` and explicit logged-in-but-unlinked handling | Keeps `null` Google identity as unauthenticated in the domain resolver while preserving account-not-linked semantics for authenticated users. |

## Coding Summary
- Added `CurrentMemberDataSource` for account and household member reads.
- Added `resolveCurrentMember` to avoid data reads for unauthenticated sessions.
- Composed `resolveGoogleIdentityFromAuthSession` with `resolveHouseholdAccess`.
- Returned `google_account_not_linked` when a Better Auth user exists but no linked Google account maps to a domain identity.

## Refactor Summary
No refactor was needed after tests passed. This slice intentionally does not import Prisma or request cookies.

## Deviations
No upstream artifacts needed changes. The function is not wired into the Next.js page or route guard yet.

## Remaining Risks
- A Prisma-backed `CurrentMemberDataSource` still needs to map `Account`, `Member`, roles, and capabilities into domain types.
- Server request integration still needs to retrieve the Better Auth session user before this composition can replace mock dashboard identity.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm authenticated users without a Google account should be treated as account-not-linked rather than unauthenticated.
  - Confirm the injectable data source is acceptable before wiring Prisma.
- must_check:
  - Unauthenticated requests do not load household data.
  - The composition calls existing domain access resolution for active/inactive member semantics.
- acceptance_signals:
  - Current-member contract tests pass.
  - The slice preserves existing session access behavior.
- unresolved_blockers:
  - None for this slice.
- next_step:
  - Add Prisma-backed data source for current-member resolution, then wire server session loading.
