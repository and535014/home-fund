---
id: home-dashboard-record-tabs-yearly-trend
stage: experience-prototype
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/home-dashboard-record-tabs-yearly-trend.md
  - src/app/(app)/(home)/page.tsx
  - src/app/home-dashboard-data-source.ts
  - src/app/_record-detail/record-list-detail.tsx
outputs:
  - production_stack_home_dashboard_prototype
  - ux_acceptance_inputs
  - e2e_scenario_candidates
trace_links:
  intent:
    - .ai/intent/home-dashboard-record-tabs-yearly-trend.md
  prototype_code:
    - src/app/(app)/(home)/page.tsx
    - src/app/home-record-tabs.tsx
    - src/app/home-dashboard-data-source.ts
    - src/app/home-dashboard-data-source.test.ts
reviewed_at: 2026-06-27
---

# Home Dashboard Record Tabs And Yearly Trend Prototype

## Decision Summary

- decision: ready_for_review
- next_gate_after_approval: Behavior Spec / BDD / E2E
- reason: The prototype is implemented on the real home dashboard route using existing Next.js, React, Tailwind, shadcn-style Tabs, dashboard chart, and record detail components.

## Prototype Surface

- route: `/`
- review URL: `http://localhost:3000/?month=2026-06` in the current dev server session
- primary component path: `src/app/(app)/(home)/page.tsx`
- new component path: `src/app/home-record-tabs.tsx`
- data source path: `src/app/home-dashboard-data-source.ts`
- component library usage: existing `Tabs`, `TabsList`, `TabsTrigger`, `RecordListDetail`, `MonthlyTrendChart`, and dashboard panel patterns.

## UX Shape

- The `紀錄` dashboard panel keeps its semantic region label but removes the visible panel heading.
- A fixed `Tabs` control sits at the top of the panel and above the record list scroll area.
- The record filter uses the existing `line` Tabs variant rather than the default segmented control style.
- Tabs are `全部收支`, `支出紀錄`, and `收入紀錄`.
- `全部收支` renders all selected-month active records in the same order as the prior dashboard list.
- `支出紀錄` renders selected-month active records where `record.type === "expense"`, covering both member-paid and fund-paid expenses.
- `收入紀錄` renders selected-month active income records.
- Filtered empty states use tab-specific copy:
  - `這個月份尚無紀錄。`
  - `這個月份尚無支出紀錄。`
  - `這個月份尚無收入紀錄。`
- Existing record detail, edit, delete, reimbursement, and keyboard-open behavior remain inside `RecordListDetail`.

## Yearly Trend Shape

- `收支趨勢` now receives records from the selected calendar year.
- Trend points are monthly buckets from `1月` through `12月`.
- Income and expense bars sum each month.
- The balance line is a running yearly balance across those 12 monthly buckets.
- Month-scoped records, summary cards, category summary, and pending reimbursement calculations still use selected-month data.

## Data Strategy

- `HomeDashboardData.records` remains selected-month active records.
- `HomeDashboardData.yearlyRecords` is added for selected-year active records.
- The dashboard data source performs separate month-range and year-range ledger queries.
- This keeps existing monthly report behavior stable while giving the trend chart a broader range.

## States Covered

- Default selected tab: `全部收支`.
- Expense filter tab: selected-month expense records only.
- Income filter tab: selected-month income records only.
- Empty filtered state: tab-specific text.
- Yearly trend with records outside the selected month.
- Desktop fixed-height dashboard layout retains the scroll boundary inside the record list.

## Accessibility And Focus Notes

- Tabs use the existing Radix-backed `Tabs` component and expose `aria-label="紀錄篩選"`.
- Trigger labels are visible Traditional Chinese text.
- Keyboard focus handling for record detail remains owned by `RecordListDetail`.
- No new route navigation or URL state is introduced in the prototype.

## Verification Evidence

- `corepack pnpm install --frozen-lockfile` completed using the existing lockfile.
- `corepack pnpm vitest run src/app/home-dashboard-data-source.test.ts` passed.
- `corepack pnpm type-check` passed.
- `corepack pnpm lint` passed.
- Review feedback applied: record list tabs use the `line` variant and keep exactly `全部收支`, `支出紀錄`, `收入紀錄`.
- Review feedback applied: the visible `紀錄` panel heading is removed while the region label remains available for accessibility and tests.

## UX Acceptance Inputs

- Home dashboard users can distinguish all, expense, and income records without leaving the dashboard.
- The record tabs remain visible while the record list itself scrolls.
- The selected tab state is local to the dashboard panel and does not change the URL.
- Yearly trend uses 12 monthly points, not daily year-wide points.
- Monthly dashboard summary behavior remains unchanged.

## E2E Scenario Candidates

- Opening `/?month=2026-06` shows `全部收支`, `支出紀錄`, and `收入紀錄` tabs inside the `紀錄` region.
- `全部收支` shows seeded June income and expense records.
- Selecting `支出紀錄` hides June income records and keeps both member-paid and fund-paid expense records.
- Selecting `收入紀錄` hides June expense records and shows June income records.
- Record tabs remain above the scrollable list in the fixed-height desktop dashboard.
- `收支趨勢` renders month labels for the selected year and includes records outside the selected month.

## Known Gaps

- Full Playwright visual review has not been run in this gate yet.
- The prototype does not persist the selected record tab across reloads or month changes.
- The data source currently fetches full selected-year ledger rows rather than a database-level aggregate. That is acceptable for MVP review, but Behavior Spec and Technical Design should decide whether to keep full rows or introduce aggregate query ownership.

## Review Gate

- decision: ready_for_review
- reviewer_focus:
  - Confirm the record tabs feel fixed in the panel header, not part of the scrolling list.
  - Confirm `支出紀錄` and `收入紀錄` tab filtering matches the expected mental model.
  - Confirm 12 monthly trend points are readable enough for `收支趨勢`.
  - Confirm no URL or persistent preference is needed for the selected tab.
- acceptance_signals:
  - Behavior Spec can define exact BDD/E2E assertions for tab filtering, scroll boundary, and yearly aggregation.
  - Technical Design can decide whether yearly trend should use full records or aggregate query results.
- unresolved_blockers:
  - None for moving to Behavior Spec / BDD / E2E after review approval.
- next_step:
  - Behavior Spec / BDD / E2E after user approval.
