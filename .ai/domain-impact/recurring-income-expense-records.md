---
id: domain-impact-recurring-income-expense-records
stage: domain-impact
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/recurring-income-expense-records.md
  - .ai/domain/home-family-fund.md
  - .ai/spec/story-recurring-rules-and-confirmation.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/recurring-income-expense-records.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-27
---

# Domain Impact for Recurring Income Expense Records

## Summary

- intent_id: recurring-income-expense-records
- maintained_domain_artifacts_updated: `.ai/domain/home-family-fund.md`
- bounded_contexts_touched: Recurring Schedule, Fund Ledger, Reimbursement, Reporting, Identity and Access, Responsive Web Experience
- impact_type: new_behavior, changed_policy, changed_state, changed_language

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Recurring occurrence; recurring occurrence confirmation; monthly fixed-day schedule; month-end schedule; user-facing `馬上入帳`; user-facing `提醒入帳`; user-facing `每月底`. | Pending recurring item now explicitly excludes income, expense, category, reimbursement, and searchable ledger totals before confirmation. | None. | Users need to distinguish expected financial activity from ledger truth, and month-end events need first-class language instead of hidden 31st-day behavior. |
| events | Immediate recurring occurrence posted; recurring reminder occurrence created; recurring reminder occurrence confirmed. | Prior recurring event names are tightened around occurrence identity rather than vague item creation. | None. | One recurring event can produce many monthly occurrences, so events must say which monthly fact happened. |
| commands | Post immediate recurring occurrence; create recurring reminder occurrence; confirm recurring reminder occurrence; delete recurring event. | Create recurring event carries member attribution, payment source, posting mode, and schedule anchor constraints. Rule changes are delete-and-recreate instead of in-place update. | Update recurring event command for the MVP slice. | Commands must drive prototype actions, BDD scenarios, and idempotent technical design without implying mutable recurring definitions. |
| policies | Event management is admin/finance-manager only for MVP; general members cannot manage recurring events. General members may confirm only self-attributed reminder occurrences. Monthly schedules are either fixed day 1-28 or explicit `每月底`. | Reminder confirmation follows ordinary ledger creation authority; immediate posting must be idempotent for event/month. | Implicit 29/30/31 fixed-day coercion. | The first slice should handle the provided 1st/15th examples and month-end expectations without ambiguous date conversion. |
| aggregates_or_invariants | Recurring occurrence identity is recurring event plus target year/month. Posted ledger records retain trace to event and occurrence. | RecurringEvent owns schedule anchor/posting policy; LedgerRecord owns financial truth after posting/confirmation. | None. | Duplicate prevention and correction boundaries need an explicit invariant before technical design. |
| bounded_contexts | Recurring Schedule feeds pending occurrence status to Reporting and creates ledger records through Fund Ledger. | Reimbursement is affected only after member-paid recurring expense occurrences become real ledger records. | None. | Member-paid recurring expenses must not become refundable before they are ledgered. |
| lifecycle_or_states | Pending reminder occurrence; posted immediate occurrence; confirmed reminder occurrence; already-completed duplicate attempt; deleted recurring event. | Deleting a recurring event stops future generation; already-posted ledger records remain independent financial facts. | In-place editing of recurring events in the MVP slice. | Users should not accidentally rewrite historical household finances by changing a recurring event. |

## Domain Decisions

- `馬上入帳` means a recurring occurrence creates one ordinary income or expense ledger record for the target event/month without a separate user confirmation step.
- `提醒入帳` means a recurring occurrence remains pending and does not affect ledger totals, category totals, reimbursement totals, or ordinary record search until an authorized member confirms it.
- A recurring occurrence is identified by recurring event plus target year/month. The app must not create two ledger records for the same completed occurrence.
- Monthly schedule choices are fixed day 1-28 or explicit `每月底` for the MVP slice. `每月底` resolves to the last calendar day of each target month, such as 1/31, 2/28 or 2/29 in a leap year, 4/30, and 11/30.
- Fixed day 29-31 is not offered as a general fixed-day rule in MVP. If a user starts from a 29th, 30th, or 31st date, the UI should offer or default to explicit `每月底` and make that choice visible.
- Admins and finance managers can create and delete recurring events. General members cannot manage recurring events in the MVP slice.
- Reminder confirmation follows ordinary ledger creation authority: admins and finance managers can confirm for any member; a general member can confirm only when the resulting ledger record is attributed to themselves.
- A member-paid recurring expense becomes reimbursement-eligible only after immediate posting or reminder confirmation creates the ledger record.
- Recurring events are not edited in place in the MVP slice. To change amount, category, member attribution, payment source, schedule, or posting mode, the manager deletes the existing recurring event and creates a replacement.
- Deleting a recurring event stops future occurrence generation. Already-posted ledger records remain ledger facts and require ordinary ledger correction/deletion workflows if wrong.
- In-app pending reminders are enough for MVP. External notifications, background delivery channels, and production scheduler guarantees are out of scope until a later release gate selects them.

## Downstream Impact

- prototype_states_or_flows:
  - Recurring event setup must make `馬上入帳` versus `提醒入帳` visually and textually unambiguous.
  - Event forms need schedule-anchor selection for fixed day 1-28 or `每月底`, amount, category, income/expense type, member attribution, and expense payment source.
  - Event management lists need a delete action and should not expose edit controls in the MVP.
  - Monthly views need pending reminder occurrences separated from posted ledger records.
  - Reminder confirmation needs a clear final action and should expose when confirmation will create a member-paid refundable expense.
  - Duplicate/already-posted states need a non-destructive message rather than another ledger write.
- bdd_scenarios:
  - Admin or finance manager creates a rent income event on day 1 with `提醒入帳`; the pending item is excluded from totals until confirmed.
  - Admin or finance manager creates a month-end rule from 1/31; February occurrence lands on 2/28 or 2/29 in a leap year and November occurrence lands on 11/30.
  - Authorized member confirms the rent reminder; one income ledger record is created with recurring trace.
  - Admin or finance manager creates an internet fee expense rule on day 15 with `馬上入帳` and member-paid source; one member-paid expense is created and becomes refundable.
  - A second posting/confirmation attempt for the same event/month does not create a duplicate record.
  - A general member cannot create or delete a recurring event.
  - A general member cannot confirm another member's pending recurring occurrence.
- technical_design_boundaries:
  - Recurring Schedule owns event state, occurrence identity, posting mode, and pending/posted occurrence status.
  - Fund Ledger owns the created income/expense record and should receive a normal ledger creation command with recurring trace.
  - Reimbursement reads member-paid ledger records after creation; it should not know about pending recurring reminders.
  - Reporting reads pending recurring occurrences separately from ledger records and must keep them out of financial totals.
  - Identity and Access authorizes event management and confirmation at the command boundary.
  - Persistence must store the schedule anchor as fixed day or month-end rather than inferring month-end from the number 31.
  - Persistence must enforce idempotency for recurring event plus target year/month, whether occurrences are persisted eagerly or derived on demand.
- tdd_domain_tests:
  - Creating an event validates actor role, fixed day 1-28 or month-end schedule anchor, category/type compatibility, amount, and member/payment-source shape.
  - Deleting an event validates actor role and prevents future occurrence generation without mutating already-posted ledger records.
  - Month-end schedule resolves to the correct last calendar day for months with 28, 29, 30, and 31 days.
  - Immediate income occurrence creates exactly one income record for the target month.
  - Immediate member-paid expense occurrence creates exactly one refundable member-paid expense.
  - Reminder occurrence is visible as pending but excluded from totals before confirmation.
  - Reminder confirmation creates one ledger record and rejects duplicate confirmation.
  - General-member event management and cross-member confirmation are rejected.
  - The MVP rejects in-place event update attempts; changing a rule requires delete-and-recreate.
- release_or_learning_signals:
  - Local_dev readiness should include schema/migration evidence if recurring event or occurrence tables are added.
  - Local review should check whether users understand that pending reminders are not counted money.
  - Learning should check whether `馬上入帳` causes accidental records or whether users expect one more review step.

## Open Questions and Risks

- product:
  - Should the UI later support pausing, ending, duplicating, or in-place editing recurring events after the MVP delete-and-recreate rule?
  - Should reminder confirmation allow edits to amount, date, category, note, payment source, or payer before posting?
- domain:
  - Missed-month catch-up remains unresolved. The MVP domain allows on-demand month handling, but technical design must avoid silent multi-month backfill without review.
  - Fixed day 29-31 support is deferred. This is intentionally separate from `每月底`; users who need the last day of every month should use month-end.
- data_or_ownership:
  - Technical design must choose persisted occurrences versus derived occurrences with a completion ledger, but either design must enforce one completion per event/month.
  - Posted ledger records need enough recurring trace for audit without making LedgerRecord depend on deleted or replaced event fields.
- policy_or_permission:
  - Finance-manager event management is approved for MVP; if this feels too broad in review, the prototype/spec must narrow it before implementation.
  - General-member self-confirmation may still be too permissive if the household wants finance-manager review for all reminders.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm admin and finance manager can create and delete recurring events, while general members cannot.
  - Confirm fixed day 1-28 plus explicit `每月底` are acceptable for the MVP slice.
  - Confirm general members may self-confirm reminder occurrences under ordinary ledger rules.
  - Confirm updating a rule affects future occurrences only and never rewrites posted ledger records.
- must_check:
  - Durable domain model is updated in `.ai/domain/home-family-fund.md`.
  - Prototype, BDD, and technical design consume occurrence identity, pending-total exclusion, and duplicate-prevention rules.
  - Member-paid recurring expenses enter reimbursement only after posting or confirmation creates a real ledger record.
- acceptance_signals:
  - Experience Prototype can design event setup, posting mode selection, pending reminders, and confirmation states.
  - Behavior Spec can define duplicate-prevention and authorization scenarios.
  - Technical Design can decide persistence, idempotency, command boundaries, and reporting joins.
- unresolved_blockers:
  - Pausing, in-place editing, missed-month handling, editable confirmation fields, and persisted-versus-derived occurrence storage need downstream decisions.
- next_step:
  - Experience Prototype for `recurring-income-expense-records`.
