---
id: search-reimbursement-payment-records
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
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
  - .ai/archive/archive-reimbursement-payment-flow-2026-06-25.md
outputs:
  - intent_intake
trace_links:
  bounded_contexts:
    - Reporting
    - Reimbursement
    - Fund Ledger
    - Identity and Access
    - Responsive Web Experience
  related_slices:
    - batch-search-record-actions
    - reimbursement-payment-flow
reviewed_at: 2026-06-25
---

# Intent Intake: Search Reimbursement Payment Records

## Intent

The search page should be able to find reimbursement payment records, so a user can search for `退款金流紀錄` and recover the real-world refund payment evidence that was captured during reimbursement settlement.

Current `/search` behavior is ledger-record oriented: keyword search and filters load active `LedgerRecord` results. Reimbursement payment evidence now lives in `ReimbursementPayment`, linked to `ReimbursementBatch` and batch items, and is intentionally not an ordinary income or expense. This change should make the payment evidence discoverable from the search surface without accidentally counting it as a normal household ledger record.

User request: "搜尋頁要可以搜到 退款金流紀錄"

## Classification

- project_type: feature_change
- affected_surfaces: `/search` query model, search result presentation, record detail/readback links, reimbursement payment read model, server actions/API boundary, authorization, reporting query tests, browser E2E, local_dev release readiness
- target_users: finance-capable household members who need to audit completed reimbursements and household members who need to find refund payment evidence later
- business_outcome: make reimbursement payment evidence discoverable from the primary search surface while preserving the distinction between ordinary ledger records and reimbursement payment audit records.

## Scope

In scope:

- Let the search page find reimbursement payment records by keyword or an explicit result type/filter decided downstream.
- Support Traditional Chinese search terms such as `退款`, `退款金流`, and `退款金流紀錄` where product copy exposes that concept.
- Search reimbursement payment evidence fields that are useful for audit, such as paid-to member, method, paid date, amount, optional note/reference, and linked reimbursed ledger records.
- Show results clearly enough that users can distinguish reimbursement payment evidence from ordinary income/expense records.
- Preserve access control and household scoping for all reimbursement payment search results.
- Link or expose enough detail for the user to inspect the related reimbursed record(s) and payment evidence.
- Keep reimbursement payment evidence excluded from ordinary income/expense totals and from batch delete/refund mutation semantics unless a later gate explicitly designs different behavior.
- Add focused tests for query behavior, result presentation, and at least one browser search path.

Out of scope:

- Creating, editing, reversing, deleting, or correcting reimbursement payment records.
- Treating reimbursement payment evidence as a normal `LedgerRecord`.
- Changing monthly income/expense totals or report accounting rules.
- External payment execution, bank sync, reconciliation, or financial-service integration.
- Production search indexing, full-text search infrastructure, or cross-household admin search.
- Query-wide select-all or batch actions for reimbursement payment results.

## Current Context

- `/search` currently loads active `LedgerRecord` rows through `src/modules/reporting/record-search-query.ts`.
- Keyword search currently checks ledger record name and exact parsed amount.
- Completed batch search work made `/search` the primary record-oriented operation surface and removed the standalone reimbursement page.
- Completed reimbursement payment flow added `ReimbursementPayment` persistence for refund payment evidence, linked one payment to one reimbursement batch.
- Reimbursement payment evidence must not be counted as a second household expense.
- Search selection and batch actions currently operate on `LedgerRecord` ids; reimbursement payment results would need either a separate result shape or a read-only behavior.

## Success Criteria

- Searching for `退款金流紀錄` or the approved Traditional Chinese wording surfaces reimbursement payment evidence when matching records exist.
- Users can identify a search result as reimbursement payment evidence rather than an ordinary expense or income.
- A result exposes the paid-to member, amount, payment method, paid date, and linked reimbursed record context as designed downstream.
- Results remain scoped to the current household and actor permissions.
- Search totals and monthly reports do not double-count reimbursement payment evidence as ordinary income or expense.
- Existing ledger-record search, filters, pagination, selection mode, batch delete, and batch refund behavior continue to work.
- Tests cover reimbursement payment search query behavior and protect against including payment evidence in ordinary ledger totals.

## Constraints And Assumptions

- UI copy remains Traditional Chinese using Taiwan usage.
- Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, local components, Vitest, and Playwright foundation should be reused.
- `local_dev` remains the release target for this slice.
- The product phrase `退款金流紀錄` is accepted as user-facing language for reimbursement payment evidence unless downstream prototype/spec chooses a clearer label.
- Reimbursement payment search results should likely be read-only at first, because existing batch actions are record mutations and payment evidence corrections are out of scope.
- The downstream design must decide whether reimbursement payment evidence appears as a mixed result type in the same list, a result-section grouping, or a filter/view mode.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required, because this changes reimbursement payment discoverability, search language, result identity, and read-only versus actionable semantics.
- Project Foundation Architecture: not required; existing app foundation is sufficient.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: required, because this changes user-facing search result presentation and potentially mixed result types.
- Behavior Spec / BDD / E2E: required before technical design.
- Feature Technical Design: required, because query shape, read model, pagination/sorting, result union typing, selection behavior, and authorization boundaries need explicit decisions.
- TDD Implementation: required after approved spec and technical design.
- Verification: required after implementation.
- Target-Aware Release: required for `local_dev` readiness if schema indexes, migrations, seed data, or query performance assumptions change; otherwise still recommended because the search page is a core workflow.
- Learning Loop: optional for local_dev; recommended if local review needs to validate whether users understand the distinction between reimbursement payment evidence and ordinary records.
- Artifact Compression: required after the slice completes.

## Open Questions

- Should reimbursement payment evidence appear in the same result list as ledger records, or in a separate section/view on `/search`?
- Should the search box alone find `退款金流紀錄`, or should there be an explicit result-type filter such as `全部 / 收支紀錄 / 退款金流`?
- Which fields should keyword search include: paid-to member, payment method label, note/reference, linked record names, amount, or date?
- How should sorting and pagination work when ledger records use `occurredOn` but reimbursement payments use `paidOn`?
- Should selecting results be disabled for reimbursement payment evidence, or should selection mode hide those results?
- What wording best distinguishes `退款金流紀錄` from `已退款` ledger records without implying external payment execution?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `/search` should become the discovery surface for reimbursement payment evidence.
  - Confirm reimbursement payment evidence remains separate from ordinary ledger records and report totals.
  - Choose whether downstream prototype should explore mixed results, separate sections, or an explicit result-type filter.
- must_check:
  - No implementation starts before Domain Discovery, Experience Prototype, Behavior Spec, and Feature Technical Design are approved or explicitly accepted as risk.
  - Search totals must not accidentally count reimbursement payment evidence as income or expense.
  - Batch actions must not mutate reimbursement payment evidence unless a future approved workflow designs correction/reversal.
- acceptance_signals:
  - The problem is framed as discoverability and audit readback, not payment execution or accounting recategorization.
  - The scope protects existing ledger search and reimbursement payment invariants.
  - Open questions are explicit enough for the next gate.
- unresolved_blockers:
  - Result model and presentation need downstream decisions.
- next_step:
  - Domain Discovery / Domain Impact for `search-reimbursement-payment-records`.
