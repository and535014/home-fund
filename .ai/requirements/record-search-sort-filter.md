# Record Search Sort Filter

- status: draft
- date: 2026-06-21
- source: .ai/archive/archive-record-search-sort-filter-2026-06-21.md

## 需求

Let authenticated household members find active income and expense records faster through `/search`, using keyword search, sorting, and filters for type, category, member/fund participation, reimbursement status, and occurrence-date range.

## 執行方式

- Existing Next.js App Router, React client components, TypeScript, Prisma/PostgreSQL, Tailwind, local shadcn-style UI components, Lucide icons, Vitest, and Playwright foundations were reused.
  - No new framework, component library, auth provider, analytics provider, monitoring provider, or schema migration was added.

- `src/app/(app)/search/page.tsx` loads authenticated user/session and active search data.
  - `src/app/record-search-panel.tsx` owns search-page query state, filter modal draft state, filtered results, and search empty-state selection.
  - `src/app/record-list-detail.tsx` owns only shared list rendering, detail selection, focus return, and detail actions; it no longer owns search controls or query state.
  - `src/app/record-query.ts` owns route-neutral query defaults, option builders, filter predicates, active filter counts, and sorting.
  - `getSearchPageData()` loads active `LedgerRecord` rows only.
  - Active filter count excludes keyword search because keyword has its own clear affordance.
  - Client-side query is accepted for local_dev MVP; production-scale server-side pagination/indexing is deferred.

## 最終結果

- `/search` has no page header.
  - Page surface contains only a keyword input and an icon-only filter button.
  - Initial result state is empty with `請輸入關鍵字或設定篩選條件。`.
  - Keyword search matches record name and formatted amount only.
  - Search input has an icon-only `清除搜尋` button when keyword text exists.
  - Filter/sort controls live in a `篩選與排序` modal and apply only when `套用` is activated.
  - Filters include type, active category, `收支對象`, reimbursement status, optional start/end dates, and one sort select.
  - Type constrains category options; `收入` hides `基金` from `收支對象`.
  - `已退款` and `未退款` apply only to member-paid reimbursable expenses.
  - Empty matched results show `沒有符合條件的紀錄。`.
  - Query state is local only; URL persistence is out of scope.
  - Opening a result uses the existing record detail dialog and existing action permission behavior.

- `local_dev` readiness passed.
  - Evidence includes `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm test` (30 files / 152 tests), `corepack pnpm build`, and `corepack pnpm test:e2e e2e/record-search.spec.ts` (5 tests).
  - No Prisma schema migration, new secret, config, or OAuth change was introduced.
  - Production readiness is not claimed.

## 特殊決策

- Record query is a Reporting/read-model behavior, not a LedgerRecord mutation.
  - Queries include active readable household records only; voided records are excluded.
  - Category filter options use active categories only.
  - Archived category names are not keyword-searchable or filterable.
  - Date filters use record occurrence date.
  - Search does not grant edit/delete/reimbursement permission; server actions and domain commands remain authoritative.

- Local_dev learning uses manual review and smoke checks rather than analytics tooling.
  - Watch whether the initial empty state is understood, whether name/amount-only keyword search is sufficient, whether the icon-only filter button is discoverable, whether apply-only modal behavior is predictable, whether `收支對象` wording is clear, whether date range without month switching works, and whether result detail continuity feels intact.
  - Route future issues through new Intent Intake.

## Bug / 阻礙

- Query state is local only and not shareable/bookmarkable.
  - Search runs client-side over loaded active records.
  - Browser E2E covers `未退款`; `已退款` is covered by unit tests because the E2E seed does not include an already-reimbursed member-paid expense.
  - Mobile-specific screenshots were not captured; responsive behavior uses existing Dialog/Input/NativeSelect components and targeted browser flows pass.
  - Quality scripts that run `prisma generate` should be run sequentially to avoid generated-client directory races.
