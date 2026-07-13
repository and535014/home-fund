# Category Visual Identity And Ordering

- status: draft
- date: 2026-06-21
- source: .ai/archive/archive-category-visual-identity-2026-06-21.md

## 需求

Let admins assign category colors/icons, reorder active income and expense categories, and show that identity/order in category management, record creation, record rows, record details, and dashboard category summaries.

## 執行方式

- Existing Next.js App Router, React, Prisma/PostgreSQL, Tailwind, shadcn-style UI components, Lucide icons, Vitest, and Playwright foundations were reused.
  - No new framework, component library, auth provider, analytics provider, or monitoring provider was added.

- Prisma `Category` gained `color String @default("gold")`, `icon String @default("tags")`, `sortOrder Int @default(0)`, and an index on `(householdId,type,status,sortOrder)`.
  - `src/modules/categorization/category-visual-options.ts` holds serializable registry keys, labels, validators, and default derivation.
  - `src/app/category-visuals.tsx` is a React rendering adapter that maps controlled keys to CSS colors and Lucide components.
  - Prisma raw strings are mapped through validators before entering the domain `Category` type.
  - Reorder server action accepts the full active ID list for a single type and validates duplicates, missing IDs, archived IDs, and cross-type IDs.
  - `MonthlyCategorySummary` carries visual fields and sorts by type/order/name.
  - Category management uses optimistic local ordering with server persistence and rollback/refresh on reorder errors.
  - `DialogBody` and `DialogFooter` were added so long dialog bodies scroll without moving header/footer.

## 最終結果

- `Category` persists `color`, `icon`, and `sortOrder`.
  - Category color/icon use controlled keys from a curated palette and Lucide-backed icon registry.
  - Existing categories receive migration defaults and deterministic order.
  - New categories append to the end of the active order for their selected type.
  - Admins can create/update/archive/reorder categories through server actions.
  - Category management shows two active panels, `支出分類` and `收入分類`; archived categories are not shown there.
  - Sorting is scoped to one category type and starts only from the sort handle. Keyboard sorting uses ArrowUp/ArrowDown on the focused handle.
  - New-record category choices use active persisted order and visual marks.
  - Record list category media shows only the visual mark with accessible category naming; record detail still shows text category name.
  - Dashboard category summary rows use visual labels and category color bars.
  - Dialog content scrolls independently so headers/footers remain fixed.
  - Record notes use a single-line Input.

- `local_dev` readiness passed.
  - Evidence includes `corepack pnpm lint`, `corepack pnpm type-check`, `corepack pnpm test`, `corepack pnpm db:validate`, `corepack pnpm build`, full `corepack pnpm test:e2e` with 36 tests, and focused create-record E2E with 7 tests after dialog/note adjustments.
  - E2E setup applied migration `20260620093000_add_category_visual_identity` and seeded local/E2E data successfully.
  - Production readiness is not claimed.

## 特殊決策

- `CategoryCatalog` owns visual identity and active sort order.
  - Only admins can create, update, archive, change visual identity, or reorder categories.
  - Invalid color, icon, duplicate active names, archived updates, and invalid reorder payloads are rejected server-side.
  - Archived categories retain saved visual identity for historical records and reports but are excluded from active ordering/new-record choices.
  - Visual identity remains category-owned and is not copied onto ledger records.

- Local_dev learning uses manual review and smoke checks rather than analytics tooling.
  - Watch whether admins understand color/icon controls without extra copy, whether two active panels are clearer than tabs, whether drag-handle sorting is discoverable, whether configured order improves record creation, whether icon-only record media is clear, whether fixed-header/footer dialogs feel better, and whether single-line notes are sufficient.
  - Route future issues through new Intent Intake.

## Bug / 阻礙

- Browser E2E covers category create/archive, record creation, dashboard, and permission flows, but does not directly simulate pointer drag reorder.
  - Category dialogs intentionally omit visible explanatory descriptions; future accessibility review may decide to add hidden descriptions or explicit `aria-describedby={undefined}`.
  - Quality scripts that run `prisma generate` should be run sequentially to avoid generated-client directory races.
  - E2E depends on Docker Desktop and local PostgreSQL availability.
