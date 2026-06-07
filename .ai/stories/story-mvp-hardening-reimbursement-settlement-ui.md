---
id: story-mvp-hardening-reimbursement-settlement-ui
stage: story
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-home-family-fund
  - cu-home-family-fund
  - ia-home-family-fund-mvp-hardening
  - story-reimbursement-table-and-settlement
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
    - Users can mark selected expenses as reimbursed once and avoid double-counting them.
  bounded_contexts:
    - Reimbursement
    - Fund Ledger
    - Identity and Access
    - Reporting
    - Responsive Web Experience
  impact_analysis:
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
  affected_code_areas:
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/reimbursement/reimbursement-table.ts
    - src/app/page.tsx
    - src/app/home-dashboard-data-source.ts
    - e2e/home.spec.ts
reviewed_at:
---

# MVP Hardening: Reimbursement Settlement UI

## Delivery Profile
This completion story targets `local_dev` under the MVP release gate. It completes the original reimbursement story's missing browser mutation path.

## User Story
As a finance manager, I want to select refundable member-paid expenses in the reimbursement table and mark them reimbursed, so that settlement is completed once and the dashboard stops counting those expenses as refundable.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Monthly reimbursement table generated | Finance manager starts from grouped refundable expenses. |
| Event | Reimbursement expenses selected | Exact expenses chosen for settlement must be explicit. |
| Event | Expenses reimbursed | Selected expenses transition to reimbursed once. |
| Policy | Only finance managers perform reimbursement | Settlement is a restricted financial operation. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Original story | `.ai/stories/story-reimbursement-table-and-settlement.md` | This is a completion slice for missing UI/persistence mutation. |
| Domain function | `src/modules/reimbursement/reimbursements.ts` | Pure one-time transition exists; needs app action/persistence wrapper. |
| Dashboard UI | `src/app/page.tsx` | Current UI displays reimbursement groups but not full expense selection/settlement flow. |
| E2E hardening | `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | Browser settlement E2E should follow DB-backed data foundation. |

## Draft Acceptance Criteria
- Finance managers can see refundable member-paid expenses grouped by member and traceable to expense records.
- Finance managers can select one or more refundable expenses and see the selected total.
- Finance managers can confirm reimbursement before the irreversible status change.
- Confirming reimbursement persists selected expenses as reimbursed.
- Reimbursed expenses no longer appear in refundable totals for the same month.
- Attempting to reimburse an already reimbursed or non-refundable expense is rejected.
- Non-finance members cannot perform settlement through UI or direct action.

## Experience Design Need
- experience_design_required: true
- reason: This is a user-facing financial selection and confirmation workflow.
- user_facing_surfaces: Reimbursement table, expense selection controls, selected-total summary, confirmation dialog, success/error feedback, permission-denied state.
- UX_risks: Users must not accidentally settle the wrong expense; selected totals must remain visible on mobile.

## Visual Model

- type: story_trace
- title: Reimbursement Settlement UI Completion Trace
- nodes:
  - id: event_selected
    label: Reimbursement expenses selected
    kind: domain_event
  - id: event_reimbursed
    label: Expenses reimbursed
    kind: domain_event
  - id: story_reimbursement_ui
    label: Reimbursement settlement UI
    kind: story
  - id: outcome_one_time
    label: One-time traceable settlement
    kind: business_outcome
  - id: code_reimbursement
    label: Reimbursement action + persistence
    kind: code_impact
  - id: xd_settlement
    label: Selection and confirmation UX
    kind: experience_design
- edges:
  - from: event_selected
    to: story_reimbursement_ui
    label: traced by
  - from: event_reimbursed
    to: story_reimbursement_ui
    label: traced by
  - from: story_reimbursement_ui
    to: outcome_one_time
    label: enables
  - from: story_reimbursement_ui
    to: code_reimbursement
    label: requires
  - from: story_reimbursement_ui
    to: xd_settlement
    label: needs design

## Priority
P2. High business value, but it should follow DB-backed dashboard E2E and browser create-record coverage so refundable expenses can be created and verified end to end.

## Dependencies
- `story-mvp-hardening-db-backed-dashboard-e2e`
- `story-mvp-hardening-browser-create-record-flow`
- `story-mvp-hardening-permission-matrix-browser-checks` for direct-action rejection coverage, or equivalent verification in this slice.

## Open Questions
- Should reimbursement selection happen inline in the dashboard, in a modal, or on a dedicated reimbursement route?
- Should reimbursement create an explicit batch row visible to users, or only update expense status for MVP?

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm selection and confirmation scope before experience design.
- must_check:
  - Settlement is finance-manager only.
  - Reimbursed expenses cannot be reimbursed twice.
  - Mobile selected total remains visible and reachable.
- acceptance_signals:
  - A finance manager can settle selected real DB-backed expenses through the browser.
- unresolved_blockers:
  - UI interaction pattern must be selected during experience design.
- next_step:
  - experience-design
