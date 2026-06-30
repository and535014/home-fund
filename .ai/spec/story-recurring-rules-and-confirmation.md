---
id: story-recurring-rules-and-confirmation
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
    - Recurring event created
    - Recurring event deleted
    - Immediate recurring item posted
    - Recurring reminder created
    - Recurring reminder confirmed
  business_outcomes:
    - Users can identify which reminder-based recurring income or expense items are still pending for a month.
    - A household can complete one monthly cycle of recurring items without spreadsheet recalculation.
  bounded_contexts:
    - Recurring Schedule
    - Fund Ledger
    - Reporting
  impact_analysis: []
  affected_code_areas:
    - empty_repo:no_existing_code_impact_found
reviewed_at:
---

# Recurring Rules And Confirmation

## Delivery Profile
This story targets `local_dev` under the `mvp` release gate.

## User Story
As an authorized household manager, I want to define monthly recurring income and expenses as immediate or reminder-based, so that fixed items are posted or confirmed according to how the household actually receives or pays money.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Recurring event created | Captures expected monthly activity. |
| Event | Immediate recurring item posted | Books auto-posted items into the ledger. |
| Event | Recurring reminder created | Shows expected but unconfirmed items. |
| Event | Recurring reminder confirmed | Turns pending items into actual records. |
| Policy | Reminder-based items do not affect totals until confirmed | Protects ledger accuracy. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Existing code | Repository inspection | Empty repo; recurring schedule and posting mechanism must be designed. |
| Domain risk | DDD open questions | Duplicate or missed monthly occurrence prevention is unresolved. |

## Draft Acceptance Criteria
- Authorized users can create recurring income and expense rules with amount, category, monthly schedule, and posting mode.
- Authorized users can delete recurring events; changing a recurring event requires deleting it and creating a replacement.
- Immediate posting creates a ledger record for the relevant month.
- Reminder-based posting creates a pending recurring item for the relevant month.
- Pending recurring items do not affect ledger totals.
- Authorized users can confirm a pending recurring item into an income or expense record.
- Confirmed recurring records preserve trace to the originating recurring event.
- Duplicate records for the same recurring event and month are prevented.

## Experience Design Need
- experience_design_required: true
- reason: Users need event setup, posting mode selection, pending reminders, and confirmation flows.
- user_facing_surfaces: Recurring event management, posting mode control, pending reminders, confirmation action, monthly report indicators.
- UX_risks: Immediate versus reminder-based posting must be very clear to avoid wrong totals.

## Visual Model

- type: story_trace
- title: Recurring Rules Trace
- nodes:
  - id: event_rule_created
    label: Recurring event created
    kind: domain_event
  - id: event_immediate_posted
    label: Immediate recurring item posted
    kind: domain_event
  - id: event_reminder_created
    label: Recurring reminder created
    kind: domain_event
  - id: story_recurring
    label: Recurring Rules And Confirmation
    kind: story
  - id: outcome_pending_visibility
    label: Pending recurring items visible
    kind: business_outcome
  - id: xd_recurring
    label: Event setup and reminder confirmation
    kind: experience_design
- edges:
  - from: event_rule_created
    to: story_recurring
    label: traced by
  - from: event_immediate_posted
    to: story_recurring
    label: traced by
  - from: event_reminder_created
    to: story_recurring
    label: traced by
  - from: story_recurring
    to: outcome_pending_visibility
    label: supports
  - from: story_recurring
    to: xd_recurring
    label: needs design

## Priority
P1. Recurring items are core to monthly household settlement but depend on categories and ledger creation.

## Dependencies
- `story-authenticated-household-access`
- `story-category-management`
- `story-ledger-entry-creation`
- Domain decision: who can manage recurring events.

## Open Questions
- Who can manage recurring events: admin, finance manager, or both?
- Should reminders be in-app only for MVP?
- How should the app handle skipped months or changed recurring amounts?

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate immediate posting versus reminder confirmation behavior.
- must_check:
  - Reminder-based items do not affect totals until confirmed.
  - Duplicate monthly occurrences are prevented.
- acceptance_signals:
  - Internet fee can auto-post while living expense contribution remains pending until confirmed.
- unresolved_blockers:
  - None for experience design.
- next_step:
  - experience-design
