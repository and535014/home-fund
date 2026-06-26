---
id: home-dashboard-record-tabs-yearly-trend
stage: tdd-implementation
status: ready_for_verification
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/home-dashboard-record-tabs-yearly-trend.md
  - .ai/technical-design/home-dashboard-record-tabs-yearly-trend.md
  - .ai/prototype/home-dashboard-record-tabs-yearly-trend.md
  - commit:712012f2
  - commit:ec480ad3
  - commit:e46f3f3a
outputs:
  - dashboard_e2e_coverage
  - seed_script_prisma7_compatibility_fix
  - verification_evidence
trace_links:
  tests:
    - e2e/dashboard.spec.ts
    - src/app/home-dashboard-data-source.test.ts
  support:
    - prisma/seed.sh
  implemented_prototype:
    - src/app/(app)/(home)/page.tsx
    - src/app/home-record-tabs.tsx
    - src/app/home-dashboard-data-source.ts
reviewed_at: 2026-06-27
---

# Home Dashboard Record Tabs And Yearly Trend Implementation

## Decision Summary

- decision: ready_for_verification
- implementation_scope: dashboard E2E coverage and E2E seed compatibility fix
- prior_code_commit: `712012f2 Prototype home dashboard record tabs`
- spec_commit: `ec480ad3 Spec home dashboard record tabs`
- technical_design_commit: `e46f3f3a Design home dashboard record tabs`
- next_gate: Verification

## TDD Slice

This implementation gate focused on the missing executable coverage for the accepted prototype:

- The home dashboard record region keeps semantic label `紀錄` while removing the visible `紀錄` heading.
- The record tabs are `全部收支`, `支出紀錄`, and `收入紀錄`.
- The default tab is `全部收支`.
- `支出紀錄` filters to selected-month expense records, including both member-paid and fund-paid expenses.
- `收入紀錄` filters to selected-month income records.
- The fixed-height dashboard layout now checks the record tabs as the non-scrolling top control instead of expecting a visible `紀錄` heading.

## Tests Added Or Updated First

- Updated `e2e/dashboard.spec.ts` render coverage:
  - asserts `region` named `紀錄` exists.
  - asserts visible heading `紀錄` is absent inside the region.
  - asserts tabs `全部收支`, `支出紀錄`, `收入紀錄` exist.
- Added dashboard tab filtering E2E:
  - default `全部收支` shows June income and expense records.
  - `支出紀錄` shows `補充用品代墊` and `網路費`, hides `六月生活費`.
  - `收入紀錄` shows `六月生活費`, hides `補充用品代墊` and `網路費`.
- Updated fixed-height dashboard E2E helper:
  - `待退款` and `支出分類` still use visible heading layout assertions.
  - `紀錄` uses a dedicated tabs-above-list layout assertion.

## Implementation Changes

- No additional product UI behavior changes were needed beyond the accepted prototype code.
- Review feedback addressed: removed redundant `status` and month-prefix filtering from the home page because `HomeDashboardData.records` is already active selected-month data from the data source.
- Updated `prisma/seed.sh` from `prisma db execute --file "$tmp_file"` to `prisma db execute --stdin < "$tmp_file"`.
- Reason for seed change: under Prisma 7.8 in this workspace, `prisma db execute --file` reported P1014 for quoted model tables even when migrations had created them; `--stdin` executes the same generated SQL successfully and unblocks E2E setup.

## Verification Evidence

- `corepack pnpm vitest run src/app/home-dashboard-data-source.test.ts` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm type-check` passed.
- `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e SEED_GOOGLE_ACCOUNT_EMAIL=admin@e2e.local corepack pnpm db:seed` passed after the seed script update.
- `CI=true corepack pnpm test:e2e e2e/dashboard.spec.ts -g "renders the dashboard|filters dashboard records|fixed-height page"` passed: 3 tests.
- `CI=true corepack pnpm test:e2e e2e/dashboard.spec.ts` passed: 10 tests.

## Notes

- The first full dashboard E2E run exposed E2E seed infrastructure failure before the seed script fix:
  - `prisma db execute --file` reported missing tables despite migrations succeeding.
  - switching to `--stdin` fixed the seed path and allowed the suite to pass.
- `lint` and `type-check` were run sequentially because both invoke `prisma generate`.
- No database migration, route change, auth change, or domain rule change was introduced.

## Review Gate

- decision: ready_for_verification
- reviewer_focus:
  - Confirm E2E coverage matches the approved tab labels and heading removal.
  - Confirm the seed script compatibility fix is acceptable as test infrastructure support.
  - Confirm Verification can proceed with the recorded commands and dashboard E2E result.
- unresolved_blockers:
  - None.
- next_step:
  - Verification
