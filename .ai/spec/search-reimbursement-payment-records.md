---
id: spec-search-reimbursement-payment-records
stage: behavior-spec
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
  - .ai/prototype/search-reimbursement-payment-records.md
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
  - .ai/archive/archive-reimbursement-payment-flow-2026-06-25.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/search-reimbursement-payment-records.md
  domain_impact:
    - .ai/domain-impact/search-reimbursement-payment-records.md
  prototype:
    - .ai/prototype/search-reimbursement-payment-records.md
  production_routes:
    - /search
  target_components:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-panel.tsx
    - src/app/record-search-controls.tsx
    - src/app/record-list-detail.tsx
    - src/app/record-query.ts
    - src/app/record-search-actions.ts
  domain_modules:
    - src/modules/reporting/record-search-query.ts
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/identity-access/authorization.ts
  existing_e2e:
    - e2e/record-search.spec.ts
reviewed_at: 2026-06-25
---

# Search Refund Records Behavior Spec

## Decision Summary

- decision: review_for_feature_technical_design
- prototype_status: user advanced to next gate after prototype commit `8f89cf5`
- primary_route: `/search`
- search_surfaces: `收支紀錄`, `退款紀錄`
- default_surface: `收支紀錄`
- refund_record_behavior: read-only search and detail readback
- refund_record_filters: 收款成員, 付款開始日期, 付款結束日期, 排序
- refund_record_keyword_fields: `退款`, `退款紀錄`, linked record name, 收款成員, payment method label, paid date, amount, note/reference
- no_double_count_policy: refund records are not ordinary income or expense records and do not affect ledger totals
- next_gate: Feature Technical Design

## Final Acceptance Criteria

1. `/search` shows two tabs above the search input: `收支紀錄` and `退款紀錄`.
2. `收支紀錄` is selected by default.
3. On mobile, the close control is aligned to the right of the tabs row and uses a close icon.
4. The mobile close control has accessible name `關閉搜尋頁`.
5. The `收支紀錄` tab searches ordinary active readable ledger records only.
6. The `退款紀錄` tab searches reimbursement payment evidence only.
7. Switching tabs preserves each tab's own keyword and filter state during the current page session.
8. Switching tabs closes any open selection mode and clears selected ledger records.
9. The search input placeholder is `搜尋收支紀錄` on `收支紀錄`.
10. The search input placeholder is `搜尋退款紀錄` on `退款紀錄`.
11. The `收支紀錄` filter dialog keeps ordinary ledger filters: type, category, participant, reimbursement status, date range, and sort.
12. The `退款紀錄` filter dialog contains `收款成員`, `付款開始日期`, `付款結束日期`, and `排序`.
13. `付款方式` is not a `退款紀錄` filter.
14. `收款成員` filters refund records by the member receiving the reimbursement payment.
15. Refund record date filters use reimbursement payment date, not linked expense occurrence date.
16. Refund record sort supports newest first, oldest first, highest amount first, and lowest amount first.
17. Keyword search in `退款紀錄` matches approved visible evidence fields: `退款`, `退款紀錄`, linked record name, 收款成員, payment method label, paid date, amount, and note/reference.
18. The `退款紀錄` tab with no keyword or filters can show readable refund records.
19. Empty refund-record results show a clear Traditional Chinese empty state.
20. Refund record rows use the same row structure and information density as ordinary record rows.
21. Refund record rows replace the ordinary category visual with a refund-record icon.
22. Refund record rows show linked record name, 收款成員, amount, and payment date.
23. Refund record rows are read-only and cannot be selected.
24. Selection mode controls are not shown on the `退款紀錄` tab.
25. Batch delete and batch refund actions never include refund records.
26. Refund record search results are scoped to the current household.
27. Refund record search results are scoped to the actor's readable data permissions.
28. Unauthorized or cross-household refund records are not returned.
29. Refund records do not contribute to ordinary ledger count, net total, income total, expense total, category summaries, or monthly report totals.
30. The existing `收支紀錄` footer behavior remains based on ledger records only.
31. The `退款紀錄` tab does not show the ledger batch-action footer.
32. Activating a refund record row opens a read-only refund record detail modal.
33. Refund record detail follows the ordinary record detail structure: title, amount card, two-column detail fields, note block, and footer action.
34. Refund record detail shows linked record name, amount, 收款成員, payment date, payment method, and note/reference.
35. Refund record detail does not show edit, delete, refund, correction, or reversal actions.
36. Refund record detail shows `查看關聯紀錄`.
37. Activating `查看關聯紀錄` opens a related ledger record list.
38. Related ledger records are displayed using the same `RecordListItem` row component as ordinary search results.
39. Related ledger records show their real ledger category visual when category data exists.
40. One refund record may relate to one or many ledger records.
41. Already-refunded member-paid expense detail can show `查看退款紀錄` when refund payment evidence exists.
42. Activating `查看退款紀錄` from a reimbursed expense opens the related refund record detail modal.
43. Reimbursed expenses without payment evidence show `已退款` but do not fabricate a refund record or payment detail.
44. Existing ordinary ledger search, selection mode, pagination, record detail, batch delete, and batch refund behavior continue to work.
45. Server-side search, authorization, and eligibility checks are authoritative; client-only tab separation is not a security boundary.
46. UI copy remains Traditional Chinese using Taiwan usage and does not imply the app executes an external transfer.

## BDD Scenarios

### Scenario: User Searches Ordinary Ledger Records In 收支紀錄

Given an authenticated household member opens `/search`  
Then the `收支紀錄` tab is selected  
When they enter a ledger keyword or apply ordinary ledger filters  
Then only ordinary readable ledger records are shown  
And refund records are not shown in the result list  
And ordinary selection and batch-action behavior remains available

### Scenario: User Searches Refund Records In 退款紀錄

Given an authenticated household member opens `/search`  
When they switch to `退款紀錄`  
Then selection mode controls are not shown  
And readable refund records can appear without an ordinary ledger query  
When they search `退款紀錄`  
Then matching refund records are shown  
And ordinary ledger records are not shown in the result list

### Scenario: User Filters Refund Records By 收款成員

Given the `退款紀錄` tab has refund records for multiple receiving members  
When the member opens `篩選與排序`  
And chooses a `收款成員`  
And applies the filter  
Then only refund records paid to that member are shown  
And `付款方式` is not available as a filter option

### Scenario: User Filters And Sorts Refund Records By Payment Facts

Given the `退款紀錄` tab has refund records on multiple payment dates and amounts  
When the member filters by `付款開始日期` or `付款結束日期`  
Then results use payment date for inclusion  
When the member changes sort order  
Then results are ordered by payment date or amount according to the selected sort

### Scenario: Refund Record Detail Opens Read-Only Evidence

Given the `退款紀錄` tab shows a refund record  
When the member activates the refund record row  
Then a read-only detail modal opens  
And it shows linked record name, amount, 收款成員, payment date, payment method, and note/reference  
And it does not show edit, delete, refund, correction, or reversal actions

### Scenario: Refund Record Opens Related Ledger Records

Given a member is viewing refund record detail  
When they activate `查看關聯紀錄`  
Then a `關聯紀錄` modal opens  
And the related ledger records are shown with `RecordListItem` rows  
And each related expense row shows its ledger category visual when available

### Scenario: Reimbursed Expense Opens Related Refund Record

Given a member opens an already-refunded member-paid expense detail  
And refund payment evidence exists for that expense  
Then the detail shows `查看退款紀錄`  
When the member activates `查看退款紀錄`  
Then the related refund record detail modal opens

### Scenario: Historical Reimbursed Expense Has No Evidence

Given a member opens an already-refunded expense that has no reimbursement payment evidence  
Then the expense still shows `已退款`  
And no fabricated refund record detail is shown  
And the UI communicates that payment evidence is unavailable if a readback location exists

### Scenario: Refund Records Do Not Affect Ledger Totals

Given refund records exist for reimbursed expenses  
When the member searches in `退款紀錄`  
Then ordinary ledger net totals, monthly income totals, monthly expense totals, and category summaries do not include refund record amounts  
And batch mutation commands cannot receive refund record IDs as ledger record IDs

### Scenario: Unauthorized Refund Evidence Is Not Returned

Given reimbursement payment evidence exists in another household or outside the actor's readable scope  
When the member searches in `退款紀錄`  
Then unauthorized refund records are not returned  
And direct query/server-action access does not expose them

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Tab separation | `/search` | authenticated member, ordinary records and refund records | desktop | Tabs `收支紀錄`, `退款紀錄`; default selected `收支紀錄`; search input placeholder `搜尋收支紀錄`; switch tab shows placeholder `搜尋退款紀錄`. |
| Ordinary search excludes refund records | `/search` | ledger record and refund record with overlapping keyword | desktop | Search in `收支紀錄`; assert ordinary row visible; refund record row absent; selection button `開啟選取模式` visible. |
| Refund search excludes ordinary records | `/search` | ledger record and refund record with overlapping keyword | desktop | Switch `退款紀錄`; search `退款紀錄`; assert refund row visible; ordinary row absent; no `開啟選取模式`. |
| Refund filters | `/search` | refund records for at least two receiving members and dates | desktop | Open `篩選與排序`; field `收款成員`; fields `付款開始日期`, `付款結束日期`; no filter label `付款方式`; applying filter narrows rows. |
| Refund detail | `/search` | refund record with method/date/note and linked records | desktop | Row button `查看<name>退款紀錄詳情`; modal title `<name>`; fields `金額`, `收款成員`, `付款日期`, `關聯紀錄`, `付款方式`; note block; no edit/delete/refund buttons. |
| Related records | `/search` | refund record linked to one or more expenses with categories | desktop | Button `查看關聯紀錄`; modal heading `關聯紀錄`; related rows use `查看<record name>詳情` labels and show category visual/record list structure. |
| Reimbursed expense readback | `/search` | already-refunded expense with payment evidence | desktop | Search in `收支紀錄`; open expense detail; button `查看退款紀錄`; opens refund record detail. |
| Mobile tab/filter/detail | `/search` | same fixture set | mobile | Tabs and close button `關閉搜尋頁` share one row; search row sits below tabs; filter dialog, refund rows, and detail modal do not overlap or clip text; related record list remains scrollable. |

## Fixture And Data Strategy

- Reuse `2026-06` seed data where practical.
- Add or extend fixtures for:
  - at least one refund record paid to member A and linked to one expense.
  - at least one refund record paid to member B for 收款成員 filter coverage.
  - one refund record linked to multiple ledger records.
  - one reimbursed expense with payment evidence.
  - one legacy reimbursed expense without payment evidence.
  - overlapping keywords between an ordinary ledger record and a refund record to prove tab separation.
  - cross-household or unauthorized reimbursement payment evidence for negative authorization coverage.
- Use existing controlled auth headers:
  - admin or finance manager for full visibility paths.
  - general member for permission-scoped visibility checks.
- Technical Design must decide whether E2E creates refund records through server actions or seeds `ReimbursementPayment` rows directly.

## Accessible Selectors

- Search tabs: `收支紀錄`, `退款紀錄`.
- Mobile close button: `關閉搜尋頁`.
- Search input labels/placeholders: `搜尋紀錄`, `搜尋收支紀錄`, `搜尋退款紀錄`.
- Filter button: `開啟篩選`.
- Filter dialog: heading `篩選與排序`.
- Refund filter labels: `收款成員`, `付款開始日期`, `付款結束日期`, `排序`.
- Refund result trigger: `查看<linked record name>退款紀錄詳情`.
- Refund detail fields: `金額`, `收款成員`, `付款日期`, `關聯紀錄`, `付款方式`, `備註`.
- Related records action: button `查看關聯紀錄`.
- Related records modal: heading `關聯紀錄`.
- Reimbursed expense readback action: button `查看退款紀錄`.

## Responsive And Accessibility Requirements

- Tabs must remain reachable by keyboard and expose active state.
- On mobile, the close button must sit to the right of the tabs and use a close icon rather than a back arrow.
- Search controls must not overlap on mobile.
- Filter dialog fields must wrap without clipping labels or values.
- Refund record rows must truncate long linked record names and member names without layout shift.
- Refund record detail and related-record modal must preserve Dialog focus behavior.
- Closing a modal should return focus to the triggering row or action where practical.
- Related `RecordListItem` rows must retain their ordinary accessible row names.
- The `退款紀錄` tab must not expose disabled selection controls that confuse keyboard users.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/read-model | Refund record query returns only current-household, authorized reimbursement payment evidence. |
| Domain/read-model | Refund record keyword search matches `退款`, `退款紀錄`, linked record name, 收款成員, payment method label, paid date, amount, and note/reference. |
| Domain/read-model | 收款成員, payment date range, and sort order filter refund records correctly. |
| Domain/read-model | Refund record amounts do not affect ordinary ledger totals, monthly report totals, or category summaries. |
| Domain/read-model | Refund record result IDs cannot be accepted by ledger batch delete or batch refund commands. |
| Integration/server action | `/search` record query remains ledger-only for `收支紀錄`; refund query remains payment-evidence-only for `退款紀錄`. |
| Integration/server action | Related ledger records are loaded for one-payment-to-one-record and one-payment-to-many-record cases. |
| Component | `RecordSearchControls` renders tab-scoped search, ledger filters, and refund filters with no `付款方式` refund filter. |
| Component | Refund record result row uses ordinary row structure with refund icon and read-only behavior. |
| Component | Refund detail opens related ledger records with `RecordListItem`. |
| E2E | Tab separation, refund filtering, refund detail, related records, reimbursed expense readback, and mobile layout. |
| Manual | Review Traditional Chinese copy, category visual display in related records, focus return, and whether users distinguish `已退款` ledger records from `退款紀錄`. |

## Technical Design Inputs

- Decide the refund-record read model shape and whether it is a result union or a separate tab-specific query contract.
- Decide pagination for `退款紀錄`; default page size should be consistent with `/search` ledger pagination unless there is a performance reason not to.
- Decide stable refund record IDs that cannot collide with `LedgerRecord` IDs.
- Decide how to load related ledger records for reimbursement batches with one or many reimbursed expenses.
- Decide permission rules for finance-capable members versus general members viewing reimbursement payment evidence.
- Decide whether legacy reimbursed records without payment evidence show no action, disabled copy, or a missing-evidence readback state.
- Decide whether payment method remains keyword-searchable even though it is not a filter.

## Accepted Risks

- Prototype currently uses local refund-record fixtures; backend query and persistence are deferred to Technical Design and TDD Implementation.
- Production search indexing and full-text search are out of scope for this local_dev slice.
- Correction, reversal, editing, deleting, and reconciliation of refund records remain out of scope.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm final acceptance criteria for tab-separated `收支紀錄` and `退款紀錄` search.
  - Confirm refund filters are exactly 收款成員, payment date range, and sort.
  - Confirm payment method is searchable/displayed but not a filter.
  - Confirm related ledger records should use `RecordListItem`.
  - Confirm read-only/no-double-count/no-batch-action policies.
- must_check:
  - Feature Technical Design must not start until this Behavior Spec is approved or explicitly accepted as risk.
  - Technical Design must resolve backend read model, pagination, authorization, and relation loading.
  - TDD Implementation must write or enable tests before replacing prototype fixture behavior.
- acceptance_signals:
  - User accepts the observable behavior and E2E coverage.
  - No unresolved UX copy or tab/filter behavior remains.
  - Backend ownership and query design questions are ready for Technical Design.
- unresolved_blockers:
  - Backend query shape, pagination, and permission scope remain technical-design work.
- next_step:
  - Feature Technical Design for `search-reimbursement-payment-records`.
