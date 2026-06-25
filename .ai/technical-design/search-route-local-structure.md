---
id: technical-design-search-route-local-structure
stage: feature-technical-design
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/search-route-local-structure.md
  - .ai/archive/archive-app-seam-refactor-2026-06-26.md
  - .ai/archive/archive-search-reimbursement-payment-records-2026-06-26.md
  - .ai/foundation-architecture/home-family-fund.md
outputs:
  - route_local_structure_design
  - shared_record_detail_seam_design
  - import_direction_policy
  - test_mapping
trace_links:
  production_routes:
    - /search
    - /
  target_files:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-panel.tsx
    - src/app/record-search-controls.tsx
    - src/app/record-search-results.tsx
    - src/app/record-search-actions.ts
    - src/app/record-list-detail.tsx
    - src/app/record-list-item.tsx
    - src/app/record-detail-ui.tsx
    - src/app/reimbursement-payment-dialogs.tsx
reviewed_at: 2026-06-26
---

# Search Route Local Structure Technical Design

## Decision Summary

- decision: ready_for_tdd_implementation_after_review
- prototype_policy: accepted risk; no Experience Prototype is needed because this slice has no intended UI, copy, layout, or route behavior change.
- behavior_spec_policy: accepted risk; no Behavior Spec / BDD / E2E is needed because behavior must remain unchanged and existing tests cover the search/readback behavior.
- route_local_policy: move search-owned modules under `src/app/(app)/search/_components`, `_actions`, and `_lib`.
- shared_record_detail_policy: move record detail/list modules used by both home dashboard and `/search` under `src/app/_record-detail`.
- app_shared_policy: keep truly app-wide helpers such as `action-state`, `route-search-params`, `category-visuals`, and `use-action-state-effect` out of this slice.
- domain_policy: keep query builders, record/reimbursement rules, and authorization in `src/modules` and `src/auth`; route-local code must not become a domain module.
- next_gate: TDD Implementation

## Route And Module Boundaries

### `/search` Route-Local Modules

Use private route folders under `src/app/(app)/search`:

```text
src/app/(app)/search/
  page.tsx
  loading.tsx
  _actions/
  _components/
  _lib/
```

This follows App Router private-folder convention: folders prefixed with `_` are not route segments.

Move search-owned files:

| Current file | Target | Reason |
|---|---|---|
| `src/app/record-search-panel.tsx` | `src/app/(app)/search/_components/record-search-panel.tsx` | Search page orchestration only. |
| `src/app/record-search-controls.tsx` | `src/app/(app)/search/_components/record-search-controls.tsx` | Search page filter controls only. |
| `src/app/record-search-results.tsx` | `src/app/(app)/search/_components/record-search-results.tsx` | Search page result surface only. |
| `src/app/batch-delete-dialog.tsx` | `src/app/(app)/search/_components/batch-delete-dialog.tsx` | Search selection batch delete dialog only. |
| `src/app/batch-refund-dialog.tsx` | `src/app/(app)/search/_components/batch-refund-dialog.tsx` | Search selection batch refund dialog only. |
| `src/app/batch-search-footer.tsx` | `src/app/(app)/search/_components/batch-search-footer.tsx` | Search result summary/selection footer only. |
| `src/app/record-search-batch-utils.ts` | `src/app/(app)/search/_lib/record-search-batch-utils.ts` | Pure helper used by search batch UI only. |
| `src/app/record-search-actions.test.ts` | `src/app/(app)/search/_actions/record-search-actions.test.ts` | Tests should sit beside moved search actions. |

Split `src/app/record-search-actions.ts` into two files:

- `src/app/(app)/search/_actions/record-search-actions.ts`
  - `loadRecordSearchPageAction`
  - `loadReimbursementPaymentSearchPageAction`
  - `batchDeleteSearchRecordsAction`
  - `batchRefundSearchRecordsAction`
  - search page request/result types for those actions
- `src/app/_record-detail/reimbursement-payment-readback-actions.ts`
  - `loadReimbursementPaymentByLedgerRecordAction`
  - `loadReimbursementPaymentsByLedgerRecordIdsAction`
  - readback result types

Rationale: the first group is `/search` route-local behavior. The readback group is used by record detail UI that appears on both `/` and `/search`, so it should not live under `/search`.

### Shared Record Detail Modules

Create a private app-level folder:

```text
src/app/_record-detail/
```

This is not a generic shared folder. It is a real two-route seam used by:

- `src/app/(app)/(home)/page.tsx`
- `src/app/(app)/search/_components/record-search-panel.tsx`

Move shared record detail files:

| Current file | Target | Reason |
|---|---|---|
| `src/app/record-list-detail.tsx` | `src/app/_record-detail/record-list-detail.tsx` | Used by home dashboard and search detail. |
| `src/app/record-list-item.tsx` | `src/app/_record-detail/record-list-item.tsx` | Used by record detail/list, refund dialogs, and search results. |
| `src/app/record-detail-ui.tsx` | `src/app/_record-detail/record-detail-ui.tsx` | Used by shared record detail dialog. |
| `src/app/record-display-utils.ts` | `src/app/_record-detail/record-display-utils.ts` | Shared display helpers for record detail/list. |
| `src/app/reimbursement-payment-dialogs.tsx` | `src/app/_record-detail/reimbursement-payment-dialogs.tsx` | Used by search refund records and shared record detail readback. |
| `src/app/reimbursement-payment-fields.tsx` | `src/app/_record-detail/reimbursement-payment-fields.tsx` | Used by batch refund and record reimbursement detail form fields. |
| `src/app/reimbursement-payment-loader.ts` | `src/app/_record-detail/reimbursement-payment-loader.ts` | Used by shared record detail readback. |
| `src/app/reimbursement-payment-ui.ts` | `src/app/_record-detail/reimbursement-payment-ui.ts` | Small shared display/type seam for reimbursement payment UI. |

Do not move `category-visuals.tsx` in this slice. It is used by record detail, create record, home dashboard, and category settings. It needs a separate app-shared/design-system decision.

Do not move `action-state.ts` or `use-action-state-effect.ts` in this slice. They are app-wide action helpers used by create record, categories, members, ledger actions, and search details.

### Imports After Move

`src/app/(app)/search/page.tsx` should import:

```ts
import { RecordSearchPanel } from "./_components/record-search-panel";
```

`src/app/(app)/(home)/page.tsx` should import:

```ts
import { RecordListDetail } from "@/app/_record-detail/record-list-detail";
```

Search route-local components should prefer relative imports within the search folder for route-local modules:

```ts
import { RecordSearchControls } from "./record-search-controls";
import { loadRecordSearchPageAction } from "../_actions/record-search-actions";
```

Shared record detail modules should import each other through relative imports and import app-wide helpers through `@/app/*` only when the helper remains intentionally app-wide.

## Frontend And Backend Contracts

No user-facing contract changes.

- URL remains `/search`.
- Search tabs, filters, selected record behavior, batch dialogs, refund detail dialogs, related-record dialogs, and record detail behavior remain unchanged.
- Home dashboard record detail/list behavior remains unchanged.
- Server action signatures remain unchanged from the caller perspective after import path updates.

## State, Data, And Validation Ownership

- Search tab/query/selection state remains in `RecordSearchPanel`.
- Search page server actions remain server-only and route-local under `/search/_actions`.
- Reimbursement payment readback for record detail moves to the shared record detail seam.
- Reporting query state and query builders remain in `src/modules/reporting`.
- Fund Ledger and Reimbursement command validation remain in `src/modules`.
- Authorization remains in `src/auth/app-access` and `src/modules/identity-access`.

## Error, Loading, And Empty Strategy

No runtime strategy changes.

- Search load errors and toast behavior remain as-is.
- Reimbursement payment readback toasts remain as-is.
- Loading states and empty prompts remain as-is.

## Auth And Permission Boundary

No authorization change.

Server actions continue calling `requireAuthenticatedMember` or `requireServerActionAccess` exactly as they do today. Moving files must not weaken route/action access checks.

## Test Mapping

Move/update tests:

- Move `src/app/record-search-actions.test.ts` to `src/app/(app)/search/_actions/record-search-actions.test.ts`.
- Keep existing assertions; update imports to the split search/readback action paths as needed.
- Run focused tests:

```bash
corepack pnpm test src/app/(app)/search/_actions/record-search-actions.test.ts src/app/home-access.test.ts src/modules/reporting/record-search-query.test.ts src/modules/reporting/reimbursement-payment-search-query.test.ts
```

Because shell parentheses need quoting, implementation commands should quote the search path:

```bash
corepack pnpm test 'src/app/(app)/search/_actions/record-search-actions.test.ts'
```

Full checks:

```bash
corepack pnpm lint
corepack pnpm type-check
corepack pnpm test
```

Run Prisma-generating commands sequentially to avoid generated-client write collisions.

## Import Direction Verification

After implementation, run:

```bash
find src/app -maxdepth 1 -type f | sort
```

Expected search-owned files should no longer appear at `src/app` top level:

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

Expected files still allowed at `src/app` top level:

- route root files: `layout.tsx`, `loading.tsx`, `globals.css`
- app-wide helpers: `action-state.ts`, `route-search-params.ts`, `use-action-state-effect.ts`
- broader shared visual/helper files such as `category-visuals.tsx`
- non-search workflow files such as create-record, dashboard, member, category, CSV import, and ledger action files

Also verify route-local imports:

```bash
rg -n "@/app/record-search|@/app/batch-|@/app/reimbursement-payment|@/app/record-list|@/app/record-detail|@/app/record-display" src/app --glob '!src/generated/**'
```

Expected result: no matches after imports are updated to route-local or `_record-detail` seams.

## Release Target Implications

- release_target: `local_dev`
- no database migration.
- no seed data change.
- no deployment config change.
- no production OAuth or secret change.
- Target-Aware Release is not required beyond verification evidence.

## Open Risks

- File moves can create noisy diffs. Implementation should use `git mv`/move operations and avoid UI or logic cleanup.
- Splitting `record-search-actions.ts` requires care so readback functions used by home dashboard record detail do not accidentally become search-private.
- `category-visuals.tsx`, `action-state.ts`, and `use-action-state-effect.ts` remain top-level app-wide helpers. They are legitimate future cleanup candidates, but moving them here would broaden scope.
- If import updates reveal an unanticipated third consumer for a planned search-private file, stop and update this technical design rather than forcing the move.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `/search` private folders use `_components`, `_actions`, and `_lib`.
  - Confirm shared record detail modules should move to `src/app/_record-detail` instead of `/search`.
  - Confirm app-wide helpers and `category-visuals.tsx` remain out of scope.
- must_check:
  - Implementation must not change UI behavior or Traditional Chinese copy.
  - Implementation must preserve home dashboard record detail behavior.
  - Search server action splitting must preserve all existing auth checks and result types.
- acceptance_signals:
  - Search route-local files are no longer at `src/app` top level.
  - Shared record detail has a real two-route seam.
  - Tests and import verification can prove behavior-preserving structure changes.
- unresolved_blockers:
  - None if reviewer accepts the route-local and `_record-detail` seams.
- next_step:
  - TDD Implementation for `search-route-local-structure`.
