---
id: domain-impact-reimbursement-payment-flow
stage: domain-impact
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain/home-family-fund.md
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/reimbursement-payment-flow.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-24
---

# Domain Impact for Reimbursement Payment Flow

## Summary

- intent_id: reimbursement-payment-flow
- maintained_domain_artifacts_updated: `.ai/domain/home-family-fund.md`
- bounded_contexts_touched: Reimbursement, Fund Ledger, Reporting, Identity and Access, Responsive Web Experience
- impact_type: new_behavior, changed_policy, changed_state, changed_language

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Reimbursement payment, payment source for reimbursement, payment method for reimbursement. | `退款` now means recording real-world payment evidence plus marking reimbursed; it still does not execute an external transfer. | None. | The product needs to answer where reimbursement money went without pretending to perform payment. |
| events | Reimbursement payment details captured; Reimbursement payment recorded. | Existing Expenses reimbursed and Record detail expense reimbursed now require payment evidence before completion. | None. | Payment evidence needs observable domain events for audit, BDD, and learning. |
| commands | Enter reimbursement payment details; Record reimbursement payment. | Mark selected expenses reimbursed now validates payment details and records them in the settlement. | None. | The command boundary must collect and validate money-movement details, not only flip status. |
| policies | MVP reimbursement payment capture is one payment to one paid-to member per reimbursement batch; payment amount must match selected reimbursed expense total; payment evidence is not a second ordinary expense. | Batch reimbursement should reject or split cross-member selections before settlement, pending downstream UX decision. | Status-only reimbursement as the completed happy path. | One payment record across multiple payees is ambiguous and double-counting reimbursement as expense would corrupt reports. |
| aggregates_or_invariants | ReimbursementBatch owns reimbursement payment evidence for MVP. | ReimbursementBatch must link reimbursed expense IDs, paid-to member, fixed household-fund paid-from source, method, paid date, amount, actor, and optional reference/note. | None. | The existing settlement aggregate should gain payment traceability without exposing derived facts as editable inputs. |
| bounded_contexts | Reporting consumes reimbursement payment evidence for detail/readback without counting it as income or expense. | Reimbursement now owns payment-path trace in addition to reimbursed status. | None. | Ledger remains source of household income/expense truth; Reimbursement owns settlement evidence. |
| lifecycle_or_states | Payment details missing/invalid, payment details captured, payment recorded, reimbursed with payment evidence. | `已退款` should imply payment evidence exists for new settlements after this slice. | None. | UI, BDD, and technical design need distinct validation and readback states. |

## Domain Decisions

- Reimbursement payment flow records evidence that a real-world reimbursement happened; the app does not initiate an external transfer.
- Required payment evidence for MVP: derived amount, derived paid-to member, fixed household-fund paid-from source, payment method, paid date, actor, and optional reference/note.
- Paid-to member, amount, and payment source are not user-editable in the refund action because this slice does not support another recipient, partial reimbursement, or another paid-from source.
- The paid-to member must be the payer member on all selected member-paid expenses in the reimbursement batch.
- The payment amount must equal the sum of selected eligible expenses for that paid-to member.
- A reimbursement batch with payment evidence does not create a new ordinary `LedgerRecord`; monthly income/expense reports stay based on original ledger records.
- For MVP, one reimbursement batch should produce one reimbursement payment record. Cross-member batch reimbursement is not valid unless a later gate deliberately splits it into separate per-member settlements.
- Partial reimbursement, split payment methods, post-settlement edits, correction, and reversal remain out of scope for this slice.
- Existing eligibility remains: only active member-paid refundable expenses can be reimbursed; income, fund-paid, voided, already reimbursed, unauthorized, cross-household, or cross-member selections are rejected.

## Downstream Impact

- prototype_states_or_flows:
  - Record detail reimbursement confirmation must collect or display required payment details before final confirmation.
  - Batch reimbursement UX must prevent or explain cross-member selections, or split the flow into clear per-member settlements if approved later.
  - Reimbursed record detail/readback should show payment source, payment method, paid date, paid-to member, and amount.
  - Invalid states must cover missing method/source/date, amount mismatch, cross-member selection, already reimbursed, voided, fund-paid, income, and unauthorized actor.
- bdd_scenarios:
  - Finance-capable actor reimburses one member-paid expense and records payment evidence.
  - Finance-capable actor reimburses multiple expenses for the same payer member with one matching payment record.
  - Cross-member selected expenses cannot be completed as one reimbursement payment.
  - Submitted payment amount that does not match selected expense total is rejected.
  - Reimbursement payment evidence appears in readback, while monthly income/expense totals do not double-count it.
  - Direct submission without required payment details is rejected.
- technical_design_boundaries:
  - Reimbursement owns the payment capture command and persistence transaction.
  - Fund Ledger supplies active member-paid refundable expense facts and payer-member consistency.
  - Identity and Access authorizes reimbursement at the command boundary.
  - Reporting joins or projects payment evidence for reimbursement readback but must exclude it from ordinary income/expense totals.
  - Prisma migration likely adds reimbursement payment persistence and possibly payment source/method enums or controlled values.
  - Transaction must mark selected ledger records reimbursed, create/link reimbursement batch, and create payment evidence atomically.
- tdd_domain_tests:
  - Payment evidence is required for successful reimbursement.
  - Same-member selected expenses create one reimbursed result and one payment record.
  - Cross-member, amount mismatch, missing required fields, already reimbursed, voided, fund-paid, income, and unauthorized cases are rejected.
  - Monthly report calculation ignores reimbursement payment records as ordinary expenses.
- release_or_learning_signals:
  - Local_dev readiness must include migration evidence and seed/test data updates if schema changes.
  - Learning should check whether users understand the app records payment evidence but does not perform the transfer.
  - Local review should check whether users understand the fixed household-fund payment source and payment method labels in Traditional Chinese.

## Open Questions and Risks

- product:
  - Which payment method labels should be used for the approved MVP options: bank transfer, cash, and other?
  - Should payment date default to today, or require explicit user selection?
- domain:
  - Cross-member batch reimbursement is rejected by the MVP domain rule; a later slice may split one selected set into multiple per-member reimbursement payments.
  - Partial reimbursement and split methods are intentionally deferred; this may be too strict if real household reimbursement often happens in chunks.
- data_or_ownership:
  - Technical design must decide whether payment source/method are enums, reference tables, or constrained strings.
  - Historical status-only reimbursements may exist without payment evidence; read models need a clear legacy/missing-payment state if seed or local data includes them.
- policy_or_permission:
  - Only finance-capable actors can record reimbursement payment evidence. Admin access should continue to follow existing reimbursement authorization policy.
  - Post-settlement edits are not allowed in this slice; correction/reversal needs a future approved workflow.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm MVP should require one payment record per reimbursement batch and one paid-to member per batch.
  - Confirm payment evidence must not be counted as a second household expense.
  - Confirm partial reimbursement, split payments, edits, and reversal stay out of scope.
- must_check:
  - Durable domain model is updated in `.ai/domain/home-family-fund.md`.
  - Prototype, BDD, and technical design consume payment-detail validation and no-double-count rules.
  - Status-only reimbursement is no longer the happy path for new settlements in this slice.
- acceptance_signals:
  - Experience Prototype can design payment-detail capture and readback states.
  - Behavior Spec can define same-member, amount-match, missing-detail, and no-double-count scenarios.
  - Technical Design can decide schema, transaction, validation, and reporting boundaries.
- unresolved_blockers:
  - Exact payment method option set needs prototype/spec/design decision.
- next_step:
  - Experience Prototype for `reimbursement-payment-flow`.
