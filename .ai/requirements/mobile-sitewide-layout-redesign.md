# Mobile Sitewide Layout Redesign

- status: ready_for_review
- date: 2026-06-24
- source: .ai/archive/archive-mobile-sitewide-layout-redesign-2026-06-24.md

## 需求

Redesign authenticated mobile layout sitewide with bottom tab navigation and a mobile FAB while keeping desktop behavior stable.

## 執行方式

Reused Next.js App Router, React, Tailwind, shadcn-style components, lucide icons, Vitest, and existing Playwright foundation. No new package was introduced.

- `AuthenticatedMobileNav` owns mobile bottom nav ordering, route-based hiding, and global FAB visibility.
  - Mobile nav ordering is extracted to `src/components/layout/mobile-navigation-order.ts` with pure tests.
  - `PageLoading` is a small container; route loading files select page-specific skeleton content.
  - `useActionStateEffect` handles `useActionState` success/error results once per state object to prevent repeated toasts after parent re-renders.
  - Category up/down boundary state is extracted to `src/app/(app)/settings/categories/category-ordering.ts`.

## 最終結果

- Mobile bottom tab bar is role-aware, ordered `設定`, `首頁`, `搜尋`, and icon-only with accessible labels.
  - `/search` hides the bottom tab bar and global `新增紀錄` FAB, and uses a back icon button beside the search field.
  - Settings mobile pages use segmented tabs for `帳號資訊`, `成員`, `分類`; inner page headers are hidden and settings-owned FABs are page-owned.
  - Mobile overview hides the visible `總覽` title, keeps `餘額`/`支出`/`收入` in one row, increases section spacing, and hides the trend chart.
  - Shared dialog footer behavior distributes mobile action buttons full-width and equally; desktop remains natural-width/end-aligned.
  - Create/edit record dialogs share category selector and payer/date layout rules; record detail pairs classification/status and payer/date.
  - Mobile category ordering uses up/down icon buttons with first/last boundary buttons disabled; desktop keeps drag handles.
  - Page-specific loading states exist for home/search/settings; root and app-group fallbacks use neutral centered loading instead of page-specific skeletons.

`local_dev` ready for user review with accepted mobile E2E/manual browser gap; not preview or production ready.

## 特殊決策

No ledger, reimbursement, category, member, auth, permission, database, or server-action domain rules changed.

- Local review should answer whether the new tab order, icon-only bottom nav, search focus mode, settings segmented tabs, page-specific loading, and up/down category ordering feel correct.
  - Return to TDD if local review finds root horizontal overflow, clipped dialog controls, broken search back behavior, repeated toasts, or wrong loading skeletons.
  - Add mobile Playwright E2E before preview/production readiness.

## Bug / 阻礙

- Mobile-specific Playwright coverage was not added in this lifecycle.
  - Root horizontal overflow, hidden scrollbars, safe-area footer clipping, native select appearance, and dialog category selector clipping still need browser/device verification before stricter targets.
  - Admin settings mobile E2E depends on a reliable admin-linked fixture.
