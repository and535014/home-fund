---
id: story-admin-member-management
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
    - Member invited
    - Member account updated
    - Member permissions changed
  business_outcomes:
    - Admins can manage household membership, member display names, and member permissions.
  bounded_contexts:
    - Identity and Access
  impact_analysis: []
  affected_code_areas:
    - empty_repo:no_existing_code_impact_found
reviewed_at:
---

# Admin Member Management

## Delivery Profile
This story targets `local_dev` under the `mvp` release gate.

## User Story
As an admin, I want to invite household members and manage their account information and permissions, so that the household can control who can maintain financial records.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Member invited | Starts access for a household participant. |
| Event | Member account updated | Keeps display names recognizable in records and reports. |
| Event | Member permissions changed | Changes what financial actions a member can perform. |
| Aggregate | Household | Owns member membership and permission invariants. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Existing code | Repository inspection | Empty repo; member management must be introduced from scratch. |
| Domain risk | DDD open questions | Invitation mechanism is unresolved; MVP can start with manually created accounts if accepted. |

## Draft Acceptance Criteria
- Only admins can access member management actions.
- Admins can add or invite a member for the household.
- Admins can update a member display name or account label.
- Admins can assign or remove admin and finance manager permissions.
- Admins can adjust finance-manager permissions over time, with delete access to other members' records disabled by default for MVP.
- Non-admin members cannot invite members, update account information, or change permissions.
- Changes to permissions affect future authorization checks.

## Experience Design Need
- experience_design_required: true
- reason: Member list, invite flow, account edit flow, and permission controls are user-facing admin workflows.
- user_facing_surfaces: Member management page, member form, permission controls, confirmation states.
- UX_risks: Permission controls can be high impact; destructive or privilege-changing actions need clear feedback.

## Visual Model

- type: story_trace
- title: Member Management Trace
- nodes:
  - id: event_member_invited
    label: Member invited
    kind: domain_event
  - id: event_permissions_changed
    label: Member permissions changed
    kind: domain_event
  - id: story_members
    label: Admin Member Management
    kind: story
  - id: outcome_membership
    label: Controlled household membership
    kind: business_outcome
  - id: xd_members
    label: Member and permission management UI
    kind: experience_design
- edges:
  - from: event_member_invited
    to: story_members
    label: traced by
  - from: event_permissions_changed
    to: story_members
    label: traced by
  - from: story_members
    to: outcome_membership
    label: enables
  - from: story_members
    to: xd_members
    label: needs design

## Priority
P1. Needed early because role-based story validation requires members with different permissions.

## Dependencies
- `story-authenticated-household-access`
- Domain decision: invitation mode for MVP.

## Open Questions
- Should MVP use email invitation, invite link, or manual account creation?
- Should the app prevent removing the last admin?

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate admin-only account and permission management.
- must_check:
  - Non-admins cannot manage users.
  - Permission changes are reflected in authorization.
- acceptance_signals:
  - Test users for admin, finance manager, and general member can be prepared for later stories.
- unresolved_blockers:
  - None for experience design.
- next_step:
  - experience-design
