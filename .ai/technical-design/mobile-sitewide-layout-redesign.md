---
id: mobile-sitewide-layout-redesign
stage: feature-technical-design
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/mobile-sitewide-layout-redesign.md
  - .ai/prototype/mobile-sitewide-layout-redesign.md
  - .ai/spec/mobile-sitewide-layout-redesign.md
  - .ai/domain/home-family-fund.md
  - .ai/prototype/web-foundation.md
outputs:
  - route_boundaries
  - component_boundaries
  - state_and_contract_decisions
  - test_mapping
trace_links:
  routes:
    - src/app/(app)/layout.tsx
    - src/app/(app)/page.tsx
    - src/app/(app)/search/page.tsx
    - src/app/(app)/settings/layout.tsx
    - src/app/(app)/settings/account/page.tsx
    - src/app/(app)/settings/members/page.tsx
    - src/app/(app)/settings/categories/page.tsx
  components:
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-mobile-nav.tsx
    - src/components/layout/page-layout.tsx
    - src/components/ui/dialog.tsx
    - src/app/record-search-controls.tsx
    - src/app/batch-search-footer.tsx
    - src/app/create-record-dialog.tsx
    - src/app/record-list-detail.tsx
    - src/app/(app)/settings/settings-sidebar-nav.tsx
    - src/app/(app)/settings/categories/category-management-panel.tsx
reviewed_at: 2026-06-24
---

# Mobile Sitewide Layout Redesign Technical Design

## Decision Summary

- decision: ready_for_review
- prior_gate_status: Behavior Spec approved by user request to continue.
- implementation_strategy: Treat this as a responsive presentation slice over existing authenticated routes and domain commands. Keep all financial, membership, category, reimbursement, and auth contracts unchanged.
- next_gate_after_approval: TDD Implementation.

## Route Boundaries

| Route | Boundary decision |
|---|---|
| `src/app/(app)/layout.tsx` | Continue to resolve current member/access hints server-side and pass role-aware navigation plus `canCreateRecord` into the authenticated shell. No route or data-contract changes. |
| `/` | Own overview-specific mobile content priority: hidden mobile title, compact metric row, larger mobile section gaps, hidden mobile trend chart. |
| `/search` | Own search-only mobile chrome exception: no bottom tab bar, no global create FAB, ghost back button beside the search input, and mobile-safe batch footer. |
| `/settings/*` | Own settings mobile subnavigation and settings-owned FABs. Global create-record FAB stays hidden under this route group. |
| `/settings/members` | Keep existing member server actions and dialogs. Only action placement changes on mobile. |
| `/settings/categories` | Keep admin-only server authorization and category server actions. Mobile reorder uses up/down commands over the existing `reorderCategoriesAction`; desktop drag handle remains. |

## Component Boundaries

### App Shell

- `AuthenticatedLayout` remains the only authenticated app shell owner. It renders the desktop sidebar and the mobile navigation layer from the same role-aware `navigation` array.
- `AuthenticatedMobileNav` owns mobile-only bottom tabs, active state, route-based hiding, and global create-record FAB visibility.
- `AuthenticatedSidebarNav` continues to own desktop route matching and exports shared active matching/icon mapping only if needed by the mobile nav.
- Do not duplicate navigation permission logic in the mobile component; `getVisibleDashboardNavigationItems()` remains the source of visible tabs.

### Page Layout

- `PageLayout`, `PageContent`, `PageFooter`, and page-level mobile action helpers remain layout primitives.
- Bottom fixed controls must reserve safe-area padding in the owning component rather than relying on page content to guess footer height.
- Root horizontal overflow prevention belongs in global/layout-level CSS. Intentional horizontal controls own their own `overflow-x-auto` and scrollbar hiding.

### Dialogs

- `DialogContent` owns modal sizing and clipping prevention.
- `DialogBody` owns vertical modal scrolling and must keep `overflow-x-hidden`.
- `DialogFooter` owns the mobile button distribution rule:
  - mobile: `display:flex`, one child grows to full width, multiple children grow equally.
  - desktop: natural-width children aligned to the end.
- Feature dialogs must use `DialogFooter`; custom footer rows are allowed only when there is no action footer.

### Record Create, Edit, And Detail

- Keep create-record state in `RecordCreateScope` and existing form/server-action flow.
- `create-record-dialog.tsx` remains the source for create form layout. Category selection should be a reusable local pattern or small extracted component only if edit uses the same markup.
- Edit-record layout in `record-list-detail.tsx` should reuse create-record visual conventions, but must not merge edit and create submission contracts unless that simplifies existing code without changing behavior.
- Record detail metadata pairing is presentational only; it must not alter reimbursement or edit/delete authorization checks.

### Search

- `record-search-controls.tsx` owns search toolbar layout, filter dialog draft state, native select controls, and back behavior.
- Back behavior should remain client-side: `window.history.length > 1 ? router.back() : router.push("/")`.
- `batch-search-footer.tsx` owns selected-count summary, total amount display, icon-only mobile batch actions, and safe-area/footer clipping prevention.
- Search query, batch delete, and batch refund server behavior remain owned by existing reporting/fund-ledger/reimbursement modules.

### Settings

- `settings/layout.tsx` owns settings-level route list construction and placement of desktop sidebar vs mobile segmented tabs.
- `SettingsMobileNav` owns the segmented tab UI and `aria-current`.
- Member/category mobile FABs should be page-owned and hidden on desktop. They should open the existing dialogs without URL state.
- `category-management-panel.tsx` owns mobile up/down reorder buttons and disabled first/last boundary logic. The server action remains the authority for persisted order.

## Data, State, And Contract Decisions

- No Prisma schema, migration, server action signature, auth session, or domain module changes are required.
- Navigation visibility remains derived from existing access hints server-side.
- Global create FAB uses existing `useRecordCreate().openExpense()`; the expense-first default is accepted for this slice.
- Search filter state remains local draft state until `套用`; native selects remain platform-native.
- Batch selection remains temporary UI state in the search page and does not authorize mutation.
- Category reorder optimistic state may be updated locally after a successful `reorderCategoriesAction`; pending state must disable repeated reorder submissions.
- Up/down reorder commands must compute the new order within the same active category type only. First/last disabled state is computed after applying active-category sorting.
- Errors continue to use inline messages where already present or toast feedback for non-field command failures.

## Auth And Permission Boundaries

- Mobile nav hiding is presentation only; server route permission checks remain mandatory for settings member/category pages and category mutation actions.
- Mobile category reorder controls must render only on the admin-only category management page after existing route authorization.
- Batch delete/refund button disabled state remains convenience UI only; server commands must revalidate selected records and actor permissions.
- Create/edit/detail mobile layout changes must not broaden who can create, edit, delete, or reimburse records.

## Responsive And Accessibility Decisions

- Mobile breakpoint remains Tailwind `md` unless existing component context already uses a narrower local breakpoint.
- Acceptance viewport for E2E is `390x844`; use `375x812` for narrow regression when debugging overflow.
- Use role/name selectors and existing visible Traditional Chinese labels for E2E.
- Icon-only mobile buttons must have explicit `aria-label` or accessible hidden text.
- Bottom tab nav uses `aria-label="主要導覽"` and active links use `aria-current="page"`.
- Settings mobile nav uses `aria-label="設定導覽"` and active links use `aria-current="page"`.
- Disabled reorder boundary buttons must use native `disabled`, not only muted styling.
- Hidden scrollbar CSS must not disable keyboard, wheel, or touch scrolling.

## Test Mapping

### Component / Unit

| Test file | Coverage |
|---|---|
| `src/components/layout/shared-layout.test.tsx` | Authenticated layout renders mobile nav markup from role-aware items, keeps desktop/sidebar markup, and does not render global create FAB when `canCreateRecord=false`. |
| `src/app/dashboard-navigation.test.ts` | Existing role-aware nav labels remain `總覽`, `搜尋`, `設定`; no mobile-specific permission fork is introduced. |
| new or existing dialog component test | `DialogFooter` child distribution classes support one, two, and three action buttons on mobile while preserving desktop alignment. |
| category management component/unit test if practical | First active category up button disabled, last down button disabled, middle rows enabled, scoped by category type. |

### E2E

| Spec | Coverage |
|---|---|
| `e2e/dashboard.spec.ts` or new mobile layout spec | Mobile `/` shows bottom nav, FAB, compact metric row, no visible `總覽` heading, no visible trend chart, no root horizontal overflow. |
| `e2e/record-search.spec.ts` | Mobile `/search` hides bottom tab/FAB, shows `返回上一頁`, filter dialog paired fields, mobile batch footer icon actions, no clipping. |
| `e2e/create-record.spec.ts` | Mobile create dialog category row scrolls horizontally, selected state is visible, payer/date pair remains side by side, footer fills width. |
| `e2e/record-edit-delete.spec.ts` | Mobile edit/detail dialogs keep paired metadata/form fields and no horizontal dialog overflow. |
| `e2e/admin-category-management.spec.ts` | Mobile settings tabs visible, global create FAB hidden, category page FAB opens dialog, up/down boundary buttons disabled. |

### Manual Verification

- Real mobile browser pass for hidden scrollbars and no accidental horizontal page panning.
- Native select visual pass in the filter dialog, especially iOS Safari.
- Safe-area footer pass on mobile search and app shell with bottom controls.

## Implementation Preconditions

- Start TDD by adding or updating the mobile E2E cases before further UI changes.
- Make the admin-linked E2E fixture reliable enough for `/settings/members` and `/settings/categories` mobile coverage, or record the limitation explicitly in implementation evidence.
- Run checks sequentially, not in parallel, because type-check/lint can race on generated Prisma artifacts in this repo.
- Minimum verification before handoff: `corepack pnpm type-check`, `corepack pnpm lint`, focused unit/component tests, and focused Playwright mobile specs.

## Rejected Alternatives

- Do not introduce a drag-and-drop package in this slice. Up/down controls are the accepted mobile path and avoid adding touch DnD complexity before the user asks for real drag.
- Do not replace `NativeSelect` with a custom select in this slice. The accepted behavior is native select readability and non-overflow, not a select rebuild.
- Do not introduce a separate mobile route tree. Responsive behavior should stay colocated with the existing route/page components.
- Do not move create-record open state into URL params. Existing dialog state remains in `RecordCreateScope`.

## Release Target Implications

- `local_dev` readiness is sufficient after tests and browser smoke.
- No database migration, seed migration, OAuth callback change, secret change, or production rollout task is required.
- Preview/production readiness would need device/browser smoke coverage before release, but that is outside this target.

## Review Gate

- decision: ready_for_review
- reviewer_focus:
  - Confirm component ownership boundaries before TDD Implementation starts.
  - Confirm no new package is introduced for mobile category ordering.
  - Confirm tests should prioritize mobile E2E for overflow, footer, nav, and dialog behavior.
- acceptance_signals:
  - TDD Implementation can begin by adding focused mobile tests and then hardening the prototype code.
  - Existing server actions and domain modules remain stable.
  - Known admin fixture risk is explicit.
- unresolved_blockers:
  - Reliable admin-linked E2E fixture may need setup work during TDD Implementation to cover mobile settings management.
- next_step:
  - TDD Implementation after approval.
