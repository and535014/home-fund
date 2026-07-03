# Search Route Local Structure

- status: done
- date: 2026-06-26
- source: .ai/archive/archive-search-route-local-structure-2026-06-26.md

## 需求

Reduce `src/app` top-level clutter by moving `/search`-specific route implementation closer to the `/search` route without changing search behavior or UI.

## 執行方式

Existing Next.js App Router private-folder convention was reused. Search route-owned code now lives under `src/app/(app)/search/_components`, `_actions`, and `_lib`. Shared record detail/readback code used by both home and search lives under `src/app/_record-detail`. This is a route/app seam decision, not a new domain module.

Search page server actions moved to `src/app/(app)/search/_actions/record-search-actions.ts`; reimbursement payment readback actions were split into `src/app/_record-detail/reimbursement-payment-readback-actions.ts` so home dashboard record detail does not depend on `/search` private modules. Search UI moved to route-local `_components`; search batch helper moved to `_lib`. `category-visuals.tsx`, `action-state.ts`, `route-search-params.ts`, `use-action-state-effect.ts`, create-record, dashboard, settings, member, category, CSV import, and ledger action files remained out of scope.

## 最終結果

No user-facing behavior changed. `/search` still exposes `收支紀錄` and `退款紀錄`, search filters, batch delete/refund actions, refund detail dialogs, related-record readback, and record details exactly as before.

Target is `local_dev`; verification passed structure checks, stale import checks, lint, type-check, and full unit tests. No Target-Aware Release gate was required because there were no schema, config, migration, deployment, auth-provider, or operational changes.

## 特殊決策

No domain policy, lifecycle, role, permission, reimbursement, ledger, reporting total, or financial rule changed.

Future `src/app` cleanup should treat route-local private folders and real app-level shared seams separately. Do not move multi-route helpers into a route-private folder. Start new intents for `category-visuals`, `action-state`, create-record, dashboard, or settings cleanup.

## Bug / 阻礙

Experience Prototype and Behavior Spec / BDD / E2E were skipped as accepted risk because the slice had no intended UI behavior change. Browser E2E was not run in verification for the same reason. Remaining top-level app helpers still deserve future review.
