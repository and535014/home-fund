---
id: story-reimbursement-table-and-settlement
stage: story
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-home-family-fund
outputs:
  - user_story
  - acceptance_criteria_draft
  - experience_design_need
trace_links:
  domain_events:
    - Monthly reimbursement table generated
    - Reimbursement expenses selected
    - Expenses reimbursed
  business_outcomes:
    - Users can see each member's monthly reimbursement amount and trace it back to individual expenses.
    - Users can mark selected expenses as reimbursed once and avoid double-counting them.
  bounded_contexts:
    - Reimbursement
    - Fund Ledger
    - Reporting
    - Identity and Access
  impact_analysis: []
  affected_code_areas:
    - empty_repo:no_existing_code_impact_found
reviewed_at:
---

# Reimbursement Table And Settlement

## Delivery Profile
This story targets `local_dev` under the `mvp` release gate.

## User Story
As a finance manager, I want to review monthly refundable member-paid expenses by member and mark selected expenses as reimbursed, so that member-paid costs are settled once and remain traceable.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Monthly reimbursement table generated | Shows who should be reimbursed for refundable member-paid expenses and why. |
| Event | Reimbursement expenses selected | Captures exact expenses selected for settlement. |
| Event | Expenses reimbursed | Marks selected expenses as settled once. |
| Policy | Only finance managers perform reimbursement | Restricts the settlement action. |
| Aggregate | ReimbursementBatch | Owns one-time reimbursement invariant. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Existing code | Repository inspection | Empty repo; reimbursement read model and settlement action must be introduced. |
| Domain risk | DDD open questions | Whether reimbursement changes fund balance is unresolved; this story treats it as settlement state only. |

## Draft Acceptance Criteria
- Authenticated members can view a monthly reimbursement table grouped by member.
- The reimbursement table includes refundable/unreimbursed member-paid expenses and totals per member.
- Table totals can be traced to individual expense records.
- Only finance managers can select expenses and mark them reimbursed.
- Marking selected expenses reimbursed changes each expense from refundable/unreimbursed to reimbursed.
- Reimbursed expenses are excluded from future refundable reimbursement totals.
- Attempting to reimburse an already reimbursed expense is blocked.

## Experience Design Need
- experience_design_required: true
- reason: The reimbursement table, per-expense selection, and settlement confirmation are primary financial workflows.
- user_facing_surfaces: Reimbursement table, member grouped totals, expense selection, settlement confirmation, reimbursed status.
- UX_risks: Users must clearly distinguish fund-paid expenses, refundable member-paid expenses, and reimbursed member-paid expenses.

## Visual Model

- type: story_trace
- title: Reimbursement Trace
- nodes:
  - id: event_table_generated
    label: Monthly reimbursement table generated
    kind: domain_event
  - id: event_expenses_reimbursed
    label: Expenses reimbursed
    kind: domain_event
  - id: story_reimbursement
    label: Reimbursement Table And Settlement
    kind: story
  - id: outcome_traceable_settlement
    label: Traceable one-time settlement
    kind: business_outcome
  - id: xd_reimbursement
    label: Grouped table and settlement action
    kind: experience_design
- edges:
  - from: event_table_generated
    to: story_reimbursement
    label: traced by
  - from: event_expenses_reimbursed
    to: story_reimbursement
    label: traced by
  - from: story_reimbursement
    to: outcome_traceable_settlement
    label: supports
  - from: story_reimbursement
    to: xd_reimbursement
    label: needs design

## Priority
P0. Reimbursement is a central differentiator from generic monthly expense tracking.

## Dependencies
- `story-authenticated-household-access`
- `story-ledger-entry-creation`

## Open Questions
- Should marking an expense reimbursed reduce the shared fund balance or only mark settlement state?
- Should reimbursements be grouped into named batches or only stored per expense?

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate finance-manager-only settlement and one-time reimbursement rule.
- must_check:
  - Reimbursed expenses cannot be reimbursed twice.
  - Totals trace back to expense IDs.
- acceptance_signals:
  - A finance manager can settle selected member-paid expenses for a month.
- unresolved_blockers:
  - None for experience design.
- next_step:
  - experience-design
