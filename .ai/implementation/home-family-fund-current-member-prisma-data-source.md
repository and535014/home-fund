---
id: impl-home-family-fund-current-member-prisma-data-source
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-current-member-composition
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC4
    - AC20
  bdd_scenarios:
    - Google sign-in and household authorization: Unlinked Google account cannot access household data
    - Google sign-in and household authorization: Admin can manage a member's permissions
  test_plan_items:
    - Contract: Auth/session boundary
    - Integration: Identity + command handlers
    - Quality Gate: Static checks
reviewed_at:
---

# Implementation Log for Current Member Prisma Data Source

## Delivery Profile
This implementation targets `local_dev` for the MVP. It adds a Prisma-backed data source factory for the current-member auth composition while keeping query shape and row-to-domain mapping unit-testable without a real database.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `src/auth/current-member-data-source.test.ts` covering account lookup, member lookup, role/capability mapping, and nullable Google fields | Red: module did not exist; then green after implementation | Added `src/auth/current-member-data-source.ts` | Uses structural Prisma client typing so tests can inject a fake client. |
| 2 | Type-check exposed schema/domain mismatch for `manage_recurring` capability | Red: Prisma enum lacked `manage_recurring` | Added `manage_recurring` to `prisma/schema.prisma` | Aligns persistent member capabilities with existing domain authorization rules. |

## Coding Summary
- Added `createCurrentMemberDataSource(prisma)` to load Better Auth accounts and app household members.
- Added `mapPrismaMemberToHouseholdMember` to translate Prisma member rows into Identity and Access domain member accounts.
- Added tests for Prisma query arguments and nullable Google account field handling.
- Updated Prisma `MemberCapability` enum to include `manage_recurring`, matching existing authorization and member-management behavior.

## Refactor Summary
No refactor was needed after tests passed. The data source is not yet wired to a Next.js request or the homepage.

## Deviations
No story or architecture changes were required. The schema capability enum fix was included because the previous schema could not persist an already-supported domain capability.

## Remaining Risks
- No migration file exists yet because this project has not started Prisma migrations in-repo.
- Server session retrieval from Better Auth and route-level guard wiring remain separate slices.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm `manage_recurring` should be persisted as a member capability.
  - Confirm the member lookup should list all household members for the current single-household MVP.
- must_check:
  - Prisma query selects only fields required by current-member resolution.
  - Nullable Google account fields are omitted from domain member objects.
- acceptance_signals:
  - Data source focused tests pass.
  - Full project quality gate passes.
- unresolved_blockers:
  - None for this slice.
- next_step:
  - Wire Better Auth server session retrieval and `createCurrentMemberDataSource(getPrismaClient())` into a request-level `getCurrentMember`.
