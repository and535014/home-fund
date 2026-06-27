---
id: spec-category-archive-visibility-toggle
stage: behavior-spec
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-archive-visibility-toggle.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/category-archive-visibility-toggle.md
  - .ai/prototype/category-archive-visibility-toggle.md
  - .ai/archive/archive-category-visual-identity-2026-06-21.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  production_routes:
    - /settings/categories
    - /
  target_components:
    - src/app/(app)/settings/categories/page.tsx
    - src/app/(app)/settings/categories/category-management-panel.tsx
    - src/app/(app)/settings/categories/category-management-ui.tsx
    - src/components/ui/switch.tsx
    - src/components/ui/item.tsx
    - src/app/record-entry-panel.tsx
  domain_modules:
    - src/modules/categorization/category-catalog.ts
    - src/modules/categorization/category-command.ts
  server_actions:
    - src/app/category-actions.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-26
---

# Category Archive Visibility Toggle Behavior Spec

## Decision Summary

- decision: proceed_to_feature_technical_design
- prototype_status: accepted for Behavior Spec
- route: `/settings/categories`
- next_gate: Feature Technical Design
- next_skill: feature-technical-design
- reason: The accepted prototype settles the category page interaction shape: one page-level switch, archived categories inside the existing income/expense panels, archived rows at the bottom, icon-only archived state aligned with active drag handles, and direct `取消封存` action with toast feedback.

## Final Acceptance Criteria

1. `/settings/categories` shows a single page-level switch named `顯示封存分類`.
2. The archived visibility switch applies to both `支出分類` and `收入分類`; there are no active/archived tabs.
3. Archived categories are hidden by default when an admin opens `/settings/categories`.
4. When the switch is off, archived category names, archived status icons, and `取消封存` actions are not visible.
5. When the switch is on, active categories remain first within each category type.
6. When the switch is on, archived categories appear below active categories within the matching `支出分類` or `收入分類` panel.
7. The switch state is page-local UI state and does not need to persist across reloads.
8. Archived rows retain category color/icon visual identity.
9. Archived rows display an `已封存` status icon in item media, aligned with active-row drag handle placement.
10. Archived rows expose an icon-only `取消封存 <分類名稱>` action with tooltip text `取消封存`.
11. Archived rows do not expose `修改 <分類名稱>`, `封存 <分類名稱>`, `排序 <分類名稱>`, `上移 <分類名稱>`, or `下移 <分類名稱>`.
12. Admins can unarchive an archived category from `/settings/categories`.
13. Successful unarchive changes the category status to active, shows toast `分類已取消封存`, and moves the category into the active section.
14. A restored category appends to the bottom of active categories for the same household and category type.
15. After refresh/revalidation, a restored category is available in new income/expense record category choices for its type.
16. Unarchive is rejected when another active category in the same household/type already has the same normalized name.
17. Duplicate-name unarchive failure uses actionable Traditional Chinese copy and does not mutate category state.
18. Non-admin members cannot unarchive categories server-side.
19. Showing archived categories does not make archived categories available for new income/expense records.
20. Existing create, edit, archive, reorder, active-category visual identity, active-category ordering, and historical record readability behavior do not regress.
21. UI copy uses Taiwan wording: `封存`, `取消封存`, `顯示封存分類`, and `已封存`.

## BDD Scenarios

### Scenario: Admin Opens Category Management With Archived Categories Hidden

Given an authenticated admin is on `/settings/categories`  
And archived income and expense categories exist  
When the page loads  
Then the `顯示封存分類` switch is off  
And the `支出分類` panel shows active expense categories only  
And the `收入分類` panel shows active income categories only  
And no tab named `封存分類` is shown

### Scenario: Admin Reveals Archived Categories

Given an authenticated admin is on `/settings/categories`  
And archived categories exist for income and expense types  
When the admin turns on `顯示封存分類`  
Then archived categories are visible in their matching type panels  
And active categories are listed before archived categories  
And each archived row shows the category visual identity  
And each archived row shows an `已封存` status icon  
And each archived row has a `取消封存 <分類名稱>` action

### Scenario: Admin Hides Archived Categories Again

Given archived categories are visible on `/settings/categories`  
When the admin turns off `顯示封存分類`  
Then archived rows are hidden  
And no category status is changed  
And active category ordering is unchanged

### Scenario: Archived Rows Are Review And Restore Only

Given an archived category is visible in a category panel  
Then the row does not expose edit, archive, or reorder actions  
And the row exposes only `取消封存 <分類名稱>` as its mutation action  
And the row's `已封存` icon aligns with active-row drag handles

### Scenario: Admin Unarchives A Category

Given an authenticated admin is viewing archived categories  
And an archived expense category named `餐飲` exists  
When the admin activates `取消封存 餐飲`  
Then a toast says `分類已取消封存`  
And `餐飲` appears in the active section of `支出分類`  
And `餐飲` appears after the previously active expense categories  
And `餐飲` is available in new expense record category choices after refresh or revalidation

### Scenario: Duplicate Active Name Blocks Unarchive

Given an archived expense category named `餐飲` exists  
And an active expense category named `餐飲` also exists in the same household  
When an admin tries to unarchive the archived `餐飲` category  
Then the request is rejected  
And no category status changes  
And the admin sees Traditional Chinese copy explaining that an active category already uses the same name

### Scenario: Non-Admin Cannot Unarchive Category

Given a finance manager or general member submits an unarchive request  
When the request reaches the server action or domain boundary  
Then the request is rejected as permission denied  
And no category status changes

### Scenario: Archived Category Still Excluded From New Records

Given an archived category is visible in category management because `顯示封存分類` is on  
When a member opens the new-record form before the category is restored  
Then the archived category is absent from the `分類` radiogroup  
And active categories remain available in persisted active order

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Hidden by default | `/settings/categories` | admin, at least one archived expense and one archived income category | desktop | switch role `switch`, name `顯示封存分類`, unchecked; regions `支出分類` and `收入分類`; archived category text not visible; no tab `封存分類`. |
| Reveal archived rows | `/settings/categories` | admin, active and archived categories for both types | desktop | turn on switch; archived rows visible below active rows; archived rows have accessible status media `已封存`; buttons `取消封存 <name>` visible. |
| Hide archived rows | `/settings/categories` | admin with switch on | desktop | turn off switch; archived names and `取消封存` buttons are hidden; active names remain visible. |
| Archived row actions | `/settings/categories` | admin with visible archived category | desktop | row has `取消封存 <name>`; no `修改 <name>`, `封存 <name>`, `排序 <name>`, `上移 <name>`, or `下移 <name>` for that archived category. |
| Unarchive success | `/settings/categories` and `/?month=2026-06` | admin, archived expense category with no active-name conflict | desktop | click `取消封存 <name>`; toast `分類已取消封存`; row moves into active ordering; after refresh/revalidation, new expense record radiogroup `分類` includes restored category. |
| Duplicate-name rejection | server action or integration test helper | active and archived same-name category in same type | n/a | unarchive returns duplicate-name error; category remains archived. |
| Permission rejection | server action or integration test helper | finance manager/general member and archived category | n/a | unarchive returns permission-denied error; category remains archived. |
| Mobile layout | `/settings/categories` | admin with active and archived categories | mobile | switch remains above line tabs; `支出(數量)` and `收入(數量)` tabs switch panels; archived row icon media and restore icon button do not overlap text or actions. |

## Fixture And Data Strategy

- Add or extend local/E2E seed data with at least one archived expense category and one archived income category.
- Include an archived category that has historical ledger references to verify identity remains readable.
- Include at least three active expense categories and two active income categories to assert active-first and append-to-bottom behavior.
- For duplicate-name rejection, prefer domain/server-action tests with explicit fixture setup instead of relying only on browser state.
- Keep existing role fixtures: admin, finance manager, and general member.

## Accessible Selectors

- Category page heading: role `heading`, name `分類`.
- Archive visibility switch: role `switch`, name `顯示封存分類`.
- Category panels: regions named `支出分類` and `收入分類`.
- Archived status media: accessible label `已封存`.
- Restore action: button `取消封存 <分類名稱>`.
- Restore tooltip text: `取消封存`.
- Active edit action: button `修改 <分類名稱>`.
- Active archive action: button `封存 <分類名稱>`.
- Active reorder handle: button `排序 <分類名稱>`.
- New-record category picker: radiogroup `分類`.

## Responsive And Accessibility Requirements

- The switch uses the shadcn-style `Switch` component and remains keyboard focusable.
- The switch has a stable accessible name and state.
- Archived status uses icon media with accessible label `已封存`.
- Icon-only restore action has a stable accessible name and tooltip.
- Archived rows are not draggable and do not expose keyboard move controls.
- Active rows keep existing drag handle and keyboard up/down behavior.
- Desktop row alignment must keep the archived status icon aligned with active-row drag handle placement.
- Mobile archived rows must keep status icon, category name, and restore action visible without overlap.
- All visible copy remains Traditional Chinese with Taiwan wording.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/unit | Unarchive rejects non-admin actors. |
| Domain/unit | Unarchive rejects missing category IDs and categories that are already active. |
| Domain/unit | Unarchive rejects duplicate active names in the same household/type. |
| Domain/unit | Unarchive changes archived status to active and appends to the active sort order for the same type. |
| Domain/unit | Active-category listing continues to return active categories only. |
| Server action/integration | Unarchive requires admin authorization, persists status/sort order, maps errors to Traditional Chinese messages, and revalidates category/new-record surfaces. |
| Component/unit | Category management row renders archived status icon media and restore icon button only for archived rows when visibility is enabled. |
| E2E | Admin toggles archived visibility, sees archived rows at bottom, hides them again, restores one category, and sees it in new-record choices. |
| E2E | Archived row does not expose edit/archive/reorder controls. |
| Regression | Existing category create/edit/archive/reorder and non-admin category management denial remain covered. |
| Manual | Review desktop and mobile alignment, tooltip behavior, and switch placement. |

## Technical Design Inputs

- Decide `unarchiveCategory` domain command and result event names.
- Decide whether already-active unarchive returns `invalid_state`, `category_not_found`, or a dedicated error.
- Decide server action name, form field contract, and action-state payload.
- Decide Prisma transaction shape for status update plus append-to-bottom sort order.
- Decide exact normalized-name comparison rules for duplicate active names.
- Decide whether category management loader should continue loading all categories and filter client-side, or expose an explicit archived-inclusive read model.
- Decide revalidation paths, expected to include `/settings/categories` and `/`.
- Decide whether E2E seed should include archived categories permanently or set them up inside the category-management spec.

## Accepted Risks

- Prototype could not capture a logged-in browser screenshot because local dev redirected to `/unauthenticated?reason=google_account_not_linked`; final implementation verification must include authenticated browser evidence.
- The prototype uses local state for unarchive; final behavior must replace it with server/domain persistence.
- The switch state is intentionally page-local. Persisted user preference is out of scope.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm final AC match the accepted prototype and domain decisions.
  - Confirm direct unarchive without confirmation is acceptable.
  - Confirm E2E fixture strategy should include archived seed categories.
  - Confirm duplicate-name rejection belongs in domain/server-action tests.
- must_check:
  - Acceptance criteria cover visibility, ordering, restore, permissions, duplicate conflicts, new-record exclusion, accessibility, and responsive behavior.
  - E2E design names routes, fixtures, viewports, selectors, expected states, and accessibility checks.
  - Technical Design inputs are enough to define server action, domain command, persistence, and tests.
- acceptance_signals:
  - Feature Technical Design can decide boundaries and data flow without reopening UX/domain policy.
  - TDD Implementation can derive failing tests from this spec.
- unresolved_blockers:
  - None for Feature Technical Design.
- recommended_next_gate:
  - feature-technical-design
- stop_condition: Feature Technical Design may proceed; wait for explicit approval before Implementation, Verification, Release, Learning, Artifact Compression, or committing implementation changes.
