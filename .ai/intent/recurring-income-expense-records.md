---
id: recurring-income-expense-records
stage: intent-intake
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: feature_change
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/domain/home-family-fund.md
  - .ai/spec/story-recurring-rules-and-confirmation.md
outputs:
  - intent_intake
trace_links:
  bounded_contexts:
    - Recurring Schedule
    - Fund Ledger
    - Reimbursement
    - Reporting
    - Identity and Access
    - Responsive Web Experience
  related_slices:
    - story-recurring-rules-and-confirmation
    - reimbursement-payment-flow
    - edit-delete-ledger-records
reviewed_at: 2026-06-27
---

# Intent Intake: Recurring Income Expense Records

## Intent

Add recurring income and expense records so the household can define monthly expected financial activity once, then let the app either post it immediately or wait for explicit confirmation before it affects the ledger.

User request: "新增週期性收支紀錄，週期性紀錄要分成 馬上入帳 跟 提醒入帳。譬如說可以設定每個月一號都會有一筆 成員 A 的房租收入，可以設定成提醒入帳，需要點擊確認才會真的入帳。也可以設定每個月 15 號都會有一筆網路費支出，由成員 B 代墊，這是馬上入帳。"

## Classification

- project_type: feature_change
- affected_surfaces: recurring rule management, record creation data model, scheduled occurrence generation, ledger persistence, pending recurring reminders, monthly dashboard/reporting, member-paid expense reimbursement state, authorization, server actions/API boundary, tests, local_dev release readiness
- target_users: household admins or finance-capable members who maintain predictable monthly income and expenses
- business_outcome: reduce repeated manual entry for fixed monthly items while protecting ledger accuracy when real-world payment or receipt still needs confirmation.

## Scope

In scope:

- Create and maintain monthly recurring rules for income and expense records.
- Support two posting modes with user-facing Taiwan Traditional Chinese copy:
  - `馬上入帳`: creates the scheduled ledger record for the target occurrence without a separate user confirmation step.
  - `提醒入帳`: creates a pending expected item that is visible but does not affect ledger totals until a user confirms it.
- Support recurring income examples such as monthly rent income from a selected member on day 1.
- Support recurring expense examples such as monthly internet fee on day 15 paid upfront by a selected member.
- Preserve the normal ledger record shape after posting or confirmation: amount, category, occurrence date, member attribution, payment source, creator/actor trace, and reimbursement status when relevant.
- Treat member-paid recurring expenses as normal member-paid expenses after they become ledger records, including reimbursement eligibility.
- Prevent duplicate ledger records for the same recurring rule occurrence.
- Show pending reminder-based occurrences clearly enough that users can confirm them without mistaking them for already-posted ledger records.
- Keep recurring rule commands and occurrence posting server-validated; UI state cannot be the authority for financial effects.
- Add focused tests for recurring rule behavior, duplicate prevention, reminder confirmation, immediate posting, and reporting visibility.

Out of scope:

- External calendar, email, LINE, push notification, or OS-level reminder integrations.
- Bank sync, automatic payment execution, card subscription detection, or receipt capture.
- Non-monthly schedules such as weekly, yearly, custom intervals, business-day adjustment, or lunar calendar rules.
- Partial recurring amounts, split bills, variable formulas, proration, or automatic category/member inference.
- Reimbursement payment execution or automatic settlement for member-paid recurring expenses.
- Retroactive generation of all past missed occurrences unless a later gate explicitly accepts that behavior.
- Production-grade background job infrastructure, queue retries, distributed locks, or observability beyond what local_dev requires.

## Current Context

- The durable domain model already defines `Recurring rule`, `Immediate posting`, `Reminder-based posting`, and `Pending recurring item`.
- Existing recurring story draft says immediate posting affects the ledger, while reminder-based posting stays pending until confirmation.
- The domain model keeps an unresolved question about duplicate or missed monthly occurrences.
- The app already has ledger records for income and expenses, category management, member attribution, member-paid reimbursement flow, record search, and monthly reporting.
- Member-paid expenses become refundable after they are recorded. A recurring member-paid expense should enter that same state only after it is actually posted or confirmed into the ledger.
- Existing permissions distinguish admin, finance manager, and general member. The authority to create and manage recurring rules still needs a downstream decision.

## Success Criteria

- An authorized user can create a monthly recurring income rule with a day-of-month schedule, amount, category, and source member.
- An authorized user can create a monthly recurring expense rule with a day-of-month schedule, amount, category, payment source, and payer member when member-paid.
- A `馬上入帳` occurrence creates one and only one ledger record for the scheduled rule/month.
- A `提醒入帳` occurrence appears as pending and is excluded from income, expense, category, reimbursement, and monthly totals until confirmed.
- Confirming a pending recurring occurrence creates the correct ledger record and preserves trace to the recurring rule occurrence.
- A recurring member-paid expense becomes reimbursement-eligible only after it is posted or confirmed as a real ledger record.
- Users can tell the difference between already-posted recurring records and pending reminder items.
- Existing manual record creation, edit/delete behavior, reimbursement behavior, search, and monthly reports continue to follow their existing rules.
- Tests cover immediate income, immediate member-paid expense, reminder income confirmation, duplicate prevention, and pending-item exclusion from totals.

## Constraints And Assumptions

- UI copy remains Traditional Chinese using Taiwan wording.
- Existing Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, and Playwright foundation should be reused.
- `local_dev` is the release target for this slice.
- Monthly schedule means a day-of-month rule for this intent unless Domain Discovery approves a broader schedule model.
- For months without the selected day, downstream Domain Discovery must decide whether to use the last day of the month, skip the month, or block those day choices.
- Occurrence generation can be synchronous/on-demand for local_dev unless technical design proves a scheduled job is necessary.
- The initial product wording should prefer explicit financial language over automation mystique: pending items are expected money movements, not ledger truth.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required, because this introduces recurring rule lifecycle, occurrence state transitions, posting policy, duplicate prevention, missed-month handling, and cross-context effects on ledger, reimbursement, and reporting.
- Project Foundation Architecture: not required; existing app foundation is sufficient.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: required, because users need rule setup, posting-mode selection, pending reminder visibility, confirmation, and clear distinction between pending and ledgered items.
- Behavior Spec / BDD / E2E: required before technical design.
- Feature Technical Design: required, because persistence model, occurrence generation timing, idempotency, authorization, transaction boundaries, server actions, and tests need explicit decisions.
- TDD Implementation: required after approved spec and technical design.
- Verification: required after implementation.
- Target-Aware Release: required for `local_dev` readiness because the slice likely touches schema, financial writes, reporting, and reimbursement-adjacent behavior.
- Learning Loop: recommended for local_dev review to learn whether users understand `馬上入帳` versus `提醒入帳`.
- Artifact Compression: required after the slice completes.

## Open Questions

- Who can create, edit, pause, or delete recurring rules: admin only, finance manager, or both?
- Should a general member be allowed to manage recurring rules that only affect themselves?
- What happens when a rule date does not exist in a month, such as day 31 in February?
- Should reminder confirmation allow editing amount, date, category, note, or payer before posting?
- Should immediate posting happen when the month is viewed, when the rule is created, on app startup, or through a scheduled/background process?
- How should the app handle missed occurrences if nobody opens the app during the scheduled month?
- Should recurring rules have pause/end-date behavior in this slice?
- How should duplicate prevention identify one occurrence: rule id plus year/month, scheduled date, or a persisted occurrence id?
- Should deleting or editing a recurring rule affect already-posted ledger records, pending reminders, or future occurrences only?
- What audit trace should appear on the created ledger record: original rule, occurrence month, actor who created the rule, actor who confirmed, or all of these?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `馬上入帳` and `提醒入帳` are the intended user-facing modes.
  - Confirm monthly day-of-month schedules are enough for the first slice.
  - Confirm member-paid recurring expenses should enter the normal reimbursement flow only after posting or confirmation.
  - Confirm downstream Domain Discovery should decide authority, missed occurrences, duplicate prevention, and rule edit/delete semantics.
- must_check:
  - No implementation starts before Domain Discovery, Experience Prototype, Behavior Spec, and Feature Technical Design are approved or explicitly accepted as risk.
  - Pending reminder items must not affect ledger totals before confirmation.
  - Immediate posting and reminder confirmation must not create duplicate ledger records for the same rule occurrence.
- acceptance_signals:
  - The rent example can remain pending until a member confirms receipt.
  - The internet fee example can become a member-paid expense automatically and then follow reimbursement rules.
  - Scope is narrow enough for local_dev while still protecting financial correctness.
- unresolved_blockers:
  - Authority, schedule edge cases, occurrence generation timing, missed occurrence handling, and edit/delete semantics require Domain Discovery.
- next_step:
  - Domain Discovery / Domain Impact for `recurring-income-expense-records`.
