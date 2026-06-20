---
id: record-list-detail-modal-local-dev-readiness
stage: target-aware-release
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
created_at: 2026-06-20
updated_at: 2026-06-20
inputs:
  - .ai/intent/record-list-detail-modal.md
  - .ai/prototype/record-list-detail-modal.md
  - .ai/spec/record-list-detail-modal.md
  - .ai/technical-design/record-list-detail-modal.md
  - .ai/implementation/record-list-detail-modal.md
  - .ai/verification/record-list-detail-modal.md
outputs:
  - local_dev_release_assessment
  - smoke_checks
  - accepted_risks
review_gate: ready_for_local_dev_review
---

# Record List Detail Modal Local Dev Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_assessed
- rationale: The verified dashboard record-list/detail modal and dashboard panel refinements are ready for local development review. The change is presentation and interaction only; it does not require migrations, new secrets, auth callback changes, route changes, or deployment configuration changes.

## Release Scope

Included in this local-dev readiness refresh:

- Dashboard records render as titled `紀錄` item-list buttons with read-only detail dialogs.
- Detail dialogs show selected record amount, date, category, status, payer, and note.
- Income status displays `---`; fund-paid payer displays `基金`.
- Create-record actor copy uses `支付者`.
- Dashboard overview uses unframed visual panels except for the three `SummaryMetric` cards.
- `待退款`, `支出分類`, and `紀錄` share the local `DashboardPanel` layout with `gap-3`, top-aligned content, full cell size, and a desktop divider before the records column.
- `支出分類` uses row-based category statistics instead of a pie chart.
- `收支趨勢` has no visible title/card and keeps top spacing while remaining accessible through a region label.

## Release Checks

| Check | Evidence | Status |
|---|---|---|
| Lint | `corepack pnpm lint` | pass |
| Type check | `corepack pnpm type-check` | pass |
| Production build | `corepack pnpm build` | pass |
| Dashboard browser E2E | `pnpm test:e2e e2e/dashboard.spec.ts`, 10 tests | pass |
| Create-record browser E2E | `pnpm test:e2e e2e/create-record.spec.ts`, 7 tests | pass |
| Database migration | No Prisma schema or migration changes in this slice | not required |
| Runtime config/secrets | No new environment variables or OAuth settings | not required |
| Route/config changes | No new route, redirect, middleware, or auth boundary | not required |

## Local Smoke Checks

For local manual review:

1. Start local dependencies and app using the existing project flow.
2. Open `/ ?month=2026-06` as an authenticated member.
3. Confirm the overview does not page-scroll in a desktop viewport.
4. Confirm `紀錄` appears in the right column with a left divider and item-list records.
5. Open `補充用品代墊` and confirm the detail dialog data and focus-close behavior.
6. Confirm `支出分類` renders rows with category name, proportional bar, amount, and muted percentage text.
7. Confirm `收支趨勢` has top spacing and no visible title/card.

## Operational Notes

- The local E2E workflow resets and seeds the dedicated E2E database before browser tests.
- Quality commands that run `prisma generate` should remain sequential to avoid generated-client race conditions.
- Existing controlled-auth E2E headers remain local/test-only behavior.

## Accepted Risks

- No production readiness is claimed.
- No visual screenshot baseline was added; responsive/panel behavior is covered by Playwright assertions instead.
- The dashboard still shows the recent five records; full monthly record browsing remains deferred.
- `src/app/dashboard-charts.tsx` still contains an unused expense pie chart export, which is a cleanup candidate but not a release blocker.

## Handoff

- decision: ready_for_user_local_dev_review
- recommended_next_skill: learning-loop
- next_step: Define or explicitly skip learning signals for this local-dev dashboard UX slice before artifact compression.
