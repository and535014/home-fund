---
id: prototype-recurring-income-expense-records
stage: experience-prototype
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/recurring-income-expense-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/recurring-income-expense-records.md
  - .ai/foundation-architecture/home-family-fund.md
outputs:
  - production_stack_prototype
  - ux_acceptance_criteria_draft
  - e2e_scenario_candidates
trace_links:
  routes:
    - src/app/(app)/settings/recurring/page.tsx
  components:
    - src/app/(app)/settings/recurring/recurring-rules-prototype.tsx
    - src/app/(app)/settings/layout.tsx
    - src/app/(app)/(home)/page.tsx
    - src/app/(app)/search/_components/record-search-panel.tsx
    - src/app/(app)/search/_components/record-results-list.tsx
    - src/app/_record-detail/record-list-detail.tsx
    - src/app/_record-detail/record-detail-ui.tsx
    - src/app/record-entry-panel.tsx
    - src/app/ledger-record-form-fields.tsx
    - src/app/recurring-prototype-data.ts
reviewed_at: 2026-06-27
---

# Experience Prototype: Recurring Income Expense Records

## Prototype Summary

- route: `/settings/recurring`
- review_url: `http://localhost:3000/settings/recurring`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React client components, TypeScript, Tailwind CSS, local shadcn-style components, Lucide icons
- component_library_usage: existing PageLayout, PageHeader, Dialog, Item, Badge, Button, Input, Field, NativeSelect, Tooltip, RecordListDetail, RecordListItem, RecordDetailView components
- fixture_or_mock_strategy: Uses real active household members/categories from Prisma when available, with local fallback fixtures. Event deletion in settings is local client state. Event creation is integrated into the existing create-record dialog as a prototype-only branch when `重複` is not `不重複`; it shows success feedback but does not persist. Home and search receive prototype-only recurring income/expense records from `src/app/recurring-prototype-data.ts`; confirmation in the detail modal is local UI state only. No recurring schema, server action, scheduler, persistence, idempotency ledger, or reporting query is implemented in this gate.
- release_target: `production`

## UX Direction

- Recurring events live under `設定 > 週期事件` for reviewing and deleting existing event definitions, while creation starts from the same global `新增紀錄` dialog as one-off records.
- The settings page mirrors the category-management list structure: compact item rows and two side-by-side panels. It does not expose a separate create button or mobile FAB.
- The settings page is event management only; it does not own monthly posting, pending posting, confirmation workflow, or a separate creation entry point.
- The settings navigation shows `週期事件` only to admin and finance manager roles in this prototype.
- The settings main content has two panels:
  - `收入`: income recurring events.
  - `支出`: expense recurring events.
- Event setup happens in the existing create-record dialog: type tabs, visual category picker, amount/name fields, member/fund attribution, plus `重複`, `指定日期` when needed, and `入帳模式`.
- Home and search are the recurring posting surfaces: pending recurring records appear beside ordinary income/expense records.
- Opening a pending recurring record detail shows a `確認入帳` action; confirming changes the prototype state from `待入帳` to ordinary posted visual treatment.
- Schedule anchor is explicit:
  - `每月固定日`: selectable days 1-28.
  - `每月底`: first-class schedule, not hidden 31st-day conversion.
- Posting mode is explicit:
  - `馬上入帳`: shown as direct ledger posting.
  - `提醒入帳`: shown as pending and excluded from totals until confirmation.
- Member-paid recurring expenses show copy that they enter the reimbursement flow only after posting or confirmation creates a real ledger record.

## States Covered

- Admin or finance manager can open `/settings/recurring`.
- General member direct visit redirects away.
- Settings navigation includes `週期事件` for admin and finance manager.
- The existing add-record dialog can create either a one-off record or a recurring event.
- Selecting `不重複` shows the ordinary date field and submits through the existing create-record action.
- Selecting `每月固定日` hides the date field, shows `指定日期` for days 1-28, and shows `入帳模式`.
- Selecting `每月月底` hides the date field, shows the month-end schedule state, and shows `入帳模式`.
- Expense setup supports household-fund paid and member-paid choices.
- Schedule setup supports fixed day 1-28 and `每月底`.
- `每月底` helper copy shows 1/31, 2/28 or 2/29, and 11/30 behavior.
- Posting mode selection uses a select with `馬上入帳` and `提醒入帳`.
- Adding a recurring event from the create-record dialog is prototype-only success feedback; it does not append to the settings list until backend persistence exists.
- Existing events can be deleted from the settings list after a confirmation dialog. Changing a rule requires deleting it and creating a replacement from the add-record dialog.
- Existing examples cover:
  - monthly rent income on day 1 as `提醒入帳`
  - monthly internet fee on day 15 as `馬上入帳` with member-paid source
  - month-end management fee using `每月底`
- Home record list includes pending recurring income records using the same item layout as ordinary records: actor label becomes `成員 · 週期`, date label becomes `未入帳`, and the row uses `opacity-70`.
- Search record surface includes prototype recurring records even before backend recurring search exists.
- Pending recurring detail modal shows `確認入帳`; confirming changes the local visual state to posted.
- Already-posted/immediate occurrences are read-only in the prototype.
- Deleting a recurring event shows a success toast after confirmation.

## Interaction Details

- User opens `/settings/recurring`:
  - desktop shows `支出` and `收入` panels side by side.
  - mobile uses `支出(數量)` and `收入(數量)` line tabs.
  - item rows use the same compact management rhythm as category rows.
- User opens the existing create-record dialog:
  - choose `不重複` to create an ordinary one-off ledger record.
  - choose `每月固定日` or `每月月底` to create a recurring event prototype.
- User creates a fixed-day event:
  - choose `每月固定日`.
  - choose a day between 1 and 28.
  - choose `馬上入帳` or `提醒入帳`.
  - pressing `新增` shows prototype success feedback for a recurring event.
- User creates a month-end event:
  - choose `每月底`.
  - the day selector is replaced by explanatory copy.
  - the next occurrence shows month-end behavior.
- User opens Home or Search:
  - pending recurring records appear in the same record list shape as ordinary income/expense records.
  - recurring records use ordinary record item styling and information order.
  - pending records show `未入帳` in the date slot and use `opacity-70`.
- User opens a pending recurring record detail:
  - the modal explains this is generated from a recurring event.
  - `確認入帳` is the primary action.
  - edit/delete/refund actions are hidden while the item is pending.
- User confirms a pending recurring record:
  - the local visual state becomes posted.
  - no backend mutation happens.

## Responsive Baseline

- Desktop settings: expense and income panels use two equal columns, with expense on the left and income on the right, filling the available height and scrolling within each list.
- Dialog form uses two-column field groups at tablet and desktop sizes.
- Mobile settings: recurring event panels use line tabs for `支出(數量)` and `收入(數量)` instead of showing both panels stacked; the active panel omits a repeated `支出 (n)` or `收入 (n)` title.
- Mobile settings navigation includes `週期事件` in the horizontal settings nav.
- Mobile uses the existing create-record entry point; settings does not add a recurring-event FAB.
- Home/search reuse existing record-list responsive behavior for pending recurring records.
- Mode controls keep stable height so switching active state does not shift layout.
- Long event names, category names, and member names truncate within their row instead of overlapping adjacent amounts or badges.

## Accessibility And Focus

- Page sections use `aria-label` for income and expense recurring-event panels.
- Dialog title identifies create intent.
- `重複`, `指定日期`, and `入帳模式` controls use visible labels.
- Delete success feedback uses a toast.
- Form controls use visible labels.
- Confirm posting action in the record detail modal uses visible `確認入帳` text; search/home list rows keep existing keyboard behavior.

## Draft UX Acceptance Criteria

- Admin and finance manager can reach recurring event management from settings.
- General member cannot manage recurring events.
- Users can start income recurring event creation from the existing add-record dialog with amount, category, source member, schedule anchor, and posting mode.
- Users can start expense recurring event creation from the existing add-record dialog with amount, category, payment source, payer member, schedule anchor, and posting mode.
- Fixed-day schedules support days 1-28.
- `每月底` is explicit and resolves to the last calendar day of each target month.
- `馬上入帳` occurrences appear as ordinary posted records in record browsing surfaces.
- `提醒入帳` occurrences appear in Home and Search as `未入帳` records and remain excluded from totals until confirmed.
- Confirming a pending recurring record from the detail modal changes it to posted in local prototype state.
- Member-paid recurring expenses enter reimbursement only after posting or confirmation.
- The UI separates event management from posting confirmation.
- The page uses the same high-level management structure as the category page for lists and panels, while creation is centralized in the existing add-record dialog.

## E2E Scenario Candidates

- Admin opens the add-record dialog and starts a day-1 rent income recurring event with `提醒入帳`.
- Finance manager starts a day-15 internet expense recurring event with `馬上入帳` and member-paid source.
- User starts a `每月底` recurring event and sees the month-end schedule state.
- User opens Home, opens a pending recurring rent record, clicks `確認入帳`, and sees it return as posted visual state.
- General member direct visit to `/settings/recurring` redirects away.
- User opens Search, sees pending recurring records in the record surface, opens detail, and confirms posting.
- Mobile viewport shows settings `週期事件` tab, the existing add-record dialog, recurring controls, and record-detail confirmation without text clipping.

## Known Gaps

- No recurring event persistence exists.
- No Prisma schema, migration, or recurring occurrence table exists.
- No server action exists for create/delete/pause events.
- No backend authorization command exists yet for `manage_recurring_rules`.
- No idempotency enforcement exists beyond prototype local state.
- No real scheduler, month-view generation, or missed-month catch-up exists.
- No backend reporting integration exists for pending recurring occurrences.
- No actual ledger record is created when confirming a pending recurring record in the prototype.
- Event pause and in-place edit behavior are intentionally not implemented; the MVP rule is delete-and-recreate.
- Confirmation-time edits to amount/date/category/member/payment source remain unresolved for Behavior Spec.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `/settings/recurring` is the right IA location.
  - Confirm `每月固定日` plus `每月底` is the right first schedule model.
  - Confirm `馬上入帳` and `提醒入帳` mode controls are clear enough.
  - Confirm admin/finance-manager-only event management is acceptable.
  - Confirm general-member self-confirmation should be designed on Home/Search/detail surfaces, not the settings page.
  - Confirm the category-page-like income/expense panel structure is the right shape for event management.
  - Confirm Home and Search are the right surfaces for pending recurring records and confirmation.
- must_check:
  - Prototype remains frontend review work; persistence, scheduler, server actions, and idempotency are deferred.
  - Behavior Spec must define event management authorization, Home/Search pending-record visibility, general-member confirmation path, duplicate prevention, pending-total exclusion, and month-end scenarios.
  - Technical Design must define storage, occurrence generation, production scheduled posting, transaction boundaries, recurring trace on LedgerRecord, and reporting joins.
- acceptance_signals:
  - User accepts settings placement and the category-page-like event-management structure.
  - User accepts Home/Search/detail as the posting confirmation surfaces.
  - User accepts explicit month-end as first-class schedule anchor.
  - User requests only concrete copy/layout adjustments before Behavior Spec.
- unresolved_blockers:
  - General-member confirmation entry point is not designed yet because general members cannot access event management.
- Event pause, later in-place editing, and confirmation-time editing remain open.
- next_step:
  - Behavior Spec / BDD / E2E for `recurring-income-expense-records`.
