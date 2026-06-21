---
id: spec-record-detail-reimbursement
stage: behavior-spec
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-detail-reimbursement.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/record-detail-reimbursement.md
  - .ai/prototype/record-detail-reimbursement.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/record-detail-reimbursement.md
  domain_impact:
    - .ai/domain-impact/record-detail-reimbursement.md
  prototype:
    - .ai/prototype/record-detail-reimbursement.md
  production_routes:
    - /
    - /reimbursements
  target_components:
    - src/app/record-list-detail.tsx
    - src/app/ledger-record-actions.ts
  domain_modules:
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/reimbursement/reimbursement-table.ts
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/identity-access/authorization.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-21
---

# Record Detail Reimbursement Behavior Spec

## Decision Summary

- decision: proceed_to_feature_technical_design_after_review
- prototype_status: approved
- route: `/`
- primary_surface: dashboard `紀錄` detail dialog
- user_action_label: `退款`
- confirmation_title: `確認退款`
- final_status_label: `已退款`
- blocked_copy: `這筆代墊支出已退款，無法編輯或刪除。`
- next_gate: Feature Technical Design

## Final Acceptance Criteria

1. Eligible active member-paid refundable expenses expose a `退款` action from the existing dashboard record detail dialog.
2. Admins and finance managers can perform the `退款` action.
3. General members cannot see or submit the `退款` action for another member's refundable expense.
4. Income records do not expose `退款`.
5. Fund-paid expenses do not expose `退款`.
6. Voided records do not expose `退款`.
7. Already reimbursed expenses do not expose `退款`.
8. Pressing `退款` opens a confirmation dialog titled `確認退款`.
9. The confirmation dialog uses concise user-facing copy: `將此紀錄標記為已退款。`
10. The confirmation dialog shows the same record summary layout used by the dashboard record list.
11. The confirmation dialog shows a warning alert that says confirming will make the record `已退款` and unable to be edited or deleted.
12. Cancelling confirmation returns to the record detail without changing status or totals.
13. Confirming reimbursement marks exactly one selected expense as reimbursed.
14. Reimbursement remains one-time; an already reimbursed expense cannot be reimbursed again through UI or direct server action.
15. Successful reimbursement leaves the user in the detail flow with status `已退款` visible.
16. Successful reimbursement shows a toast `已完成退款`.
17. After successful reimbursement, edit, delete, and refund actions are not available for that record.
18. Already reimbursed records show `這筆代墊支出已退款，無法編輯或刪除。`
19. Successful reimbursement updates dashboard reimbursement summary and `/reimbursements` pending totals after refresh.
20. Server-side authorization and eligibility checks are authoritative; hidden buttons are not the security boundary.
21. UI copy remains Traditional Chinese and avoids technical or unimplemented behavior descriptions.
22. Desktop and mobile dialogs keep footer actions visible without clipped text.
23. Dialog focus remains accessible: opening traps focus, cancel returns to detail, and closing the detail returns focus to the originating record row where practical.

## BDD Scenarios

### Scenario: Finance User Reimburses A Refundable Expense From Detail

Given an admin or finance manager opens the dashboard for a month with a refundable member-paid expense  
When they open that record detail  
Then the `退款` action is visible  
When they activate `退款`  
Then a `確認退款` dialog opens  
And the dialog shows the selected record summary  
And the warning says the record will show `已退款` and cannot be edited or deleted  
When they activate `確認退款`  
Then the selected expense is marked reimbursed once  
And the detail status shows `已退款`  
And a toast says `已完成退款`  
And `編輯`, `刪除`, and `退款` are not visible for that record

### Scenario: Reimbursement Confirmation Can Be Cancelled

Given a finance user opens a refundable member-paid expense detail  
When they activate `退款`  
And then activate `取消` in the confirmation dialog  
Then the detail view returns  
And the status remains `待退款`  
And no reimbursement batch is created  
And no success toast is shown

### Scenario: General Member Cannot Reimburse Another Member Expense

Given a general member opens a refundable expense created or paid by another member  
When the record detail is shown  
Then `退款` is not visible  
When the member attempts a direct reimbursement action  
Then the request is rejected  
And the expense remains `待退款`

### Scenario: Ineligible Records Do Not Offer Refund

Given a user opens an income record, fund-paid expense, voided record, or already reimbursed expense  
When the record detail is shown  
Then `退款` is not visible  
And no reimbursement state changes are available from that detail

### Scenario: Already Reimbursed Expense Is Protected

Given a member-paid expense has status `已退款`  
When any household user with record access opens its detail  
Then the detail shows `已退款`  
And the copy says `這筆代墊支出已退款，無法編輯或刪除。`  
And `編輯`, `刪除`, and `退款` are not visible

### Scenario: Duplicate Reimbursement Is Rejected

Given an expense was already marked `已退款`  
When an authorized user submits a reimbursement request for the same expense again  
Then the request is rejected as already reimbursed  
And no duplicate reimbursement batch item is created  
And pending reimbursement totals do not change

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Finance reimburse success | `/?month=2026-06` | finance/admin user, active member-paid refundable expense | desktop | open button `查看<name>詳情`; detail shows `待退款`; click `退款`; dialog heading `確認退款`; click `確認退款`; toast `已完成退款`; detail shows `已退款`; no `編輯`, `刪除`, or `退款`. |
| Cancel reimbursement | `/?month=2026-06` | finance/admin user, active member-paid refundable expense | desktop | open detail; click `退款`; click `取消`; detail shows original title and `待退款`; no success toast. |
| General member blocked | `/?month=2026-06` | general user viewing another member's refundable expense | desktop | open detail; assert no button `退款`; status remains `待退款`; direct action covered by integration test. |
| Ineligible records | `/?month=2026-06` | income record and fund-paid expense | desktop | open details; assert no button `退款`; visible status is `---` or `不需退款`. |
| Already reimbursed blocked | `/?month=2026-06` | already reimbursed member-paid expense | desktop | open detail; text `已退款`; copy `這筆代墊支出已退款，無法編輯或刪除。`; no `編輯`, `刪除`, or `退款`. |
| Pending totals refresh | `/reimbursements?month=2026-06` and `/` | refundable expense included in reimbursement table | desktop | verify expense appears before reimbursement; reimburse from `/`; revisit `/reimbursements`; expense no longer appears in pending list. |
| Mobile confirmation | `/?month=2026-06` | finance/admin user, active refundable expense | mobile | open detail and confirmation; footer buttons `取消` and `確認退款` are visible and not clipped. |

## Fixture And Data Strategy

- Extend E2E seed data with:
  - one active member-paid refundable expense visible in the dashboard record list.
  - one active fund-paid expense.
  - one income record.
  - one already reimbursed member-paid expense.
  - one refundable expense owned or paid by another member for general-member visibility checks.
- Use existing controlled auth headers:
  - admin user for admin reimbursement path.
  - finance manager user for finance reimbursement path.
  - general member user for blocked UI path.
- Reuse existing month `2026-06` where possible.
- Direct unauthorized and duplicate submissions should be covered by server-action/integration tests rather than only browser UI.

## Accessible Selectors

- Dashboard record region: `紀錄`.
- Record trigger: button name `查看<record name>詳情`.
- Refund action: button `退款`.
- Confirmation dialog title: heading `確認退款`.
- Confirmation description: text `將此紀錄標記為已退款。`
- Warning alert: text `確認後，狀態會顯示為已退款，且無法編輯或刪除。`
- Confirm action: button `確認退款`.
- Cancel action: button `取消`.
- Success toast: `已完成退款`.
- Final status: `已退款`.
- Blocked copy: `這筆代墊支出已退款，無法編輯或刪除。`

## Responsive And Accessibility Requirements

- Buttons include icon plus visible text.
- Confirmation dialog uses existing Dialog focus behavior.
- Warning copy uses `Alert variant="warning"` and semantic warning icon color.
- Record summary in the confirmation uses the shared dashboard record summary content.
- On mobile, the confirmation dialog must not clip the record summary, warning, or footer controls.
- Cancelling confirmation returns to the detail dialog without losing keyboard focus.
- Closing the record detail returns focus to the originating record trigger where practical.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/unit | `markExpensesReimbursed` marks one selected refundable expense reimbursed and rejects already reimbursed, not refundable, fund-paid, income, and voided records. |
| Domain/unit | Authorization allows admin and finance manager reimbursement and rejects general member reimbursement. |
| Data/integration | Single-expense reimbursement creates/reuses the standard reimbursement batch path and updates only the selected ledger record to `reimbursed`. |
| Server action/integration | Direct action rejects unauthorized actor, ineligible record, missing record, voided record, and duplicate reimbursement. |
| Server action/integration | Successful action revalidates `/` and `/reimbursements`. |
| Component | Record detail renders `退款` only for eligible records and hides it for income, fund-paid, voided, already reimbursed, and unauthorized states. |
| Component | Confirmation dialog renders shared record summary, warning alert, cancel, and confirm actions. |
| E2E | Finance/admin success path, cancellation, general member blocked path, ineligible records, already reimbursed blocked copy, pending totals refresh, and mobile confirmation layout. |
| Manual | Review Traditional Chinese copy, dark-theme contrast, icon semantics, and focus return. |

## Technical Design Inputs

- Decide whether to add a dedicated single-record server action or wrap the existing selected-expenses reimbursement action with one ID.
- Reuse existing ReimbursementBatch persistence for traceability.
- Ensure the transaction loads active records only and validates member-paid/refundable eligibility.
- Decide final action-state shape and error messages for unauthorized, ineligible, already reimbursed, and not found.
- Revalidate `/` and `/reimbursements` after success.
- Decide whether success keeps the detail open with refreshed data or closes and reopens through page refresh; behavior requirement is that the user sees `已退款`.

## Accepted Risks

- Reimbursement reversal remains out of scope.
- Production readiness is not assessed in this gate.
- Full visual screenshot baseline is deferred unless E2E flakiness or layout risk increases.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - Confirm final AC matches the reviewed prototype.
  - Confirm E2E fixtures are enough for local_dev.
  - Confirm success should keep visible `已退款` status in the detail flow.
- must_check:
  - Spec does not require unapproved `/reimbursements` page redesign.
  - One-time reimbursement and direct-action rejection are covered.
  - Copy remains user-facing and Traditional Chinese.
- acceptance_signals:
  - Feature Technical Design can decide server action, transaction, persistence, and revalidation boundaries.
  - TDD can start from domain/server-action/component/E2E tests.
- unresolved_blockers:
  - None for Feature Technical Design after reviewer approval.
- next_step:
  - Feature Technical Design for `record-detail-reimbursement`.
