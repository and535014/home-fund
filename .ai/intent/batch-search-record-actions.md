---
id: batch-search-record-actions
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
  - .ai/archive/archive-record-search-sort-filter-2026-06-21.md
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
  - .ai/archive/archive-edit-delete-ledger-records-2026-06-21.md
outputs:
  - intent_intake
trace_links:
  bounded_contexts:
    - Fund Ledger
    - Reimbursement
    - Reporting
    - Identity and Access
    - Responsive Web Experience
  related_slices:
    - record-search-sort-filter
    - record-detail-reimbursement
    - edit-delete-ledger-records
reviewed_at: 2026-06-21
---

# Intent Intake: Batch Search Record Actions

## Intent

Search results should support selecting multiple records and applying batch actions from the search surface. The requested batch actions are `批次刪除` and `批次退款`.

The standalone reimbursement page should be removed. Reimbursement should no longer have an independent page; refund work should happen from record-oriented surfaces, starting with search results for this slice.

User request: "我希望搜尋結果可以多選進行批次操作，包含批次刪除跟退款，然後移除退款頁，退款不要有獨立頁面"

## Classification

- project_type: feature_change
- affected_surfaces: `/search` results, record result selection UI, batch action toolbar, batch delete confirmation, batch refund confirmation, dashboard navigation, `/reimbursements` route deletion with default 404 behavior, server actions/API boundary, ledger/reimbursement persistence, authorization, reporting refresh, tests, local_dev release readiness
- target_users: finance managers/admins who settle or clean up multiple records; household members who search records and need clear action availability
- business_outcome: reduce repeated one-record work by letting users act on filtered search results directly, while removing the confusing standalone reimbursement page from the product structure.

## Scope

In scope:

- Add multi-select support to search results.
- Add a batch action affordance for selected records.
- Support batch delete for selected records where the actor is authorized to delete each record.
- Support batch refund for selected active member-paid refundable expenses where the actor is authorized to perform reimbursement.
- Require confirmation before any destructive or settlement batch action.
- Show clear Traditional Chinese copy for selected count, eligible count, skipped/ineligible records, success, and failure states.
- Remove the `退款` navigation item and stop treating `/reimbursements` as a standalone user-facing page.
- Delete the `/reimbursements` route and keep the default 404 behavior for direct visits.
- Reuse existing voided-record deletion semantics and reimbursement batch persistence where possible.

Out of scope:

- Reimbursement reversal or undo.
- External money transfer, bank sync, accounting export, or payment execution.
- A redesigned standalone reimbursement table.
- Bulk edit.
- Production release readiness.
- URL-persistent selected records or shareable selected result sets.

## Current Context

- Completed record search/sort/filter work created `/search` with local query state and record detail continuity.
- Completed edit/delete work established permission-aware record correction and deletion semantics, where deletion means voiding for local_dev.
- Completed record detail reimbursement work established one-record `退款` from record detail and reused reimbursement batch persistence for a single selected expense.
- The current navigation includes `退款` at `/reimbursements`; previous records describe that page as placeholder or deferred, not the preferred refund workflow.
- The durable domain model already defines reimbursement as app settlement state, not external payment execution.

## Success Criteria

- A user can select and clear multiple search results without changing the active filter/sort query.
- Batch delete applies only to records the actor is allowed to delete and does not remove unauthorized records through direct submission.
- Batch refund applies only to active, member-paid, currently refundable expenses and does not double-reimburse records.
- The UI communicates records that cannot be included in the selected batch action before confirmation or as a clear result after submission.
- Successful batch delete removes voided records from active search results and related monthly summaries after refresh.
- Successful batch refund updates reimbursement status and excludes reimbursed records from future unpaid reimbursement totals after refresh.
- The standalone refund page is no longer reachable from primary navigation.
- The behavior has focused unit/integration coverage and at least one browser E2E path for search multi-select plus each batch action.

## Constraints And Assumptions

- UI copy remains Traditional Chinese and dark-theme first.
- Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, and Playwright foundation should be reused.
- `local_dev` remains the target release gate.
- Batch refund means marking selected expenses as reimbursed in the app; it does not send money.
- Batch delete continues to mean voiding active ledger records unless Domain Discovery identifies a new domain concern.
- Search result selection is scoped to currently loaded client-side search results for local_dev MVP.
- Server-side authorization remains authoritative; client-side disabled/hidden actions are only guidance.
- Decision: `/reimbursements` should be removed rather than redirected; direct visits should show the framework's default 404 page.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required, because batch delete and batch refund combine record lifecycle, one-time settlement, skipped records, and authorization policy.
- Project Foundation Architecture: not required; existing app foundation is sufficient.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: required, because this is user-facing selection, batch action, confirmation, disabled/skipped-state, and navigation removal behavior.
- Behavior Spec / BDD / E2E: required before technical design.
- Feature Technical Design: required, because batch server actions, partial success semantics, transactions, route deletion/default 404 behavior, cache revalidation, and authorization boundaries need explicit decisions.
- TDD Implementation: required after approved spec and technical design.
- Verification: required after implementation.
- Target-Aware Release: required for `local_dev` readiness after verification.
- Learning Loop: optional for local_dev; recommended if local review shows uncertainty around selection state, skipped records, or removed refund navigation.
- Artifact Compression: required after the slice completes.

## Open Questions

- Should batch operations be all-or-nothing when any selected record is ineligible, or should eligible records proceed while ineligible records are skipped with a result summary?
- Should selected search results persist when filters are changed, or should changing filters clear selection?
- Should batch refund be available only when all selected records are refundable, or should the UI allow mixed selection and summarize eligible refund candidates?
- Should the single-record detail `退款` action remain after batch refund is introduced?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm batch actions belong on `/search` results.
  - Confirm refund should no longer have an independent navigation/page surface.
  - Choose whether batch actions should be all-or-nothing or partial with skipped records in later gates.
- must_check:
  - No implementation starts before Domain Discovery, prototype, behavior spec, and technical design are approved or explicitly accepted as risk.
  - Batch delete and batch refund preserve existing permission and reimbursement invariants.
  - Removed refund page behavior remains deletion plus default 404 for direct visits.
- acceptance_signals:
  - The change has a clear lifecycle path and bounded non-goals.
  - Search becomes the primary batch operation surface.
  - Standalone reimbursement workflow is intentionally removed from the product structure.
- unresolved_blockers:
  - Partial-success semantics need downstream decisions.
- next_step:
  - Domain Discovery / Domain Impact for `batch-search-record-actions`.
