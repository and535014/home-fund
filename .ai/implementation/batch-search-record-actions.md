---
id: implementation-batch-search-record-actions
stage: tdd-implementation
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
outputs:
  - server_backed_search_pagination
  - search_page_footer_totals
  - visible_row_selection
  - batch_delete_action
  - batch_refund_action
  - removed_reimbursements_route_cleanup
  - focused_test_evidence
trace_links:
  schema:
    - prisma/schema.prisma
    - prisma/migrations/20260622143000_add_search_pagination_indexes/migration.sql
  app:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-panel.tsx
    - src/app/record-search-controls.tsx
    - src/app/batch-search-footer.tsx
    - src/app/batch-action-dialog.tsx
    - src/app/record-search-batch-utils.ts
    - src/app/record-search-actions.ts
    - src/app/home-dashboard-data-source.ts
    - src/app/ledger-record-actions.ts
    - src/app/(app)/page.tsx
  domain:
    - src/modules/reporting/record-search-query.ts
    - src/modules/fund-ledger/ledger-record-batch-actions.ts
    - src/modules/reimbursement/reimbursement-batch-actions.ts
  tests:
    - src/modules/reporting/record-search-query.test.ts
    - src/modules/fund-ledger/ledger-record-batch-actions.test.ts
    - src/modules/reimbursement/reimbursement-batch-actions.test.ts
    - src/app/home-dashboard-data-source.test.ts
    - e2e/record-search.spec.ts
    - e2e/dashboard.spec.ts
    - e2e/create-record.spec.ts
reviewed_at: 2026-06-22
---

# Batch Search Record Actions Implementation

## Summary

- Replaced `/search` full-record preload with server-backed search page loading.
- Added 100-record cursor pagination with stable sort cursors and signed query totals.
- Kept `PageFooter` hidden before a query is active; normal mode shows result count and absolute `總額` colored by sign.
- Kept selection mode explicit through the icon button; `全選目前顯示` selects only currently loaded/rendered rows.
- Added server actions for loading search pages, batch delete, and batch refund.
- Added partial-success domain commands for batch delete and batch refund.
- Batch refund confirmation shows `退款總金額`; batch buttons show counts in parentheses.
- Added search pagination indexes through Prisma schema and migration.
- Removed stale `/reimbursements` revalidation/copy/E2E placeholder expectations and removed direct-visit E2E coverage for deleted routes.
- Split the large search panel into focused UI modules for controls, footer, batch confirmation, and batch eligibility/format helpers while keeping state orchestration in `RecordSearchPanel`.

## TDD Evidence

Tests were added before implementation for:

- search query translation, cursor ordering, and signed net totals.
- batch delete partial success and skipped records.
- batch refund partial success, skipped records, no eligible records, and permission rejection.
- browser selection mode, visible-row all-select, batch refund total, and batch delete count.

Verification commands run in this implementation gate:

- `corepack pnpm vitest run src/modules/reporting/record-search-query.test.ts src/modules/fund-ledger/ledger-record-batch-actions.test.ts src/modules/reimbursement/reimbursement-batch-actions.test.ts`
  - result: passed, 3 files / 9 tests
- `corepack pnpm type-check`
  - result: passed
- `corepack pnpm lint`
  - result: passed
- `corepack pnpm test`
  - result: passed, 33 files / 161 tests
- `corepack pnpm test:e2e e2e/record-search.spec.ts`
  - result: passed, 7 tests
- `corepack pnpm test:e2e e2e/dashboard.spec.ts e2e/create-record.spec.ts`
  - result: passed, 15 tests after removing direct-visit and navigation-absence tests for deleted routes.
- `corepack pnpm vitest run src/app/dashboard-navigation.test.ts`
  - result: passed, 1 file / 3 tests after removing the standalone reimbursement navigation absence test.
- `corepack pnpm type-check`
  - result: passed after deleted-route test cleanup.
- `corepack pnpm type-check`
  - result: passed after extracting search UI components.
- `corepack pnpm lint`
  - result: passed after extracting search UI components.
- `corepack pnpm test:e2e e2e/record-search.spec.ts`
  - result: passed, 7 tests after extracting search UI components.

## Implemented Contracts

- `/search` initially shows no footer and no results until a keyword/filter/sort query is active.
- Active search calls `loadRecordSearchPageAction` and receives records, `nextCursor`, total count, and signed net total.
- Search pagination uses 100 records per server page and appends the next page when the sentinel intersects.
- Current-query total treats income as positive and expense as negative, then renders the absolute amount with sign color.
- Selection mode uses compact row selection controls and a footer-only action surface.
- `全選目前顯示` selects loaded/rendered rows only; unloaded pages are not selected.
- Batch delete uses the existing delete authorization/mutability rules per selected record and voids only eligible records.
- Batch refund requires reimbursement authorization and marks eligible active member-paid refundable expenses as reimbursed in one reimbursement batch.
- Missing, unauthorized, voided, already reimbursed, fund-paid, and non-expense records are skipped with explicit reason codes.
- Successful batch actions revalidate `/` and `/search`; no code revalidates `/reimbursements`.
- `/reimbursements` remains deleted; direct route behavior is left to framework default 404 without E2E direct-visit coverage.

## Known Gaps For Verification

- Full Playwright suite was not run; targeted search/dashboard/create-record E2E covered the changed surfaces.
- Query performance is protected by new indexes, but no query-plan evidence was collected in this local_dev implementation gate.
- Full-text search remains out of scope; keyword search keeps current name and normalized amount matching.
- Cross-page "select all matching query" is intentionally not implemented.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - confirm visible-row all-select wording and disabled state feel clear.
  - inspect batch refund confirmation amount and partial-success feedback.
  - inspect footer behavior before/after search and in selection mode.
  - confirm removed-route direct-visit E2E coverage stays out of scope.
- acceptance_signals:
  - server-backed search no longer preloads all active records.
  - page size is 100 with cursor pagination.
  - batch delete/refund use server/domain authorization and eligibility checks.
  - type-check, lint, unit tests, and targeted E2E pass.
- unresolved_blockers:
  - Verification gate should decide whether to run the full E2E suite before release readiness.
- recommended_next_gate:
  - verification
- stop_condition: Wait for explicit user approval before moving to Verification.
