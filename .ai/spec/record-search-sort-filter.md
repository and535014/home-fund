---
id: spec-record-search-sort-filter
stage: behavior-spec
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-search-sort-filter.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/record-search-sort-filter.md
  - .ai/prototype/record-search-sort-filter.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/record-search-sort-filter.md
  domain_impact:
    - .ai/domain-impact/record-search-sort-filter.md
  prototype:
    - .ai/prototype/record-search-sort-filter.md
  production_routes:
    - /search
  target_components:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-panel.tsx
    - src/app/record-list-detail.tsx
    - src/app/home-dashboard-data-source.ts
  domain_modules:
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/categorization/category-catalog.ts
    - src/modules/reimbursement/reimbursement-table.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-21
---

# Record Search, Sort, and Filter Behavior Spec

## Decision Summary

- decision: proceed_to_feature_technical_design_after_review
- prototype_status: approved
- route: `/search`
- primary_surface: search page record query
- page_header: none
- page_surface: keyword input plus icon-only filter button
- filter_dialog_title: `篩選與排序`
- filter_apply_label: `套用`
- next_gate: Feature Technical Design

## Final Acceptance Criteria

1. Authenticated household members can open `/search`.
2. `/search` does not show a page header.
3. The first visible controls on `/search` are a keyword search input and an icon-only filter button.
4. The initial `/search` result area shows `請輸入關鍵字或設定篩選條件。` and no records.
5. Entering a keyword searches active records by record name and formatted amount only.
6. When keyword text is present, the search input shows an icon-only `X` button.
7. Activating the search input `X` clears the keyword and removes keyword matching from the result set.
8. If clearing the keyword leaves no applied filter or non-default sort, the initial empty-result prompt returns.
9. The icon-only filter button opens a modal titled `篩選與排序`.
10. The filter modal contains type, category, `收支對象`, reimbursement status, start date, end date, and one sort select.
11. The filter modal does not show result counts.
12. Filter and sort edits inside the modal do not affect results until `套用` is activated.
13. Activating `套用` applies the modal's draft filter/sort settings and closes the modal.
14. Closing the modal without applying keeps the previously applied query unchanged.
15. `清除` in the modal resets modal draft filter/sort settings to defaults but does not update results until `套用` is activated.
16. When any filter or non-default sort is applied, the icon-only filter button uses a visually distinct active style and exposes the applied-condition count through its accessible label.
17. Type filter supports `全部`, `收入`, and `支出`.
18. Category filter lists active categories only; archived categories are not options and category names are not matched by keyword search.
19. When type is `收入`, category options show only active income categories.
20. When type is `支出`, category options show only active expense categories.
21. If changing type makes the selected category invalid for that type, the category filter resets to `全部`.
22. `收支對象` supports household members and `基金` where applicable.
23. When type is `收入`, `收支對象` does not show `基金`.
24. If changing type to `收入` makes selected `收支對象` invalid because it was `基金`, `收支對象` resets to `全部`.
25. Selecting a member in `收支對象` finds income records sourced by that member and member-paid expense records paid by that member.
26. Selecting `基金` finds fund-paid expense records.
27. Reimbursement status filter supports `全部`, `已退款`, and `未退款`.
28. `已退款` returns reimbursed member-paid expenses only.
29. `未退款` returns refundable member-paid expenses only.
30. Income and fund-paid expenses are excluded when a reimbursement-status filter is active.
31. Date range filters by record occurrence date.
32. Start-only date range includes records on or after the start date.
33. End-only date range includes records on or before the end date.
34. Bounded date range includes records on both boundary dates.
35. The search page does not use the dashboard month switcher; date range is the search page's time filter.
36. Sort supports `新到舊`, `舊到新`, `金額高到低`, and `金額低到高`.
37. Query results include only active readable household records and exclude voided records.
38. Empty matched results show `沒有符合條件的紀錄。`
39. Opening a record from query results uses the existing record detail dialog.
40. Existing edit/delete/reimbursement affordances and permission behavior remain unchanged inside record detail.
41. Search/filter/sort state is local for this slice; URL persistence is out of scope unless approved in technical design.
42. UI copy remains Traditional Chinese and dark-theme first.

## BDD Scenarios

### Scenario: Search Page Starts Empty

Given an authenticated household member opens `/search`  
Then no page header is visible  
And a keyword search input is visible  
And an icon-only filter button is visible  
And the page shows `請輸入關鍵字或設定篩選條件。`  
And no record detail trigger is visible

### Scenario: Keyword Search Matches Name And Amount

Given an authenticated member is on `/search`  
When they enter a keyword that appears in a record name or formatted amount  
Then active matching records are listed  
And voided records are not listed  
And notes, category names, member names, type/payment labels, dates, and reimbursement statuses are not matched as keyword text

### Scenario: Keyword Search Can Be Cleared

Given keyword search results are visible on `/search`  
When the member activates the search input `X` button  
Then the keyword field is empty  
And keyword matching no longer affects results  
And if no filters or non-default sort are applied, the initial empty-result prompt returns

### Scenario: Filter Modal Does Not Apply Draft Changes Until Apply

Given a member has visible search results on `/search`  
When they open `篩選與排序`  
And change type, category, `收支對象`, reimbursement status, date range, or sort  
Then the visible result list remains unchanged  
When they activate `套用`  
Then the modal closes  
And the result list reflects the applied criteria

### Scenario: Closing Filter Modal Keeps Previous Query

Given a member opens `篩選與排序`  
And changes filter or sort controls  
When they close the modal without activating `套用`  
Then the previously applied query remains unchanged

### Scenario: Type Constrains Category And Fund Options

Given a member opens `篩選與排序`  
When they select `收入` as type  
Then category options show active income categories only  
And `收支對象` does not include `基金`  
When they select `支出` as type  
Then category options show active expense categories only  
And `收支對象` includes `基金`

### Scenario: Member And Fund Participation Filtering

Given a member opens `篩選與排序`  
When they select a household member in `收支對象` and apply  
Then results include income sourced by that member and member-paid expenses paid by that member  
When they select `基金` and apply  
Then results include fund-paid expense records

### Scenario: Reimbursement Status Filters Only Member-Paid Expenses

Given a member opens `篩選與排序`  
When they select `已退款` and apply  
Then reimbursed member-paid expenses are listed  
And income records and fund-paid expenses are not listed  
When they select `未退款` and apply  
Then refundable member-paid expenses are listed  
And income records and fund-paid expenses are not listed

### Scenario: Open-Ended Date Range Uses Occurrence Date

Given active records exist before, on, and after selected dates  
When the member applies only a start date  
Then records on or after that occurrence date are listed  
When the member applies only an end date  
Then records on or before that occurrence date are listed  
When the member applies both dates  
Then records on both boundary dates are included

### Scenario: Sort Orders Query Results

Given multiple matching records are visible  
When the member applies `新到舊`  
Then records are ordered by newest occurrence date first  
When the member applies `舊到新`  
Then records are ordered by oldest occurrence date first  
When the member applies `金額高到低`  
Then records are ordered by highest amount first  
When the member applies `金額低到高`  
Then records are ordered by lowest amount first

### Scenario: Record Detail Remains Available From Search Results

Given query results are visible on `/search`  
When the member opens a result detail  
Then the existing record detail dialog opens  
And existing edit, delete, and reimbursement affordances follow the same authorization and eligibility rules as the dashboard detail flow

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Initial search page | `/search` | linked household member | desktop | no heading `搜尋`; input `搜尋紀錄`; icon-only button name `開啟篩選`; text `請輸入關鍵字或設定篩選條件。`; no button `/查看.*詳情/`. |
| Keyword search and clear | `/search` | active records with searchable names and amounts | desktop | fill input `搜尋紀錄`; assert matching record trigger visible; search by amount; click button `清除搜尋`; input empty; initial prompt returns if no filters active. |
| Filter modal draft apply | `/search` | active income/expense/member/fund/refund records | desktop | open `開啟篩選`; heading `篩選與排序`; change controls; assert results unchanged before `套用`; click `套用`; assert filtered results. |
| Type-constrained category and participant | `/search` | active income and expense categories plus household members | desktop | select `收入`; category select lacks expense categories; `收支對象` lacks `基金`; select `支出`; category select lacks income categories and includes expense categories; `基金` visible. |
| Combined filters | `/search` | active member-paid refundable expense | desktop | apply `支出`, active category, member, `未退款`, date range; assert only matching active records and no income/fund-paid records. |
| Reimbursement status | `/search` | reimbursed member-paid, refundable member-paid, income, fund-paid | desktop | apply `已退款`; assert reimbursed expense visible and income/fund-paid absent; apply `未退款`; assert refundable expense visible. |
| Sort options | `/search` | at least three active records with distinct dates and amounts | desktop | apply each sort option; assert first/last visible records match expected order. |
| Detail continuity | `/search` | result record with existing detail behavior | desktop | search/filter to record; open `查看<name>詳情`; assert dialog content and existing action availability. |
| Mobile modal | `/search` | standard active records | mobile | open filter modal; all controls and footer buttons `清除`/`套用` are reachable and not clipped. |

## Fixture And Data Strategy

- Reuse the existing E2E authenticated header pattern:
  - `x-e2e-auth-user-id: user-e2e-linked` for ordinary authenticated browsing.
  - role-specific users only when detail permission assertions require them.
- Extend or verify seed data includes:
  - active income record with income category and source member.
  - active fund-paid expense with expense category.
  - active member-paid refundable expense.
  - active member-paid reimbursed expense.
  - at least one name term and one amount unique enough for keyword search.
  - records on date boundaries for start-only, end-only, and bounded date checks.
  - archived category attached to a historical record only if needed to prove it is not searchable/filterable.
  - voided record excluded from search results.
- Prefer a new `e2e/record-search.spec.ts` so dashboard tests remain focused.
- Use accessible names over CSS selectors:
  - input `搜尋紀錄`
  - button `開啟篩選` or `開啟篩選，已設定 N 個條件`
  - dialog heading `篩選與排序`
  - select labels `類型`, `分類`, `收支對象`, `退款狀態`, `排序`
  - buttons `清除`, `套用`, `清除搜尋`
  - record triggers `查看<record name>詳情`

## Responsive And Accessibility Requirements

- Icon-only search clear and filter buttons must have accessible names.
- Active filter button style must be visually distinct in dark theme and preserve focus-visible styling.
- Filter modal must use existing Dialog focus behavior and close semantics.
- Modal controls must be keyboard reachable in logical order.
- Modal footer actions must remain visible on mobile.
- Search input text and icons must not overlap at mobile widths.
- Result list rows must preserve stable dimensions and not shift controls when filters are applied.

## Test Plan

| Level | Coverage |
|---|---|
| Unit/domain | Query predicate maps keyword by name/amount, type, active category, member/fund participation, reimbursement status, date range, active status, and sort criteria correctly. |
| Unit/domain | Category options are active-only and constrained by selected type. |
| Unit/domain | `收支對象` excludes `基金` when type is `收入` and resets invalid fund selection. |
| Unit/domain | Reimbursement status filters include only reimbursed/refundable member-paid expenses and exclude income/fund-paid records. |
| Data/integration | Search page data source returns active records, categories, and member names needed by the query surface without voided records. |
| Component | Search page has no header, initial prompt appears, keyword clear works, filter button active style toggles, draft filter changes apply only after `套用`. |
| E2E | Initial state, keyword search/clear, modal draft/apply, type-dependent category/participant options, combined filters, reimbursement filters, sort, detail continuity, mobile modal layout. |
| Manual | Review Traditional Chinese labels, dark-theme contrast, active filter styling, empty-state wording, modal density, and mobile tap targets. |

## Technical Design Inputs

- Decide whether the final implementation keeps client-side query over active records or moves criteria into server/Prisma queries.
- Decide query-state persistence. Current spec treats query state as local and not URL/bookmarkable.
- Define performance limits for loading active records on `/search`.
- Keep search query UI in the search page container, not in the shared record list/detail shell.
- Decide whether `收支對象` remains the final label or should be renamed before implementation.
- Keep dashboard recent-record behavior separate from search page query behavior.
- Ensure category names are not searchable while active category filters still work and archived categories remain non-filterable.

## Accepted Risks

- URL persistence/shareable search links are out of scope for this slice.
- Search performance over large production ledgers is not solved by this spec; technical design must set limits.
- No production release readiness is claimed.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm `/search` owns search/filter/sort behavior.
  - Confirm initial empty prompt and keyword clear behavior.
  - Confirm filter modal draft/apply semantics.
  - Confirm type-dependent category and `收支對象` options.
  - Confirm reimbursement-status filter exclusions.
- must_check:
  - Behavior spec reflects accepted prototype decisions.
  - E2E design is actionable with accessible selectors.
  - Implementation remains blocked until Feature Technical Design approval.
- acceptance_signals:
  - Technical Design can decide data/query ownership without changing observable behavior.
  - TDD can start from failing unit/component/E2E tests.
- unresolved_blockers:
  - Final performance strategy and server/client query boundary.
  - Final label for `收支對象`.
- next_step:
  - Feature Technical Design for `record-search-sort-filter`.
