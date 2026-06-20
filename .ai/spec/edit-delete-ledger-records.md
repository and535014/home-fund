---
id: spec-edit-delete-ledger-records
stage: behavior-spec
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-delete-ledger-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/edit-delete-ledger-records.md
  - .ai/prototype/edit-delete-ledger-records.md
  - .ai/spec/story-ledger-record-corrections.md
  - src/modules/fund-ledger/ledger-record-corrections.ts
  - e2e/dashboard.spec.ts
  - e2e/permission-matrix.spec.ts
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/edit-delete-ledger-records.md
  domain_impact:
    - .ai/domain-impact/edit-delete-ledger-records.md
  prototype:
    - .ai/prototype/edit-delete-ledger-records.md
  production_routes:
    - /
    - /reimbursements
  target_components:
    - src/app/record-list-detail.tsx
    - src/app/(app)/page.tsx
    - src/app/ledger-record-actions.ts
  domain_modules:
    - src/modules/fund-ledger/ledger-record-corrections.ts
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/identity-access/authorization.ts
    - src/modules/reporting/monthly-report.ts
    - src/modules/reimbursement/reimbursement-table.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-21
---

# Edit and Delete Ledger Records Behavior Spec

## Decision Summary

- decision: proceed_to_feature_technical_design
- prototype_status: accepted by user feedback for Behavior Spec
- route: `/`
- user-facing_delete_language: `刪除`
- domain_delete_semantics: soft delete / `voided`
- reimbursed_expense_policy: block edit/delete for MVP until reimbursement reversal exists
- next_gate: Feature Technical Design
- reason: Intent, domain discovery, and prototype are now aligned on record-detail edit/delete, role-based action visibility, soft-delete behavior, toast feedback, and blocked reimbursed expenses.

## Final Acceptance Criteria

1. Users open edit/delete actions from the existing dashboard record detail modal on `/`.
2. No standalone `/records` route is restored for this slice.
3. General members can edit records they created.
4. General members can delete records they created.
5. General members cannot see edit/delete actions for records created by other members.
6. General members cannot edit/delete another member's record through direct server action attempts.
7. Admins can edit and delete any non-reimbursed ledger record.
8. Finance managers can edit any non-reimbursed ledger record.
9. Finance managers can delete only records they created; they cannot delete another member's record.
10. Already reimbursed member-paid expenses do not expose edit/delete actions for any role in MVP.
11. Already reimbursed member-paid expenses show Traditional Chinese blocked copy explaining that reimbursement reversal is required before editing or deleting.
12. Edit form supports updating name, amount, date, note, category, and payer/source member unless Technical Design narrows the first implementation slice with accepted risk.
13. Edit validation rejects missing name, invalid amount, invalid date, missing category, archived category, category type mismatch, missing income source member, missing member payer, and fund-paid expense with member payer.
14. Editing a non-reimbursed member-paid expense can update reimbursement implications; the refreshed dashboard and reimbursement table must reflect the new values.
15. Successful edit closes all active record dialogs, refreshes affected page data, and shows a success toast `紀錄已更新`.
16. Delete requires a destructive confirmation dialog in Traditional Chinese.
17. Confirming delete applies a soft-delete / voided lifecycle state, not physical hard deletion.
18. Successful delete closes all active record dialogs immediately and shows a success toast `紀錄已刪除`.
19. Cancelling delete returns to the record detail without mutating data.
20. Voided records are excluded from dashboard record list, monthly totals, category summaries, and refundable reimbursement calculations.
21. Voided records retain enough persisted identity to preserve audit trace and existing reimbursement-batch relationships.
22. Server-side authorization is authoritative; hidden UI actions are not the security boundary.
23. UI copy remains Traditional Chinese and dark-theme-first.
24. Dialog focus behavior remains accessible: opening moves focus into the dialog; closing returns focus to the originating record row where practical.
25. Mobile viewport supports opening record detail, edit dialog, delete confirmation, toast feedback, and close behavior without clipped controls.

## BDD Scenarios

### Scenario: Record Owner Edits An Active Record

Given a general member owns an active expense record on the dashboard  
When the member opens the record detail  
And activates `編輯`  
And changes the name, amount, date, category, payer, or note  
And saves the form  
Then the edit is persisted  
And all record dialogs close  
And a toast says `紀錄已更新`  
And the dashboard totals, category summary, record list, and reimbursement table reflect the updated record

### Scenario: Owner Deletes An Active Record

Given a general member owns an active record on the dashboard  
When the member opens the record detail  
And activates `刪除`  
Then a confirmation dialog explains that the record will leave monthly views and reimbursement calculations  
When the member activates `確認刪除`  
Then the record is marked voided  
And all record dialogs close  
And a toast says `紀錄已刪除`  
And the record no longer appears in the active dashboard record list or active monthly totals

### Scenario: Delete Cancellation Returns To Detail

Given a user can delete an active record  
When the user opens delete confirmation from record detail  
And activates `取消`  
Then the record detail is shown again  
And no ledger record is voided  
And no success toast is shown

### Scenario: General Member Cannot Mutate Another Member Record

Given a general member opens a record created by another member  
When the record detail is shown  
Then `編輯` is not visible  
And `刪除` is not visible  
When the member attempts direct edit or delete through a server action  
Then the request is rejected with permission denied  
And the record remains active and unchanged

### Scenario: Admin Edits And Deletes Another Member Record

Given an admin opens an active record created by another member  
Then `編輯` and `刪除` are visible  
When the admin saves a valid edit  
Then a toast says `紀錄已更新`  
When the admin confirms delete for an active record  
Then the record is voided and a toast says `紀錄已刪除`

### Scenario: Finance Manager Edits But Cannot Delete Another Member Record

Given a finance manager opens an active record created by another member  
Then `編輯` is visible  
And `刪除` is not visible  
When the finance manager saves a valid edit  
Then the record is updated and a toast says `紀錄已更新`  
When the finance manager attempts direct delete through a server action  
Then the request is rejected with `finance_manager_cannot_delete_other_member_record`

### Scenario: Reimbursed Expense Is Blocked

Given a member-paid expense has reimbursement status `已退款`  
When an owner, admin, or finance manager opens its detail  
Then `編輯` is not visible  
And `刪除` is not visible  
And blocked copy explains that reimbursement reversal is required before editing or deleting

### Scenario: Voided Records Are Excluded From Read Models

Given a member-paid expense is refundable and appears in dashboard totals, category summary, record list, and reimbursement table  
When an authorized user confirms delete  
Then the record becomes voided  
And the dashboard totals exclude the amount  
And the category summary excludes the amount and record ID  
And the dashboard record list excludes the record  
And the reimbursement table excludes the expense from refundable totals

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Owner edit success | `/?month=2026-06` | `x-e2e-auth-user-id: user-e2e-general` owns active record | desktop | open button `查看<name>詳情`; click `編輯`; dialog heading `編輯紀錄`; update labeled fields; click `儲存變更`; dialog count 0; toast `紀錄已更新`; updated record visible. |
| Owner delete success | `/?month=2026-06` | general owner with active record | desktop | open detail; click `刪除`; dialog heading `刪除紀錄`; click `確認刪除`; dialog count 0; toast `紀錄已刪除`; record absent; summary amount changes. |
| Delete cancel | `/?month=2026-06` | owner with active record | desktop | open detail; click `刪除`; click `取消`; detail title visible; record still visible after close/reopen; no success toast. |
| General read-only other record | `/?month=2026-06` | `user-e2e-general` with another member's active record visible | desktop | open other member record; assert no button `編輯`; no button `刪除`; detail values visible. |
| Admin mutates other record | `/?month=2026-06` | `user-e2e-admin` with another member record | desktop | open detail; buttons `編輯` and `刪除` visible; save edit toast; delete confirmation toast in separate seeded record. |
| Finance manager edit-only other record | `/?month=2026-06` | `user-e2e-linked` or finance user with another member record | desktop | open detail; button `編輯` visible; button `刪除` hidden; direct delete integration/domain test rejects. |
| Reimbursed blocked | `/?month=2026-06` | reimbursed member-paid expense | desktop | open detail; text `已退款`; blocked copy visible; no `編輯`; no `刪除`. |
| Mobile dialog stack | `/?month=2026-06` | owner with active record | mobile | open detail, edit, delete; controls fit viewport; no clipped footer; delete confirm closes dialog and shows toast. |
| Reimbursement exclusion | `/reimbursements?month=2026-06` plus `/` | refundable member-paid expense | desktop | record appears in pending reimbursement total before delete; after delete from `/`, `/reimbursements` excludes it. |

## Fixture And Data Strategy

- Extend E2E seed data with:
  - one active income record owned by the general member.
  - one active fund-paid expense owned by the general member.
  - one active member-paid refundable expense owned by the general member.
  - one active record owned by another member and visible to the general member.
  - one active record owned by another member for admin/finance-manager role checks.
  - one reimbursed member-paid expense for blocked-state checks.
- Existing controlled auth headers remain the role-switching mechanism: `x-e2e-auth-user-id` for admin, finance manager, and general member.
- Direct server-action or command tests should cover unauthorized mutation attempts that are not reachable through normal UI.
- Existing records must default to active when the lifecycle field is introduced.

## Accessible Selectors

- Record list region: role `region`, name `紀錄`.
- Record detail trigger: button name `查看<record name>詳情`.
- Detail dialog title: record name.
- Edit action: button `編輯`.
- Delete action: button `刪除`.
- Edit dialog title: heading `編輯紀錄`.
- Edit fields: labels `名稱`, `金額`, `日期`, `分類`, `支付者`, `備註`.
- Save action: button `儲存變更`.
- Delete dialog title: heading `刪除紀錄`.
- Delete confirmation: button `確認刪除`.
- Cancel action: button `取消`.
- Success toast text: `紀錄已更新`, `紀錄已刪除`.
- Reimbursed blocked copy: contains `已退款` and `退款沖銷`.

## Responsive And Accessibility Requirements

- Desktop edit form uses two columns where space allows and stacks on narrow viewports.
- Mobile dialogs must keep footer buttons reachable without text clipping.
- Button labels include icons plus text, not icon-only controls.
- Destructive delete uses existing destructive styling and a clear record summary.
- Dialog close, save success, delete success, and escape/overlay close should not leave keyboard focus stranded.
- Success toast is required, but refreshed visible data must also prove the mutation.
- Hidden unavailable actions are acceptable for unauthorized users; reimbursed blocked state needs visible explanation.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/unit | Update command authorizes owner/admin/finance manager and rejects general-member edits to other records. |
| Domain/unit | Delete/void command authorizes owner/admin, rejects finance-manager deletion of other records, and rejects general-member deletion of other records. |
| Domain/unit | Update validation rejects invalid amount/date/category/type/member/payment-source states. |
| Domain/unit | Reimbursed member-paid expenses are blocked from edit/delete for MVP. |
| Domain/unit | Void command returns `Ledger record voided` semantics rather than hard-delete semantics. |
| Data/integration | Persistence adds an active/voided lifecycle field and defaults existing records to active. |
| Data/integration | Dashboard, reporting, and reimbursement queries exclude voided records through a shared active-record boundary. |
| Server action/integration | Edit and delete server actions enforce authorization independently from UI visibility and revalidate `/` and `/reimbursements`. |
| Component | Record detail renders action visibility for owner/admin/finance/general roles and reimbursed blocked state. |
| E2E | Owner edit/delete, admin edit/delete, finance edit-only, general read-only, reimbursed blocked, toast feedback, delete close-all behavior, mobile layout. |
| Manual | Smoke totals before/after edit/delete and verify focus return from dialog close/success. |

## Technical Design Inputs

- Decide Prisma lifecycle shape, likely a `LedgerRecordStatus` or equivalent active/voided field, with migration backfill.
- Align existing `src/modules/fund-ledger/ledger-record-corrections.ts` from `deletedRecordId` / `Ledger record deleted` toward voided record semantics.
- Decide server action names, form parsing, field-level errors, optimistic/pending states, and success action-state contracts.
- Decide whether the first implementation edits category and payer/source member fully or narrows those fields with accepted risk.
- Decide shared active-record filtering location so dashboard, monthly report, and reimbursement table cannot diverge.
- Decide how voided records preserve audit trace without appearing in active UI.
- Decide whether recurring occurrences linked to a voided record need special display or are out of this slice.
- Decide toast IDs and close/refresh ordering to avoid duplicate toasts or stale detail state.

## Accepted Risks

- Full audit/history UI for voided records is out of scope for MVP local_dev.
- Reimbursement reversal is out of scope; already reimbursed member-paid expenses are blocked instead.
- Prototype edit form currently shows category and payer/source as read-only display; this spec asks Technical Design to decide whether implementation expands them immediately.
- Production readiness is not assessed in this gate.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm reimbursed member-paid expenses are blocked for MVP.
  - Confirm edit field scope before Feature Technical Design narrows or expands it.
  - Confirm soft-delete / voided records should disappear from active UI while preserving trace.
- must_check:
  - Acceptance criteria cover UI, permissions, server authorization, read models, toast feedback, and responsive behavior.
  - E2E design names routes, fixtures, viewports, selectors, and expected states.
  - Test plan includes domain, persistence, server action, component, E2E, and manual coverage.
- acceptance_signals:
  - Feature Technical Design can decide schema, server actions, data filters, and component boundaries.
  - TDD can write failing tests before implementation.
- unresolved_blockers:
  - None for Feature Technical Design if edit-field scope is accepted or explicitly narrowed there.
- next_step:
  - Feature Technical Design for `edit-delete-ledger-records`.
