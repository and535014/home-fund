---
id: record-detail-reimbursement
stage: learning-loop
status: review
created_at: 2026-06-21
updated_at: 2026-06-21
release_target: local_dev
review_gate: pending_user_review
reviewed_at:
trace_links:
  - .ai/intent/record-detail-reimbursement.md
  - .ai/domain-impact/record-detail-reimbursement.md
  - .ai/prototype/record-detail-reimbursement.md
  - .ai/spec/record-detail-reimbursement.md
  - .ai/technical-design/record-detail-reimbursement.md
  - .ai/implementation/record-detail-reimbursement.md
  - .ai/verification/record-detail-reimbursement.md
  - .ai/release/record-detail-reimbursement-local-dev-readiness.md
---

# Record Detail Reimbursement Learning Loop

## Learning Questions

- Do finance users find `退款` from the record detail without needing to visit `/reimbursements`?
- Do users understand that `退款` marks the record as `已退款` in the app, not a bank transfer?
- Does the confirmation copy prevent accidental reimbursement?
- After a record becomes `已退款`, do users understand why `編輯` and `刪除` are no longer available?
- Does the dashboard refresh after reimbursement feel immediate enough for local review?

## Signals

| Signal | How To Observe In Local Dev | Linked Outcome |
|---|---|---|
| Refund action discovery | Manual reviewer opens an eligible member-paid expense and notices `退款` in the detail footer | Intent: reimburse from record detail |
| Confirmation comprehension | Reviewer can explain what `將此紀錄標記為已退款。` means before confirming | Scope: app settlement state, not money transfer |
| Completion | Reviewer clicks `退款` then `確認退款` and sees `已完成退款` plus `已退款` | BDD finance success path |
| Guardrail clarity | Reviewer sees no `退款`, `編輯`, or `刪除` after success and understands the warning | One-time reimbursement and blocked edit/delete |
| Regression protection | `corepack pnpm test:e2e` keeps the record-detail reimbursement scenario passing | Verification and release guardrail |

## Manual Review Script

1. Run local app with seeded June 2026 data.
2. Sign in as admin or finance manager.
3. Open `/` and choose `補充用品代墊` from `紀錄`.
4. Confirm `退款` is discoverable and the detail status is `待退款`.
5. Click `退款` and read the confirmation dialog.
6. Confirm the action and check for `已完成退款`, `已退款`, and missing edit/delete/refund actions.
7. Reload the page, reopen the same record, and confirm it remains `已退款`.

## Follow-Up Decision Criteria

- If reviewers ask whether money was actually transferred, revise confirmation copy before preview/production.
- If reviewers expect to undo reimbursement, start a new Intent Intake for refund reversal.
- If users miss the `退款` action in the footer, revisit action placement in a new prototype.
- If users need batch settlement, resume the broader reimbursement table story instead of expanding this slice.

## Tracking Maturity

- Product analytics provider: not selected.
- Error monitoring provider: not selected.
- Logging provider: local dev only.
- Feedback channel: manual reviewer feedback in this thread or project notes.

For `local_dev`, manual review plus E2E coverage is sufficient. Production would need explicit analytics, logging, monitoring, and support feedback channels.

## Review Cadence

- Review after the next local user walkthrough of the record detail reimbursement flow.
- Re-check after any future reimbursement table or refund reversal work.

## Review Gate

- Decision needed: approve, request changes, or block.
- Recommended next gate after approval: Artifact Compression for `record-detail-reimbursement`.
