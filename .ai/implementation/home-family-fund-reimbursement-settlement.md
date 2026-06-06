---
id: impl-home-family-fund-reimbursement-settlement
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-reimbursement-table-and-settlement
  - exp-reimbursement-table-and-settlement
  - impl-home-family-fund-ledger-entry-creation
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC10
    - AC11
    - AC12
  bdd_scenarios:
    - Finance manager reimburses selected expenses once
  test_plan_items:
    - Unit ledger payment-source rules
    - Unit authorization decisions independent of UI
reviewed_at:
---

# Implementation Log for Reimbursement Settlement

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice implements the domain-level reimbursement status transition before reimbursement table UI, persistence, batch storage, or fund-balance accounting effects are added.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `reimbursements.test.ts` for finance-manager settlement, general-member denial, already-reimbursed rejection, fund-paid rejection, empty selection, and missing expense ids | Failed on missing module, then passed | Added `src/modules/reimbursement/reimbursements.ts` with `markExpensesReimbursed` | Covers AC11, AC12, and the finance-manager reimbursement BDD scenario. |
| 2 | Existing ledger creation tests | Passed after expanding expense reimbursement status type | Added `reimbursed` to `ExpenseLedgerRecord` status union | Keeps ledger-created `refundable` state compatible with later reimbursement transition. |

## Coding Summary
- Added a Reimbursement module with a `markExpensesReimbursed` command function.
- Reused the Identity and Access `perform_reimbursement` authorization command so only finance managers can mark expenses reimbursed.
- Added one-time status transition validation: only member-paid `refundable` expenses can become `reimbursed`.
- Rejected already reimbursed expenses, fund-paid/not-refundable expenses, unknown ids, and empty selections.
- Returned updated reimbursed expense records and domain event labels for selected and reimbursed expenses.

## Refactor Summary
- Expanded the Fund Ledger expense reimbursement status type to include `reimbursed`.
- No UI or persistence refactor was performed.

## Deviations
- Settlement remains status-only. It does not execute payment or create a fund-balance transaction, matching the current MVP decision.
- The command returns updated records but does not persist them yet.
- Reimbursement grouping/table generation is deferred to a later read-model slice.

## Remaining Risks
- Atomic persistence semantics are not implemented. Once Prisma persistence is added, selected expense status updates must be transactional.
- Batch identity/history is not modeled yet; the MVP can still mark expenses reimbursed per selected record, but reporting may later need batch metadata.
- Finance-manager-only reimbursement currently means admins without the finance-manager role cannot reimburse, matching existing authorization tests.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm status-only reimbursement is still acceptable for MVP.
  - Confirm admin-only users should not reimburse unless they also have finance-manager role.
- must_check:
  - Already reimbursed expenses cannot be reimbursed twice.
  - Fund-paid expenses cannot be reimbursed.
  - Authorization is enforced in the command, not only UI.
- acceptance_signals:
  - Reimbursement unit tests pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
