---
id: exp-story-mvp-hardening-browser-create-record-flow
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-browser-create-record-flow
  - exp-ledger-entry-creation
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
    - .ai/spec/story-mvp-hardening-browser-create-record-flow.md
    - .ai/spec/story-ledger-entry-creation.md
  domain_events:
    - Income recorded
    - Expense recorded
    - Member-paid expense became refundable
    - Monthly report generated
    - Monthly reimbursement table generated
  business_outcomes:
    - A household can complete one monthly cycle of contributions and expenses without spreadsheet recalculation.
  impact_analysis:
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
reviewed_at: 2026-06-16
---

# Experience Design for Browser Create-Record Flow

## Experience Summary

- primary_user: Linked active household member with create-record permission.
- user_goal: Add real income and expense records from the dashboard and immediately see the monthly report reflect the change.
- business_outcome: The app proves a full browser/database monthly ledger workflow, not only pure domain rules.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/prototype/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Existing authenticated dashboard shell with month switcher and desktop/mobile create actions.
- page_title_pattern: Existing dashboard title remains; create happens in the current modal dialog.
- layout_pattern: Existing `RecordEntryPanel` inside `DialogContent`, single-column form suitable for desktop and mobile.
- shared_components: Existing `Button`, `Input`, `Select`, `Field`, `Alert`, `Dialog`, and toast pattern.
- design_tokens_used: Existing semantic component styling; income/expense visibility comes from dashboard rows and summary metrics.
- toast_or_notification_pattern: Success uses existing `CreateRecordToast`; validation/permission errors use inline alert inside the dialog.
- reuse_or_extraction_needed: No new shared UI extraction for this hardening slice; reuse existing create dialog and form.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Add monthly income | Opens create income dialog for selected month | Income recorded |
| 2 | Fill income details | Shows name, amount, date, category, source member, notes | Fund Ledger / Categorization |
| 3 | Save income | Persists record, closes dialog via redirect, shows success toast | Income recorded / Monthly report generated |
| 4 | Add fund-paid expense | Opens create expense dialog and allows switching to fund-paid | Expense recorded |
| 5 | Save fund-paid expense | Persists expense and updates expense totals without adding reimbursement row | Expense recorded / Reimbursement |
| 6 | Add member-paid expense | Opens create expense dialog with member-paid selected by default | Member-paid expense became refundable |
| 7 | Save member-paid expense | Persists expense and updates both expense totals and reimbursement table | Monthly reimbursement table generated |
| 8 | Submit invalid data | Keeps user in create intent and shows inline error | Validation / recovery |

## Task Flow

- entry_point: Dashboard desktop buttons `新增收入` / `新增支出`; mobile buttons `收入` / `支出`.
- primary_path: Open dialog -> fill required fields -> select category/member/payment source -> submit -> redirect to selected month -> see success toast and updated dashboard.
- alternate_paths: Expense type switch between `成員代墊` and `基金支出`; finance manager can select another active member.
- exit_or_completion: User returns to dashboard for the same month with created row visible.
- recovery_paths: Invalid submit redirects back to the same create dialog with an inline alert; user can correct and resubmit.

## Information Architecture

- baseline_artifact: not_needed
- ia_impact: none
- route_or_screen_delta: No new route; existing `/?month=YYYY-MM&create=income|expense` dialog state is the screen surface.
- navigation_delta: No navigation changes.
- page_hierarchy_delta: No hierarchy changes.
- user_path_delta: Existing dashboard create actions become verified as a real browser/database workflow.
- permission_visibility_delta: Existing create actions remain hidden when `canCreateOwnRecords` is false.
- seo_or_metadata_delta: None.
- primary_content: Create dialog fields and updated dashboard rows/summary/reimbursement table.
- secondary_content: Success toast and inline error alerts.
- content_priority: Correct record type/payment source, amount/date/category/member, and visible dashboard update.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Create dialog with required fields and category/member selects | Fill and submit | Active categories, active members, current month, profile | Payment source confusion |
| loading | Browser waits during server action redirect | Avoid duplicate submit | Server action and DB write | Double-click duplicate record risk remains accepted for MVP |
| empty | Disabled submit if no matching active categories | Cannot save until category exists | Category list | Not central to this story |
| error | Inline alert for validation/permission/domain failure | Correct form and resubmit | Error reason from redirect query | Error copy may not preserve all entered field values |
| validation | Browser required fields and server parser errors | Fill missing/valid values | HTML required fields and server form parser | Native browser validation copy is browser-controlled |
| permission | Inline permission denial after server action | Return or choose allowed member | Current member authorization | Must not expose household data changes |
| success | Success toast and updated dashboard row/summary | Continue reviewing dashboard or create another record | Server action success, path revalidation | Toast is client-side and may be hard to assert if history is rewritten quickly |

## UX Acceptance Criteria Draft

- AC-UX1:
  - observable_condition: A linked active member can open the income dialog from the dashboard and submit a valid income.
  - covered_states: normal, loading, success
  - accessibility_expectation: Dialog has visible title `新增收入`; required fields have labels.
  - responsive_expectation: Existing desktop route is sufficient for this E2E; mobile smoke remains separate.
  - toast_or_notification_expectation: Success uses existing create-record success feedback.
  - tracking_expectation: No analytics provider; not required.
- AC-UX2:
  - observable_condition: A linked active member can create a fund-paid expense and the dashboard shows it as expense but not as a reimbursement row.
  - covered_states: normal, success
  - accessibility_expectation: Expense type control exposes `基金支出` as a selectable option.
  - responsive_expectation: No horizontal overflow regression is covered by existing smoke E2E.
  - toast_or_notification_expectation: Success feedback is visible or the created row is visible after redirect.
  - tracking_expectation: Not required.
- AC-UX3:
  - observable_condition: A linked active member can create a member-paid expense and the reimbursement table reflects the payer.
  - covered_states: normal, success
  - accessibility_expectation: `代墊成員` is labeled and selectable.
  - responsive_expectation: Desktop Chromium E2E required for MVP.
  - toast_or_notification_expectation: Success feedback is visible or created row visible after redirect.
  - tracking_expectation: Not required.
- AC-UX4:
  - observable_condition: A validation or permission error redirects back to the same create intent and shows inline error copy.
  - covered_states: error, validation, permission
  - accessibility_expectation: Error alert uses `role=alert`.
  - responsive_expectation: No new requirement.
  - toast_or_notification_expectation: Error must not rely only on toast.
  - tracking_expectation: Not required.

## E2E Scenario Draft

- scenario: Create income through browser and see dashboard update
  - route: `/?month=2026-06&create=income`
  - viewport: Desktop Chromium
  - given: `home_fund_e2e` seeded and controlled auth user `user-e2e-linked`
  - when: Fill name, amount, date, category, source member, submit
  - then: Dashboard for `2026-06` shows the unique income record and income summary changes
  - states_covered: normal, success
  - selectors_or_accessible_names: `新增收入`, `名稱`, `金額`, `日期`, `分類`, `收入來源`, `新增收入`
  - mock_or_fixture_needs: DB-backed E2E setup and controlled auth header
  - toast_expectations: Prefer visible created row; toast may be asserted if stable
  - tracking_expectations: None
- scenario: Create fund-paid expense through browser
  - route: `/?month=2026-06&create=expense`
  - viewport: Desktop Chromium
  - given: `home_fund_e2e` seeded and controlled auth user `user-e2e-linked`
  - when: Switch `支出類型` to `基金支出`, fill expense, submit
  - then: Created expense row is visible and reimbursement table does not add Lin as a refundable payer
  - states_covered: normal, success
  - selectors_or_accessible_names: `新增支出`, `支出類型`, `基金支出`, `分類`, `新增支出`, `退款表`
  - mock_or_fixture_needs: DB-backed E2E setup and controlled auth header
  - toast_expectations: Prefer visible created row
  - tracking_expectations: None
- scenario: Create member-paid expense through browser
  - route: `/?month=2026-06&create=expense`
  - viewport: Desktop Chromium
  - given: `home_fund_e2e` seeded and controlled auth user `user-e2e-linked`
  - when: Keep `成員代墊`, fill expense, choose payer, submit
  - then: Created expense row is visible and reimbursement table includes the payer/amount
  - states_covered: normal, success
  - selectors_or_accessible_names: `代墊成員`, `成員代墊`, `退款表`
  - mock_or_fixture_needs: DB-backed E2E setup and controlled auth header
  - toast_expectations: Prefer visible created row
  - tracking_expectations: None
- scenario: Invalid create keeps create intent visible
  - route: `/?month=2026-06&create=income`
  - viewport: Desktop Chromium
  - given: `home_fund_e2e` seeded and controlled auth user `user-e2e-linked`
  - when: Submit invalid server-validated data
  - then: Income dialog remains open with an inline error alert
  - states_covered: error, validation
  - selectors_or_accessible_names: `新增收入`, `金額格式不正確`
  - mock_or_fixture_needs: May use direct form filling if browser native validation does not intercept
  - toast_expectations: No error toast required
  - tracking_expectations: None

## Interaction Behavior

- forms_and_validation: HTML required inputs provide first-line validation; server parser/action redirects errors back with `create=<intent>&result=<reason>`.
- destructive_or_irreversible_actions: None.
- async_or_realtime_behavior: Server action writes DB, revalidates `/`, and redirects to the selected month.
- notifications_or_confirmations: Success toast exists; inline alerts are required for errors.
- keyboard_and_focus_flow: Existing dialog fields must remain reachable by keyboard; E2E should use role/label selectors where feasible.

## Accessibility

- semantic_structure: Dialog title describes `新增收入` or `新增支出`; form controls have visible labels.
- labels_and_instructions: Payment source is represented by `支出類型` with `成員代墊` / `基金支出`.
- error_announcements: Inline alert has alert/status role via existing `Alert`.
- focus_management: No new focus behavior required for this hardening story.
- contrast_or_motion_notes: Existing design tokens apply; status cannot rely only on color.
- keyboard_requirements: Create dialog and fields remain keyboard operable.

## UI Copy Constraints

- domain_terms: income, expense, fund-paid expense, member-paid expense, refundable, reimbursement table.
- required_messages: Existing Chinese error/success copy may be reused.
- prohibited_or_sensitive_language: Do not introduce accounting/legal terminology.
- localization_notes: Traditional Chinese labels and TWD input remain as existing implementation.

## Frontend / Backend Expectations

- data_needed_by_ui: Active categories, active members, current month, current member access hints.
- user_actions_crossing_boundary: `createLedgerRecordAction` server action.
- expected_success_responses: Redirect to `/?month=<month>&create=success`, path revalidation, created row visible in dashboard read model.
- expected_error_responses: Redirect to same month and create intent with `result=<reason>`; inline error alert appears.
- client_state_questions: Existing implementation may not preserve typed field values after server redirect; accepted for MVP unless verification reveals severe UX failure.
- server_state_questions: `paymentSource=member` must derive `reimbursementStatus=refundable`; `paymentSource=fund` must derive `not_refundable`.

## Tracking Draft

- learning_question:
  - event_or_signal: ledger_record_created
  - trigger: Successful browser create action
  - suggested_properties: record_type, payment_source, created_for_self
  - privacy_notes: Do not record amount, note, or member names.

## Visual Model

- type: task_flow
- title: DB-Backed Browser Create Record Flow
- nodes:
  - id: dashboard
    label: Dashboard for selected month
    kind: entry
  - id: open_income
    label: Open income dialog
    kind: screen
  - id: open_expense
    label: Open expense dialog
    kind: screen
  - id: choose_payment
    label: Choose member-paid or fund-paid
    kind: decision
  - id: submit
    label: Submit create form
    kind: action
  - id: persist
    label: Server action writes ledger record
    kind: system_response
  - id: updated_dashboard
    label: Dashboard reflects new record
    kind: success
  - id: inline_error
    label: Dialog shows inline error
    kind: error
- edges:
  - from: dashboard
    to: open_income
    label: add income
  - from: dashboard
    to: open_expense
    label: add expense
  - from: open_expense
    to: choose_payment
    label: set expense type
  - from: open_income
    to: submit
    label: valid fields
  - from: choose_payment
    to: submit
    label: valid fields
  - from: submit
    to: persist
    label: server action
  - from: persist
    to: updated_dashboard
    label: success redirect
  - from: persist
    to: inline_error
    label: validation or permission error
- states:
  - name: success
    user_sees: Created row and updated dashboard values
    user_can_do: Continue reviewing or create another record
    recovery: None needed
  - name: error
    user_sees: Create dialog remains open with inline alert
    user_can_do: Correct and resubmit
    recovery: Same create intent is preserved

## Open Questions and Risks

- product: Whether this slice should include general-member self-only behavior is deferred to permission-matrix browser checks.
- UX: Existing server redirect errors may clear typed field values; accepted for MVP unless user asks to refine form persistence.
- accessibility: Radix select interactions in Playwright may require careful selector strategy.
- content: Existing error copy is acceptable for E2E assertions, but exact wording can be brittle.
- tracking: Analytics provider remains unknown and out of scope.
- technical_contract: Server action redirects rather than returning JSON; E2E should assert visible post-redirect state.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm this story uses existing create dialog and does not introduce new route or UI redesign.
  - Confirm member-paid and fund-paid expense behavior are visibly distinguishable through dashboard/reimbursement output.
- must_check:
  - Created records are persisted through the real server action.
  - Same selected month is preserved after success and error.
  - Error state remains visible in the create dialog.
- acceptance_signals:
  - Architecture can define server action, DB-backed E2E, and dashboard read-model contracts.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
