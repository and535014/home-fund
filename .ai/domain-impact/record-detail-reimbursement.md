---
id: domain-impact-record-detail-reimbursement
stage: domain-impact
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-detail-reimbursement.md
  - .ai/domain/home-family-fund.md
  - .ai/archive/archive-record-list-detail-modal-2026-06-20.md
  - .ai/archive/archive-edit-delete-ledger-records-2026-06-21.md
  - .ai/spec/story-reimbursement-table-and-settlement.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/record-detail-reimbursement.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-21
---

# Domain Impact for Record Detail Reimbursement

## Summary

- intent_id: record-detail-reimbursement
- maintained_domain_artifacts_updated: `.ai/domain/home-family-fund.md`
- bounded_contexts_touched: Reimbursement, Fund Ledger, Reporting, Identity and Access, Responsive Web Experience
- impact_type: changed_workflow, changed_policy, changed_state_transition, changed_language

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Record detail reimbursement. | `退款` is accepted as user-facing copy for app settlement state, not external money movement. | None. | The dashboard detail flow needs concise copy while preserving domain precision. |
| events | Record detail reimbursement confirmed; Record detail expense reimbursed. | Existing `Expenses reimbursed` remains the broader settlement event. | None. | The single-record detail path needs confirmation and one-expense outcome language. |
| commands | Confirm record detail reimbursement; Reimburse record detail expense. | Existing reimbursement settlement can be invoked from a record detail surface for exactly one eligible expense. | None. | Prototype/spec/design need a command that starts from the detail dialog rather than the table. |
| policies | Single-record reimbursement requires confirmation; only active refundable member-paid expenses are eligible; unauthorized actors cannot submit direct reimbursement actions. | The same one-time reimbursement invariant applies whether settlement starts from the table or detail dialog. | None. | Accidental or duplicate financial settlement must be prevented. |
| aggregates_or_invariants | ReimbursementBatch owns single-expense settlement as a variant of selected-expense reimbursement. | LedgerRecord reimbursement status changes from refundable to reimbursed for the selected expense only. | None. | The action must not invent a separate settlement model. |
| bounded_contexts | Responsive Web Experience exposes the detail action; Reimbursement owns settlement; Fund Ledger supplies record eligibility; Identity and Access owns authorization; Reporting consumes updated status. | The record detail modal becomes an entry point into Reimbursement. | None. | UI placement changes command access, but domain ownership stays with Reimbursement. |
| lifecycle_or_states | Detail action states: not eligible, refundable, confirming, reimbursed, blocked/unauthorized. | Already reimbursed records remain blocked from edit/delete until reversal exists. | None. | Status labels and disabled/hidden actions must be explicit for BDD and UX. |

## Domain Decisions

- The button label in the record detail dialog is `退款`.
- Pressing `退款` must open a confirmation step before the expense is marked reimbursed.
- `退款` means marking the app's member-paid expense as reimbursed; it does not trigger a real payment transfer.
- The eligible target is exactly one active member-paid expense with reimbursement status `refundable`.
- Fund-paid expenses, income records, voided records, already reimbursed expenses, and non-refundable records are not eligible.
- Reimbursement remains one-time. Direct action submission for an already reimbursed expense must be rejected.
- Reimbursement authorization stays policy-driven: only actors with reimbursement capability can perform settlement. Prototype/spec must decide whether admin is included by capability or role copy.
- Existing edit/delete constraints remain: already reimbursed member-paid expenses stay blocked from edit/delete until reimbursement reversal is modeled.

## Downstream Impact

- prototype_states_or_flows:
  - Record detail shows `退款` only when the actor and record are eligible, or shows a clear non-action status where needed.
  - Pressing `退款` opens a confirmation step with Traditional Chinese copy that this marks the record as refunded/reimbursed in the app.
  - Confirmation success should visibly update the record's reimbursement status and provide feedback.
  - Ineligible states must cover income, fund-paid expense, already reimbursed expense, voided record, and unauthorized actor.
- bdd_scenarios:
  - Finance manager reimburses one refundable member-paid expense from record detail after confirmation.
  - Finance manager cancels confirmation and no reimbursement state changes.
  - General member cannot see or submit the reimbursement action for another member's refundable expense.
  - Already reimbursed expense cannot be reimbursed again through UI or direct action.
  - Successful detail reimbursement updates reimbursement totals and record detail status.
- technical_design_boundaries:
  - Reimbursement should own the command that marks an expense reimbursed.
  - Fund Ledger or persistence must load the active ledger record and validate member-paid/refundable eligibility in a transaction.
  - Identity and Access must authorize the reimbursement command, not only hide the button.
  - Server action revalidation must refresh `/`, `/reimbursements`, and any affected monthly read models.
  - Existing ReimbursementBatch persistence should be reused for traceability instead of adding a separate record-detail settlement table.
- tdd_domain_tests:
  - Single eligible expense transitions from refundable to reimbursed once.
  - Already reimbursed, not-refundable, fund-paid, income, and voided records are rejected.
  - Unauthorized actors are rejected at the domain/server-action boundary.
  - Confirmation cancel path performs no mutation at the browser level.
- release_or_learning_signals:
  - Local_dev release should smoke-test dashboard detail, confirmation, toast/status update, and reimbursement table totals after settlement.
  - Learning can watch whether users understand `退款` as an app settlement marker and whether the confirmation prevents accidental settlement.

## Open Questions and Risks

- product:
  - After success, should the detail modal stay open with updated status, or close with a toast?
  - Should the `/reimbursements` page also expose the same single-record action in this slice, or remain unchanged?
- policy_or_permission:
  - Should admin access be expressed as a role shortcut or only through the same explicit reimbursement capability as finance managers?
- data_or_ownership:
  - If existing persistence lacks a direct single-expense reimbursement command, technical design must decide how to wrap existing batch creation safely.
- language_or_ux:
  - `退款` is concise but can imply money transfer. Confirmation copy must clarify that the app is marking the record as已退款/settled.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm the new event/command language fits the household financial model.
  - Confirm the eligibility and blocked-state rules are complete.
  - Confirm that the next gate should prototype the detail dialog action and confirmation states.
- must_check:
  - Durable rules are reflected in `.ai/domain/home-family-fund.md`.
  - Reimbursement remains one-time and owned by the Reimbursement context.
  - The detail modal is only an entry point, not a separate settlement model.
- acceptance_signals:
  - Experience Prototype can design the modal action, confirmation step, eligible/ineligible states, and success feedback.
  - Behavior Spec can define role, direct-action, duplicate-settlement, and read-model assertions.
  - Technical Design can decide transaction and revalidation boundaries.
- unresolved_blockers:
  - None for Experience Prototype.
- next_step:
  - Experience Prototype for `record-detail-reimbursement`.
