---
id: spec-recurring-income-expense-records
stage: behavior-spec
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/recurring-income-expense-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/recurring-income-expense-records.md
  - .ai/prototype/recurring-income-expense-records.md
  - .ai/spec/story-recurring-rules-and-confirmation.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  production_routes:
    - /
    - /search
    - /settings/recurring
  target_components:
    - src/app/record-create.tsx
    - src/app/record-entry-panel.tsx
    - src/app/(app)/settings/recurring/page.tsx
    - src/app/(app)/settings/recurring/recurring-rules-prototype.tsx
    - src/app/(app)/(home)/page.tsx
    - src/app/home-record-tabs.tsx
    - src/app/(app)/search/_components/record-search-panel.tsx
    - src/app/(app)/search/_components/record-results-list.tsx
    - src/app/_record-detail/record-detail-flow.tsx
    - src/app/_record-detail/record-detail-ui.tsx
  domain_contexts:
    - Recurring Schedule
    - Fund Ledger
    - Reporting
    - Reimbursement
    - Identity and Access
reviewed_at:
---

# Recurring Income Expense Records Behavior Spec

## Decision Summary

- decision: needs_user_review
- prototype_status: accepted to proceed by user on 2026-06-27
- route_scope: `/`, `/search`, `/settings/recurring`, existing create-record dialog
- next_gate: Feature Technical Design
- next_skill: feature-technical-design
- reason: The prototype settled the user-facing surfaces and MVP policy: recurring events are created from the add-record dialog, managed from settings, not edited in place, and reminder occurrences appear in record browsing surfaces until confirmed.

## Final Acceptance Criteria

1. Admins and finance managers can create recurring events; general members cannot create recurring events.
2. Admins and finance managers can delete recurring events from `/settings/recurring`; general members cannot delete recurring events.
3. Recurring events cannot be edited in place in the MVP. To change amount, category, member attribution, payment source, schedule, or posting mode, the manager deletes the old event and creates a replacement.
4. `/settings/recurring` is visible in settings navigation only to admins and finance managers.
5. Direct general-member access to `/settings/recurring` is rejected or redirected without exposing event data.
6. Recurring event creation is reached from the existing add-record dialog through the `重複` field, not through a separate create button on `/settings/recurring`.
7. `重複 = 不重複` preserves ordinary one-off record creation, including the visible date field and existing create-record validation.
8. `重複 = 每月固定日` hides the ordinary date field, shows `指定日期`, and allows only days 1-28.
9. `重複 = 每月月底` hides the ordinary date field and stores an explicit month-end schedule anchor.
10. Monthly fixed day 29-31 is not available in the MVP as a generic fixed-day schedule.
11. Month-end schedules resolve to the last day of each target month, including 2/28, 2/29 in leap years, 4/30, and 11/30.
12. Recurring event creation captures the same financial fields as ordinary record creation: record type, category, amount, name, member attribution, payment source when expense, and optional note where supported by final design.
13. Recurring event creation additionally captures posting mode: `馬上入帳` or `提醒入帳`.
14. A `馬上入帳` occurrence creates exactly one ordinary ledger record for the recurring event and target year/month.
15. A `提醒入帳` occurrence appears as a pending recurring record in record browsing surfaces and does not affect income totals, expense totals, category totals, reimbursement totals, or ordinary ledger totals before confirmation.
16. Pending recurring records appear on Home and Search wherever the corresponding month's records can be browsed or searched.
17. Pending recurring records use the ordinary record item layout, with actor text changed to `<成員> · 週期事件`, date text shown as `未入帳`, and a visibly softer opacity than posted records.
18. Posted/immediate recurring records use the ordinary record item layout and show the real occurrence date.
19. Opening any recurring record detail shows its recurring event schedule and posting mode, such as `週期事件：「每月 1 號，提醒入帳」`.
20. Opening a pending recurring record detail shows status `待入帳`, hides ordinary edit/delete/refund actions, and exposes `確認入帳`.
21. Confirming a pending recurring occurrence creates exactly one ordinary ledger record with trace to the recurring event and target occurrence.
22. Confirming the same pending recurring occurrence more than once is rejected or becomes a no-op without creating a duplicate ledger record.
23. Admins and finance managers can confirm any pending recurring occurrence.
24. General members can confirm a pending recurring occurrence only when the resulting ledger record is attributed to themselves under ordinary ledger creation rules.
25. General members cannot confirm another member's pending recurring occurrence.
26. A member-paid recurring expense becomes reimbursement-eligible only after immediate posting or reminder confirmation creates the ordinary member-paid expense ledger record.
27. Pending recurring member-paid expenses are not reimbursement-eligible before posting or confirmation.
28. Deleting a recurring event stops future occurrence generation without mutating already-posted ledger records.
29. Deleting a recurring event requires a confirmation dialog and shows a success toast after deletion.
30. Duplicate occurrence prevention is based on recurring event plus target year/month.
31. Missed-month catch-up must not silently create multiple past ledger records without an explicit downstream design decision.
32. UI copy remains Traditional Chinese using Taiwan wording: `週期事件`, `重複`, `每月固定日`, `每月月底`, `指定日期`, `馬上入帳`, `提醒入帳`, `未入帳`, and `確認入帳`.
33. Desktop `/settings/recurring` shows expense events on the left and income events on the right, each list filling available height and scrolling internally.
34. Mobile `/settings/recurring` uses line tabs `支出(數量)` and `收入(數量)` and does not repeat a panel title inside the active tab.

## BDD Scenarios

### Scenario: Admin Creates Fixed-Day Reminder Income Event

Given an authenticated admin opens the add-record dialog  
When the admin selects `收入`  
And selects category `房租收入`  
And enters amount `18000` and name `成員 A 房租收入`  
And selects source member `成員 A`  
And selects `重複` as `每月固定日`  
And selects `指定日期` as `1 號`  
And selects `入帳模式` as `提醒入帳`  
And submits the form  
Then a recurring income event is created for every month on day 1  
And future occurrences appear as pending until confirmed  
And no ordinary ledger record is counted before confirmation

### Scenario: Finance Manager Creates Immediate Member-Paid Expense Event

Given an authenticated finance manager opens the add-record dialog  
When the finance manager selects `成員支出`  
And selects category `網路費`  
And enters amount `1299` and name `網路費`  
And selects payer `成員 B`  
And selects `重複` as `每月固定日`  
And selects `指定日期` as `15 號`  
And selects `入帳模式` as `馬上入帳`  
And submits the form  
Then a recurring expense event is created  
And the target month occurrence posts exactly one member-paid expense ledger record  
And that ledger record is reimbursement-eligible under existing reimbursement rules

### Scenario: Manager Creates Month-End Event

Given an authenticated admin or finance manager opens the add-record dialog  
When the manager selects `重複` as `每月月底`  
And completes the financial fields  
And submits the form  
Then the recurring event stores an explicit month-end schedule anchor  
And February resolves to 2/28 or 2/29 depending on leap year  
And November resolves to 11/30

### Scenario: Ordinary Record Creation Is Preserved

Given an authenticated member opens the add-record dialog  
When the member leaves `重複` as `不重複`  
Then the ordinary date field is visible  
And submitting creates a one-off ledger record through the existing ledger creation flow  
And no recurring event is created

### Scenario: General Member Cannot Manage Recurring Events

Given an authenticated general member is using the app  
Then settings navigation does not show `週期事件`  
When the member directly visits `/settings/recurring`  
Then the app rejects or redirects the request  
And no recurring event management data is visible  
When the member submits a recurring-event create or delete command directly  
Then the command is rejected

### Scenario: Settings List Deletes Event After Confirmation

Given an admin or finance manager is on `/settings/recurring`  
And a recurring event named `網路費` exists  
When the manager clicks `刪除 網路費`  
Then a dialog titled `刪除週期事件` opens  
And the dialog summarizes the event name, amount, schedule, and posting mode  
When the manager clicks `確認刪除`  
Then the event disappears from the settings list  
And a toast says `週期事件已刪除`  
And future occurrences for that event are no longer generated

### Scenario: Pending Reminder Appears In Home Without Affecting Totals

Given a reminder-based rent income event has an occurrence for July 2026  
When a member opens Home for July 2026  
Then the pending occurrence appears in the record list with date label `未入帳`  
And the row actor text is `成員 A · 週期事件`  
And the row is visually softer than posted rows  
And July income totals, category totals, and balance do not include the pending amount

### Scenario: Pending Reminder Appears In Search And Can Be Confirmed

Given a reminder-based recurring occurrence exists for July 2026  
When a member opens Search with filters that match the occurrence  
Then the pending occurrence appears in the search results  
When the member opens the detail dialog  
Then the dialog shows `週期事件：「每月 1 號，提醒入帳」`  
And status is `待入帳`  
And the primary action is `確認入帳`  
When an authorized member confirms the occurrence  
Then exactly one ordinary ledger record is created  
And the row uses posted visual treatment with the real occurrence date

### Scenario: Duplicate Confirmation Is Prevented

Given a pending recurring occurrence has already been confirmed for event `rent` and month `2026-07`  
When any actor attempts to confirm the same event/month again  
Then no second ledger record is created  
And the app reports that the occurrence is already posted or no longer pending

### Scenario: General Member Cannot Confirm Another Member's Reminder

Given a pending reminder occurrence would create a ledger record attributed to `成員 B`  
And `成員 A` is a general member  
When `成員 A` attempts to confirm the occurrence  
Then the command is rejected  
And the pending occurrence remains unposted

### Scenario: Recurring Trace Is Preserved On Ledger Record

Given an immediate occurrence posts or a reminder occurrence is confirmed  
When the resulting ledger record is inspected by reporting, search, detail, or audit views  
Then the record has trace to the originating recurring event and target year/month  
And changing or deleting the recurring event later does not rewrite the ledger record facts

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Recurring settings permission | `/settings/recurring` | admin, finance manager, general member | desktop | admin/finance manager see heading `週期事件`; general member direct visit redirects or rejects; settings nav hides `週期事件` for general member. |
| Desktop recurring settings layout | `/settings/recurring` | admin with expense and income events | desktop | regions `支出週期事件` and `收入週期事件`; expense region left of income; each list scrolls internally; no `新增週期事件` button. |
| Mobile recurring settings tabs | `/settings/recurring` | admin with expense and income events | mobile | line tabs `支出(數量)` and `收入(數量)` switch panels; active panel does not repeat `支出 (n)` or `收入 (n)`. |
| Delete recurring event | `/settings/recurring` | admin with event `網路費` | desktop | button `刪除 網路費`; dialog title `刪除週期事件`; button `確認刪除`; toast `週期事件已刪除`; event row removed. |
| Create fixed-day reminder income | `/` or `/settings/recurring` through global create dialog | admin/finance manager, income category, member A | desktop | open `新增收入`; `重複`; choose `每月固定日`; choose `1 號`; choose `提醒入帳`; submit; success feedback; no ordinary ledger total increase until occurrence confirmation. |
| Create immediate member-paid expense | `/` through global create dialog | finance manager, expense category, member B | desktop | open `新增支出`; choose `成員支出`; `重複` = `每月固定日`; `指定日期` = `15 號`; `入帳模式` = `馬上入帳`; resulting ledger record is member-paid and refundable. |
| Month-end schedule | `/` through global create dialog | admin/finance manager | desktop | choose `每月月底`; no ordinary date field; final persisted/readback schedule is month-end; generated dates include 2/28 or 2/29 and 11/30 in fixture checks. |
| Ordinary create unaffected | `/` through global create dialog | member | desktop and mobile | `重複` defaults to `不重複`; date field visible; one-off record creation works as before; no recurring event created. |
| Home pending reminder | `/?month=2026-07` | pending rent occurrence | desktop | record row name visible; actor text `成員 A · 週期事件`; date text `未入帳`; amount excluded from dashboard totals. |
| Search pending reminder | `/search` | pending rent occurrence | desktop | search results include matching pending occurrence; selection/batch actions do not treat pending prototype occurrence as ordinary selectable ledger mutation until implementation defines it. |
| Confirm pending reminder | `/` or `/search` | pending rent occurrence, authorized actor | desktop | open detail; alert text includes `週期事件：「每月 1 號，提醒入帳」`; status `待入帳`; button `確認入帳`; after confirmation status/row becomes posted. |
| Mobile confirmation layout | `/` or `/search` | pending occurrence | mobile | detail dialog fits viewport; recurring-event info alert, status field, and `確認入帳` action are visible without clipping. |

## Fixture And Data Strategy

- Roles: admin, finance manager, general member, with at least two household members named `成員 A` and `成員 B`.
- Categories: at least one active income category `房租收入` and expense categories `網路費` and `管理費`.
- Recurring events:
  - rent income, day 1, member A, `提醒入帳`, amount 18000.
  - internet expense, day 15, member B paid, `馬上入帳`, amount 1299.
  - month-end management fee, household-fund paid or member-paid as final design chooses, `提醒入帳`.
- Occurrences:
  - one pending reminder occurrence for July 2026.
  - one posted immediate occurrence for July 2026.
  - duplicate-confirmation fixture for event/month already completed.
- Ledger records must include ordinary manual records so totals and search can prove pending amounts are excluded.
- Reimbursement fixtures must include member-paid recurring expense after posting to verify reimbursement eligibility.

## Accessible Selectors

- Settings route heading: role `heading`, name `週期事件`.
- Settings regions: role `region`, names `支出週期事件`, `收入週期事件`.
- Mobile tabs: role `tab`, names matching `支出(<count>)`, `收入(<count>)`.
- Delete action: button `刪除 <週期事件名稱>`.
- Delete confirmation: dialog title `刪除週期事件`, button `確認刪除`, button `取消`.
- Create-record dialog fields: labels `重複`, `指定日期`, `入帳模式`, existing `金額`, `名稱`, `支付者`, and `分類`.
- Posting mode options: `馬上入帳`, `提醒入帳`.
- Pending row date text: `未入帳`.
- Detail info alert text includes `週期事件：「...」`.
- Confirm action: button `確認入帳`.

## Responsive And Accessibility Requirements

- Desktop `/settings/recurring` and `/settings/categories` use two side-by-side panels that fill available height and scroll inside each list rather than scrolling the whole page.
- Mobile `/settings/recurring` uses line tabs with counts and hides the repeated panel heading inside the active tab.
- The add-record dialog remains usable on mobile when recurring fields appear; text must not clip inside select controls.
- Delete and confirm dialogs keep footer buttons visible on mobile.
- Icon-only delete actions have accessible names.
- Pending recurring row opacity must not reduce text contrast below acceptable readability.
- Toast feedback must not be the only source of financial state; durable state is visible in the list/detail after refresh.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/unit | Creating recurring event validates actor role, category/type compatibility, amount, member attribution, payment source, schedule anchor, and posting mode. |
| Domain/unit | Fixed-day schedules accept 1-28 and reject 29-31 in MVP. |
| Domain/unit | Month-end schedule resolves correctly for 28-, 29-, 30-, and 31-day months. |
| Domain/unit | Deleting recurring event validates actor role and stops future generation without mutating existing ledger records. |
| Domain/unit | Immediate occurrence creates one ledger record and rejects duplicate event/month posting. |
| Domain/unit | Reminder occurrence remains pending and excluded from totals until confirmation. |
| Domain/unit | Reminder confirmation creates one ledger record, preserves recurring trace, and rejects duplicate confirmation. |
| Domain/unit | General member event management and cross-member confirmation are rejected. |
| Integration/server action | Create/delete recurring event commands revalidate settings, home, and search views. |
| Integration/server action | Posting/confirmation uses ordinary ledger creation rules and reimbursement eligibility for member-paid expenses. |
| Reporting/query | Pending recurring occurrences are read separately from ordinary ledger records and excluded from financial totals. |
| Component | Add-record form switches date/recurring fields correctly for `不重複`, `每月固定日`, and `每月月底`. |
| Component | Record row/detail components display pending recurring records with `週期事件`, `未入帳`, schedule info, and confirm action. |
| E2E | Permission, settings layout, delete confirmation, recurring create fields, pending row visibility, search visibility, confirmation, duplicate prevention, and mobile dialog layout. |
| Regression | Ordinary one-off income/expense creation, ordinary record edit/delete, search, dashboard totals, and reimbursement behavior remain unchanged. |
| Manual | Review wording clarity for `馬上入帳` versus `提醒入帳`, month-end choice, delete-and-recreate expectation, and pending-row visual treatment. |

## Technical Design Inputs

- Decide Prisma schema for recurring event, occurrence/completion identity, posting mode, schedule anchor, and ledger recurring trace.
- Decide whether pending occurrences are persisted eagerly, derived on demand, or stored in a completion ledger.
- Decide command/API boundaries for `createRecurringEvent`, `deleteRecurringEvent`, `postImmediateOccurrence`, and `confirmRecurringOccurrence`.
- Decide when immediate posting is triggered for local_dev: on month view, explicit job, server action after create, or another deterministic boundary.
- Decide whether deleting an event also cancels already-created pending occurrences, or only stops future derived occurrences.
- Decide cache invalidation paths for settings, home, search, reimbursement, and reports.
- Decide how recurring traces appear in ledger detail/audit without making posted ledger records depend on mutable/deleted event data.
- Decide error and stale-state handling when another actor confirms or deletes an occurrence before the current user acts.
- Decide whether confirmation allows any field overrides in this slice; current spec assumes no confirmation-time edits.

## Accepted Risks

- Prototype currently uses local state and generated fixture records; implementation must replace this with persisted commands and real reporting reads.
- Missed-month catch-up is intentionally unresolved; implementation must not silently create multiple past records without an approved design.
- External notification delivery is out of scope; in-app pending visibility is sufficient for MVP local_dev.
- In-place editing, pause, end date, duplication, and non-monthly schedules are out of scope for MVP.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - Confirm creation from add-record dialog, not `/settings/recurring`, is final for MVP.
  - Confirm admin and finance manager can create/delete events; general members cannot.
  - Confirm general members may self-confirm pending occurrences attributed to themselves.
  - Confirm pending occurrences must appear in Home and Search but remain excluded from totals.
  - Confirm delete-and-recreate replaces in-place editing for MVP.
- must_check:
  - Feature Technical Design must resolve persistence, occurrence generation timing, deletion semantics for pending occurrences, idempotency, cache invalidation, and recurring trace.
  - Implementation must not start until Technical Design is approved or risk is explicitly accepted.
  - Pending totals exclusion, duplicate prevention, and reimbursement eligibility after posting are mandatory.
- acceptance_signals:
  - Rent reminder, internet immediate member-paid expense, and month-end examples are all covered.
  - Existing manual ledger workflows are protected by regression expectations.
  - E2E design covers desktop and mobile review surfaces.
- unresolved_blockers:
  - Pending occurrence storage strategy.
  - Immediate posting trigger.
  - Whether deleting an event cancels existing pending occurrences.
  - Confirmation-time field editing remains out of scope unless product reverses that decision before Technical Design.
- next_step:
  - Feature Technical Design for `recurring-income-expense-records`.
