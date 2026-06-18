---
id: exp-story-mvp-hardening-permission-matrix-browser-checks
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-permission-matrix-browser-checks
  - web-foundation
  - ia-home-family-fund-mvp-hardening
outputs:
  - user_journey
  - task_flow
  - ia_delta
  - screen_states
  - ux_acceptance_criteria_draft
  - e2e_scenario_draft
  - interaction_expectations
trace_links:
  stories:
    - .ai/spec/story-mvp-hardening-permission-matrix-browser-checks.md
  domain_events:
    - Member permissions changed
    - Income recorded
    - Expense recorded
  business_outcomes:
    - Members can browse shared records while being prevented from editing or creating records outside their permissions.
  impact_analysis:
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
reviewed_at: 2026-06-16
---

# Experience Design for Permission Matrix Browser Checks

## Experience Summary

- primary_user: Linked active household members with finance-manager or general-member roles.
- user_goal: Use the shared dashboard while the app clearly blocks record creation outside the member's authority.
- business_outcome: Command-level authorization is proven through browser-visible behavior, not only hidden controls or unit tests.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/prototype/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Existing authenticated dashboard shell remains the entry point.
- page_title_pattern: Existing `家庭資金總覽` title and create dialog titles stay unchanged.
- layout_pattern: Existing create income/expense dialog; no new route or page.
- shared_components: Existing `Dialog`, `Alert`, `Button`, `Input`, `Field`, and native select controls in `RecordEntryPanel`.
- design_tokens_used: Existing semantic dark-theme tokens and form control styling.
- toast_or_notification_pattern: Permission denial must be inline in the dialog; toast is optional and not the only explanation.
- reuse_or_extraction_needed: No new shared UI abstraction for MVP. Extract permission-state messaging later if correction, recurring, or reimbursement actions reuse it.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | General member browses household dashboard | Dashboard records and reimbursement read models remain visible | Members can browse shared records |
| 2 | General member opens create income or expense | Dialog opens with self-scoped member controls where possible | General members act only on self-owned records |
| 3 | General member attempts direct cross-member submission | Server action rejects and redirects back to the same create intent with permission feedback | Authorization is command-level |
| 4 | Finance manager creates for another member | Server action accepts, persists, and dashboard reflects the created record | Finance managers can create for others |
| 5 | User sees permission feedback | Inline alert explains that the current account cannot create that record | Permission-denied UX |

## Task Flow

- entry_point: Existing dashboard create links or deep links `/?month=2026-06&create=income|expense`.
- primary_path: Sign in as seeded role -> open create dialog -> submit allowed or disallowed target member -> see created row or inline permission error.
- alternate_paths: Direct form submission can be used in E2E to prove server action enforcement when UI hides other members.
- exit_or_completion: Allowed submission returns to selected month dashboard; denied submission stays in the same create dialog.
- recovery_paths: Permission denial shows localized inline alert and lets the user submit an allowed self-owned record instead.

## Information Architecture

- baseline_artifact: not_needed
- ia_impact: none
- route_or_screen_delta: No new route; existing dashboard query dialog state is used.
- navigation_delta: No navigation change.
- page_hierarchy_delta: No hierarchy change.
- user_path_delta: Existing create dialog gains browser-level permission proof.
- permission_visibility_delta: General-member UI should not expose controls for creating on behalf of other members, but server action remains authoritative.
- seo_or_metadata_delta: None.
- primary_content: Create dialog, visible created rows, inline permission alert.
- secondary_content: Existing dashboard records and reimbursement read model.
- content_priority: Permission feedback must explain the action is not allowed without exposing internal role names as implementation details.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Dashboard and create dialog | Submit an allowed self-owned record | Linked active member, categories, profile | Role fixtures must be deterministic |
| loading | Browser waits for server-action redirect | Avoid repeated submit | Server action and DB write | Duplicate submit remains accepted MVP risk |
| empty | No matching category disables submit | Cannot save | Category list | Not central to this story |
| error | Inline alert in create dialog | Correct target and resubmit | Error reason `permission_denied` | Copy must be clear but not over-specific |
| validation | Existing parser/domain validation messages | Fix missing/invalid data | Form parser and domain command | Permission test must avoid accidental validation failure |
| permission | Same create intent remains visible with `permission_denied` | Return to allowed self target | Authorization module and current member | UI hiding alone would miss direct submission risk |
| success | Created row appears on selected month dashboard | Continue reviewing dashboard | DB write and dashboard read model | Created row is stronger proof than toast |

## UX Acceptance Criteria Draft

- AC-UX1:
  - observable_condition: A general member can browse the DB-backed dashboard.
  - covered_states: normal
  - accessibility_expectation: Dashboard heading and content remain reachable by role/name selectors.
  - responsive_expectation: Existing mobile smoke remains sufficient for this permission slice.
  - toast_or_notification_expectation: None.
  - tracking_expectation: None.
- AC-UX2:
  - observable_condition: A general member cannot create income or member-paid expense for another member through a direct browser submission.
  - covered_states: permission, error
  - accessibility_expectation: Inline permission message uses `role=alert`.
  - responsive_expectation: Desktop Chromium is sufficient for MVP.
  - toast_or_notification_expectation: Inline alert is required; toast optional.
  - tracking_expectation: None.
- AC-UX3:
  - observable_condition: A finance manager can create for another member and sees the created row on the dashboard.
  - covered_states: normal, loading, success
  - accessibility_expectation: Dialog title and form fields remain keyboard/role accessible.
  - responsive_expectation: Desktop Chromium is sufficient for MVP.
  - toast_or_notification_expectation: Created row is required proof; success toast optional.
  - tracking_expectation: None.
- AC-UX4:
  - observable_condition: Reimbursement permission checks are not asserted until a reimbursement mutation UI/action exists.
  - covered_states: n/a
  - accessibility_expectation: n/a
  - responsive_expectation: n/a
  - toast_or_notification_expectation: n/a
  - tracking_expectation: n/a

## E2E Scenario Draft

- scenario: General member can browse but cannot create income for another member
  - route: `/?month=2026-06&create=income`
  - viewport: Desktop Chromium
  - given: `home_fund_e2e` seeded with a linked active general member and another active member
  - when: Submit income with `sourceMemberId` set to the other member through browser-controlled form submission
  - then: Dialog remains `新增收入`, alert says permission denied, and no unique record appears
  - states_covered: permission, error
  - selectors_or_accessible_names: `家庭資金總覽`, `新增收入`, `role=alert`
  - mock_or_fixture_needs: controlled auth user for a general member
  - toast_expectations: Inline alert required
  - tracking_expectations: None
- scenario: General member can browse but cannot create member-paid expense for another member
  - route: `/?month=2026-06&create=expense`
  - viewport: Desktop Chromium
  - given: linked active general member
  - when: Submit member-paid expense with `payerMemberId` set to another member
  - then: Permission alert appears and no unique expense or reimbursement row appears
  - states_covered: permission, error
  - selectors_or_accessible_names: `新增支出`, `role=alert`, unique record name
  - mock_or_fixture_needs: controlled auth user for a general member
  - toast_expectations: Inline alert required
  - tracking_expectations: None
- scenario: Finance manager can create for another member
  - route: `/?month=2026-06&create=income`
  - viewport: Desktop Chromium
  - given: controlled auth user `user-e2e-linked`
  - when: Submit income for another active member
  - then: Dashboard shows the unique created record
  - states_covered: success
  - selectors_or_accessible_names: `新增收入`, unique record name
  - mock_or_fixture_needs: existing controlled auth finance manager
  - toast_expectations: Created row is required proof
  - tracking_expectations: None

## Interaction Behavior

- forms_and_validation: Permission scenarios should pass shape validation and fail only at domain authorization.
- destructive_or_irreversible_actions: None in this slice.
- async_or_realtime_behavior: Server action redirects to selected month and create intent with `result=permission_denied`.
- notifications_or_confirmations: Inline alert is required for denied actions.
- keyboard_and_focus_flow: Existing dialog form remains keyboard operable; direct-submission E2E may bypass UI-hidden member controls only to prove server action enforcement.

## Accessibility

- semantic_structure: Existing dashboard and dialog headings remain semantic.
- labels_and_instructions: Permission alert copy must be visible in Traditional Chinese.
- error_announcements: Permission-denied alert uses `role=alert`.
- focus_management: No new focus behavior required for MVP.
- contrast_or_motion_notes: Existing destructive/error alert styling must preserve contrast.
- keyboard_requirements: Direct browser form path is supplemental; normal allowed create path remains keyboard operable.

## UI Copy Constraints

- domain_terms: member, permission, record, income, expense, reimbursement.
- required_messages: Reuse `目前帳號沒有新增這筆紀錄的權限。` for create permission denial.
- prohibited_or_sensitive_language: Do not expose internal enum names like `cannot_create_record_for_other_member`.
- localization_notes: Traditional Chinese copy only.

## Frontend / Backend Expectations

- data_needed_by_ui: Current member role/capability, active members, active categories, selected month.
- user_actions_crossing_boundary: `createLedgerRecordAction`.
- expected_success_responses: Redirect to `/?month=<month>&create=success` and dashboard row visible.
- expected_error_responses: Redirect to `/?month=<month>&create=<intent>&result=permission_denied`.
- client_state_questions: General-member UI may hide or self-scope member controls; E2E direct submission is acceptable to prove server enforcement.
- server_state_questions: Seed needs a controlled auth user linked to an active general member.

## Tracking Draft

- learning_question:
  - event_or_signal: permission_denied
  - trigger: Server action rejects cross-member create attempt
  - suggested_properties: action_type, actor_role, target_scope
  - privacy_notes: Do not record member names, amount, or notes.

## Visual Model

- type: task_flow
- title: Permission Matrix Browser Check Flow
- nodes:
  - id: dashboard
    label: Dashboard
    kind: entry
  - id: create_dialog
    label: Create dialog
    kind: screen
  - id: choose_target
    label: Target member from form submission
    kind: decision
  - id: server_action
    label: createLedgerRecordAction
    kind: system_response
  - id: authorized
    label: Record created and dashboard updates
    kind: success
  - id: denied
    label: Permission alert, no record created
    kind: error
- edges:
  - from: dashboard
    to: create_dialog
    label: open create
  - from: create_dialog
    to: choose_target
    label: submit
  - from: choose_target
    to: server_action
    label: validate permission
  - from: server_action
    to: authorized
    label: allowed
  - from: server_action
    to: denied
    label: denied

## Open Questions and Risks

- product: Reimbursement permission browser checks require a reimbursement mutation UI/action and remain deferred.
- UX: General-member self-scope controls may need later copy if users ask why other members are unavailable.
- accessibility: Permission alert is covered; focus restoration after redirect is accepted MVP risk.
- content: Current generic permission message is acceptable for MVP.
- tracking: No analytics provider configured.
- technical_contract: Seed must add a controlled active general-member user before implementation.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm reimbursement permission checks are intentionally deferred until mutation UI/action exists.
  - Confirm direct browser form submission is acceptable for proving server enforcement when UI hides controls.
- must_check:
  - Denied submissions do not create ledger records.
  - Allowed finance-manager submission still creates for another member.
  - Permission feedback is visible and localized.
- acceptance_signals:
  - Architecture can define seed/auth contracts and E2E scope without UI redesign.
- unresolved_blockers:
  - Reimbursement action permission checks blocked by missing mutation surface.
- next_step:
  - architecture-planner
