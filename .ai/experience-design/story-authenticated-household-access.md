---
id: exp-authenticated-household-access
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-authenticated-household-access
  - web-foundation
outputs:
  - user_journey
  - task_flow
  - screen_states
  - interaction_expectations
trace_links:
  stories:
    - .ai/stories/story-authenticated-household-access.md
  domain_events:
    - Member permissions changed
  business_outcomes:
    - Protected shared records
  impact_analysis: []
reviewed_at:
---

# Experience Design for Authenticated Household Access

## Experience Summary

- primary_user: Household member.
- user_goal: Sign in with Google and use only role-allowed functions.
- business_outcome: Shared records are visible but protected from unauthorized changes.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/experience-design/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Google sign-in outside shell; authenticated pages inside shared app shell.
- page_title_pattern: Functional pages show role-aware actions.
- layout_pattern: Compact operational layout.
- shared_components: Login form, page shell, navigation, permission denied state, toast.
- design_tokens_used: primary, danger, warning, info, surface, text, border.
- toast_or_notification_pattern: Permission changes and denied actions use inline/page message plus optional toast.
- reuse_or_extraction_needed: Auth guard, role-aware action visibility, access-denied pattern.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Open app | Shows Google sign-in if unauthenticated | All functional pages require login |
| 2 | Sign in with Google | Maps Google identity to app member and loads app shell | Authenticated access story |
| 3 | Browse records | Allows read access for all members | Every member can browse records |
| 4 | Try restricted action | Blocks or hides action based on permission | Member permissions changed |
| 5 | Permission changes later | Next action reflects updated permission | New permissions apply immediately |

## Task Flow

- entry_point: App URL.
- primary_path: Google sign-in -> app member lookup/linking -> app shell -> route selection -> allowed action.
- alternate_paths: Already authenticated user enters directly into requested route.
- exit_or_completion: User reaches an allowed page or sees access-denied state.
- recovery_paths: Retry login; return to dashboard; contact admin if role seems wrong.

## Information Architecture

- route_or_screen_candidates: `/login`, `/`, `/reports`, `/records`, `/reimbursements`, `/settings`.
- primary_content: Google sign-in action; authenticated navigation; role-aware action controls.
- secondary_content: Current member identity and role.
- navigation_context: Authenticated shell after login.
- content_priority: Clear access state before financial content.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | App shell with allowed routes/actions | Browse and act by role | Current member, permissions | Role language unclear |
| loading | Stable loading shell | Wait | Session lookup | Blank app feel |
| empty | No household records yet | Use allowed create actions | Role and empty data | Empty state may show unauthorized action |
| error | Sign-in or session error | Retry | Auth error | Security details leaked |
| validation | Missing or unlinked Google account state | Retry or contact admin | Account linking rules | User cannot tell whether Google login or membership failed |
| permission | Access denied explanation | Return or request admin change | Required role | Frustration if action disappears |
| success | Signed in / action allowed | Continue | Session established | None |

## Interaction Behavior

- forms_and_validation: Login screen offers Google sign-in; app validates that the Google account maps to a household member.
- destructive_or_irreversible_actions: None in this story.
- async_or_realtime_behavior: Permission refresh can occur on navigation or action attempt.
- notifications_or_confirmations: Use info message for permission denied; avoid only using toast.
- keyboard_and_focus_flow: Focus first invalid field; after denied action, focus message or safe return target.

## Accessibility

- semantic_structure: Sign-in page uses heading, Google sign-in button, and account-linking status message.
- labels_and_instructions: Buttons identify sign-in and route actions.
- error_announcements: Auth and permission errors announced.
- focus_management: Move focus into access-denied message on blocked route.
- contrast_or_motion_notes: Role/status badges cannot rely on color only.
- keyboard_requirements: All navigation and actions keyboard reachable.

## UI Copy Constraints

- domain_terms: member, Google account, admin, finance manager, general member, permission.
- required_messages: "You do not have permission to perform this action." Use localized copy later.
- prohibited_or_sensitive_language: Do not expose internal policy IDs.
- localization_notes: Chinese UI likely; final language decision pending.

## Frontend / Backend Expectations

- data_needed_by_ui: Current session, Google account identity, app member profile, permissions, allowed navigation/actions.
- user_actions_crossing_boundary: Google sign-in, logout, member lookup/linking, permission-checked command attempts.
- expected_success_responses: Current member and permissions.
- expected_error_responses: Google sign-in failed, Google account not linked to a member, expired session, permission denied.
- client_state_questions: Cache permissions or fetch per route?
- server_state_questions: Where is authoritative permission evaluation performed?

## Tracking Draft

- learning_question:
  - event_or_signal: permission_denied_seen
  - trigger: User attempts blocked action
  - suggested_properties: role, action, route
  - privacy_notes: Do not include financial record details.

## Visual Model

- type: task_flow
- title: Authenticated Access Flow
- nodes:
  - id: entry
    label: Open app
    kind: entry
  - id: login
    label: Login screen
    kind: screen
  - id: shell
    label: Authenticated app shell
    kind: screen
  - id: allowed
    label: Allowed action
    kind: success
  - id: denied
    label: Permission denied
    kind: error
- edges:
  - from: entry
    to: login
    label: unauthenticated
  - from: login
    to: shell
    label: signed in
  - from: shell
    to: allowed
    label: has permission
  - from: shell
    to: denied
    label: lacks permission
- states:
  - name: permission
    user_sees: Explanation and safe navigation
    user_can_do: Return or ask admin
    recovery: Navigate to allowed page

## Open Questions and Risks

- product: Can one member hold admin and finance manager roles?
- UX: Should unavailable actions be hidden, disabled, or shown with explanation?
- accessibility: Permission denied route needs focus handling.
- content: Final UI language unknown.
- tracking: Analytics provider unknown.
- technical_contract: Google OAuth/session integration and member-linking contract undecided.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate role-aware access behavior.
- must_check:
  - All functional routes require Google sign-in and app member authorization.
  - UI and backend expectations both include authorization.
- acceptance_signals:
  - Architecture can define Google OAuth, app session, member linking, and authorization boundaries.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
