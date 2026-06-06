---
id: exp-recurring-rules-and-confirmation
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-recurring-rules-and-confirmation
  - web-foundation
outputs:
  - user_journey
  - task_flow
  - screen_states
  - interaction_expectations
trace_links:
  stories:
    - .ai/stories/story-recurring-rules-and-confirmation.md
  domain_events:
    - Recurring rule created
    - Immediate recurring item posted
    - Recurring reminder created
    - Recurring reminder confirmed
  business_outcomes:
    - Pending recurring items visible
  impact_analysis: []
reviewed_at:
---

# Experience Design for Recurring Rules And Confirmation

## Experience Summary

- primary_user: Authorized manager.
- user_goal: Configure monthly fixed items as immediate or reminder-based and confirm reminders when real money moves.
- business_outcome: Fixed income/expenses are tracked without counting unconfirmed items.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/experience-design/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Recurring is a primary route and feeds monthly report.
- page_title_pattern: Recurring rules title plus Create rule action.
- layout_pattern: Rule list with status, plus pending monthly reminders.
- shared_components: Rule form, segmented income/expense, posting mode control, status badge.
- design_tokens_used: warning for pending, success for posted/confirmed.
- toast_or_notification_pattern: Toast after rule save/confirmation; inline errors for duplicate occurrence.
- reuse_or_extraction_needed: Record fields shared with ledger create.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Create fixed monthly item | Shows recurring rule form | Recurring rule created |
| 2 | Choose posting mode | Explains immediate vs reminder | Posting mode policy |
| 3 | Month arrives | Shows posted item or pending reminder | Immediate posted / reminder created |
| 4 | Confirm reminder | Converts pending item to record | Recurring reminder confirmed |
| 5 | Review report | Pending items excluded from totals | Reporting policy |

## Task Flow

- entry_point: Recurring route or report pending item.
- primary_path: Create rule -> choose amount/category/schedule/mode -> save -> monthly occurrence handled.
- alternate_paths: Edit rule; confirm reminder from report; skip/cancel pending item if later approved.
- exit_or_completion: Rule saved or pending item confirmed into ledger.
- recovery_paths: Duplicate month warning; retry failed confirmation.

## Information Architecture

- route_or_screen_candidates: `/recurring`, `/recurring/new`, `/reports/:month?section=pending`.
- primary_content: Rule list, pending reminders, posting mode.
- secondary_content: Last posted/confirmed month and trace to generated record.
- navigation_context: Primary Recurring route, report cross-link.
- content_priority: Pending items and posting mode clarity.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Rule list and pending items | Create/edit/confirm | Rules, categories, members | Mode misunderstanding |
| loading | Stable placeholders | Wait | Rules/pending load | None |
| empty | No recurring rules | Create rule | Permission | Empty report expectations |
| error | Load/save/confirm failed | Retry | Error detail | Duplicate records |
| validation | Amount/category/mode errors | Correct | Rules | Missing mode |
| permission | Read-only or denied | View/return | Role | Unauthorized setup |
| success | Rule saved or reminder confirmed | View record/report | Generated record | Confirmation counted twice |

## Interaction Behavior

- forms_and_validation: Required amount, type, category, schedule, posting mode.
- destructive_or_irreversible_actions: Editing rule should not silently alter already posted records.
- async_or_realtime_behavior: Monthly occurrence generation may be server-owned; UI shows status.
- notifications_or_confirmations: Confirm reminder action explains it will count in totals.
- keyboard_and_focus_flow: Posting mode controls keyboard accessible; focus pending item after confirmation.

## Accessibility

- semantic_structure: Rule list and pending list use headings and status text.
- labels_and_instructions: Posting mode has explicit explanation.
- error_announcements: Duplicate occurrence and save errors announced.
- focus_management: Confirmation returns focus to next pending item.
- contrast_or_motion_notes: Pending status not color-only.
- keyboard_requirements: Rule actions and confirmation keyboard accessible.

## UI Copy Constraints

- domain_terms: recurring rule, immediate posting, reminder-based posting, pending, confirmed.
- required_messages: "Reminder-based items do not affect totals until confirmed."
- prohibited_or_sensitive_language: Avoid "auto-pay" unless payment execution exists.
- localization_notes: Monthly schedule wording needs locale.

## Frontend / Backend Expectations

- data_needed_by_ui: Rules, categories, members, pending items, generated record links.
- user_actions_crossing_boundary: Create/update rule, generate/confirm occurrence.
- expected_success_responses: Saved rule, posted record, confirmed record.
- expected_error_responses: Duplicate occurrence, permission denied, stale category, validation.
- client_state_questions: Should UI trigger generation or only display server-generated pending items?
- server_state_questions: Occurrence idempotency and schedule evaluation.

## Tracking Draft

- learning_question:
  - event_or_signal: recurring_item_confirmed
  - trigger: Pending item confirmed
  - suggested_properties: record_type, posting_mode
  - privacy_notes: No amounts or notes.

## Visual Model

- type: task_flow
- title: Recurring Rule Flow
- nodes:
  - id: recurring
    label: Recurring rules
    kind: screen
  - id: mode
    label: Choose posting mode
    kind: decision
  - id: immediate
    label: Immediate item posted
    kind: system_response
  - id: reminder
    label: Pending reminder
    kind: system_response
  - id: confirm
    label: Confirm reminder
    kind: action
  - id: record
    label: Ledger record created
    kind: success
- edges:
  - from: recurring
    to: mode
    label: create rule
  - from: mode
    to: immediate
    label: immediate
  - from: mode
    to: reminder
    label: reminder
  - from: reminder
    to: confirm
    label: money moved
  - from: confirm
    to: record
    label: confirmed
- states:
  - name: validation
    user_sees: Missing mode/amount/category
    user_can_do: Correct fields
    recovery: Save again

## Open Questions and Risks

- product: Who manages recurring rules?
- UX: How to explain skipped/changed recurring amounts.
- accessibility: Pending list actions.
- content: Reminder copy.
- tracking: Provider unknown.
- technical_contract: Idempotent monthly occurrence generation.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate posting mode and confirmation flow.
- must_check:
  - Pending reminders excluded from totals.
  - Duplicate monthly postings prevented.
- acceptance_signals:
  - Architecture can define recurring rule, occurrence, and ledger interactions.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
