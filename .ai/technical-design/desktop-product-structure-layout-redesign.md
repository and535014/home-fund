---
id: desktop-product-structure-layout-redesign
stage: feature-technical-design
status: accepted
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/desktop-product-structure-layout-redesign.md
  - .ai/prototype/desktop-product-structure-layout-redesign.md
  - .ai/spec/desktop-product-structure-layout-redesign.md
  - .ai/foundation-architecture/home-family-fund.md
  - commit:d8fb50a
outputs:
  - route_boundaries
  - component_boundaries
  - data_and_permission_ownership
  - tdd_mapping
trace_links:
  implementation_commit: d8fb50a
  primary_files:
    - src/app/(app)/layout.tsx
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-sidebar-nav.tsx
    - src/components/layout/page-layout.tsx
    - src/app/(app)/page.tsx
    - src/app/dashboard-charts.tsx
    - src/app/month-switcher.tsx
    - src/app/month-picker-dialog.tsx
    - src/app/create-record-dialog.tsx
    - src/app/record-entry-panel.tsx
    - src/app/(app)/settings/layout.tsx
    - src/app/(app)/settings/settings-sidebar-nav.tsx
reviewed_at: 2026-06-20
---

# Desktop Product Structure Layout Redesign Technical Design

## Design Decision

- decision: proceed_with_existing_next_app_router_foundation
- reason: The accepted prototype already uses the repository's Next.js App Router, server components, client component islands, local shadcn-style UI components, Tailwind tokens, Prisma loaders, and Vitest/Playwright foundation.
- no foundation reset required: No new framework, app shell library, auth provider, or test runner is needed.
- implementation posture: The committed prototype is treated as the first production-stack implementation slice. TDD Implementation should harden and fill coverage gaps rather than reimplementing the layout from scratch.

## Route Boundaries

| Route | Owner | Behavior |
|---|---|---|
| `src/app/(app)/layout.tsx` | Authenticated app shell | Loads authenticated member context, computes visible top-level navigation, mounts `AuthenticatedLayout`, and provides record-create scope. |
| `/` via `src/app/(app)/page.tsx` | Overview dashboard | Owns dashboard region composition, selected-month data mapping, chart data shaping, records table, and month switcher placement. |
| `/search` | Search placeholder | Renders `PageLayout` + `PageHeader` + shared placeholder structure only. No search state or API contract in this slice. |
| `/reimbursements` | Reimbursement placeholder | Keeps server-side reimbursement permission check, then renders the same placeholder structure as search. No settlement UI/action contract in this slice. |
| `/settings` | Redirect route | Redirects to `/settings/account`; no standalone content. |
| `/settings/account` | Account settings | Read-only account information in settings shell; no profile mutation contract. |
| `/settings/members` | Admin member management | Keeps existing admin-only loader and member management components, now nested under settings. |
| `/settings/categories` | Admin category management | Keeps existing admin-only loader and category components, now nested under settings. |

Removed app/module surface:

- `recurring-schedule` app/module/test code is removed from this product structure.
- The Prisma schema, migrations, generated client, and seed references remain unchanged in this slice. Dropping database objects requires a separate migration design.

## Component Boundaries

| Component | Responsibility |
|---|---|
| `AuthenticatedLayout` | Viewport-height shell, primary sidebar width, sidebar inset, and top-level page containment. |
| `AuthenticatedSidebarNav` | Icon-only route links, active state, accessible labels, and tooltips. It must not know role policy; it receives filtered navigation. |
| `RecordCreateSidebarButton` | Sidebar footer trigger only; opens create-record dialog through shared record-create state. |
| `PageLayout` | Page-level header/content/footer arrangement and content-region scroll ownership. |
| `PageHeader` | Full-width page title/actions band; descriptions remain optional but are intentionally unused for this slice. |
| `SettingsLayout` | Two-column settings shell inside the authenticated app: settings sidebar plus nested content. |
| `SettingsSidebarNav` | Settings subnavigation active state and logout placement. Role filtering happens in `SettingsLayout`. |
| `MonthSwitcher` | Previous/next month toolbar composition only. |
| `MonthPickerDialog` | Middle month button, dialog trigger/content, selected year/month state, and submit contract. |
| `MonthlyTrendChart` | Recharts composed chart rendering only; receives already shaped daily points. |
| `ExpenseCategoryPieChart` | Recharts donut chart, tooltip, responsive labels, and text-only empty state. |
| `CreateRecordDialog` | Dialog shell/title and record entry panel placement. |
| `RecordEntryPanel` | Form state, record-type tabs, category radio grid, member/date/detail fields, and submit action binding. |

## Data Ownership

- Monthly data loading remains in `createHomeDashboardDataSource` and `loadMonthlyWorkspaceContext`.
- Overview dashboard owns only view-model transformations:
  - daily trend points from current selected month records.
  - expense category points from report category summaries.
  - chart colors and labels.
- Chart components do not fetch or mutate data.
- Reimbursement table data can still exist in `homeView` because overview pending reimbursement summary uses it; the `/reimbursements` route intentionally does not render settlement controls.
- Settings member/category pages keep their existing server loaders and action boundaries.
- Create-record data comes from `RecordCreateScope`; the modal does not query independently.

## Permission Boundary

- Top-level navigation filtering belongs to `dashboard-navigation.ts` and `AccessHints`.
- `/reimbursements` must enforce `homeView.accessHints.actions.canPerformReimbursement` server-side before rendering placeholder content.
- `/settings/members` and `/settings/categories` must enforce admin access in their existing page loaders, not only hide links.
- Settings sidebar filters `成員` and `分類` from `session.accessHints.navigation`.
- Create-record permissions continue to come from `RecordCreateData` and ledger record server action authorization.
- Recurring permissions and hints are removed from app/module code.

## State And Validation Ownership

- Month selection:
  - URL query parameter `month` remains the source of truth.
  - `MonthPickerDialog` owns temporary year/month selection before form submit.
  - Month parsing/formatting stays in `month-selection.ts`.
- Create-record dialog:
  - Open/close state remains in `RecordCreateScope`.
  - `RecordEntryPanel` owns UI-only `entryKind`.
  - `ledger-record-form.ts` and `ledger-record-actions.ts` remain the source of validation and domain error mapping.
  - Fund expense sends `paymentSource=fund` and no member payer.
- Chart empty states:
  - `ExpenseCategoryPieChart` owns "no data" rendering when `totalValue <= 0` or no positive category points exist.
  - Overview page may guard empty state for layout, but must not reintroduce circular placeholder graphics.

## Styling And Layout Constraints

- App shell uses `h-svh min-h-0 overflow-hidden`; pages scroll through `PageLayout` content only.
- Sidebar width is controlled through `SidebarProvider` CSS variables and content padding; text labels remain tooltip/accessibility-only in the primary sidebar.
- Settings sidebar must use shared sidebar components and align header/footer padding with global sidebar conventions.
- Avoid page-section cards around placeholder content, search, reimbursement placeholder, or settings page wrappers.
- Cards remain valid for repeated dashboard widgets and framed data regions on overview.
- Recharts containers must have stable min dimensions from parent card content to avoid collapse or overflow during viewport changes.

## API And Server Actions

- No new HTTP API routes are introduced.
- No new server action is introduced for layout/search/reimbursement placeholder.
- Existing `createLedgerRecordAction` remains the create-record write boundary.
- Removed server actions:
  - `reimbursement-actions.ts` for settlement.
  - `recurring-reminder-actions.ts` for recurring confirmation.
- Future reimbursement implementation must reintroduce its own action contract in a separate behavior/design slice.

## Error, Loading, And Empty Strategy

- Auth/permission failures use existing redirect or access denial patterns.
- Search and reimbursement placeholders are plain `敬請期待`, not loading states.
- Account/settings pages should avoid error banners unless their existing server loaders fail.
- Create-record errors continue to render through the existing alert in `RecordEntryPanel`.
- Chart empty state uses short neutral text only.

## Test Mapping

### Unit / Component Tests

- Update or add `dashboard-navigation.test.ts` assertions:
  - top-level IA excludes recurring/member/category as primary links.
  - reimbursement remains admin/finance-manager only.
- Update `shared-layout.test.tsx`:
  - `PageHeader` full-width behavior.
  - content scroll container exists under `PageLayout`.
- Keep `ledger-record-form.test.ts`:
  - member expense, income, fund expense field parsing.
  - fund expense rejects member payer.
- Keep `home-access.test.ts`:
  - reimbursement access and report data remain valid without recurring reminders.
- Keep `home-dashboard-data-source.test.ts`:
  - no `recurringOccurrence` query contract.
- Keep `monthly-report.test.ts`:
  - no pending recurring items in report output.

### E2E Tests

- Add or update authenticated desktop spec:
  - Admin sees settings members/categories.
  - General member does not see settings members/categories or reimbursement.
  - Finance manager sees reimbursement placeholder.
  - `/settings` redirects to `/settings/account`.
  - `/search` and `/reimbursements` share `敬請期待` placeholder structure.
  - Month picker opens centered dialog with backdrop.
  - Create-record dialog exposes three line tabs and custom category radio grid.
- Add chart visual/state checks where practical:
  - populated category chart renders chart SVG groups.
  - empty category state renders `尚無支出分類資料` and no empty circular placeholder.

### Manual Verification

- Desktop viewport `1440x900` visual pass for `/`, `/search`, `/reimbursements`, `/settings/account`, `/settings/members`, `/settings/categories`.
- Confirm no whole-page scroll on overview at normal desktop viewport.
- Confirm page-content scroll inside settings long lists.
- Confirm month switcher dialog backdrop and positioning.
- Confirm create-record modal for `成員支出`, `收入`, `基金支出`.

## Release Target Implications

- Target remains `local_dev`.
- Required commands before local_dev readiness:
  - `corepack pnpm lint`
  - `corepack pnpm type-check`
  - focused Vitest suite for changed units
  - Playwright desktop route/navigation checks if local browser/dev server is available
- No production secrets, OAuth callback, rollback, monitoring, or database migration assessment is included in this slice.

## TDD Implementation Preconditions

- Behavior spec approval is accepted by user request to proceed after commit.
- Technical design approval is still required before further implementation hardening.
- Start TDD by adding or updating tests before any additional code changes:
  1. route/navigation/permission tests,
  2. page layout/scroll tests,
  3. create-record modal form tests,
  4. E2E desktop shell checks.

## Open Decisions

- Whether to create a separate database cleanup slice for recurring schema/migrations/seed.
- Whether search placeholder should later become real search UX.
- Whether reimbursement settlement workflow should be redesigned before reimplementation.
- Whether account settings should remain read-only or receive self-edit behavior in a future slice.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm route/component ownership before TDD hardening.
  - Confirm no Prisma recurring migration in this slice.
  - Confirm reimbursement settlement is deferred and not accidentally removed from the domain permanently.
- unresolved_blockers:
  - None for TDD Implementation after approval.
- recommended_next_gate:
  - TDD Implementation
- approval_evidence:
  - User requested commit and next step after technical design was drafted.
