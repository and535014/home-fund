---
id: exp-admin-member-management
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-admin-member-management
  - web-foundation
outputs:
  - user_journey
  - task_flow
  - screen_states
  - interaction_expectations
trace_links:
  stories:
    - .ai/spec/story-admin-member-management.md
  domain_events:
    - Member invited
    - Member account updated
    - Member permissions changed
  business_outcomes:
    - Controlled household membership
  impact_analysis: []
reviewed_at:
---

# Experience Design for Admin Member Management

## Experience Summary

- primary_user: Admin.
- user_goal: Add members and manage display names and permissions.
- business_outcome: Household membership and financial permissions stay controlled.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/prototype/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Settings route inside authenticated shell.
- page_title_pattern: Page title plus Add member primary action.
- layout_pattern: Member list with detail/edit panel or modal.
- shared_components: Table/list rows, form fields, role toggles, confirmation dialog.
- design_tokens_used: primary, warning, danger, success.
- toast_or_notification_pattern: Success toast after save; inline errors for validation.
- reuse_or_extraction_needed: Member row and permission control pattern.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Open members settings | Shows members and roles | Member account updated |
| 2 | Add member | Opens invite/create form | Member invited |
| 3 | Edit display name | Saves updated label | Member account updated |
| 4 | Change permissions | Confirms and updates role capabilities | Member permissions changed |
| 5 | Non-admin tries route | Shows permission denied | Admin-only policy |

## Task Flow

- entry_point: Settings -> Members.
- primary_path: View members -> add/edit -> validate -> save -> updated list.
- alternate_paths: Cancel edit, retry failed save, permission denied for non-admin.
- exit_or_completion: Member list reflects changes and role badges.
- recovery_paths: Inline validation; restore previous values on failed save.

## Information Architecture

- route_or_screen_candidates: `/settings/members`.
- primary_content: Member list, role badges, edit actions.
- secondary_content: Invite/create form, account details, permission controls.
- navigation_context: Secondary settings route.
- content_priority: Member identity, role, actions.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Member list and permissions | Add/edit members | Members, roles | Overpowering role controls |
| loading | Skeleton rows | Wait | Member list | Misleading empty list |
| empty | No members except current admin | Add member | Current admin | Last admin risk |
| error | Load/save failure | Retry | Error detail | Partial save confusion |
| validation | Field/role errors | Correct input | Validation rules | Duplicate display names |
| permission | Non-admin denied | Return | Current role | Hidden admin route still accessible |
| success | Updated member row | Continue | Saved member | Toast not enough for role changes |

## Interaction Behavior

- forms_and_validation: Display name required; role controls clearly labeled.
- destructive_or_irreversible_actions: Permission changes need confirmation when removing admin/finance rights.
- async_or_realtime_behavior: Saved permissions affect future authorization.
- notifications_or_confirmations: Confirm high-impact role changes; toast after save.
- keyboard_and_focus_flow: Modal traps focus; after save focus returns to edited row.

## Accessibility

- semantic_structure: Member list as table on desktop, list with headings on mobile.
- labels_and_instructions: Role toggles include role meaning.
- error_announcements: Validation and save errors announced.
- focus_management: Add/edit modal focus handled.
- contrast_or_motion_notes: Role badges have text labels.
- keyboard_requirements: Toggle and save/cancel fully keyboard usable.

## UI Copy Constraints

- domain_terms: admin, finance manager, general member, display name, permissions.
- required_messages: "Finance manager delete access is disabled for MVP unless explicitly expanded later."
- prohibited_or_sensitive_language: Avoid vague "super user"; use domain roles.
- localization_notes: Permission descriptions need concise Chinese labels later.

## Frontend / Backend Expectations

- data_needed_by_ui: Members, display names, roles, configurable finance-manager capabilities.
- user_actions_crossing_boundary: Create/invite member, update display name, update permissions.
- expected_success_responses: Updated member record and permission set.
- expected_error_responses: Permission denied, validation error, conflict, last-admin prevention if used.
- client_state_questions: Whether unsaved permission changes can be staged.
- server_state_questions: Role/capability model and invitation mechanism.

## Tracking Draft

- learning_question:
  - event_or_signal: member_permission_changed
  - trigger: Admin saves role/capability changes
  - suggested_properties: changed_role, capability_count
  - privacy_notes: Do not include names.

## Visual Model

- type: task_flow
- title: Admin Member Management Flow
- nodes:
  - id: members
    label: Members settings
    kind: screen
  - id: edit
    label: Edit member
    kind: action
  - id: confirm
    label: Confirm permission change
    kind: decision
  - id: saved
    label: Member updated
    kind: success
  - id: denied
    label: Permission denied
    kind: error
- edges:
  - from: members
    to: edit
    label: admin edits
  - from: edit
    to: confirm
    label: role change
  - from: confirm
    to: saved
    label: confirmed
  - from: members
    to: denied
    label: non-admin
- states:
  - name: validation
    user_sees: Inline field errors
    user_can_do: Correct and save
    recovery: Keep form values

## Open Questions and Risks

- product: Invitation mode is unresolved.
- UX: How detailed should finance-manager capability controls be in MVP?
- accessibility: Dense role controls need clear labels.
- content: Final localized role descriptions needed.
- tracking: Unknown provider.
- technical_contract: Account creation/invitation contract undecided.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate admin-only member and permission management.
- must_check:
  - Finance-manager delete access is disabled by default.
  - Permission changes are confirmed and reflected.
- acceptance_signals:
  - Architecture can plan member, role, and capability contracts.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
