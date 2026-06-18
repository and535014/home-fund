---
id: exp-ledger-entry-creation
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-ledger-entry-creation
  - web-foundation
outputs:
  - user_journey
  - task_flow
  - screen_states
  - interaction_expectations
trace_links:
  stories:
    - .ai/spec/story-ledger-entry-creation.md
  domain_events:
    - Income recorded
    - Expense recorded
    - Member-paid expense became refundable
  business_outcomes:
    - Monthly cycle without spreadsheet recalculation
  impact_analysis: []
reviewed_at:
---

# Experience Design for Ledger Entry Creation

## Experience Summary

- primary_user: Household member.
- user_goal: Quickly record income or expense with correct category, member, and payment source.
- business_outcome: The monthly ledger reflects received money, fund-paid expenses, and refundable member-paid expenses.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/prototype/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Create is a primary route/action in the authenticated shell.
- page_title_pattern: "Create record" with income/expense segmented control.
- layout_pattern: Single form on mobile; grouped financial fields on desktop.
- shared_components: Form fields, select, status badge preview, validation, toast.
- design_tokens_used: primary, warning for refundable, success for saved.
- toast_or_notification_pattern: Success toast after create; inline validation for form errors.
- reuse_or_extraction_needed: Record form fields reused by edit and recurring confirmation.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Add record | Opens income/expense form | Record income / expense |
| 2 | Select type | Shows relevant fields | Income recorded / Expense recorded |
| 3 | Choose payment source | Explains fund-paid vs member-paid | Member-paid expense became refundable |
| 4 | Submit valid form | Saves record and updates monthly data | Monthly cycle outcome |
| 5 | Submit invalid/unauthorized form | Shows inline errors or permission message | Authorization policy |

## Task Flow

- entry_point: Create nav item or primary action from report/records.
- primary_path: Choose income/expense -> enter amount/date/category -> choose member/payment source -> save.
- alternate_paths: Admin/finance manager creates record for another member; user cancels to previous month.
- exit_or_completion: Saved record detail, monthly records, or reset form for another entry.
- recovery_paths: Preserve input after validation or save error.

## Information Architecture

- route_or_screen_candidates: `/records/new`, `/records/new?type=expense`.
- primary_content: Record type, amount, date/month, category, member, payment source, notes.
- secondary_content: Refund status preview for member-paid expense.
- navigation_context: Primary Create route.
- content_priority: Amount, type, date, category, payment source.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Income/expense form | Save record | Categories, members, permissions | Payment source confusion |
| loading | Stable form skeleton | Wait | Category/member data | Slow create flow |
| empty | Missing categories | Go create category if allowed | Category list | Dead-end for general members |
| error | Save failed | Retry | Error detail | Duplicate record if retry unclear |
| validation | Field errors | Correct fields | Validation rules | Amount/date mistakes |
| permission | Cannot create for selected member | Change member or return | Permission rule | Hidden server denial |
| success | Saved message and next action | View or add another | Saved record | User loses context |

## Interaction Behavior

- forms_and_validation: Amount, date/month, category, and type required. Expense requires payment source. Member-paid expense requires payer member.
- destructive_or_irreversible_actions: None.
- async_or_realtime_behavior: Save updates records/report on next load or immediately if on same route.
- notifications_or_confirmations: Toast after save; inline warning that member-paid expenses become refundable.
- keyboard_and_focus_flow: Segmented type control, selects, and submit follow logical order; focus first invalid field.

## Accessibility

- semantic_structure: Form grouped by record type and payment details.
- labels_and_instructions: Payment source radio/select explains "fund-paid" and "member-paid".
- error_announcements: Field errors announced and linked to inputs.
- focus_management: After success, focus success region or first field if adding another.
- contrast_or_motion_notes: Refundable status badge has text.
- keyboard_requirements: Full form usable without pointer.

## UI Copy Constraints

- domain_terms: income, expense, fund-paid, member-paid, refundable, reimbursed.
- required_messages: "Member-paid expenses will appear in the reimbursement table until marked reimbursed."
- prohibited_or_sensitive_language: Avoid "claim" or "invoice" unless product adopts accounting terms.
- localization_notes: Use Traditional Chinese (`zh-TW`) labels and Taiwan-style date/month formatting; currency remains a product decision.

## Frontend / Backend Expectations

- data_needed_by_ui: Categories, members, current member, permissions, record defaults.
- user_actions_crossing_boundary: Create income, create expense.
- expected_success_responses: Created record with id, month, type, payment source, refund status.
- expected_error_responses: Validation, permission denied, stale category/member.
- client_state_questions: Should user be returned to selected month?
- server_state_questions: Authoritative derivation of refundable status from payment source.

## Tracking Draft

- learning_question:
  - event_or_signal: ledger_record_created
  - trigger: Successful create
  - suggested_properties: record_type, payment_source, created_for_self
  - privacy_notes: Do not record amount or notes in analytics.

## Visual Model

- type: task_flow
- title: Create Ledger Record Flow
- nodes:
  - id: create
    label: Create entry
    kind: entry
  - id: type
    label: Choose income or expense
    kind: decision
  - id: payment
    label: Choose payment source
    kind: decision
  - id: save
    label: Save record
    kind: action
  - id: success
    label: Record created
    kind: success
  - id: error
    label: Validation or permission error
    kind: error
- edges:
  - from: create
    to: type
    label: start form
  - from: type
    to: payment
    label: expense
  - from: payment
    to: save
    label: valid fields
  - from: save
    to: success
    label: saved
  - from: save
    to: error
    label: failed
- states:
  - name: validation
    user_sees: Field-specific errors
    user_can_do: Correct and resubmit
    recovery: Keep entered values

## Open Questions and Risks

- product: Can member-paid expenses ever be excluded from reimbursement?
- UX: Payment source wording must be unambiguous.
- accessibility: Select/radio groups need proper labels.
- content: Primary language is Traditional Chinese; currency remains unresolved.
- tracking: Provider unknown.
- technical_contract: Record creation contract and status derivation.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate payment source and refundable status behavior.
- must_check:
  - Fund-paid expenses do not enter reimbursement table.
  - Member-paid expenses start refundable/unreimbursed.
- acceptance_signals:
  - Architecture can model record creation and reimbursement status rules.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
