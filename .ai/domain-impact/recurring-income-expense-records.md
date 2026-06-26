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
| ubiquitous_language | Recurring occurrence; recurring occurrence confirmation; user-facing `馬上入帳`; user-facing `提醒入帳`. | Pending recurring item now explicitly excludes income, expense, category, reimbursement, and searchable ledger totals before confirmation. | None. | Users need to distinguish expected financial activity from ledger truth. |
| events | Immediate recurring occurrence posted; recurring reminder occurrence created; recurring reminder occurrence confirmed. | Prior recurring event names are tightened around occurrence identity rather than vague item creation. | None. | One recurring rule can produce many monthly occurrences, so events must say which monthly fact happened. |
| commands | Post immediate recurring occurrence; create recurring reminder occurrence; confirm recurring reminder occurrence. | Create/update recurring rule now carries member attribution, payment source, posting mode, and monthly day-of-month constraints. | None. | Commands must drive prototype actions, BDD scenarios, and idempotent technical design. |
| policies | Rule management is admin/finance-manager only for MVP; general members cannot manage recurring rules. General members may confirm only self-attributed reminder occurrences. Monthly schedule values are 1-28 in MVP. | Reminder confirmation follows ordinary ledger creation authority; immediate posting must be idempotent for rule/month. | Day 29-31 handling from MVP scope. | The first slice should handle the provided 1st/15th examples without inventing ambiguous month-end behavior. |
| aggregates_or_invariants | Recurring occurrence identity is recurring rule plus target year/month. Posted ledger records retain trace to rule and occurrence. | RecurringRule owns schedule/posting policy; LedgerRecord owns financial truth after posting/confirmation. | None. | Duplicate prevention and correction boundaries need an explicit invariant before technical design. |
| bounded_contexts | Recurring Schedule feeds pending occurrence status to Reporting and creates ledger records through Fund Ledger. | Reimbursement is affected only after member-paid recurring expense occurrences become real ledger records. | None. | Member-paid recurring expenses must not become refundable before they are ledgered. |
| lifecycle_or_states | Pending reminder occurrence; posted immediate occurrence; confirmed reminder occurrence; already-completed duplicate attempt. | Editing a recurring rule affects future occurrences only; already-posted ledger records remain independent financial facts. | None. | Users should not accidentally rewrite historical household finances by changing a recurring rule. |

## Domain Decisions

- `馬上入帳` means a recurring occurrence creates one ordinary income or expense ledger record for the target rule/month without a separate user confirmation step.
- `提醒入帳` means a recurring occurrence remains pending and does not affect ledger totals, category totals, reimbursement totals, or ordinary record search until an authorized member confirms it.
- A recurring occurrence is identified by recurring rule plus target year/month. The app must not create two ledger records for the same completed occurrence.
- Monthly schedule choices are limited to days 1-28 for the MVP slice. Day 29-31, last-day-of-month, skipped-month, and business-day policies are deferred.
- Admins and finance managers can create and update recurring rules. General members cannot manage recurring rules in the MVP slice.
- Reminder confirmation follows ordinary ledger creation authority: admins and finance managers can confirm for any member; a general member can confirm only when the resulting ledger record is attributed to themselves.
- A member-paid recurring expense becomes reimbursement-eligible only after immediate posting or reminder confirmation creates the ledger record.
- Updating a recurring rule changes future occurrences only. Already-posted ledger records remain ledger facts and require ordinary ledger correction/deletion workflows if wrong.
- In-app pending reminders are enough for MVP. External notifications, background delivery channels, and production scheduler guarantees are out of scope until a later release gate selects them.

## Downstream Impact

- prototype_states_or_flows:
  - Recurring rule setup must make `馬上入帳` versus `提醒入帳` visually and textually unambiguous.
  - Rule forms need monthly day selection limited to 1-28, amount, category, income/expense type, member attribution, and expense payment source.
  - Monthly views need pending reminder occurrences separated from posted ledger records.
  - Reminder confirmation needs a clear final action and should expose when confirmation will create a member-paid refundable expense.
  - Duplicate/already-posted states need a non-destructive message rather than another ledger write.
- bdd_scenarios:
  - Admin or finance manager creates a rent income rule on day 1 with `提醒入帳`; the pending item is excluded from totals until confirmed.
  - Authorized member confirms the rent reminder; one income ledger record is created with recurring trace.
  - Admin or finance manager creates an internet fee expense rule on day 15 with `馬上入帳` and member-paid source; one member-paid expense is created and becomes refundable.
  - A second posting/confirmation attempt for the same rule/month does not create a duplicate record.
  - A general member cannot create or update a recurring rule.
  - A general member cannot confirm another member's pending recurring occurrence.
- technical_design_boundaries:
  - Recurring Schedule owns rule state, occurrence identity, posting mode, and pending/posted occurrence status.
  - Fund Ledger owns the created income/expense record and should receive a normal ledger creation command with recurring trace.
  - Reimbursement reads member-paid ledger records after creation; it should not know about pending recurring reminders.
  - Reporting reads pending recurring occurrences separately from ledger records and must keep them out of financial totals.
  - Identity and Access authorizes rule management and confirmation at the command boundary.
  - Persistence must enforce idempotency for recurring rule plus target year/month, whether occurrences are persisted eagerly or derived on demand.
- tdd_domain_tests:
  - Creating a rule validates actor role, day 1-28, category/type compatibility, amount, and member/payment-source shape.
  - Immediate income occurrence creates exactly one income record for the target month.
  - Immediate member-paid expense occurrence creates exactly one refundable member-paid expense.
  - Reminder occurrence is visible as pending but excluded from totals before confirmation.
  - Reminder confirmation creates one ledger record and rejects duplicate confirmation.
  - General-member rule management and cross-member confirmation are rejected.
  - Updating a rule does not mutate already-posted ledger records.
- release_or_learning_signals:
  - Local_dev readiness should include schema/migration evidence if recurring rule or occurrence tables are added.
  - Local review should check whether users understand that pending reminders are not counted money.
  - Learning should check whether `馬上入帳` causes accidental records or whether users expect one more review step.

## Open Questions and Risks

- product:
  - Should the UI later support pausing, ending, deleting, or duplicating recurring rules, or is update-only enough for the first implementation slice?
  - Should reminder confirmation allow edits to amount, date, category, note, payment source, or payer before posting?
- domain:
  - Missed-month catch-up remains unresolved. The MVP domain allows on-demand month handling, but technical design must avoid silent multi-month backfill without review.
  - Day 29-31 support is deferred; users with month-end rent or fees may need a later last-day-of-month policy.
- data_or_ownership:
  - Technical design must choose persisted occurrences versus derived occurrences with a completion ledger, but either design must enforce one completion per rule/month.
  - Posted ledger records need enough recurring trace for audit without making LedgerRecord depend on mutable rule fields.
- policy_or_permission:
  - Finance-manager rule management is approved for MVP; if this feels too broad in review, the prototype/spec must narrow it before implementation.
  - General-member self-confirmation may still be too permissive if the household wants finance-manager review for all reminders.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm admin and finance manager can manage recurring rules, while general members cannot.
  - Confirm monthly schedule days 1-28 are acceptable for the MVP slice.
  - Confirm general members may self-confirm reminder occurrences under ordinary ledger rules.
  - Confirm updating a rule affects future occurrences only and never rewrites posted ledger records.
- must_check:
  - Durable domain model is updated in `.ai/domain/home-family-fund.md`.
  - Prototype, BDD, and technical design consume occurrence identity, pending-total exclusion, and duplicate-prevention rules.
  - Member-paid recurring expenses enter reimbursement only after posting or confirmation creates a real ledger record.
- acceptance_signals:
  - Experience Prototype can design rule setup, posting mode selection, pending reminders, and confirmation states.
  - Behavior Spec can define duplicate-prevention and authorization scenarios.
  - Technical Design can decide persistence, idempotency, command boundaries, and reporting joins.
- unresolved_blockers:
  - Pausing/deleting rules, missed-month handling, editable confirmation fields, and persisted-versus-derived occurrence storage need downstream decisions.
- next_step:
  - Experience Prototype for `recurring-income-expense-records`.
