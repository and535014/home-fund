---
id: implementation-recurring-income-expense-records
stage: tdd-implementation
status: in_progress
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/spec/recurring-income-expense-records.md
  - .ai/technical-design/recurring-income-expense-records.md
  - .ai/prototype/recurring-income-expense-records.md
outputs:
  - tdd_slice_1_domain_authorization
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC4
    - AC5
    - AC8
    - AC9
    - AC10
    - AC11
    - AC12
    - AC13
    - AC24
    - AC25
  files:
    - src/modules/recurring/recurring-event.ts
    - src/modules/recurring/recurring-event.test.ts
    - src/modules/identity-access/authorization.ts
    - src/modules/identity-access/authorization.test.ts
    - src/modules/identity-access/access-hints.ts
    - src/modules/identity-access/access-hints.test.ts
    - src/app/(app)/settings/layout.tsx
    - src/app/(app)/settings/recurring/page.tsx
    - src/app/dashboard-navigation.ts
reviewed_at:
---

# Recurring Income Expense Records Implementation

## Current Status

- status: in_progress
- current_slice: create-time current-month occurrence generation
- implementation_started_at: 2026-06-27
- production_target: yes

## TDD Slice 1: Domain And Authorization

Tests written first:

- `src/modules/recurring/recurring-event.test.ts`
- updates to `src/modules/identity-access/authorization.test.ts`
- updates to `src/modules/identity-access/access-hints.test.ts`

Implemented after red tests:

- `src/modules/recurring/recurring-event.ts`
  - fixed-day schedule resolution for 1-28.
  - explicit month-end schedule resolution for 28-, 29-, 30-, and 31-day months.
  - recurring event creation validation for amount, name, category, schedule, posting mode, income source member, expense payment source, and payer member.
  - conversion from recurring event to ordinary ledger creation command.
- `src/modules/identity-access/authorization.ts`
  - `manage_recurring_events`.
  - `confirm_recurring_occurrence`.
  - `manage_recurring` capability type alignment with Prisma enum.
- `src/modules/identity-access/access-hints.ts`
  - `canOpenRecurringEvents`.
  - `canManageRecurringEvents`.
- settings navigation and `/settings/recurring` guard now consume access hints instead of page-local role checks.

## Verification So Far

- `corepack pnpm vitest run src/modules/identity-access/authorization.test.ts src/modules/identity-access/access-hints.test.ts src/app/dashboard-navigation.test.ts src/modules/recurring/recurring-event.test.ts` passed.
- `corepack pnpm vitest run src/modules/recurring/recurring-event.test.ts src/modules/recurring/recurring-event-command.test.ts src/modules/identity-access/authorization.test.ts src/modules/identity-access/access-hints.test.ts src/app/dashboard-navigation.test.ts` passed.
- `corepack pnpm db:validate` passed.
- `corepack pnpm type-check` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm vitest run src/app/recurring-event-form.test.ts src/app/recurring-event-actions.test.ts src/modules/recurring/recurring-event-command.test.ts` passed.

## TDD Slice 2: Persistence Commands And Schema

Tests written first:

- `src/modules/recurring/recurring-event-command.test.ts`

Implemented after red tests:

- `src/modules/recurring/recurring-event-command.ts`
  - `createRecurringEventInDatabase`
  - `deleteRecurringEventInDatabase`
  - `ensureRecurringOccurrencesForMonth`
  - `confirmRecurringOccurrenceInDatabase`
  - duplicate-safe already-posted handling
  - immediate occurrence posting through ordinary ledger creation rules
- `prisma/schema.prisma`
  - explicit `RecurringScheduleAnchor`.
  - recurring event `name`, `createdByMemberId`, `deletedAt`, `scheduleAnchor`.
  - recurring occurrence `targetDate`, `postedByMemberId`, `postedAt`.
- `prisma/migrations/20260628093000_harden_recurring_events/migration.sql`
  - forward migration for the production schema changes.
  - clamps migrated target dates to each month end for old occurrence rows.

## TDD Slice 3: ActionState Server Actions And Form Parser

Tests written first:

- `src/app/recurring-event-form.test.ts`
- `src/app/recurring-event-actions.test.ts`

Implemented after red tests:

- `src/app/recurring-event-form.ts`
  - parses recurring create form data from existing add-record fields.
  - validates fixed-day 1-28 and explicit month-end schedule.
  - parses delete and confirm ids.
- `src/app/recurring-event-actions.ts`
  - `createRecurringEventAction`
  - `deleteRecurringEventAction`
  - `confirmRecurringOccurrenceAction`
  - returns existing project `ActionState` shape.
  - maps domain and parser failures to typed field errors.
  - revalidates `/`, `/search`, `/settings/recurring`, and `/refunds` according to the mutation.

## TDD Slice 4: Add-Record Dialog Action Wiring

Tests written first:

- `src/app/record-entry-panel.test.tsx`

Implemented after red tests:

- `src/app/record-entry-panel.tsx`
  - `重複 = 不重複` still submits to `createLedgerRecordAction`.
  - recurring schedules submit the same uncontrolled form data to `createRecurringEventAction`.
  - record and recurring event action states share the same pending and feedback surface.
  - success callbacks close the create dialog and trigger the existing toast path.
- `src/app/record-create.tsx`
  - recurring-event success toast now reflects real persisted creation.

## TDD Slice 5: Settings Persisted Read And Delete Wiring

Tests written first:

- `src/modules/recurring/recurring-event-query.test.ts`
- `src/app/(app)/settings/recurring/recurring-events-panel.test.tsx`

Implemented after red tests:

- `src/modules/recurring/recurring-event-query.ts`
  - loads active, non-deleted recurring events for settings.
  - maps persisted schedule anchors into domain-facing recurring schedules.
  - computes the next occurrence label for fixed-day and month-end events.
- `src/app/(app)/settings/recurring/page.tsx`
  - loads recurring events from persisted data instead of local prototype fixtures.
- `src/app/(app)/settings/recurring/recurring-rules-prototype.tsx`
  - component export is now `RecurringEventsPanel`.
  - renders only persisted event props, with no fallback prototype rows.
  - delete confirmation calls `deleteRecurringEventAction`.
  - successful delete removes the row locally and shows the server action success toast.

## TDD Slice 6: Home/Search Pending Occurrence Read Model

Tests written first:

- `src/modules/recurring/recurring-occurrence-query.test.ts`
- updates to `src/app/home-dashboard-data-source.test.ts`
- updates to `src/app/(app)/search/_actions/record-search-actions.test.ts`

Implemented after red tests:

- `src/modules/recurring/recurring-occurrence-query.ts`
  - loads active, non-deleted, reminder-mode pending occurrences for a selected month.
  - maps pending occurrences into the existing ledger-compatible list row shape.
  - prefixes pending occurrence row ids with `recurring-occurrence:`.
  - applies ordinary search filters for Search pending occurrence results.
- `src/app/home-dashboard-data-source.ts`
  - loads persisted pending recurring records with monthly dashboard data.
- `src/app/(app)/(home)/page.tsx`
  - replaces prototype recurring rows with persisted pending recurring rows.
- `src/app/(app)/search/_actions/record-search-actions.ts`
  - includes matching pending recurring rows on the first search page.
  - keeps `totalCount` and `totalNetAmountCents` ledger-only so pending rows do not affect totals.
- `src/app/(app)/search/_components/record-search-panel.tsx`
  - removes client-side prototype recurring rows.
  - prevents pending recurring rows from batch selection.
- `src/app/_record-detail/record-list-detail.tsx` and `src/app/(app)/search/_components/record-results-list.tsx`
  - use pending recurring ids for `未入帳`, opacity, and `成員 · 週期事件` row treatment.

## TDD Slice 7: Pending Occurrence Detail Confirmation

Tests written first:

- updates to `src/modules/recurring/recurring-occurrence-query.test.ts`
- `src/app/_record-detail/record-detail-dialog.test.tsx`

Implemented after red tests:

- `src/modules/recurring/recurring-occurrence-query.ts`
  - carries persisted schedule/posting-mode trace as `recurringEventLabel`.
  - exposes helpers for recognizing pending occurrence row ids and extracting occurrence ids.
- `src/app/_record-detail/record-detail-flow.tsx`
  - reads recurring trace labels from persisted pending occurrence rows.
  - passes occurrence ids into the detail dialog.
- `src/app/_record-detail/record-detail-dialog.tsx`
  - confirms pending recurring occurrences through `confirmRecurringOccurrenceAction`.
  - shows success/error toast from the server action result.
  - only marks the row confirmed locally after server action success.
- `src/app/_record-detail/record-detail-ui.tsx`
  - disables the confirm button while posting and shows `入帳中...`.
- `src/app/recurring-prototype-data.ts`
  - removed after Home/Search/detail stopped depending on prototype recurring records.

## TDD Slice 8: Production Recurring Posting Trigger

Tests written first:

- updates to `src/modules/recurring/recurring-event-command.test.ts`
- `src/app/api/cron/recurring-posting/route.test.ts`

Implemented after red tests:

- `src/modules/recurring/recurring-event-command.ts`
  - adds `runRecurringPostingJob`.
  - derives target month from the supplied date in `Asia/Taipei`.
  - processes one month only and returns aggregate counts without household financial details.
  - selects an active admin/finance-manager actor per household for ordinary ledger authorization.
  - skips households without a posting actor.
  - prevents future-dated immediate occurrences in the target month from posting early.
- `src/app/api/cron/recurring-posting/route.ts`
  - adds protected `GET /api/cron/recurring-posting`.
  - requires `Authorization: Bearer <secret>` when `RECURRING_POSTING_CRON_SECRET` or `CRON_SECRET` is configured.
  - requires a configured secret in production.
  - returns only summary counts.
- `vercel.json`
  - schedules `/api/cron/recurring-posting` daily at `16:15 UTC`, equivalent to `00:15 Asia/Taipei`.
- `.env.example`, `README.md`, and `docs/deployment.md`
  - document `RECURRING_POSTING_CRON_SECRET` and the Vercel `CRON_SECRET` compatibility requirement.

## TDD Slice 9: Create-Time Current-Month Occurrence Generation

Tests written first:

- updates to `src/modules/recurring/recurring-event-command.test.ts`
  - creating a fixed-day reminder event on day 16 creates the current-month day-17 pending occurrence.
  - creating a fixed-day reminder event on day 16 does not backfill the already-passed day-1 occurrence.
  - creating a current-day immediate event creates the occurrence and posts the ledger record.
  - manually confirming a future-dated immediate occurrence returns `occurrence_not_due` without posting.

Implemented after red tests:

- `src/modules/recurring/recurring-event-command.ts`
  - creates recurring events and their optional current-month occurrence inside one transaction.
  - limits create-time occurrence generation to the new event only.
  - uses `Asia/Taipei` for the current month and today comparison.
  - creates the occurrence only when the target date is today or later.
  - posts `immediate` mode during creation only when the target date is today.
  - keeps future `immediate` occurrences pending for the scheduled cron job.
  - replaces unsafe ledger failure casting with explicit recurring failure mapping.
- `src/app/recurring-event-actions.ts`
  - maps `occurrence_not_due` to the user-facing action error message.

## Remaining Implementation

- none identified for the approved MVP behavior slice.

## TDD Slice 10: Recurring E2E And Posted Trace Closure

Tests written first:

- `e2e/recurring-events.spec.ts`
  - creates a recurring event from the existing add-record dialog.
  - verifies create-time current-month occurrence generation for a due month-end event.
  - verifies already-passed fixed-day events are not backfilled into the current month.
  - deletes a recurring event from settings after confirmation.
  - shows and confirms a pending recurring occurrence from Home.
  - includes pending recurring occurrences in Search detail flow.
  - verifies the posted ledger detail still shows the recurring event trace after confirmation.
- updates to `src/modules/fund-ledger/ledger-record-prisma-adapter.test.ts`
  - maps recurring occurrence trace labels on posted ledger records.

Implemented after red tests:

- `prisma/seed.e2e.sql`
  - updates recurring fixtures for the hardened recurring schema with event name, creator, schedule anchor, and target date.
- `src/modules/recurring/recurring-event-label.ts`
  - centralizes `週期事件` schedule/posting-mode label formatting.
- `src/modules/fund-ledger/ledger-record-prisma-adapter.ts`
  - selects recurring occurrence trace for ledger records and maps it to `recurringEventLabel`.
- `src/app/_record-detail/record-detail-flow.tsx`
  - shows recurring event labels for both pending recurring occurrences and posted recurring ledger records.

## Next Slice

Run the full verification gate and then production target-aware release readiness for the recurring event slice.
