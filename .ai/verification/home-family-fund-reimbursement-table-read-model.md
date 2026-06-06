---
id: ver-home-family-fund-reimbursement-table-read-model
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-reimbursement-table-read-model
  - story-reimbursement-table-and-settlement
  - exp-reimbursement-table-and-settlement
outputs:
  - verification_result
  - test_results
  - findings
trace_links:
  implementation:
    - .ai/implementation/home-family-fund-reimbursement-table-read-model.md
  code:
    - src/modules/reimbursement/reimbursement-table.ts
    - src/modules/reimbursement/reimbursement-table.test.ts
  acceptance_criteria:
    - AC9
    - AC10
    - AC11
    - AC16
    - AC17
reviewed_at:
---

# Verification Report for Reimbursement Table Read Model

## Scope
This verification result supports `local_dev` for the reimbursement table read-model slice only. It verifies that monthly refundable reimbursement totals are derived from ledger records, grouped by payer member, and traceable to expense ids before Prisma queries, UI table rendering, or monthly report integration are implemented.

## Commands Run
| Command | Result |
|---|---|
| `corepack pnpm test` | Pass: 4 files, 21 tests |
| `corepack pnpm lint` | Pass |
| `corepack pnpm type-check` | Pass |
| `corepack pnpm build` | Pass |

## Findings
| Severity | Finding | Evidence | Disposition |
|---|---|---|---|
| Low | Month validation is not owned by this read model. | `buildMonthlyReimbursementTable` assumes a valid `YYYY-MM` month string. | Accepted for this pure read model; route/form validation or query contract should validate month later. |
| Low | Sorting may need product refinement. | Groups are sorted by display name. | Accepted for MVP until member display/order rules are defined. |

## Domain Rule Check
| Rule | Source | Result |
|---|---|---|
| Reimbursement table includes refundable/unreimbursed member-paid expenses | Story acceptance criteria, AC10 | Pass: only member-paid `refundable` expenses are included. |
| Fund-paid expenses do not appear in reimbursement totals | AC9 | Pass: fund-paid/not-refundable expenses are excluded. |
| Reimbursed expenses are excluded from future refundable totals | AC11 | Pass: `reimbursed` records are excluded from groups and totals. |
| Table totals trace to individual expense records | Story acceptance criteria, AC16, AC17 | Pass: each group exposes `expenseIds` and row details. |
| Report/read values are derived, not manually edited state | ADR-7, AC17 | Pass: totals are computed from input ledger records. |

## Code Review
- Boundary alignment: Pass. The read model lives in the Reimbursement module and consumes Fund Ledger records as source data.
- Maintainability: Pass. Types separate table input members, grouped rows, expense row trace, and table totals.
- Correctness: Pass with accepted risks. Tests cover grouping, totals, filtering by month/status/payment source, income exclusion, and empty state.
- UX alignment: Partial. The read model provides the data needed by the future grouped table, but no responsive UI is implemented.
- Code map freshness: Potentially stale for future architecture queries because the Reimbursement module gained a read-model file. Refresh code understanding before broad architecture/deploy review if needed.

## Traceability
| Implementation Item | Test Plan Item | BDD Scenario | AC | Story |
|---|---|---|---|---|
| Monthly table derivation | Contract report/reimbursement read models | Member-paid expense becomes refundable | AC10, AC16 | Reimbursement Table And Settlement |
| Exclude fund-paid and reimbursed expenses | Integration Ledger + Reimbursement | Fund-paid expense is excluded from reimbursement; Finance manager reimburses selected expenses once | AC9, AC11 | Reimbursement Table And Settlement |
| Expense id trace | Contract report/reimbursement read models | Monthly report traces totals to records | AC16, AC17 | Monthly Records And Reports; Reimbursement Table And Settlement |

## Result
Pass with accepted risks. This slice is ready for the next implementation cycle. Remaining work includes Prisma-backed read queries, month validation at the route/query boundary, reimbursement UI grouping/selection, and monthly report integration.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm table should show only members with refundable expenses.
  - Confirm display-name sorting is acceptable for MVP.
- must_check:
  - The report does not imply UI or persistence completion.
  - Totals stay derived from source ledger records.
  - Reimbursed expenses are excluded from future refundable totals.
- acceptance_signals:
  - Full local quality gate passes.
  - Verification trace maps read-model behavior to AC9-AC11 and AC16-AC17.
- unresolved_blockers:
  - None for continuing implementation.
- next_step:
  - implementation-cycle
