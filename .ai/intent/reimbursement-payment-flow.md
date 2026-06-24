---
id: reimbursement-payment-flow
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
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
outputs:
  - intent_intake
trace_links:
  bounded_contexts:
    - Reimbursement
    - Fund Ledger
    - Reporting
    - Identity and Access
    - Responsive Web Experience
  related_slices:
    - record-detail-reimbursement
    - batch-search-record-actions
reviewed_at: 2026-06-24
---

# Intent Intake: Reimbursement Payment Flow

## Intent

Refunding a member-paid expense should record the real-world reimbursement money movement, not only mark the expense as `已退款`.

Current behavior treats `退款` as app settlement state: eligible member-paid expenses change from `待退款` to `已退款`, and reimbursement batches record who performed the settlement. The next slice should add a traceable payment record that answers: money was paid from where, to which member, by what method, when, for how much, and with what optional reference.

User request: "現在的退款只是標記成已退款，那要怎麼紀錄退款金流走向？" followed by "好，正式做吧"

## Classification

- project_type: feature_change
- affected_surfaces: record detail reimbursement confirmation, batch reimbursement confirmation/results if still active, reimbursement persistence, Prisma schema/migrations, server actions/API boundary, reporting/detail read models, authorization, tests, local_dev release readiness
- target_users: finance managers/admins who settle member-paid expenses and household members who need to audit how reimbursement money moved
- business_outcome: make reimbursement settlement auditable by preserving both the app settlement state and the real-world payment path without double-counting household expenses.

## Scope

In scope:

- Capture reimbursement payment details when an authorized actor marks eligible member-paid expenses reimbursed.
- Record the paid amount, paid-to member, paid-from source, payment method, payment date/time, actor, and optional reference/note.
- Link the payment record to the existing reimbursement batch or a replacement reimbursement aggregate decided downstream.
- Preserve the invariant that each eligible expense can be reimbursed only once unless a later reversal feature is approved.
- Keep reimbursement payment records traceable from record detail and reimbursement-related result/read views.
- Prevent reimbursement payment records from being counted as a second household expense in monthly reports.
- Validate server-side that submitted payment details match the reimbursed expenses and household boundaries.
- Keep Traditional Chinese copy clear that `退款` records a completed real-world reimbursement payment, not an external transfer initiated by the app.

Out of scope:

- Executing bank transfers, LINE Pay payments, cash movement, or any external payment integration.
- Bank account balance tracking, bank sync, or reconciliation against statements.
- Reimbursement reversal, partial refunds, split payments, or multiple payments for one reimbursement batch unless Domain Discovery explicitly brings them into this slice.
- General double-entry accounting for the whole household fund.
- Production payment compliance, production secrets, or external financial-service readiness.
- Changing original expense totals or treating reimbursement payment as a new ordinary expense.

## Current Context

- `LedgerRecord.reimbursementStatus` currently stores `not_refundable`, `refundable`, or `reimbursed`.
- `ReimbursementBatch` currently stores `householdId`, `reimbursedById`, `reimbursedAt`, and selected `ReimbursementBatchItem` records.
- Completed record detail reimbursement established that `退款` means app settlement state, not bank transfer, and hides edit/delete after a record is reimbursed.
- Completed batch search record actions reuse the reimbursement batch concept for selected expenses.
- The durable domain model distinguishes member-paid expenses, refundable expenses, reimbursed expenses, and reimbursement as one-time settlement.
- Monthly reports and active ledger summaries should not double-count reimbursement payments as ordinary expenses.

## Success Criteria

- A finance-capable actor cannot complete reimbursement without providing required payment-flow details for the settlement.
- A completed reimbursement can show who was paid, from what source, by what method, when, and for what amount.
- The recorded payment amount is validated against the selected reimbursed expense total for the target member or approved batch shape.
- Reimbursing multiple expenses for the same member creates an auditable payment trace without losing links to individual expense records.
- Server-side authorization and household scoping prevent payment-flow records from being attached to another household or member.
- Monthly income/expense totals remain based on original ledger records and do not double-count reimbursement payment records.
- Existing already-reimbursed, voided, fund-paid, income, and unauthorized cases remain rejected.
- Unit/domain tests and browser E2E cover successful payment-flow capture and at least one invalid payment-detail rejection.

## Constraints And Assumptions

- UI copy remains Traditional Chinese and should use Taiwan usage.
- Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, and Playwright foundation should be reused.
- `local_dev` remains the release target for this slice.
- The app records that a real-world payment happened; it does not initiate or guarantee that payment.
- Reimbursement payment data should be immutable enough for audit after settlement. Any correction/reversal behavior is a separate future intent unless explicitly added in Domain Discovery.
- The first implementation should prefer one payment record per reimbursement batch unless Domain Discovery finds that partial/split payments are required now.
- Payment source labels can start as simple app-owned values or free-form labels, but downstream design must prevent ambiguous reporting.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required, because this changes reimbursement language, payment-path policy, state lifecycle, auditability, and whether reimbursement is a status, payment event, or aggregate.
- Project Foundation Architecture: not required; existing app foundation is sufficient.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: required, because reimbursement confirmation and detail/readback UI will collect and display payment-flow details.
- Behavior Spec / BDD / E2E: required before technical design.
- Feature Technical Design: required, because schema shape, transaction boundary, validation ownership, read-model joins, migration, and no-double-count reporting rules must be explicit.
- TDD Implementation: required after approved spec and technical design.
- Verification: required after implementation.
- Target-Aware Release: required for `local_dev` readiness because the change includes a database migration.
- Learning Loop: recommended for local_dev review to check whether users understand that the app records payment evidence but does not execute transfers.
- Artifact Compression: required after the slice completes.

## Open Questions

- Is one reimbursement payment always paid to exactly one member, or can one batch include multiple members with separate payments?
- Should the UI allow partial reimbursement or split payment methods now, or keep them out of MVP?
- What paid-from sources are allowed in MVP: household fund, cash, bank account label, other?
- Should payment method be a controlled enum, free-form text, or both?
- Should reimbursement payment details be editable after confirmation, or should corrections require a future reversal/correction workflow?
- Should batch reimbursement be constrained to same-member selections to keep one payment record unambiguous?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm this slice should record reimbursement payment flow instead of only status.
  - Confirm external payment execution remains out of scope.
  - Confirm downstream Domain Discovery should decide single-member batch, split payment, partial reimbursement, and correction/reversal policy.
- must_check:
  - No implementation starts before Domain Discovery, Experience Prototype, Behavior Spec, and Feature Technical Design are approved or explicitly accepted as risk.
  - Payment records must not double-count household expenses.
  - Existing reimbursement eligibility and authorization invariants remain intact.
- acceptance_signals:
  - The problem is framed as auditability and payment-path trace, not external payment integration.
  - Scope is narrow enough for local_dev MVP while still preserving future accounting options.
  - Open questions are explicit for the next gate.
- unresolved_blockers:
  - Payment shape and allowed batch/member cardinality require Domain Discovery.
- next_step:
  - Domain Discovery / Domain Impact for `reimbursement-payment-flow`.
