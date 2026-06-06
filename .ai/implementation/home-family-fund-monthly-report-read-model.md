---
id: impl-home-family-fund-monthly-report-read-model
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-monthly-records-and-reports
  - exp-monthly-records-and-reports
  - impl-home-family-fund-ledger-entry-creation
  - impl-home-family-fund-category-management
  - impl-home-family-fund-reimbursement-table-read-model
  - impl-home-family-fund-recurring-rules
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC14
    - AC16
    - AC17
  bdd_scenarios:
    - Monthly report traces totals to records
    - Reminder-based contribution waits for confirmation
  test_plan_items:
    - Unit report derivation rules
    - Contract report/reimbursement read models
reviewed_at:
---

# Implementation Log for Monthly Report Read Model

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds a pure monthly report read model derived from ledger records, category data, pending recurring occurrences, and reimbursement table data before UI, Prisma query composition, or caching are implemented.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `monthly-report.test.ts` for confirmed income/expense totals, category summaries, pending reminders, reimbursement summary, and traceable record ids | Failed on missing module, then passed | Added `src/modules/reporting/monthly-report.ts` with `buildMonthlyReport` | Covers AC14, AC16, and AC17. |
| 2 | Empty month report case | Passed after implementation | Returned zero totals, empty trace arrays, empty pending items, and empty reimbursement summary | Supports future empty report UI. |

## Coding Summary
- Added Reporting module read model for monthly reports.
- Derived confirmed income, confirmed expense, and net totals from monthly ledger records.
- Added category summaries by category id/name/type with traceable record ids.
- Included pending recurring occurrences for the selected month while excluding them from confirmed totals.
- Added reimbursement summary from the monthly reimbursement table.
- Returned monthly records/report domain event labels.

## Refactor Summary
- No broad refactor was performed. Reporting consumes existing Fund Ledger, Categorization, Recurring Schedule, and Reimbursement read-model types.

## Deviations
- No report UI, route, Prisma query, or cache is implemented in this slice.
- Month validation is not owned by this read model; route/query validation remains deferred.
- Fund balance remains outside report scope because product has not approved fund-balance accounting behavior.

## Remaining Risks
- Category summary sort order is simple type/name ordering and may need UI/product refinement.
- Report freshness depends on future query composition after mutations.
- Pending recurring rows include occurrence identity only; future UI may need enriched rule/category/member labels.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm report scope remains income/expense/reimbursement/pending only, without fund balance.
  - Confirm pending reminders being shown but excluded from totals matches intended wording.
- must_check:
  - Totals are derived from ledger records, not stored report state.
  - Summary values trace to record ids.
  - Pending recurring items do not affect totals.
- acceptance_signals:
  - Monthly report unit tests pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
