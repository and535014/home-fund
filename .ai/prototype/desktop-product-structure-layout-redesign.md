---
id: desktop-product-structure-layout-redesign
stage: experience-prototype
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/desktop-product-structure-layout-redesign.md
  - .ai/project-context.md
  - .ai/workflow.md
outputs:
  - production_stack_desktop_prototype
  - ux_acceptance_draft
trace_links:
  routes:
    - src/app/(app)/page.tsx
    - src/app/(app)/search/page.tsx
    - src/app/(app)/settings/layout.tsx
    - src/app/(app)/settings/page.tsx
    - src/app/(app)/settings/account/page.tsx
    - src/app/(app)/settings/categories/page.tsx
    - src/app/(app)/settings/members/page.tsx
  components:
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-sidebar-nav.tsx
    - src/components/layout/record-create-sidebar-button.tsx
    - src/app/create-record-dialog.tsx
    - src/app/record-entry-panel.tsx
    - src/app/record-create.tsx
reviewed_at: 2026-06-20
---

# Desktop Product Structure Layout Redesign Prototype

## Prototype Summary

This prototype updates the real authenticated Next.js app surfaces for the approved desktop IA and layout redesign.

- Primary sidebar IA is now `總覽`, `搜尋`, `退款`, and `設定`.
- `週期` is removed from visible routing by deleting the route page.
- Missing or not-yet-designed surfaces use `敬請期待` placeholders.
- Settings uses `/settings`, `/settings/account`, `/settings/members`, and `/settings/categories`.
- Existing category and member management pages are nested under settings.
- The desktop dashboard is reorganized into month switcher, monthly metrics, trend region, pending reimbursements, expense-category region, and monthly records.
- The `新增紀錄` action is moved into the sidebar footer and opens the create-record modal through app state.
- The create-record modal is restructured around the supplied wireframe: header, three record-type tabs, category grid, amount, name, member/date row, notes, cancel, and add.

## Review Surface

- run command: `corepack pnpm dev`
- observed dev URL: `http://localhost:3001` because port 3000 was already in use.
- primary review paths:
  - `/`
  - `/search`
  - `/reimbursements`
  - `/settings`
  - `/settings/account`
  - `/settings/members`
  - `/settings/categories`

## Component Library And Stack

- Framework: Next.js App Router with React Server Components and client islands.
- Styling: Tailwind CSS semantic tokens and existing dark-first UI variables.
- Component library: existing shadcn-style local components under `src/components/ui`.
- Data strategy: existing Prisma-backed loaders remain in place; no mock API was introduced.
- Create-record behavior: existing server action and field names are retained; only the modal layout and trigger placement were prototyped.

## States Covered

- Authenticated desktop sidebar with main navigation and sidebar `新增紀錄` button.
- Dashboard with populated metrics, empty record table fallback, category summary fallback, and pending reimbursement text.
- Search placeholder with `敬請期待`.
- Settings landing placeholder with `敬請期待`.
- Account settings read-only display name state.
- Category management under settings.
- Member management under settings.
- Create-record modal for member expense, income, and fund expense structure.

## Accessibility And Focus Notes

- Sidebar links remain semantic anchors with active state from the current path.
- Settings subnavigation is exposed as `aria-label="設定導覽"`.
- Modal keeps Radix Dialog focus management and close button.
- Category grid uses radio inputs so the selected category is submitted through the existing form contract.
- The prototype has not yet had keyboard walkthrough or screen-reader pass beyond component-level semantics.

## Responsive Baseline

- Scope is desktop only by explicit user direction.
- Mobile layout was not optimized or accepted for this gate.
- Existing mobile-specific action bars were removed from the homepage prototype because the sidebar action is the selected desktop entry point.

## Verification Evidence

- `corepack pnpm type-check`: passed.
- `corepack pnpm test src/app/dashboard-navigation.test.ts src/components/layout/shared-layout.test.tsx src/app/ledger-record-form.test.ts`: passed.
- `corepack pnpm dev`: started successfully and selected `http://localhost:3001` because port 3000 was occupied.
- HTTP route probing from this sandbox could not connect to the running dev server despite `lsof` showing Node listening on `*:3001`; visual/browser review remains a manual review item.

## UX Acceptance Draft

- Desktop users can identify the app structure from the sidebar without top-level admin clutter.
- Desktop users can access `搜尋`, `退款`, and `設定` from the primary sidebar.
- Desktop users can find account, members, categories, and logout inside settings.
- Unimplemented surfaces clearly show `敬請期待`.
- Dashboard content is arranged for scanning: month selector, summary metrics, trend, reimbursements, category breakdown, and records.
- Create-record starts from one sidebar button and the modal presents record type before category and details.

## Known Gaps

- Search has no real search controls or behavior yet.
- Settings landing remains a placeholder.
- Account settings is read-only and does not edit profile data.
- The trend and pie regions are structural prototype visuals, not final chart implementations.
- Existing recurring domain code remains in the repository, but its visible page route is removed in this prototype.
- Browser screenshot and canvas/pixel visual checks were not completed because the sandbox could not connect to the running local dev server.

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm the desktop sidebar IA and settings nesting.
  - Confirm dashboard region placement before BDD/E2E locking.
  - Confirm the create-record modal structure is close enough for behavior spec.
  - Decide whether the structural chart placeholders should be replaced with real chart components during implementation or later.
- acceptance_signals:
  - Behavior Spec can define route, navigation, settings, dashboard, and modal scenarios from this prototype.
  - Feature Technical Design can decide final route redirects/removals and shared layout ownership.
- unresolved_blockers:
  - None for moving to Behavior Spec / BDD / E2E after review approval.
- next_step:
  - Behavior Spec / BDD / E2E
