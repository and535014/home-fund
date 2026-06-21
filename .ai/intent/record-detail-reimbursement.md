---
id: record-detail-reimbursement
stage: intent-intake
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: feature_change
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/domain/home-family-fund.md
  - .ai/archive/archive-record-list-detail-modal-2026-06-20.md
  - .ai/archive/archive-edit-delete-ledger-records-2026-06-21.md
  - .ai/spec/story-reimbursement-table-and-settlement.md
outputs:
  - intent_intake
trace_links:
  bounded_contexts:
    - Fund Ledger
    - Reimbursement
    - Reporting
    - Identity and Access
    - Responsive Web Experience
  domain_events:
    - Monthly reimbursement table generated
    - Reimbursement expenses selected
    - Expenses reimbursed
  related_slices:
    - record-list-detail-modal
    - edit-delete-ledger-records
reviewed_at: 2026-06-21
---

# Intent Intake: Record Detail Reimbursement

## Intent

When a household user opens a ledger record's detail dialog from the dashboard `紀錄` list, they should be able to perform the appropriate reimbursement action for that record when the record is eligible.

The requested user-facing outcome is: "點開紀錄詳細資訊的時候可以進行退款".

## Classification

- project_type: feature_change
- affected_surfaces: dashboard record detail dialog, reimbursement action UI, server actions/API boundary, Prisma persistence, reimbursement read model, dashboard refresh, authorization, E2E coverage, local_dev release readiness
- target_users: finance managers who settle member-paid expenses; household members who need clear reimbursement status while viewing record details
- business_outcome: reduce workflow friction by allowing one eligible member-paid expense to be settled directly from the record detail flow, while preserving one-time reimbursement and traceability rules.

## Scope

In scope:

- Add an eligible reimbursement action in the existing record detail modal for member-paid expenses that are active and currently refundable.
- Preserve current record detail browsing, edit, and delete entry points.
- Enforce finance-manager reimbursement authorization at both UI and server/action boundary.
- Mark the selected expense reimbursed once and refresh dashboard/reimbursement-derived views after success.
- Show clear Traditional Chinese status/copy for not refundable, refundable, already reimbursed, and blocked states.
- Keep the implementation aligned with existing ReimbursementBatch / LedgerRecord persistence and read models.

Out of scope:

- New standalone monthly reimbursement workflow redesign.
- Reimbursement reversal or undo.
- Editing or deleting already reimbursed member-paid expenses.
- Production release readiness.
- Bank/payment execution; this is still an app settlement state, not a money transfer.

## Current Context

- The dashboard already has a `紀錄` list and read-only detail dialog from the completed `record-list-detail-modal` slice.
- The completed edit/delete slice added record correction/voiding actions from the same detail flow and blocks reimbursed member-paid expenses from edit/delete until reimbursement reversal exists.
- The durable domain model already defines member-paid expenses, refundable expenses, reimbursed expenses, one-time reimbursement, and finance-manager-only settlement.
- A draft reimbursement story exists for table-based settlement; this intent narrows the next slice to single-record settlement from the record detail surface.

## Success Criteria

- Finance managers can reimburse exactly one eligible member-paid expense from its record detail dialog.
- General members and unauthorized users cannot perform reimbursement through visible controls or direct action submission.
- Fund-paid expenses, income records, voided records, and already reimbursed expenses do not expose an invalid reimbursement action.
- Successful reimbursement updates the record detail status, reimbursement totals, and relevant dashboard/reimbursement views without double-counting.
- The flow has focused unit/integration coverage and at least one browser E2E path for local_dev.

## Constraints And Assumptions

- UI copy remains Traditional Chinese and dark-theme first.
- Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, shadcn-style components, Vitest, and Playwright foundation should be reused.
- `local_dev` remains the target release gate.
- Decision: "退款" means marking a member-paid expense as reimbursed in the app, not initiating a real payment transfer.
- Assumption: the action should live in the current dashboard record detail dialog rather than requiring navigation to `/reimbursements`.
- Decision: the record detail flow must use a confirmation step before marking a single expense reimbursed.
- Decision: the user-facing action label is `退款`.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required, because this changes reimbursement command placement, one-time settlement behavior, and interaction with ledger record lifecycle.
- Project Foundation Architecture: not required; existing foundation is sufficient.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: required, because this is user-facing modal action behavior with permission, status, and confirmation states.
- Behavior Spec / BDD / E2E: required before technical design.
- Feature Technical Design: required, because server action, persistence transaction, revalidation, authorization, and read-model updates need explicit boundaries.
- TDD Implementation: required after approved spec/design.
- Verification: required.
- Target-Aware Release: required for `local_dev` readiness after verification.
- Learning Loop: optional for local_dev unless accepted risks or user feedback goals are added later.
- Artifact Compression: required after the slice completes.

## Open Questions

- After success, should the detail modal stay open with updated status or close with a toast?
- Should admins also be allowed to reimburse, or only members with the explicit finance-manager reimbursement capability?
- Should the action be available from both dashboard detail and the `/reimbursements` page, or only the dashboard detail in this slice?

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm that "退款" means marking the record as reimbursed, not sending money.
  - Confirm whether a confirmation step is desired.
  - Confirm the preferred Traditional Chinese action label.
- must_check:
  - Scope stays limited to one-record reimbursement from detail.
  - Reimbursement remains one-time and permission-protected.
  - Already reimbursed records remain blocked from edit/delete until reversal is modeled.
- acceptance_signals:
  - The feature intent matches the requested workflow.
  - Downstream gates are enough to design and implement safely.
- unresolved_blockers:
  - None for Domain Discovery / Domain Impact.
- next_step:
  - If approved, proceed to Domain Discovery / Domain Impact for `record-detail-reimbursement`.
