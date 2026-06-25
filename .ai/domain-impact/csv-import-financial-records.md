---
id: domain-impact-csv-import-financial-records
stage: domain-impact
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/csv-import-financial-records.md
  - .ai/domain/home-family-fund.md
  - prisma/schema.prisma
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/csv-import-financial-records.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-25
---

# Domain Impact for CSV Import Financial Records

## Summary

- intent_id: csv-import-financial-records
- maintained_domain_artifacts_updated: `.ai/domain/home-family-fund.md`
- bounded_contexts_touched: Fund Ledger, Reimbursement, Reporting, Categorization, Identity and Access, Responsive Web Experience
- impact_type: new_behavior, changed_policy, changed_workflow, changed_state, changed_language

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | CSV import batch, CSV import target, CSV import row, import preview, import row validation, imported ledger record, reimbursement payment reconciliation. | Ledger creation has a bulk command path in addition to manual UI actions. | Imported reimbursement payment as active-slice language. | Users need shared vocabulary for uploaded ledger rows, while refund payment matching needs a separate reconciliation workflow. |
| events | CSV import file uploaded, CSV import rows validated, CSV import confirmed, ledger records imported, CSV import rows rejected. | Ledger events can now be reached through an import confirmation command. | Reimbursement payments imported. | Prototype, BDD, and learning need visible states for parse, validation, confirmation, mutation, and rejection without implying refund payment import is safe. |
| commands | Upload CSV import file, validate CSV import rows, confirm CSV import batch, import ledger records from CSV, reject CSV import rows. | Record income/expense invariants must apply to imported rows. | Import reimbursement payments from CSV. | Import must not become an unvalidated data-loading shortcut, and refund payment rows cannot safely identify settled expenses. |
| policies | Upload/preview has no financial effect; rows must be server-validated; imported ledger rows use manual ledger rules; direct reimbursement payment rows are rejected/out of scope. | Import authorization is ledger-target specific and revalidated server-side. | Direct imported reimbursement payments. | Bulk ledger writes are useful; bulk refund payment writes are unsafe without manual expense linking. |
| aggregates_or_invariants | LedgerRecord accepts imported rows only after confirmation. | Member-paid imported expenses enter normal refundable flow and are reimbursed later through app settlement commands. | ReimbursementBatch/ReimbursementPayment as import targets for this slice. | Imported data must produce the same ledger truth as user-entered data; reimbursement remains an explicit app workflow. |
| bounded_contexts | Responsive Web Experience owns preview/error/result display; Categorization participates in category matching; Reporting consumes imported outcomes after commit. | Fund Ledger and Reimbursement remain mutation owners; Identity and Access remains authorization owner. | None. | Import is cross-context orchestration but not a new bounded context yet. |
| lifecycle_or_states | Uploaded, parsed, previewed, valid, invalid, confirmed, imported, partially rejected/blocked pending policy. | Active ledger states can originate from confirmed imports. | Imported reimbursement payment state. | BDD/E2E must distinguish no-effect preview from committed ledger mutation. |

## Domain Decisions

- CSV import is a controlled bulk command path for ledger records, not a separate source of financial truth.
- An uploaded CSV does not mutate ledger records, reimbursement batches, or reimbursement payments until the actor reviews and confirms valid ledger rows.
- Ledger imports must create ordinary active `LedgerRecord` rows that obey the same income/expense, source-member, payment-source, payer-member, category, reimbursement-status, household, and authorization rules as manual creation.
- Reimbursement payment CSV import is removed from this slice. It should become a future reconciliation workflow if needed.
- Future reimbursement payment reconciliation should upload payment rows, show candidate member-paid expenses, require manual expense selection, and only then record reimbursement payment evidence.
- Import row validation is server-owned. Client-side parsing or preview can assist the user but cannot decide financial correctness.
- Missing, ambiguous, cross-household, unauthorized, malformed, duplicate/conflicting, unsupported reimbursement-payment, or target-inconsistent rows must be rejected or blocked with row-level reasons.
- Creating missing members or categories from CSV is not part of the durable rule; downstream gates must explicitly approve it if desired.
- Importing recurring rules, pending recurring occurrences, reversals, partial reimbursements, split payments, or post-settlement corrections remains out of scope for this slice.

## Downstream Impact

- prototype_states_or_flows:
  - Provide a single ledger import flow before upload.
  - Show upload, parsing, preview, row validation, row errors, matched member/category evidence, confirmation, and result states.
  - Make it visually obvious that preview has no financial effect until confirmation.
  - Keep refund payment upload/linking out of the prototype except as future product language if needed.
- bdd_scenarios:
  - Authorized actor imports valid income and expense rows and sees monthly reports/search update.
  - Unauthorized actor cannot import ledger rows through UI or direct action.
  - Invalid ledger CSV rows show row-level errors and do not create records.
  - Member-paid expense rows become refundable and are not marked reimbursed during import.
  - Reimbursement payment CSV rows are rejected as unsupported for this slice.
  - Uploading a CSV and leaving before confirmation creates no financial records.
- technical_design_boundaries:
  - Parsing and preview may live in the app layer, but domain validation and persistence belong to the Fund Ledger command boundary.
  - Identity and Access must authorize ledger import, not only page access.
  - Categorization and member matching need deterministic matching APIs or an explicit mapping step.
  - Reporting must refresh from committed ledger/reimbursement data, not preview state.
  - Technical Design must decide CSV schemas, encoding/date/amount formats, duplicate keys, row limits, atomic versus partial commit, import history, and transaction boundaries.
- tdd_domain_tests:
  - Ledger import accepts valid income, fund-paid expense, and member-paid expense rows.
  - Ledger import rejects invalid category/member/type/payment-source combinations and unauthorized actors.
  - Member-paid rows become refundable rather than reimbursed.
  - Reimbursement payment rows are rejected or not accepted by the active import contract.
  - Upload/preview-only flows create no persisted financial records.
- release_or_learning_signals:
  - Local_dev readiness should include import fixtures, at least one happy-path import smoke, and at least one validation-failure smoke.
  - Learning should watch whether users can prepare CSV files correctly, understand row-level errors, and trust preview-before-confirmation.
  - If a schema change stores import history, release readiness must include migration evidence and rollback considerations.

## Open Questions and Risks

- product:
  - Should the app provide downloadable CSV templates in this slice, or only document required columns in the UI?
  - What row count is acceptable for the synchronous local_dev MVP?
- domain:
  - Should import be all-or-nothing, partial success with rejected rows, or a staged draft import requiring a final commit?
  - Should future reimbursement payment reconciliation be its own intent after ledger import ships?
- data_or_ownership:
  - Matching by display name/category name is fragile if names are duplicated or renamed; matching by app ID is stable but less friendly for users.
  - Duplicate detection needs a durable key or policy; otherwise repeated imports can silently duplicate financial records.
  - Import history may be needed for audit or rollback, but storing raw uploaded CSV could create privacy and retention questions.
- policy_or_permission:
  - Ledger import permission is unresolved: admin only, finance manager, or both.
  - Direct reimbursement payment import is out of scope; future reconciliation permission should require reimbursement authority.
  - Creating missing categories or members during import would cross into admin/member-management policy and should be rejected unless explicitly approved.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm CSV import is modeled as a bulk command path, not bank sync or a separate ledger source.
  - Confirm direct reimbursement payment import is removed from this slice.
  - Decide whether Domain Discovery should approve a default policy for all-or-nothing versus partial import before prototype.
- must_check:
  - Durable domain model is updated in `.ai/domain/home-family-fund.md`.
  - Prototype, BDD, and technical design consume preview/no-effect, server validation, target-specific permission, and no-double-count rules.
  - Reimbursement payment import cannot bypass one-time reimbursement because it is out of scope.
- acceptance_signals:
  - Experience Prototype can design ledger upload, preview, validation errors, confirmation, and result states.
  - Behavior Spec can define row-level success/failure and direct-action rejection scenarios.
  - Technical Design can decide CSV contracts, matching APIs, duplicate policy, transaction semantics, and persistence boundaries.
- unresolved_blockers:
  - CSV schema, matching strategy, duplicate policy, and commit semantics require downstream approval.
- next_step:
  - Experience Prototype for `csv-import-financial-records`.
