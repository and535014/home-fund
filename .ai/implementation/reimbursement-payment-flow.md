---
id: reimbursement-payment-flow
stage: tdd-implementation
status: review
created_at: 2026-06-24
updated_at: 2026-06-24
review_gate: pending_user_review
reviewed_at:
trace_links:
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/prototype/reimbursement-payment-flow.md
  - .ai/spec/reimbursement-payment-flow.md
  - .ai/technical-design/reimbursement-payment-flow.md
---

# Reimbursement Payment Flow TDD Implementation

## Scope

- Persist refund payment evidence when a reimbursement is completed.
- Keep this slice limited to one reimbursement batch, one paid-to member, and one payment record.
- Keep paid-to member, amount, and paid-from source derived by the system instead of editable form fields.
- Reject cross-member batch refund submissions for this payment-flow slice.

## Test First

- Extended `parseReimburseLedgerRecordForm` coverage before implementation:
  - valid refund form parses `reimbursementMethod`, `reimbursementPaidOn`, and `reimbursementReference`.
  - missing or unsupported payment method is rejected.
  - missing or non-date-only payment date is rejected.
- Extended `batchMarkLedgerRecordsReimbursed` coverage before implementation:
  - payment-flow mode rejects eligible records spanning multiple payer members.
- Added reimbursement payment persistence coverage:
  - single-record database command writes payment evidence linked to the reimbursement batch.
  - batch search refund action writes payment evidence linked to the reimbursement batch.

## Implementation

- Added `ReimbursementPayment` persistence:
  - Prisma enums for payment source and method.
  - `ReimbursementPayment` model linked one-to-one to `ReimbursementBatch`.
  - Migration `20260624172000_add_reimbursement_payments`.
- Added shared payment evidence validation in `src/modules/reimbursement/reimbursement-payment.ts`.
- Updated single-record reimbursement:
  - parser requires method and date-only paid date.
  - server action passes payment evidence into the database command.
  - database command creates reimbursement batch, payment evidence, and ledger status update in one transaction.
- Updated batch search refund:
  - refund dialog collects only editable payment fields.
  - batch delete and batch refund dialogs are separate components, so delete no longer carries refund-only branching or form handling.
  - refund dialog shows a warning when selected eligible records span multiple paid-to members.
  - search panel passes payment evidence to the server action.
  - server action validates payment evidence, rejects cross-member batches, and creates the linked payment record.
- Cleaned command boundaries:
  - `MarkExpensesReimbursedCommand` remains a pure domain selection command.
  - single-record and batch refund share one payment settlement persistence helper.

## Verification Run

- `corepack pnpm vitest run src/app/ledger-record-form.test.ts src/modules/reimbursement/reimbursement-batch-actions.test.ts`
  - Result: passed, 2 files, 14 tests.
- `corepack pnpm type-check`
  - Result: passed.
- `corepack pnpm lint`
  - Result: passed.
- `corepack pnpm test`
  - Result: passed, 40 files, 185 tests.

## Residual Risk

- Browser E2E has not yet exercised the real dialog submission paths with persisted payment evidence.
- Existing legacy reimbursement batches may have no payment row; this implementation preserves that compatibility.
- This slice still intentionally excludes partial refunds, split payment methods, after-the-fact edits, and reversals.

## Review Gate

- Decision needed: approve, request changes, or block.
- Recommended next gate after approval: Verification for reimbursement payment flow.
