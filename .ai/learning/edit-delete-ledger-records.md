---
id: learning-edit-delete-ledger-records
stage: learning
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-delete-ledger-records.md
  - .ai/domain-impact/edit-delete-ledger-records.md
  - .ai/spec/edit-delete-ledger-records.md
  - .ai/technical-design/edit-delete-ledger-records.md
  - .ai/implementation/edit-delete-ledger-records.md
  - .ai/verification/edit-delete-ledger-records.md
  - .ai/release/edit-delete-ledger-records-local-dev-readiness.md
outputs:
  - learning_questions
  - manual_feedback_signals
  - operational_guardrails
  - follow_up_decision_criteria
trace_links:
  release:
    - .ai/release/edit-delete-ledger-records-local-dev-readiness.md
  verification:
    - .ai/verification/edit-delete-ledger-records.md
reviewed_at: 2026-06-21
---

# Edit And Delete Ledger Records Learning Loop

## Learning Summary

- release_target: local_dev
- tracking_maturity: manual_feedback_and_regression_checks
- analytics_provider: not selected
- monitoring_provider: not selected
- decision: learning_signals_defined

This slice lets household users correct or delete active ledger records without restoring standalone record routes. For `local_dev`, the learning goal is to confirm that edit/delete is discoverable, trusted, and financially coherent: users should understand that `刪除` removes active totals while the domain preserves a voided trace.

## Learning Questions

| Question | Why it matters | Signal |
|---|---|---|
| Can users find edit/delete from the record detail modal without a separate records page? | The slice intentionally keeps actions inside dashboard record detail. | Reviewer opens an existing record and finds `編輯` / `刪除` without looking for `/records`. |
| Does the edit form cover the real correction cases users expect? | MVP edits name, amount, date, category, payer/source, payment source, and note. | Reviewer can correct a mistaken record without needing a new field. |
| Does successful edit feedback feel complete? | Save should close dialogs, refresh totals/list values, and show `紀錄已更新`. | Reviewer sees the updated value and toast without stale detail state. |
| Does the delete confirmation create enough confidence? | Delete is destructive in the UI even though domain semantics are voided. | Reviewer can tell the record leaves month/report/reimbursement views before confirming. |
| Does successful delete feedback feel complete? | Prior E2E found a toast race; this is now a key guardrail. | Reviewer sees `紀錄已刪除`, dialog close, and active list removal. |
| Do users understand that deleted records disappear from active totals? | Voided records should not affect monthly or reimbursement calculations. | Reviewer confirms summary/reimbursement changes match expectations after deletion. |
| Is blocking already reimbursed expenses acceptable for MVP? | Reimbursement reversal is not implemented. | Reviewer agrees blocked copy is understandable or starts a reversal intent. |
| Are role boundaries intuitive? | General members, finance managers, and admins have different edit/delete rights. | Reviewer confirms hidden actions and permission-denied behavior match household expectations. |
| Does the delete modal spacing and mobile layout feel polished? | A real screenshot exposed footer/content crowding. | Reviewer does not see action buttons touching content on desktop/mobile. |

## Manual Feedback Plan

- Reviewer profile: local app reviewer using seeded admin, finance manager, and general member accounts.
- Review routes:
  - `/?month=2026-06`
  - `/reimbursements?month=2026-06`
- Review tasks:
  - Open an owned active record from the dashboard and save an edit.
  - Confirm `紀錄已更新`, dialog close, and refreshed dashboard values.
  - Open the edited record and confirm delete.
  - Confirm `紀錄已刪除`, dialog close, active list removal, and reimbursement/reporting recalculation.
  - Open another member's record as a general member and confirm edit/delete actions are absent.
  - Open another member's record as a finance manager and confirm edit is available while delete is absent.
  - Inspect a reimbursed member-paid expense and confirm blocked copy is understandable.
  - Repeat delete confirmation on a narrow/mobile viewport and check footer spacing.

## Guardrails

- Delete remains a `voided` transition, not hard deletion.
- Voided records stay out of dashboard list, monthly totals, category summaries, and refundable reimbursement calculations.
- Existing reimbursement batch relationships keep persisted trace to the ledger record.
- Server/domain authorization remains authoritative; hidden UI actions are not the security boundary.
- Already reimbursed member-paid expenses remain blocked until a reimbursement reversal domain slice exists.
- Success toasts must be shown before refresh/unmount can remove the active dialog state.
- No standalone `/records` route should appear.

## Operational Signals

Automated local guardrails:

- `corepack pnpm type-check`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm db:validate`
- `corepack pnpm build`
- `corepack pnpm test:e2e`
- Focused regression: `corepack pnpm test:e2e e2e/record-edit-delete.spec.ts`

Manual signals:

- Reviewer notes on correction discoverability from record detail.
- Reviewer notes on delete confirmation clarity and voided-record mental model.
- Reviewer notes on reimbursement total changes after edit/delete.
- Reviewer notes on whether blocked reimbursed expenses need reversal sooner.
- Reviewer notes on role-specific action visibility.
- Reviewer screenshots for desktop/mobile modal spacing if regressions appear.

## Follow-Up Decision Criteria

- If users ask to recover or view deleted records, start Intent Intake for voided-record history/restore.
- If users need to modify reimbursed expenses, start Intent Intake for reimbursement reversal before allowing those edits/deletes.
- If finance managers should delete others' records, start Intent Intake for permission policy expansion.
- If delete feels too final despite voided semantics, start Intent Intake for copy or confirmation UX refinement.
- If edit form fields are insufficient, start Intent Intake for expanded correction fields.
- If no local review issues are found, proceed to Artifact Compression for this completed slice.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - confirm learning questions match what should be reviewed locally
  - confirm manual feedback is sufficient without analytics tooling for `local_dev`
  - confirm Artifact Compression should be next if no follow-up slice is needed
- unresolved_blockers:
  - None for Artifact Compression after approval.
- recommended_next_gate:
  - artifact-compression
- stop_condition: Wait for explicit user approval before starting Artifact Compression.
