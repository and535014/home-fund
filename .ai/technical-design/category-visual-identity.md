---
id: technical-design-category-visual-identity
stage: feature-technical-design
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-visual-identity.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/category-visual-identity.md
  - .ai/prototype/category-visual-identity.md
  - .ai/spec/category-visual-identity.md
outputs:
  - feature_technical_design
  - implementation_boundaries
  - persistence_contract
  - tdd_handoff
trace_links:
  routes:
    - src/app/(app)/settings/categories/page.tsx
    - src/app/(app)/page.tsx
  components:
    - src/app/(app)/settings/categories/category-management-panel.tsx
    - src/app/category-visuals.tsx
    - src/app/record-entry-panel.tsx
    - src/app/record-category-label.tsx
    - src/app/record-list-detail.tsx
  domain:
    - src/modules/categorization/category-catalog.ts
    - src/modules/categorization/category-command.ts
    - src/modules/reporting/monthly-report.ts
  persistence:
    - prisma/schema.prisma
    - prisma/seed.ts
    - src/app/category-actions.ts
    - src/app/category-management-context.ts
    - src/app/home-dashboard-data-source.ts
  tests:
    - src/modules/categorization/category-catalog.test.ts
    - src/modules/categorization/category-command.test.ts
    - src/modules/reporting/monthly-report.test.ts
    - src/app/home-dashboard-data-source.test.ts
    - e2e/admin-category-management.spec.ts
    - e2e/create-record.spec.ts
    - e2e/dashboard.spec.ts
reviewed_at: 2026-06-20
---

# Category Visual Identity And Ordering Technical Design

## Design Decision

- decision: persist_visual_identity_on_category
- implementation_handoff: TDD Implementation
- recommended_next_skill: tdd-implementation
- release_target: local_dev
- reason: Category color, icon, and order are durable category attributes that affect category management, new-record category selection, historical records, and dashboard reporting. They should live on the Category aggregate and flow through read models rather than remain UI-only fixture state.

## Scope

This design hardens the accepted production-stack cut into persistent behavior:

- Persist category color, icon, and sort order.
- Validate color and icon through controlled registries.
- Create/update/archive/reorder categories through server actions and Categorization domain commands.
- Display active expense and income categories in two management panels, with drag-handle-only sorting.
- Feed persisted visual identity and order into new-record category choices, record list media, record detail text, and dashboard summaries.

Out of scope:

- Arbitrary uploaded icons, remote images, or free-form colors.
- Multi-household sorting optimizations beyond preserving the existing `householdId` boundary.
- Production release readiness. This gate targets `local_dev`; production migration, rollback, observability, and smoke plans belong to Target-Aware Release.

## Architecture Decisions

### ADR-1: Store Visual Identity On Category

- Status: accepted
- Decision: Add `color`, `icon`, and `sortOrder` columns to `Category`.
- Rationale: The domain impact says visual identity and ordering belong to Categorization and should not be copied onto ledger records.
- Consequences: Ledger/reporting read models must join or carry category metadata for display. Historical records retain updated category identity because they reference the category, not a copied snapshot.

### ADR-2: Persist Color And Icon As Controlled Keys

- Status: accepted
- Decision: Store color and icon as string keys validated by the app, not raw component names or arbitrary CSS values.
- Rationale: Keys are stable across UI refactors, safer to validate, and keep the Lucide registry server-safe.
- Consequences: UI resolves keys to swatch CSS and Lucide components. Invalid keys are rejected at the server/domain boundary.

### ADR-3: Reorder Uses A Full Active-ID List Per Type

- Status: accepted
- Decision: `reorderCategories` accepts `type` plus the complete ordered active category ID list for that type.
- Rationale: A full list is easy to validate for missing, duplicate, archived, cross-type, or foreign-household IDs before writing.
- Consequences: Drag UI computes the full list after drop. Server writes normalized `sortOrder` values transactionally for the target type only.

### ADR-4: Server Data Is Canonical, Client Reorder May Be Optimistic

- Status: accepted
- Decision: Category management receives canonical server categories. Drag reorder can update local order immediately, then call the server action and roll back or refresh on failure.
- Rationale: The user expects drag feedback to be instant, but persisted order must remain server-owned.
- Consequences: The client component may keep a transient ordered list, but create/update/archive success should refresh from server data.

### ADR-5: Keep Presentational Visual Components Separate From Domain Registries

- Status: accepted
- Decision: Put serializable palette/icon keys and validators in the Categorization module, and keep Lucide React component mapping in `src/app/category-visuals.tsx`.
- Rationale: Domain code should not import React or `lucide-react`.
- Consequences: Shared types such as `CategoryColorKey` and `CategoryIconKey` can be exported from a non-React module, while UI components render marks/labels.

## Persistence Design

Update `prisma/schema.prisma`:

```prisma
model Category {
  id          String         @id @default(cuid())
  householdId String
  type        CategoryType
  name        String
  color       String         @default("gold")
  icon        String         @default("tags")
  sortOrder   Int            @default(0)
  status      CategoryStatus @default(active)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  household      Household       @relation(fields: [householdId], references: [id], onDelete: Restrict)
  ledgerRecords  LedgerRecord[]
  recurringRules RecurringRule[]

  @@index([householdId, type, name])
  @@index([householdId, type, status])
  @@index([householdId, type, status, sortOrder])
}
```

Migration/backfill:

- Existing categories receive deterministic visual defaults from the controlled registry.
- Existing active categories are ordered per `(householdId, type)` by current name, then assigned `sortOrder` values `10, 20, 30...`.
- Existing archived categories keep visual defaults and receive sort values after active categories. They are not used for active ordering.
- Do not add a database uniqueness constraint on `sortOrder`; the domain transaction normalizes order and avoids migration friction. A future hardening slice can add a partial unique index if needed.

## Registry And Validation

Add a server-safe module, for example `src/modules/categorization/category-visual-options.ts`:

- `CATEGORY_COLOR_OPTIONS`: serializable keys and labels, with CSS values for UI use if kept free of React.
- `CATEGORY_ICON_OPTIONS`: serializable keys and labels only.
- `DEFAULT_CATEGORY_COLOR = "gold"`.
- `DEFAULT_CATEGORY_ICON = "tags"`.
- `isCategoryColorKey(value)`.
- `isCategoryIconKey(value)`.
- `deriveDefaultCategoryVisual(seed)`: deterministic fallback for migration and backend create paths.

Persisted values:

- `color`: one of `teal | blue | violet | rose | gold | lime`.
- `icon`: one of the controlled Lucide-backed icon keys, including `tags` fallback.

The existing `src/app/category-visuals.tsx` becomes a React rendering adapter:

- Imports the serializable options/types.
- Maps `icon` keys to Lucide components.
- Exports `CategoryVisualMark` and `CategoryVisualLabel`.
- Stops deriving fake visuals by category name once persisted data is available.

## Domain Contract

Extend `Category`:

```ts
export type Category = {
  id: string;
  type: LedgerRecordType;
  name: string;
  color: CategoryColorKey;
  icon: CategoryIconKey;
  sortOrder: number;
  status: "active" | "archived";
};
```

Commands:

- `CreateCategoryCommand`: `{ type, name, color?, icon? }`
- `UpdateCategoryCommand`: `{ categoryId, name, color, icon }`
- `ArchiveCategoryCommand`: unchanged
- `ReorderCategoriesCommand`: `{ type, orderedCategoryIds }`

Domain results add failure reasons:

- `invalid_color`
- `invalid_icon`
- `invalid_order`

Domain behavior:

- `createCategory` validates name, color, icon, duplicate active name, and permission.
- If color/icon are omitted, deterministic defaults are applied.
- New active category appends to the end of the active order for its type with `max(sortOrder) + 10`.
- `updateCategory` replaces `renameCategory` for the UI path and updates name/color/icon together.
- `renameCategory` can remain as a compatibility wrapper around `updateCategory` if existing tests or callers need a smaller transition.
- `archiveCategory` preserves color/icon/sortOrder and only changes status.
- `listAvailableCategories` returns only active categories sorted by `sortOrder`, then `name`.
- `reorderCategories` verifies the submitted IDs exactly match active categories for the actor household and type, with no duplicates or missing IDs.

## Database Command Adapter

Update `src/modules/categorization/category-command.ts`:

- Load `id`, `type`, `name`, `color`, `icon`, `sortOrder`, and `status`.
- Create writes all Category fields plus `householdId`.
- Update writes `name`, `color`, and `icon`.
- Archive writes only `status`.
- Reorder uses a Prisma transaction:
  1. Load all household categories for the target type.
  2. Call pure `reorderCategories`.
  3. Update each active category with normalized sort orders `(index + 1) * 10`.

The command adapter remains the only persistence layer for category mutations. UI code does not write Prisma directly.

## Server Actions

Update `src/app/category-actions.ts`:

- `createCategoryAction` reads `type`, `name`, `color`, and `icon`.
- Add `updateCategoryAction` for `categoryId`, `name`, `color`, and `icon`.
- Keep or migrate away from `renameCategoryAction`; the UI should call `updateCategoryAction`.
- `archiveCategoryAction` remains, but the management page no longer displays archived categories.
- Add `reorderCategoriesAction` reading:
  - `type`: `income | expense`
  - repeated `categoryIds` FormData values in desired order.

Action states:

- Create success payload returns `categoryId`, `name`, `type`, `color`, `icon`, `sortOrder`.
- Update success payload returns `categoryId`, `name`, `color`, `icon`.
- Reorder success payload returns `type` and `categoryIds`.

Error codes:

- Existing: `permission_denied`, `invalid_name`, `category_not_found`, `archived_category`, `duplicate_active_category_name`, `unknown_error`.
- New: `invalid_color`, `invalid_icon`, `invalid_order`.

Revalidation:

- `revalidatePath("/")`
- `revalidatePath("/settings/categories")`

## Read Models And Query Ordering

`src/app/category-management-context.ts`:

- Select visual fields and `sortOrder`.
- Filter management display to active categories in the page component or loader.
- Order by `type asc`, `sortOrder asc`, `name asc`.
- Keep reference counts available for active archive confirmation.

`src/app/home-dashboard-data-source.ts`:

- Select visual fields and `sortOrder`.
- Order categories by `type asc`, `sortOrder asc`, `name asc`.
- Map Prisma categories into the extended domain `Category`.

`src/modules/reporting/monthly-report.ts`:

- Add category visual fields to `MonthlyCategorySummary`:
  - `categoryColor`
  - `categoryIcon`
  - `categorySortOrder`
- Sort summaries by type, then `categorySortOrder`, then `categoryName`.
- Use deterministic fallback values only if a category is missing, such as deleted fixture gaps or migration issues.

## UI State And Rendering

Category management page:

- Keep the accepted two-panel layout for `支出` and `收入`.
- Panels display active categories only.
- Panels have title, fixed gap, fill available height, and internally scrollable list content.
- Empty panel state stays inside the panel list area.
- No archived tab/list appears on this page.

Create/edit dialogs:

- No descriptive copy or preview block.
- Type and name are equal-width fields on desktop and stacked on narrow viewports.
- Color and icon sections are side by side on desktop and use normal flex wrapping for options.
- Edit dialog updates active category name, color, and icon together.

Sorting:

- Only the grip/sort handle starts pointer drag.
- Row body, category name, edit button, and archive button are not draggable.
- Handle accessible name is `排序 <分類名稱>`.
- Keyboard path: while the handle button is focused, `ArrowUp` and `ArrowDown` move the category within the same panel and submit the same reorder action. This avoids visible up/down buttons while keeping a keyboard-accessible reorder path.

New record:

- Category choices use active categories sorted by persisted order.
- Each choice shows `CategoryVisualMark` plus the category name.
- Category order changes after refresh or revalidation.

Record list/detail:

- `RecordCategoryLabel` displays only `CategoryVisualMark`; visible category name is omitted.
- The component keeps an accessible label using the category name.
- The `ItemMedia` container remains vertically centered.
- Detail fields that ask for category value still show text category name.

Dashboard:

- Category summary labels use `CategoryVisualLabel`.
- Bars use the persisted category color key resolved to CSS.
- Missing category metadata falls back to controlled defaults, not arbitrary generated colors.

## Auth And Permission Boundary

- Route access remains admin-only through existing category management route loader.
- Server actions call `requireServerActionAccess({ type: "manage_categories" })`.
- Domain functions also call `authorize(actor, { type: "manage_categories" })`.
- Non-admin mutation attempts fail even if a client bypasses hidden UI controls.

## Error, Loading, And Empty Strategy

- Create/update/archive errors continue through action state and existing toast/form feedback patterns.
- Invalid color/icon errors attach to their fields where practical.
- Invalid reorder shows a short failure toast and refreshes or rolls back to server order.
- Empty active category panel text is the only empty state on `/settings/categories`.
- No loading skeleton is needed for the server-rendered category page. Reorder can disable the active handle while pending.

## Test Mapping

Unit/domain:

- `category-catalog.test.ts`
  - create applies defaults when color/icon omitted.
  - create rejects invalid color/icon.
  - create appends to the end of the selected active type.
  - update changes name/color/icon and rejects archived categories.
  - reorder rejects cross-type, archived, duplicate, missing, and non-admin requests.
  - `listAvailableCategories` returns active categories in persisted order.

Persistence adapter:

- `category-command.test.ts`
  - create selects/writes visual fields and appended `sortOrder`.
  - update writes only name/color/icon.
  - archive preserves visual fields.
  - reorder uses a transaction and writes normalized order for the target type only.

Reporting/data source:

- `home-dashboard-data-source.test.ts`
  - category query selects visual fields and orders by `sortOrder`.
- `monthly-report.test.ts`
  - category summaries carry visual fields and sort by type/order/name.

E2E:

- `e2e/admin-category-management.spec.ts`
  - two active panels, no archived tab/list.
  - create with color/icon.
  - edit name/color/icon with no descriptive copy or preview.
  - drag handle changes order; row body/action buttons do not.
  - keyboard handle ArrowUp/ArrowDown changes order.
  - archived category hidden from management.
- `e2e/create-record.spec.ts`
  - new-record category choices show visual marks and persisted order.
  - archived category absent.
- `e2e/dashboard.spec.ts`
  - dashboard category summary uses visual label and category color.
  - record list category media shows only mark with accessible name.

## Implementation Order For TDD

1. Add failing domain tests for visual defaults, validation, and ordering.
2. Add Prisma schema migration and seed updates.
3. Extend domain types/options and pure Categorization commands.
4. Extend command adapter tests and persistence adapter.
5. Extend server action contracts and action-state error mapping.
6. Replace fake visual derivation in UI with persisted fields.
7. Wire drag-handle pointer and keyboard reorder to `reorderCategoriesAction`.
8. Update dashboard/reporting/read-model tests and UI rendering.
9. Run focused unit tests, type-check, lint, and relevant Playwright specs.

## Release Target Implications

- Target remains `local_dev`.
- Target-Aware Release must include migration evidence because Prisma schema changes are required.
- Seed data must include stable color/icon/order values for local and E2E fixtures.
- Production readiness is not assessed in this gate.

## Open Risks

- Drag-and-drop implementation details may need a small library if native drag proves unreliable for Playwright and keyboard behavior. Prefer a lightweight, accessible implementation only if native events become brittle.
- Existing local generated Prisma client may need regeneration after migration.
- Dashboard chart colors must remain legible against current UI tokens; this should be verified in the implementation/verification gates.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - confirm storing `color` and `icon` as controlled keys instead of raw hex/component values
  - confirm full-list reorder action shape
  - confirm keyboard reorder through focused drag handle with ArrowUp/ArrowDown
  - confirm dashboard summary read model should carry visual fields
- acceptance_signals:
  - implementation can start with tests against clear domain and persistence contracts
  - migration/backfill behavior is deterministic
  - UI has no remaining fake visual source after implementation
- unresolved_blockers:
  - None for TDD Implementation after approval.
- recommended_next_gate:
  - tdd-implementation
- stop_condition: Wait for explicit user approval before implementation or committing this technical design.
