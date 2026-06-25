---
id: domain-impact-search-reimbursement-payment-records
stage: domain-impact
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/domain/home-family-fund.md
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
  - .ai/archive/archive-reimbursement-payment-flow-2026-06-25.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/search-reimbursement-payment-records.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-25
---

# Domain Impact for Search Reimbursement Payment Records

## Summary

- intent_id: search-reimbursement-payment-records
- maintained_domain_artifacts_updated: `.ai/domain/home-family-fund.md`
- bounded_contexts_touched: Reporting, Reimbursement, Fund Ledger, Identity and Access, Responsive Web Experience
- impact_type: new_behavior, changed_policy, changed_language

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Refund record search surface; `退款紀錄` as user-facing language for reimbursement payment evidence discoverability. | Record query and refund-record query are separate tab-scoped searches, not one mixed result model. | None. | Users need to find payment evidence after reimbursement without confusing it with income/expense records. |
| events | Refund record found; related refund record opened; related ledger records opened. | Record query applied remains ledger-record scoped; refund-record query applied surfaces read-only reimbursement payment evidence. | None. | Search and detail readback need observable outcomes for BDD, read-model design, and learning. |
| commands | Search refund records; open related refund record; open related ledger records. | Search, sort, or filter records must be scoped to the active tab. | None. | The search surface becomes a discovery boundary for reimbursement evidence, not a mutation command. |
| policies | Payment evidence search results are read-only in this slice; they are household-scoped, permission-scoped, excluded from ordinary totals, and not eligible for batch delete/refund selection. | Keyword/date/amount/member matching must distinguish ledger occurrence facts from payment evidence facts. | None. | Reimbursement payment evidence is audit data owned by Reimbursement and consumed by Reporting; batch mutation semantics remain ledger-record based. |
| aggregates_or_invariants | ReimbursementBatch evidence is discoverable through Reporting without transferring ownership to Reporting. | MonthlyReport/RecordQuery read models may include reimbursement payment evidence while preserving no-double-count rules. | None. | The same payment evidence must stay linked to settled expenses and must not become a second financial record. |
| bounded_contexts | Reporting consumes Reimbursement payment evidence for search discovery; Responsive Web Experience must present result identity clearly. | Reimbursement feeds searchable payment evidence to Reporting while retaining settlement invariants. | None. | The user-facing search page crosses Reporting and Reimbursement, but command ownership should stay separate. |
| lifecycle_or_states | Search states include no matches, ledger-record matches in `收支紀錄`, refund-record matches in `退款紀錄`, refunded-expense readback to refund record, and refund-record readback to related ledger records. | Selection mode belongs to `收支紀錄`; refund records remain read-only unless a later approved correction workflow changes that. | Mixed same-list result ambiguity. | The UI has an explicit tab boundary before BDD/E2E and technical design define query contracts. |

## Domain Decisions

- `退款紀錄` is the product language for discovering reimbursement payment evidence.
- `/search` separates `收支紀錄` and `退款紀錄` into tabs above the search input.
- Reimbursement payment evidence search is read-only in this slice.
- Reimbursement payment search results must remain separate in meaning from ordinary `LedgerRecord` income/expense results.
- A reimbursed expense detail may expose a read-only action to open the related refund record.
- A refund record detail may expose a read-only action to open its related ledger record list.
- Search discovery must not count reimbursement payments as income, expense, signed net total, monthly totals, category summaries, or ordinary ledger records.
- Existing batch delete and batch refund actions continue to operate on selected ledger records only.
- Search results must be scoped to the current household and actor permissions.
- Candidate searchable evidence fields are 收款成員, amount, payment method, paid date, note/reference, linked reimbursed record names, and explicit reimbursement payment labels.

## Downstream Impact

- prototype_states_or_flows:
  - Show `/search` with `收支紀錄` and `退款紀錄` tabs above the search input.
  - Show `收支紀錄` search and filters without refund-record results.
  - Show `退款紀錄` search and filters without ordinary ledger-record results.
  - Show a result identity treatment that distinguishes payment evidence from `收入` and `支出`.
  - Show selection mode only on the `收支紀錄` tab.
  - Show refunded expense detail opening a related refund record modal.
  - Show refund record detail opening a related ledger record list.
- bdd_scenarios:
  - A member searches `退款紀錄` and sees reimbursement payment evidence.
  - A member switches to `退款紀錄` tab and sees only refund records.
  - A member searches by 收款成員, amount, method, date, note/reference, or linked record name and finds matching payment evidence where approved.
  - A member opens an already-refunded expense and follows the action to its related refund record.
  - A member opens a refund record and follows the action to related ledger records.
  - Search totals and monthly report totals do not include reimbursement payment evidence as ordinary income or expense.
  - Selection mode cannot submit reimbursement payment evidence to batch delete or batch refund.
  - Cross-household or unauthorized payment evidence is not returned.
- technical_design_boundaries:
  - Reporting owns the search/read-model query and result union shape.
  - Reimbursement owns payment evidence persistence and settlement invariants.
  - Fund Ledger owns ordinary ledger record facts and existing batch mutation IDs.
  - Identity and Access scopes all results to the authorized household member.
  - Technical design must decide sorting/pagination for `退款紀錄` results by payment date and amount.
- tdd_domain_tests:
  - Query builder or read-model tests for matching `退款紀錄` and approved payment evidence fields.
  - Tests proving reimbursement payment evidence is excluded from signed net totals and monthly income/expense totals.
  - Tests proving payment evidence result IDs cannot be passed as ledger-record batch mutation IDs.
  - Permission/household scoping tests for payment evidence search.
- release_or_learning_signals:
  - Local_dev review should verify the search copy is understandable and does not imply external payment execution.
  - Learning should observe whether users can distinguish `已退款` ledger records from `退款紀錄` payment evidence.
  - If query shape adds indexes or seed data, local_dev readiness must record migration/seed evidence.

## Open Questions and Risks

- product:
  - User-facing naming is corrected to `退款紀錄`; active product copy should use this term.
- domain:
  - Should a search for `已退款` return reimbursed ledger records, reimbursement payment evidence, or both?
  - Should payment evidence be searchable by linked expense category/member fields, or only by payment-specific facts?
- data_or_ownership:
  - Sorting/pagination inside `退款紀錄` needs a clear read-model decision.
  - One refund record can be linked to one or multiple ledger records depending on batch settlement; the related-record list must support both.
  - Result IDs must avoid collision or accidental submission to ledger mutation commands.
- policy_or_permission:
  - Finance-capable users likely need full payment evidence discovery, but general-member visibility may need confirmation if payment evidence includes other members' reimbursement details.
  - Read-only result behavior must stay strict until correction/reversal workflows are approved.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm reimbursement payment evidence should be searchable from `/search`.
  - Confirm read-only treatment and no-double-count rules.
  - Confirm the tab-separated search model and bidirectional readback.
- must_check:
  - Durable domain model is updated in `.ai/domain/home-family-fund.md`.
  - This file contains only the intent-specific domain delta.
  - Prototype, BDD, and technical design must preserve read-only payment evidence semantics.
- acceptance_signals:
  - Experience Prototype can model tab-separated search states and readback modals.
  - Behavior Spec can define search matching, totals, selection, and permission scenarios.
  - Technical Design can choose read-model/result-union and pagination boundaries.
- unresolved_blockers:
  - Tab behavior and readback modal behavior need prototype review.
- next_step:
  - Experience Prototype for `search-reimbursement-payment-records`.
