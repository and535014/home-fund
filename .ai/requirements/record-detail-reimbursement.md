# Record Detail Reimbursement

- status: done
- date: 2026-06-21
- source: .ai/archive/archive-record-detail-reimbursement-2026-06-21.md

## 需求

Users can open a dashboard record detail and perform `退款` on an eligible member-paid expense.

## 執行方式

Reused existing Next.js App Router, React client modal, local Dialog/Button/Item/Alert components, Prisma/PostgreSQL, Vitest, Playwright, and existing workflow artifacts.

Added `reimburseLedgerRecordAction`, `parseReimburseLedgerRecordForm`, active-only reimbursement persistence, domain rejection for non-active expenses, and real form submission from `RefundRecordDialog`. Reused `markExpensesReimbursedInDatabase` and `ReimbursementBatch`.

## 最終結果

Eligible active member-paid refundable expenses show `退款`; confirmation uses `確認退款`; success marks exactly one record as `已退款`, shows `已完成退款`, refreshes dashboard data, and hides `退款`, `編輯`, and `刪除`.

`local_dev` ready for review. `corepack pnpm test`, `type-check`, `lint`, `build`, and full `test:e2e` passed; E2E suite includes record-detail refund success.

## 特殊決策

`退款` means app settlement state, not bank transfer. Reimbursement remains one-time. Only admin/finance-capable actors can reimburse. Income, fund-paid, voided, non-refundable, and already reimbursed records are not eligible.

Local review should check whether users discover `退款`, understand it as app settlement, trust the confirmation, and understand why edit/delete disappear after `已退款`.

## Bug / 阻礙

`/reimbursements` remains a placeholder; refund reversal is out of scope; production readiness, monitoring, rollback, OAuth production smoke, and external payment behavior are not assessed.
