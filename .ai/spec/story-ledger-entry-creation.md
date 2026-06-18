---
id: story-ledger-entry-creation
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
    - Income recorded
    - Expense recorded
    - Member-paid expense became refundable
  business_outcomes:
    - A household can complete one monthly cycle of contributions and expenses without spreadsheet recalculation.
    - Users can see each member's monthly reimbursement amount and trace it back to individual expenses.
  bounded_contexts:
    - Fund Ledger
    - Categorization
    - Reimbursement
  impact_analysis: []
  affected_code_areas:
    - empty_repo:no_existing_code_impact_found
reviewed_at:
---

# Ledger Entry Creation

## Delivery Profile
This story targets `local_dev` under the `mvp` release gate.

## User Story
As a household member, I want to create income and expense records with categories, dates, payer/source members, and payment source, so that the monthly fund ledger reflects money received and whether expenses should be reimbursed.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Income recorded | Adds confirmed money to the household fund ledger. |
| Event | Expense recorded | Captures spending paid from the fund or upfront by a member. |
| Event | Member-paid expense became refundable | Makes member-paid expenses visible in the reimbursement table as refundable until reimbursed. |
| Policy | General member payer/source must be themselves | Enforces record creation permissions. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Existing code | Repository inspection | Empty repo; no ledger model, forms, or persistence exist. |
| Domain risk | DDD open questions | Expense split rules are unresolved; MVP assumes one category and one payer. |

## Draft Acceptance Criteria
- Authenticated members can create income records for themselves with amount, date or month, category, source member, and optional notes.
- Authenticated members can create expense records for themselves with amount, date or month, category, payment source, payer member when member-paid, and optional notes.
- Admins and finance managers can create income or expenses on behalf of other members.
- General members cannot create records where the payer/source member is another member.
- Fund-paid expenses do not appear in the reimbursement table.
- Expenses paid upfront by a member are treated as refundable/unreimbursed and appear in the reimbursement table until a finance manager marks them reimbursed.
- Created records appear in monthly record browsing and report inputs.

## Experience Design Need
- experience_design_required: true
- reason: The create-entry entry point and income/expense forms are central user-facing workflows.
- user_facing_surfaces: Create-entry entry point, income form, expense form, category selector, payment source control, payer/source selector, refundable status indication.
- UX_risks: Users need to understand payer/source member versus record creator, and that refund status is changed later by finance managers.

## Visual Model

- type: story_trace
- title: Ledger Entry Creation Trace
- nodes:
  - id: event_income_recorded
    label: Income recorded
    kind: domain_event
  - id: event_expense_recorded
    label: Expense recorded
    kind: domain_event
  - id: story_ledger_entry
    label: Ledger Entry Creation
    kind: story
  - id: outcome_monthly_cycle
    label: Monthly cycle without spreadsheet recalculation
    kind: business_outcome
  - id: xd_entry_forms
    label: Income and expense forms
    kind: experience_design
- edges:
  - from: event_income_recorded
    to: story_ledger_entry
    label: traced by
  - from: event_expense_recorded
    to: story_ledger_entry
    label: traced by
  - from: story_ledger_entry
    to: outcome_monthly_cycle
    label: enables
  - from: story_ledger_entry
    to: xd_entry_forms
    label: needs design

## Priority
P0. This is the core value slice for recording shared household money.

## Dependencies
- `story-authenticated-household-access`
- `story-category-management`

## Open Questions
- Should member-paid reimbursement status always be inferred from payment source, or can a member-paid expense be explicitly excluded from reimbursement?
- Should household contributions such as rent and living expenses be a special income type?

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate income, expense, payment source, payer/source, refundable, and reimbursed language.
- must_check:
  - General members cannot create records for other members.
  - Member-paid expenses trace to individual expense records and remain refundable/unreimbursed until marked reimbursed.
- acceptance_signals:
  - A household can enter real monthly income and expense examples.
- unresolved_blockers:
  - None for experience design.
- next_step:
  - experience-design
