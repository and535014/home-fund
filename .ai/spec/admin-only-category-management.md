---
id: spec-admin-only-category-management
stage: spec
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-only-category-management.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-only-category-management.md
  - .ai/prototype/admin-only-category-management.md
  - .ai/spec/story-category-management.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  prototype_route:
    - src/app/categories/page.tsx
    - src/app/categories/category-management-panel.tsx
  layout:
    - src/app/home-dashboard-layout.tsx
    - src/app/dashboard-route-frame.tsx
  ui_components:
    - src/components/ui/tabs.tsx
    - src/components/ui/item.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/sonner.tsx
  domain_modules:
    - src/modules/identity-access/authorization.ts
    - src/modules/identity-access/access-hints.ts
    - src/modules/categorization/category-catalog.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-19
---

# Admin-Only Category Management Behavior Spec

## Decision

- decision: proceed
- prototype_status: accepted for Behavior Spec
- route: `/categories`
- next_gate: Feature Technical Design
- next_skill: architecture-planner

## Final Acceptance Criteria

1. Admin members see the `分類` sidebar entry and can open `/categories`.
2. Finance managers and general members do not see the `分類` sidebar entry.
3. Direct non-admin visits to `/categories` show a dashboard denied state and do not expose category controls.
4. Category management uses page title `分類` with the description `啟用中的分類可用於新增收入或支出，封存後仍保留在歷史紀錄。`
5. The category page does not show the default `新增收入` or `新增支出` actions.
6. Admins see `新增分類` in the desktop header and in the mobile footer.
7. Opening `新增分類` opens a form modal without changing the URL.
8. The category list is split by status with shadcn-style tabs: `啟用分類 (n)` and `封存分類 (n)`, using `TabsList variant="line"`.
9. Active and archived tabs each group categories into income and expense groups with title counts, such as `收入分類 (2)`.
10. Active category rows use the shared `Item` row component and keep edit/archive icon actions on the right on mobile and desktop.
11. Admins can create an income or expense category with a non-empty name.
12. Category create and rename reject duplicate active category names within the same type.
13. Admins can rename only active categories through a modal.
14. Admins can start archive from an active category row; archive opens a confirmation modal before changing state.
15. Archive confirmation shows how many historical records currently reference the category and confirms that existing records keep their category.
16. Confirming archive moves the category from active tab to archived tab and shows a toast.
17. Archived categories are visible in the archived tab, grouped by income and expense, and are excluded from new income/expense category choices.
18. Empty active category state remains usable and points admin to create the first category.
19. Empty archived income or expense groups show `尚無封存分類` centered in the group card.
20. Create, rename, archive, validation, and permission outcomes use toast feedback, not persistent page-level `Alert`.
21. UI copy is Traditional Chinese and uses household finance language.
22. Server-side authorization rejects non-admin create, rename, and archive attempts, even if a hidden client control or direct request is used.

## BDD Scenarios

### Scenario: Admin Opens Category Management

- Given an authenticated household member with admin role
- When the member views the dashboard navigation
- Then the sidebar includes `分類`
- When the member opens `/categories`
- Then the page title is `分類`
- And category management controls are visible
- And `新增收入` and `新增支出` are not visible on the category page

### Scenario: Finance Manager Cannot Discover Or Browse Categories

- Given an authenticated household member with finance manager role and no admin role
- When the member views the dashboard navigation
- Then the sidebar does not include `分類`
- When the member directly opens `/categories`
- Then a dashboard denied state is shown
- And category create, rename, and archive controls are not visible

### Scenario: General Member Cannot Discover Or Browse Categories

- Given an authenticated household member with general member role
- When the member views the dashboard navigation
- Then the sidebar does not include `分類`
- When the member directly opens `/categories`
- Then a dashboard denied state is shown
- And category create, rename, and archive controls are not visible

### Scenario: Admin Creates Category

- Given an admin is on `/categories`
- When the admin activates `新增分類`
- Then a create modal opens without changing the URL
- When the admin selects `支出`, enters `水電費`, and submits
- Then a success toast is shown
- And `水電費` appears under the active expense category group

### Scenario: Duplicate Active Category Name Is Rejected

- Given an active expense category named `日用品` exists
- When an admin creates or renames another active expense category to `日用品`
- Then the change is rejected
- And an error toast explains that the same active category name already exists in that type

### Scenario: Admin Renames Active Category

- Given an active category named `網路費` exists
- When an admin activates its edit icon
- Then a rename modal opens
- When the admin changes the name to `電信網路` and submits
- Then a success toast is shown
- And the active category row shows `電信網路`

### Scenario: Admin Archives Category With Confirmation

- Given an active category has historical record references
- When an admin activates its archive icon
- Then an archive confirmation modal opens
- And the modal shows the historical reference count
- When the admin confirms archive
- Then a success toast is shown
- And the category leaves the active tab
- And the category appears in the archived tab under the same income or expense group

### Scenario: Archived Category Is Not Available For New Records

- Given a category has been archived
- When an admin or permitted record creator opens a new income or expense record form
- Then the archived category is not available as a category choice
- And historical records that already used the category still display the category name

## E2E Design

| Scenario | Route | Actor Fixture | Viewport | Selectors And Expected States |
|---|---|---|---|---|
| Admin navigation and page | `/categories` | admin member | desktop | sidebar link `分類` visible; heading `分類`; button `新增分類`; no `新增收入` or `新增支出`; line tabs visible. |
| Non-admin navigation hidden | `/` then `/categories` | finance manager, general member | desktop | sidebar has no `分類`; direct route shows denied heading and no create/edit/archive controls. |
| Create category | `/categories` | admin member with active categories | desktop and mobile | `新增分類` opens modal; URL unchanged; submit valid category; toast `分類已新增`; item appears in active tab. |
| Duplicate validation | `/categories` | admin member with `日用品` active expense category | desktop | duplicate submit shows error toast; list remains unchanged. |
| Rename category | `/categories` | admin member | desktop | edit icon by accessible name `修改 <category>` opens modal; save shows toast; row text updates. |
| Archive category | `/categories` | admin member with category referenced by records | desktop | archive icon by accessible name `封存 <category>` opens confirmation; count text visible; confirm shows toast; archived tab count updates. |
| Mobile placement | `/categories` | admin member | mobile | `新增分類` is in fixed footer; desktop header action is not visible; item row actions stay on the right. |

### Fixture And Mock Strategy

- Prefer existing E2E current-member override mechanism guarded by `NODE_ENV !== "production"` for role fixtures.
- Seed at least one admin, one finance manager, and one general member.
- Seed active income and expense categories plus one archived category.
- Seed at least one ledger record referencing a category to verify archive confirmation reference count and historical display.
- If server actions are not yet implemented, TDD implementation should first add failing tests for server-side mutation authorization before enabling persistence.

### Accessible Selectors

- Page heading: role/name `heading`, text `分類`.
- Create action: button `新增分類`.
- Create modal: dialog title `新增分類`; fields `類型`, `分類名稱`.
- Rename action: button accessible name `修改 <分類名稱>`.
- Archive action: button accessible name `封存 <分類名稱>`.
- Archive dialog: title `封存分類`; confirm button `確認封存`.
- Tabs: tab names `啟用分類 (n)` and `封存分類 (n)`.
- Toasts: assert visible toast text for success/error outcomes.

### Responsive And Accessibility Checks

- Desktop: create action is in header; active/archived tab content uses two category group columns where width allows.
- Mobile: create action is in fixed footer; no duplicate create action in header; category item actions stay on the right.
- Keyboard: tabs are keyboard operable through Radix Tabs behavior; dialog focus is trapped; close returns to a sensible trigger where feasible.
- Icon-only row actions have accessible names.
- Toast messages are used for transient mutation feedback; page-level `Alert` is not used for these actions.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/unit | Admin-only authorization for category manage command; finance manager and general member rejected even with dormant `manage_categories` capability. |
| Domain/unit | Category create, rename, archive preserve active/archived lifecycle and reject duplicate active names within the same type. |
| Route/server action | `/categories` route denies non-admins server-side; category mutation actions reject non-admin requests. |
| Integration | Dashboard access hints hide category navigation for non-admin roles and show it for admins. |
| E2E | Admin browse/create/rename/archive; non-admin sidebar hidden and direct route denied; archived category not offered for new records; mobile footer action placement. |
| Manual local_dev | Review `http://localhost:3000/categories?previewRole=admin` for prototype-only visual continuity until real login fixtures are ready. |

## Technical Design Inputs

- Decide whether to rename `HomeDashboardLayout` into a general dashboard shell or split shell/header/footer/create-record actions.
- Decide server action/API boundary for create, rename, and archive category.
- Decide Prisma write shape and revalidation paths for category page, record creation forms, reports, and dashboard data.
- Decide whether archived category name reuse is allowed at the database constraint level; behavior spec only requires duplicate rejection among active categories of the same type.
- Decide final focus restoration after create, rename, and archive.
- Keep non-production preview role query out of production behavior.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm direct non-admin route denial uses dashboard denied state.
  - Confirm duplicate-name rule is active-only within the same category type.
  - Confirm archived categories use tab visibility and are excluded from new-record forms.
  - Confirm mobile create action belongs in footer.
- must_check:
  - Acceptance criteria cover permissions, sidebar, direct route, create, rename, archive, tab UI, responsive placement, and toast feedback.
  - BDD scenarios use domain language and avoid implementation details except where UI behavior is the contract.
  - E2E design names routes, fixtures, viewports, selectors, toasts, accessibility, and responsive checks.
- unresolved_blockers:
  - None for Feature Technical Design.
- next_step:
  - architecture-planner
