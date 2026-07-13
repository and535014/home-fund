# Category Archive Visibility Toggle

- status: done
- date: 2026-06-26
- source: .ai/archive/archive-category-archive-visibility-toggle-2026-06-26.md

## 需求

Let admins show archived categories on `/settings/categories`, keep them hidden by default, place archived rows below active rows, and restore archived categories without database/manual intervention.

## 執行方式

No foundation change. The slice reused Next.js App Router, existing admin settings route, server actions, Prisma command adapter, Vitest, Playwright, Tailwind, shadcn-style `Item`, project `Switch`, and Lucide icons.

`unarchiveCategory` lives in `src/modules/categorization/category-catalog.ts`; `unarchiveCategoryInDatabase` persists status/sort order in the command adapter; `unarchiveCategoryAction` owns server action access, error mapping, revalidation, and success payload. The category page keeps archive visibility as local UI state. Local/E2E seeds now include archived income and expense categories. `ItemMedia variant="icon"` uses project design tokens for archived status alignment.

## 最終結果

`/settings/categories` has one page-level `顯示封存分類` switch. Archived categories are hidden by default; when shown, they appear under active categories in `支出分類` and `收入分類`, retain visual identity, show an `已封存` icon in item media, and expose only icon-only `取消封存 <分類名稱>`. Successful unarchive shows `分類已取消封存`, moves the category back to active status, appends it to the active order for its type, and makes it available in new-record choices.

Target is `local_dev`; release readiness is `ready_for_local_dev_review`. Evidence includes full Vitest, type-check, lint, schema validation, build, focused category-management E2E, and a temporary desktop/mobile visual probe. Production readiness is explicitly not assessed.

## 特殊決策

Category unarchive is an admin-only Categorization lifecycle command. It rejects non-admin actors, missing categories, already-active categories, and duplicate active names in the same household/type. Archived categories remain readable for history and stay unavailable for new records until restored.

Local review should focus on switch discoverability, archived icon clarity, direct restore without confirmation, append-to-bottom ordering, duplicate-name copy, and whether archived categories stay out of routine category management until requested.

## Bug / 阻礙

Full Playwright suite was not rerun; focused category E2E plus full unit/type/lint/build/schema checks passed. Temporary visual probe was not kept as a permanent test. Production OAuth, hosted database, monitoring, rollback, and analytics are out of scope.
