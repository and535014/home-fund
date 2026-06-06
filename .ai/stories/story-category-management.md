---
id: story-category-management
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
    - Category created
    - Category updated
  business_outcomes:
    - Users can manage categories and use them consistently in monthly reports.
  bounded_contexts:
    - Categorization
    - Fund Ledger
    - Reporting
  impact_analysis: []
  affected_code_areas:
    - empty_repo:no_existing_code_impact_found
reviewed_at:
---

# Category Management

## Delivery Profile
This story targets `local_dev` under the `mvp` release gate.

## User Story
As an authorized household manager, I want to manage income and expense categories, so that records and monthly reports use categories that match the household's language.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Category created | Adds usable classification options. |
| Event | Category updated | Keeps category labels useful over time. |
| Aggregate | CategoryCatalog | Owns category validity and status. |
| Context | Reporting | Uses categories for monthly summaries. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Existing code | Repository inspection | Empty repo; no category storage or UI exists. |
| Domain risk | DDD open questions | Exact roles that manage categories are unresolved. |

## Draft Acceptance Criteria
- Authorized users can create income categories and expense categories.
- Authorized users can update category names.
- Categories can be made unavailable for future use without breaking historical records.
- Income and expense entry forms use available categories.
- Monthly reports can group records by category.
- Unauthorized users cannot manage categories.

## Experience Design Need
- experience_design_required: true
- reason: Category management and category selection are visible in settings, entry creation, and reports.
- user_facing_surfaces: Category management page, category picker in forms, category labels in reports.
- UX_risks: Archived categories must remain understandable on historical records.

## Visual Model

- type: story_trace
- title: Category Management Trace
- nodes:
  - id: event_category_created
    label: Category created
    kind: domain_event
  - id: story_categories
    label: Category Management
    kind: story
  - id: outcome_reports
    label: Consistent category reports
    kind: business_outcome
  - id: xd_categories
    label: Category forms and pickers
    kind: experience_design
- edges:
  - from: event_category_created
    to: story_categories
    label: traced by
  - from: story_categories
    to: outcome_reports
    label: supports
  - from: story_categories
    to: xd_categories
    label: needs design

## Priority
P1. Categories are required before useful income, expense, and report flows can be validated.

## Dependencies
- `story-authenticated-household-access`
- Domain decision: category management role.

## Open Questions
- Can finance managers manage categories, or only admins?
- Are category types strictly income/expense, or can some categories be shared?

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate category lifecycle and permissions.
- must_check:
  - Historical records remain understandable if a category is archived.
  - Entry and reporting stories can consume categories.
- acceptance_signals:
  - Category choices are available for later ledger and report stories.
- unresolved_blockers:
  - None for experience design.
- next_step:
  - experience-design
