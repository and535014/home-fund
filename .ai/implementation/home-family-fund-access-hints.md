---
id: impl-home-family-fund-access-hints
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-authenticated-household-access
  - exp-authenticated-household-access
  - impl-home-family-fund-session-access
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC3
    - AC5
    - AC6
    - AC19
  bdd_scenarios:
    - Permission denied state is accessible
  test_plan_items:
    - Contract auth/session boundary
    - Unit authorization decisions independent of UI
reviewed_at:
---

# Implementation Log for Access Hints

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds role-aware navigation and action hints for future app shell/UI rendering while keeping command authorization as the source of truth.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `access-hints.test.ts` for general member, finance manager, admin, explicit category/recurring capabilities, and unlinked account | Failed on missing module, then passed | Added `src/modules/identity-access/access-hints.ts` | Covers UI-facing access state without duplicating authorization logic. |

## Coding Summary
- Added `buildAccessHints` for future role-aware app shell and action visibility.
- Derived all hints by calling the existing `authorize` boundary.
- Included navigation hints for reports, records, create, reimbursements, recurring, categories, and members.
- Included action hints for own/other create/edit/delete, reimbursement, member management, category management, and recurring management.
- Preserved finance-manager MVP delete restriction in UI hints.

## Refactor Summary
- No refactor was performed. This is a read-only projection over existing authorization rules.

## Deviations
- These hints are advisory for UI only. They do not replace command authorization.
- Route guards and actual UI rendering are not implemented in this slice.

## Remaining Risks
- UI should still show explicit permission-denied messages for direct command/route attempts.
- Hints may need route-specific refinement once actual navigation IA is implemented.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm reimbursement route is browse-visible to all members while settlement action remains finance-manager-only.
  - Confirm admin does not implicitly get reimbursement action unless finance-manager role is also assigned.
- must_check:
  - Hints are derived from `authorize`.
  - UI hints do not become enforcement.
  - Finance-manager delete-other restriction is reflected.
- acceptance_signals:
  - Access hints unit tests pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
