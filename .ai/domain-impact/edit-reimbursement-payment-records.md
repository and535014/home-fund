---
id: domain-impact-edit-reimbursement-payment-records
stage: domain-impact
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-reimbursement-payment-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/edit-reimbursement-payment-records.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-27
---

# Domain Impact for Edit Reimbursement Payment Records

## Summary

- intent_id: edit-reimbursement-payment-records
- maintained_domain_artifacts_updated: `.ai/domain/home-family-fund.md`
- bounded_contexts_touched: Reimbursement, Reporting, Identity and Access, Responsive Web Experience
- impact_type: changed_policy, changed_state, changed_permission, changed_language

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Refund record correction; reimbursement payment evidence correction. | `退款紀錄` is no longer strictly read-only in all cases; it can have a controlled correction path for payment date, method, and note. | Blanket read-only assumption for refund record evidence. | Users need to fix common data-entry mistakes without reversing settlement. |
| events | Reimbursement payment evidence corrected. | Reimbursement payment evidence found can lead to a correction flow instead of only readback. | None. | The correction outcome must be observable for BDD, audit expectations, and read-model refresh. |
| commands | Correct refund record evidence. | Search/open refund record remains a Reporting read path; mutation stays owned by Reimbursement. | None. | Editing payment evidence is a reimbursement command, not an ordinary ledger-record edit. |
| policies | Only payment date, payment method, and note are editable through this flow; authorization and household scoping are required. | Reimbursement payment evidence remains excluded from batch delete/refund and ordinary totals, even when corrected. | Editing amount, paid-to member, paid-from source, linked records, reimbursement batch, or reimbursed state. | Corrections should fix evidence fields without changing settlement facts or financial totals. |
| aggregates_or_invariants | ReimbursementBatch owns corrected payment evidence as part of the settlement trace. | ReimbursementBatch can update limited evidence fields after settlement, pending metadata/history design. | None. | The settlement aggregate must preserve one-time reimbursement and no-double-count rules. |
| bounded_contexts | Responsive Web Experience must distinguish `編輯` or `更正` refund evidence from reversing reimbursement. | Reporting consumes updated evidence fields after correction but does not own the mutation. | None. | Users need correction affordances in the search/detail UI, but domain ownership remains Reimbursement. |
| lifecycle_or_states | Viewing refund record, editing evidence, validation failed, save canceled, evidence corrected, readback refreshed. | `退款紀錄` detail becomes actionable for authorized actors while remaining non-selectable for batch actions. | None. | Prototype and BDD need explicit modal/form states and error paths. |

## Domain Decisions

- The correction flow is limited to payment date, payment method, and note.
- Refund amount, paid-to member, paid-from source, reimbursement batch, linked ledger records, recorded-by actor, and reimbursed state are not editable through this intent.
- Correcting refund evidence does not create a new ordinary `LedgerRecord` and must not affect monthly income, expense, net total, category summaries, or reimbursement status totals.
- The correction command belongs to Reimbursement, even if launched from the Reporting `/search` refund-record detail surface.
- Search result selection and batch actions remain ledger-record-only; refund records are still not selectable for batch delete or batch refund.
- Payment method remains constrained to the approved reimbursement method set until a later intent changes it.
- Empty note is allowed only if downstream Behavior Spec confirms the display rule; likely readback should use `沒有備註。` for blank values.

## Open Policy Decisions

- Exact permission rule:
  - Candidate A: finance managers and admins can edit any household refund record.
  - Candidate B: only admins and the actor who originally recorded the refund can edit.
  - Candidate C: finance managers can edit, but admins can additionally see correction metadata/history.
- Audit metadata:
  - Direct overwrite is simpler, but weakens traceability.
  - Storing `updatedAt` and `updatedByMemberId` is a pragmatic minimum if users expect financial correction accountability.
  - Full history rows are stronger but may be disproportionate for this MVP slice unless household audit needs are explicit.
- User-facing action wording:
  - `更正退款紀錄` better signals evidence correction.
  - `編輯退款紀錄` is simpler but risks implying broader mutability.

## Downstream Impact

- prototype_states_or_flows:
  - Refund record detail must show an authorized correction action.
  - Correction form must prefill current payment date, payment method, and note.
  - Non-editable settlement facts should remain visible but not look like editable fields.
  - Save, cancel, pending, validation-error, and success states must fit the modal flow on desktop and mobile.
  - Unauthorized users should not see the correction affordance, and direct failures still need clear feedback.
- bdd_scenarios:
  - Authorized actor corrects a refund record's payment date, method, and note.
  - Unauthorized actor cannot correct a refund record.
  - Invalid payment date or unsupported method is rejected.
  - Attempted mutation of amount, paid-to member, paid-from source, linked records, or reimbursed state is rejected or impossible by contract.
  - Corrected evidence appears in refund-record detail and search result readback.
  - Monthly totals and ordinary ledger search results are unchanged after correction.
- technical_design_boundaries:
  - Reimbursement owns the update command and validation.
  - Identity and Access owns actor permission and household scope.
  - Reporting owns refreshed read models after correction, including sort/pagination behavior if `paidOn` changes.
  - Technical Design must decide whether schema needs `updatedAt`, `updatedByMemberId`, or history tables for reimbursement payments.
  - Server action contract must accept only the editable fields and ignore or reject non-editable settlement facts.
- tdd_domain_tests:
  - Domain/action test for valid evidence correction.
  - Permission rejection test.
  - Invalid date and invalid method tests.
  - Non-editable settlement facts remain unchanged.
  - Reporting totals exclude reimbursement payment evidence before and after correction.
- release_or_learning_signals:
  - If schema changes for correction metadata, local_dev release readiness must include migration evidence.
  - Learning should watch whether users understand `更正退款紀錄` as correcting recorded evidence, not undoing reimbursement.
  - Local review should check whether changing payment date reorders refund-record search results in an expected way.

## Risks

- Allowing edits without metadata could make financial evidence less trustworthy.
- Using `編輯` broadly may encourage expectations that amount or linked records are editable.
- Changing `paidOn` may move a refund record in sorted search results, which is correct but can feel like the record disappeared if the UI does not refresh clearly.
- If admins and finance managers have different edit rights, UI copy and server errors must avoid implying permissions that are not real.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm limited editable fields: payment date, payment method, and note.
  - Confirm settlement facts remain immutable through this flow.
  - Choose or defer the permission rule for who may correct refund records.
  - Choose whether correction metadata/history is required for MVP.
- must_check:
  - Durable domain model is updated in `.ai/domain/home-family-fund.md`.
  - This file contains only the intent-specific domain delta.
  - Prototype, BDD, and technical design preserve no-double-count and immutable settlement facts.
- acceptance_signals:
  - Experience Prototype can model the correction affordance and form states.
  - Behavior Spec can define permission, validation, and unchanged-total scenarios.
  - Technical Design can decide update contract, cache refresh, and optional schema metadata.
- unresolved_blockers:
  - Exact correction permission rule.
  - Whether direct overwrite is acceptable or correction metadata/history is required.
- next_step:
  - Experience Prototype for `edit-reimbursement-payment-records`.
