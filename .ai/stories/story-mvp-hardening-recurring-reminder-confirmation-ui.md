---
id: story-mvp-hardening-recurring-reminder-confirmation-ui
stage: story
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-home-family-fund
  - cu-home-family-fund
  - ia-home-family-fund-mvp-hardening
  - story-recurring-rules-and-confirmation
outputs:
  - user_story
  - acceptance_criteria_draft
  - experience_design_need
trace_links:
  domain_events:
    - Recurring reminder created
    - Recurring reminder confirmed
    - Income recorded
    - Expense recorded
    - Monthly report generated
  business_outcomes:
    - Users can identify which reminder-based recurring items are pending.
    - A household can complete one monthly cycle of recurring items without spreadsheet recalculation.
  bounded_contexts:
    - Recurring Schedule
    - Fund Ledger
    - Reporting
    - Identity and Access
    - Responsive Web Experience
  impact_analysis:
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
  affected_code_areas:
    - src/modules/recurring-schedule/recurring-rules.ts
    - src/modules/fund-ledger/ledger-record-command.ts
    - src/app/page.tsx
    - src/app/home-dashboard-data-source.ts
    - e2e/home.spec.ts
reviewed_at:
---

# MVP Hardening: Recurring Reminder Confirmation UI

## Delivery Profile
This completion story targets `local_dev` under the MVP release gate. It completes the missing browser path for confirming reminder-based recurring items into ledger records.

## User Story
As an authorized household member, I want to confirm a pending recurring reminder from the monthly dashboard, so that expected income or expense becomes a real ledger record only when it actually happened.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Recurring reminder created | The user starts from a pending item visible in the month. |
| Event | Recurring reminder confirmed | Confirmation turns the pending item into an actual record. |
| Policy | Reminder-based items do not affect totals until confirmed | Dashboard totals must change only after confirmation. |
| Policy | Duplicate rule/month occurrence is prevented | Confirmation must be idempotent or conflict-safe. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Original story | `.ai/stories/story-recurring-rules-and-confirmation.md` | This is a completion slice for missing UI/persistence confirmation path. |
| Recurring domain module | `src/modules/recurring-schedule/recurring-rules.ts` | Pure rules exist; app action/persistence wrapper is needed. |
| Dashboard data source | `src/app/home-dashboard-data-source.ts` | Pending occurrences are already loaded for the dashboard. |
| E2E hardening | `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | Confirmation E2E should follow DB-backed dashboard coverage. |

## Draft Acceptance Criteria
- Pending reminder-based recurring items are visible for the selected month.
- Authorized users can confirm a pending recurring item.
- Confirmation creates the corresponding income or expense ledger record.
- Confirmed records preserve trace to the recurring rule or occurrence.
- Confirmed records are included in monthly totals after confirmation.
- The pending item is no longer shown as pending after successful confirmation.
- Duplicate confirmation for the same rule/month is rejected or treated as already confirmed without duplicate ledger records.

## Experience Design Need
- experience_design_required: true
- reason: Confirmation is a user-facing state transition with financial totals impact.
- user_facing_surfaces: Pending recurring section, confirm action, confirmation feedback, duplicate/conflict error state.
- UX_risks: Users must understand that pending reminders are not counted until confirmation.

## Visual Model

- type: story_trace
- title: Recurring Reminder Confirmation UI Trace
- nodes:
  - id: event_reminder_created
    label: Recurring reminder created
    kind: domain_event
  - id: event_reminder_confirmed
    label: Recurring reminder confirmed
    kind: domain_event
  - id: story_recurring_confirm
    label: Recurring reminder confirmation UI
    kind: story
  - id: outcome_monthly_cycle
    label: Recurring monthly cycle completed
    kind: business_outcome
  - id: code_recurring
    label: Recurring + ledger persistence
    kind: code_impact
  - id: xd_pending_confirm
    label: Pending item confirmation UX
    kind: experience_design
- edges:
  - from: event_reminder_created
    to: story_recurring_confirm
    label: starts
  - from: story_recurring_confirm
    to: event_reminder_confirmed
    label: causes
  - from: event_reminder_confirmed
    to: outcome_monthly_cycle
    label: supports
  - from: story_recurring_confirm
    to: code_recurring
    label: requires
  - from: story_recurring_confirm
    to: xd_pending_confirm
    label: needs design

## Priority
P3. It is important for MVP recurring behavior but can follow DB-backed dashboard and create-record flow, because it depends on reliable ledger/report assertions.

## Dependencies
- `story-mvp-hardening-db-backed-dashboard-e2e`
- `story-mvp-hardening-browser-create-record-flow`
- Domain/policy decision already accepted: reminder items do not affect totals until confirmed.

## Open Questions
- Which roles can confirm recurring reminders in the UI: admins, finance managers, members tied to the source/payer, or any active member?
- Should confirmation happen inline or through a confirmation dialog?

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm who is allowed to confirm pending reminders before experience design.
- must_check:
  - Pending reminders do not affect totals before confirmation.
  - Confirmation cannot create duplicate ledger records.
- acceptance_signals:
  - Browser flow proves pending-to-confirmed transition against DB-backed data.
- unresolved_blockers:
  - Confirmation role policy needs product confirmation before implementation.
- next_step:
  - experience-design
