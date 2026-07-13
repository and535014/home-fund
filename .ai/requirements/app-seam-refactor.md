# App Seam Refactor

- status: done
- date: 2026-06-26
- source: .ai/archive/archive-app-seam-refactor-2026-06-26.md

## 需求

Remove inward dependencies on `src/app` so the Next.js App Router layer stays a route adapter instead of becoming a shared core module.

## 執行方式

Existing Next.js App Router, TypeScript path alias, module-per-bounded-context structure, Vitest, Prisma generation flow, and DDD workflow foundation were reused. No foundation change was required.

`RecordQueryState` and pure in-memory record query helpers now live at `src/modules/reporting/record-query.ts`; Reporting search query construction imports that seam. `HomeBlockedView` and access-failure view shaping now live at `src/modules/identity-access/home-blocked-view.ts`; `src/auth/app-access.ts` depends on Identity and Access instead of `src/app`. `src/app/home-access.ts` remains the Web App Shell adapter for dashboard/access composition. Generic shared folders were intentionally avoided.

## 最終結果

No user-facing behavior changed. The refactor only changed module ownership and import direction. Traditional Chinese blocked-access copy was preserved exactly.

Target is `local_dev`; verification passed import-direction check, lint, type-check, and full unit tests. No Target-Aware Release gate was required because there were no schema, config, migration, deployment, auth-provider, or operational changes.

## 特殊決策

No domain policy, lifecycle, role, permission, reimbursement, ledger, reporting total, or financial rule changed.

Future architecture cleanup should first address remaining Web App Shell imports only if they create real inward dependency pressure. Avoid broad `src/app` folder moves without a focused seam or workflow slice.

## Bug / 阻礙

Experience Prototype and Behavior Spec / BDD / E2E were skipped as accepted risk because the slice had no intended UI behavior change. Wider `src/components/layout/* -> @/app/record-create-context` imports remain as a future Web App Shell cleanup candidate.
