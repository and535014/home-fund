---
id: release-category-visual-identity-local-dev-readiness
stage: release
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-visual-identity.md
  - .ai/spec/category-visual-identity.md
  - .ai/technical-design/category-visual-identity.md
  - .ai/implementation/category-visual-identity.md
  - .ai/verification/category-visual-identity.md
outputs:
  - local_dev_release_assessment
  - migration_readiness
  - smoke_check_plan
  - accepted_risks
trace_links:
  commits:
    - ba051b5
    - ff13aed
    - fe0e30a
  migration:
    - prisma/migrations/20260620093000_add_category_visual_identity/migration.sql
  scripts:
    - package.json
    - prisma/seed.sql
    - prisma/seed.e2e.sql
    - e2e/setup-db.sh
    - e2e/run-playwright.sh
reviewed_at: 2026-06-20
---

# Category Visual Identity Local Dev Release Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_ready
- rationale: The category visual identity and ordering slice has passing lint, type-check, unit, build, schema validation, full DB-backed E2E verification, focused post-adjustment create-record E2E, and successful migration application through the E2E database setup.

## Release Scope

Included in this local_dev readiness assessment:

- Persist category `color`, `icon`, and `sortOrder`.
- Apply category visual identity migration and seed defaults.
- Let admins create, update, archive, and reorder active categories with visual identity.
- Display active expense/income category panels without archived tabs/lists.
- Apply persisted category order to new-record category choices.
- Show category visual marks in record creation, record list media, and dashboard category summaries.
- Keep dialog header/footer fixed while dialog body scrolls.
- Use a single-line Input for record notes.

Out of scope:

- Production deployment readiness.
- Hosted database migration rollout or rollback.
- Production Google OAuth smoke.
- Monitoring, alerting, analytics, and incident response.

## Release Checks

| Check | Evidence | Status |
|---|---|---|
| Prisma schema validation | `corepack pnpm db:validate` | pass |
| Migration application | `corepack pnpm test:e2e` and focused E2E setup applied `20260620093000_add_category_visual_identity` to `home_fund_e2e` | pass |
| Seed compatibility | `e2e/setup-db.sh` ran `db:seed` and `db:seed:e2e` successfully | pass |
| Lint | `corepack pnpm lint` | pass |
| Type-check | `corepack pnpm type-check` | pass |
| Unit/domain tests | `corepack pnpm test`, 29 files / 132 tests | pass |
| Build | `corepack pnpm build` | pass |
| Full browser E2E | `corepack pnpm test:e2e`, 36 tests | pass in Verification |
| Focused post-dialog/note browser E2E | `sh e2e/setup-db.sh && sh e2e/run-playwright.sh e2e/create-record.spec.ts`, 7 tests | pass |
| Git working tree before release artifact | `git status --short` | clean before this release artifact was written |

## Local Dev Runtime Requirements

- Docker Desktop must be running.
- Local PostgreSQL container must be available on `127.0.0.1:5432`.
- Apply migrations before local review:
  - `corepack pnpm db:deploy`
- Refresh local seed data when a deterministic demo state is desired:
  - `corepack pnpm db:seed`
- Start the app:
  - `corepack pnpm dev`
- Review routes:
  - `/settings/categories`
  - `/?month=2026-06`

## Smoke Checks

Recommended local smoke after applying migrations and seed:

1. Open `/settings/categories` as admin.
2. Confirm `支出分類` and `收入分類` panels are visible and no archived tab is shown.
3. Create a new expense category with color/icon and confirm it appears at the bottom of expense order.
4. Edit an active category name/color/icon and confirm the row updates.
5. Reorder an active category using the sort handle or focused handle ArrowUp/ArrowDown.
6. Open the create-record dialog and confirm category choices use visual marks and persisted order.
7. Create a record with a one-line note and confirm the detail dialog shows the note.
8. Confirm dashboard category summary rows show visual labels and color bars.

## Accepted Local Dev Risks

- Full production migration rollout and rollback are not assessed.
- Browser E2E covers category management create/archive and record/dashboard visual behavior, but does not currently simulate drag reorder directly.
- Dialogs intentionally omit visible extra descriptions in several category flows per product direction; Radix may log warnings unless a hidden description or `aria-describedby={undefined}` is added later.
- Quality scripts that run `prisma generate` should be run sequentially; parallel runs can race on generated Prisma output directories.
- E2E depends on Docker Desktop and local Postgres availability.

## Not Production Ready

Production release remains blocked until these are selected and verified:

- Hosting target and database target.
- Production `DATABASE_URL`, `BETTER_AUTH_SECRET`, OAuth origin, and redirect URI.
- Migration rollout, rollback, backup, and restore plan.
- Production smoke using real OAuth sessions for admin and non-admin category permissions.
- Monitoring/log access and alerting.
- Accessibility review for dialog description policy and drag/keyboard reorder.
- Analytics or feedback plan if category ordering/visual identity is evaluated post-launch.

## Handoff

- decision: ready_for_user_local_dev_review
- recommended_next_gate: learning-loop
- reviewer_focus:
  - confirm local_dev readiness is enough for this slice
  - confirm no production readiness is implied
  - confirm whether Learning Loop should be minimal or skipped for this local_dev-only feature
- stop_condition: Wait for explicit user approval before committing this release artifact or starting Learning Loop.
