# Admin-Only Category Management

- status: done
- date: 2026-06-19
- source: .ai/archive/archive-admin-only-category-management-2026-06-19.md

## 需求

Only administrators can browse `/categories` and create, rename, or archive categories. Finance managers and general members must not see the sidebar category entry and must be denied on direct category route visits.

## 執行方式

Existing Next.js App Router, dashboard shell, Prisma/PostgreSQL, Better Auth current-member resolution, shadcn-style UI components, Vitest, and Playwright foundations were reused. No framework, routing foundation, or Prisma migration was required.

Category mutations use server actions in `src/app/category-actions.ts`. `CategoryCatalog` remains the pure policy boundary, while `src/modules/categorization/category-command.ts` owns Prisma persistence and ledger reference counts. `/categories` checks admin status before loading category reference counts or passing mutation actions. `TabsList variant="line"`, shared `Item` rows, `Dialog`, and `sonner` toast are the UI conventions. `HomeDashboardLayout` rename is deferred.

## 最終結果

Admins see `分類`, can open the category page, can create categories through a URL-neutral modal, can rename active categories, and can archive categories only after confirmation. Active and archived categories are shown with line tabs and income/expense grouping. Archived categories remain readable in history and are excluded from new record category choices. Non-admins see no sidebar `分類` entry and direct route visits render a denied dashboard state without management controls.

`local_dev` is ready for review. Evidence includes passing `pnpm type-check`, `pnpm lint`, `pnpm test` with 118 tests, targeted category E2E with 6 tests, full DB-backed E2E with 25 tests, and `pnpm build` when network access is available for Google Fonts. Production readiness is not assessed.

## 特殊決策

Category management is admin-only across navigation, route browsing, and mutation commands. `manage_categories` capability remains in the schema but is dormant for this workflow. Duplicate category names are rejected among active categories of the same type. Archived categories are unavailable for new records but remain readable for historical ledger records and reports.

For local_dev, learning is manual and test-based: review admin category maintenance, non-admin sidebar/direct-route denial, archive/new-record selector behavior, and quality gates. No analytics or monitoring provider is configured; production learning should be revisited only when a preview/staging/production target is selected.

## Bug / 阻礙

Full E2E depends on local Docker/PostgreSQL and controlled non-production auth headers. `pnpm build` can fail in no-network sandboxes before code compilation because Next fetches Google Fonts. Production OAuth, hosting, secrets, rollback, observability, analytics, monitoring, and real-OAuth category smoke checks remain unresolved.
