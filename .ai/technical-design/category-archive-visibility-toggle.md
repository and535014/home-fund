---
id: technical-design-category-archive-visibility-toggle
stage: feature-technical-design
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-archive-visibility-toggle.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/category-archive-visibility-toggle.md
  - .ai/prototype/category-archive-visibility-toggle.md
  - .ai/spec/category-archive-visibility-toggle.md
  - .ai/archive/archive-category-visual-identity-2026-06-21.md
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
    - src/app/(app)/settings/categories/category-management-ui.tsx
    - src/components/ui/switch.tsx
    - src/components/ui/item.tsx
    - src/app/record-entry-panel.tsx
  domain:
    - src/modules/categorization/category-catalog.ts
    - src/modules/categorization/category-command.ts
  persistence:
    - prisma/schema.prisma
    - prisma/seed.sql
    - prisma/seed.e2e.sql
    - src/app/category-actions.ts
    - src/app/category-management-context.ts
  tests:
    - src/modules/categorization/category-catalog.test.ts
    - src/modules/categorization/category-command.test.ts
    - e2e/admin-category-management.spec.ts
reviewed_at: 2026-06-26
---

# Category Archive Visibility Toggle Technical Design

## Design Decision

- decision: add_admin_only_category_unarchive_flow
- implementation_handoff: TDD Implementation
- recommended_next_skill: tdd-implementation
- release_target: local_dev
- reason: The accepted behavior requires a persisted archived-to-active transition, active-first archived review display, and server-side admin authorization. The existing category command boundary already owns category lifecycle mutations, so unarchive should extend that boundary rather than adding UI-only Prisma writes.

## Scope

This design turns the accepted prototype and Behavior Spec into implementation boundaries:

- Persist `取消封存` as an admin-only category lifecycle command.
- Show/hide archived categories through page-local UI state on `/settings/categories`.
- Display archived categories below active categories within the existing `支出分類` and `收入分類` panels.
- Keep archived rows restore-only: no edit, archive, or reorder controls.
- Append restored categories to the bottom of active order for the same household/type.
- Reject duplicate active names and non-admin restore attempts server-side.
- Keep new-record category choices active-only until a category is restored.

Out of scope:

- Persisting the `顯示封存分類` switch as a user preference.
- Editing archived categories before restore.
- Bulk restore/archive.
- Database schema changes; existing `Category.status` and `sortOrder` are sufficient.
- Production release readiness. This gate targets `local_dev`.

## Architecture Decisions

### ADR-1: Unarchive Belongs To CategoryCatalog

- Status: accepted
- Decision: Add `UnarchiveCategoryCommand` and `unarchiveCategory` to `src/modules/categorization/category-catalog.ts`.
- Rationale: Restoring a category changes the durable category lifecycle and active order, so it belongs beside create/update/archive/reorder domain logic.
- Consequences: UI, server actions, and database adapter call the domain command; no component mutates persisted category status directly.

### ADR-2: Restored Categories Append To Active Order

- Status: accepted
- Decision: A restored category receives `nextSortOrder(categories, category.type)`, equivalent to `max(active sortOrder for type) + 10`.
- Rationale: Append behavior is predictable, avoids inserting restored categories into stale historical positions, and matches existing new-category behavior.
- Consequences: Admins can reorder after restore if they want a different active order.

### ADR-3: Duplicate Active Names Block Restore

- Status: accepted
- Decision: `unarchiveCategory` rejects restore when another active category in the same household/type has the same normalized name.
- Rationale: Silent rename or duplicate active language would make new-record category choices ambiguous.
- Consequences: The UI reports actionable copy and leaves the category archived.

### ADR-4: Already Active Is Invalid State

- Status: accepted
- Decision: Add `invalid_state` to category action/domain errors for commands whose target category is found but not in the required lifecycle state.
- Rationale: Already-active unarchive is not `category_not_found` and not an archived-category edit failure; a distinct reason makes tests and user copy clearer.
- Consequences: `CategoryActionCode` and error mapping need a new value. Technical implementation can use the same generic copy if no state-specific message is needed elsewhere.

### ADR-5: Category Management Loads All Categories

- Status: accepted
- Decision: Keep `loadCategoryManagementContext` loading active and archived categories; filter visibility client-side.
- Rationale: The prototype already uses canonical route data and the category page is admin-only. Loading both states lets the switch reveal archived rows without extra requests.
- Consequences: New-record forms remain protected separately because they use active-category selectors in record-entry data paths.

## Domain Contract

Update `src/modules/categorization/category-catalog.ts`:

```ts
export type UnarchiveCategoryCommand = {
  categoryId: string;
};
```

Extend success events:

```ts
events: ("Category created" | "Category updated" | "Category unarchived")[];
```

Extend failure reasons:

```ts
| "invalid_state"
```

Add behavior:

- Authorize with existing `canManageCategories(actor)`.
- Find category by `categoryId`.
- If missing, return `category_not_found`.
- If target category is already active, return `invalid_state`.
- If another active category in the same type has the same normalized name, return `duplicate_active_category_name`.
- Return category with `status: "active"` and `sortOrder: nextSortOrder(context.categories, category.type)`.
- Emit `Category unarchived`.

Do not change:

- `listAvailableCategories` continues returning only active categories.
- `updateCategory` continues rejecting archived categories.
- `reorderCategories` continues validating against active categories only.

## Database Command Adapter

Update `src/modules/categorization/category-command.ts`:

- Import `unarchiveCategory` and `UnarchiveCategoryCommand`.
- Add `unarchiveCategoryInDatabase(actor, command, context)`.
- Use the same `DEFAULT_HOUSEHOLD_ID` fallback and `loadCategories` helper.
- Run inside transaction when `context.prisma.$transaction` exists.
- Load all categories for the household inside the transaction.
- Call `unarchiveCategory(actor, command, { categories })`.
- If failure, return result without mutation.
- If success, update the target category:
  - `status: "active"`
  - `sortOrder: result.category.sortOrder`
- Return domain result.

The existing `CategoryCommandPrismaClient.category.update` type already allows `status` and `sortOrder`, so no new Prisma client surface is required.

## Server Action Contract

Update `src/app/category-actions.ts`:

- Import `unarchiveCategoryInDatabase`.
- Extend `CategoryActionCode` with `invalid_state`.
- Add:

```ts
export type UnarchiveCategoryActionField = "categoryId";
export type UnarchiveCategoryActionState = ActionState<
  { categoryId: string; sortOrder: number },
  UnarchiveCategoryActionField,
  CategoryActionCode
>;
```

- Add `unarchiveCategoryAction(previousState, formData)`.
- Read `categoryId`.
- If missing, return `category_not_found`.
- Require `requireServerActionAccess({ type: "manage_categories" })`.
- Call `unarchiveCategoryInDatabase(session.access.member, { categoryId }, { prisma: getPrismaClient() })`.
- Map domain errors through `categoryError`.
- On success call `revalidateCategoryPaths()`.
- Return success message `分類已取消封存` with `categoryId` and `sortOrder`.

Error copy:

- `invalid_state`: `這個分類目前不是封存狀態。`
- Existing `duplicate_active_category_name`: `同類型已有啟用中的相同分類名稱。`
- Existing `permission_denied`: `只有管理者可以管理分類。`

## Frontend State And UI

Update `src/app/(app)/settings/categories/category-management-panel.tsx`:

- Keep `showArchivedCategories` as local `useState(false)`.
- Keep active and archived categories separate before combining:
  - `activeCategories = displayedCategories.filter(status === "active").sort(compareCategoryVisualOrder)`
  - `archivedCategories = displayedCategories.filter(status === "archived").sort(compareCategoryVisualOrder)`
  - `visibleCategories = showArchivedCategories ? [...activeCategories, ...archivedCategories] : activeCategories`
- Replace local-only `unarchiveCategory` with an action-backed transition:
  - Build `FormData` with `categoryId`.
  - Call `unarchiveCategoryAction(initialActionState(), formData)`.
  - On success update local category `status` to `active` and `sortOrder` to `result.data.sortOrder`.
  - Show toast from result, defaulting to `分類已取消封存`.
  - On error show mapped message.
- Do not close or reset `showArchivedCategories`; once the row becomes active it naturally moves above archived rows.

Update `src/app/(app)/settings/categories/category-management-ui.tsx`:

- Keep `CategoryArchiveVisibilitySwitch` implemented with `Item` and `Switch`.
- Keep archived rows using `ItemMedia variant="icon"` with `Archive` icon and tooltip/accessibility label `已封存`.
- Keep restore as icon-only `Button size="icon-sm"` with `RotateCcw`, tooltip `取消封存`, and `aria-label="取消封存 <name>"`.
- Keep archived row branch before active row reorder logic so archived rows never receive drag handles or mobile move buttons.

Update `src/components/ui/item.tsx`:

- Keep `ItemMedia variant="icon"` using project tokens:
  - `rounded-input`
  - `border-border`
  - `bg-card`
  - `text-muted-foreground`

## Read Model And Fixture Strategy

`src/app/category-management-context.ts`:

- No structural change required. It already loads all categories and maps color/icon/status.
- Optionally adjust `orderBy` in Technical Implementation if needed to make archived display deterministic; UI sorting remains canonical for active-first display.

Seeds:

- Add at least one archived expense category and one archived income category to `prisma/seed.sql` and `prisma/seed.e2e.sql`.
- Use distinct names with no active conflict by default, such as `停用餐飲` or `舊收入`.
- Prefer adding at least one historical ledger reference only if existing fixtures can do so without expanding this slice; otherwise cover historical readability through existing archived-category behavior from prior specs.

New-record choices:

- No change should be needed. `record-entry-panel.tsx` filters active categories by type.
- E2E must confirm archived-visible categories do not appear in new-record choices before restore, and restored categories do appear after restore/revalidation.

## Auth And Permission Boundary

- Route access remains enforced by `loadCategoryManagementContext` and `requireAppRouteAccess("categories")`.
- Mutation access remains enforced by `requireServerActionAccess({ type: "manage_categories" })`.
- Domain command still calls `authorize(actor, { type: "manage_categories" })`.
- Non-admin tests must cover direct server action/domain access; hiding UI controls is not sufficient.

## Error, Loading, Empty Strategy

- Pending state uses existing `isPending` transition state in `CategoryManagementPanel`.
- Restore action button should be disabled while pending through the existing `pending` prop if needed in implementation.
- Empty archived state remains `目前沒有封存分類。` when switch is on and no archived categories exist.
- Duplicate restore conflict shows existing duplicate active-name copy.
- Invalid lifecycle state shows `這個分類目前不是封存狀態。`

## Test Mapping

Domain/unit:

- `unarchiveCategory` rejects non-admin actors.
- `unarchiveCategory` rejects missing category IDs.
- `unarchiveCategory` rejects already-active categories with `invalid_state`.
- `unarchiveCategory` rejects duplicate active names in same type.
- `unarchiveCategory` returns active status and appended sort order.
- `listAvailableCategories` remains active-only.

Database adapter:

- `unarchiveCategoryInDatabase` updates `status` and `sortOrder`.
- It uses a transaction when available.
- It does not mutate on duplicate-name or permission failure.

Server action:

- Missing category ID maps to `category_not_found`.
- Success returns `分類已取消封存`, `categoryId`, and `sortOrder`.
- `invalid_state`, duplicate, permission, and not-found errors map to expected Traditional Chinese messages.

Component/browser:

- `e2e/admin-category-management.spec.ts` should cover:
  - switch hidden-by-default
  - switch reveal/hide
  - archived row has `已封存` media and `取消封存` icon button
  - archived row lacks edit/archive/reorder actions
  - unarchive success and new-record category availability
- Existing category archive E2E should be adjusted if seed fixtures include initially archived categories, making sure old expectation "archived category hidden from management" becomes "hidden when switch is off".

Manual:

- Desktop alignment: archived icon media aligns with active drag handle column.
- Mobile: switch, archived status icon, category label, and restore icon button do not overlap.

## Implementation Order For TDD

1. Add failing domain tests for `unarchiveCategory`.
2. Implement pure domain command and error reason.
3. Add failing database adapter tests for `unarchiveCategoryInDatabase`.
4. Implement adapter transaction/update.
5. Add failing server action tests or focused integration coverage for `unarchiveCategoryAction`.
6. Implement server action and error mapping.
7. Add/update E2E fixture data with archived categories.
8. Update category management panel to call server action instead of local-only restore.
9. Update E2E scenarios for visibility, action availability, restore, and new-record choices.
10. Run focused unit/action tests, focused category E2E, then broader quality checks.

## Release Target Implications

- `local_dev` readiness must include lint, type-check, relevant unit tests, and focused admin category E2E.
- No production migration is required if seed-only data changes are limited to local/E2E fixtures.
- Production readiness remains unclaimed until Target-Aware Release is run for production.

## Open Questions

- Whether E2E should add archived categories permanently to seed files or create/archive them in-test before reveal. Design preference: seed archived categories to make hidden-by-default and reveal tests deterministic.
- Whether already-active unarchive should be silently treated as success for idempotency. Design decision: reject with `invalid_state` for clearer command semantics.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - domain command and error reason choices
  - action contract and success payload
  - fixture strategy for archived categories
  - whether adapter transaction scope is sufficient
- must_check:
  - no site-wide foundation decisions are hidden in this feature design
  - server-side authorization remains explicit
  - new-record category choices stay active-only
  - tests map back to Behavior Spec scenarios
- acceptance_signals:
  - TDD Implementation can start with failing domain tests.
  - UI implementation can replace prototype local restore with server action without reopening UX decisions.
- unresolved_blockers:
  - None for TDD Implementation.
- recommended_next_gate:
  - tdd-implementation
- stop_condition: Wait for explicit user approval before TDD Implementation, Verification, Release, Learning, or Artifact Compression.
