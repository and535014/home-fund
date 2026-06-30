---
id: release-recurring-income-expense-records-production-readiness
stage: target-aware-release
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
  - .ai/technical-design/recurring-income-expense-records.md
  - .ai/implementation/recurring-income-expense-records.md
  - .ai/verification/recurring-income-expense-records.md
  - docs/deployment.md
  - .github/workflows/deploy-production.yml
  - vercel.json
outputs:
  - production_readiness_decision
  - release_scope
  - production_preflight_evidence
  - migration_and_data_safety
  - secrets_and_cron_requirements
  - smoke_check_plan
  - rollback_plan
  - residual_risks
trace_links:
  implementation_commits:
    - 445638d0 Implement recurring event domain rules
    - 3219934f Add recurring event persistence commands
    - 47e0ee0c Add recurring event server actions
    - 7b31f3cb Wire record entry recurring event creation
    - 858ec0b7 Load persisted recurring events in settings
    - 882209c3 Show persisted pending recurring occurrences
    - fee09238 Confirm persisted recurring occurrences from detail
    - 72f719a9 Add production recurring posting cron
    - 132418ef Add current-month recurring occurrences
    - 131907a0 Cover recurring event verification gaps
  verification:
    - .ai/verification/recurring-income-expense-records.md
  deployment_workflow:
    - .github/workflows/deploy-production.yml
  deployment_docs:
    - docs/deployment.md
reviewed_at:
---

# Recurring Income Expense Records Production Readiness

## Decision

- decision: ready_with_required_production_release_steps
- production_code_candidate: pass
- release_execution_handoff: blocked_until_version_tag_production_env_and_live_evidence
- rationale: The recurring event slice passed available workspace verification, including schema validation, lint, type-check, unit tests, production build, and recurring-specific Playwright E2E. Production deployment still requires an immutable version tag, production environment approval, database migration execution, Vercel cron/runtime secret confirmation, live cron route smoke, runtime log review, and post-deploy product smoke.

This artifact is a production readiness review. It does not claim the feature is already deployed.

## Release Scope

In scope:

- Add monthly recurring income and expense events created from the existing add-record dialog.
- Support `不重複`, `每月固定日` for days 1-28, and explicit `每月月底`.
- Support posting modes `馬上入帳` and `提醒入帳`.
- Persist recurring event definitions and monthly occurrences through `RecurringRule` and `RecurringOccurrence`.
- Show recurring event management at `/settings/recurring` for admins and finance managers.
- Delete recurring events after confirmation; MVP does not support in-place editing.
- Show pending reminder occurrences in Home and Search without affecting ledger totals.
- Confirm pending occurrences from record detail into ordinary ledger records with recurring trace.
- Preserve recurring trace labels on posted recurring ledger record details.
- Run production scheduled posting through protected `GET /api/cron/recurring-posting`.
- Schedule the route in `vercel.json` daily at `16:15 UTC`, Taiwan time `00:15`.

Out of scope:

- External notifications, calendar integrations, bank sync, payment execution, or queues.
- Non-monthly schedules.
- Editing, pausing, end dates, or duplicating recurring events.
- Broad multi-month missed-occurrence backfill.
- Confirmation-time edits to amount/category/member/date.

## Production Preflight Evidence

Passed on 2026-06-30:

```bash
corepack pnpm db:validate
```

Result: passed. Prisma schema is valid.

```bash
corepack pnpm lint
```

Result: passed.

```bash
corepack pnpm type-check
```

Result: passed.

```bash
corepack pnpm test
```

Result: passed. 71 test files, 324 tests.

```bash
corepack pnpm build
```

Result: passed. Next.js production build completed and includes dynamic `/settings/recurring` and `/api/cron/recurring-posting` routes.

```bash
corepack pnpm test:e2e e2e/recurring-events.spec.ts
```

Result: passed. 5 Playwright tests.

Additional verification evidence:

- `.ai/verification/recurring-income-expense-records.md` records the full recurring verification result.
- Recurring E2E covers creation from the existing add-record dialog, create-time current-month occurrence generation, no backfill for already-passed fixed days, settings delete confirmation, Home pending confirmation, Search pending detail, and posted detail recurring trace.

## Migration And Data Safety

This release includes Prisma migration `20260628093000_harden_recurring_events`.

The migration:

- creates enum `RecurringScheduleAnchor`.
- adds `RecurringRule.name`, `scheduleAnchor`, `createdByMemberId`, and `deletedAt`.
- backfills `name` to `週期事件` where missing.
- backfills `createdByMemberId` to the earliest member in the same household.
- deletes `RecurringRule` rows only when no same-household member exists to satisfy the new non-null creator invariant.
- adds `RecurringOccurrence.targetDate`, `postedByMemberId`, and `postedAt`.
- backfills `targetDate` from occurrence month and rule day, clamped to month end.
- adds recurring indexes and foreign keys.

Required before production execution:

- Confirm Neon backup/restore or point-in-time recovery is available before migration.
- If production already has recurring rules, inspect whether any `RecurringRule` rows belong to households without members. Those rows would be deleted by the migration because they cannot satisfy `createdByMemberId`.
- Confirm `corepack pnpm db:deploy` runs only through the production workflow, not from a local shell.

Rollback implications:

- Vercel app rollback alone does not roll back recurring schema changes or posted ledger records.
- If migration rollback is needed, use Neon backup/PITR or a forward migration plan.
- Confirmed or immediate recurring ledger records are ordinary financial facts; correcting them after release uses ordinary ledger correction/deletion workflows.

## Secrets And Cron Requirements

New production runtime config:

- `RECURRING_POSTING_CRON_SECRET`
- Optional compatibility: `CRON_SECRET` with the same value when relying on Vercel Cron automatic Authorization header.

Existing production config remains required:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `CSV_IMPORT_PREVIEW_SECRET`
- `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Production readiness requirements:

- Vercel Production runtime must have `RECURRING_POSTING_CRON_SECRET`.
- If Vercel Cron uses platform Bearer authorization, Vercel Production runtime must also have `CRON_SECRET` set to the same value.
- GitHub Environment `production` should store the recurring cron secret if deployment or smoke automation later needs to call the route from Actions.
- The secret must not reuse `BETTER_AUTH_SECRET`.

## Auth And Permission Checks

Covered by implementation/tests:

- `/settings/recurring` is visible only to admins and finance managers.
- Direct general-member access is blocked by app access hints/page guard.
- Create/delete recurring events require `manage_recurring_events`.
- Confirmation uses recurring occurrence authorization and ordinary ledger creation rules.
- Pending recurring rows are not selectable for batch ledger mutations in Search.

Production smoke still must confirm:

- Admin or finance manager sees `設定 > 週期事件`.
- General member cannot see or open recurring settings.
- A pending recurring occurrence attributed to the signed-in member can be confirmed.
- Unauthorized cross-member confirmation remains denied if a safe production fixture exists.

## Routing, SEO, And Indexing

- `/settings/recurring`, Home, Search, and record detail are authenticated app routes.
- `/api/cron/recurring-posting` is a machine route protected by Bearer secret in production.
- No public SEO route changes are introduced.
- Production build route table includes `ƒ /settings/recurring` and `ƒ /api/cron/recurring-posting`.

## Observability And Monitoring

Minimum post-deploy checks:

- Vercel runtime logs show no recurring query or Prisma errors on Home, Search, and `/settings/recurring`.
- Cron route logs show no repeated `Recurring posting cron failed` errors.
- First scheduled Vercel cron execution is visible after deployment.
- Manual cron dry run with correct secret returns summary counts without exposing household financial details.

Known inherited operational gap:

- No dedicated error monitoring provider is configured yet. Runtime log review remains the required production observation path for this slice.

## Production Deployment Requirements

Before release execution:

1. Merge or otherwise place commit `131907a0` and its prerequisite recurring commits on the production release branch.
2. Create an immutable semver production tag, for example `v0.1.7`.
3. Confirm Vercel Production runtime env includes `RECURRING_POSTING_CRON_SECRET` and, if needed, `CRON_SECRET`.
4. Confirm Neon backup/PITR is available.
5. Push the tag to trigger `.github/workflows/deploy-production.yml`, or run the manual workflow for that existing tag.
6. Obtain GitHub Environment `production` approval.
7. Confirm workflow passes install, `db:validate`, `type-check`, `lint`, `test`, `build`, `db:deploy`, Vercel build/deploy, and workflow smoke for `/login` and `/favicon.ico`.

After release execution:

1. Record production URL.
2. Record GitHub Actions run URL.
3. Record Vercel deployment URL.
4. Execute the smoke checklist below.
5. Update or create a release-execution artifact with evidence.

## Production Smoke Checklist

Required general smoke:

- `/login` opens.
- Google sign-in starts from the production origin.
- Admin member reaches dashboard.
- General member cannot access admin-only settings routes.
- Logout returns to login.
- Main ledger list loads existing data.

Required recurring smoke:

- Admin or finance manager opens `/settings/recurring`.
- Add-record dialog shows `重複`, `每月固定日`, `每月月底`, and `入帳模式`.
- Create a safe reminder recurring event for a current or future date and confirm it appears as `未入帳` in Home/Search without changing totals before confirmation.
- Confirm a safe pending recurring occurrence and verify a posted ledger record appears with `週期事件：「...」` detail trace.
- Delete a test recurring event from settings after confirmation.
- Call `/api/cron/recurring-posting` with an invalid Bearer token and confirm `401`.
- Call `/api/cron/recurring-posting` with the correct secret and confirm an `ok: true` summary response.
- Review Vercel runtime logs for recurring posting errors.

## Rollback Plan

- App code rollback: use Vercel rollback or redeploy a previous immutable tag.
- Database rollback: use Neon backup/PITR or forward migration. Do not rely on app rollback for schema rollback.
- Financial data rollback: posted recurring ledger records should be corrected through ordinary ledger correction/deletion workflows unless a broader incident requires database restore.
- Cron rollback: disable Vercel cron or rotate/remove `RECURRING_POSTING_CRON_SECRET` if scheduled posting must be stopped while the app remains online.

## Residual Risks

- Broad multi-month catch-up remains intentionally out of scope; missed historical occurrences require a future repair design.
- Production has no preview/staging environment, so first hosted migration execution is production.
- Monitoring is manual through Vercel runtime logs until a dedicated error reporting provider exists.
- The production workflow summary does not yet automate recurring cron smoke; it must be done manually after deployment.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm production release can proceed with required release execution steps.
  - Confirm recurring cron secret and Vercel Cron configuration are ready.
  - Confirm Neon backup/PITR is available before migration.
  - Confirm safe production smoke data or manual test procedure for recurring create/confirm/delete.
- must_check:
  - Do not hand off to release execution until a version tag, production env confirmation, migration/backup readiness, and smoke plan are accepted.
  - Do not call production cron without the correct secret.
  - Do not run production migration from a local shell.
- acceptance_signals:
  - Verification evidence is complete for the MVP slice.
  - Production deployment requirements and smoke checks are explicit.
  - Rollback and data-safety expectations are documented.
- unresolved_blockers:
  - Production live evidence does not exist yet.
  - Production cron secret/config confirmation has not been recorded yet.
  - Neon backup/PITR confirmation has not been recorded yet.
- next_step:
  - Release Execution only after the required production release steps are accepted and a version tag is available.
