---
id: home-dashboard-record-tabs-yearly-trend
stage: intent-intake
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-27-home-dashboard-record-tabs-yearly-trend
  - .ai/project-context.md
  - .ai/workflow.md
  - src/app/(app)/(home)/page.tsx
  - src/app/_record-detail/record-list-detail.tsx
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  existing_intent:
    - .ai/intent/home-family-fund.md
    - .ai/intent/desktop-product-structure-layout-redesign.md
    - .ai/intent/mobile-sitewide-layout-redesign.md
  current_code:
    - src/app/(app)/(home)/page.tsx
    - src/app/home-dashboard-data-source.ts
    - src/app/monthly-workspace-context.ts
    - src/app/dashboard-charts.tsx
    - src/app/_record-detail/record-list-detail.tsx
reviewed_at: 2026-06-27
---

# Home Dashboard Record Tabs And Yearly Trend

## Decision Summary

- decision: approved
- first_next_gate: Experience Prototype
- owning_skill: experience-prototype
- reason: The request changes the visible home dashboard layout, record-list interaction model, and reporting data range. It should be prototyped in the production stack before locking BDD/E2E expectations and implementation boundaries.

## User Request

首頁排版調整：

- 紀錄區塊要多一個不參與捲動的 Tabs，分成 `全部`、`支出`、`收入`。
- `收支趨勢` 從目前月份資料改成當年資料。

## Change Classification

- project_type: existing_project
- change_type: page_change
- secondary_types:
  - dashboard_layout_change
  - record_list_filter_interaction
  - reporting_data_range_change
  - chart_data_aggregation_change
  - responsive_behavior_change
- release_target: local_dev

## Affected Surfaces

| Surface | Impact |
|---|---|
| Home dashboard | The `紀錄` panel needs a fixed header area containing the title and Tabs while only the record list content scrolls. |
| Record list interaction | Users can switch between all active month records, expense records, and income records without leaving the home dashboard. |
| Reporting data | `收支趨勢` must aggregate the selected calendar year rather than only the selected month. |
| Chart copy and labels | The chart remains named `收支趨勢`, but acceptance should clarify whether x-axis labels are monthly, daily, or otherwise summarized for the full year. |
| Data loading | The home dashboard data source may need to fetch active records for the entire year while preserving month-scoped summary metrics and the month-scoped record list. |
| Accessibility | Tabs need semantic tab roles, visible active state, keyboard focus, and stable labels in Traditional Chinese. |
| Tests | Later BDD/E2E should cover tab filtering, non-scrolling tab placement, and yearly trend aggregation. |

## Current Code Signals

- `src/app/(app)/(home)/page.tsx` currently filters `dashboardData.records` to `monthRecords`, reverses those for `RecordListDetail`, and builds trend points from `monthRecords`.
- `buildMonthlyTrendPoints(month, records)` currently creates one point per day of the selected month and accumulates running balance across that month only.
- `RecordListDetail` owns the scrollable list/detail behavior and is currently rendered directly inside the `紀錄` dashboard panel.
- `src/components/ui/tabs.tsx` exists and is already used elsewhere in the app for Traditional Chinese tab controls.
- `loadMonthlyWorkspaceContext` and `home-dashboard-data-source` are the likely boundaries for deciding whether yearly records are already available or need a broader query.

## Scope

- Add a non-scrolling Tabs control to the home dashboard `紀錄` panel.
- Tabs labels are exactly `全部`, `支出`, and `收入`.
- `全部` shows all active records for the selected month.
- `支出` shows active selected-month expense records, including both member-paid and fund-paid expense types.
- `收入` shows active selected-month income records.
- Preserve existing record detail, edit, delete, reimbursement, and list pagination behavior inside the filtered record list where applicable.
- Keep the selected month as the scope for the summary metrics, category summary, pending reimbursement amount, and record list unless a later approved spec expands that scope.
- Change `收支趨勢` to use the selected year from the current month selector.
- Keep the dashboard dark-theme-first and Traditional Chinese UI copy.
- Preserve desktop and mobile layout stability, including no overlap between fixed tabs and scrollable record content.

## Non-Goals

- Do not add new routes or navigation entries.
- Do not change ledger record creation, editing, deletion, reimbursement, category, member, auth, or permission domain rules.
- Do not change the month picker itself beyond using its selected year for chart data.
- Do not change database schema or migrations.
- Do not add persistent user preference storage for the selected record tab.
- Do not make production deployment, monitoring, or analytics changes in this slice.

## Success Criteria

- Home dashboard `紀錄` panel displays a Tabs control above the scrollable list.
- Tabs remain visible while the record list content scrolls inside the panel.
- `全部` displays the same selected-month active records users see today.
- `支出` hides income records and includes both member and fund expense records.
- `收入` hides expense records.
- Empty filtered states remain understandable and do not break the panel layout.
- `收支趨勢` is calculated from active records across the selected calendar year.
- Month-scoped summary cards and the record list do not accidentally become year-scoped.
- Tests or verification evidence prove the tab filtering and yearly trend data range.

## Domain Discovery Need

- required: false
- reason: This changes dashboard presentation and reporting aggregation range. It does not introduce new financial events, permissions, reimbursement lifecycle states, category policies, member lifecycle rules, or cross-role workflows.

## Foundation Architecture Need

- required: false
- reason: The existing Next.js App Router, React, TypeScript, Tailwind, shadcn-style Tabs component, Vitest, and Playwright setup are sufficient.

## Foundation Implementation Need

- required: false
- reason: No app scaffold, routing baseline, component-library setup, lint/test setup, or environment foundation change is required.

## Experience Prototype Need

- required: true
- timing: next
- reason: This is a user-facing dashboard layout and interaction change. A production-stack prototype should confirm fixed Tabs placement, filtered list behavior, and chart density/readability before acceptance criteria and technical boundaries are locked.
- prototype_scope:
  - home dashboard `紀錄` panel header and fixed Tabs placement
  - desktop record panel scrolling behavior
  - mobile record panel behavior if the home dashboard exposes the same record section on mobile
  - `全部` / `支出` / `收入` visual states
  - empty filtered state
  - yearly `收支趨勢` chart shape and label density

## Behavior Spec / BDD / E2E Need

- required: true
- timing: after Experience Prototype
- reason: The record filter interaction, scroll boundary, and yearly trend aggregation need executable acceptance criteria before implementation.
- scenarios_to_cover:
  - Home dashboard loads with `全部` selected.
  - Selecting `支出` shows only selected-month expense records.
  - Selecting `收入` shows only selected-month income records.
  - The record Tabs remain outside the scrollable record-list area.
  - Empty filtered results show an appropriate empty state without collapsing the panel.
  - `收支趨勢` uses the selected year, including records outside the selected month.
  - Monthly summary metrics remain scoped to the selected month.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: The slice needs explicit boundaries for client-side tab state, server-side record fetching scope, trend aggregation granularity, and the relationship between month-scoped and year-scoped dashboard data.

## Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: This changes the authenticated home dashboard interaction and reporting output, so local verification evidence should be refreshed.
- learning_loop_required: false
- learning_reason: This is an MVP dashboard refinement without a selected analytics, experiment, or production feedback decision.

## Open Questions

- Resolved: yearly trend should show 12 monthly points for readability.
- Resolved: the `支出` tab includes both member-paid and fund-paid expense records.
- Should the selected record tab reset to `全部` when the month changes, or remain selected while the filtered month changes?
- If yearly trend needs records outside the selected month, should the dashboard fetch only yearly aggregate data or all yearly records?

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm the `紀錄` tabs are fixed within the panel header while only records scroll.
  - Confirm `支出` means both member-paid and fund-paid expense records.
  - Confirmed: yearly trend uses 12 monthly points.
  - Confirm the change should proceed through Experience Prototype before Behavior Spec and Technical Design.
- acceptance_signals:
  - Prototype can start without changing domain rules.
  - BDD/E2E can later lock tab filtering and yearly trend range without inventing product intent.
  - Technical Design can decide data-fetching and aggregation ownership from approved dashboard behavior.
- unresolved_blockers:
  - None for moving to Experience Prototype.
- next_step:
  - Experience Prototype
