---
id: csv-import-financial-records
stage: intent-intake
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: feature_change
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/home-family-fund.md
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain/home-family-fund.md
  - prisma/schema.prisma
outputs:
  - intent_intake
trace_links:
  bounded_contexts:
    - Fund Ledger
    - Reimbursement
    - Reporting
    - Categorization
    - Identity and Access
    - Responsive Web Experience
  related_slices:
    - reimbursement-payment-flow
    - batch-search-record-actions
    - edit-delete-ledger-records
reviewed_at: 2026-06-25
---

# Intent Intake: CSV Import Financial Records

## Intent

Add CSV import so household finance users can bring existing data into Home Family Fund instead of re-entering records one by one.

The import now targets income and expense ledger records only. Reimbursement payment CSV import is removed from this slice because imported payment rows cannot safely identify which member-paid expenses they should settle without a guided matching/reconciliation workflow.

User request: "新增 csv 匯入功能，可以匯入收入支出紀錄，也可以匯入退款金流紀錄"

## Classification

- project_type: feature_change
- affected_surfaces: import entry point, CSV upload/review UI, validation results, ledger persistence, category/member matching, authorization, server actions/API boundary, reporting refresh, tests, local_dev release readiness
- target_users: admins and finance managers responsible for maintaining household financial records and migrating existing spreadsheet data
- business_outcome: reduce manual data entry while preserving the app's financial invariants, monthly reports, reimbursement traceability, and authorization boundaries.

## Scope

In scope:

- Provide a CSV import workflow for ordinary ledger records: income records, fund-paid expenses, and member-paid expenses.
- Parse, validate, preview, and confirm imported rows before persistence.
- Reject or clearly report rows with invalid dates, amounts, record types, categories, members, payment sources, reimbursement states, or missing required fields.
- Resolve imported category and member references against existing household data, or require explicit downstream decisions for any create-on-import behavior.
- Preserve existing ledger rules: income requires source member, expenses require fund-paid or member-paid source shape, and member-paid expenses participate in reimbursement status.
- Preserve existing reimbursement rules indirectly: imported member-paid expenses may enter the normal `待退款` flow, but the import does not create reimbursement payment evidence or mark expenses reimbursed.
- Keep imports role-aware and server-validated; the upload UI cannot be the authority for permissions.
- Provide enough import result feedback for users to fix the CSV and retry without guessing which row failed.

Out of scope:

- Bank account connection, credit-card sync, receipt scanning, or automatic provider integrations.
- Bidirectional sync unless approved in a later gate.
- Creating new households, members, or categories from CSV by default.
- Direct reimbursement payment CSV import.
- Automatically matching refund payment rows to underlying expenses by date/member/amount.
- Marking imported member-paid expenses reimbursed during ledger import.
- Future reimbursement payment reconciliation workflow: upload refund payment rows, show candidate expenses, require manual expense selection, then record payment evidence.
- Reimbursement reversal, partial refund, split payment, or post-settlement correction unless Domain Discovery explicitly brings them into this slice.
- Production-grade bulk import observability, background jobs, retry queues, or large-file processing.
- Importing recurring rules or pending recurring occurrences.

## Current Context

- The app already stores `LedgerRecord` for income and expense records with category, amount, occurrence date, creator, member/fund participation, reimbursement status, and active/voided lifecycle.
- The app already stores `ReimbursementPayment` linked one-to-one to a `ReimbursementBatch`; that data is intentionally not imported directly in this slice.
- The durable domain model requires reimbursement to mark selected member-paid expenses reimbursed once and record payment evidence without double-counting monthly totals. That requirement makes direct refund-payment CSV import unsafe without a later reconciliation workflow.
- Categories are admin-managed, can be active or archived, and should remain readable on historical records.
- Existing permission boundaries distinguish admin, finance manager, and general member. Imports must not become a shortcut around create, edit, delete, reimbursement, category, or member rules.
- The current delivery target is `local_dev`; production import scale, audit retention policy, and operational monitoring remain unresolved.

## Success Criteria

- An authorized user can upload a CSV for income/expense records, review parsed rows, fix or discard invalid rows, and confirm valid rows into the ledger.
- Imported ledger records appear in monthly records, category summaries, search, and reimbursement-related read models according to the same rules as manually created records.
- Member-paid expense imports create the correct refundable state and do not mark expenses reimbursed.
- Invalid CSV rows fail with row-level Traditional Chinese error messages using Taiwan wording.
- Server-side validation rejects unauthorized actors, cross-household references, invalid categories/members, malformed amounts/dates, duplicates, unsupported types, and any attempt to import reimbursement payment evidence.
- The import flow has unit/domain tests for parsing and validation plus browser E2E coverage for at least one successful import and one validation failure.

## Constraints And Assumptions

- UI copy remains Traditional Chinese with Taiwan usage.
- Existing Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, and Playwright foundation should be reused.
- The initial import can be synchronous and local-dev sized unless downstream design finds a real large-file need.
- CSV format, encoding, delimiter, required columns, date format, currency/amount representation, and duplicate handling are not decided in this intake.
- Import should prefer explicit preview and confirmation because financial bulk changes are hard to inspect after the fact.
- The safest initial assumption is that import matches existing members and categories by stable IDs or exact display names/category names; ambiguity must be reported instead of guessed.
- Imports should create active records only unless Domain Discovery approves importing voided or historical correction states.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required, because CSV import changes ledger creation workflow, bulk validation policy, duplicate/conflict handling, and reimbursement-adjacent member-paid expense invariants.
- Project Foundation Architecture: not required; existing app foundation is sufficient.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: required, because users need a CSV upload, mapping/preview, row-level validation, confirmation, and result state.
- Behavior Spec / BDD / E2E: required before technical design.
- Feature Technical Design: required, because parsing ownership, CSV contract, validation boundaries, transaction shape, idempotency/duplicate policy, persistence, and test strategy need explicit decisions.
- TDD Implementation: required after approved spec and technical design.
- Verification: required after implementation.
- Target-Aware Release: required for `local_dev` readiness because this is a bulk financial write path and may include schema or seed/test fixture changes.
- Learning Loop: recommended for local_dev review to learn whether users can prepare CSV files correctly and understand validation feedback.
- Artifact Compression: required after the slice completes.

## Open Questions

- Who can import ledger records: admin only, finance manager, or both?
- What CSV columns are required for ledger records?
- How should rows reference members and categories: app IDs, display names, category names, or a mapping step?
- Should import create missing categories or members, or require all referenced entities to already exist?
- How should duplicate detection work: exact row match, external import key, date/amount/name/member/category match, or no automatic deduplication?
- Should a future reimbursement payment reconciliation workflow be a separate intent after ledger import ships?
- Should successful imports be atomic all-or-nothing, partial success with rejected rows, or staged draft import before final commit?
- What file size and row count are acceptable for local_dev MVP?
- Should import history be stored for audit and rollback, or is row-level validation plus created records enough for this slice?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm CSV import should cover ledger records only in this slice.
  - Confirm external bank/payment integrations remain out of scope.
  - Confirm downstream Domain Discovery should decide CSV contract, duplicate handling, and member/category matching.
- must_check:
  - No implementation starts before Domain Discovery, Experience Prototype, Behavior Spec, and Feature Technical Design are approved or explicitly accepted as risk.
  - Import must not bypass existing authorization, category, member, reimbursement-adjacent, and reporting invariants.
  - Reimbursement payment import is explicitly out of scope.
- acceptance_signals:
  - The problem is framed as controlled ledger bulk data entry and migration, not bank sync or refund-payment matching.
  - Scope is narrow enough for local_dev MVP while still protecting financial correctness.
  - Open questions are explicit enough for the next gate.
- unresolved_blockers:
  - CSV column contract, matching strategy, duplicate policy, and transaction semantics require Domain Discovery.
- next_step:
  - Domain Discovery / Domain Impact for `csv-import-financial-records`.
