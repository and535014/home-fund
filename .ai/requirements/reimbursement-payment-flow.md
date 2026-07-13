# Reimbursement Payment Flow

- status: done
- date: 2026-06-25
- source: .ai/archive/archive-reimbursement-payment-flow-2026-06-25.md

## 需求

Refund settlement should record real-world reimbursement payment evidence instead of only changing a ledger record to `已退款`.

## 執行方式

Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, local UI components, Vitest, Playwright, and Docker-based local database foundation were reused. No project foundation change was required.

Added `ReimbursementPayment` persistence with Prisma migration `20260624172000_add_reimbursement_payments`. `MarkExpensesReimbursedCommand` remains a pure domain selection command; payment settlement persistence is handled by a separate shared helper. Single-record and batch refund write reimbursement batch, payment evidence, and ledger status atomically. Batch delete and batch refund dialogs are separate components.

## 最終結果

Single-record and batch refund require payment method and date-only payment date, plus optional transaction note. The refund form shows only editable payment fields and does not expose paid-to member, refund amount, or payment source as form controls. Batch refund shows `將處理`, `略過`, and `退款總金額`; confirmation is disabled when eligible selected records span multiple paid-to members.

Target is `local_dev`; readiness is approved for local review, not production. Verification passed `corepack pnpm db:validate`, `type-check`, `lint`, full unit tests, and full Playwright E2E. E2E applied the reimbursement payment migration to `home_fund_e2e`.

## 特殊決策

Reimbursement payment evidence records that a real-world reimbursement happened; the app does not execute a transfer. One reimbursement batch records one payment to one paid-to member. Paid-to member, amount, and fixed household-fund payment source are derived from selected eligible member-paid expenses. Cross-member batches, partial refunds, split payment methods, post-settlement edits, corrections, and reversals are out of scope. Payment evidence must not become an ordinary ledger income or expense.

Local review should check whether users understand the app records but does not send reimbursement payments, whether the three editable fields are enough for audit, whether derived amount/member/source are still trusted when not shown as form controls, whether cross-member blocking is acceptable, and whether readback, correction, reversal, partial refund, or split payment should become future intents.

## Bug / 阻礙

Same-member batch refund success is covered by unit/server-action tests but not current E2E fixture data. Legacy reimbursement batches may have no payment row. Payment evidence readback for already reimbursed records remains minimal. E2E depends on Docker Desktop and local PostgreSQL. Production readiness remains unassessed.
