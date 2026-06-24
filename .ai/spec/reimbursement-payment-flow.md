---
id: spec-reimbursement-payment-flow
stage: behavior-spec
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/prototype/reimbursement-payment-flow.md
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/reimbursement-payment-flow.md
  domain_impact:
    - .ai/domain-impact/reimbursement-payment-flow.md
  prototype:
    - .ai/prototype/reimbursement-payment-flow.md
  production_routes:
    - /
    - /search
  target_components:
    - src/app/record-list-detail.tsx
    - src/app/batch-action-dialog.tsx
    - src/app/record-search-panel.tsx
    - src/app/reimbursement-payment-fields.tsx
    - src/app/ledger-record-actions.ts
    - src/app/record-search-actions.ts
  domain_modules:
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/reimbursement/reimbursement-batch-actions.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/reporting/monthly-report.ts
    - src/modules/identity-access/authorization.ts
  existing_e2e:
    - e2e/dashboard.spec.ts
    - e2e/record-search.spec.ts
reviewed_at: 2026-06-24
---

# Reimbursement Payment Flow Behavior Spec

## Decision Summary

- decision: review_for_feature_technical_design
- prototype_status: approved
- primary_entry_points: dashboard record detail refund, `/search` batch refund
- reimbursement_payment_scope: one reimbursement batch records one payment to one paid-to member
- paid_from_source: fixed household fund, not user-editable
- editable_payment_fields: payment method, payment date, optional transaction note
- payment_method_options: `銀行轉帳`, `現金`, `其他`
- payment_date_granularity: date only, no time-of-day
- batch_cross_member_policy: cannot complete as one reimbursement payment
- no_double_count_policy: reimbursement payment evidence is not an ordinary ledger income or expense
- next_gate: Feature Technical Design

## Final Acceptance Criteria

1. Eligible single-record refund still starts from an active member-paid refundable expense detail dialog.
2. Single-record refund opens `確認退款`.
3. The single-record refund dialog shows the existing record summary card before the refund payment fields.
4. The refund payment form has no visible form title or explanatory description.
5. The refund payment form does not repeat paid-to member, refund amount, or payment source as editable or static form fields.
6. The refund payment form shows exactly three user-facing fields: `付款方式`, `付款日期`, and `交易備註`.
7. `付款方式` is required and limited to `銀行轉帳`, `現金`, and `其他`.
8. `付款日期` is required, defaults to the current local date, and records date only.
9. `交易備註` is optional and uses a single-line input.
10. Confirming refund without required payment method or payment date is rejected by server-side validation.
11. Confirming a valid refund records payment evidence and marks the selected expense `已退款` atomically.
12. Successful single-record refund feedback mentions that refund payment information was kept.
13. Existing single-record eligibility remains unchanged: income, fund-paid expenses, voided records, already reimbursed expenses, non-refundable records, and unauthorized actors cannot complete refund.
14. Batch refund still starts from `/search` selection mode.
15. Batch refund opens `確認批次退款`.
16. Batch refund confirmation shows `將處理` and `略過` side by side.
17. Batch refund confirmation shows `退款總金額` on a separate row.
18. Batch refund payment fields appear only when eligible selected records belong to one paid-to member.
19. Batch refund confirmation is disabled when eligible selected records include more than one paid-to member.
20. Cross-member batch refund does not show an extra explanatory warning in this slice.
21. Batch refund uses the same payment method, payment date, and transaction note fields as single-record refund.
22. Batch refund records one payment evidence item for the reimbursement batch and marks all eligible same-member selected expenses `已退款` atomically.
23. The recorded payment amount equals the sum of eligible reimbursed expense amounts for the paid-to member.
24. Reimbursement payment evidence stores the derived paid-to member, derived amount, fixed household-fund source, selected payment method, payment date, actor, and optional note.
25. Reimbursement payment evidence is linked to the reimbursement batch and traceable to reimbursed ledger record IDs.
26. Monthly income and expense totals do not change because of reimbursement payment evidence.
27. Monthly unpaid reimbursement totals exclude reimbursed expenses after successful payment capture.
28. Reimbursed record detail/readback can show payment evidence after implementation.
29. Historical already-reimbursed records without payment evidence show a clear missing-payment-evidence state rather than inventing data.
30. Payment evidence cannot be edited, partially refunded, split into multiple payment methods, or reversed in this slice.
31. Server-side authorization and eligibility checks are authoritative; client-side disabled states are not the security boundary.
32. UI copy remains Traditional Chinese using Taiwan usage and does not imply the app executes an external transfer.

## BDD Scenarios

### Scenario: Finance Manager Records Payment Evidence For One Expense

Given a finance-capable member opens an active member-paid refundable expense detail  
When they activate `退款`  
Then the `確認退款` dialog shows the record summary  
And the refund form shows `付款方式`, `付款日期`, and `交易備註`  
And the form does not show a separate title, paid-to member field, amount field, or payment-source field  
When they choose `銀行轉帳`, keep today's payment date, and confirm  
Then the expense is marked `已退款`  
And one reimbursement payment evidence record is linked to the reimbursement batch

### Scenario: Required Payment Evidence Is Missing

Given a finance-capable member opens `確認退款` for a refundable member-paid expense  
When they submit without a payment method or payment date through the server action  
Then the refund is rejected  
And the expense remains `待退款`  
And no reimbursement batch or payment evidence record is created

### Scenario: Already Ineligible Records Cannot Be Refunded

Given a record is income, fund-paid, voided, already reimbursed, non-refundable, or the actor is unauthorized  
When a refund action is submitted directly  
Then the server rejects the action  
And no payment evidence is recorded  
And no reimbursement status changes

### Scenario: Batch Refund Same Member With One Payment

Given a finance-capable member selects multiple active member-paid refundable expenses for the same payer member on `/search`  
When they activate `批次退款`  
Then the dialog shows `將處理`, `略過`, and `退款總金額`  
And the refund form shows payment method, payment date, and transaction note only  
When they confirm with valid payment evidence  
Then one reimbursement batch is created  
And one payment evidence record is linked to that batch  
And all eligible selected expenses are marked `已退款`

### Scenario: Batch Refund Cross Member Is Not Completed

Given a finance-capable member selects refundable expenses for more than one payer member on `/search`  
When they activate `批次退款`  
Then `確認退款` is disabled  
And no additional cross-member explanatory warning is shown  
When a direct submission attempts to reimburse the cross-member selection  
Then the server rejects it  
And no selected expense is marked reimbursed

### Scenario: Reimbursement Payment Is Not A Ledger Expense

Given a valid reimbursement payment has been recorded  
When the monthly report is generated  
Then original income and expense totals are unchanged by the payment evidence  
And unpaid reimbursement totals no longer include the reimbursed expenses  
And record detail can trace the reimbursement payment evidence

### Scenario: Historical Reimbursed Record Has No Payment Evidence

Given an existing reimbursed expense was settled before payment evidence was introduced  
When the member opens the record detail after this slice is implemented  
Then the detail shows `已退款`  
And it shows a clear missing-payment-evidence state  
And it does not fabricate payment method, payment date, amount, or source data

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Single refund payment fields | `/` | finance-capable actor, active refundable member-paid expense | desktop | Open record detail; button `退款`; dialog heading `確認退款`; fields `付款方式`, `付款日期`, `交易備註`; no visible `退款表單`, `收款成員`, `退款金額`, or `付款來源` in the form block. |
| Single refund success | `/` | finance-capable actor, active refundable member-paid expense | desktop | Select `銀行轉帳`; date input has local date; confirm `確認退款`; success feedback mentions refund payment information; reopened detail shows `已退款`. |
| Required validation | server action or browser form | missing payment method/date | desktop | Submit without required payment evidence; assert error and unchanged `待退款`; no payment evidence readback. |
| Batch refund same member | `/search` | finance-capable actor, same-member refundable expenses | desktop | Enter selection mode; select two same-member refundable records; button `批次退款`; dialog heading `確認批次退款`; texts `將處理`, `略過`, `退款總金額`; fields `付款方式`, `付款日期`, `交易備註`; confirm success. |
| Batch refund cross member | `/search` | finance-capable actor, refundable expenses from two payer members | desktop | Select cross-member records; open `確認批次退款`; `確認退款` is disabled; no cross-member warning copy appears. |
| No double count | `/` or report read model | reimbursed expense with payment evidence | desktop | Capture refund; refresh monthly report; income/expense totals remain based on original ledger records; unpaid reimbursement total decreases. |
| Mobile refund form | `/` and `/search` | refundable expense and same-member batch | mobile | Payment method and payment date stack without clipping; transaction note remains single-line; footer buttons do not overlap. |

## Fixture And Data Strategy

- Reuse existing E2E seed members and reimbursement records where possible.
- Add or extend fixtures for:
  - one active member-paid refundable expense.
  - two active member-paid refundable expenses for the same payer member.
  - two active member-paid refundable expenses for different payer members.
  - already reimbursed records with no payment evidence for legacy readback.
  - income, fund-paid, voided, and non-refundable records for rejection coverage.
- Use existing auth/test member override strategy:
  - admin or finance manager for reimbursement success paths.
  - general member for unauthorized direct-submission rejection.
- Technical Design must decide whether existing seed SQL needs a reimbursement payment row or whether tests create it through server actions.

## Unit And Integration Test Plan

- Domain tests:
  - payment evidence required for reimbursement success.
  - payment method limited to `bank_transfer`, `cash`, `other`.
  - payment date required and date-only.
  - cross-member batch rejected.
  - amount must equal selected eligible expense total.
  - payment evidence does not change monthly income/expense totals.
- Server action / persistence tests:
  - single-record refund creates reimbursement batch, item, payment evidence, and updates ledger status in one transaction.
  - batch same-member refund creates one batch and one payment evidence row.
  - missing fields, invalid method, cross-member selection, unauthorized actor, and ineligible records reject without partial writes.
  - legacy reimbursed record without payment evidence can still be read.
- Component tests:
  - `ReimbursementPaymentFields` renders only three visible fields and no field-level icons.
  - batch refund dialog shows total on its own row.
  - cross-member batch disables confirm without showing extra warning copy.

## Accessible Selectors

- Single refund trigger: button `退款`.
- Single dialog: heading `確認退款`.
- Batch dialog: heading `確認批次退款`.
- Payment method: label `付款方式`.
- Payment date: label `付款日期`.
- Transaction note: label `交易備註`.
- Batch summary: texts `將處理`, `略過`, `退款總金額`.
- Confirm buttons: `確認退款`, `取消`.
- Success feedback: `已完成退款`, `已完成批次退款`.

## Responsive And Accessibility Checks

- Desktop and mobile dialogs must not overflow or clip field labels.
- `付款方式` and `付款日期` may sit side by side on desktop and stack on narrow viewports.
- `交易備註` remains a single-line input.
- Dialog focus trap, escape/close behavior, and button focus order follow existing Dialog behavior.
- Disabled `確認退款` must be programmatically disabled for cross-member batch state.
- No visible helper descriptions are required for the approved prototype, but server errors must be announced through existing alert patterns.

## Tracking And Learning Signals

- local_dev review should observe whether finance-capable users know what to enter in `交易備註`.
- learning should check whether users expect payment method to include additional household-specific options.
- production analytics are not required for this local_dev slice.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm acceptance criteria reflect the approved terse prototype.
  - Confirm BDD covers single refund, same-member batch refund, cross-member rejection, missing evidence, and no-double-count reporting.
  - Confirm test plan is sufficient before Feature Technical Design.
- must_check:
  - Technical Design must decide schema shape, transaction boundary, migration, and readback model.
  - TDD Implementation must write or enable tests before persistence changes.
  - Release readiness must include migration evidence.
- acceptance_signals:
  - Feature Technical Design can directly map AC to schema/API/UI changes.
  - E2E scenarios have stable Traditional Chinese selectors.
  - Out-of-scope reversal, partial refund, split methods, and edits remain excluded.
- unresolved_blockers:
  - None.
- next_step:
  - Feature Technical Design for `reimbursement-payment-flow`.
