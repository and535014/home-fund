---
id: desktop-product-structure-layout-redesign-local-dev-readiness
stage: release
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/desktop-product-structure-layout-redesign.md
  - .ai/prototype/desktop-product-structure-layout-redesign.md
  - .ai/spec/desktop-product-structure-layout-redesign.md
  - .ai/technical-design/desktop-product-structure-layout-redesign.md
  - .ai/implementation/desktop-product-structure-layout-redesign.md
  - .ai/verification/desktop-product-structure-layout-redesign.md
outputs:
  - local_dev_release_assessment
  - release_checks
  - accepted_risks
  - stricter_target_gap_list
trace_links:
  commits:
    - d8fb50a Refine desktop app layout prototype
    - 2e49955 Add desktop layout behavior spec
    - 1470e88 Add desktop layout technical design
    - d2e90e3 Add desktop layout implementation evidence
    - 49cada4 Update desktop layout E2E verification
  verification:
    - .ai/verification/desktop-product-structure-layout-redesign.md
reviewed_at: 2026-06-20
---

# Desktop Product Structure Layout Redesign Local Dev Release Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- preview_staging_production_readiness: not_ready
- rationale: The desktop IA/layout redesign is verified by lint, type-check, targeted browser checks, and the full DB-backed Playwright E2E suite. It is suitable for local development review on the existing local PostgreSQL and controlled-auth setup. No preview, staging, or production release claim is made.

## Included Local Dev Capability Changes

| Capability | Status | Evidence |
|---|---|---|
| Top-level authenticated IA is `總覽`, `搜尋`, `退款`, `設定` | ready for local_dev | dashboard E2E, `dashboard-navigation.ts` |
| Primary sidebar is icon-only and keeps `新增紀錄` in footer | ready for local_dev | create-record E2E, layout components |
| `/settings` redirects to `/settings/account` | ready for local_dev | settings route and E2E coverage |
| Member/category management lives under settings and remains admin-only | ready for local_dev | admin category/member E2E |
| `/search` and `/reimbursements` render matching `敬請期待` placeholders | ready for local_dev | dashboard/reimbursement E2E |
| `/reimbursements` remains permission-gated for admins and finance managers | ready for local_dev | permission route E2E |
| Overview dashboard renders switchable-month metrics, records, trend chart, and expense category chart | ready for local_dev | dashboard E2E and chart measurement fix |
| Create-record dialog supports `成員支出`, `收入`, and `基金支出` with custom category selector | ready for local_dev | create-record E2E |
| Recurring UI/app/module surface is removed from this product structure | ready for local_dev | removed stale recurring E2E and source/module cleanup evidence |

## Release Checks

| Check | Command / Evidence | Status |
|---|---|---|
| Lint | `corepack pnpm lint` | pass |
| Type checking | `corepack pnpm type-check` | pass |
| Targeted browser checks | `corepack pnpm exec playwright test e2e/admin-category-management.spec.ts e2e/create-record.spec.ts e2e/permission-matrix.spec.ts --reporter=line` | pass: 16 tests |
| Full E2E | `corepack pnpm test:e2e` | pass: 29 tests |
| Verification artifact | `.ai/verification/desktop-product-structure-layout-redesign.md` | pass for `local_dev` |
| Release worktree baseline | after commit `49cada4`, code worktree was clean before this release artifact was authored | pass |

## Runtime And Configuration

- No new environment variables are required.
- No Prisma migration is required for this local_dev UI/layout slice.
- Existing local dev prerequisites remain unchanged: pnpm, Docker PostgreSQL or compatible local database, Prisma generated client, and controlled-auth E2E headers outside production.
- Existing Google OAuth and Better Auth configuration are not changed by this slice.
- Recharts is already included as an application dependency and is used for dashboard trend and expense category charts.

## Local Smoke Checklist

Local reviewer smoke paths:

1. Open `/` as an admin or finance manager at a desktop viewport.
2. Confirm the primary sidebar is icon-only and exposes `總覽`, `搜尋`, `退款`, and `設定`.
3. Confirm the overview page shows month switcher, summary metrics, trend chart, pending reimbursement card, expense category card, and records table.
4. Open the month switcher middle button and confirm the dialog/backdrop positioning.
5. Use sidebar `新增紀錄`; confirm the dialog tabs show `成員支出`, `收入`, and `基金支出`.
6. Confirm category selection uses the custom radio grid and fund expense shows disabled `成員 = 基金`.
7. Open `/search` and `/reimbursements`; confirm each shows the title plus `敬請期待` without old card-heavy content.
8. Open `/settings`; confirm it redirects to `/settings/account`.
9. As admin, open `/settings/members` and `/settings/categories`; confirm both render inside the settings layout.
10. As a general member, confirm reimbursement/member/category management is not visible or directly accessible.

## Rollback

- Code rollback for local_dev can revert these commits in reverse order:
  - `49cada4 Update desktop layout E2E verification`
  - `d2e90e3 Add desktop layout implementation evidence`
  - `1470e88 Add desktop layout technical design`
  - `2e49955 Add desktop layout behavior spec`
  - `d8fb50a Refine desktop app layout prototype`
- No database rollback is needed because this slice introduced no schema or data migration.
- Reverting `d8fb50a` would restore the prior authenticated IA/layout surface, including the previous page arrangement.

## Accepted Local Dev Risks

- Visual screenshot artifacts were not captured in this release pass. Manual desktop visual review remains recommended before preview/staging.
- Prisma schema, migrations, and seed data still contain recurring objects. This is accepted for local_dev because the current slice removed the product UI/app surface only; database cleanup needs a separate migration slice if recurring is permanently dropped.
- Search is placeholder-only.
- Reimbursement settlement behavior is intentionally deferred; `/reimbursements` is a permission-gated placeholder in this slice.
- E2E uses keyboard activation for the sidebar `新增紀錄` button because the Next dev tools portal can overlap the icon-only sidebar footer in development mode; production UI is unaffected.
- Quality commands that invoke `prisma generate` should be run sequentially; parallel runs can race on generated Prisma output directories.

## Not Ready For Stricter Targets

Preview/staging/production release remains out of scope and would require:

- Desktop screenshot or visual regression review for `/`, `/search`, `/reimbursements`, `/settings/account`, `/settings/members`, `/settings/categories`, and create-record modal states.
- Hosting target and environment-specific route smoke.
- Production database target, migration/rollback runbook, and backup/restore expectations.
- Production Google OAuth origin and redirect URI smoke.
- Production secrets management for `DATABASE_URL`, Better Auth, and OAuth credentials.
- Monitoring/logging/error reporting and incident response expectations.
- Decision on whether recurring database objects should remain.
- Product decision and behavior slice for real search and reimbursement settlement workflows.

## Review Gate

- decision: ready_for_local_dev_review
- acceptance_signals:
  - Lint and type-check pass.
  - Full DB-backed Playwright E2E passes with 29 tests.
  - Verification is complete and passes for `local_dev`.
- unresolved_blockers:
  - None for local_dev.
- next_step:
  - Learning Loop if this local_dev change will be reviewed with users or used to collect feedback.
  - Otherwise Artifact Compression can summarize the completed desktop layout slice before future pruning.
