---
id: release-category-archive-visibility-toggle-local-dev-readiness
stage: release
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-archive-visibility-toggle.md
  - .ai/domain-impact/category-archive-visibility-toggle.md
  - .ai/prototype/category-archive-visibility-toggle.md
  - .ai/spec/category-archive-visibility-toggle.md
  - .ai/technical-design/category-archive-visibility-toggle.md
  - .ai/implementation/category-archive-visibility-toggle.md
  - .ai/verification/category-archive-visibility-toggle.md
outputs:
  - local_dev_release_assessment
  - smoke_check_plan
  - accepted_risks
trace_links:
  commits:
    - fb35d6ba
    - 8a37a91f
  routes:
    - /settings/categories
    - /
  scripts:
    - package.json
    - prisma/seed.sql
    - prisma/seed.e2e.sql
    - e2e/setup-db.sh
    - e2e/run-playwright.sh
reviewed_at: 2026-06-26
---

# Category Archive Visibility Toggle Local Dev Release Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_ready
- rationale: The slice has passing full unit tests, lint, type-check, schema validation, focused category-management E2E, desktop/mobile visual probe evidence, and production build. It does not include a schema migration; local and E2E seed updates are compatible with existing database shape.

## Release Scope

Included in this local_dev readiness assessment:

- Show a page-level `顯示封存分類` switch on `/settings/categories`.
- Hide archived categories by default.
- Show archived categories below active categories when the switch is on.
- Render archived rows with an `已封存` icon in item media aligned with active-row drag handles.
- Expose icon-only `取消封存 <分類名稱>` for archived rows.
- Persist unarchive through server action, category command adapter, and Categorization domain command.
- Append restored categories to the bottom of active ordering for the same type.
- Keep archived categories out of new-record choices until restored.
- Add local and E2E seed archived income/expense categories.

Out of scope:

- Production deployment readiness.
- Persisting archive visibility switch preference.
- Editing archived categories before restore.
- Bulk archive/unarchive.
- Hosted environment smoke checks.
- Monitoring, alerting, analytics, and incident response.

## Release Checks

| Check | Evidence | Status |
|---|---|---|
| Prisma schema validation | `corepack pnpm db:validate` | pass |
| Lint | `corepack pnpm lint` | pass |
| Type-check | `corepack pnpm type-check` | pass |
| Unit/domain regression | `corepack pnpm test`, 45 files / 218 tests | pass |
| Build | `corepack pnpm build` | pass |
| Focused browser E2E | `corepack pnpm test:e2e e2e/admin-category-management.spec.ts`, 7 tests | pass |
| Desktop/mobile visual probe | temporary Playwright spec, screenshots at `/private/tmp/category-archive-desktop.png` and `/private/tmp/category-archive-mobile.png` | pass |
| E2E DB setup and seed compatibility | focused E2E runs applied migrations and ran `db:seed` plus `db:seed:e2e` | pass |
| Git working tree before release artifact | `git status --short` | clean before this release artifact was written |

## Local Dev Runtime Requirements

- Docker Desktop must be running for E2E-backed local review.
- Local PostgreSQL container must be available on `127.0.0.1:5432`.
- Apply existing migrations before local review:
  - `corepack pnpm db:deploy`
- Refresh seed data when deterministic archived category examples are desired:
  - `corepack pnpm db:seed`
- Start the app:
  - `corepack pnpm dev`
- Review routes:
  - `/settings/categories`
  - `/?month=2026-06`

## Smoke Checks

Recommended local smoke after applying migrations and seed:

1. Open `/settings/categories` as an admin.
2. Confirm `顯示封存分類` is off by default.
3. Confirm archived seed categories such as `舊餐飲` and `舊收入` are hidden.
4. Turn on `顯示封存分類`.
5. Confirm archived rows appear below active rows in their matching panels.
6. Confirm archived rows show the `已封存` icon and only the `取消封存` icon button.
7. Click `取消封存 舊餐飲` and confirm toast `分類已取消封存`.
8. Open `/?month=2026-06`, start a new record, and confirm `舊餐飲` is available in the category choices after restore.
9. Confirm a non-admin member still cannot access category management from settings.

## Accepted Local Dev Risks

- Full Playwright suite was not rerun for this gate; focused category-management E2E plus full Vitest/lint/type/build/schema checks passed.
- Temporary visual probe was not committed as a permanent E2E spec; it was used as release evidence and removed to avoid test suite expansion without product need.
- Production OAuth, hosted database, backups, monitoring, and rollback are not assessed for this local_dev release target.
- E2E and visual probes depend on Docker Desktop and local Postgres availability.

## Not Production Ready

Production release remains blocked until these are selected and verified:

- Hosting target and database target.
- Production `DATABASE_URL`, `BETTER_AUTH_SECRET`, OAuth origin, and redirect URI.
- Production smoke using real OAuth sessions for admin and non-admin category permissions.
- Rollback and recovery procedure for category status changes.
- Monitoring/log access and alerting for server action failures.
- Accessibility review for archived-row icon-only controls in production browsers.
- Analytics or feedback plan if archive recovery usage needs to be evaluated post-launch.

## Handoff

- decision: ready_for_user_local_dev_review
- recommended_next_gate: learning-loop
- reviewer_focus:
  - confirm local_dev readiness is enough for this category archive visibility slice
  - confirm no production readiness is implied
  - decide whether Learning Loop should be minimal for this local_dev-only feature
- stop_condition: Wait for explicit user approval before starting Learning Loop or Artifact Compression.
