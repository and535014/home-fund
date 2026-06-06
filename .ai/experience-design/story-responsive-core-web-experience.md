---
id: exp-responsive-core-web-experience
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-responsive-core-web-experience
  - web-foundation
outputs:
  - user_journey
  - task_flow
  - screen_states
  - interaction_expectations
trace_links:
  stories:
    - .ai/stories/story-responsive-core-web-experience.md
  domain_events:
    - Monthly records viewed
    - Monthly report generated
    - Reimbursement expenses selected
  business_outcomes:
    - Desktop and mobile core workflows
  impact_analysis: []
reviewed_at:
---

# Experience Design for Responsive Core Web Experience

## Experience Summary

- primary_user: Household member using desktop or mobile.
- user_goal: Complete browse, create, report, and reimbursement workflows on any supported viewport.
- business_outcome: The app is usable for household finance work on desktop and phone.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/experience-design/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Desktop side navigation; mobile compact/bottom navigation.
- page_title_pattern: Stable title and action placement across breakpoints.
- layout_pattern: Desktop tables and split sections; mobile stacked summaries and labeled rows.
- shared_components: Responsive shell, record rows, grouped reimbursement rows, forms.
- design_tokens_used: All semantic tokens.
- toast_or_notification_pattern: Position adapts to viewport; inline errors still primary.
- reuse_or_extraction_needed: Responsive list/table abstraction and form layout pattern.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Open on mobile | Shows compact navigation and current month | RWD story |
| 2 | Browse records | Converts dense table into labeled list rows | Monthly records viewed |
| 3 | Create record | Form stacks fields in logical order | Ledger entry creation |
| 4 | Review report | Summaries first, details after | Monthly report generated |
| 5 | Settle reimbursement | Grouped selection remains usable | Reimbursement expenses selected |

## Task Flow

- entry_point: Any app route on desktop/mobile.
- primary_path: Navigate -> complete same domain workflow with responsive layout.
- alternate_paths: Rotate/rescale viewport; use keyboard; view-only permission on mobile.
- exit_or_completion: Workflow outcome matches desktop behavior.
- recovery_paths: No horizontal overflow; retry/error/validation states remain visible.

## Information Architecture

- route_or_screen_candidates: Applies to all primary routes.
- primary_content: Current workflow content.
- secondary_content: Filters, summaries, details, actions.
- navigation_context: Responsive app shell.
- content_priority: Mobile prioritizes month, totals/status, primary action, then details.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Responsive layout for route | Complete workflow | Same route data | Hidden actions |
| loading | Responsive skeletons | Wait | Same data | Layout jump |
| empty | Compact empty state | Act if allowed | Permissions | Action too low on mobile |
| error | Inline/page error | Retry | Error detail | Toast off-screen |
| validation | Field errors near inputs | Correct | Rules | Keyboard covers errors |
| permission | Read-only/denied state | Return | Role | Disabled controls unclear |
| success | Visible confirmation | Continue | Updated state | Lost context after mobile submit |

## Interaction Behavior

- forms_and_validation: Mobile order follows task priority; avoid multi-column dependencies.
- destructive_or_irreversible_actions: Confirmation dialogs fit mobile and keep primary/destructive buttons distinct.
- async_or_realtime_behavior: Loading states preserve dimensions to avoid jumps.
- notifications_or_confirmations: Toast safe-area placement; important messages inline.
- keyboard_and_focus_flow: Mobile and desktop keyboard/tab order matches visual order.

## Accessibility

- semantic_structure: Tables transformed to mobile lists without losing labels.
- labels_and_instructions: Icon-only mobile actions need accessible labels/tooltips where appropriate.
- error_announcements: Mobile validation announced and visible near fields.
- focus_management: Route changes and modals set focus correctly.
- contrast_or_motion_notes: No color-only status; reduced motion respected.
- theme_notes: Core workflows must remain legible and non-overlapping in both light and dark themes.
- keyboard_requirements: All workflows usable by keyboard at desktop viewport; mobile semantics support assistive tech.

## UI Copy Constraints

- domain_terms: Same as foundation.
- required_messages: Short labels for mobile rows: Paid by, Source, Status, Category, Month.
- prohibited_or_sensitive_language: Do not hide financial meaning behind icons only.
- localization_notes: Traditional Chinese labels may be longer; layouts must allow wrapping.

## Frontend / Backend Expectations

- data_needed_by_ui: Same as underlying stories; may need summary-first payloads for mobile performance.
- user_actions_crossing_boundary: Same commands as stories.
- expected_success_responses: Same domain result independent of viewport.
- expected_error_responses: Same errors rendered responsively.
- client_state_questions: Breakpoint-specific component state persistence.
- server_state_questions: None unique; performance of report/reimbursement payloads may matter.

## Tracking Draft

- learning_question:
  - event_or_signal: core_workflow_completed_by_viewport
  - trigger: Create/report/reimbursement completion
  - suggested_properties: workflow, viewport_class
  - privacy_notes: No financial amounts or notes.

## Visual Model

- type: task_flow
- title: Responsive Core Workflow Flow
- nodes:
  - id: route
    label: App route
    kind: entry
  - id: viewport
    label: Detect layout needs
    kind: decision
  - id: desktop
    label: Desktop dense layout
    kind: screen
  - id: mobile
    label: Mobile stacked layout
    kind: screen
  - id: complete
    label: Workflow completed
    kind: success
  - id: overflow
    label: Layout issue
    kind: error
- edges:
  - from: route
    to: viewport
    label: render
  - from: viewport
    to: desktop
    label: wide
  - from: viewport
    to: mobile
    label: narrow
  - from: desktop
    to: complete
    label: action succeeds
  - from: mobile
    to: complete
    label: action succeeds
  - from: mobile
    to: overflow
    label: validation failure
- states:
  - name: validation
    user_sees: Errors within visible mobile flow
    user_can_do: Correct without horizontal scroll
    recovery: Keep data and focus first error

## Open Questions and Risks

- product: Minimum supported mobile width.
- UX: Which workflows need mobile optimization first under time pressure?
- accessibility: Financial lists must retain table meaning.
- content: Traditional Chinese text length affects controls.
- tracking: Provider unknown.
- technical_contract: Payload shape for summary-first mobile rendering.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate mobile/desktop workflow parity.
- must_check:
  - Core create/report/reimbursement workflows are usable on mobile.
  - No horizontal overflow is required for primary tasks.
- acceptance_signals:
  - Architecture can plan responsive app shell and reusable view components.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
