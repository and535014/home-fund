---
id: home-dashboard-record-tabs-yearly-trend
stage: behavior-spec
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/home-dashboard-record-tabs-yearly-trend.md
  - .ai/prototype/home-dashboard-record-tabs-yearly-trend.md
  - .ai/domain/home-family-fund.md
  - commit:712012f2
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_test_design
  - test_plan
trace_links:
  routes:
    - src/app/(app)/(home)/page.tsx
  components:
    - src/app/home-record-tabs.tsx
    - src/app/dashboard-charts.tsx
    - src/app/_record-detail/record-list-detail.tsx
    - src/components/ui/tabs.tsx
  data_sources:
    - src/app/home-dashboard-data-source.ts
    - src/app/monthly-workspace-context.ts
  tests:
    - src/app/home-dashboard-data-source.test.ts
    - e2e/dashboard.spec.ts
reviewed_at: 2026-06-27
---

# Home Dashboard Record Tabs And Yearly Trend Spec

## Prototype Decision

- decision: accepted_for_spec
- evidence: `712012f2 Prototype home dashboard record tabs`
- route: `/`
- release_target: local_dev
- reason: The accepted prototype updates the real home dashboard route with line-style record filter tabs and yearly trend data while preserving existing monthly dashboard behavior.
- scope note: This slice changes dashboard presentation, record-list filtering, and chart aggregation only. It does not change ledger creation, editing, deletion, reimbursement rules, permissions, auth, categories, members, database schema, or release configuration.

## Acceptance Criteria

1. The authenticated home dashboard keeps the existing route `/`.
2. The home dashboard record region remains semantically labeled `紀錄`.
3. The record region does not render a visible `紀錄` heading.
4. The record region renders a non-scrolling tab control at the top of the region.
5. The record tab control uses the existing line-tab visual variant, not the segmented/default tab style.
6. The record tab control exposes accessible tab semantics through the existing Tabs component.
7. The record tab list has accessible name `紀錄篩選`.
8. The visible record tab labels are exactly `全部收支`, `支出紀錄`, and `收入紀錄`.
9. `全部收支` is selected by default when the home dashboard loads.
10. `全部收支` shows all active selected-month records in the same order as the previous home dashboard record list.
11. `支出紀錄` shows only active selected-month records where `record.type === "expense"`.
12. `支出紀錄` includes both member-paid and fund-paid expense records.
13. `支出紀錄` hides income records.
14. `收入紀錄` shows only active selected-month income records.
15. `收入紀錄` hides expense records.
16. Changing record tabs does not navigate, change the URL, or persist tab state across reloads.
17. Changing record tabs keeps the selected dashboard month unchanged.
18. Changing dashboard month resets the record tab to the default `全部收支` state unless Technical Design records a reason to preserve local state.
19. Empty `全部收支` state uses `這個月份尚無紀錄。`.
20. Empty `支出紀錄` state uses `這個月份尚無支出紀錄。`.
21. Empty `收入紀錄` state uses `這個月份尚無收入紀錄。`.
22. Empty filtered states do not collapse the record region.
23. Record detail, edit, delete, reimbursement readback, reimbursement action, and keyboard focus-return behavior remain owned by `RecordListDetail`.
24. Existing record row accessible names such as `查看<紀錄名稱>詳情` remain available after tab filtering.
25. The record tabs remain visible while the record list itself scrolls inside the fixed-height desktop dashboard region.
26. The home dashboard `收支趨勢` chart uses active records from the selected calendar year.
27. The selected calendar year is derived from the selected dashboard month.
28. The yearly trend uses 12 monthly points labeled `1月` through `12月`.
29. Monthly trend income bars sum active income records per month.
30. Monthly trend expense bars sum active expense records per month.
31. The trend balance line is the running yearly balance across the 12 monthly buckets.
32. The trend includes records from the selected year even when they fall outside the selected dashboard month.
33. Monthly summary cards remain scoped to the selected month.
34. The dashboard record list remains scoped to the selected month.
35. Category summaries remain scoped to the selected month.
36. Pending reimbursement totals remain scoped to the selected month.
37. Search, settings, auth, and create-record routes are not changed by this slice.
38. UI copy remains Traditional Chinese using Taiwan usage.

## BDD Scenarios

### Scenario: User Opens Home Dashboard With Default Record Tab

Given an authenticated household member opens `/?month=2026-06`  
Then the home dashboard has a region named `紀錄`  
And the visible `紀錄` heading is not shown inside that region  
And the record tabs `全部收支`, `支出紀錄`, and `收入紀錄` are visible  
And `全部收支` is selected  
And all active June records are shown in the record list

### Scenario: User Filters Home Records To Expenses

Given the selected month has both income and expense records  
When the member selects `支出紀錄`  
Then only selected-month expense records are shown  
And member-paid expense records are included  
And fund-paid expense records are included  
And selected-month income records are not shown

### Scenario: User Filters Home Records To Income

Given the selected month has both income and expense records  
When the member selects `收入紀錄`  
Then only selected-month income records are shown  
And selected-month expense records are not shown

### Scenario: Filtered Home Records Are Empty

Given the selected month has no records for a tab's record type  
When the member selects that tab  
Then the record region remains visible  
And the tab-specific empty state is shown  
And the page layout does not collapse

### Scenario: Record Tabs Stay Outside The Scrollable List

Given a desktop viewport with enough records to scroll the record list  
When the member scrolls inside the record region  
Then the line tabs stay visible at the top of the record region  
And only the record list content scrolls

### Scenario: Record Details Continue To Work After Filtering

Given the member has selected `支出紀錄` or `收入紀錄`  
When the member activates a visible record row  
Then the existing record detail dialog opens  
And existing allowed actions and focus return behavior remain available

### Scenario: Yearly Trend Uses The Selected Calendar Year

Given the selected month is `2026-06`  
And active records exist in January and June 2026  
When the home dashboard renders `收支趨勢`  
Then the chart contains 12 monthly trend buckets for 2026  
And the January record contributes to the yearly trend  
And the June monthly record list still shows only June records

### Scenario: Monthly Dashboard Metrics Stay Month-Scoped

Given active records exist outside the selected month but inside the selected year  
When the member opens the home dashboard for the selected month  
Then the yearly trend includes the outside-month records  
But summary cards, category summaries, pending reimbursement totals, and the record list remain scoped to the selected month

## E2E Test Design

### Routes And Fixtures

- route: `/?month=2026-06`
- desktop viewport: `1920x1080` for fixed-height dashboard scroll and panel layout checks.
- tablet landscape viewport: reuse existing `1194x834` dashboard arrangement check where useful.
- mobile viewport: only smoke the record tabs if the home dashboard record region is visible on mobile; mobile trend chart remains hidden by existing mobile layout rules.
- fixture strategy: use existing E2E authenticated member override and `prisma/seed.e2e.sql`.
- fixture expectations for current seed:
  - `六月生活費` is an income record.
  - `補充用品代墊` is a member-paid expense.
  - `網路費` is a fund-paid expense.
- optional fixture extension for yearly trend:
  - Add a selected-year active record outside June to prove the trend includes non-selected-month data.
  - Keep monthly summary expectations anchored to June.

### Selectors And Assertions

| Behavior | Route | Viewport | Selectors / Assertions |
|---|---|---|---|
| Record tab labels | `/?month=2026-06` | desktop | `getByRole("region", { name: "紀錄" })`; tabs `全部收支`, `支出紀錄`, `收入紀錄`; visible heading `紀錄` is absent inside the region. |
| Default all records | `/?month=2026-06` | desktop | `全部收支` selected; records `六月生活費`, `補充用品代墊`, and `網路費` visible. |
| Expense filter | `/?month=2026-06` | desktop | Click `支出紀錄`; `補充用品代墊` and `網路費` visible; `六月生活費` hidden. |
| Income filter | `/?month=2026-06` | desktop | Click `收入紀錄`; `六月生活費` visible; `補充用品代墊` and `網路費` hidden. |
| Scroll boundary | `/?month=2026-06` or seeded dense month | desktop | The tab list bounding box remains above the record list scroll container; scrolling the list does not move the tab list out of the region. |
| Record detail after filter | `/?month=2026-06` | desktop | Select `支出紀錄`; activate `查看補充用品代墊詳情`; detail dialog opens with existing fields/actions. |
| Empty filtered state | month with no selected type | desktop | Select a tab with no records; assert tab-specific empty text and stable region dimensions. |
| Yearly trend labels | `/?month=2026-06` | desktop | `收支趨勢` region is visible; chart x-axis includes yearly month labels such as `1月` and `12月`. |
| Month-scoped list | `/?month=2026-06` | desktop | Records outside June do not appear in `全部收支`, even when they contribute to the trend. |

### Accessible Selectors

- Home record region: `getByRole("region", { name: "紀錄" })`
- Record tab list: `aria-label="紀錄篩選"`
- Record tabs: `全部收支`, `支出紀錄`, `收入紀錄`
- Trend region: `getByRole("region", { name: "收支趨勢" })`
- Existing record row triggers: `查看<紀錄名稱>詳情`
- Empty states:
  - `這個月份尚無紀錄。`
  - `這個月份尚無支出紀錄。`
  - `這個月份尚無收入紀錄。`

## Unit And Integration Test Plan

- Update `src/app/home-dashboard-data-source.test.ts` to assert separate month-range and year-range ledger queries.
- Add or maintain a test proving `HomeDashboardData.records` remains month-scoped while `HomeDashboardData.yearlyRecords` is year-scoped.
- Add E2E coverage in `e2e/dashboard.spec.ts` for tab labels, default selection, expense filtering, income filtering, and absence of the visible record heading.
- Add E2E coverage or a focused browser check for yearly trend labels and selected-year data range.
- Keep existing dashboard E2E coverage for record detail, reimbursement action, empty month state, desktop arrangement, and fixed-height panel layout.
- Run verification commands after implementation:
  - `corepack pnpm lint`
  - `corepack pnpm type-check`
  - `corepack pnpm vitest run src/app/home-dashboard-data-source.test.ts`
  - `pnpm test:e2e e2e/dashboard.spec.ts`

## Responsive And Accessibility Requirements

- Record tabs must be keyboard reachable and expose active state through the existing Radix-backed Tabs component.
- The record region must remain discoverable by screen readers through `aria-label="紀錄"` even without a visible heading.
- The line-tab labels must not wrap or overlap at supported desktop/tablet widths.
- The record list scroll area must not obscure the tabs.
- Record detail dialogs opened from filtered lists must preserve focus return to the activating row.
- Mobile must not introduce root horizontal scrolling if the record region is visible.

## Out Of Scope

- Persistent URL state for the selected record tab.
- User preference storage for the selected tab.
- New routes, navigation entries, or settings/search behavior.
- Database schema changes or migrations.
- Domain changes to ledger, reimbursement, member, category, permission, or auth rules.
- Production release execution or monitoring changes.

## Open Questions For Technical Design

- Should yearly trend continue to fetch full selected-year ledger rows, or should it use a database-level aggregate query?
- Should the selected record tab always reset on month changes, or should the local component preserve the selected type while the month changes?
- Does the existing E2E seed already contain enough selected-year outside-month data for yearly trend assertions, or should the dashboard fixture be extended?

## Review Gate

- decision: ready_for_review
- reviewer_focus:
  - Confirm the final tab labels are `全部收支`, `支出紀錄`, and `收入紀錄`.
  - Confirm the visible `紀錄` heading stays removed while semantic region labeling remains.
  - Confirm record list behavior remains selected-month scoped.
  - Confirm `收支趨勢` uses 12 monthly buckets for the selected calendar year.
  - Confirm the E2E plan is sufficient before technical design.
- acceptance_signals:
  - Feature Technical Design can decide data-fetching and client-state ownership from this spec.
  - TDD Implementation can add E2E coverage for tab filtering and yearly trend behavior before final code changes.
- unresolved_blockers:
  - None for moving to Feature Technical Design after review approval.
- next_step:
  - Feature Technical Design
