---
id: impl-home-family-fund-ledger-record-corrections
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-ledger-record-corrections
  - exp-ledger-record-corrections
  - impl-home-family-fund-ledger-entry-creation
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC3
    - AC5
    - AC6
    - AC7
    - AC8
    - AC9
    - AC10
  bdd_scenarios:
    - General member cannot create a record for another member
  test_plan_items:
    - Unit authorization decisions independent of UI
    - Unit ledger payment-source rules
reviewed_at:
---

# Implementation Log for Ledger Record Corrections

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds pure Fund Ledger correction and delete command rules before UI, Prisma persistence handlers, conflict detection, or audit history are implemented.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `ledger-record-corrections.test.ts` for owner edit, finance-manager edit, unauthorized general-member edit, payment-source status derivation, owner/admin delete, and finance-manager delete denial | Failed on missing module, then passed | Added `src/modules/fund-ledger/ledger-record-corrections.ts` | Covers edit/delete permission boundaries and payment-source correction behavior. |

## Coding Summary
- Added `updateLedgerRecord` and `deleteLedgerRecord` command functions.
- Reused Identity and Access `edit_ledger_record` and `delete_ledger_record` authorization commands.
- Preserved owner/admin/finance-manager edit rules and MVP finance-manager delete restriction.
- Re-derived expense reimbursement status when payment source changes.
- Validated amount, date, active category, category type, income source, member payer, and fund-paid payer rules.
- Chose hard delete command semantics for MVP: delete returns a `deletedRecordId` for persistence handlers to remove.

## Refactor Summary
- No broad refactor was performed. Date/category validation is duplicated from create-record logic and can be consolidated when persistence command handlers are introduced.

## Deviations
- Delete semantics remain hard delete for MVP. Void/archive is safer for production-grade auditability and should be revisited before PRD.
- Mutation conflict checks are not implemented because there is no persistence/version field yet.
- Reimbursed expense editing is only partially constrained: changing payment source after reimbursement is blocked, but other edits still require final product policy.

## Remaining Risks
- Hard delete loses audit trail unless replaced or supplemented before production.
- Persistence handler must ensure deleted records are actually excluded from report and reimbursement queries.
- Reimbursed expense correction policy may need stricter rules before UI enables edits.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm hard delete is acceptable for MVP local development only.
  - Confirm finance managers can edit but cannot delete others' records.
- must_check:
  - Unauthorized users cannot mutate records.
  - Payment-source changes update reimbursement status.
  - Deleted records will be excluded by persistence/read-model inputs.
- acceptance_signals:
  - Ledger correction unit tests pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
