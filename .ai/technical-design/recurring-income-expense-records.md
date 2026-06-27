---
id: technical-design-recurring-income-expense-records
stage: feature-technical-design
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/recurring-income-expense-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/recurring-income-expense-records.md
  - .ai/prototype/recurring-income-expense-records.md
  - .ai/spec/recurring-income-expense-records.md
  - .ai/foundation-architecture/home-family-fund.md
  - .ai/code-understanding/home-family-fund.md
outputs:
  - route_boundaries
  - server_action_contracts
  - domain_command_design
  - persistence_design
  - occurrence_generation_policy
  - read_model_design
  - authorization_design
  - test_mapping
trace_links:
  production_routes:
    - /
    - /search
    - /settings/recurring
  target_components:
    - src/app/record-entry-panel.tsx
    - src/app/ledger-record-form.ts
    - src/app/ledger-record-actions.ts
    - src/app/(app)/settings/recurring/page.tsx
    - src/app/(app)/settings/recurring/recurring-rules-prototype.tsx
    - src/app/home-dashboard-data-source.ts
    - src/app/(app)/search/_actions/record-search-actions.ts
    - src/app/_record-detail/record-list-item.tsx
    - src/app/_record-detail/record-detail-dialog.tsx
    - src/app/_record-detail/record-detail-ui.tsx
  domain_modules:
    - src/modules/recurring/recurring-event.ts
    - src/modules/recurring/recurring-event-command.ts
    - src/modules/recurring/recurring-occurrence-query.ts
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/fund-ledger/ledger-record-command.ts
    - src/modules/identity-access/authorization.ts
    - src/modules/identity-access/access-hints.ts
  persistence:
    - prisma/schema.prisma
reviewed_at:
---

# Recurring Income Expense Records Technical Design

## Decision Summary

- decision: needs_user_review
- prerequisite_status: user accepted Behavior Spec and requested this next gate on 2026-06-27.
- creation_policy: recurring events are created from the existing add-record dialog when `重複` is not `不重複`.
- management_policy: `/settings/recurring` lists and deletes recurring events; MVP does not support in-place editing.
- authorization_policy: admins and finance managers can create/delete recurring events; general members cannot. General members can confirm only self-attributed pending occurrences through ordinary ledger creation rules.
- persistence_policy: keep `RecurringRule` and `RecurringOccurrence`, but rename the domain language in code-facing types and UI to `RecurringEvent`; add explicit schedule anchor and event name fields.
- schedule_policy: fixed day 1-28 and explicit month-end only. Month-end is stored as its own anchor, not inferred from day 31.
- occurrence_policy: production uses a scheduled monthly posting command as the primary trigger, with on-demand target-month generation kept only as an idempotent fallback.
- immediate_policy: immediate occurrences are posted by a server-side `runRecurringPostingJob` command for due months; Home/Search may call `ensureRecurringOccurrencesForMonth` only to close gaps without creating duplicates.
- reminder_policy: reminder occurrences are returned as pending read-model rows and excluded from ledger/report/reimbursement totals until confirmed.
- idempotency_policy: `RecurringOccurrence @@unique([recurringRuleId, month])` plus transactional lookup/update prevents duplicate ledger records for the same event/month.
- next_gate: TDD Implementation after review approval, then Verification and Target-Aware Release for production.

## Route And Component Boundaries

### Existing Add-Record Dialog

`src/app/record-entry-panel.tsx` remains the single creation UI. It should stop short-circuiting recurring submission in local client state and submit recurring form data to a server action.

Form fields:

- existing one-off fields stay uncontrolled and continue posting `FormData`.
- add `recurrenceSchedule`: `none | fixed_day | month_end`.
- add `recurrenceDay` only for `fixed_day`.
- add `postingMode`: `immediate | reminder` only for recurring schedules.

Server action routing:

- `recurrenceSchedule = none` calls the existing `createLedgerRecordAction`.
- recurring schedules call new `createRecurringEventAction`.
- both actions can share the current uncontrolled form field names for amount, name, category, member attribution, payment source, and note.

### `/settings/recurring`

Replace the prototype-only local state with persisted data:

- server page loads recurring events through `loadRecurringEventsForSettings`.
- page guard uses `accessHints.actions.canManageRecurringEvents`.
- client list component receives persisted rows and calls `deleteRecurringEventAction`.
- delete confirmation dialog remains in the client component.
- delete success uses toast and server revalidation.

The route does not expose create or edit actions.

### Home And Search

Home and Search should not duplicate recurring UI rules. Both should consume a unified record-browsing read model:

```ts
type BrowsableRecord =
  | { kind: "ledger"; record: LedgerRecord; recurring?: RecurringTrace }
  | { kind: "recurring_pending"; occurrence: PendingRecurringOccurrence };
```

Home can keep `records` for report totals, but list rendering should use `browsableRecords`. Search should return matching ledger records plus matching pending occurrences, while aggregate totals remain ledger-only.

### Record Detail

`RecordDetailDialog` should accept a `BrowsableRecord` or a stable detail view model instead of pretending pending occurrences are ordinary `LedgerRecord` rows.

Pending detail:

- shows category/member/amount/name/date from the event-derived occurrence.
- shows date value `未入帳` in list rows and status `待入帳` in detail.
- shows info alert `週期事件：「<schedule>，<posting mode>」` for both pending and posted recurring records.
- hides edit/delete/refund actions while pending.
- calls `confirmRecurringOccurrenceAction`.

Posted recurring detail:

- uses the ordinary `LedgerRecord` detail path.
- includes recurring trace label if the ledger record is linked to a recurring occurrence.

## Authorization Design

Extend `src/modules/identity-access/authorization.ts`:

```ts
export type MemberCapability = "manage_categories" | "manage_recurring";

export type AuthorizationCommand =
  | ...
  | { type: "manage_recurring_events" }
  | { type: "confirm_recurring_occurrence"; targetMemberId: string };
```

Rules:

- `manage_recurring_events`: admin or finance manager allowed; general member denied with `finance_manager_required`.
- `confirm_recurring_occurrence`: reuse ordinary ledger creation authority for the resulting target member. Admin and finance manager can confirm any member; general member can confirm only self-attributed occurrences.
- unlinked Google account remains denied before role checks.

Extend `src/modules/identity-access/access-hints.ts`:

```ts
type AccessActionHints = {
  canManageRecurringEvents: boolean;
};

type AccessNavigationHints = {
  canOpenRecurringEvents: boolean;
};
```

Settings layout and `/settings/recurring` must use these hints instead of page-local role checks.

## Persistence Design

The existing Prisma models already point in the right direction but need explicit MVP fields.

Add enum:

```prisma
enum RecurringScheduleAnchor {
  fixed_day
  month_end
}
```

Update `RecurringRule`:

```prisma
model RecurringRule {
  id                String                  @id @default(cuid())
  householdId       String
  name              String
  type              LedgerRecordType
  amountCents       Int
  categoryId        String
  sourceMemberId    String?
  paymentSource     PaymentSource?
  payerMemberId     String?
  postingMode       RecurringPostingMode
  scheduleAnchor    RecurringScheduleAnchor
  dayOfMonth        Int?
  note              String?
  active            Boolean                 @default(true)
  createdByMemberId String
  deletedAt         DateTime?
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt

  household         Household               @relation(fields: [householdId], references: [id], onDelete: Restrict)
  category          Category                @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  createdByMember   Member                  @relation("RecurringEventCreator", fields: [createdByMemberId], references: [id], onDelete: Restrict)
  occurrences       RecurringOccurrence[]

  @@index([householdId, active])
  @@index([householdId, type, active])
}
```

Rules:

- `scheduleAnchor = fixed_day` requires `dayOfMonth` 1-28.
- `scheduleAnchor = month_end` requires `dayOfMonth = null`.
- income requires `sourceMemberId` and no payment source/payer.
- expense requires `paymentSource`; member-paid expense requires `payerMemberId`; fund expense has no payer.
- delete is soft delete: set `active = false`, `deletedAt = now()`.

Update `RecurringOccurrence`:

```prisma
model RecurringOccurrence {
  id                  String                    @id @default(cuid())
  householdId         String
  recurringRuleId     String
  month               String
  targetDate          DateTime                  @db.Date
  status              RecurringOccurrenceStatus
  ledgerRecordId      String?                   @unique
  postedByMemberId    String?
  postedAt            DateTime?
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt

  household           Household                 @relation(fields: [householdId], references: [id], onDelete: Restrict)
  recurringRule       RecurringRule             @relation(fields: [recurringRuleId], references: [id], onDelete: Cascade)
  ledgerRecord        LedgerRecord?             @relation(fields: [ledgerRecordId], references: [id], onDelete: SetNull)
  postedByMember      Member?                   @relation("RecurringOccurrencePoster", fields: [postedByMemberId], references: [id], onDelete: Restrict)

  @@unique([recurringRuleId, month])
  @@index([householdId, month, status])
}
```

Keep the table names as `RecurringRule`/`RecurringOccurrence` for migration stability if preferred, but domain-facing code, UI copy, and docs should use `RecurringEvent`.

No `LedgerRecord` snapshot fields are required. Posted trace is available through `LedgerRecord.recurringOccurrence`. Historical ledger facts remain on `LedgerRecord`; if an event is deleted later, the occurrence row and ledger row still preserve the link.

## Domain Modules

Create a new bounded module under `src/modules/recurring/`.

### `recurring-event.ts`

Own pure domain types and validation:

- `RecurringEvent`
- `CreateRecurringEventCommand`
- `DeleteRecurringEventCommand`
- `RecurringSchedule`
- `PostingMode`
- `PendingRecurringOccurrence`
- `resolveRecurringTargetDate(schedule, month)`
- `recurringEventToLedgerCommand(event, targetDate)`

Validation returns explicit failure reasons:

- `permission_denied`
- `missing_name`
- `invalid_amount`
- `missing_category`
- `archived_category`
- `category_type_mismatch`
- `invalid_schedule_anchor`
- `invalid_schedule_day`
- `invalid_posting_mode`
- `missing_source_member`
- `invalid_payment_source`
- `missing_payer_member`
- `fund_paid_expense_cannot_have_member_payer`

### `recurring-event-command.ts`

Own persistence commands:

- `createRecurringEventInDatabase(actor, command, context)`
- `deleteRecurringEventInDatabase(actor, command, context)`
- `ensureRecurringOccurrencesForMonth(actor, { month }, context)`
- `runRecurringPostingJob({ targetDate }, context)`
- `confirmRecurringOccurrenceInDatabase(actor, command, context)`

`createRecurringEventInDatabase`:

1. authorize `manage_recurring_events`.
2. load category lookups.
3. validate event shape.
4. create active event.
5. optionally call `ensureRecurringOccurrencesForMonth` for the current selected month after creation when the server action receives a month value. This is only a read-after-write convenience and must share the same idempotent code path as the production posting job.

`deleteRecurringEventInDatabase`:

1. authorize `manage_recurring_events`.
2. find active event in household.
3. set `active = false`, `deletedAt = now()`.
4. leave already posted occurrences and ledger records unchanged.
5. mark unposted pending occurrences for future months as `skipped` only if they already exist; otherwise inactive event simply stops future generation.

`ensureRecurringOccurrencesForMonth`:

1. load active events for household.
2. for each event, compute target date for month.
3. transactionally upsert `RecurringOccurrence` by `[recurringRuleId, month]`.
4. if posting mode is `reminder`, leave status `pending`.
5. if posting mode is `immediate`, create the ledger record in the same transaction only when occurrence is not already posted.
6. no silent multi-month catch-up; only the requested month is processed.

`runRecurringPostingJob`:

1. receives a trusted server-side target date, normally "today" in Asia/Taipei.
2. derives the current production target month from that date.
3. calls `ensureRecurringOccurrencesForMonth` for that single month.
4. returns counts for created pending reminders, posted immediate occurrences, skipped inactive events, and already-posted occurrences.
5. never processes arbitrary historical month ranges without a separate manual repair design.

`confirmRecurringOccurrenceInDatabase`:

1. transactionally load pending occurrence, event, category.
2. authorize `confirm_recurring_occurrence` with the resulting target member.
3. convert event to ordinary `CreateLedgerRecordCommand`.
4. create ledger record through Fund Ledger validation rules.
5. update occurrence to `posted`, set `ledgerRecordId`, `postedByMemberId`, and `postedAt`.
6. if occurrence is already posted, return `already_posted` without creating another ledger record.

The implementation can either expose a transaction-aware helper in `ledger-record-command.ts` or move shared create-data mapping into a reusable adapter. Avoid duplicating ledger validation in the recurring module.

## Server Actions

Add `src/app/recurring-event-actions.ts`.

Actions:

- `createRecurringEventAction(previousState, formData)`
- `deleteRecurringEventAction(previousState, formData)`
- `confirmRecurringOccurrenceAction(previousState, formData)`

These are ordinary form-mutation server actions and must follow the existing project action contract:

- file starts with `"use server"`.
- action signature is `(previousState: ActionState<...>, formData: FormData) => Promise<ActionState<...>>`.
- parse `FormData` in a dedicated parser, following `src/app/ledger-record-form.ts`.
- authorize through `requireMutationAccess(command)` when a single authorization command is enough, or through `requireMutationAccess()` plus domain-level authorization when the target member must be loaded first.
- call one database/domain command from the action, passing `getPrismaClient()` and `session.access.member.householdId`.
- map domain failures into typed action codes and field errors with `actionError`.
- return success through `actionSuccessWithRevalidation`.
- keep UI messages in the action mapping layer; domain modules return stable reasons, not user-facing copy.
- wrap unexpected persistence/runtime errors, log server-side detail with `console.error`, and return a generic action error.

Do not introduce a second server-action result shape for these form mutations. CSV import uses a custom preview protocol because it is a multi-step file preview flow; recurring create/delete/confirm should use the ordinary `ActionState` pattern already used by ledger record create/update/delete.

Action state types:

```ts
export type CreateRecurringEventActionState = ActionState<
  { recurringEventId: string },
  CreateRecurringEventActionField,
  CreateRecurringEventActionCode
>;

export type DeleteRecurringEventActionState = ActionState<
  { recurringEventId: string },
  DeleteRecurringEventActionField,
  DeleteRecurringEventActionCode
>;

export type ConfirmRecurringOccurrenceActionState = ActionState<
  { occurrenceId: string; recordId: string },
  ConfirmRecurringOccurrenceActionField,
  ConfirmRecurringOccurrenceActionCode
>;
```

Parsing:

- keep recurring parsing near `ledger-record-form.ts` or add `recurring-event-form.ts`.
- reuse field names from the existing add-record dialog.
- parse `month` from a hidden field when available so Home can immediately generate the viewed month after creation.
- parser functions return discriminated parse results, not thrown validation errors.
- parser failure reasons map to field names such as `recordType`, `name`, `amountTwd`, `categoryId`, `sourceMemberId`, `payerMemberId`, `paymentSource`, `recurrenceSchedule`, `recurrenceDay`, `postingMode`, `recurringEventId`, and `occurrenceId`.

## Production Scheduled Trigger

Add a protected route handler:

- `src/app/api/cron/recurring-posting/route.ts`

Route behavior:

1. require `RECURRING_POSTING_CRON_SECRET` in production.
2. require `Authorization: Bearer <secret>` or an equivalent shared-secret header.
3. reject missing or invalid credentials with `401`.
4. call `runRecurringPostingJob` with the server's current date interpreted in `Asia/Taipei`.
5. return JSON counts and avoid exposing household financial details in the response.

Scheduling:

- add a production scheduled workflow or platform cron that calls `/api/cron/recurring-posting` daily after midnight Taiwan time.
- daily cadence is intentional even though events are monthly; it handles month-end, fixed-day events, delayed deploys, and short outages without needing per-day cron edits.
- the route itself decides which events are due today or due for the current month and idempotently no-ops when nothing needs posting.

Operational policy:

- the scheduled trigger is the production source of truth for immediate posting timing.
- Home/Search on-demand ensure remains a fallback for stale data after missed cron runs, but it must not be required for correctness.
- production release must document the cron secret, workflow/platform schedule, first successful run, and runtime log check.

Success revalidation:

- create: `/`, `/search`, `/settings/recurring`
- delete: `/`, `/search`, `/settings/recurring`
- confirm: `/`, `/search`, `/refunds`

Error states:

- stale deleted event: `event_not_found`
- stale occurrence: `occurrence_not_found`
- duplicate/already posted: `already_posted`
- authorization: `permission_denied`
- validation failures mirror the domain command.

Action placement:

- the add-record dialog imports only `createRecurringEventAction` in addition to the existing ledger action.
- settings recurring list imports only `deleteRecurringEventAction`.
- record detail imports only `confirmRecurringOccurrenceAction`.
- client components should continue using `useActionState` or the existing action-state effect helpers rather than custom `fetch` calls for these form mutations.
- the production cron route is not a form server action; it is a route handler with secret-based machine authorization and should call the same domain command as the actions.

## Read Model And Query Design

### Home

Extend `createHomeDashboardDataSource`:

- continue loading ledger records for monthly report and yearly trend.
- call `ensureRecurringOccurrencesForMonth` before loading pending occurrences for the selected month only as an idempotent fallback. The production scheduled trigger is still responsible for timely immediate posting.
- load pending occurrences separately with event, category, member references.
- return:

```ts
type HomeDashboardData = {
  records: LedgerRecord[];
  yearlyRecords: LedgerRecord[];
  pendingRecurringOccurrences: PendingRecurringOccurrence[];
  recurringTraceByLedgerRecordId: Record<string, RecurringTrace>;
};
```

Reports, reimbursement tables, and trend charts use only `records`/`yearlyRecords`, preserving pending-total exclusion.

`HomeRecordTabs` receives merged list data:

- pending occurrences sorted alongside ledger records by target date.
- pending rows use existing `RecordSummaryContent` through a small adapter/view model, not by fabricating fake `LedgerRecord` IDs.

### Search

Extend `loadRecordSearchPageInDatabase` carefully:

- ledger aggregate totals and total count remain ledger-only unless product later defines a separate pending count.
- load pending occurrences that match the same filters:
  - type
  - category
  - participant
  - date range by `targetDate`
  - search by event name or exact amount
  - reimbursement filter excludes pending occurrences because pending items are not reimbursement-eligible.
- merge pending rows into the visible first page after ledger rows for MVP, sorted by selected sort.

Cursor pagination across mixed ledger/pending rows can be complex. MVP design should avoid pretending full mixed pagination is solved:

- keep ledger pagination cursor unchanged.
- include matching pending occurrences for the requested filter window on each first-page load.
- if a later page is requested, do not repeat pending occurrences already shown; the client can keep loaded IDs, or the action can accept an optional `seenPendingOccurrenceIds`.

This is acceptable for production MVP because pending occurrence volume is bounded by active recurring events per household, but it should be reworked if households later accumulate hundreds of active recurring events.

## Immediate Posting Timing

For production, immediate posting is scheduled first and on-demand second:

- A protected production cron route runs daily after midnight Asia/Taipei and posts due immediate occurrences for the current target month.
- Home month load may call `ensureRecurringOccurrencesForMonth` for the selected month to close gaps after a missed or delayed scheduled run.
- Search with a date range may ensure pending reminder visibility for one selected month, but broad multi-month search does not silently backfill every month.
- Creating a recurring event can ensure the currently selected month if the form includes `month`; duplicate prevention still applies.

The first production version does not need a queue or distributed worker. It does need one deterministic scheduled HTTP trigger and a production secret.

## Deletion Semantics

Deleting an event:

- soft-deletes the event.
- stops future scheduled and on-demand generation.
- leaves posted ledger records active.
- leaves posted occurrences linked to ledger records.
- changes existing unposted future pending occurrences to `skipped` when they already exist.
- does not remove ledger records from Home/Search; ordinary ledger correction handles wrong posted records.

If a user has a pending detail open while another actor deletes the event, confirmation returns `event_not_found` or `occurrence_not_found` and asks the user to refresh.

## UI State And Error Strategy

- Add-record dialog shows recurring creation success through the existing feedback region/toast pattern and closes on success.
- Settings delete uses the existing confirmation dialog and toast.
- Pending confirmation uses a primary `確認入帳` button; on success the detail closes or refreshes into the posted detail.
- Already-posted duplicate attempts show a non-destructive message such as `這筆週期事件已入帳。`
- Unauthorized direct commands return action errors; UI hiding is not treated as authorization.

## Test Mapping

### Domain And Unit

- `resolveRecurringTargetDate` fixed day 1-28 and month-end for February leap/non-leap, April, November, January.
- fixed day 29-31 rejected.
- event creation validates category type/status and income/expense member/payment-source shape.
- admin and finance manager can manage events; general member cannot.
- general member can confirm self-attributed pending occurrence and cannot confirm another member's occurrence.
- event-to-ledger command preserves amount, name, category, note, member attribution, payment source, and reimbursement eligibility after ledger creation.

### Persistence And Command

- creating event persists explicit schedule anchor and creator.
- delete soft-deletes event and leaves posted ledger records unchanged.
- ensure month creates one occurrence per active event/month.
- ensure month posts immediate occurrences once only.
- reminder occurrence stays pending until confirmation.
- confirmation creates one ledger record, links occurrence, and rejects duplicate confirmation.
- deleting active event skips already-created future pending occurrences only.

### Query And Reporting

- Home monthly data returns pending occurrences separately from ledger records.
- pending occurrences are excluded from monthly totals, category summaries, reimbursement table, and yearly trend.
- Search includes matching pending occurrences but keeps aggregate total ledger-only.
- reimbursement-status filter does not include pending member-paid recurring expenses.
- recurring trace is available for posted ledger record detail.

### Component And E2E

- create dialog field switching for `不重複`, `每月固定日`, and `每月月底`.
- ordinary one-off creation still calls `createLedgerRecordAction`.
- recurring create calls `createRecurringEventAction`.
- `/settings/recurring` permission, desktop two columns, mobile tabs, delete dialog, toast.
- Home/Search pending rows display `成員 · 週期事件`, `未入帳`, softer opacity, and same item layout.
- detail info alert shows schedule/posting mode for pending and posted recurring records.
- pending confirmation creates posted record and prevents duplicate.

## Release Target Implications

- production requires a Prisma migration and generated Prisma client update.
- seed/e2e fixtures should include admin, finance manager, general member, two members, income/expense categories, recurring events, pending occurrence, and posted occurrence.
- production requires `RECURRING_POSTING_CRON_SECRET` and a configured scheduled trigger for `/api/cron/recurring-posting`.
- production readiness must verify migration deploy, cron route authorization, one scheduled or manually triggered dry run against safe data, post-deploy smoke, and Vercel/runtime log review.
- no external notification provider, queue, or distributed worker is required for this MVP.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - Confirm production immediate posting should be driven by a daily scheduled protected HTTP trigger.
  - Confirm on-demand target-month generation is only a fallback, not the primary production behavior.
  - Confirm Search aggregate totals should remain ledger-only while pending occurrences appear in visible results.
  - Confirm deleting an event should soft-delete the event and skip only already-created unposted future occurrences.
  - Confirm schema should store explicit `scheduleAnchor` and event `name` even though the current prototype schema has only `dayOfMonth`.
- must_check:
  - TDD Implementation must start with domain tests for schedule resolution, authorization, idempotency, and pending-total exclusion.
  - Implementation must not duplicate ledger creation rules in the recurring module.
  - Pending occurrences must not be represented as fake persisted ledger records.
- unresolved_blockers:
  - Broad multi-month search backfill is intentionally not supported in MVP.
  - Queue-based retries, external notifications, and broad missed-month catch-up remain out of scope.
- next_step:
  - TDD Implementation for `recurring-income-expense-records` after this design is approved or risks are explicitly accepted.
