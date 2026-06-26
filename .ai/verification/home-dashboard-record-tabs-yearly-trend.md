---
id: home-dashboard-record-tabs-yearly-trend
stage: verification
status: passed
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/home-dashboard-record-tabs-yearly-trend.md
  - .ai/prototype/home-dashboard-record-tabs-yearly-trend.md
  - .ai/spec/home-dashboard-record-tabs-yearly-trend.md
  - .ai/technical-design/home-dashboard-record-tabs-yearly-trend.md
  - .ai/implementation/home-dashboard-record-tabs-yearly-trend.md
  - commit:712012f2
  - commit:ec480ad3
  - commit:e46f3f3a
  - commit:2b2f529b
outputs:
  - verification_result
  - test_evidence
  - risk_review
  - next_gate_recommendation
trace_links:
  implementation:
    - .ai/implementation/home-dashboard-record-tabs-yearly-trend.md
  tests:
    - src/app/home-dashboard-data-source.test.ts
    - e2e/dashboard.spec.ts
  code:
    - src/app/(app)/(home)/page.tsx
    - src/app/home-record-tabs.tsx
    - src/app/home-dashboard-data-source.ts
    - prisma/seed.sh
reviewed_at: 2026-06-27
---

# Home Dashboard Record Tabs And Yearly Trend Verification

## Decision Summary

- decision: passed
- verified_release_target: local_dev
- implementation_commit: `2b2f529b Implement home dashboard record tabs`
- scope_verified:
  - record region line tabs
  - selected-month record filtering
  - visible `紀錄` heading removal with semantic region retained
  - yearly trend data source contract
  - dashboard E2E coverage
  - Prisma 7 seed execution compatibility
- next_gate: Target-Aware Release for `local_dev`

## Checks Run

- `corepack pnpm vitest run src/app/home-dashboard-data-source.test.ts`
  - result: passed
  - coverage: month-range and year-range data source contract.
- `corepack pnpm lint`
  - result: passed
- `corepack pnpm type-check`
  - result: passed
- `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e SEED_GOOGLE_ACCOUNT_EMAIL=admin@e2e.local corepack pnpm db:seed`
  - result: passed after changing `prisma/seed.sh` to use `prisma db execute --stdin`.
- `CI=true corepack pnpm test:e2e e2e/dashboard.spec.ts -g "renders the dashboard|filters dashboard records|fixed-height page"`
  - result: passed, 3 tests.
- `CI=true corepack pnpm test:e2e e2e/dashboard.spec.ts`
  - result: passed, 10 tests.

## Behavior Verification

- The home dashboard record region is still discoverable as region `紀錄`.
- The visible `紀錄` heading is intentionally absent.
- Record tabs are exactly `全部收支`, `支出紀錄`, and `收入紀錄`.
- `全部收支` is active by default.
- `支出紀錄` includes both member-paid and fund-paid expenses and excludes income records.
- `收入紀錄` includes income records and excludes expense records.
- The record tabs sit above the scrollable record list in the fixed-height dashboard panel.
- Existing record detail flows continue to be covered by dashboard E2E.
- `HomeDashboardData.records` remains selected-month active records from the data source.
- `HomeDashboardData.yearlyRecords` is selected-year active records from the data source.
- The home page no longer re-filters `records` by status/month prefix; it trusts the data source contract and only reverses display order.

## Technical Alignment

- Route boundary remains `/`.
- No new URL state or persistent preference was added for record tabs.
- `HomeRecordTabs` owns only local tab state and presentation filtering.
- Server-side household and active-record scoping remains in `createHomeDashboardDataSource`.
- `RecordListDetail` remains the owner of record detail, edit/delete, reimbursement, and focus-return behavior.
- No database migration or domain rule change was introduced.
- `prisma/seed.sh` change is test/support infrastructure only and was necessary for reliable Prisma 7.8 `db execute` behavior in this workspace.

## Prototype Gap Review

- Production-stack prototype was implemented on the real home dashboard route.
- Prototype gap "full Playwright visual review not run" is closed for the dashboard spec through `e2e/dashboard.spec.ts`.
- Prototype gap "selected tab not persisted" is accepted as intended behavior by spec and technical design.
- Prototype gap "full selected-year rows instead of aggregate query" is accepted for MVP/local_dev, with aggregate-query upgrade path documented in technical design.

## Residual Risks

- Yearly trend is verified through data source unit coverage and dashboard chart presence/layout; E2E does not assert every Recharts axis label because those DOM details can be brittle.
- Fetching full selected-year ledger rows is acceptable for current household-scale MVP, but may need aggregate query ownership if yearly volume grows.
- This verification supports `local_dev` only. It does not assert production OAuth, production database, production monitoring, rollback, or release smoke readiness.

## Review Gate

- decision: passed
- accepted_risks:
  - Full selected-year rows retained for MVP instead of aggregate query.
  - Recharts axis labels are not exhaustively asserted in E2E.
- unresolved_blockers:
  - None for `local_dev` target-aware release.
- next_step:
  - Target-Aware Release for `local_dev`
