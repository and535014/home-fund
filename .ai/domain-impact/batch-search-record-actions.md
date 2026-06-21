---
id: domain-impact-batch-search-record-actions
stage: domain-impact
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/batch-search-record-actions.md
  - .ai/domain/home-family-fund.md
  - .ai/archive/archive-record-search-sort-filter-2026-06-21.md
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
  - .ai/archive/archive-edit-delete-ledger-records-2026-06-21.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/batch-search-record-actions.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-21
---

# Domain Impact for Batch Search Record Actions

## Summary

- intent_id: batch-search-record-actions
- maintained_domain_artifacts_updated: `.ai/domain/home-family-fund.md`
- bounded_contexts_touched: Reporting, Fund Ledger, Reimbursement, Identity and Access, Responsive Web Experience
- impact_type: new_behavior, changed_policy, changed_workflow, changed_state, changed_language

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Search result selection, selected record set, batch record action, batch delete, batch reimbursement. | `退款` remains app settlement state even when exposed as `批次退款`. | Standalone reimbursement page as a domain workflow entry. | Batch actions need precise language that separates temporary selection from authorized financial mutation. |
| events | Search records selected, Batch deletion confirmed, Batch ledger records voided, Batch reimbursement confirmed, Batch expenses reimbursed, Reimbursement page retired. | Existing ledger voiding and reimbursement events now have multi-record variants from search results. | None. | Prototypes and specs need observable outcomes for selection, confirmation, mutation, and removed route behavior. |
| commands | Select search result records, Confirm batch delete, Batch delete ledger records, Confirm batch reimbursement, Batch reimburse selected expenses. | Single-record delete/refund invariants are reused for selected record sets. | Navigate to standalone reimbursement page as the refund workflow. | Search becomes the record-oriented batch operation surface; domain ownership stays with Ledger/Reimbursement. |
| policies | Selected IDs must be revalidated server-side; batch delete uses existing delete authorization per record; batch reimbursement requires active refundable member-paid expenses and reimbursement authorization; direct `/reimbursements` visits use default 404. | Query selection must not grant mutation rights. | Redirecting `/reimbursements` to a replacement refund page. | Batch UI can be convenient, but permission and eligibility remain command-level rules. |
| aggregates_or_invariants | LedgerRecord owns batch voiding as repeated void transitions; ReimbursementBatch owns batch reimbursement as the multi-expense settlement invariant. | ReimbursementBatch now covers both table-style selected expenses, record-detail single expense, and search-selected eligible expenses. | Separate reimbursement-page aggregate. | Avoids a parallel settlement model and preserves traceability to expense IDs. |
| bounded_contexts | Reporting owns search result selection state; Responsive Web Experience owns batch action flow and default 404 direct visit experience. | Fund Ledger and Reimbursement remain mutation owners; Identity and Access remains authorization owner. | Standalone reimbursement page as a required bounded-context surface. | Selection is read-model/UI state; financial truth stays in existing contexts. |
| lifecycle_or_states | Search selection empty/selected/cleared; batch confirmation; eligible/ineligible/skipped records; default 404 for removed route. | Active/voided and refundable/reimbursed state transitions now occur across selected sets. | Independent reimbursement page lifecycle. | BDD/E2E must cover batch state transitions and removed-route behavior. |

## Domain Decisions

- `/search` is the primary surface for multi-record batch actions.
- Search result selection is temporary UI/read-model state and does not grant permission to delete or reimburse.
- Server commands must revalidate every selected record ID against current active/voided state, reimbursement status, record type, payment source, household scope, and actor authorization.
- Batch delete uses existing deletion semantics: eligible selected ledger records are voided, not hard-deleted.
- Batch reimbursement uses existing reimbursement semantics: eligible selected member-paid refundable expenses are marked reimbursed once through ReimbursementBatch-style settlement.
- `/reimbursements` is removed as a standalone page. Direct visits should show the framework default 404, not redirect to `/search`.
- The `退款` navigation item is removed from primary navigation; refund actions are reached from record-oriented surfaces.

## Downstream Impact

- prototype_states_or_flows:
  - Search results support selecting individual records, clearing selection, and seeing selected counts.
  - Batch action controls must distinguish delete and refund actions and make ineligible records understandable.
  - Batch delete confirmation explains that records leave active views.
  - Batch refund confirmation explains that eligible expenses are marked `已退款` in the app.
  - Removed refund navigation and direct `/reimbursements` default 404 behavior need prototype/review coverage if visible in local_dev.
- bdd_scenarios:
  - User selects and clears multiple search results without changing the query.
  - Authorized actor batch deletes eligible records and sees active search results/totals refresh.
  - Unauthorized actor cannot batch delete records through UI or direct action.
  - Finance-capable actor batch refunds eligible member-paid refundable expenses and cannot double-refund.
  - Mixed eligible/ineligible selected records follow the approved all-or-nothing or partial-success behavior.
  - Navigation no longer shows `退款`, and direct `/reimbursements` returns the default 404.
- technical_design_boundaries:
  - Search UI owns selection state and batch confirmation state.
  - Fund Ledger owns batch delete command validation and voiding.
  - Reimbursement owns batch reimbursement command validation and settlement persistence.
  - Identity and Access authorization must run per selected record or through an equivalent policy boundary.
  - Reporting/search read models must refresh after successful mutations and exclude voided records/unpaid reimbursed expenses as appropriate.
  - Route deletion should remove `src/app/(app)/reimbursements/page.tsx` and navigation entries without adding a redirect.
- tdd_domain_tests:
  - Batch delete rejects or skips unauthorized/inactive records according to the approved partial-success decision.
  - Batch reimbursement rejects already reimbursed, voided, fund-paid, income, and unauthorized records.
  - Reimbursement remains one-time across batch and single-record flows.
  - Search selection cannot bypass server-side eligibility.
  - Navigation and route tests assert no standalone refund page remains.
- release_or_learning_signals:
  - Local_dev verification should include search multi-select, batch delete, batch refund, navigation removal, and default 404 direct visit smoke.
  - Learning should watch whether users understand skipped/ineligible records, selected count, and that `批次退款` is app settlement rather than an external transfer.

## Open Questions and Risks

- product:
  - Should batch actions be all-or-nothing when any selected record is ineligible, or should eligible records proceed while ineligible records are skipped with a result summary?
  - Should changing search filters clear selection immediately?
  - Should single-record detail `退款` remain as a convenience after batch refund exists?
- domain:
  - Partial-success behavior must be explicit because it affects user trust and transaction expectations.
  - Batch delete of already reimbursed member-paid expenses inherits existing reimbursement reversal limitations.
- data_or_ownership:
  - Technical design must decide transaction boundaries for selected sets and how to return per-record outcomes.
  - Route deletion must not leave navigation or revalidation references assuming `/reimbursements` exists.
- policy_or_permission:
  - Finance-manager delete restrictions remain unchanged; finance managers cannot batch delete other members' records in the MVP permission set.
  - Admin reimbursement should continue to follow the same reimbursement capability/role policy used by existing single-record refund.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm batch action language and events match the intended search workflow.
  - Confirm `/reimbursements` removal/default 404 is captured as a product and routing decision.
  - Decide all-or-nothing versus partial-success behavior before Behavior Spec.
- must_check:
  - Durable domain rules are in `.ai/domain/home-family-fund.md`, not only this impact file.
  - Prototype, BDD, and technical design consume selection, eligibility, authorization, and route removal rules.
  - Batch refund does not imply external money movement.
- acceptance_signals:
  - Experience Prototype can design selection, batch actions, confirmations, result summaries, and navigation removal.
  - Behavior Spec can define role, ineligible-record, direct-action, and removed-route assertions.
  - Technical Design can decide transaction, outcome, revalidation, and route deletion boundaries.
- unresolved_blockers:
  - All-or-nothing versus partial-success semantics need approval before implementation.
- next_step:
  - Experience Prototype for `batch-search-record-actions`.
