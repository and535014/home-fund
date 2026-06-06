---
id: impl-home-family-fund-reimbursement-table-read-model
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-reimbursement-table-and-settlement
  - exp-reimbursement-table-and-settlement
  - impl-home-family-fund-ledger-entry-creation
  - impl-home-family-fund-reimbursement-settlement
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC9
    - AC10
    - AC11
    - AC16
    - AC17
  bdd_scenarios:
    - Fund-paid expense is excluded from reimbursement
    - Member-paid expense becomes refundable
    - Finance manager reimburses selected expenses once
  test_plan_items:
    - Contract report/reimbursement read models
    - Integration Ledger + Reimbursement
reviewed_at:
---

# Implementation Log for Reimbursement Table Read Model

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds a pure monthly reimbursement table read model derived from ledger records, before database queries, UI tables, or monthly report pages are implemented.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `reimbursement-table.test.ts` for grouping monthly refundable member-paid expenses by payer, excluding fund-paid/reimbursed/other-month records, and preserving expense id trace | Failed on missing module, then passed | Added `src/modules/reimbursement/reimbursement-table.ts` with `buildMonthlyReimbursementTable` | Covers reimbursement table grouping, totals, and traceability. |
| 2 | Empty month case | Passed after implementation | Returned an empty table with generated event and zero total | Supports empty state for future UI. |

## Coding Summary
- Added `buildMonthlyReimbursementTable` to derive table groups from existing ledger records.
- Included only expense records for the selected `YYYY-MM` month with `paymentSource: "member"` and `reimbursementStatus: "refundable"`.
- Excluded fund-paid, not-refundable, reimbursed, income, and other-month records.
- Grouped refundable expenses by payer member, with totals, expense ids, and minimal expense row data for traceability.
- Returned a table-level total and `Monthly reimbursement table generated` event label.

## Refactor Summary
- No broad refactor was performed. The read model stays inside the Reimbursement module and consumes Fund Ledger record types.

## Deviations
- This slice does not persist or query database records. Prisma-backed read queries remain deferred.
- This slice does not implement the responsive reimbursement UI or selection toolbar.
- Member display names are supplied as read-model input; Identity and Access member queries remain deferred.

## Remaining Risks
- Month input is assumed to be a valid `YYYY-MM` string from future route/form validation.
- Sorting currently uses member display name. Product may later prefer household member order or outstanding amount order.
- Database implementation must preserve the same filter semantics and trace ids.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm table groups should include only members with refundable expenses.
  - Confirm display-name sorting is acceptable for MVP until a member order exists.
- must_check:
  - Fund-paid and reimbursed expenses are excluded.
  - Totals are derived from traceable expense rows.
  - The read model remains derived, not a writable source of truth.
- acceptance_signals:
  - Reimbursement table unit tests pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
