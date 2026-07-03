# Batch Search Record Actions

- status: done
- date: 2026-06-22
- source: .ai/archive/archive-batch-search-record-actions-2026-06-22.md

## 需求

Search results now support explicit selection mode and batch actions for delete and refund. The standalone `/reimbursements` page is removed; refund work is reached from record-oriented surfaces.

## 執行方式

Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, local UI components, Vitest, and Playwright foundation were reused. No new foundation or domain table was introduced.

`/search` uses server-backed cursor pagination with `SEARCH_RECORD_PAGE_SIZE = 100`, stable sort cursors, and query-wide `totalCount` plus signed `totalNetAmountCents`. Search query translation lives in `src/modules/reporting/record-search-query.ts`. Batch commands live in `src/modules/fund-ledger/ledger-record-batch-actions.ts` and `src/modules/reimbursement/reimbursement-batch-actions.ts`. `PageFooter` is the shared non-card footer wrapper. Prisma search pagination indexes were added.

## 最終結果

`/search` keeps normal detail-opening behavior until the user toggles selection mode. The footer appears only after a query/filter is active. Normal mode shows `搜尋結果 <n> 筆` and `總額`; selection mode shows selected count and selected total only. `全選目前顯示` selects only currently loaded/rendered rows. Batch delete/refund are partial-success actions with skipped records, and batch refund confirmation shows `退款總金額`.

Target is `local_dev`; readiness is approved for local review, not production. Required local review includes applying migrations, seed data, `/search` smoke checks, pagination smoke with `搜尋分頁測試`, and batch action confirmation review.

## 特殊決策

Selection is UI/read-model state and does not grant mutation rights. Batch delete voids eligible active records using existing delete authorization and never hard-deletes. Batch refund marks eligible active member-paid refundable expenses as reimbursed once. Unauthorized, voided, already reimbursed, fund-paid, income, and missing records are skipped.

Local review should observe whether users understand `批次退款`, skipped records, `全選目前顯示`, footer totals, removal of `/reimbursements`, and 100-record pagination. Future production signals should track selection mode, all-select, processed/skipped counts, server action failures, and pagination latency without logging sensitive record details.

## Bug / 阻礙

Mobile footer E2E coverage was not run; query-plan evidence was not collected; full browser E2E was not run; direct deleted-route E2E coverage was intentionally removed; production readiness remains unassessed.
