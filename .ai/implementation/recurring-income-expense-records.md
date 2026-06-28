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
- current_slice: domain schedule validation and recurring management authorization
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

## Remaining Implementation

- Prisma schema and migration for production recurring event fields.
- persistence commands for create/delete/ensure/confirm.
- `ActionState` server actions and form parser.
- production cron route and secret handling.
- Home/Search read model for pending occurrences and recurring trace.
- replace prototype-only recurring list and prototype records.
- focused component and E2E coverage.

## Next Slice

Implement persistence schema/migration and command-level tests for `createRecurringEventInDatabase`, `deleteRecurringEventInDatabase`, `ensureRecurringOccurrencesForMonth`, and `confirmRecurringOccurrenceInDatabase`.
