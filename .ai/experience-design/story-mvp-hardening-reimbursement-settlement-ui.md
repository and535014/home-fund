---
id: exp-story-mvp-hardening-reimbursement-settlement-ui
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-reimbursement-settlement-ui
  - story-reimbursement-table-and-settlement
  - web-foundation
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
    - .ai/stories/story-mvp-hardening-reimbursement-settlement-ui.md
    - .ai/stories/story-reimbursement-table-and-settlement.md
  domain_events:
    - Monthly reimbursement table generated
    - Reimbursement expenses selected
    - Expenses reimbursed
  business_outcomes:
    - Users can mark selected expenses as reimbursed once and avoid double-counting them.
  impact_analysis:
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
reviewed_at: 2026-06-18
---

# Experience Design for Reimbursement Settlement UI

## Experience Summary

- primary_user: Finance manager reviewing the monthly reimbursement table.
- user_goal: Select exact refundable member-paid expenses and mark them reimbursed once.
- business_outcome: The monthly dashboard no longer counts settled expenses as refundable.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/experience-design/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Existing authenticated dashboard shell and month context.
- page_title_pattern: Existing `家庭資金總覽`; settlement happens in the existing `退款表` section.
- layout_pattern: Inline selectable reimbursement rows with a compact selected-total action area and confirmation dialog.
- shared_components: Existing `Button`, `Dialog`, `Alert`, checkbox/native inputs, and dashboard table/list patterns.
- design_tokens_used: Existing warning/refundable and success/reimbursed semantic treatment.
- toast_or_notification_pattern: Success can use toast/status, but dashboard state after redirect is authoritative.
- reuse_or_extraction_needed: Reimbursement selection can remain dashboard-local for MVP; extract if a dedicated reimbursement page repeats the same selection table.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Review outstanding reimbursements | Shows refundable expenses grouped by payer member with totals | Monthly reimbursement table generated |
| 2 | Choose expenses to settle | Selected rows and selected total are visible | Reimbursement expenses selected |
| 3 | Confirm settlement | Confirmation dialog summarizes selected count/total and warns this is a status change | Expenses reimbursed |
| 4 | Complete settlement | Persists reimbursement batch/items and updates ledger records to reimbursed | Expenses reimbursed |
| 5 | Verify result | Settled expenses disappear from refundable table and monthly pending total decreases | Avoid double-counting |

## Task Flow

- entry_point: Existing dashboard `退款表` section on `/?month=2026-06`.
- primary_path: Select one or more refundable expenses -> click `執行退款` -> confirm -> dashboard refreshes with updated reimbursement table.
- alternate_paths: No selection -> button disabled or inline guidance; permission denied -> inline alert; conflict already reimbursed -> error alert.
- exit_or_completion: User stays on selected month dashboard and sees updated pending reimbursement count/total.
- recovery_paths: If action fails, selected month remains visible and error copy explains the failure.

## Information Architecture

- baseline_artifact: not_needed
- ia_impact: local
- route_or_screen_delta: No new route for MVP; expand existing dashboard reimbursement section.
- navigation_delta: No navigation change.
- page_hierarchy_delta: `退款表` becomes an interactive settlement section.
- user_path_delta: Finance manager can complete settlement without leaving dashboard.
- permission_visibility_delta: `執行退款` is enabled/visible only for finance managers; server action remains authoritative.
- seo_or_metadata_delta: None.
- primary_content: Refundable expense rows, payer groups, row checkboxes, selected total, confirm dialog.
- secondary_content: Success/error status feedback.
- content_priority: Selected amount/count and payer grouping must stay visible enough to prevent accidental settlement.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Payer groups with refundable expenses and checkboxes | Select expenses | Refundable records with IDs and amounts | Dense UI can obscure exact selected items |
| loading | Confirm button pending/disabled | Wait | Server action and DB transaction | Duplicate submit risk |
| empty | No pending reimbursement copy | Nothing to settle | Empty reimbursement table | Must not show misleading action |
| error | Inline alert for failed settlement | Retry or change selection | Error reason from action redirect | Conflict copy must be clear |
| validation | No selection or stale selection message | Select at least one item | Selection state | Empty submit should not mutate |
| permission | Permission denied message | Return to dashboard | Current member role | UI hiding alone is insufficient |
| success | Settled items removed from refundable table; optional toast/status | Continue reviewing | Revalidated dashboard read model | User may want audit trail later |

## UX Acceptance Criteria Draft

- AC-UX1:
  - observable_condition: Finance manager can see individual refundable expenses grouped by payer and select at least one.
  - covered_states: normal
  - accessibility_expectation: Each checkbox has an accessible label including payer/date/amount or record context.
  - responsive_expectation: On mobile, selection and selected total remain reachable without horizontal overflow.
  - toast_or_notification_expectation: None required before submit.
  - tracking_expectation: None for MVP.
- AC-UX2:
  - observable_condition: Selected total and count update before confirmation.
  - covered_states: normal, validation
  - accessibility_expectation: Selected total is visible text and not color-only.
  - responsive_expectation: Compact sticky or nearby action area is acceptable.
  - toast_or_notification_expectation: None.
  - tracking_expectation: None.
- AC-UX3:
  - observable_condition: Confirming reimbursement requires a confirmation dialog before persistence.
  - covered_states: loading, success
  - accessibility_expectation: Dialog has title and confirm/cancel buttons.
  - responsive_expectation: Dialog fits mobile viewport.
  - toast_or_notification_expectation: Success toast/status optional; updated table is required proof.
  - tracking_expectation: None.
- AC-UX4:
  - observable_condition: Non-finance member cannot settle through UI or direct action.
  - covered_states: permission, error
  - accessibility_expectation: Permission denial uses `role=alert`.
  - responsive_expectation: Desktop E2E sufficient for MVP.
  - toast_or_notification_expectation: Inline alert required.
  - tracking_expectation: None.

## E2E Scenario Draft

- scenario: Finance manager settles selected reimbursement expenses
  - route: `/?month=2026-06`
  - viewport: Desktop Chromium
  - given: DB seed with refundable Mei/Kai expenses and controlled auth finance manager
  - when: Select one refundable expense, confirm settlement
  - then: Selected expense is no longer shown as refundable and pending total/count decreases
  - states_covered: normal, loading, success
  - selectors_or_accessible_names: `退款表`, payer name, checkbox label, `執行退款`, confirmation dialog
  - mock_or_fixture_needs: DB-backed E2E and controlled auth `user-e2e-linked`
  - toast_expectations: Updated table is required proof
  - tracking_expectations: None
- scenario: General member cannot settle reimbursements by direct action
  - route: `/?month=2026-06`
  - viewport: Desktop Chromium
  - given: controlled auth general member
  - when: Attempt direct settlement form submission
  - then: Permission alert appears and reimbursement table remains unchanged
  - states_covered: permission, error
  - selectors_or_accessible_names: `role=alert`, `退款表`
  - mock_or_fixture_needs: `user-e2e-general`
  - toast_expectations: Inline alert required
  - tracking_expectations: None
- scenario: Already reimbursed or non-refundable expense is rejected
  - route: `/?month=2026-06`
  - viewport: Desktop Chromium
  - given: controlled auth finance manager and stale/invalid expense id
  - when: Submit settlement for an invalid or non-refundable expense id
  - then: Error feedback is visible and no extra reimbursement item is created
  - states_covered: error, validation
  - selectors_or_accessible_names: error alert
  - mock_or_fixture_needs: DB-backed E2E or action-level integration test
  - toast_expectations: Inline alert required
  - tracking_expectations: None

## Interaction Behavior

- forms_and_validation: Settlement form requires at least one selected refundable expense.
- destructive_or_irreversible_actions: Status change requires confirmation dialog.
- async_or_realtime_behavior: Server action writes reimbursement batch/items and updates selected ledger records, then revalidates dashboard.
- notifications_or_confirmations: Confirmation dialog required; inline alert for errors.
- keyboard_and_focus_flow: Checkboxes, action button, and confirmation dialog must be keyboard operable.

## Accessibility

- semantic_structure: `退款表` remains a region; selection controls have meaningful labels.
- labels_and_instructions: Selected total/count uses visible text.
- error_announcements: Permission/conflict errors use `role=alert`.
- focus_management: Dialog receives focus; cancel/confirm are reachable.
- contrast_or_motion_notes: Selection and reimbursed status cannot rely only on color.
- keyboard_requirements: Space toggles checkboxes; Enter/Space activates settlement button.

## UI Copy Constraints

- domain_terms: 退款, 待退款, 已退款, 執行退款, 已選取, 筆支出.
- required_messages: Permission denied, empty selection, already reimbursed, not refundable.
- prohibited_or_sensitive_language: Avoid exposing enum names such as `already_reimbursed`.
- localization_notes: Traditional Chinese copy only.

## Frontend / Backend Expectations

- data_needed_by_ui: Reimbursement group expense IDs, amount, date, category name, payer display name, current member action hints.
- user_actions_crossing_boundary: New reimbursement settlement server action.
- expected_success_responses: Redirect/revalidate selected month dashboard with settled expenses removed from refundable table.
- expected_error_responses: Same month dashboard with settlement error result and unchanged reimbursement table.
- client_state_questions: Selection can reset after success/error redirect for MVP.
- server_state_questions: Server action must validate finance-manager permission and reject non-refundable/already-reimbursed/stale IDs.

## Tracking Draft

- learning_question:
  - event_or_signal: reimbursement_settled
  - trigger: Successful settlement action
  - suggested_properties: selected_count, total_bucket, role
  - privacy_notes: Do not record member names, exact amounts, notes, or expense IDs.

## Visual Model

- type: task_flow
- title: Reimbursement Settlement UI Flow
- nodes:
  - id: reimbursement_table
    label: Refundable expense groups
    kind: screen
  - id: select_expenses
    label: Select expenses
    kind: action
  - id: selected_total
    label: Selected count and total
    kind: system_response
  - id: confirm_dialog
    label: Confirm reimbursement
    kind: decision
  - id: settlement_action
    label: Server action settles expenses
    kind: system_response
  - id: updated_dashboard
    label: Dashboard removes settled refundable items
    kind: success
  - id: settlement_error
    label: Permission or conflict alert
    kind: error
- edges:
  - from: reimbursement_table
    to: select_expenses
    label: choose items
  - from: select_expenses
    to: selected_total
    label: updates
  - from: selected_total
    to: confirm_dialog
    label: execute
  - from: confirm_dialog
    to: settlement_action
    label: confirm
  - from: settlement_action
    to: updated_dashboard
    label: success
  - from: settlement_action
    to: settlement_error
    label: failure

## Open Questions and Risks

- product: MVP will create batch records but may not expose batch history yet.
- UX: Dedicated reimbursement page can come later if inline dashboard selection becomes too dense.
- accessibility: Mobile selection density needs E2E smoke after implementation.
- content: Exact error copy can reuse domain reason mapping.
- tracking: Analytics provider unknown; no instrumentation required.
- technical_contract: Persistence wrapper must update `LedgerRecord` and create `ReimbursementBatch` atomically.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm inline dashboard settlement is acceptable for MVP.
  - Confirm confirmation dialog is required before status change.
- must_check:
  - Finance-manager only settlement.
  - Selected total/count visible before confirmation.
  - Settled expenses disappear from refundable totals.
- acceptance_signals:
  - Architecture can specify server action and transaction boundary.
- unresolved_blockers:
  - None for local_dev MVP design.
- next_step:
  - architecture-planner
