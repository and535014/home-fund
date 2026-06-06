---
id: story-ledger-record-corrections
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
    - Ledger record corrected
    - Ledger record deleted
  business_outcomes:
    - Members can confidently browse shared records while being prevented from editing or deleting records they do not own.
    - Finance managers can create or correct records for others.
  bounded_contexts:
    - Identity and Access
    - Fund Ledger
  impact_analysis: []
  affected_code_areas:
    - empty_repo:no_existing_code_impact_found
reviewed_at:
---

# Ledger Record Corrections

## Delivery Profile
This story targets `local_dev` under the `mvp` release gate.

## User Story
As a record owner or authorized manager, I want to correct or delete permitted ledger records, so that mistakes can be fixed without allowing members to alter records they do not control.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Ledger record corrected | Captures allowed updates to records. |
| Event | Ledger record deleted | Removes invalid records under ownership and admin rules. |
| Policy | General member must be record owner | Prevents unauthorized modification. |
| Policy | Admin can create, edit, or delete any record | Gives admins full cleanup authority. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Existing code | Repository inspection | Empty repo; no existing edit/delete behavior. |
| Domain risk | DDD open questions | Deletion semantics are unresolved. Finance-manager delete access to other members' records is disabled by default for MVP but can be made configurable later by admins. |

## Draft Acceptance Criteria
- Record owners can edit their own income and expense records.
- Record owners can delete their own income and expense records.
- General members cannot edit or delete records created by other members.
- Admins can edit and delete any member's records.
- Finance managers can edit records for other members.
- Finance managers cannot delete other members' records in the MVP permission set.
- The permission model should leave room for admins to explicitly grant expanded finance-manager capabilities later.
- Deleted records no longer affect monthly totals or reimbursement calculations.

## Experience Design Need
- experience_design_required: true
- reason: Edit, delete, ownership indicators, and unavailable actions are visible in record browsing and detail flows.
- user_facing_surfaces: Record list, record detail, edit form, delete confirmation, disabled/hidden actions.
- UX_risks: Users may confuse creator, payer/source member, and edit owner; destructive actions need clear confirmation.

## Visual Model

- type: story_trace
- title: Record Corrections Trace
- nodes:
  - id: event_record_corrected
    label: Ledger record corrected
    kind: domain_event
  - id: event_record_deleted
    label: Ledger record deleted
    kind: domain_event
  - id: story_corrections
    label: Ledger Record Corrections
    kind: story
  - id: outcome_protected_editing
    label: Protected record editing
    kind: business_outcome
  - id: xd_record_actions
    label: Record actions and confirmations
    kind: experience_design
- edges:
  - from: event_record_corrected
    to: story_corrections
    label: traced by
  - from: event_record_deleted
    to: story_corrections
    label: traced by
  - from: story_corrections
    to: outcome_protected_editing
    label: supports
  - from: story_corrections
    to: xd_record_actions
    label: needs design

## Priority
P1. Corrections should follow initial record creation so users can maintain accurate monthly records.

## Dependencies
- `story-authenticated-household-access`
- `story-ledger-entry-creation`

## Open Questions
- Should deleted records be hard-deleted, archived, or voided?

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate edit/delete permission boundaries.
- must_check:
  - Unauthorized users cannot mutate records directly or indirectly.
  - Deleted records do not affect reports or reimbursements.
- acceptance_signals:
  - Mistaken entries can be fixed while preserving ownership rules.
- unresolved_blockers:
  - None for experience design.
- next_step:
  - experience-design
