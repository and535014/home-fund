---
id: recurring-income-expense-records
stage: verification
status: review
created_at: 2026-06-30
updated_at: 2026-06-30
review_gate: pending_user_review
reviewed_at:
release_target: production
trace_links:
  - .ai/intent/recurring-income-expense-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/recurring-income-expense-records.md
  - .ai/prototype/recurring-income-expense-records.md
  - .ai/spec/recurring-income-expense-records.md
  - .ai/technical-design/recurring-income-expense-records.md
  - .ai/implementation/recurring-income-expense-records.md
---

# Recurring Income Expense Records Verification

## Result

- decision: pass_for_target_aware_release_review
- release_target_supported: production-readiness review, not direct production deployment.
- recommended_next_gate: Target-Aware Release for production.

## Scope Verified

- Recurring event management uses domain language `週期事件` in UI-facing flows while keeping Prisma table names stable as `RecurringRule` and `RecurringOccurrence`.
- Admins and finance managers can manage recurring events through `manage_recurring_events`; general members are blocked from management and settings navigation.
- Recurring creation is integrated into the existing add-record dialog through `重複`, with `不重複`, `每月固定日`, and `每月月底` routing to the correct action path.
- Fixed-day schedules are limited to 1-28, and month-end is stored as an explicit schedule anchor.
- Posting mode is explicit and defaults to `馬上入帳`.
- `/settings/recurring` reads persisted recurring events, separates desktop lists into left `支出` and right `收入`, uses mobile line tabs with counts, and deletes only after confirmation.
- Pending reminder occurrences are loaded into Home and Search as separate pending rows, excluded from ledger/report totals, not batch-selectable, and displayed with ordinary record row layout plus `未入帳` and `成員 · 週期事件`.
- Pending occurrence detail shows recurring event trace text, hides ordinary edit/delete/refund actions, and confirms through `confirmRecurringOccurrenceAction`.
- Posted recurring ledger record detail shows the same recurring event trace text after a pending occurrence is confirmed.
- Create-time current-month occurrence generation creates only the new event's current-month occurrence when the target date is today or later; it does not backfill already-passed days.
- Immediate mode posts at create time only when the target date is today, and future-dated immediate occurrences remain pending for the scheduled cron job.
- Production scheduled posting has a protected cron route and Vercel schedule documented for Taiwan time.
- Server actions use the project `ActionState` contract, typed action states, and existing `FormSubmitButton` where submit pending state is needed.
- Recurring-specific Playwright coverage now exercises create recurring event, create-time current-month occurrence generation, settings delete confirmation, Home pending confirmation, Search pending detail, and posted detail trace after confirmation.

## Commands Run

- `corepack pnpm db:validate`
  - Result: passed.
- `corepack pnpm lint`
  - Result: passed.
- `corepack pnpm type-check`
  - Result: passed.
- `corepack pnpm test`
  - Result: passed, 71 test files, 324 tests.
- `corepack pnpm build`
  - Result: passed.
- `corepack pnpm test:e2e e2e/recurring-events.spec.ts`
  - Result: passed, 5 Playwright tests.

## Trace And Alignment

- Domain rules align with `.ai/domain/home-family-fund.md`: recurring occurrence identity is event plus target month, pending items do not affect totals, and posted ledger records remain ordinary ledger facts with recurring trace.
- Technical Design is mostly implemented: server actions follow the ordinary `ActionState` shape; recurring posting uses shared ledger creation validation; pending read models stay separate from persisted ledger records.
- The prototype's local fixtures were replaced by persisted query/action paths for settings, Home, Search, and detail confirmation.
- Production operations are represented in code and docs: Prisma schema/migration, cron route, `vercel.json`, `.env.example`, `README.md`, and `docs/deployment.md`.

## Findings And Gaps

- Broad multi-month search backfill remains intentionally out of scope for MVP and is still a known product/technical limitation.
- Production release still requires target-aware checks for migration deployment, cron secret configuration, Vercel cron authorization, a safe cron dry run, runtime log review, rollback readiness, and smoke testing.

## Review Gate

- Decision needed: approve verification for production-readiness review, request additional release evidence, or block.
- Recommended next gate after approval: Target-Aware Release for `production`.
