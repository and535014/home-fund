---
id: exp-monthly-records-and-reports
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-monthly-records-and-reports
  - web-foundation
outputs:
  - user_journey
  - task_flow
  - screen_states
  - interaction_expectations
trace_links:
  stories:
    - .ai/stories/story-monthly-records-and-reports.md
  domain_events:
    - Monthly records viewed
    - Monthly report generated
    - Monthly reimbursement table generated
  business_outcomes:
    - Monthly fund visibility
  impact_analysis: []
reviewed_at:
---

# Experience Design for Monthly Records And Reports

## Experience Summary

- primary_user: Household member.
- user_goal: Review a month of income, expenses, pending recurring items, categories, and reimbursement status.
- business_outcome: Household can settle a monthly cycle without spreadsheet recalculation.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/experience-design/web-foundation.md`

## Foundation Alignment

- app_shell_pattern: Monthly report is the default authenticated landing route.
- page_title_pattern: Month selector plus summary title.
- layout_pattern: Desktop summary + tables; mobile stacked summary cards and lists.
- shared_components: Month selector, totals, table/list rows, status badges, empty/loading/error states.
- design_tokens_used: success, warning, info, border, surface.
- toast_or_notification_pattern: Toast only for cross-page updates; reports mainly use inline states.
- reuse_or_extraction_needed: Month selector, record row, status badge.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Open app/report | Shows current or selected month | Monthly report generated |
| 2 | Review totals | Shows confirmed income/expense totals | Reporting context |
| 3 | Inspect categories | Shows category summaries | Category management |
| 4 | Check pending items | Shows reminders excluded from totals | Recurring policy |
| 5 | Trace summary | Opens underlying records/reimbursement | Monthly records viewed |

## Task Flow

- entry_point: Default landing page or Reports nav.
- primary_path: Select month -> review summary -> inspect sections -> open details.
- alternate_paths: Empty month; report after record save; filter by category/type.
- exit_or_completion: User understands month status and navigates to create/edit/reimbursement if needed.
- recovery_paths: Retry failed report load; preserve selected month.

## Information Architecture

- route_or_screen_candidates: `/reports/:month`.
- primary_content: Month selector, income total, expense total, net/summary if approved, pending count, reimbursement summary.
- secondary_content: Records list, category breakdowns, pending recurring items, reimbursement link.
- navigation_context: Primary Monthly report route.
- content_priority: Month, totals, pending/reimbursement status, traceable details.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Month summary and sections | Inspect records | Ledger/report data | Dense data overload |
| loading | Skeleton summaries/lists | Wait | Report query | Layout jump |
| empty | No records for month | Create record/rule if allowed | Month, permissions | Empty but pending hidden |
| error | Report load failed | Retry | Error detail | Cannot settle month |
| validation | Invalid month/filter | Choose valid month | Month parser | Bad URL state |
| permission | Read-only actions hidden | Browse | Role | Edit affordance confusion |
| success | Updated report after changes | Continue | Fresh data | Stale totals |

## Interaction Behavior

- forms_and_validation: Month selector validates month format.
- destructive_or_irreversible_actions: None directly; edit/delete delegated to records.
- async_or_realtime_behavior: Report refreshes after create/edit/delete/confirm/reimburse actions.
- notifications_or_confirmations: Inline update state preferred over toast for report reload.
- keyboard_and_focus_flow: Month selector and section tabs keyboard accessible; focus target after filter changes.

## Accessibility

- semantic_structure: Summary regions with headings; tables have headers; mobile lists retain labels.
- labels_and_instructions: Totals specify confirmed vs pending.
- error_announcements: Report load errors announced.
- focus_management: After month change, focus report heading.
- contrast_or_motion_notes: Status badges have text.
- keyboard_requirements: Section navigation and record links keyboard reachable.

## UI Copy Constraints

- domain_terms: confirmed income, confirmed expense, pending recurring item, refundable, reimbursed.
- required_messages: "Pending reminders are not included in confirmed totals."
- prohibited_or_sensitive_language: Avoid accounting terms not in domain.
- localization_notes: Currency, month, and category labels need locale.

## Frontend / Backend Expectations

- data_needed_by_ui: Monthly totals, category summaries, records, pending recurring items, reimbursement summary.
- user_actions_crossing_boundary: Fetch report, change month/filter.
- expected_success_responses: Report read model with traceable record ids.
- expected_error_responses: Not found/invalid month, permission denied, load failure.
- client_state_questions: Should reports cache by month?
- server_state_questions: Report read model composition and freshness.

## Tracking Draft

- learning_question:
  - event_or_signal: monthly_report_viewed
  - trigger: Report loaded
  - suggested_properties: month_offset, has_pending, has_refundable
  - privacy_notes: No amounts.

## Visual Model

- type: task_flow
- title: Monthly Report Flow
- nodes:
  - id: report
    label: Monthly report
    kind: screen
  - id: month
    label: Select month
    kind: decision
  - id: summary
    label: Review summary
    kind: screen
  - id: detail
    label: Open records or reimbursement
    kind: action
  - id: error
    label: Load error
    kind: error
- edges:
  - from: report
    to: month
    label: choose month
  - from: month
    to: summary
    label: loaded
  - from: summary
    to: detail
    label: trace total
  - from: month
    to: error
    label: failed
- states:
  - name: empty
    user_sees: No records for selected month
    user_can_do: Create allowed records
    recovery: Add record or choose another month

## Open Questions and Risks

- product: Should report include fund balance?
- UX: Mobile summary density.
- accessibility: Financial tables on mobile.
- content: Confirmed/pending wording.
- tracking: Provider unknown.
- technical_contract: Report freshness and traceability.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate monthly report scope.
- must_check:
  - Pending items excluded from totals.
  - Summary amounts trace to records.
- acceptance_signals:
  - Architecture can plan report read models.
- unresolved_blockers:
  - None for architecture planning.
- next_step:
  - architecture-planner
