---
id: implementation-search-route-local-structure
stage: tdd-implementation
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/search-route-local-structure.md
  - .ai/technical-design/search-route-local-structure.md
outputs:
  - src/app/(app)/search/_actions/record-search-actions.ts
  - src/app/(app)/search/_actions/record-search-actions.test.ts
  - src/app/(app)/search/_components/record-search-panel.tsx
  - src/app/(app)/search/_components/record-search-controls.tsx
  - src/app/(app)/search/_components/record-search-results.tsx
  - src/app/(app)/search/_components/batch-delete-dialog.tsx
  - src/app/(app)/search/_components/batch-refund-dialog.tsx
  - src/app/(app)/search/_components/batch-search-footer.tsx
  - src/app/(app)/search/_lib/record-search-batch-utils.ts
  - src/app/_record-detail/record-list-detail.tsx
  - src/app/_record-detail/record-list-item.tsx
  - src/app/_record-detail/record-detail-ui.tsx
  - src/app/_record-detail/record-display-utils.ts
  - src/app/_record-detail/reimbursement-payment-dialogs.tsx
  - src/app/_record-detail/reimbursement-payment-fields.tsx
  - src/app/_record-detail/reimbursement-payment-loader.ts
  - src/app/_record-detail/reimbursement-payment-readback-actions.ts
  - src/app/_record-detail/reimbursement-payment-ui.ts
trace_links:
  technical_design:
    - .ai/technical-design/search-route-local-structure.md
  routes:
    - src/app/(app)/search/page.tsx
    - src/app/(app)/(home)/page.tsx
reviewed_at: 2026-06-26
---

# Search Route Local Structure TDD Implementation

## Scope Implemented

- Moved `/search` route-owned modules under `src/app/(app)/search`:
  - `_components`: search panel, controls, results, batch delete/refund dialogs, search footer.
  - `_actions`: search page server actions and their focused tests.
  - `_lib`: search batch helper.
- Moved shared record detail/readback modules under `src/app/_record-detail`.
- Split reimbursement payment readback actions out of search page actions into `src/app/_record-detail/reimbursement-payment-readback-actions.ts`.
- Updated `/search/page.tsx` to import `RecordSearchPanel` from its route-local `_components` folder.
- Updated the home dashboard to import `RecordListDetail` from the shared `_record-detail` seam.
- Updated imports so search route-local modules use relative route-local imports and shared record detail modules use the `_record-detail` seam.
- Left `category-visuals.tsx`, `action-state.ts`, `route-search-params.ts`, `use-action-state-effect.ts`, create-record, dashboard, settings, member, category, CSV import, and ledger action files out of scope.

## TDD Evidence

Red step:

- `corepack pnpm test 'src/app/(app)/search/_actions/record-search-actions.test.ts'`
  - failed because `./record-search-actions` did not exist after moving the test first.

Green focused checks:

- `corepack pnpm test 'src/app/(app)/search/_actions/record-search-actions.test.ts'`
  - 1 file passed, 4 tests passed.
- `corepack pnpm test 'src/app/(app)/search/_actions/record-search-actions.test.ts' src/app/home-access.test.ts src/modules/reporting/record-search-query.test.ts src/modules/reporting/reimbursement-payment-search-query.test.ts`
  - 4 files passed, 19 tests passed.

Green full checks:

- `corepack pnpm lint`
- `corepack pnpm type-check`
- `corepack pnpm test`
  - 45 files passed, 214 tests passed.

## Import And Structure Evidence

Top-level `src/app` no longer contains:

- `record-search-*`
- `batch-delete-dialog.tsx`
- `batch-refund-dialog.tsx`
- `batch-search-footer.tsx`
- `record-search-batch-utils.ts`
- `reimbursement-payment-*`
- `record-list-detail.tsx`
- `record-list-item.tsx`
- `record-detail-ui.tsx`
- `record-display-utils.ts`

Command:

```bash
rg -n "@/app/record-search|@/app/batch-|@/app/reimbursement-payment|@/app/record-list|@/app/record-detail|@/app/record-display" src/app --glob '!src/generated/**'
```

Result:

- no matches.

## Notes

- No user-facing behavior, route, UI layout, or Traditional Chinese copy changed.
- No domain module, Prisma schema, migration, seed, auth provider, or deployment config changed.
- Search page server actions still call the same auth boundaries.
- Reimbursement payment readback actions moved to a shared record-detail seam so home dashboard record detail does not depend on `/search` private modules.
- Prisma-generating commands were run sequentially to avoid generated-client write collisions.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `/search` route-local files moved to `_components`, `_actions`, and `_lib`.
  - Confirm shared record detail/readback files moved to `_record-detail`.
  - Confirm top-level `src/app` now contains only non-search or app-wide files for this slice.
- must_check:
  - Verification should rerun lint, type-check, full unit tests, and the import/structure checks.
  - No broader `src/app` cleanup should be inferred from this slice.
- next_step:
  - Verification for `search-route-local-structure`.
