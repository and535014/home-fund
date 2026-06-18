---
id: proto-recurring-reminder-confirmation-ui
stage: prototype
status: accepted
delivery_profile: mvp
release_target: local_dev
workflow_version: ddd-website-lifecycle-v2
inputs:
  - story-mvp-hardening-recurring-reminder-confirmation-ui
  - story-recurring-rules-and-confirmation
  - web-foundation
outputs:
  - production_stack_prototype
  - user_journey
  - task_flow
  - screen_states
  - ux_acceptance_criteria_draft
  - e2e_scenario_draft
  - handoff_to_behavior_spec
trace_links:
  stories:
    - .ai/spec/story-mvp-hardening-recurring-reminder-confirmation-ui.md
    - .ai/spec/story-recurring-rules-and-confirmation.md
  domain_events:
    - Recurring reminder created
    - Recurring reminder confirmed
    - Income recorded
    - Expense recorded
    - Monthly report generated
  prototype_components:
    - src/app/prototypes/recurring-reminder-confirmation/page.tsx
    - src/app/prototypes/recurring-reminder-confirmation/recurring-reminder-confirmation-prototype.tsx
reviewed_at: 2026-06-18
---

# Experience Prototype for Recurring Reminder Confirmation UI

## Prototype Evidence

- prototype_type: production-stack app route
- route_path: `/prototypes/recurring-reminder-confirmation`
- component_paths:
  - `src/app/prototypes/recurring-reminder-confirmation/page.tsx`
  - `src/app/prototypes/recurring-reminder-confirmation/recurring-reminder-confirmation-prototype.tsx`
- component_library_usage: Existing `HomeDashboardLayout`, `Button`, `Card`, `Dialog`, `Alert`, `Badge`, and `Table` components.
- run_command: `npm run dev`
- review_url: `http://localhost:3000/prototypes/recurring-reminder-confirmation`
- fixture_strategy: In-component fixture data mirrors June 2026 local seed shape: pending Kai living-fee reminder for `$80,000`, existing dashboard ledger rows, and local scenario states.
- states_covered: normal pending, confirmation dialog, loading, success, empty, permission denied, already-confirmed conflict.
- responsive_baseline: Uses existing dashboard shell and responsive Tailwind grid; pending panel stacks with main record table on narrow viewports.
- keyboard_focus_behavior: Existing Dialog component handles modal semantics; confirm action is a real button; Escape/cancel closes through Dialog behavior.
- accessibility_notes: Section headings, visible button labels, alert roles through existing Alert component, non-color status labels, dialog title and description.
- known_gaps: Fixture-only; no Prisma/server action integration, no persisted state, no E2E assertions yet, and no automated accessibility scan.

## Experience Summary

- primary_user: Authorized household member viewing the monthly dashboard.
- user_goal: Confirm a pending recurring reminder only after the expected income or expense happened.
- business_outcome: The pending reminder becomes a real ledger record, enters monthly totals, and disappears from the pending list.
- release_target: local_dev
- delivery_profile: mvp
- web_foundation: `.ai/prototype/web-foundation.md`

## Product / Policy Decision Draft

- confirmation_permission: Use the resulting ledger record creation permission rather than recurring-rule management permission.
- rationale: Confirmation is not editing the recurring rule; it asserts that a real income/expense happened and creates a ledger record.
- user_effect:
  - Admin and finance manager can confirm reminders for any member.
  - A general member can confirm only reminders that create their own income or expense record.
  - A general member cannot confirm a reminder that creates another member's record.
- implementation_note: Server-side confirmation must re-run the same ledger creation authorization after loading the occurrence and rule.
- unresolved_policy_risk: If product wants only admins/recurring managers to confirm all reminders, Behavior Spec must revise this before implementation.

## User Journey

| Step | User Intent | System Response | Domain / Story Link |
|---|---|---|---|
| 1 | Review selected month | Shows pending recurring reminders separately from confirmed records | Recurring reminder created |
| 2 | Understand accounting impact | Pending reminder says it is not counted in totals yet | Reminder-based items do not affect totals until confirmed |
| 3 | Confirm the item happened | Opens confirmation dialog summarizing date, type, and amount | Recurring reminder confirmed |
| 4 | Complete confirmation | Creates corresponding ledger record and marks occurrence posted | Income recorded / Expense recorded |
| 5 | Verify result | Pending item disappears; monthly totals and record count update | Monthly report generated |

## Task Flow

- entry_point: Dashboard-like prototype route at `/prototypes/recurring-reminder-confirmation`.
- primary_path: Review pending item -> click `確認入帳` -> confirm dialog -> submit -> simulated dashboard updates with new ledger record and no pending item.
- alternate_paths: Empty month -> no action; permission denied -> localized alert and disabled action; already confirmed -> localized conflict alert and disabled action; cancel dialog -> no mutation.
- exit_or_completion: User remains in selected month context.
- recovery_paths: Error keeps the pending context visible and explains permission or stale-state cause.

## Information Architecture

- baseline_artifact: not_needed
- ia_impact: local
- route_or_screen_delta: Production implementation should enhance the existing dashboard `待確認週期項目` section; prototype uses a sandbox route only for review.
- navigation_delta: No primary navigation change.
- page_hierarchy_delta: `待確認週期項目` becomes an interactive confirmation workflow.
- user_path_delta: Authorized users complete reminder confirmation without leaving the monthly dashboard.
- permission_visibility_delta: `確認入帳` appears/enables only when the current member can create the resulting ledger record.
- seo_or_metadata_delta: None.
- primary_content: Pending reminder title, effective date, amount, record type/category, confirmation command.
- secondary_content: Empty state, success status, permission/conflict feedback, policy explainer.
- content_priority: "尚未計入本月總額" and amount/type must stay visible before confirmation.

## Screen States

| State | User Sees | User Can Do | Data / System Need | Risk |
|---|---|---|---|---|
| normal | Pending reminder row with amount/date/type and `確認入帳` | Open confirmation dialog | Pending occurrence with linked rule details | User may confuse pending reminder with confirmed record |
| confirmation | Dialog with reminder summary | Confirm or cancel | Occurrence id, rule id, target month | Wrong item confirmation if summary is vague |
| loading | Confirm button spinner/disabled | Wait | Server action transaction | Duplicate submit risk |
| success | New ledger row appears, totals update, pending item removed | Continue reviewing dashboard | Revalidated dashboard read model | User may need trace to rule later |
| empty | "沒有待確認項目" row | Nothing | No pending occurrences | Must avoid inactive financial action clutter |
| permission | Inline alert and disabled action | Return to dashboard | Current member + resulting record owner | UI hiding alone is insufficient |
| conflict | Inline alert: already confirmed/stale | Refresh/retry | Occurrence status from DB | Duplicate ledger records must not happen |

## UX Acceptance Criteria Draft

- AC-UX1:
  - observable_condition: Pending recurring reminders are visible in the monthly dashboard and explicitly marked as not counted in totals.
  - covered_states: normal, empty
  - accessibility_expectation: Section heading `待確認週期項目`; each action has a visible label.
  - responsive_expectation: Pending row stacks without horizontal overflow on mobile.
- AC-UX2:
  - observable_condition: Authorized users can open a confirmation dialog before creating a ledger record.
  - covered_states: normal, confirmation, loading
  - accessibility_expectation: Dialog has title, description, cancel, confirm, and focus management through existing Dialog component.
  - responsive_expectation: Dialog fits mobile viewport.
- AC-UX3:
  - observable_condition: After successful confirmation, the reminder disappears and monthly totals/record count update.
  - covered_states: success
  - accessibility_expectation: Success state is visible text and not color-only.
  - responsive_expectation: Updated dashboard remains readable in one-column mobile layout.
- AC-UX4:
  - observable_condition: Permission denied and already-confirmed conflicts show localized inline feedback and do not create duplicate records.
  - covered_states: permission, conflict
  - accessibility_expectation: Errors use existing Alert component semantics.
  - responsive_expectation: Error copy wraps within the panel.

## E2E Scenario Draft

- scenario: Authorized member confirms a pending recurring income reminder
  - route: `/?month=2026-06`
  - viewport: Desktop Chromium
  - given: DB seed has pending `occurrence-living-kai` / `rule-living-kai`, and Kai or finance manager is authenticated
  - when: User clicks `確認入帳`, confirms dialog
  - then: Pending section shows no item, ledger table includes the created income record, confirmed income/net totals increase
  - states_covered: normal, confirmation, loading, success
  - selectors_or_accessible_names: `待確認週期項目`, `確認入帳`, `確認週期項目`, created record name
  - mock_or_fixture_needs: DB-backed E2E and controlled auth
- scenario: Unauthorized member cannot confirm another member's reminder
  - route: `/?month=2026-06`
  - viewport: Desktop Chromium
  - given: Mei is authenticated and pending reminder would create Kai's income record
  - when: Mei views the pending section or attempts direct action
  - then: Confirmation control is hidden/disabled or action returns permission feedback; totals remain unchanged
  - states_covered: permission
- scenario: Already confirmed reminder is rejected without duplicate ledger record
  - route: action/integration or DB E2E
  - viewport: Desktop or integration
  - given: Occurrence status is already `posted`
  - when: Confirm action is submitted again
  - then: Conflict feedback appears and only one ledger record remains linked
  - states_covered: conflict

## Frontend / Backend Expectations

- data_needed_by_ui: Pending occurrence id, recurring rule id, month, amount, type, category name, source/payer member display name, current member confirmation action hint.
- user_actions_crossing_boundary: New confirm recurring occurrence server action.
- expected_success_responses: Redirect/revalidate selected month dashboard with pending item removed and created ledger record visible.
- expected_error_responses: Same month dashboard with localized error reason and unchanged totals.
- client_state_questions: Confirmation dialog can be local client state; selected occurrence resets after redirect.
- server_state_questions: Server action must re-check occurrence status, rule match, category validity, and ledger creation authorization before transaction write.

## Tracking Draft

- learning_question:
  - event_or_signal: recurring_reminder_confirmed
  - trigger: Successful confirmation action
  - suggested_properties: type, category_group, role, month_offset
  - privacy_notes: Do not send exact amount, member name, note, occurrence id, or ledger record id.

## Prototype Review Notes

- The prototype route has scenario buttons for review: normal, empty, permission, conflict.
- The success path demonstrates the key mental model: `$80,000` moves from `待確認` into confirmed income and net total.
- The prototype intentionally keeps recurring rule management out of scope; this slice confirms existing pending occurrences only.
- Prototype code should be treated as review evidence. Feature Technical Design should decide whether to reuse, reshape, or discard the route-local prototype component.

## Open Questions and Risks

- product: Confirm whether ledger-record creation authorization is the desired policy for confirmation.
- UX: If many pending reminders appear, per-row confirmation may need a denser list or bulk affordance later.
- accessibility: Implementation should keep existing Dialog semantics and add E2E keyboard coverage if behavior becomes complex.
- content: Exact created ledger record name should be finalized during Behavior Spec or Technical Design.
- technical_contract: Persistence must update `RecurringOccurrence.status`, set `ledgerRecordId`, and create the ledger record transactionally.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm confirmation permission policy.
  - Confirm inline dashboard confirmation and dialog pattern.
  - Confirm production-stack prototype coverage is sufficient for Behavior Spec.
- must_check:
  - Pending reminders do not affect totals before confirmation.
  - Confirmation creates one ledger record and removes the pending item.
  - Duplicate confirmation is rejected or treated as already confirmed without duplicate ledger records.
- acceptance_signals:
  - Behavior Spec can define AC/BDD/E2E from this prototype.
- unresolved_blockers:
  - Permission policy needs explicit acceptance before implementation.
- next_step:
  - verification-design
