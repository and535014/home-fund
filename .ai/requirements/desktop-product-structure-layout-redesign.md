# Desktop Product Structure Layout Redesign

- status: done
- date: 2026-06-20
- source: .ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md

## 需求

Rework the desktop authenticated app structure around `總覽`, `搜尋`, permission-gated `退款`, and `設定`; nest account/member/category settings under `/settings/*`; remove visible recurring surface; keep mobile out of scope.

## 執行方式

Reuse existing Next.js App Router, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, and Playwright. Recharts is used for dashboard trend and expense category charts.

`/settings` redirects to `/settings/account`; `/settings/members` and `/settings/categories` keep server-side admin guards; `/reimbursements` keeps server-side reimbursement permission guard and renders placeholder content; chart components measure container size before rendering; create-record categories use an accessible custom radio grid.

## 最終結果

The app uses an icon-only primary sidebar with footer `新增紀錄`, full-height page layout with owned content scrolling, switchable-month overview dashboard, matching `搜尋`/`退款` placeholders, settings subnavigation, and a create-record dialog with `成員支出`, `收入`, and `基金支出`.

Ready for `local_dev` review only. Verification passed with lint, type-check, targeted Playwright 16/16, and full Playwright E2E 29/29.

## 特殊決策

Existing ledger creation, reimbursement permission, admin-only member/category management, and controlled-auth E2E boundaries remain intact. Reimbursement settlement and real search are deferred. Recurring app/module UI is removed, but recurring database schema/seed cleanup is not part of this slice.

No separate Learning Loop artifact was created. If this local_dev slice is reviewed with users, capture sidebar usability, dashboard density, chart readability, and create-record modal feedback in a future Learning Loop.

## Bug / 阻礙

No screenshot artifact was captured; recurring Prisma schema/seed remain; search is placeholder-only; reimbursement settlement is deferred; Next dev tools portal overlap means E2E uses keyboard activation for sidebar `新增紀錄`; Prisma generate commands should be run sequentially.
