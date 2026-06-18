---
id: exp-category-management
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-category-management
  - web-foundation
outputs:
  - user_journey
  - task_flow
  - screen_states
  - interaction_expectations
trace_links:
  stories:
    - .ai/spec/story-category-management.md
  domain_events:
    - Category created
    - Category updated
  business_outcomes:
    - Consistent category reports
  impact_analysis: []
reviewed_at:
---

# Experience Design for Category Management

## Experience Summary

- primary_user: Authorized manager.
- user_goal: Maintain income and expense categories.
- business_outcome: Records and reports use consistent household classifications.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/prototype/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Settings route inside authenticated shell.
- page_title_pattern: Title plus Add category action.
- layout_pattern: Segmented income/expense category lists.
- shared_components: Tabs, table/list rows, modal form, status badge.
- design_tokens_used: primary, success, muted_text, border.
- toast_or_notification_pattern: Success toast after save; inline validation.
- reuse_or_extraction_needed: Category picker reused by ledger and recurring forms.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Open categories | Shows income/expense categories | CategoryCatalog |
| 2 | Add category | Validates and saves category | Category created |
| 3 | Rename category | Historical records keep readable label | Category updated |
| 4 | Disable category | Future forms omit it, history remains | Category updated |
| 5 | Unauthorized user attempts edit | Shows permission denied | Authorization policy |

## Task Flow

- entry_point: Settings -> Categories.
- primary_path: Select type -> add/edit -> save -> category appears in forms.
- alternate_paths: Archive/disable category; cancel form.
- exit_or_completion: Category list and entry pickers reflect changes.
- recovery_paths: Inline duplicate/name errors; retry failed save.

## Information Architecture

- route_or_screen_candidates: `/settings/categories`.
- primary_content: Category lists by type.
- secondary_content: Status, edit/archive actions.
- navigation_context: Secondary settings route.
- content_priority: Type, name, availability.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Category lists | Add/edit/archive | Categories, permissions | Category type confusion |
| loading | Placeholder rows | Wait | Category list | None |
| empty | No categories for type | Add category | Type selected | Later forms unusable |
| error | Failed load/save | Retry | Error state | Duplicate saves |
| validation | Name/type errors | Correct | Rules | Hidden mobile errors |
| permission | Read-only or denied | Browse/return | Role | Unclear manager role |
| success | Updated row and toast | Continue | Saved category | Historical label ambiguity |

## Interaction Behavior

- forms_and_validation: Category name and type required; prevent ambiguous duplicate active names per type.
- destructive_or_irreversible_actions: Prefer archive/disable over hard delete.
- async_or_realtime_behavior: Entry forms should use updated active categories on next load.
- notifications_or_confirmations: Confirm archive if used by historical records.
- keyboard_and_focus_flow: Tabs and list actions keyboard reachable.

## Accessibility

- semantic_structure: Use tablist or segmented control with clear selected state.
- labels_and_instructions: Category type and active/archived status named.
- error_announcements: Form errors announced.
- focus_management: Return focus to category row after modal closes.
- contrast_or_motion_notes: Status badges include text.
- keyboard_requirements: Edit/archive actions accessible from row.

## UI Copy Constraints

- domain_terms: income category, expense category, active, archived.
- required_messages: Explain archived categories remain on old records.
- prohibited_or_sensitive_language: Avoid "delete" if action is archive.
- localization_notes: Category names are user-entered and locale-specific.

## Frontend / Backend Expectations

- data_needed_by_ui: Category id, name, type, status, usage hint if available.
- user_actions_crossing_boundary: Create, update, archive/disable.
- expected_success_responses: Saved category.
- expected_error_responses: Duplicate, permission denied, category in use conflict.
- client_state_questions: Should forms cache categories?
- server_state_questions: Category lifecycle and historical label handling.

## Tracking Draft

- learning_question:
  - event_or_signal: category_saved
  - trigger: Category create/update
  - suggested_properties: category_type, action
  - privacy_notes: Avoid recording custom category name.

## Visual Model

- type: task_flow
- title: Category Management Flow
- nodes:
  - id: categories
    label: Categories settings
    kind: screen
  - id: type
    label: Select income or expense
    kind: decision
  - id: form
    label: Category form
    kind: action
  - id: saved
    label: Category saved
    kind: success
  - id: invalid
    label: Validation error
    kind: error
- edges:
  - from: categories
    to: type
    label: choose type
  - from: type
    to: form
    label: add/edit
  - from: form
    to: saved
    label: valid
  - from: form
    to: invalid
    label: invalid
- states:
  - name: empty
    user_sees: No categories yet
    user_can_do: Add category
    recovery: Create first category

## Open Questions and Risks

- product: Which roles can manage categories?
- UX: Should archived categories be visible by default?
- accessibility: Tab semantics need care on mobile.
- content: Archive wording.
- tracking: Provider unknown.
- technical_contract: Category status model undecided.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate category type and lifecycle.
- must_check:
  - Historical records remain readable.
  - Entry forms consume active categories.
- acceptance_signals:
  - Architecture can plan category catalog and form dependencies.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
