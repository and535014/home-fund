---
id: mobile-sitewide-layout-redesign
stage: experience-prototype
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/mobile-sitewide-layout-redesign.md
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/prototype/web-foundation.md
outputs:
  - production_stack_mobile_layout_prototype
trace_links:
  intent: .ai/intent/mobile-sitewide-layout-redesign.md
  prototype_components:
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-mobile-nav.tsx
    - src/components/layout/authenticated-sidebar-nav.tsx
    - src/components/layout/page-layout.tsx
    - src/app/(app)/page.tsx
    - src/app/(app)/settings/layout.tsx
    - src/app/(app)/settings/settings-sidebar-nav.tsx
reviewed_at: 2026-06-23
---

# Mobile Sitewide Layout Redesign Prototype

## Decision Summary

- decision: ready_for_review
- implemented_gate: Experience Prototype
- next_gate_after_approval: Behavior Spec / BDD / E2E
- reason: The draft intent requested a sitewide authenticated mobile layout reset with bottom tab navigation and a FAB. This prototype implements that direction in the real app shell and page layouts so the experience can be reviewed before specs and technical design are locked.

## Prototype Surface

- route scope: authenticated app routes under `src/app/(app)`.
- review routes:
  - `/`
  - `/search`
  - `/settings/account`
  - `/settings/members`
  - `/settings/categories`
- run command: `corepack pnpm dev`
- review URL: `http://localhost:3000`
- frontend stack: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style local components, lucide-react icons.
- fixture strategy: Uses the current local app data/auth context. No new API, database, or domain behavior was added for this prototype.

## Interaction Model

- Mobile primary navigation is a fixed bottom tab bar driven by the existing role-aware `getVisibleDashboardNavigationItems()` result.
- Mobile tab active state reuses the same route matching rule as desktop sidebar navigation.
- Mobile `新增紀錄` is a fixed FAB above the tab bar and calls the existing `openExpense()` create-record flow.
- Mobile create-record category selection stays in one horizontal row inside the dialog and can scroll sideways, so category scanning stays compact after moving entry to the FAB.
- Mobile create/edit category selector includes enough scroll-container padding so the selected ring is not clipped.
- Mobile modal bodies do not expose page-level horizontal scrolling; only intentional inner controls such as the category selector may scroll horizontally.
- Mobile scrollbars are visually hidden across the app while preserving touch scrolling.
- Mobile root horizontal overflow is disabled; intentional inner horizontal controls such as category selection remain scrollable.
- Mobile create-record payer and date fields stay side by side in the dialog.
- Mobile edit-record form follows the create-record form pattern: category visual selector, compact field stack, and payer/date side by side.
- Mobile record detail shows `支付者` and `日期` side by side.
- Mobile record detail shows `分類` and `狀態` side by side.
- Mobile dialog footers use full-width action distribution, including a single full-width button or multiple equal-width side-by-side buttons; desktop dialog footers keep natural-width actions aligned to the end.
- Month picker and member-management dialogs use the shared dialog footer rules instead of custom right-aligned button rows.
- Desktop keeps the existing icon sidebar and sidebar create button.
- Settings uses desktop sidebar navigation on `md` and wider viewports, and a mobile account strip plus horizontal settings tabs on smaller viewports.

## Page-Level Mobile Layout Direction

- `總覽`: switches from full-height desktop dashboard grid to a natural vertical mobile flow; summary metrics, trend, reimbursement/category panels, and recent records stack without relying on desktop sidebar space.
- `總覽`: mobile hides the visible page title so the month control and financial summary become the first visible content; desktop keeps the page title.
- `總覽`: mobile keeps `餘額`, `支出`, and `收入` summary metrics in one horizontal row with compact card spacing and smaller amount text.
- `總覽`: mobile increases vertical spacing between major sections; desktop dashboard spacing stays compact.
- `總覽`: mobile hides the `收支趨勢` chart; desktop keeps the chart.
- `搜尋`: keeps the existing search/filter/list interaction, now inside the sitewide bottom-safe content area.
- `搜尋`: mobile hides the bottom tab bar and uses a back icon button to the left of the search field; it navigates to browser history when available and falls back to the home page.
- `搜尋`: mobile batch action footer keeps summary values split left/right and separates selection actions on the left from batch actions on the right.
- `搜尋`: mobile batch footer actions use icon-only buttons with accessible labels; desktop keeps text buttons.
- `搜尋`: mobile filter dialog keeps `類型` and `分類` side by side.
- `搜尋`: mobile filter dialog keeps `收支對象` with `退款狀態`, and `開始日期` with `結束日期`, side by side.
- `搜尋`: desktop filter dialog keeps `排序` to one column instead of spanning the full dialog width.
- `設定`: nested settings pages no longer depend on the desktop settings sidebar on mobile.
- `設定`: mobile section switching uses full-width segmented tabs for `帳號資訊`, `成員`, and `分類`.
- `設定`: mobile inner pages hide page headers; member/category create actions move to page-level FABs while desktop keeps header actions.
- `設定`: mobile hides the global create-record FAB; settings-specific FABs remain page-owned.
- `設定`: mobile category ordering uses up/down icon buttons with first/last boundary buttons disabled; desktop keeps drag-and-drop handles.
- `帳號資訊`: remains a compact mobile list surface under the mobile settings nav.
- `成員`: keeps the existing create action and one-column mobile member list.
- `分類`: keeps existing category actions and stacked category regions while inheriting the mobile settings nav and bottom-safe spacing.

## Accessibility And Focus Baseline

- Bottom tab bar has `aria-label="主要導覽"`.
- Active mobile tab sets `aria-current="page"`.
- FAB has `aria-label="新增紀錄"` and uses the existing create-record dialog focus behavior.
- Mobile settings nav has `aria-label="設定導覽"` and active item uses `aria-current="page"`.
- Touch targets are at least 40px high for settings tabs and 56px for app tabs/FAB.

## Responsive Baseline

- Mobile breakpoint: below `md`, authenticated navigation switches to bottom tab bar plus FAB.
- Desktop breakpoint: `md` and wider keeps existing sidebar navigation.
- Content bottom padding reserves space for safe area, tab bar, and FAB on mobile.
- Page headers use smaller mobile heading scale and return to existing desktop scale on larger screens.

## Verification During Prototype

- `corepack pnpm type-check`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm test src/components/layout/shared-layout.test.tsx`: pass, 2 tests.
- Local dev server: already running at `http://localhost:3000`.
- Authenticated route smoke: `curl -I -H 'x-e2e-current-member-email: e2e-finance@example.com' http://localhost:3000/` returned 200.
- Mobile browser DOM smoke at 390 x 844 with `x-e2e-current-member-email`:
  - `/`: app bottom nav visible, FAB visible.
  - `/search`: app bottom nav visible, FAB visible.
  - `/settings/account`: app bottom nav visible, FAB visible, settings mobile nav visible.
- Edit-record browser smoke was limited by local seed/auth state: the finance stub can open record detail but does not expose edit on the sampled records, and the local `user-e2e-linked` account currently redirects to unlinked-account state.

## Known Gaps

- No mobile Playwright screenshot or E2E scenario has been added yet; that belongs in Behavior Spec and TDD Implementation after review approval.
- Protected admin settings routes were not fully browser-smoked in this pass because the local authenticated stub used for `/settings/account` is not authorized for every admin route, and the seeded E2E admin user is not linked in the currently running local database.
- Mobile category reorder buttons were type/lint verified, but browser smoke is still limited by the local auth fixture redirecting category settings to `/`.
- FAB default action remains expense-first. A create-type chooser is still an open product decision.
- The mobile tab set remains the current role-aware top-level routes: `總覽`, `搜尋`, `設定`. No fourth tab was introduced.
- Search batch footer density should be explicitly reviewed on narrow mobile before specs are finalized.
- Dialog-specific mobile polish remains inherited from current components and should be verified in the next behavior/spec pass.

## Review Gate

- decision: ready_for_review
- reviewer_focus:
  - Confirm bottom tab bar plus FAB is the accepted mobile app shell direction.
  - Confirm the current tab set should stay `總覽`, `搜尋`, `設定`.
  - Confirm FAB should remain expense-first for this slice.
  - Check whether settings mobile tabs are acceptable, or whether settings should become a stacked/detail navigation flow.
  - Check whether the `總覽` mobile stacking order matches expected daily use.
- recommended_next_gate:
  - Behavior Spec / BDD / E2E after approval.
