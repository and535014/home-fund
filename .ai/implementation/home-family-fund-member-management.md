---
id: impl-home-family-fund-member-management
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-admin-member-management
  - exp-admin-member-management
  - impl-home-family-fund-mvp-baseline
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC3
    - AC4
    - AC5
  bdd_scenarios:
    - Admin can manage a member's permissions
  test_plan_items:
    - Unit authorization decisions independent of UI
    - Contract auth/session boundary
reviewed_at:
---

# Implementation Log for Member Management

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds pure admin member-management rules before Google OAuth linking, Better Auth session tables, Prisma command handlers, or UI member settings are implemented.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `member-management.test.ts` for admin member creation, non-admin denial, display-name update, permission update, validation, duplicate email, unknown member, and last-admin protection | Failed on missing module, then passed | Added `src/modules/identity-access/member-management.ts` | Covers AC4 and admin-only command enforcement. |

## Coding Summary
- Added `HouseholdMemberAccount` domain type with display name, Google account email, roles, capabilities, and status.
- Added admin-only `createMember`, `updateMemberDisplayName`, and `updateMemberPermissions` commands.
- Defaulted newly invited/manual members to `general_member` with no capabilities.
- Normalized Google account email to lowercase and rejected duplicate emails.
- Added last-admin protection to avoid locking the household out of member management.
- Preserved role/capability model for future configurable finance/category/recurring permissions.

## Refactor Summary
- No broad refactor was performed. The new member-management module reuses the existing `manage_members` authorization command.

## Deviations
- Invitation mechanism remains lightweight: this slice creates an invited member record shape but does not send email, generate invite links, or link Google OAuth accounts.
- Better Auth integration remains deferred.
- UI confirmation flows for high-impact permission changes are not implemented in this slice.

## Remaining Risks
- Product still needs to confirm the final invitation/linking flow.
- Prisma persistence must preserve uniqueness for Google account identifiers and enforce last-admin updates transactionally.
- Permission changes affect future authorization once persisted members are converted back into `AuthenticatedMember` session shape.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm last-admin protection is acceptable for MVP.
  - Confirm invited member default role should be `general_member`.
- must_check:
  - Non-admins cannot manage members.
  - Permission changes use existing role/capability names.
  - The slice does not imply Google OAuth invitation is complete.
- acceptance_signals:
  - Member-management unit tests pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
