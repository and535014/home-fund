---
id: spec-category-visual-identity
stage: behavior-spec
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-visual-identity.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/category-visual-identity.md
  - .ai/prototype/category-visual-identity.md
  - e2e/admin-category-management.spec.ts
  - e2e/create-record.spec.ts
  - e2e/dashboard.spec.ts
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
    - src/app/category-visuals.tsx
    - src/app/record-entry-panel.tsx
    - src/app/record-category-label.tsx
    - src/app/record-list-detail.tsx
    - src/app/(app)/page.tsx
  domain_modules:
    - src/modules/categorization/category-catalog.ts
    - src/modules/categorization/category-command.ts
    - src/modules/reporting/monthly-report.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-20
---

# Category Visual Identity And Ordering Behavior Spec

## Decision Summary

- decision: proceed_to_feature_technical_design
- prototype_status: accepted for Behavior Spec
- route: `/settings/categories`
- next_gate: Feature Technical Design
- next_skill: feature-technical-design
- reason: The accepted cut establishes where visual identity and ordering appear in the existing app surfaces. This spec turns that into persistence, validation, ordering, and testable display behavior.

## Final Acceptance Criteria

1. Admins can create a category with type, name, color, and icon from `/settings/categories`.
2. Category create requires a non-empty name and rejects duplicate active names within the same type.
3. Category color must be selected from the approved category color palette.
4. Category icon must be selected from the approved Lucide-backed icon registry.
5. If a category is created without explicit color or icon values through a backend path, server behavior applies deterministic defaults.
6. New categories append to the end of the active order for their type.
7. Admins can edit an active category's name, color, and icon from the existing category edit dialog.
8. The create and edit dialogs do not show explanatory descriptions or preview blocks.
9. The create and edit dialogs lay out type/name as equal-width fields on desktop and stacked fields on narrow viewports.
10. The create and edit dialogs lay out color/icon selectors side by side on desktop, with selector options using flex wrapping.
11. `/settings/categories` displays active expense and active income categories in two side-by-side panels on desktop and stacked panels on narrow viewports.
12. The category panels follow dashboard-panel behavior: title at top, fixed gap, fill available height, and internally scrollable list content.
13. Archived categories are not shown on the category management page.
14. Archived categories remain unavailable for new record category choices.
15. Archived categories retain saved visual identity for historical record/report display.
16. Active categories can be reordered only within their own type.
17. Reordering uses the drag handle icon only; dragging the row body, category name, edit button, or archive button does not start a reorder.
18. Reordering an expense category never changes income category order, and vice versa.
19. Reordered category order persists after refresh.
20. New-record category choices display category color/icon and follow the persisted active order for the selected record type.
21. Record list category media displays only the category visual mark, not the category name, while preserving an accessible category name.
22. The record-list category media is vertically centered in the row.
23. Dashboard category summaries display the category visual label and use the category color for the bar.
24. Historical record detail still displays the category name as text where the detail field asks for a category value.
25. Non-admin members cannot create, edit, archive, or reorder category visual identity/order server-side.
26. Invalid color, unsupported icon, cross-type reorder, archived-category reorder, duplicate reorder IDs, missing reorder IDs, or non-admin mutations are rejected server-side.
27. UI copy remains Traditional Chinese and uses the existing category-management vocabulary.

## BDD Scenarios

### Scenario: Admin Creates Category With Visual Identity

Given an authenticated admin is on `/settings/categories`  
When the admin opens `新增分類`  
And selects type `支出`  
And enters category name `水電費`  
And selects color `藍`  
And selects icon `住家`  
And submits the form  
Then a success toast says `分類已新增`  
And `水電費` appears in the `支出` category panel  
And the category row shows the selected color and icon

### Scenario: Created Category Appends To Its Type Order

Given active expense categories already exist in a configured order  
When an admin creates a new expense category  
Then the new category appears after the existing active expense categories  
And income category order is unchanged

### Scenario: Admin Edits Category Visual Identity

Given an active category named `日用品` exists  
When an admin opens `修改 日用品`  
And changes the category name, color, and icon  
And saves the form  
Then a success toast says `分類已更新`  
And the category row shows the updated name, color, and icon  
And record creation and dashboard summaries use the updated visual identity after refresh

### Scenario: Admin Reorders Expense Categories By Drag Handle

Given an admin is viewing the `支出` category panel  
When the admin drags a category by its sort handle and drops it over another expense category  
Then the expense category order changes  
And the updated order persists after refresh  
And the new expense record category chooser follows that order

### Scenario: Row Body Does Not Start Sorting

Given an admin is viewing a category row  
When the admin drags the category name, row body, edit button, or archive button  
Then category order does not change  
When the admin drags the sort handle  
Then reorder behavior is available

### Scenario: Income And Expense Orders Are Independent

Given active income and expense categories exist  
When an admin reorders an expense category  
Then income category order is unchanged  
When an admin reorders an income category  
Then expense category order is unchanged

### Scenario: Archived Categories Are Hidden From Management And Creation

Given an active category exists  
When an admin archives the category  
Then a success toast says `分類已封存`  
And the category is no longer visible in the expense or income category panel  
And the category is absent from new income/expense record choices  
And historical records that used the category still display a category visual mark or category name where appropriate

### Scenario: Invalid Visual Identity Is Rejected

Given a category mutation request contains an unsupported color or icon value  
When the request reaches the server action/domain boundary  
Then the request is rejected  
And no category visual identity changes are persisted

### Scenario: Invalid Reorder Is Rejected

Given a category reorder request includes missing IDs, duplicate IDs, archived category IDs, cross-type category IDs, or categories from another household  
When the request reaches the server action/domain boundary  
Then the request is rejected  
And existing category order remains unchanged

### Scenario: Record And Dashboard Surfaces Display Visual Identity

Given categories have persisted color and icon values  
When a member opens the new-record form  
Then category choices show visual marks and names in configured order  
When a member views the record list  
Then each record category media shows only the category visual mark and is vertically centered  
When a member views the dashboard category summary  
Then each category row shows the category visual label and uses the category color for its bar

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Category page panels | `/settings/categories` | admin with active income/expense categories | desktop | heading `分類`; button `新增分類`; regions `支出分類`, `收入分類`; no tab named `封存分類`; archived category text not visible. |
| Mobile panel stacking | `/settings/categories` | admin | mobile | regions `支出分類`, `收入分類` both visible in stacked layout; each panel list scrolls independently if content overflows. |
| Create with visual identity | `/settings/categories` | admin | desktop | open `新增分類`; labels `類型`, `分類名稱`, `顏色`, `Icon`; select swatch/icon by accessible names; submit; toast `分類已新增`; new row appears in correct panel. |
| Edit visual identity | `/settings/categories` | admin | desktop | activate `修改 <category>`; dialog has no descriptive copy; update name/color/icon; submit; row updates. |
| Drag reorder handle only | `/settings/categories` | admin with at least 3 expense categories | desktop | dragging handle `排序 <category>` changes order; dragging row text or action buttons does not. |
| Persisted order appears in creation | `/?month=2026-06` | admin or finance manager after seeded order | desktop | open create record; radiogroup `分類` lists categories in configured order with visual marks. |
| Archived category hidden | `/settings/categories`, `/?month=2026-06` | admin with archived category | desktop | archived category absent from management panels and new-record radiogroup. |
| Record list visual mark | `/?month=2026-06` | member with records | desktop | record list category media contains visual mark; category name is not visible in row media; accessible label remains category name. |
| Dashboard summary color | `/?month=2026-06` | expense records with category metadata | desktop | category summary rows show visual labels and colored bars matching category metadata. |
| Server validation | direct action/API through test helper or server-action integration | non-admin and invalid payloads | n/a | invalid color/icon/reorder/non-admin attempts fail and do not mutate state. |

## Fixture And Data Strategy

- Extend seed data with persisted category `color`, `icon`, and `sortOrder` values after Technical Design finalizes schema names.
- Include at least three active expense categories and two active income categories to exercise order.
- Include one archived category with historical ledger records to verify hidden management state and historical display.
- Keep existing role fixtures: admin, finance manager, general member.
- Add invalid-payload tests at domain/server-action level rather than trying to manipulate hidden browser-only fields.

## Accessible Selectors

- Category page heading: role `heading`, name `分類`.
- Category panels: regions named `支出分類` and `收入分類`.
- Create action: button `新增分類`.
- Create/edit fields: labels `類型`, `分類名稱`, `顏色`, `Icon`.
- Color options: radio/button accessible names from palette labels, such as `藍`, `松綠`, `玫瑰`.
- Icon options: radio/button accessible names from icon labels, such as `住家`, `購物`, `通訊`.
- Reorder handle: button `排序 <分類名稱>`.
- Edit action: button `修改 <分類名稱>`.
- Archive action: button `封存 <分類名稱>`.
- New-record category picker: radiogroup `分類`.
- Record category media: accessible label equals category name while visible text is omitted.

## Responsive And Accessibility Requirements

- Desktop category management uses two side-by-side panels with internally scrollable lists.
- Narrow viewports stack panels and preserve independent list scrolling.
- The sort handle is the only draggable target.
- Drag sorting must have an implementation path for keyboard accessibility before hardening; if native drag remains pointer-only, Technical Design must add an accessible alternative.
- Color and icon choices expose names to assistive technology.
- Icon-only edit/archive/sort controls have accessible names.
- Record rows retain category meaning through an accessible label even though the visible category name is hidden.
- Dialog focus management follows the existing dialog behavior.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/unit | Category creation applies default color, default icon, and appended sort order when omitted. |
| Domain/unit | Category visual identity update rejects unsupported color and icon values. |
| Domain/unit | Reorder rejects non-admin actors, cross-type category IDs, archived category IDs, missing IDs, duplicate IDs, and other-household IDs. |
| Domain/unit | Active category listing returns only active categories in persisted sort order. |
| Server action/integration | Create/edit/reorder/archive persist category metadata and revalidate category management, record creation, dashboard, and reports. |
| Component/unit | `CategoryVisualMark` renders the selected Lucide-backed icon and color; `CategoryVisualLabel` supports horizontal and vertical orientation. |
| E2E | Admin create/edit/archive/reorder category visual identity; category panels; new-record order; record list icon-only category media; dashboard category color summary. |
| Regression | Non-admin category mutation attempts remain rejected. |
| Manual | Review desktop and mobile category management panel scrolling, drag behavior, dialog layout, and record-row vertical centering. |

## Technical Design Inputs

- Decide Prisma schema fields for category color, icon, and sort order, including defaults and migration backfill.
- Decide whether `sortOrder` is unique per `(householdId, type, status)` or only normalized transactionally for active categories.
- Decide server action boundaries for create, update visual identity, archive, and reorder.
- Decide the final icon registry and color palette module location.
- Decide whether category visual metadata is passed through reporting read models or resolved in view components from category metadata.
- Decide how to keep record-list category media accessible without visible category name.
- Decide keyboard-accessible reorder behavior.
- Decide test IDs/selectors only if accessible names are insufficient for drag operations.

## Accepted Risks

- The accepted cut uses temporary local state and name-based visual mapping. Final implementation must replace this with persisted category metadata.
- Native drag in the cut is pointer-first. This is acceptable for prototype review, but final behavior needs keyboard accessibility or an explicit accepted risk.
- Dashboard pie chart color integration remains out of this first slice; dashboard category summary rows are in scope.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - Confirm visible behavior matches the accepted cut: two panels, no archived management list, drag-handle-only reorder, simplified dialogs, icon-only record category media.
  - Confirm dashboard scope is category summary rows, not full pie chart integration.
  - Confirm keyboard reorder is a Technical Design requirement before hardening.
- must_check:
  - Acceptance criteria cover persistence, validation, ordering, management UI, record creation, record list, dashboard, and non-admin rejection.
  - E2E design names routes, fixtures, viewports, selectors, expected states, and accessibility checks.
  - Tests cover both UI behavior and server/domain invalid payloads.
- unresolved_blockers:
  - None for Feature Technical Design after review approval.
- next_step:
  - feature-technical-design
