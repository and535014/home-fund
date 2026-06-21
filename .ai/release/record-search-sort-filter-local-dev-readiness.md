---
id: release-record-search-sort-filter-local-dev-readiness
stage: release
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-search-sort-filter.md
  - .ai/spec/record-search-sort-filter.md
  - .ai/technical-design/record-search-sort-filter.md
  - .ai/implementation/record-search-sort-filter.md
  - .ai/verification/record-search-sort-filter.md
outputs:
  - local_dev_release_assessment
  - smoke_check_plan
  - accepted_risks
trace_links:
  commits:
    - 05a7fe1
    - 7df0fa0
  routes:
    - /search
    - /
  scripts:
    - package.json
    - e2e/setup-db.sh
    - e2e/run-playwright.sh
reviewed_at: 2026-06-21
---

# Record Search Sort Filter Local Dev Release Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_ready
- rationale: The record search, sort, and filter slice has passing type-check, lint, full unit suite, production build, and focused DB-backed browser E2E. It introduces no schema migration, no new secrets, no auth provider changes, and no production deployment claim.

## Release Scope

Included in this local_dev readiness assessment:

- `/search` search-page experience with no page header.
- Keyword search by record name and formatted amount only.
- Icon-only clear-search and filter buttons.
- Filter/sort modal with apply-only semantics.
- Type, active category, member/fund participation, reimbursement status, optional date range, and sort controls.
- Initial empty prompt and empty matched-result state.
- Search result detail continuity through existing record detail dialog.
- Shared list/detail shell separated from search query ownership.
- Active-record-only search page data source.

Out of scope:

- Production deployment readiness.
- URL persistence or shareable search links.
- Server-side search pagination/indexing for production-scale ledgers.
- Analytics, monitoring, alerting, or post-release product instrumentation.

## Release Checks

| Check | Evidence | Status |
|---|---|---|
| Type-check | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass |
| Unit/domain tests | `corepack pnpm test`, 30 files / 152 tests | pass |
| Production build | `corepack pnpm build` | pass |
| Focused browser E2E | `corepack pnpm test:e2e e2e/record-search.spec.ts`, 5 tests | pass |
| Migration need | No Prisma schema change in this slice | not_applicable |
| Secret/config change | No new environment variables or OAuth changes | not_applicable |

## Local Dev Runtime Requirements

- Docker Desktop must be running for E2E/database-backed local checks.
- Local PostgreSQL container must be available on `127.0.0.1:5432`.
- Apply existing migrations before local review if the database is not current:
  - `corepack pnpm db:deploy`
- Refresh seed data when deterministic local data is desired:
  - `corepack pnpm db:seed`
- Start the app:
  - `corepack pnpm dev`
- Review routes:
  - `/search`
  - `/?month=2026-06`

## Smoke Checks

Recommended local smoke:

1. Open `/search` as an authenticated household member.
2. Confirm no page header is visible and the initial prompt says `請輸入關鍵字或設定篩選條件。`.
3. Search by a record name and confirm matching records appear.
4. Clear the search field with the `X` button and confirm the initial prompt returns.
5. Search by a formatted amount, such as `899`, and confirm the expected record appears.
6. Open `篩選與排序`, change controls, close without applying, and confirm results do not change.
7. Reopen the modal, apply type and `收支對象` filters, and confirm the result list updates.
8. Select `收入` and confirm `基金` is not available in `收支對象`.
9. Apply `未退款` and confirm member-paid refundable expenses appear while income/fund-paid records are absent.
10. Open a result detail and confirm existing detail actions still render according to permissions.
11. Open `/` and confirm the dashboard `紀錄` panel remains a recent-record summary without search controls.

## Rollback

- Code rollback is sufficient for this slice because no schema migration or data backfill was introduced.
- Revert commits:
  - `7df0fa0 Verify record search filters`
  - `05a7fe1 Implement record search filters`
- If local seed/database state was refreshed only for smoke testing, no data rollback is required beyond reseeding local data.

## Accepted Local Dev Risks

- Query state is local only; refresh/back/forward do not preserve search filters.
- Search runs client-side over loaded active records; production-scale pagination/indexing is not addressed.
- Browser E2E covers `未退款`; `已退款` is covered by unit tests because the current E2E seed does not include an already-reimbursed member-paid expense.
- Mobile-specific screenshots were not captured in release readiness; responsive behavior uses existing Dialog/Input/NativeSelect components and focused browser flows pass.
- Quality scripts that run `prisma generate` should be run sequentially; parallel runs can race on generated Prisma output directories.

## Not Production Ready

Production release remains blocked until these are selected and verified:

- Hosting target and database target.
- Production data-volume strategy for active-record search.
- Production smoke across authenticated roles.
- Monitoring/log access and error reporting.
- Analytics or feedback plan if search/filter discoverability will be evaluated post-launch.
- URL persistence decision if shareable searches become required.

## Handoff

- decision: ready_for_user_local_dev_review
- recommended_next_gate: learning-loop
- reviewer_focus:
  - confirm `/search` local_dev readiness is enough for this slice
  - confirm no production readiness is implied
  - confirm whether Learning Loop should be minimal or skipped for this local_dev-only feature
- stop_condition: Wait for explicit user approval before starting Learning Loop.
