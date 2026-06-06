---
id: exp-ledger-record-corrections
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-ledger-record-corrections
  - web-foundation
outputs:
  - user_journey
  - task_flow
  - screen_states
  - interaction_expectations
trace_links:
  stories:
    - .ai/stories/story-ledger-record-corrections.md
  domain_events:
    - Ledger record corrected
    - Ledger record deleted
  business_outcomes:
    - Protected record editing
  impact_analysis: []
reviewed_at:
---

# Experience Design for Ledger Record Corrections

## Experience Summary

- primary_user: Record owner, admin, or finance manager.
- user_goal: Correct allowed records and delete only where permitted.
- business_outcome: Mistakes can be fixed without unauthorized modification.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/experience-design/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Corrections start from records/report detail.
- page_title_pattern: Record detail/edit shows type and month.
- layout_pattern: Detail view plus edit form; mobile uses full-screen form.
- shared_components: Record row, edit form, confirmation dialog, permission state.
- design_tokens_used: danger for delete, warning for permission/changed status.
- toast_or_notification_pattern: Toast after save/delete; inline errors for conflicts.
- reuse_or_extraction_needed: Record form shared with create.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Open record | Shows details and available actions | Monthly records viewed |
| 2 | Edit allowed record | Opens form with existing values | Ledger record corrected |
| 3 | Save correction | Updates summaries and status | Protected editing outcome |
| 4 | Delete allowed record | Requires confirmation | Ledger record deleted |
| 5 | Attempt unauthorized delete | Blocks action | Permission policy |

## Task Flow

- entry_point: Record row action or detail page.
- primary_path: Open record -> edit -> save -> return to origin.
- alternate_paths: Delete own/admin-allowed record; finance manager edits but cannot delete others.
- exit_or_completion: Updated/deleted state reflected in list/report/reimbursement.
- recovery_paths: Conflict message if record changed; permission denied if role changed.

## Information Architecture

- route_or_screen_candidates: `/records/:id`, `/records/:id/edit`.
- primary_content: Record details and editable fields.
- secondary_content: Creator, payer/source, payment source, refund status, audit hints.
- navigation_context: Back to selected month/list.
- content_priority: Current values, permission actions, destructive action separation.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Record detail/edit actions | Edit/delete allowed | Record, permissions | Action mismatch |
| loading | Detail placeholder | Wait | Record load | None |
| empty | Record not found | Return | Record id | Deleted by another user |
| error | Load/save/delete failed | Retry | Error detail | Inconsistent summaries |
| validation | Field errors | Correct | Rules | Invalid status changes |
| permission | Read-only detail | Return or ask admin | Permissions | Confusing disabled actions |
| success | Saved/deleted feedback | Return | Updated state | Lost list context |

## Interaction Behavior

- forms_and_validation: Same record validation as create; changing payment source updates refund status rules.
- destructive_or_irreversible_actions: Delete requires confirmation; explain report/reimbursement impact.
- async_or_realtime_behavior: Refresh dependent summaries after mutation.
- notifications_or_confirmations: Confirmation dialog for delete; toast for success.
- keyboard_and_focus_flow: Focus confirmation dialog; after close return focus to source action.

## Accessibility

- semantic_structure: Detail fields use description list or labeled rows.
- labels_and_instructions: Delete confirmation includes record identity.
- error_announcements: Mutation errors announced.
- focus_management: Preserve return focus to record row.
- contrast_or_motion_notes: Destructive action visually and textually distinct.
- keyboard_requirements: All row actions accessible.

## UI Copy Constraints

- domain_terms: record owner, created by, payer/source, fund-paid, refundable, reimbursed.
- required_messages: "Finance managers cannot delete other members' records in the MVP permission set."
- prohibited_or_sensitive_language: Avoid blaming user for permission denial.
- localization_notes: Date/currency in record identity.

## Frontend / Backend Expectations

- data_needed_by_ui: Record, permissions, related reimbursement status.
- user_actions_crossing_boundary: Update record, delete record.
- expected_success_responses: Updated/deleted record state.
- expected_error_responses: Permission denied, validation error, conflict, already reimbursed constraint if relevant.
- client_state_questions: Should edit be disabled for reimbursed expenses?
- server_state_questions: Delete semantics: hard delete vs void/archive.

## Tracking Draft

- learning_question:
  - event_or_signal: ledger_record_changed
  - trigger: Successful edit/delete
  - suggested_properties: action, record_type, actor_role
  - privacy_notes: No amount, notes, or member names.

## Visual Model

- type: task_flow
- title: Record Correction Flow
- nodes:
  - id: record
    label: Record detail
    kind: screen
  - id: can_edit
    label: Permission check
    kind: decision
  - id: edit
    label: Edit record
    kind: action
  - id: delete
    label: Confirm delete
    kind: decision
  - id: success
    label: Record updated or deleted
    kind: success
  - id: denied
    label: Read-only denied state
    kind: error
- edges:
  - from: record
    to: can_edit
    label: action requested
  - from: can_edit
    to: edit
    label: edit allowed
  - from: can_edit
    to: delete
    label: delete allowed
  - from: edit
    to: success
    label: saved
  - from: can_edit
    to: denied
    label: denied
- states:
  - name: permission
    user_sees: Read-only detail and explanation
    user_can_do: Return
    recovery: Contact admin if needed

## Open Questions and Risks

- product: Delete vs void/archive remains unresolved.
- UX: Changing member-paid to fund-paid after reimbursement may need extra policy.
- accessibility: Confirmation dialog details.
- content: Deletion language.
- tracking: Provider unknown.
- technical_contract: Mutation conflict and delete semantics.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate correction and delete permission behavior.
- must_check:
  - Finance manager delete access disabled for others.
  - Deleted/changed records update reports and reimbursements.
- acceptance_signals:
  - Architecture can plan mutation authorization and record lifecycle.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
