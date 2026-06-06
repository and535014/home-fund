---
id: exp-reimbursement-table-and-settlement
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-reimbursement-table-and-settlement
  - web-foundation
outputs:
  - user_journey
  - task_flow
  - screen_states
  - interaction_expectations
trace_links:
  stories:
    - .ai/stories/story-reimbursement-table-and-settlement.md
  domain_events:
    - Monthly reimbursement table generated
    - Reimbursement expenses selected
    - Expenses reimbursed
  business_outcomes:
    - Traceable one-time settlement
  impact_analysis: []
reviewed_at:
---

# Experience Design for Reimbursement Table And Settlement

## Experience Summary

- primary_user: Finance manager for settlement; all members for viewing.
- user_goal: See refundable member-paid expenses by month/member and mark selected expenses as reimbursed.
- business_outcome: Member-paid costs are settled once and remain traceable.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/experience-design/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Reimbursement is a primary route and report section.
- page_title_pattern: Month selector plus reimbursement title and selected total.
- layout_pattern: Desktop grouped table; mobile grouped list with checkboxes.
- shared_components: Month selector, grouped rows, checkbox selection, status badge, confirmation dialog.
- design_tokens_used: warning for refundable, success for reimbursed, danger for blocked conflicts.
- toast_or_notification_pattern: Confirmation plus success toast; inline conflict errors.
- reuse_or_extraction_needed: Selection toolbar, status badge, confirmation modal.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Open reimbursement month | Shows totals by member | Monthly reimbursement table generated |
| 2 | Inspect member total | Shows underlying refundable expenses | Traceability outcome |
| 3 | Select expenses | Updates selected total | Reimbursement expenses selected |
| 4 | Mark reimbursed | Requires confirmation and role check | Finance manager policy |
| 5 | Review result | Items show reimbursed and leave unpaid totals | Expenses reimbursed |

## Task Flow

- entry_point: Reimbursement nav or monthly report reimbursement summary.
- primary_path: Select month -> review grouped expenses -> select items -> confirm reimbursement -> updated table.
- alternate_paths: View-only member browses table; conflict if item already reimbursed.
- exit_or_completion: Selected expenses marked reimbursed once.
- recovery_paths: Deselect items, retry failed action, refresh on conflict.

## Information Architecture

- route_or_screen_candidates: `/reimbursements/:month`.
- primary_content: Member groups, refundable totals, individual expenses, selected total.
- secondary_content: Reimbursed history/status, links to records.
- navigation_context: Primary Reimbursement route; report cross-link.
- content_priority: Who gets reimbursed, how much, which expenses, settlement action.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Grouped refundable expenses | Select/reimburse if finance manager | Reimbursement read model | Accidental settlement |
| loading | Group placeholders | Wait | Reimbursement query | None |
| empty | No refundable expenses | Choose another month | Month data | Confuse with already reimbursed |
| error | Load/settle failed | Retry | Error detail | Partial settlement uncertainty |
| validation | No selection | Select expense | Selection state | Button enabled too early |
| permission | View-only settlement disabled | Browse | Role | Members think they can reimburse |
| success | Items marked reimbursed | Review remaining | Updated statuses | Double reimbursement conflict |

## Interaction Behavior

- forms_and_validation: Require at least one selected refundable expense before settlement.
- destructive_or_irreversible_actions: Reimbursement marking requires confirmation because it changes settlement state.
- async_or_realtime_behavior: On confirm, refresh selected items and member totals.
- notifications_or_confirmations: Confirmation dialog shows count and total; success toast after update.
- keyboard_and_focus_flow: Checkbox groups keyboard usable; confirmation returns focus to updated group.

## Accessibility

- semantic_structure: Group by member with headings; table/list rows retain expense labels.
- labels_and_instructions: Checkboxes identify expense, date, amount, and member.
- error_announcements: Conflict/already reimbursed announced.
- focus_management: Focus selected-total toolbar when selection changes if needed.
- contrast_or_motion_notes: Status text accompanies colors.
- keyboard_requirements: Select all/group actions keyboard accessible.

## UI Copy Constraints

- domain_terms: refundable, reimbursed, member-paid, selected expenses, finance manager.
- required_messages: "This will mark selected expenses as reimbursed. They will no longer appear in refundable totals."
- prohibited_or_sensitive_language: Avoid implying money transfer occurs in app.
- localization_notes: Amount formatting and member names.

## Frontend / Backend Expectations

- data_needed_by_ui: Month, member groups, expense ids, amounts, statuses, current role.
- user_actions_crossing_boundary: Fetch table, mark selected expenses reimbursed.
- expected_success_responses: Updated reimbursement statuses and totals.
- expected_error_responses: Permission denied, already reimbursed, stale selection, validation.
- client_state_questions: Whether selected rows persist across filters.
- server_state_questions: Atomic settlement and idempotency.

## Tracking Draft

- learning_question:
  - event_or_signal: reimbursement_completed
  - trigger: Finance manager marks expenses reimbursed
  - suggested_properties: expense_count, member_count, month_offset
  - privacy_notes: Do not include amounts or notes.

## Visual Model

- type: task_flow
- title: Reimbursement Settlement Flow
- nodes:
  - id: table
    label: Reimbursement table
    kind: screen
  - id: select
    label: Select refundable expenses
    kind: action
  - id: confirm
    label: Confirm settlement
    kind: decision
  - id: updated
    label: Expenses reimbursed
    kind: success
  - id: denied
    label: Settlement denied
    kind: error
- edges:
  - from: table
    to: select
    label: finance manager
  - from: select
    to: confirm
    label: selected
  - from: confirm
    to: updated
    label: confirmed
  - from: table
    to: denied
    label: non-finance action
- states:
  - name: success
    user_sees: Reimbursed status and reduced refundable total
    user_can_do: Continue settling
    recovery: View record details

## Open Questions and Risks

- product: Does marking reimbursed reduce fund balance?
- UX: Need clear distinction between app status and actual money transfer.
- accessibility: Mobile grouped selection.
- content: Settlement confirmation copy.
- tracking: Provider unknown.
- technical_contract: Atomic one-time reimbursement marking.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate settlement and status language.
- must_check:
  - Only finance managers can mark reimbursed.
  - Already reimbursed expenses cannot be reimbursed again.
- acceptance_signals:
  - Architecture can plan reimbursement read model and command.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
