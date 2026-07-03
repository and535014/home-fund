# CSV Import Financial Records

- status: done
- date: 2026-06-25
- source: .ai/archive/archive-csv-import-financial-records-2026-06-25.md

## 需求

Add controlled CSV import so authorized household finance users can bring existing income and expense records into Home Family Fund without manual re-entry.

## 執行方式

Existing Next.js App Router, React client/server component split, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, Playwright, and Docker-backed local database foundation were reused. No new app foundation was introduced.

Added dedicated `import_ledger_records` authorization and `canImportLedgerRecords` access hint. Server actions preview, re-preview, and confirm import using a signed preview token. Parser/validator live in `src/modules/fund-ledger/ledger-import.ts`; Prisma-backed preview/confirm and audit live in `src/modules/fund-ledger/ledger-import-command.ts`. Import audit persistence uses `LedgerImportBatch`, `LedgerImportRow`, `failedRowCount`, and row statuses `imported`, `failed`, `skipped`. Raw CSV contents are not stored. Confirmation allows partial success: valid active rows are imported, invalid active rows are audited as failed, and removed rows are audited as skipped.

## 最終結果

CSV import lives at `設定 > CSV 匯入`. Admins and finance managers can access it; general members cannot. The template header is `type,date,name,amount,member,category,note`, with no `payment_source`. File selection opens directly from the import button, no modal. Preview shows selected file, row-level validation, member/category mapping, duplicate summary, removable/add-back rows, sortable table, and footer counts. Successful import resets the page and shows final server counts in `成功`, `失敗`, `略過` order.

Target is `local_dev`; readiness is approved for local review, not production. Verification passed `corepack pnpm db:validate`, `corepack pnpm test` (42 files / 200 tests), `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm build`, targeted CSV Playwright E2E (5 tests), and full Playwright E2E (49 tests). E2E applied both ledger import audit migrations to `home_fund_e2e`.

## 特殊決策

CSV upload/preview has no financial effect. Confirmation creates ordinary active ledger records under the same rules as manual income, fund-paid expense, and member-paid expense creation. Member-paid imported expenses become refundable and are not marked reimbursed. Direct reimbursement payment CSV import is out of scope because payment rows cannot safely identify the settled expenses without a future reconciliation workflow. Duplicate rows are warnings, not automatic skips or blockers.

Learning Loop was skipped by explicit user direction. Future local feedback should watch whether users can prepare the template, understand `需處理` vs `疑似重複`, trust automatic display-name/category-name matching, recover from failed rows, and accept partial success.

## Bug / 阻礙

Partial success replaced the original all-or-nothing policy after Technical Design approval; source artifacts now reflect partial success, but reviewers should explicitly accept it. Amount parsing is strict and does not accept thousands separators or currency symbols. Import audit stores file name, fingerprints, row numbers, status, actor, and created record links, but not raw CSV contents. Production readiness remains unassessed.
