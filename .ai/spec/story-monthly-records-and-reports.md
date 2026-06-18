---
id: story-monthly-records-and-reports
stage: story
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-home-family-fund
outputs:
  - user_story
  - acceptance_criteria_draft
  - experience_design_need
trace_links:
  domain_events:
    - Monthly records viewed
    - Monthly report generated
    - Monthly reimbursement table generated
  business_outcomes:
    - A household can complete one monthly cycle without spreadsheet recalculation.
    - Users can manage categories and use them consistently in monthly reports.
  bounded_contexts:
    - Reporting
    - Fund Ledger
    - Recurring Schedule
    - Reimbursement
  impact_analysis: []
  affected_code_areas:
    - empty_repo:no_existing_code_impact_found
reviewed_at:
---

# Monthly Records And Reports

## Delivery Profile
This story targets `local_dev` under the `mvp` release gate.

## User Story
As a household member, I want to view monthly records and reports, so that I can understand income, expenses, categories, pending recurring items, and reimbursement status for a selected month.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Monthly records viewed | Lets members inspect the underlying records. |
| Event | Monthly report generated | Produces monthly summary views. |
| Event | Monthly reimbursement table generated | Brings reimbursement status into monthly review. |
| Context | Reporting | Derives read models from ledger, recurring, category, and reimbursement data. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Existing code | Repository inspection | Empty repo; no report read models or UI exist. |
| Domain risk | DDD open questions | Exact mobile summary density is unresolved. |

## Draft Acceptance Criteria
- Authenticated members can select a month and view all household income and expense records for that month.
- Monthly totals separate confirmed income and confirmed expenses.
- Category summaries are available for income and expenses.
- Pending recurring items are visible but excluded from confirmed totals.
- Reimbursement status is visible at the monthly level.
- Members can trace summary amounts back to underlying records.
- Reports are read-only unless the member has permission to edit the underlying records.

## Experience Design Need
- experience_design_required: true
- reason: Monthly reports are a primary entry point and must be usable on desktop and mobile.
- user_facing_surfaces: Month selector, records table/list, category summaries, totals, pending reminders, reimbursement summary.
- UX_risks: Dense financial data can become hard to scan on mobile; summaries must not hide traceability.

## Visual Model

- type: story_trace
- title: Monthly Reports Trace
- nodes:
  - id: event_report_generated
    label: Monthly report generated
    kind: domain_event
  - id: event_records_viewed
    label: Monthly records viewed
    kind: domain_event
  - id: story_reports
    label: Monthly Records And Reports
    kind: story
  - id: outcome_monthly_visibility
    label: Monthly fund visibility
    kind: business_outcome
  - id: xd_reports
    label: Desktop and mobile report views
    kind: experience_design
- edges:
  - from: event_report_generated
    to: story_reports
    label: traced by
  - from: event_records_viewed
    to: story_reports
    label: traced by
  - from: story_reports
    to: outcome_monthly_visibility
    label: supports
  - from: story_reports
    to: xd_reports
    label: needs design

## Priority
P1. Reports are necessary to validate whether recording and recurring behavior produces useful monthly insight.

## Dependencies
- `story-ledger-entry-creation`
- `story-category-management`
- `story-recurring-rules-and-confirmation`
- `story-reimbursement-table-and-settlement`

## Open Questions
- Which report summaries are mandatory on mobile for MVP?
- Should reports include fund balance, or only income/expense/reimbursement status?

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate monthly report scope and traceability to records.
- must_check:
  - Pending recurring items are excluded from confirmed totals.
  - Summary values can be traced to records.
- acceptance_signals:
  - A household can review a month without spreadsheet recalculation.
- unresolved_blockers:
  - None for experience design.
- next_step:
  - experience-design
