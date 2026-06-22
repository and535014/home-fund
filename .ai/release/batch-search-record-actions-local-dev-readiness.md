---
id: release-batch-search-record-actions-local-dev-readiness
stage: release
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/batch-search-record-actions.md
  - .ai/domain-impact/batch-search-record-actions.md
  - .ai/prototype/batch-search-record-actions.md
  - .ai/spec/batch-search-record-actions.md
  - .ai/technical-design/batch-search-record-actions.md
  - .ai/implementation/batch-search-record-actions.md
  - .ai/verification/batch-search-record-actions.md
outputs:
  - local_dev_release_assessment
  - migration_readiness
  - smoke_check_plan
  - accepted_risks
trace_links:
  commits:
    - 449bb6d
    - dc172fd
  migration:
    - prisma/migrations/20260622143000_add_search_pagination_indexes/migration.sql
  app:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-actions.ts
    - src/app/record-search-panel.tsx
    - src/app/record-search-controls.tsx
    - src/app/batch-search-footer.tsx
    - src/app/batch-action-dialog.tsx
  tests:
    - e2e/record-search.spec.ts
    - e2e/dashboard.spec.ts
    - e2e/create-record.spec.ts
reviewed_at: 2026-06-22
---

# Batch Search Record Actions Local Dev Release Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_ready
- rationale: The slice has passing type-check, lint, full unit suite, targeted browser E2E, E2E migration deployment, and >100-record page-two fixture coverage. It is ready for local development review after applying migrations and seed data.

## Release Scope

Included in this local_dev readiness assessment:

- Server-backed `/search` pagination with 100-record pages.
- Search footer result count and signed net total displayed as absolute value with sign color.
- Explicit selection mode with visible-row `全選目前顯示`.
- Batch delete with partial success and server-side authorization.
- Batch refund with partial success, persisted reimbursement batch, and refund total confirmation.
- Removed standalone `/reimbursements` page behavior from navigation/revalidation/test expectations.
- E2E fixture coverage for 105 matching search records and second-page loading.

Out of scope:

- Production deployment readiness.
- Production-scale query-plan evidence.
- Cross-page "select all matching query" behavior.
- Direct E2E assertions for deleted routes.
- Mobile footer Playwright project coverage.

## Release Checks

| Check | Evidence | Status |
|---|---|---|
| Type checking | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass |
| Unit/domain tests | `corepack pnpm test`, 33 files / 160 tests | pass |
| Search E2E | `corepack pnpm test:e2e e2e/record-search.spec.ts`, 8 tests | pass |
| Dashboard/create regression E2E | `corepack pnpm test:e2e e2e/dashboard.spec.ts e2e/create-record.spec.ts`, 15 tests | pass |
| Migration application | E2E setup applied `20260622143000_add_search_pagination_indexes` to `home_fund_e2e` | pass |
| Seed compatibility | E2E setup ran base seed and E2E seed, including 105 search pagination records | pass |
| Working tree before release artifact | `git status --short` was clean after commit `dc172fd` before this release artifact | pass |

## Local Dev Runtime Requirements

- Docker Desktop and local PostgreSQL must be available.
- Apply migrations before local review:
  - `corepack pnpm db:deploy`
- Refresh deterministic demo data when needed:
  - `corepack pnpm db:seed`
- Start local app:
  - `corepack pnpm dev`
- Review route:
  - `/search`

## Smoke Checks

Recommended local smoke after applying migrations and seed:

1. Open `/search`.
2. Confirm no page footer appears before entering a keyword or filter.
3. Search `代墊`; confirm result count, `總額`, and detail navigation.
4. Toggle selection mode and select visible records.
5. Confirm footer changes to selected count and selected total.
6. Open `確認批次退款`; confirm `退款總金額` is shown.
7. Search `搜尋分頁測試`; confirm `搜尋結果 105 筆`.
8. Scroll to `載入更多紀錄...`; confirm the remaining records load.
9. Confirm `全選目前顯示` does not select unloaded records before the second page appears.
10. Confirm `/reimbursements` is not used as a workflow surface.

## Accepted Local Dev Risks

- Mobile footer behavior was not covered by a mobile Playwright project in this gate; desktop E2E and responsive CSS review are acceptable for local_dev.
- Query-plan evidence was not collected; indexes were added and migration deployment passed, but production-scale plans remain a stricter-target concern.
- Full browser E2E was not run; targeted changed-surface E2E plus full unit suite passed.
- Direct deleted-route E2E coverage was intentionally removed by user direction.
- E2E depends on Docker Desktop and local Postgres availability.

## Not Production Ready

Production readiness remains blocked until these are selected and verified:

- Hosting target, database target, environment separation, and production secrets.
- Production migration rollout/rollback and backup/restore expectations.
- Production OAuth smoke with real users and role coverage.
- Production query-plan evidence for expected record volume.
- Monitoring/logging, alerting, and incident response.
- Mobile/responsive browser coverage if mobile use is release-critical.
- Analytics/learning signals for batch action usage and skipped-record outcomes.

## Handoff

- decision: ready_for_user_local_dev_review
- recommended_next_gate: Learning Loop for local_dev signals, or Artifact Compression if learning is explicitly skipped.
- reviewer_focus:
  - confirm local_dev readiness is sufficient
  - confirm mobile E2E can remain accepted risk for local_dev
  - confirm production readiness is not implied
- stop_condition: Wait for explicit user approval before committing this release artifact or starting Learning Loop.
