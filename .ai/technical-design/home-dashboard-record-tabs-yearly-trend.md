---
id: home-dashboard-record-tabs-yearly-trend
stage: feature-technical-design
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/home-dashboard-record-tabs-yearly-trend.md
  - .ai/prototype/home-dashboard-record-tabs-yearly-trend.md
  - .ai/spec/home-dashboard-record-tabs-yearly-trend.md
  - .ai/domain/home-family-fund.md
  - commit:712012f2
  - commit:ec480ad3
outputs:
  - route_boundaries
  - component_boundaries
  - data_contract
  - state_ownership
  - test_mapping
trace_links:
  route:
    - src/app/(app)/(home)/page.tsx
  components:
    - src/app/home-record-tabs.tsx
    - src/app/dashboard-charts.tsx
    - src/app/_record-detail/record-list-detail.tsx
    - src/components/ui/tabs.tsx
  data:
    - src/app/home-dashboard-data-source.ts
    - src/app/monthly-workspace-context.ts
  tests:
    - src/app/home-dashboard-data-source.test.ts
    - e2e/dashboard.spec.ts
    - prisma/seed.e2e.sql
reviewed_at: 2026-06-27
---

# Home Dashboard Record Tabs And Yearly Trend Technical Design

## Decision Summary

- decision: ready_for_review
- prototype_status: accepted via `712012f2 Prototype home dashboard record tabs`
- spec_status: accepted_for_design via `ec480ad3 Spec home dashboard record tabs`
- primary_route: `/`
- implementation_gate: TDD Implementation
- technical_shape: server-rendered home dashboard with a small client component for record tab state, plus separate month-scoped and year-scoped record data from the existing dashboard data source.

## Route Boundary

- Keep the authenticated home route at `src/app/(app)/(home)/page.tsx`.
- Do not add routes, route groups, query params, search params, or navigation entries.
- Keep month selection owned by existing `readDashboardMonth`, `MonthSwitcher`, and `loadMonthlyWorkspaceContext`.
- The selected record tab is not represented in the URL.
- The visible `紀錄` heading remains removed, but the route keeps `aria-label="紀錄"` on the panel section for semantic location and E2E selectors.

## Component Boundaries

| Component | Ownership |
|---|---|
| `src/app/(app)/(home)/page.tsx` | Server component orchestration: load workspace context, derive monthly records, build yearly trend points, render dashboard layout. |
| `src/app/home-record-tabs.tsx` | Client component for record tab state, tab labels, tab-specific empty copy, and filtered records passed into `RecordListDetail`. |
| `src/app/_record-detail/record-list-detail.tsx` | Existing record list/detail/edit/delete/reimbursement behavior. No ownership changes. |
| `src/components/ui/tabs.tsx` | Existing Radix-backed tab semantics and line variant styling. |
| `src/app/dashboard-charts.tsx` | Existing chart rendering. No prop contract change required beyond receiving monthly yearly-bucket points. |

## Data Contract

### Home Dashboard Data

Extend `HomeDashboardData` with:

```ts
type HomeDashboardData = {
  householdMembers: HouseholdMemberAccount[];
  categories: Category[];
  records: LedgerRecord[];
  yearlyRecords: LedgerRecord[];
};
```

- `records`: active records in the selected month only.
- `yearlyRecords`: active records in the selected calendar year only.
- Both collections remain household-scoped through the same authenticated household id.
- Both collections reuse `prismaLedgerRecordSelect` and `mapPrismaLedgerRecordToLedgerRecord`.

### Query Ranges

- Month range: `gte` first day of selected month UTC, `lt` first day of next month UTC.
- Year range: `gte` January 1 of selected year UTC, `lt` January 1 of next year UTC.
- Both queries filter `status: "active"`.
- Existing monthly report and access view continue to receive `records`, not `yearlyRecords`.

### Aggregate Strategy Decision

- Decision: keep full selected-year ledger rows for MVP implementation.
- Reason: The existing mapper, chart point builder, and small household data scale make this lower risk than adding a second aggregate query contract now.
- Watchpoint: if yearly record volume becomes large, introduce a reporting-oriented aggregate query that returns 12 monthly totals and running balance inputs without row-level ledger data.

## Trend Aggregation Ownership

- Keep yearly trend point construction local to `src/app/(app)/(home)/page.tsx` unless reuse emerges.
- Rename/retain the helper as a yearly-specific function, e.g. `buildYearlyTrendPoints(month, yearlyRecords)`.
- The helper returns the existing `MonthlyTrendPoint[]` shape:
  - `date`: `1月` through `12月`
  - `income`: monthly income total in whole currency units
  - `expense`: monthly expense total in whole currency units
  - `balance`: running yearly net in whole currency units
- Unknown or out-of-range records are ignored by bucket lookup.
- The chart component remains unchanged.

## Client State Ownership

- `HomeRecordTabs` owns tab state with local React state.
- Allowed values: `"all"`, `"expense"`, `"income"`.
- Default value: `"all"` mapping to visible label `全部收支`.
- Changing tabs does not call server actions, does not refresh the route, and does not update search params.
- Month changes remount or re-render the home route with default tab state. If the component remains mounted across month transitions in a future routing change, TDD should add a `key={month}` or an effect reset in the component.

## Filtering Rules

- `全部收支`: pass all selected-month active records to `RecordListDetail`.
- `支出紀錄`: pass only records where `record.type === "expense"`.
- `收入紀錄`: pass only records where `record.type === "income"`.
- Expense type intentionally includes both member-paid and fund-paid expense records. Do not branch on `paymentSource`.
- Filtering is presentation-only; authorization and household scoping stay server-side.

## Layout And Accessibility

- Keep `DashboardPanel` as the shared section wrapper.
- Add a controlled way to hide the visible heading for the record panel only, while preserving the section `aria-label`.
- Do not remove headings from `待退款` or `支出分類`.
- `HomeRecordTabs` uses `<TabsList aria-label="紀錄篩選" variant="line">`.
- The tabs row must be outside the scrollable list container.
- `RecordListDetail` remains responsible for scrollable `ItemGroup`, detail dialog focus return, infinite-scroll sentinel behavior, and mutation refresh.
- E2E helper `expectPanelTopLayout(recordsRegion, "紀錄")` must be revised because the visible `紀錄` heading is intentionally absent.

## Error, Loading, Empty Strategy

- No new loading state is required; the home page keeps existing route-level loading behavior.
- Data source errors follow existing server-rendered dashboard error behavior.
- Empty copy is owned by `HomeRecordTabs`:
  - all: `這個月份尚無紀錄。`
  - expense: `這個月份尚無支出紀錄。`
  - income: `這個月份尚無收入紀錄。`
- Empty filtered content must occupy the list content area and not collapse the dashboard panel.

## Auth And Permission Boundary

- `requireAuthenticatedMember` remains the route access boundary through `loadMonthlyWorkspaceContext`.
- Household scoping remains in `createHomeDashboardDataSource`.
- No new permission rules are introduced.
- The client tab filter is not a security boundary.
- Existing `RecordListDetail` action visibility and mutation authorization remain authoritative.

## Test Mapping

### Unit / Integration

- `src/app/home-dashboard-data-source.test.ts`
  - Assert monthly record query uses selected-month range.
  - Assert yearly record query uses selected-year range.
  - Assert search page lookup data returns empty `records` and `yearlyRecords`.

### E2E

- `e2e/dashboard.spec.ts`
  - Update dashboard render test:
    - assert record region exists by role.
    - assert `heading` named `紀錄` is absent.
    - assert tabs `全部收支`, `支出紀錄`, `收入紀錄` are visible.
  - Add tab filtering test:
    - default `全部收支` shows `六月生活費`, `補充用品代墊`, `網路費`.
    - `支出紀錄` shows `補充用品代墊`, `網路費` and hides `六月生活費`.
    - `收入紀錄` shows `六月生活費` and hides `補充用品代墊`, `網路費`.
  - Update fixed-height layout test:
    - keep title layout assertions for `待退款` and `支出分類`.
    - replace record panel heading assertion with tabs-top/region-content assertion.
  - Add trend label/range assertion where stable:
    - assert `收支趨勢` region contains chart axis labels such as `1月` and `12月`, or use a chart DOM assertion resilient to Recharts rendering.
    - keep existing chart-in-panel bounding checks.
  - Keep record detail tests for filtered and unfiltered rows.

### Fixture Plan

- Existing `prisma/seed.e2e.sql` already includes:
  - June income: `六月生活費`
  - June member-paid expense: `補充用品代墊`
  - June fund-paid expense: `網路費`
  - May reimbursed expenses inside 2026 for non-June yearly trend input.
- No fixture extension is required for initial TDD unless Recharts axis assertions need a clearer outside-month visible total.

## Implementation Preconditions

- Behavior Spec is committed at `ec480ad3`.
- Prototype code is committed at `712012f2`; implementation may evolve it through tests.
- `.env.local` symlink is local-only and ignored by git.
- Dev server may keep running, but TDD should run commands without assuming browser state.

## Verification Commands

Run after TDD implementation:

```bash
corepack pnpm vitest run src/app/home-dashboard-data-source.test.ts
corepack pnpm lint
corepack pnpm type-check
pnpm test:e2e e2e/dashboard.spec.ts
```

Note: do not run `lint` and `type-check` in parallel because both invoke `prisma generate` and can collide on `src/generated/prisma`.

## Release Target Implications

- release target: `local_dev`
- No database migration.
- No environment variable change.
- No auth callback or deployment configuration change.
- Target-Aware Release should refresh local dashboard verification after implementation.

## Risks And Mitigations

- Risk: fetching full selected-year records could become expensive.
  - Mitigation: acceptable for MVP; document aggregate-query upgrade path.
- Risk: E2E heading assertions fail because `紀錄` heading is intentionally removed.
  - Mitigation: update dashboard tests to use semantic region plus tab assertions.
- Risk: Recharts axis text can be brittle in E2E.
  - Mitigation: prefer stable region/chart existence checks plus data-source unit tests for yearly range; add axis label checks only if reliable.
- Risk: tab state persistence expectations drift.
  - Mitigation: keep local non-URL state; reset on route reload/month changes.

## Review Gate

- decision: ready_for_review
- reviewer_focus:
  - Confirm full selected-year row fetch is acceptable for MVP.
  - Confirm no URL state is needed for the record tab.
  - Confirm E2E should update existing heading assertions rather than restore the visible `紀錄` heading.
  - Confirm TDD can proceed by adding dashboard E2E expectations first, then evolving the existing prototype.
- acceptance_signals:
  - TDD Implementation can start with `e2e/dashboard.spec.ts` and `home-dashboard-data-source.test.ts`.
  - No foundation, domain, or release-design backfill is needed before implementation.
- unresolved_blockers:
  - None for moving to TDD Implementation after review approval.
- next_step:
  - TDD Implementation
