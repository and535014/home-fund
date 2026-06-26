---
id: edit-reimbursement-payment-records
stage: intent-intake
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: feature_change
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/domain/home-family-fund.md
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/archive/archive-reimbursement-payment-flow-2026-06-25.md
  - .ai/archive/archive-search-reimbursement-payment-records-2026-06-26.md
outputs:
  - intent_intake
  - lifecycle_routing
trace_links:
  bounded_contexts:
    - Reimbursement
    - Reporting
    - Identity and Access
    - Responsive Web Experience
  related_slices:
    - reimbursement-payment-flow
    - search-reimbursement-payment-records
reviewed_at: 2026-06-26
---

# Intent Intake: Edit Reimbursement Payment Records

## Intent

Users need to correct the editable evidence fields on an existing `退款紀錄`: payment date, payment method, and note.

Current reimbursement payment evidence is intentionally separated from ordinary income/expense records. Previous slices treated refund records as read-only audit evidence after settlement, while the user now needs a controlled correction path for mistakes in the recorded payment details. This change should support practical data correction without weakening the reimbursement settlement invariant or turning refund records into ordinary ledger records.

User request: "退款紀錄要可以編輯付款日期、付款方式跟備註"

## Classification

- project_type: feature_change
- affected_surfaces: refund record detail modal, `/search` refund-record results, reimbursement payment persistence, server actions/API boundary, authorization, reporting read models, tests, local_dev release readiness
- target_users: finance-capable household members who record or audit reimbursements, and household members who need accurate refund evidence later
- business_outcome: allow common refund-record data-entry mistakes to be corrected while preserving the audit distinction between reimbursement payment evidence and ordinary ledger records.

## Scope

In scope:

- Add an authorized edit path from the existing refund record detail/readback experience.
- Allow editing only these reimbursement payment fields:
  - `付款日期`
  - `付款方式`
  - `備註`
- Keep payment method constrained to the approved reimbursement payment method options unless a later gate changes the option set.
- Validate the edited payment date and payment method server-side.
- Preserve household scoping and role-based authorization for every update.
- Refresh refund-record search/detail read models after a successful edit.
- Keep Traditional Chinese UI copy clear that the action corrects refund evidence, not the linked expense itself.
- Add focused unit/domain/action tests and browser coverage for a successful edit and at least one unauthorized or invalid edit rejection.

Out of scope:

- Editing refund amount, paid-to member, paid-from source, reimbursement batch, linked ledger records, recorded-by actor, or creation timestamp.
- Deleting, reversing, voiding, or partially undoing a reimbursement payment.
- Reopening an already reimbursed expense to `待退款`.
- Creating a new reimbursement payment from the edit flow.
- External payment execution, bank sync, reconciliation, receipts, attachments, or payment-provider integration.
- Treating refund records as ordinary `LedgerRecord` rows or including them in monthly income/expense totals.
- Production deployment readiness beyond local_dev release assessment for this slice.

## Current Context

- `ReimbursementPayment` currently stores `method`, `paidOn`, `note`, derived/validated settlement facts, and links to one `ReimbursementBatch`.
- `ReimbursementPaymentMethod` is currently constrained to `bank_transfer`, `cash`, and `other`.
- `ReimbursementPayment.paidFromSource` is fixed to `household_fund` in the current MVP.
- Completed reimbursement payment flow explicitly deferred post-settlement edits, correction, and reversal.
- Completed search refund-record work made `退款紀錄` discoverable and readable from `/search`, while keeping refund payment evidence read-only for that slice.
- Reimbursed ledger records remain protected from ordinary edit/delete in the current UI because the settlement state and payment evidence are linked.

## Success Criteria

- An authorized finance-capable actor can open an existing refund record and enter edit mode.
- The edit form shows the current payment date, payment method, and note.
- Saving valid edits updates only payment date, payment method, and note.
- The refund record detail and search result readback reflect the updated fields after refresh.
- Unauthorized users cannot see or complete the edit action through UI affordances or direct server calls.
- Invalid payment date or unsupported payment method is rejected with field-specific Traditional Chinese feedback.
- The linked reimbursement batch, linked ledger records, refund amount, paid-to member, paid-from source, and reimbursed statuses remain unchanged.
- Monthly income/expense totals and ordinary ledger search results remain unaffected by edits to refund evidence fields.
- Tests cover success, permission rejection, invalid input, and no mutation of non-editable settlement facts.

## Constraints and Assumptions

- UI copy remains Traditional Chinese using Taiwan usage.
- Existing Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, and Playwright foundation should be reused.
- `local_dev` remains the release target for this slice.
- The user-facing noun remains `退款紀錄`.
- This intent assumes the product wants practical correction of data-entry mistakes, not a full audit-log/reversal system.
- The downstream domain gate must decide whether editing directly overwrites the three fields or whether correction metadata is required for auditability.
- If a schema change is needed for correction metadata such as `updatedAt`, `updatedByMemberId`, or history rows, Target-Aware Release must treat the migration as part of local_dev readiness.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required.
  - Reason: this changes the prior policy that reimbursement payment evidence is read-only after settlement, and it must decide correction semantics, audit expectations, and who may edit.
- Project Foundation Architecture: not required.
  - Reason: existing app foundation and test stack are established and fit this slice.
- Project Foundation Implementation / Init: not required.
  - Reason: scaffold, routing, component, lint, type-check, and E2E baselines already exist.
- Experience Prototype: required.
  - Reason: refund-record detail needs a correction affordance, edit form state, validation feedback, save/cancel behavior, and responsive modal behavior.
- Behavior Spec / BDD / E2E: required before technical design.
  - Reason: permissions, field-level mutability, invalid inputs, and unchanged settlement facts must be testable before implementation.
- Feature Technical Design: required.
  - Reason: server action boundary, Prisma update shape, authorization, cache refresh, optional audit metadata, and read-model updates need explicit design.
- TDD Implementation: required after approved spec and technical design.
- Verification: required after implementation.
- Target-Aware Release: required for `local_dev` readiness, especially if persistence schema or seed/test data changes.
- Learning Loop: optional for local_dev; recommended if review needs to validate whether users understand the difference between correcting evidence and reversing reimbursement.
- Artifact Compression: required after the slice completes.

## Open Questions

- Who can edit refund records: only admins, finance managers, the actor who originally recorded the reimbursement, or some combination?
- Should editing directly overwrite the three fields, or should the system retain who edited the refund record and when?
- Does a changed payment date affect sorting/pagination in the `退款紀錄` search tab immediately after save?
- Should the note field be allowed to become empty, and should empty display as `沒有備註。` consistently?
- Should the UI call this action `編輯退款紀錄`, `更正退款紀錄`, or another term that better signals audit correction?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm the editable fields are exactly payment date, payment method, and note.
  - Confirm amount, paid-to member, paid-from source, linked records, and reimbursement state remain non-editable.
  - Confirm the next gate should decide correction/audit metadata rather than silently assuming direct overwrite is acceptable.
- must_check:
  - No implementation starts before Domain Discovery, Experience Prototype, Behavior Spec, and Feature Technical Design are approved or explicitly accepted as risk.
  - Refund evidence edits must not alter monthly ledger totals or ordinary record search semantics.
  - Authorization must be enforced server-side, not only by hiding UI controls.
- acceptance_signals:
  - Scope is narrow enough to correct common refund-record mistakes without designing reversal.
  - Prior read-only refund-record policy is explicitly reopened for controlled correction.
  - Open questions are clear enough for the next lifecycle gate.
- unresolved_blockers:
  - Correction semantics and edit permission policy require Domain Discovery / Domain Impact.
- next_step:
  - Domain Discovery / Domain Impact for `edit-reimbursement-payment-records`.
