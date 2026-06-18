---
id: technical-design-admin-only-category-management
stage: technical-design
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-only-category-management.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-only-category-management.md
  - .ai/prototype/admin-only-category-management.md
  - .ai/spec/admin-only-category-management.md
outputs:
  - feature_technical_design
  - implementation_boundaries
  - tdd_handoff
trace_links:
  route:
    - src/app/categories/page.tsx
    - src/app/categories/category-management-panel.tsx
  shell:
    - src/app/home-dashboard-layout.tsx
    - src/app/dashboard-route-frame.tsx
    - src/app/dashboard-navigation.ts
  auth:
    - src/modules/identity-access/authorization.ts
    - src/modules/identity-access/access-hints.ts
    - src/auth/server-current-member.ts
  category_domain:
    - src/modules/categorization/category-catalog.ts
  persistence:
    - prisma/schema.prisma
    - src/app/home-dashboard-data-source.ts
  tests:
    - src/modules/categorization/category-catalog.test.ts
    - src/modules/identity-access/authorization.test.ts
    - src/modules/identity-access/access-hints.test.ts
    - e2e/
reviewed_at: 2026-06-19
---

# Admin-Only Category Management Technical Design

## Decision

- gate: feature_technical_design
- decision: proceed
- implementation_handoff: TDD Implementation
- recommended_next_skill: implementation-cycle
- release_target: local_dev

## Scope

This design turns the accepted category management prototype into persisted behavior. It covers admin-only route access, sidebar visibility, server-side category mutations, active/archived category lifecycle, toast-driven modal UX, and E2E fixture support.

Out of scope:

- Production OAuth review, deployment, or analytics.
- Removing `MemberCapability.manage_categories` from Prisma. The capability remains for future delegated category management but must not authorize this MVP category workflow.
- A full layout rename/refactor. `HomeDashboardLayout` can receive small shell-extension props during this feature; a broader rename to `DashboardLayout` should be a later cleanup slice.

## Architecture Decisions

### ADR-1: Category Management Is Admin-Only Across Navigation, Route, And Commands

- Status: accepted
- Decision: `authorize(member, { type: "manage_categories" })` must allow only members with role `admin`.
- Rationale: Domain impact explicitly makes `manage_categories` capability dormant for this workflow.
- Consequences: Existing tests and E2E fixture assumptions that finance managers with `manage_categories` can manage categories must be updated.

### ADR-2: Use Server Actions For Category Mutations

- Status: accepted
- Decision: Create `src/app/category-actions.ts` with server actions for create, rename, and archive.
- Rationale: Existing ledger, reimbursement, and recurring flows use server actions, `getCurrentMemberFromHeaders`, Prisma, `revalidatePath`, and redirect/query feedback. Category management should follow the same boundary.
- Consequences: The client category panel becomes progressively-enhanced UI using `<form action={...}>`; it should not own persisted category state.

### ADR-3: CategoryCatalog Owns Validation, DB Command Adapter Owns Persistence

- Status: accepted
- Decision: Keep `src/modules/categorization/category-catalog.ts` as the pure domain policy module and add a persistence adapter such as `src/modules/categorization/category-command.ts`.
- Rationale: This matches `fund-ledger/ledger-record-command.ts`: load Prisma state, call pure domain function, persist result.
- Consequences: Unit tests cover domain rules; command-adapter tests cover Prisma write shape and historical reference counts when needed.

### ADR-4: Route Denial Uses Dashboard Denied State

- Status: accepted
- Decision: `/categories` should load dashboard context, then return a dashboard denied state for non-admin members instead of redirecting or returning not-found.
- Rationale: Behavior spec selected dashboard denied state; it keeps the user inside authenticated app chrome without exposing controls.
- Consequences: `DashboardRouteFrame` or a small denied-view helper can be reused. Hidden sidebar is not treated as authorization.

### ADR-5: Duplicate Name Rule Is Active-Only Within Type

- Status: accepted
- Decision: Create/rename reject duplicate names only among active categories of the same type. Archived categories may have the same name unless a future DB constraint changes this.
- Rationale: This is the behavior spec and current domain helper behavior.
- Consequences: Do not add a unique database index on `(householdId,type,name)` unless it accounts for active-only semantics.

## Module And File Plan

| Area | File(s) | Change |
|---|---|---|
| Authorization | `src/modules/identity-access/authorization.ts` | Change `manage_categories` to admin-only; return existing denial reason or introduce `admin_required` consistently. |
| Access hints | `src/modules/identity-access/access-hints.ts` | `canOpenCategories` and `canManageCategories` inherit admin-only authorization. |
| Category domain tests | `src/modules/categorization/category-catalog.test.ts` | Replace capability-manager success test with rejection test for non-admin with `manage_categories`. |
| Category DB adapter | `src/modules/categorization/category-command.ts` | New adapter to load household categories, invoke create/rename/archive, persist create/update, and optionally count category references. |
| Category actions | `src/app/category-actions.ts` | New server actions: `createCategoryAction`, `renameCategoryAction`, `archiveCategoryAction`. |
| Category route | `src/app/categories/page.tsx` | Remove local mutation-only assumptions; wire actions and server data into panel; keep non-production preview only for visual review if still useful. |
| Category panel | `src/app/categories/category-management-panel.tsx` | Keep shadcn Tabs, Item rows, Dialogs, desktop header/mobile footer create trigger; convert mutations to forms/server action feedback. |
| Dashboard shell | `src/app/home-dashboard-layout.tsx`, `src/app/dashboard-route-frame.tsx` | Keep current `headerDescription`, `headerActions`, `mobileFooterActions`, `showCreateRecordActions`; defer rename. |
| E2E fixtures | `src/auth/server-current-member.ts`, `e2e/setup-db.sh`, `e2e/fixtures.ts` | Support admin, finance manager, and general member fixtures rather than a single hard-coded finance-manager header. |
| E2E spec | `e2e/admin-category-management.spec.ts` | Add scenarios from behavior spec. |

## Server Action Contract

### Form Fields

Create category:

- `type`: `income | expense`
- `name`: string
- `returnTo`: sanitized path, default `/categories`

Rename category:

- `categoryId`: string
- `name`: string
- `returnTo`: sanitized path, default `/categories`

Archive category:

- `categoryId`: string
- `returnTo`: sanitized path, default `/categories`

### Result Delivery

Use redirect query feedback consistent with existing server actions:

- success: `/categories?categoryResult=created|renamed|archived`
- errors: `/categories?categoryResult=<reason>&categoryAction=create|rename|archive`

The page should render a small client toast helper, for example `CategoryToast`, that reads `categoryResult`, emits `toast.success` or `toast.error`, and removes category-related query params with `history.replaceState`. Modal opening must not depend on URL for normal button clicks.

Expected reasons:

- `permission_denied`
- `invalid_name`
- `category_not_found`
- `archived_category`
- `duplicate_active_category_name`
- `unknown_error` only for unexpected persistence failures

## Persistence Design

Use existing `Category` schema:

- `id`
- `householdId`
- `type`
- `name`
- `status`
- timestamps

No migration is required for the selected behavior.

Adapter behavior:

1. Resolve household id. For MVP local_dev, use the existing default household id pattern (`household-demo`) unless a shared household resolver already exists in implementation context.
2. Load all categories for the household with `id`, `type`, `name`, `status`.
3. Call `createCategory`, `renameCategory`, or `archiveCategory`.
4. On success:
   - create: `prisma.category.create({ data: { id, householdId, type, name, status } })`
   - rename: `prisma.category.update({ where: { id }, data: { name } })`
   - archive: `prisma.category.update({ where: { id }, data: { status: "archived" } })`
5. Revalidate `/`, `/categories`, and the sanitized `returnTo`. Record creation forms already consume dashboard categories, so `/` revalidation covers the default create modal path.

Historical reference count:

- Archive confirmation needs a count of current historical references.
- For implementation, count all `ledgerRecord` rows for the household with `categoryId`, not just current month records.
- Expose this count in the category page read model or a category-specific read helper.

## Frontend State Ownership

Server-owned:

- Category list, status, names, historical reference count.
- Authorization and route access.

Client-owned:

- Which tab is selected.
- Whether create/rename/archive dialog is open.
- Form draft values before submit.
- Toast display after redirect or client-side preview actions.

Do not keep a separate client-side category array for persisted mode. After server action success, rely on revalidation and redirect to reload canonical server data.

## UI And Component Design

- Keep `TabsList variant="line"` for active/archived status.
- Keep `Item` for `CategoryItem`; row action icons stay on the right at all viewport widths.
- Use `Dialog` for create, rename, and archive confirmation.
- Create action placement remains:
  - desktop: header action
  - mobile: fixed footer action
- Do not show page-level `Alert` for create/rename/archive feedback. Use `sonner` toast.
- Keep `新增收入` and `新增支出` hidden on `/categories`.
- Archive confirmation modal displays the full historical reference count and explains that existing records keep their category.
- Empty archived group uses centered `尚無封存分類`.

## Auth And Route Guard Design

Route access:

1. `/categories` calls `loadDashboardPageContext`.
2. If dashboard context is blocked, render existing `DashboardAccessScreen`.
3. If context is ready but profile roles do not include `admin`, render dashboard denied state for category management.
4. If admin, render category management.

Navigation:

- `getVisibleDashboardNavigationItems` should rely on `accessHints.navigation.canOpenCategories`.
- Since authorization changes to admin-only, non-admins lose the sidebar entry automatically.

Mutation:

- Every server action resolves current member from headers and calls the domain command adapter.
- Non-admin direct form submissions are rejected server-side and never persist.

E2E current-member support:

- The current `x-e2e-current-member-email` override returns a hard-coded finance manager with `manage_categories`. Replace or extend it so E2E can select seeded users by controlled auth user id or email.
- Do not expose this behavior in production; preserve existing `NODE_ENV !== "production"` guard.

## Test Mapping

### Unit

- `authorization.test.ts`: `manage_categories` allows admin; rejects finance manager; rejects general member; rejects capability-only member.
- `access-hints.test.ts`: admin can open categories; finance manager and general member cannot.
- `category-catalog.test.ts`: capability-only manager is rejected; admin create/rename/archive still pass; duplicate active name behavior remains.
- `category-command.test.ts`: adapter persists create/update/archive and returns domain errors without writing on rejection.

### Integration / Route

- Category server action tests should cover:
  - admin create persists and redirects success
  - duplicate active name redirects error
  - finance manager create redirects permission denied
  - archive persists `archived`

Use focused tests where existing test harness supports server action units; if server action test ergonomics are poor, prioritize domain/adapter unit tests plus E2E.

### E2E

- `admin-category-management.spec.ts`:
  - admin can see sidebar category entry and page controls
  - finance manager and general member cannot see sidebar entry and direct route is denied
  - admin creates category; URL does not change when opening modal
  - duplicate name shows error toast
  - admin renames active category
  - admin archives with confirmation and sees toast
  - archived category is absent from new record category choices
  - mobile footer contains `新增分類` and row actions remain right-aligned

Run targeted E2E after unit/lint/type-check:

```bash
pnpm test:e2e -- e2e/admin-category-management.spec.ts
```

## Implementation Order

1. Update authorization and access-hints tests to fail for admin-only category management.
2. Update `authorize` behavior and category catalog tests.
3. Add category command adapter and tests.
4. Add category server actions and form parsing.
5. Convert category panel from local mutation state to action-backed forms and toast redirect feedback.
6. Add route-level non-admin denied state.
7. Update E2E fixture support for admin/finance/general roles.
8. Add targeted E2E spec.
9. Run local quality gates sequentially: `pnpm type-check`, `pnpm lint`, `pnpm test`, targeted E2E.

## Release Target Implications

- No Prisma migration is required.
- Local seed/E2E data must include admin, finance manager, and general member roles plus active/archived categories.
- Production-specific OAuth and deployment readiness remain outside this feature gate.
- Verification must record that `manage_categories` capability remains in schema but is intentionally dormant for category management.

## Risks And Open Decisions

- `HomeDashboardLayout` naming is now too narrow. This feature may keep the current name to reduce blast radius, but a follow-up cleanup should rename or split it into a dashboard shell.
- Server action redirect feedback can open URLs with `categoryResult`; the normal create modal trigger must remain URL-neutral.
- Existing tests and fixtures currently assume category capability can manage categories; implementation must update those assumptions intentionally.
- Historical reference count should use all ledger records, not only the currently selected month; otherwise archive confirmation can mislead admins.
- Focus restoration after successful server actions may need pragmatic handling. Minimum: dialog closes through redirect and toast appears; ideal: focus lands near the affected tab/list.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm server actions are preferred over API routes.
  - Confirm `manage_categories` capability is dormant but retained in schema.
  - Confirm no Prisma migration is needed.
  - Confirm layout rename is deferred.
- must_check:
  - Design covers authorization, route guard, navigation, persistence, UI state, tests, E2E fixtures, and release implications.
  - Implementation order starts tests-first.
  - No prototype-only client state remains as source of truth for persisted behavior.
- unresolved_blockers:
  - None for TDD Implementation.
- next_step:
  - implementation-cycle
