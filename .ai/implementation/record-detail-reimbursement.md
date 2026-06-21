---
id: record-detail-reimbursement
stage: tdd-implementation
status: review
created_at: 2026-06-21
updated_at: 2026-06-21
review_gate: pending_user_review
reviewed_at:
trace_links:
  - .ai/intent/record-detail-reimbursement.md
  - .ai/domain-impact/record-detail-reimbursement.md
  - .ai/prototype/record-detail-reimbursement.md
  - .ai/spec/record-detail-reimbursement.md
  - .ai/technical-design/record-detail-reimbursement.md
---

# Record Detail Reimbursement TDD Implementation

## Scope

- Add a real refund action from the record detail dialog.
- Keep refund limited to active, member-paid, refundable expense records.
- Show user-facing feedback and keep refunded records unavailable for edit/delete after success.

## Test First

- Added `parseReimburseLedgerRecordForm` coverage for:
  - valid `recordId` parsing into a reimbursement command.
  - missing `recordId` returning `missing_record_id`.
- Added reimbursement domain coverage for:
  - voided expenses being rejected as not refundable.

## Implementation

- Added `parseReimburseLedgerRecordForm` in `src/app/ledger-record-form.ts`.
- Added `reimburseLedgerRecordAction` in `src/app/ledger-record-actions.ts`.
  - Requires the authenticated member.
  - Calls the existing reimbursement database command with the selected record id.
  - Revalidates `/` and `/reimbursements`.
  - Returns user-facing messages for missing, unavailable, unauthorized, not refundable, and already refunded records.
- Updated `RefundRecordDialog` in `src/app/record-list-detail.tsx`.
  - Replaced prototype-only local success with a real form submit.
  - Keeps the item summary and warning alert.
  - Shows action errors inside the dialog.
  - Marks the open detail view as refunded after success so edit/delete/refund controls are hidden immediately.
- Tightened reimbursement command behavior.
  - Domain rejects non-active expenses.
  - Database query and update only target active expense records.

## Verification Run

- `corepack pnpm test src/app/ledger-record-form.test.ts src/modules/reimbursement/reimbursements.test.ts`
  - Result: passed, 2 files, 15 tests.
- `corepack pnpm type-check`
  - Result: passed.
- `corepack pnpm lint`
  - Result: passed.
- Note: running `type-check` and `lint` concurrently can make their shared `prisma generate` step race on generated directories. Sequential reruns passed.

## Residual Risk

- No browser E2E was added in this gate. The next Verification gate should exercise the detail-dialog refund path in the real UI.
- The refund operation marks the record as refunded; it does not perform bank transfer or external payment actions.

## Review Gate

- Decision needed: approve, request changes, or block.
- Recommended next gate after approval: Verification for record detail reimbursement.
