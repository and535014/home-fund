# Search Reimbursement Payment Records

- status: done
- date: 2026-06-26
- source: .ai/archive/archive-search-reimbursement-payment-records-2026-06-26.md

## 需求

Make reimbursement payment evidence discoverable from `/search` without mixing it with ordinary income/expense ledger records or report totals.

## 執行方式

Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, Playwright, and Docker-based local database foundation were reused. No foundation change was required.

Added `src/modules/reporting/reimbursement-payment-search-query.ts` as the reporting read model; added `/search` server actions for page load, single-record readback, and batch readback; added reimbursement payment search indexes in migration `20260625233000_add_reimbursement_payment_search_indexes`; split route-local UI into `record-search-results`, `reimbursement-payment-dialogs`, `reimbursement-payment-loader`, and display helpers; kept mutation ownership in ledger/reimbursement server actions.

## 最終結果

`/search` has two tabs: `收支紀錄` and `退款紀錄`. `退款紀錄` stays blank until a keyword or filter is applied. Refund records are read-only, use row copy `付給 <收款成員>` with payment method as description, show amount and payment date, and open a read-only `退款紀錄` dialog. The dialog exposes `查看關聯紀錄`, and already-refunded member-paid expenses can open the related refund record through `查看退款紀錄`.

Target is `local_dev`; release readiness is `ready_for_local_dev_review`, not production. Verification passed targeted query/action/unit tests, type-check, lint, production build, and `corepack pnpm test:e2e e2e/record-search.spec.ts` with 12 Playwright tests. E2E applied the reimbursement payment search migration to `home_fund_e2e`.

## 特殊決策

`退款紀錄` is the user-facing term for reimbursement payment evidence backed by `ReimbursementPayment`. Reimbursement payment evidence is not an ordinary `LedgerRecord`, must not affect income/expense/net totals, remains excluded from selection and batch mutation actions, and is scoped by household and actor access. Legacy `已退款` expenses without payment evidence remain valid and should not fabricate a refund record.

Local review should test whether users understand `退款紀錄` as payment evidence rather than ordinary records, whether blank default state is desirable, whether `收款成員`/payment date/sort are enough filters, whether `付款方式` needs a future filter, whether bidirectional readback is discoverable, and whether edit/reversal/correction/partial refund should become separate intents.

## Bug / 阻礙

Full unit suite and full E2E suite were not rerun in the release gate; targeted unit coverage and full record-search E2E passed. E2E reimbursement payment fixtures are verification data only. Production migration rollout, auth smoke, monitoring/logging, query performance at production scale, and correction/reversal policy remain unassessed.
