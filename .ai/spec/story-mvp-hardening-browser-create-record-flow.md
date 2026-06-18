---
id: story-mvp-hardening-browser-create-record-flow
stage: story
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-home-family-fund
  - cu-home-family-fund
  - ia-home-family-fund-mvp-hardening
  - story-ledger-entry-creation
outputs:
  - user_story
  - acceptance_criteria_draft
  - experience_design_need
trace_links:
  domain_events:
    - Income recorded
    - Expense recorded
    - Member-paid expense became refundable
    - Monthly report generated
    - Monthly reimbursement table generated
  business_outcomes:
    - A household can complete one monthly cycle of contributions and expenses without spreadsheet recalculation.
  bounded_contexts:
    - Fund Ledger
    - Categorization
    - Reporting
    - Reimbursement
    - Responsive Web Experience
  impact_analysis:
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
  affected_code_areas:
    - src/app/record-entry-panel.tsx
    - src/app/ledger-record-actions.ts
    - src/app/ledger-record-form.ts
    - src/modules/fund-ledger/ledger-record-command.ts
    - src/app/home-dashboard-data-source.ts
    - e2e/home.spec.ts
reviewed_at:
---

# MVP Hardening: Browser Create-Record Flow

## Delivery Profile
This completion story targets `local_dev` under the MVP release gate. It completes browser/database verification for the existing ledger entry creation capability.

## User Story
As a household member, I want to create income, fund-paid expenses, and member-paid expenses through the browser and see the dashboard update, so that the app proves the real monthly ledger workflow rather than only pure domain rules.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Income recorded | Confirms received household money is persisted and visible. |
| Event | Expense recorded | Confirms spending is persisted and visible. |
| Event | Member-paid expense became refundable | Confirms member-paid expenses feed reimbursement. |
| Policy | General members act only on self-owned records | Create flow must respect authorization. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Existing original story | `.ai/spec/story-ledger-entry-creation.md` | This is a completion slice, not a replacement story. |
| Server action | `src/app/ledger-record-actions.ts` | Browser form must submit through real server action and persist rows. |
| Dashboard read model | `src/app/home-dashboard-data-source.ts` | Created records must be visible through DB-backed dashboard reads. |
| E2E gap | `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | Current E2E does not submit create-record forms against DB data. |

## Draft Acceptance Criteria
- A linked member can create an income record through the browser.
- A linked member can create a fund-paid expense through the browser and it appears in monthly expense totals but not refundable totals.
- A linked member can create a member-paid expense through the browser and it appears in monthly expense totals and the reimbursement table.
- Successful creation shows existing success feedback and redirects back to the selected month.
- Validation or permission errors are shown without losing the user's selected create intent.
- DB-backed E2E verifies persisted rows by observing updated dashboard/report/reimbursement output.

## Experience Design Need
- experience_design_required: true
- reason: The form already exists, but this completion story exercises visible validation, success, and error states through the browser.
- user_facing_surfaces: Existing create income/expense dialog, category selector, member selector, payment source control, success/error feedback.
- UX_risks: Users must distinguish fund-paid expense from member-paid expense and understand why member-paid affects reimbursement.

## Visual Model

- type: story_trace
- title: Browser Create-Record Completion Trace
- nodes:
  - id: event_income
    label: Income recorded
    kind: domain_event
  - id: event_expense
    label: Expense recorded
    kind: domain_event
  - id: story_create_browser
    label: Browser create-record flow
    kind: story
  - id: outcome_monthly_cycle
    label: Monthly cycle verified in app
    kind: business_outcome
  - id: code_server_action
    label: createLedgerRecordAction
    kind: code_impact
  - id: xd_form_states
    label: Form validation and feedback
    kind: experience_design
- edges:
  - from: event_income
    to: story_create_browser
    label: traced by
  - from: event_expense
    to: story_create_browser
    label: traced by
  - from: story_create_browser
    to: outcome_monthly_cycle
    label: proves
  - from: story_create_browser
    to: code_server_action
    label: exercises
  - from: story_create_browser
    to: xd_form_states
    label: needs review

## Priority
P1. This follows DB-backed dashboard E2E because creation needs a reliable real-data dashboard assertion target.

## Dependencies
- `story-mvp-hardening-db-backed-dashboard-e2e`
- `story-mvp-hardening-controlled-auth-session-e2e` if role-specific create behavior cannot be safely represented by the existing test fixture.

## Open Questions
- Should this story include only finance-manager creation, or also general-member self-only creation in the same slice?
- Should validation copy be refined before E2E asserts exact messages?

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm this story closes the original ledger-entry creation verification gap.
- must_check:
  - Member-paid expense appears in reimbursement after creation.
  - Fund-paid expense remains excluded from reimbursement.
- acceptance_signals:
  - Browser flow proves real persistence and dashboard update for income and expense records.
- unresolved_blockers:
  - None for story slicing.
- next_step:
  - experience-design
