---
id: spec-batch-search-record-actions
stage: behavior-spec
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/batch-search-record-actions.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/batch-search-record-actions.md
  - .ai/prototype/batch-search-record-actions.md
  - .ai/archive/archive-record-search-sort-filter-2026-06-21.md
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
  - .ai/archive/archive-edit-delete-ledger-records-2026-06-21.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/batch-search-record-actions.md
  domain_impact:
    - .ai/domain-impact/batch-search-record-actions.md
  prototype:
    - .ai/prototype/batch-search-record-actions.md
  production_routes:
    - /search
    - /reimbursements
  target_components:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-panel.tsx
    - src/app/record-list-detail.tsx
    - src/components/layout/page-layout.tsx
    - src/app/dashboard-navigation.ts
    - src/app/ledger-record-actions.ts
  domain_modules:
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/fund-ledger/ledger-record-corrections.ts
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/identity-access/authorization.ts
  existing_e2e:
    - e2e/record-search.spec.ts
    - e2e/dashboard.spec.ts
    - e2e/create-record.spec.ts
reviewed_at: 2026-06-22
---

# Batch Search Record Actions Behavior Spec

## Decision Summary

- decision: proceed_to_feature_technical_design_after_review
- prototype_status: accepted by user feedback for Behavior Spec
- primary_route: `/search`
- removed_route: `/reimbursements`
- selection_entry: icon-only `開啟選取模式` button next to filter
- all_select_copy: `全選目前顯示`
- all_select_scope: currently displayed rows only
- batch_outcome_policy: partial success with skipped records summary
- amount_summary_policy: income contributes positive amount, expense contributes negative amount; UI shows absolute total with income/expense color
- pagination_policy: real server pagination/cursor design required in Technical Design with 100 records per page; prototype infinite loading is not persistence behavior
- next_gate: Feature Technical Design

## Final Acceptance Criteria

1. `/search` remains the primary surface for searching, filtering, viewing details, and starting batch record actions.
2. Search results do not show selection controls until the user enters selection mode.
3. Selection mode is toggled by an icon-only button with accessible names `開啟選取模式` and `關閉選取模式`.
4. In normal mode, activating a result row opens the existing record detail flow.
5. In selection mode, each visible result has a compact selection control with selected/unselected accessible state.
6. Turning selection mode off clears selected records.
7. Changing keyword search or filter/sort criteria clears selected records and resets result loading to the first batch.
8. Before any search keyword or filter is active, the page footer is not shown.
9. When a query is active and selection mode is off, the page footer shows `搜尋結果 <n> 筆` and `總額 <amount>`.
10. The normal footer total uses income as positive and expense as negative, then displays the absolute value with positive/negative color.
11. When selection mode is on, the page footer shows `已選取 <n> 筆` and the selected-record total only.
12. The selection-mode total uses income as positive and expense as negative, then displays the absolute value with positive/negative color.
13. The page footer uses the shared `PageFooter` component, stays outside the scrolling result list, has only a top border, and does not use card, badge, or icon treatment.
14. `全選目前顯示` selects only rows currently displayed in the result list.
15. Once all currently displayed rows are selected, the all-select control is disabled and reads `已全選目前顯示`.
16. `清除選取` is the only control that clears the selected set.
17. Search results progressively load more rows as the user scrolls near the bottom.
18. Server-backed search pagination returns 100 records per page.
19. The progressive loading sentinel uses Traditional Chinese copy `載入更多紀錄...`.
20. Batch delete is disabled when no selected record is eligible for deletion.
21. Batch refund is disabled when no selected record is eligible for reimbursement.
22. Batch delete button count is shown in parentheses, for example `批次刪除 (3)`.
23. Batch refund button count is shown in parentheses, for example `批次退款 (2)`.
24. Batch delete opens `確認批次刪除`.
25. Batch refund opens `確認批次退款`.
26. Batch confirmations show processed and skipped counts before mutation.
27. Batch refund confirmation shows `退款總金額` for the eligible records that will be processed.
28. Batch actions use partial success: eligible selected records are processed, and ineligible or unauthorized selected records are skipped.
29. Skipped records remain unchanged and are clearly explained in the confirmation/result flow.
30. Batch delete voids eligible active ledger records using the existing deletion semantics; it does not hard-delete records.
31. Batch refund marks eligible active member-paid refundable expenses as reimbursed once using the existing reimbursement semantics.
32. Already reimbursed, voided, fund-paid, income, and unauthorized records are never reimbursed by batch refund.
33. Unauthorized or ineligible records are never voided by batch delete.
34. Server-side authorization and eligibility checks are authoritative; client-side disabled states are not the security boundary.
35. Successful batch delete refreshes search results, active totals, category summaries, and reimbursement-derived read models.
36. Successful batch refund refreshes search results, reimbursement status, and unpaid reimbursement totals.
37. Successful batch actions show Traditional Chinese success feedback.
38. `/reimbursements` is not present in primary navigation.
39. Direct visits to `/reimbursements` show the framework default 404 behavior; there is no redirect and no replacement reimbursement page.
40. Existing E2E tests that expected `/reimbursements` as a placeholder must be updated or removed.
41. UI copy remains Traditional Chinese and must not imply external money transfer.

## BDD Scenarios

### Scenario: Search Results Stay In Normal Detail Mode By Default

Given an authenticated household member opens `/search`  
And enters a keyword or applies a filter with matching records  
Then the page footer shows the search result count and total amount  
And result rows do not show selection controls  
When the member activates a result row  
Then the existing record detail dialog opens

### Scenario: User Enters And Leaves Selection Mode

Given an authenticated household member has active search results on `/search`  
When they activate `開啟選取模式`  
Then visible result rows show compact selection controls  
And the footer switches to selected-count and selected-total mode  
When they select two records  
Then the footer shows `已選取 2 筆`  
When they activate `關閉選取模式`  
Then selection controls disappear  
And selected records are cleared

### Scenario: Query Change Clears Selection

Given a member is in selection mode with selected records  
When they change the keyword search or apply filter/sort changes  
Then selected records are cleared  
And result loading starts again from the first batch  
And no hidden previous selection remains available for batch actions

### Scenario: User Selects All Current Search Results

Given a member is in selection mode with active search results  
When they activate `全選目前顯示`  
Then all currently displayed rows are selected  
And the footer total reflects the selected set  
And the all-select control reads `已全選目前顯示` and is disabled  
When they activate `清除選取`  
Then the selected set is empty

### Scenario: Search Results Load Progressively

Given a query has more than 100 matching results  
When the member scrolls near the bottom of the result list  
Then the next 100 matching rows are loaded automatically  
And the footer remains fixed outside the scrolling result list  
And the footer count and total continue to represent the current matched result set
And newly loaded rows are not automatically selected unless the member selects them or activates `全選目前顯示` again

### Scenario: Batch Delete Processes Eligible Records And Skips Others

Given a member has selected records with mixed delete eligibility  
When they activate `批次刪除 (<eligible count>)`  
Then a `確認批次刪除` dialog opens  
And it shows how many records will be processed  
And it shows how many records will be skipped  
When they confirm  
Then eligible records are voided  
And skipped records remain unchanged  
And active search results and related read models refresh

### Scenario: Batch Refund Shows Refund Total And Skips Ineligible Records

Given an admin or finance manager has selected refundable and non-refundable records  
When they activate `批次退款 (<eligible count>)`  
Then a `確認批次退款` dialog opens  
And it shows processed and skipped counts  
And it shows `退款總金額` for eligible refundable expenses only  
When they confirm  
Then eligible member-paid refundable expenses are marked `已退款` once  
And ineligible records remain unchanged  
And unpaid reimbursement totals refresh

### Scenario: Unauthorized Member Cannot Batch Mutate Other Records

Given a general member selects records they are not allowed to delete or reimburse  
When the batch action controls are evaluated  
Then those records do not contribute to the eligible count  
When the member attempts a direct batch action submission  
Then the server rejects unauthorized records  
And no unauthorized record is voided or reimbursed

### Scenario: Standalone Reimbursement Page Is Removed

Given any authenticated household member uses primary navigation  
Then no `退款` navigation item is visible  
When the member visits `/reimbursements` directly  
Then the framework default 404 page is shown  
And the browser is not redirected to `/search` or `/`

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Normal search footer and detail flow | `/search` | authenticated member, active records | desktop | Search input `搜尋紀錄`; result row button `查看<name>詳情`; footer text `搜尋結果`; footer text `總額`; no selection controls before mode toggle. |
| Selection mode toggle | `/search` | active records | desktop | Button `開啟選取模式`; selection buttons `選取<name>`; selected footer `已選取 0 筆`; button `關閉選取模式`; selection controls disappear. |
| Select and clear records | `/search` | at least two visible records | desktop | Select two records; footer `已選取 2 筆`; button `清除選取`; footer `已選取 0 筆`. |
| All selected state | `/search` | query with multiple visible results | desktop | Button `全選目前顯示`; after click, button `已全選目前顯示` is disabled; newly loaded rows are not selected automatically; `清除選取` clears selected state. |
| Progressive loading | `/search` | seed more than 100 matching records or test fixture override | desktop | Scroll result list to `載入更多紀錄...`; next 100-record batch appears; footer remains visible and outside scroll region. |
| Batch delete confirmation | `/search` | selected records with delete eligible and skipped cases | desktop | Button `批次刪除 (<n>)`; dialog heading `確認批次刪除`; texts `將處理`, `略過`; confirm `確認刪除`; success feedback. |
| Batch refund confirmation | `/search` | selected refundable and ineligible records | desktop | Button `批次退款 (<n>)`; dialog heading `確認批次退款`; texts `將處理`, `略過`, `退款總金額`; confirm `確認退款`; success feedback. |
| Navigation removal | `/` or `/search` | finance/admin user | desktop | Link `搜尋` visible; link `退款` absent; direct `/reimbursements` shows heading/text for default 404. |
| Mobile footer | `/search` | active query and selection mode | mobile | Footer stacks without overlap; selected count, total, all-select, clear, delete, and refund controls fit and remain outside result scroll. |

## Fixture And Data Strategy

- Reuse `2026-06` E2E seed where possible.
- Add or extend fixtures for:
  - more than one 100-record page of searchable results.
  - mixed income and expense results to verify total amount sign/color behavior.
  - owner deletable records.
  - other-member records that are visible but not deletable by general members.
  - active member-paid refundable expenses.
  - fund-paid expenses, income records, voided records, and already reimbursed expenses for skipped refund cases.
- Use existing controlled auth headers:
  - admin user for full delete/refund eligibility.
  - finance manager for refund and edit-like financial operations but limited delete rules.
  - general member for permission skips and direct-submission rejection.
- Direct server-action or command tests must cover unauthorized records and ineligible records because UI controls are not a security boundary.
- Server pagination fixture should be designed in Technical Design; prototype currently chunks already-loaded records.

## Accessible Selectors

- Search input: `搜尋紀錄`.
- Selection mode toggle: `開啟選取模式`, `關閉選取模式`.
- Row selection controls: `選取<record name>`, `取消選取<record name>`, `aria-pressed`.
- Record detail trigger: `查看<record name>詳情`.
- Footer count text: `搜尋結果 <n> 筆`, `已選取 <n> 筆`.
- Footer amount label: `總額`.
- All select: `全選目前顯示`, disabled `已全選目前顯示`.
- Clear selection: `清除選取`.
- Batch actions: `批次刪除 (<n>)`, `批次退款 (<n>)`.
- Confirmation headings: `確認批次刪除`, `確認批次退款`.
- Confirmation counts: `將處理`, `略過`.
- Refund amount: `退款總金額`.
- Direct removed route: default 404 heading/content.

## Responsive And Accessibility Requirements

- The selection mode toggle remains icon-only but must have an accessible label and pressed state.
- Row selection controls are compact and keyboard-focusable.
- Row detail triggers remain reachable when selection mode is active.
- Page footer is outside the result scroller and does not overlap list content.
- Footer text and buttons must not clip on mobile.
- Footer has no icons, no cards, no badges, and only a top border.
- Batch confirmation dialogs keep focus trapped and expose cancel/confirm controls.
- Disabled batch buttons must not be the only way eligibility is enforced.
- Total amount color must have sufficient contrast in dark theme.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/unit | Batch delete validates per-record active status, ownership/admin permission, and reimbursed-expense restrictions. |
| Domain/unit | Batch refund validates per-record active member-paid refundable status and one-time reimbursement. |
| Domain/unit | Mixed eligible/ineligible selections return processed and skipped outcomes. |
| Domain/unit | Total amount helper treats income as positive and expense as negative while UI formats absolute value. |
| Data/integration | Batch delete voids eligible records and leaves skipped records unchanged in one explicit transaction/outcome contract. |
| Data/integration | Batch refund creates reimbursement batch items only for eligible refundable expenses and prevents duplicates. |
| Server action/integration | Direct batch submissions reject unauthorized records, cross-household IDs, missing IDs, voided records, and duplicate reimbursements. |
| Server/API contract | Search supports 100-record server pagination/cursor and returns enough metadata for current-query count and total amount; all-select remains scoped to currently displayed rows. |
| Component | Selection mode toggle, row selection, footer normal/selection states, all-select disabled state, and confirmation dialogs. |
| Component | Shared `PageFooter` renders top-border footer without cards/badges/icons and supports mobile wrapping. |
| E2E | Normal search, selection mode, clear selection, all-select, progressive loading, batch delete confirmation, batch refund confirmation with amount, navigation removal, `/reimbursements` 404, mobile footer. |
| Existing E2E cleanup | Update stale `/reimbursements` placeholder assertions in `e2e/dashboard.spec.ts` and `e2e/create-record.spec.ts`. |
| Manual | Review Traditional Chinese copy, amount color semantics, keyboard focus, and mixed-selection trust. |

## Technical Design Inputs

- Design server-side search pagination/cursor and avoid loading all active records into the client.
- Use 100 records as the page size for `/search`.
- Decide how the backend returns current-query total count and signed net total for footer display.
- Preserve all-select as currently displayed rows only under server pagination; do not implement query-wide cross-page selection in this slice.
- Design batch delete and batch refund server actions.
- Define processed/skipped outcome shape and Traditional Chinese messages.
- Decide transaction boundaries for partial success.
- Remove or replace stale `revalidatePath("/reimbursements")` calls.
- Update homepage copy that mentions `退款頁`.
- Update E2E tests that still expect `/reimbursements` placeholder behavior.
- Keep single-record detail `退款` unless Technical Design intentionally removes it with accepted risk.

## Accepted Risks

- Prototype currently simulates infinite loading client-side over already-fetched records.
- Real server pagination and aggregate totals are deferred to Feature Technical Design; query-wide all-select is explicitly out of scope.
- Batch result audit/history UI is out of scope.
- Reimbursement reversal remains out of scope.
- Production readiness is not assessed in this gate.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm final AC matches the reviewed prototype and latest feedback.
  - Confirm partial-success with skipped records is acceptable for batch actions.
  - Confirm all-select means currently displayed rows only.
  - Confirm `/reimbursements` default 404 and navigation removal are final.
- must_check:
  - Behavior Spec does not assume client-only pagination is final.
  - Server-side authorization remains authoritative.
  - Stale route references are addressed in Technical Design/TDD.
- acceptance_signals:
  - Feature Technical Design can decide API shape, pagination, currently displayed-row selection, transactions, and revalidation.
  - TDD can begin with domain/server-action/component/E2E tests.
- unresolved_blockers:
  - Server pagination requires Feature Technical Design before implementation.
- next_step:
  - Feature Technical Design for `batch-search-record-actions`.
