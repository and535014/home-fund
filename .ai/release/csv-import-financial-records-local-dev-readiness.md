---
id: csv-import-financial-records-local-dev-readiness
stage: target-aware-release
status: review
created_at: 2026-06-25
updated_at: 2026-06-25
release_target: local_dev
decision: ready_for_local_dev_review
review_gate: pending_user_review
reviewed_at:
trace_links:
  - .ai/intent/csv-import-financial-records.md
  - .ai/domain-impact/csv-import-financial-records.md
  - .ai/prototype/csv-import-financial-records.md
  - .ai/spec/csv-import-financial-records.md
  - .ai/technical-design/csv-import-financial-records.md
  - .ai/implementation/csv-import-financial-records.md
  - .ai/verification/csv-import-financial-records.md
  - README.md
  - prisma/migrations/20260625112000_add_ledger_import_audit/migration.sql
  - prisma/migrations/20260625203000_add_ledger_import_failed_audit/migration.sql
  - src/app/(app)/settings/import/page.tsx
  - src/app/(app)/settings/import/csv-import-panel.tsx
  - src/app/(app)/settings/import/csv-import-preview-ui.tsx
  - src/app/csv-import-actions.ts
  - src/modules/fund-ledger/ledger-import.ts
  - src/modules/fund-ledger/ledger-import-command.ts
  - e2e/csv-import.spec.ts
---

# CSV Import Financial Records Local Dev Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: `local_dev`
- production_readiness: not assessed
- rationale: CSV ledger import has passing schema validation, type-check, lint, unit/domain tests, production build, targeted CSV Playwright coverage, and full Playwright E2E coverage for the local development target.

## Release Scope

Included for local dev review:

- Settings route `/settings/import` with matching page title and settings navigation label `CSV 匯入`.
- Authorized admin/finance-manager access and general-member denial.
- CSV template download with header `type,date,name,amount,member,category,note`.
- Direct file selection with no modal before upload.
- Server-side CSV preview, exact header validation, row validation, member/category auto-match, mapping override, duplicate warning, and partial-success confirmation.
- Import audit tables for import batches and row statuses: imported, failed, skipped.
- Final toast counts in `成功`, `失敗`, `略過` order from server confirmation results.
- Imported ledger records appear in current-month homepage records and downstream ledger/reporting reads.
- Member-paid imported expenses enter the ordinary refundable state and do not create reimbursement payment evidence.
- Mobile preview table usability for file item, icon actions, and member/category select controls.

Out of scope:

- Direct reimbursement payment CSV import.
- Automatic reimbursement payment-to-expense reconciliation.
- Creating missing members or categories from CSV.
- Bank/card sync, receipt scanning, external financial integrations, background import jobs, rollback UI, and raw CSV retention.
- Production deployment readiness.

## Local Dev Checks

| Check | Evidence | Status |
|---|---|---|
| Schema validation | `corepack pnpm db:validate` | pass |
| Unit/domain tests | `corepack pnpm test`, 42 files / 200 tests | pass |
| Type checking | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass |
| Production build | `corepack pnpm build` | pass |
| Targeted CSV E2E | `corepack pnpm test:e2e e2e/csv-import.spec.ts`, 5 tests | pass |
| Full E2E | `corepack pnpm test:e2e`, 49 tests | pass |
| Migration application | E2E setup applied `20260625112000_add_ledger_import_audit` and `20260625203000_add_ledger_import_failed_audit` to `home_fund_e2e` | pass |
| Seed compatibility | E2E setup ran base seed and E2E seed after migration reset | pass |
| Working tree before release artifact | `git status --short` was clean after commit `4470fe2` before this release artifact | pass |

## Local Dev Runtime Requirements

- Docker Desktop and local PostgreSQL must be available for DB-backed E2E and local DB resets.
- Apply migrations before manual review:
  - `corepack pnpm db:deploy`
- Refresh deterministic dev data when needed:
  - `corepack pnpm db:seed`
- Reset local dev DB when needed:
  - `corepack pnpm db:up`
  - `corepack pnpm exec prisma migrate reset`
  - `corepack pnpm db:seed`
- Start local app:
  - `corepack pnpm dev`
- Review route:
  - `/settings/import`
- Downstream review routes:
  - `/`
  - `/search`

## Smoke Checks

Recommended local smoke after applying migrations and seed:

1. Sign in as an admin or finance manager.
2. Open `/settings/import`.
3. Confirm `CSV 匯入` appears in settings navigation and page title.
4. Download the template and confirm it does not contain `payment_source`.
5. Import a CSV with one income, one fund-paid expense, and one member-paid expense.
6. Confirm automatic member/category mappings appear in preview.
7. Change one row's member/category mapping and confirm the row becomes `可匯入`.
8. Remove one row, add it back, and confirm footer counts update.
9. Confirm import and verify the toast says final `成功`, `失敗`, and `略過` counts.
10. Open `/` for the same month and verify imported records appear in the record list.
11. Upload a likely duplicate row and verify `疑似重複` increases without blocking import.
12. Sign in as a general member and verify `/settings/import` redirects away.

## Accepted Local Dev Risks

- Partial success replaced the original all-or-nothing policy after Technical Design approval. Spec, Technical Design, Implementation, and Verification artifacts now reflect partial success, but reviewers should explicitly accept that behavior.
- Amount parsing is strict and does not accept thousands separators or currency symbols.
- Import audit stores file name, fingerprints, row numbers, row status, actor, and created record links, but not raw CSV contents.
- E2E depends on Docker Desktop and local PostgreSQL availability.
- `NO_COLOR` warnings may appear during Playwright startup because of environment color settings; this did not block E2E.

## Not Production Ready

Production readiness remains blocked until these are selected and verified:

- Hosting target, production database target, environment separation, and production secrets.
- Production migration rollout, rollback, backup/restore, and import audit retention policy.
- Production Google OAuth smoke with admin, finance manager, and general-member roles.
- Monitoring/logging and alerting for CSV preview, confirmation, and partial-failure cases.
- Operational policy and tooling for correcting or rolling back accidental bulk imports.
- CSV file-size/row-count limits and performance expectations beyond local-dev scale.
- Analytics or feedback instrumentation for import validation failures and template usability.

## Review Gate

- Decision needed: approve, request changes, or block.
- Recommended next gate after approval: Learning Loop for local_dev feedback signals, or Artifact Compression if learning is explicitly skipped.
