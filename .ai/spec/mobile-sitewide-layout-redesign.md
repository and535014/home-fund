---
id: mobile-sitewide-layout-redesign
stage: behavior-spec
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/mobile-sitewide-layout-redesign.md
  - .ai/prototype/mobile-sitewide-layout-redesign.md
  - .ai/prototype/web-foundation.md
  - .ai/domain/home-family-fund.md
  - commit:3404400
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_test_design
trace_links:
  routes:
    - src/app/(app)/page.tsx
    - src/app/(app)/search/page.tsx
    - src/app/(app)/settings/layout.tsx
    - src/app/(app)/settings/account/page.tsx
    - src/app/(app)/settings/members/page.tsx
    - src/app/(app)/settings/categories/page.tsx
  components:
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-mobile-nav.tsx
    - src/components/layout/authenticated-sidebar-nav.tsx
    - src/components/layout/page-layout.tsx
    - src/app/create-record-dialog.tsx
    - src/app/record-detail-dialog.tsx
    - src/app/record-edit-dialog.tsx
    - src/components/ui/dialog.tsx
reviewed_at: 2026-06-24
---

# Mobile Sitewide Layout Redesign Spec

## Prototype Decision

- decision: accepted_for_spec
- evidence: `3404400 Prototype mobile sitewide layout`
- reason: The prototype has been accepted to move forward. This spec locks the observable mobile layout behavior before feature technical design and TDD implementation.
- scope note: This slice changes authenticated mobile layout, navigation, dialog layout, and responsive interaction rules. It does not change ledger, reimbursement, category, member, auth, database, or permission domain rules.

## Acceptance Criteria

1. Authenticated mobile users see primary app navigation as a fixed bottom tab bar, not the desktop sidebar.
2. Mobile bottom tab items are built from the existing role-aware navigation result and preserve hidden/visible behavior by permission.
3. Mobile active tab state follows the current route, including nested settings routes, and exposes `aria-current="page"`.
4. Desktop viewports keep the existing sidebar navigation and desktop create-record placement.
5. Mobile routes eligible for record creation show a `新增紀錄` FAB that opens the existing expense-first create-record dialog without navigating.
6. The global `新增紀錄` FAB is hidden on `/search` and under `/settings`.
7. Mobile `/search` does not show the bottom tab bar and places a ghost-style back icon button to the left of the search input.
8. The mobile search back button returns to browser history when history exists and falls back to `/` when no prior page exists.
9. Mobile pages must not create root-level horizontal scrolling at common mobile widths.
10. Mobile scrollbars are visually hidden while touch scrolling remains available.
11. Intentional inner horizontal controls, such as category selection inside dialogs, may scroll horizontally without exposing root page overflow.
12. Mobile overview hides the visible `總覽` page title.
13. Mobile overview keeps `餘額`, `支出`, and `收入` in one compact row.
14. Mobile overview increases spacing between major sections compared with the desktop dashboard density.
15. Mobile overview hides the `收支趨勢` chart while desktop keeps it.
16. Mobile search batch footer stacks as a column-safe action area: summary values split left/right, selection actions on the left, and batch actions on the right.
17. Mobile search batch action buttons use icon buttons with accessible names; desktop keeps text buttons.
18. Search filter and sort dialog uses the same paired layout on mobile and desktop: `類型` with `分類`, `收支對象` with `退款狀態`, and `開始日期` with `結束日期`.
19. Search filter `排序` is full width on mobile and occupies one column on desktop.
20. Shared dialog footers use mobile full-width distribution: one button fills the footer width, and two or more buttons fill the width as equal columns.
21. Desktop dialog footers keep their original natural-width, end-aligned layout.
22. Create-record and edit-record dialogs use the same form layout rules where applicable.
23. Create-record and edit-record category selection remains a one-row horizontal selector on mobile, with enough padding so selected states are not clipped.
24. Create-record category selection keeps four columns on desktop.
25. Create-record and edit-record payer/date fields are side by side on mobile and desktop where space permits.
26. Edit-record dialog does not render a visible description.
27. Record detail dialog shows `分類` with `狀態`, and `支付者` with `日期`, as paired fields.
28. Mobile settings pages hide inner page headers.
29. Mobile settings uses full-width segmented tabs for `帳號資訊`, `成員`, and `分類`, not line tabs.
30. Mobile settings hides the global create-record FAB while retaining settings-owned FABs for `新增成員` and `新增分類`.
31. Mobile category ordering uses up/down icon buttons; the first item's up button and the last item's down button are disabled.
32. Desktop category ordering keeps the existing drag-handle interaction.
33. Native select controls remain usable and readable in the filter dialog; this slice does not replace them with a custom select.

## BDD Scenarios

### Scenario: Mobile member sees bottom navigation

Given an authenticated member on a mobile viewport
When the member opens `/`
Then the desktop sidebar is not visible
And the bottom navigation named `主要導覽` is visible
And the current route tab has `aria-current="page"`.

### Scenario: Desktop layout remains unchanged

Given an authenticated member on a desktop viewport
When the member opens `/`
Then the desktop sidebar is visible
And the mobile bottom tab bar is not visible
And desktop page actions keep their natural placement.

### Scenario: Mobile overview prioritizes summary content

Given an authenticated member on a mobile viewport
When the member opens `/`
Then the visible page title `總覽` is not shown
And `餘額`, `支出`, and `收入` appear in one row
And `收支趨勢` is not visible
And the page has no root horizontal scrolling.

### Scenario: Mobile search uses back navigation instead of bottom tabs

Given an authenticated member on a mobile viewport
When the member opens `/search`
Then the bottom tab bar is not visible
And a ghost-style button named `返回上一頁` appears before the search field.

### Scenario: Search back button falls back to home

Given an authenticated member opens `/search` directly without usable browser history
When the member activates `返回上一頁`
Then the app navigates to `/`.

### Scenario: Search filter layout is consistent

Given an authenticated member opens the search filter dialog
When the dialog is shown on mobile or desktop
Then `類型` and `分類` are side by side
And `收支對象` and `退款狀態` are side by side
And `開始日期` and `結束日期` are side by side
And `排序` is full width only on mobile.

### Scenario: Mobile batch action footer stays reachable

Given an authenticated member has search results on a mobile viewport
When the member enters selection mode
Then the selected-count summary and total are split left/right
And selection controls and batch actions are split left/right
And mobile batch actions are icon buttons with accessible names
And the footer is not clipped by the viewport or safe area.

### Scenario: Create-record dialog keeps compact mobile category selection

Given an authenticated member opens `新增紀錄` on mobile
When the create-record dialog is shown
Then category choices are in one horizontal row
And the row can scroll horizontally without showing a mobile scrollbar
And the selected category ring is not clipped
And `支付者` and `日期` are side by side.

### Scenario: Edit-record dialog matches create-record layout

Given an authenticated member opens edit for a record
When the edit-record dialog is shown
Then it uses the same category selector and payer/date layout as create-record
And no visible dialog description is shown
And the dialog content has no horizontal scrolling.

### Scenario: Record detail pairs metadata fields

Given an authenticated member opens a record detail dialog
When the dialog is shown
Then `分類` and `狀態` are side by side
And `支付者` and `日期` are side by side.

### Scenario: Dialog footer buttons distribute across mobile width

Given any shared dialog is open on mobile
When the footer contains one action button
Then the button fills the footer width
And when the footer contains multiple action buttons
Then the buttons fill the footer width as equal columns.

### Scenario: Mobile settings uses segmented tabs and page FABs

Given an authenticated member opens `/settings/account` on mobile
Then settings navigation named `設定導覽` is visible as segmented tabs
And the inner page header is not visible
And the global `新增紀錄` FAB is not visible.

### Scenario: Mobile category ordering uses boundary-disabled buttons

Given an admin opens `/settings/categories` on mobile
When active categories are listed
Then each category row has up/down reorder icon buttons
And the first row's up button is disabled
And the last row's down button is disabled.

## E2E Test Design

### Routes And Fixtures

- routes: `/`, `/search`, `/settings/account`, `/settings/members`, `/settings/categories`
- mobile viewport: `390x844` as the primary acceptance viewport, with `375x812` as a narrow regression check where practical.
- desktop viewport: `1440x900` for desktop regression checks.
- fixture strategy: use existing E2E authenticated member override for general mobile app routes.
- admin settings fixture need: seed or authenticate an admin-linked account that can reach `/settings/members` and `/settings/categories` without redirecting to an unlinked-account state.

### Selectors

- app navigation: `getByRole("navigation", { name: "主要導覽" })`
- settings navigation: `getByRole("navigation", { name: "設定導覽" })`
- create action: button named `新增紀錄`
- search back: button named `返回上一頁`
- filter action: button named `開啟篩選`
- selection mode: button named `開啟選取模式`
- dialog titles: `新增紀錄`, `編輯紀錄`, `紀錄詳情`, `篩選與排序`, `自訂月份`
- settings actions: button named `新增成員`, button named `新增分類`
- category ordering: buttons named with `上移` and `下移` plus the category name where available.

### Browser Checks

- Verify root document width does not exceed viewport width on mobile routes.
- Verify mobile `/search` has no bottom tab bar and no global FAB.
- Verify mobile overview has no visible `總覽` heading and no visible trend chart.
- Verify mobile dialog bodies do not horizontally overflow their content box.
- Verify mobile category selector can scroll horizontally while selected visual state remains fully visible.
- Verify mobile dialog footer button widths fill the available footer width.
- Verify desktop keeps sidebar and natural footer button alignment.

### Accessibility Checks

- Bottom tab bar and settings tabs have accessible navigation labels.
- Active navigation state is programmatically exposed with `aria-current="page"`.
- Icon-only mobile buttons have accessible names.
- Disabled reorder boundary buttons expose disabled state.
- Dialog focus behavior remains provided by the shared Dialog component.

### Unit / Integration Coverage

- Add or update layout component coverage for mobile nav visibility, hidden search nav, hidden settings global FAB, and role-aware tab rendering.
- Add or update dialog footer coverage for one, two, and three action buttons at mobile and desktop breakpoints where feasible.
- Add focused component coverage for category reorder boundary-disabled button states if the logic is component-owned.

### Manual Review Checklist

- iOS Safari and Android Chrome visual pass for hidden scrollbars and absence of accidental horizontal page panning.
- Native select dropdowns in the filter dialog remain readable after preserving platform behavior.
- Search batch footer remains fully visible above safe-area and does not cover selected results unexpectedly.
- Mobile settings tabs are usable with account, members, and categories routes.
- Category ordering up/down controls are understandable enough as the accepted no-drag mobile path.

## Known Gaps And Risks

- Touch drag-and-drop for category ordering is intentionally not part of this slice. Mobile uses up/down buttons first; if real drag is later required, evaluate a maintained drag package such as `@dnd-kit`.
- Settings member/category mobile E2E depends on an admin-linked test fixture. Current local smoke was blocked by auth seed state.
- Native select visual presentation remains platform-controlled. This spec only requires it to stay readable and non-overflowing.
- Hidden scrollbars must not remove keyboard or touch scrolling; implementation needs to avoid disabling overflow entirely on scrollable regions.

## Review Gate

- decision: ready_for_review
- reviewer_focus:
  - Confirm the mobile behavior above reflects the accepted prototype and the latest user corrections.
  - Confirm up/down category ordering is the accepted mobile alternative to drag for this slice.
  - Confirm native select remains platform-native rather than being replaced now.
- acceptance_signals:
  - Feature Technical Design can decide responsive component boundaries from this spec.
  - TDD Implementation can write mobile E2E/component tests from the listed scenarios and selectors.
  - No financial domain behavior needs rediscovery.
- unresolved_blockers:
  - Admin-linked E2E fixture should be made reliable before implementation verification covers settings member/category mobile pages.
- next_step:
  - Feature Technical Design after approval.
