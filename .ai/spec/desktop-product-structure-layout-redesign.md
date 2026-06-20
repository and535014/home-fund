---
id: desktop-product-structure-layout-redesign
stage: behavior-spec
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/desktop-product-structure-layout-redesign.md
  - .ai/prototype/desktop-product-structure-layout-redesign.md
  - .ai/domain/home-family-fund.md
  - commit:d8fb50a
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_test_design
trace_links:
  routes:
    - src/app/(app)/page.tsx
    - src/app/(app)/search/page.tsx
    - src/app/(app)/reimbursements/page.tsx
    - src/app/(app)/settings/page.tsx
    - src/app/(app)/settings/account/page.tsx
    - src/app/(app)/settings/members/page.tsx
    - src/app/(app)/settings/categories/page.tsx
  components:
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-sidebar-nav.tsx
    - src/components/layout/page-layout.tsx
    - src/components/layout/record-create-sidebar-button.tsx
    - src/app/month-switcher.tsx
    - src/app/month-picker-dialog.tsx
    - src/app/dashboard-charts.tsx
    - src/app/create-record-dialog.tsx
    - src/app/record-entry-panel.tsx
reviewed_at: 2026-06-20
---

# Desktop Product Structure Layout Redesign Spec

## Prototype Decision

- decision: accepted_for_spec
- evidence: `d8fb50a Refine desktop app layout prototype`
- scope note: This spec locks the accepted desktop IA/layout prototype as the next implementation contract. Mobile behavior remains out of scope for this slice.
- important delta from original intent: recurring schedule UI and app/module/test code are removed from this product structure. Prisma schema/migrations/seed cleanup is not included in this local_dev UI/layout slice.

## Acceptance Criteria

1. Authenticated desktop users see a persistent primary sidebar and a page area that fills the viewport height without requiring whole-page scrolling.
2. Primary sidebar navigation exposes only `總覽`, `搜尋`, `退款`, and `設定` as top-level destinations.
3. Primary sidebar is icon-only, uses consistent icon-button sizing and padding, and keeps the `新增紀錄` action in the sidebar footer using the primary button style.
4. The sidebar `新增紀錄` action opens the existing create-record dialog without navigating away.
5. Page-level content scrolls inside its own content region when needed; the app shell itself does not become the scrolling surface.
6. Page headers span the full page content width, contain no descriptions, and are omitted on the outer settings layout.
7. `/settings` redirects to `/settings/account`.
8. Settings uses a settings-level sidebar built from shared sidebar components and exposes `帳號資訊`, admin-only `成員`, admin-only `分類`, and `登出`.
9. Non-admin users cannot see or directly access settings member/category management.
10. `退款` is visible only to admins and finance managers; users without reimbursement permission cannot directly access `/reimbursements`.
11. `/search` and `/reimbursements` render the same placeholder structure with title and `敬請期待` content.
12. `/reimbursements` does not render reimbursement summaries, settlement controls, or old card-based content in this slice.
13. `/settings/account` renders account information with the approved settings page structure and no header description.
14. `/settings/members` and `/settings/categories` render under the settings layout without duplicated page padding, borders, or wrapper cards introduced by the layout migration.
15. The removed recurring route is not part of visible navigation and no app/module test depends on recurring reminder behavior.
16. The overview route `/` renders the approved dashboard regions: month switcher, balance/expense/income metrics, income/expense/balance trend, pending reimbursement summary, expense category breakdown, and records table.
17. Dashboard titles and labels do not use `本月`, because the selected month is switchable.
18. Dashboard page content does not scroll when the current desktop viewport can contain the approved dashboard composition.
19. The month switcher uses ordinary button + dialog composition, opens a centered dialog through the shared Dialog portal, and shows a full-screen backdrop.
20. The trend chart uses a chart library, shows daily income and expense as square-corner bars, balance as a thinner line, and uses smaller axis labels.
21. The expense category chart uses a chart library donut chart, fills its container responsively, keeps the donut ring readable, and includes category names, percentage labels, and a useful hover tooltip when data exists.
22. The expense category region renders only text when no expense category data exists; it must not render an empty donut, placeholder circle, or obsolete explanatory copy.
23. Create-record dialog uses a line tablist for `成員支出`, `收入`, and `基金支出`.
24. Create-record category selection is a custom radio-grid selector, not a native/select dropdown, and uses a unified temporary icon.
25. Create-record category selector has no visible label but remains accessible by name.
26. Create-record payer/source field uses a unified visible label `成員`; for fund expense it remains visible, disabled, and displays `基金`.
27. Create-record modal has no visible description and the submit button text is `新增` without an icon.
28. Existing ledger form behavior and permissions remain intact: general members create for themselves; admins and finance managers can create for other members; fund-paid expenses cannot specify a member payer.

## BDD Scenarios

### Scenario: Desktop member sees the new top-level IA

Given an authenticated active household member on a desktop viewport
When the member opens `/`
Then the primary sidebar shows `總覽`, `搜尋`, `退款` if permitted, and `設定`
And the sidebar does not show `週期`, `成員`, or `分類` as top-level navigation
And the sidebar footer shows one primary `新增紀錄` action.

### Scenario: Search and reimbursement placeholders are structurally consistent

Given an authenticated member with reimbursement permission
When the member opens `/search` and `/reimbursements`
Then each page has its own page header title
And each page content shows the same centered `敬請期待` placeholder structure
And `/reimbursements` does not show old reimbursement totals or settlement actions.

### Scenario: Reimbursement route remains permission gated

Given an authenticated general member without reimbursement permission
When the member opens `/reimbursements`
Then the app redirects away from the reimbursement page
And the primary sidebar does not expose `退款`.

### Scenario: Settings redirects to account information

Given an authenticated active household member
When the member opens `/settings`
Then the app redirects to `/settings/account`
And the settings area shows the settings sidebar and account information content.

### Scenario: Settings management remains admin-only

Given an authenticated non-admin member
When the member opens settings
Then the settings sidebar does not show `成員` or `分類`
And direct visits to `/settings/members` and `/settings/categories` do not expose management content.

### Scenario: Admin can reach nested member and category management

Given an authenticated admin
When the admin opens `/settings/members` or `/settings/categories`
Then the page renders inside the settings layout
And the page uses the shared page header/content components
And there are no extra wrapper cards, duplicated borders, or leftover route-group layout artifacts.

### Scenario: Dashboard renders switchable-month overview

Given an authenticated member with dashboard data for a selected month
When the member opens `/?month=2026-06`
Then the overview shows the selected month switcher
And metric labels are month-neutral
And trend, reimbursement, category, and records regions are visible.

### Scenario: Month switcher dialog behaves like a modal

Given an authenticated member on the overview page
When the member activates the middle month switcher button
Then a centered month picker dialog opens
And a backdrop covers the viewport
And focus remains managed by the shared Dialog behavior.

### Scenario: Empty expense categories render text only

Given an authenticated member whose selected month has no expense category totals
When the member views the overview
Then the `支出分類` region shows `尚無支出分類資料`
And no donut chart or circular empty graphic is rendered.

### Scenario: Create-record modal exposes approved record types

Given an authenticated member on any app page
When the member activates the sidebar `新增紀錄` action
Then the create-record dialog opens
And the record type control is a line tablist with `成員支出`, `收入`, and `基金支出`
And the dialog has no visible description.

### Scenario: Create-record category selection is custom and accessible

Given the create-record dialog is open
When the member selects a record type with active categories
Then categories are presented as a custom radio grid
And the category selector has an accessible name
And submitting the form sends the selected `categoryId`.

### Scenario: Fund expense keeps disabled fund member field

Given the create-record dialog is open
When the member selects `基金支出`
Then the `成員` field remains visible
And it is disabled and displays `基金`
And submitting the form uses `paymentSource=fund` without a member payer.

## E2E Test Design

### Routes And Fixtures

- primary routes: `/`, `/search`, `/reimbursements`, `/settings`, `/settings/account`, `/settings/members`, `/settings/categories`
- removed route check: `/recurring` should not be a visible navigation destination; direct route behavior can be a 404 or redirect, depending on final route file state.
- fixture strategy: use existing Playwright authenticated session helper and seeded users for admin, finance manager, and general member.
- data fixtures:
  - selected month with income, member-paid expense, fund-paid expense, categories, and records.
  - selected month with no expense category totals.
  - admin user for settings management visibility.
  - general member for hidden management/reimbursement links.

### Selectors

- Prefer accessible roles and names:
  - navigation: `getByRole("navigation")`, links named `總覽`, `搜尋`, `退款`, `設定`
  - add record: button named `新增紀錄`
  - page titles: headings named `總覽`, `搜尋`, `退款`, `帳號資訊`, `成員`, `分類`
  - dialog: `getByRole("dialog", { name: /新增紀錄|自訂月份/ })`
  - tabs: `getByRole("tab", { name: "成員支出" })`, `收入`, `基金支出`
  - category radio grid: `getByRole("radiogroup", { name: "分類" })`
  - placeholders: text `敬請期待`, `尚無支出分類資料`
- Add stable `aria-label` or visible names only where current accessible names are insufficient.

### Browser Checks

- Desktop viewport: `1440x900` minimum acceptance viewport for this slice.
- Verify body/app shell height does not create whole-page scroll on key pages where content fits.
- Verify page content regions can scroll independently on settings/member/category pages when content exceeds available height.
- Verify month switcher backdrop and centered dialog with screenshot or DOM class assertions.
- Verify charts render non-empty SVG/canvas content when data exists and text-only empty state when data does not.
- Verify settings sidebar and primary sidebar do not visually collapse into duplicate padding/borders.

### Accessibility Checks

- Keyboard can open/close month picker and create-record dialogs.
- Dialog focus trap returns focus to the triggering control after close.
- Icon-only sidebar buttons have accessible labels or tooltips.
- Category radio grid is keyboard reachable and has a selected state.
- Disabled fund `成員` field communicates disabled state and value.

### Unit / Integration Coverage

- `dashboard-navigation.test.ts`: top-level IA and permission-gated reimbursement/settings management visibility.
- `shared-layout.test.tsx`: PageLayout/PageHeader/page-content scroll behavior and full-width header/content assumptions.
- `ledger-record-form.test.ts`: member expense, income, and fund expense payload parsing remains correct.
- `home-access.test.ts`: reimbursement access remains derived from admin/finance-manager roles.
- `home-dashboard-data-source.test.ts`: dashboard loader no longer queries recurring reminders.
- `monthly-report.test.ts`: monthly report excludes recurring pending items after recurring removal.
- Chart component tests may be added if rendering logic becomes brittle; otherwise verify through E2E/screenshot.

### Manual Review Checklist

- Desktop review of `/`, `/search`, `/reimbursements`, `/settings/account`, `/settings/members`, `/settings/categories`.
- Admin, finance manager, and general member visibility pass.
- Create-record modal visual pass for all three record types.
- Empty and populated chart states pass.
- Month picker modal position and backdrop pass.

## Out Of Scope

- Mobile layout redesign.
- Real search behavior.
- Reimbursement settlement workflow UI.
- Account self-editing.
- Production release readiness.
- Prisma migration to drop recurring schedule tables/enums.
- Analytics/tracking events.

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm AC covers the accepted desktop prototype and the later user-directed refinements.
  - Confirm recurring removal is scoped to app/module/test and not Prisma migration.
  - Confirm E2E route/role coverage is sufficient for the next technical design.
- unresolved_blockers:
  - None for Feature Technical Design if this spec is approved.
- recommended_next_gate:
  - Feature Technical Design
