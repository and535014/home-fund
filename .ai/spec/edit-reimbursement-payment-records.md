---
id: spec-edit-reimbursement-payment-records
stage: behavior-spec
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-reimbursement-payment-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/edit-reimbursement-payment-records.md
  - .ai/prototype/edit-reimbursement-payment-records.md
  - .ai/spec/reimbursement-payment-flow.md
  - .ai/spec/search-reimbursement-payment-records.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/edit-reimbursement-payment-records.md
  domain_impact:
    - .ai/domain-impact/edit-reimbursement-payment-records.md
  prototype:
    - .ai/prototype/edit-reimbursement-payment-records.md
  production_routes:
    - /
    - /search
  target_components:
    - src/app/_record-detail/reimbursement-payment-dialogs.tsx
    - src/app/_record-detail/reimbursement-payment-fields.tsx
    - src/app/(app)/search/_components/record-search-panel.tsx
  domain_modules:
    - src/modules/reimbursement/reimbursement-payment.ts
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/reporting/reimbursement-payment-search-query.ts
    - src/modules/identity-access/authorization.ts
  existing_e2e:
    - e2e/record-search.spec.ts
reviewed_at: 2026-06-27
---

# Edit Reimbursement Payment Records Behavior Spec

## Decision Summary

- decision: review_for_feature_technical_design
- prototype_status: user advanced to next gate after prototype commit `998846ad`
- primary_entry_points: `/search` refund-record detail, reimbursed expense payment readback
- editable_payment_fields: payment date, payment method, note
- non_editable_settlement_facts: amount, paid-to member, paid-from source, reimbursement batch, linked ledger records, recorded-by actor, reimbursed state
- permission_rule: admins and finance managers can edit household refund records; general members cannot edit
- payment_method_options: shared `REIMBURSEMENT_PAYMENT_METHOD_OPTIONS`
- success_feedback: toast `退款紀錄已更新`
- no_double_count_policy: reimbursement payment evidence remains outside ordinary ledger totals
- next_gate: Feature Technical Design

## Final Acceptance Criteria

1. An admin or finance manager can open a refund record detail from `/search`.
2. An admin or finance manager can open refund payment evidence from an already reimbursed expense detail.
3. Authorized refund record detail shows an `編輯` action.
4. A general member does not see the refund record `編輯` action.
5. Activating `編輯` opens a separate dialog titled `編輯退款紀錄`.
6. The original refund record detail dialog remains open behind the edit dialog.
7. The edit dialog contains no visible explanatory description text.
8. The edit dialog exposes exactly these editable fields: `付款日期`, `付款方式`, and `備註`.
9. `付款日期` is required and records date only.
10. `付款方式` is required and limited to `銀行轉帳`, `現金`, and `其他`.
11. `付款方式` options come from the shared reimbursement payment method option source.
12. `備註` is optional.
13. Empty `備註` is allowed and readback displays the existing empty-note copy consistently.
14. The edit dialog may display amount and 收款成員 as read-only settlement facts.
15. Refund amount is not editable and is not accepted by the update contract.
16. 收款成員 is not editable and is not accepted by the update contract.
17. Paid-from source is not editable and remains the household fund source.
18. Reimbursement batch, linked ledger records, recorded-by actor, and reimbursed state are not editable.
19. `取消` closes only the edit dialog and discards unsaved draft changes.
20. After cancel, the refund record detail readback still shows the original payment date, payment method, and note.
21. `儲存變更` with valid changes updates only payment date, payment method, and note.
22. Successful save closes the edit dialog.
23. Successful save refreshes or updates refund record detail readback.
24. Successful save shows a toast with text `退款紀錄已更新`.
25. If the changed payment date affects refund-record sorting or date filters, refreshed `/search` results follow the existing refund-record search rules.
26. Invalid payment date is rejected with field-specific Traditional Chinese feedback and no mutation.
27. Unsupported payment method is rejected with field-specific Traditional Chinese feedback and no mutation.
28. Unauthorized direct submission is rejected server-side and no mutation occurs.
29. Cross-household direct submission is rejected server-side and no mutation occurs.
30. Attempts to mutate amount, 收款成員, paid-from source, linked records, reimbursement batch, recorded-by actor, or reimbursed state are ignored or rejected by the server contract.
31. Editing refund evidence does not create an ordinary `LedgerRecord`.
32. Editing refund evidence does not change monthly income total, expense total, net total, category summaries, or unpaid reimbursement totals.
33. The linked reimbursed ledger records remain `已退款`.
34. Existing `查看關聯紀錄` behavior remains available from refund record detail.
35. Modal footer buttons use the default shared Button size.
36. UI copy remains Traditional Chinese using Taiwan usage.

## BDD Scenarios

### Scenario: Finance Manager Edits Refund Evidence

Given a finance manager opens an existing refund record detail  
When they activate `編輯`  
Then a separate `編輯退款紀錄` dialog opens  
And the fields are `付款日期`, `付款方式`, and `備註`  
When they change the payment date, payment method, and note  
And they activate `儲存變更`  
Then only those three fields are updated  
And the edit dialog closes  
And the refund record detail shows the updated values  
And a toast says `退款紀錄已更新`

### Scenario: Cancel Discards Draft Changes

Given an admin opens `編輯退款紀錄` for a refund record  
When they change payment date, payment method, or note  
And they activate `取消`  
Then the edit dialog closes  
And the refund record detail still shows the original values  
And no update command is completed

### Scenario: General Member Cannot Edit Refund Evidence

Given a general member opens a readable refund record detail  
When the detail dialog is shown  
Then no `編輯` action is available  
When a direct update submission is attempted for that refund record  
Then the server rejects the submission  
And the refund record remains unchanged

### Scenario: Invalid Edit Is Rejected

Given a finance manager opens `編輯退款紀錄`  
When they submit an invalid payment date or unsupported payment method  
Then field-specific Traditional Chinese feedback is shown  
And the edit dialog remains available for correction  
And no refund record fields are changed

### Scenario: Settlement Facts Stay Immutable

Given a refund record is linked to reimbursed ledger records  
When an update request includes amount, 收款成員, paid-from source, linked record IDs, reimbursement batch ID, recorded-by actor, or reimbursed state  
Then the server ignores or rejects those fields by contract  
And the original settlement facts remain unchanged

### Scenario: Corrected Evidence Does Not Affect Ledger Totals

Given a valid refund record has been corrected  
When monthly reports, category summaries, and ordinary ledger search are read  
Then income, expense, net total, and category totals are unchanged  
And the linked reimbursed ledger records remain excluded from unpaid reimbursement totals

### Scenario: Search Readback Reflects Corrected Evidence

Given a finance manager changes a refund record payment date, payment method, or note  
When they return to `/search` and search the `退款紀錄` tab  
Then the refund record readback shows the corrected evidence  
And date filtering and sorting use the corrected payment date

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Edit dialog shape | `/search` | admin or finance manager, refund record paid to Mei | desktop | Switch to `退款紀錄`; open row `查看付給 Mei 退款紀錄詳情`; dialog heading `退款紀錄`; button `編輯`; second dialog heading `編輯退款紀錄`; labels `付款日期`, `付款方式`, `備註`; no editable `金額` or `收款成員`. |
| Edit success | `/search` | finance manager, refund record with method/date/note | desktop | Change `付款日期`, select `現金`, fill `備註`; click `儲存變更`; assert toast `退款紀錄已更新`; detail shows updated values. |
| Cancel edit | `/search` | same refund record | desktop | Open edit dialog, change fields, click `取消`; assert original values remain visible in refund detail. |
| Unauthorized member | `/search` | general member can read refund detail but cannot manage reimbursement | desktop | Open refund detail; assert no `編輯`; direct action test asserts permission rejection. |
| Mobile dialog | `/search` | finance manager, refund record with long note | mobile 390x844 | Open edit dialog; labels and footer buttons do not overlap; `儲存變更` and `取消` use default button sizing. |
| Reimbursed expense readback | `/search` | already reimbursed expense with payment evidence | desktop | Open ordinary record detail; button `查看退款紀錄`; open refund detail; edit and save; reopened readback shows corrected evidence. |

## Fixture And Data Strategy

- Reuse existing E2E seed data where possible.
- Required refund evidence fixture:
  - paid-to member: `Mei`
  - amount: `$1,280`
  - initial payment date: `2026-06-18`
  - initial method: `銀行轉帳`
  - initial note: `末五碼 5521`
- Add or reuse actors:
  - admin for full permission coverage.
  - finance manager for the primary happy path.
  - general member for UI absence and server-side rejection.
- Include one cross-household reimbursement payment evidence row for negative server-action coverage.
- Technical Design must decide whether browser tests update seeded rows directly through the UI command or create isolated payment evidence per test.

## Accessible Selectors

- Refund tab: `退款紀錄`.
- Refund result trigger: `查看付給 <member> 退款紀錄詳情`.
- Refund detail dialog: heading `退款紀錄`.
- Edit trigger: button `編輯`.
- Edit dialog: heading `編輯退款紀錄`.
- Payment date: label `付款日期`.
- Payment method: label `付款方式`.
- Note: label `備註`.
- Cancel: button `取消`.
- Save: button `儲存變更`.
- Success toast: text `退款紀錄已更新`.
- Related records action: button `查看關聯紀錄`.

## Responsive And Accessibility Requirements

- The nested edit dialog must preserve existing Dialog focus trapping.
- Opening the edit dialog should move focus into the edit dialog.
- Closing the edit dialog should return focus to `編輯` or another stable control in the refund detail dialog where practical.
- Date, method, and note fields must have explicit labels.
- The footer buttons must not overlap or change size across mobile and desktop.
- Long notes must not push footer actions off screen.
- Non-editable settlement facts should be displayed as text, not disabled inputs.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/action | Admin and finance manager can update payment date, payment method, and note for a current-household refund record. |
| Domain/action | General member, unauthenticated actor, and cross-household actor cannot update refund evidence. |
| Domain/action | Invalid date and unsupported method reject without mutation. |
| Domain/action | Non-editable settlement facts remain unchanged even if submitted. |
| Domain/action | Empty note is accepted and readback uses the existing empty-note display rule. |
| Reporting/query | Corrected refund evidence appears in refund-record detail and `/search` readback. |
| Reporting/query | Corrected `paidOn` drives refund-record date filters and sort order after refresh. |
| Reporting/query | Monthly totals, ordinary ledger search, category summaries, and unpaid reimbursement totals remain unaffected by evidence edits. |
| Component | Refund detail shows `編輯` only when allowed by the passed authorization state. |
| Component | Edit dialog renders only `付款日期`, `付款方式`, and `備註` as editable fields. |
| Component | Cancel discards draft state and save shows success feedback from the mutation result. |
| E2E | Finance manager can edit refund evidence from `/search` and sees toast `退款紀錄已更新`. |
| E2E | Cancel leaves readback unchanged. |
| E2E | General member cannot access the edit affordance. |

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm permission rule: admins and finance managers can edit, general members cannot.
  - Confirm the editable fields remain exactly `付款日期`, `付款方式`, and `備註`.
  - Confirm success toast text remains `退款紀錄已更新`.
  - Confirm modal copy remains description-free.
  - Confirm default shared Button sizing is expected.
- must_check:
  - Feature Technical Design must choose update contract shape, server action boundary, cache refresh, and whether direct overwrite needs edited-at or edited-by metadata.
  - Implementation must keep authorization server-side and cannot rely on hidden UI controls.
  - Reporting must preserve no-double-count behavior after correction.
- acceptance_signals:
  - Behavior is specific enough to write tests before implementation.
  - Prototype gaps are captured as technical-design responsibilities.
  - The spec does not expand into reversal, deletion, amount edits, or ordinary ledger edits.
- unresolved_blockers:
  - Whether MVP requires correction metadata such as edited-at and edited-by.
- next_step:
  - Feature Technical Design for `edit-reimbursement-payment-records`.
