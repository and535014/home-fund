---
id: reimbursement-payment-flow
stage: verification
status: review
created_at: 2026-06-24
updated_at: 2026-06-24
review_gate: pending_user_review
reviewed_at:
release_target: local_dev
trace_links:
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/prototype/reimbursement-payment-flow.md
  - .ai/spec/reimbursement-payment-flow.md
  - .ai/technical-design/reimbursement-payment-flow.md
  - .ai/implementation/reimbursement-payment-flow.md
---

# Reimbursement Payment Flow Verification

## Result

- decision: pass_for_local_dev_review
- release_target_supported: local_dev
- recommended_next_gate: Target-Aware Release for local_dev

## Scope Verified

- Single-record refund requires payment evidence and persists a reimbursement payment row.
- Batch refund accepts same-member payment evidence through the server action contract.
- Cross-member batch refund is blocked and shows a warning.
- Reimbursement payment evidence is stored outside ordinary ledger income/expense records.
- Dialog accessibility warnings for changed refund/delete/edit surfaces are addressed.
- Active `.ai` trace was updated for the split batch delete/refund dialogs and cross-member warning.

## Commands Run

- `corepack pnpm db:validate`
  - Result: passed.
- `corepack pnpm type-check`
  - Result: passed.
- `corepack pnpm lint`
  - Result: passed.
- `corepack pnpm test`
  - Result: passed, 40 files, 185 tests.
- `corepack pnpm test:e2e`
  - Result: passed, 44 tests.
  - Evidence: E2E reset `home_fund_e2e`, applied migration `20260624172000_add_reimbursement_payments`, seeded base and E2E data, then passed all Playwright checks.

## E2E Adjustments During Verification

- Updated dashboard refund E2E to assert payment evidence fields instead of removed prototype warning copy.
- Updated record edit/delete E2E to use the current category visual radio interaction.
- Updated search batch E2E button selectors to current accessible names.
- Updated search batch refund E2E to verify the current E2E fixture reality: selected refundable records span different payer members, so confirmation is disabled and warning copy appears.

## Trace And Alignment

- Prototype, Behavior Spec, and Technical Design now reference:
  - `src/app/batch-delete-dialog.tsx`
  - `src/app/batch-refund-dialog.tsx`
- Behavior Spec now matches the user-approved cross-member warning behavior.
- Implementation keeps `MarkExpensesReimbursedCommand` as a pure domain selection command.
- Single-record and batch refund share one persistence helper for batch, payment, and ledger-status writes.

## Residual Risk

- Same-member batch refund success is covered by unit/server-action tests, but not by current E2E fixture data because E2E seed has only two refundable member-paid expenses and they belong to different payer members.
- Payment evidence readback for already reimbursed records is still minimal; legacy batches without payment rows remain valid.
- Partial refunds, split payment methods, post-settlement edits, corrections, and reversals remain intentionally out of scope.

## Review Gate

- Decision needed: approve, request changes, or block.
- Recommended next gate after approval: Target-Aware Release for `local_dev`.
