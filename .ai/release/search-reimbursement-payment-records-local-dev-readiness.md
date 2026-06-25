---
id: search-reimbursement-payment-records-local-dev-readiness
stage: target-aware-release
status: review
created_at: 2026-06-26
updated_at: 2026-06-26
release_target: local_dev
decision: ready_for_local_dev_review
review_gate: pending_user_review
reviewed_at:
trace_links:
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
  - .ai/prototype/search-reimbursement-payment-records.md
  - .ai/spec/search-reimbursement-payment-records.md
  - .ai/technical-design/search-reimbursement-payment-records.md
  - .ai/implementation/search-reimbursement-payment-records.md
  - .ai/verification/search-reimbursement-payment-records.md
  - prisma/migrations/20260625233000_add_reimbursement_payment_search_indexes/migration.sql
  - src/app/record-search-panel.tsx
  - src/app/record-search-controls.tsx
  - src/app/record-search-results.tsx
  - src/app/reimbursement-payment-dialogs.tsx
  - src/app/record-search-actions.ts
  - src/modules/reporting/reimbursement-payment-search-query.ts
  - e2e/record-search.spec.ts
---

# Search Reimbursement Payment Records Local Dev Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: `local_dev`
- production_readiness: not assessed
- rationale: reimbursement payment search has passing schema validation, targeted unit coverage, type-check, lint, production build, and full `record-search` Playwright coverage for the local development target.

## Release Scope

Included for local dev review:

- `/search` tabs: `收支紀錄` and `退款紀錄`.
- Separate tab state for ledger search and refund-record search.
- `退款紀錄` default prompt state with no records loaded until keyword or filter.
- Backend reimbursement payment search with household scope, payment date range, 收款成員, keyword matching, totals, and cursor pagination.
- Refund rows using the shared record-list rhythm with refund icon/fixed color, `付給 <收款成員>` title, payment method description, amount, and payment date.
- Read-only refund detail dialog with `查看關聯紀錄`.
- Related ledger records rendered through `RecordListItem`.
- Already-refunded member-paid expense detail readback through `查看退款紀錄` when payment evidence exists.
- Existing ledger search, selection mode, pagination, batch delete, and batch refund behavior preserved.
- E2E seed reimbursement payment fixtures for record-search coverage.

Out of scope:

- Creating, editing, deleting, reversing, or correcting reimbursement payment evidence from the search page.
- Treating reimbursement payment evidence as ordinary income or expense.
- Production full-text search, external payment execution, bank sync, reconciliation, analytics, or operational monitoring.
- Production deployment readiness.

## Local Dev Checks

| Check | Evidence | Status |
|---|---|---|
| Schema validation | `corepack pnpm db:validate` | pass |
| Targeted unit/query/action tests | `corepack pnpm vitest run src/modules/reporting/reimbursement-payment-search-query.test.ts src/app/record-search-actions.test.ts src/modules/reporting/record-search-query.test.ts src/app/record-query.test.ts src/lib/utils.test.ts`, 5 files / 23 tests | pass |
| Type checking | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass |
| Production build | `corepack pnpm build` | pass |
| Targeted record-search E2E | `corepack pnpm test:e2e e2e/record-search.spec.ts`, 12 tests | pass |
| Migration application | E2E setup applied `20260625233000_add_reimbursement_payment_search_indexes` to `home_fund_e2e` | pass |
| Seed compatibility | E2E setup ran base seed and E2E seed after migration reset | pass |
| Working tree before release artifact | `git status --short` was clean after commit `28faea0c` before this release artifact | pass |

## Local Dev Runtime Requirements

- Docker Desktop and local PostgreSQL are required for DB-backed E2E and local DB resets.
- Apply migrations before manual review:
  - `corepack pnpm db:deploy`
- Refresh deterministic dev data when needed:
  - `corepack pnpm db:seed`
- Start local app:
  - `corepack pnpm dev`
- Review route:
  - `/search`

## Smoke Checks

Recommended local smoke after applying migrations and seed:

1. Sign in as a household member.
2. Open `/search`.
3. Confirm `收支紀錄` is selected by default and the search placeholder is `搜尋收支紀錄`.
4. Search an ordinary ledger keyword and confirm selection mode plus ledger batch footer still work.
5. Switch to `退款紀錄` and confirm no records appear before keyword/filter.
6. Search `退款紀錄` and confirm refund rows show `付給 <收款成員>`, payment method, amount, and payment date.
7. Open `篩選與排序` in `退款紀錄`; confirm `收款成員`, payment dates, and sort exist, and `付款方式` is absent.
8. Open a refund row and confirm the dialog title is `退款紀錄`, with read-only fields and no edit/delete/refund buttons.
9. Click `查看關聯紀錄` and confirm ordinary ledger rows open with category visuals.
10. Search an already-refunded member-paid expense in `收支紀錄`; open detail and click `查看退款紀錄`.
11. On a mobile viewport, confirm tabs and `關閉搜尋頁` share one row.

## Accepted Local Dev Risks

- Full `corepack pnpm test` and full `corepack pnpm test:e2e` were not rerun in this gate; targeted unit coverage, type-check, lint, build, and full `record-search` E2E passed.
- The E2E reimbursement payment fixtures are local-dev verification data only and are not product seed requirements.
- Already-refunded legacy expenses without payment evidence still show `已退款` but no `查看退款紀錄` action.
- E2E depends on Docker Desktop and local PostgreSQL availability.
- `NO_COLOR` warnings may appear during Playwright startup because of environment color settings; this did not block E2E.

## Not Production Ready

Production readiness remains blocked until these are selected and verified:

- Production database migration rollout and rollback plan for reimbursement payment search indexes.
- Production auth/session smoke for refund evidence visibility by role/member.
- Monitoring/log access for reimbursement payment search server actions.
- Query performance and index behavior against production-scale reimbursement payment data.
- User-facing correction/reversal policy for wrong reimbursement payment evidence.
- Analytics or feedback signals for whether users understand the `退款紀錄` versus ordinary ledger record distinction.

## Review Gate

- Decision needed: approve, request changes, or block.
- Recommended next gate after approval: Learning Loop for local_dev feedback signals, or Artifact Compression if learning is explicitly skipped.
