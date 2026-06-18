---
id: prototype-admin-only-category-management
stage: prototype
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-only-category-management.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-only-category-management.md
  - .ai/spec/story-category-management.md
outputs:
  - production_stack_interactive_prototype
  - ux_acceptance_criteria_draft
  - e2e_scenario_candidates
trace_links:
  prototype_route:
    - src/app/categories/page.tsx
    - src/app/categories/category-management-panel.tsx
  existing_ui:
    - src/app/home-dashboard-layout.tsx
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/alert.tsx
    - src/components/ui/field.tsx
    - src/components/ui/input.tsx
    - src/components/ui/native-select.tsx
reviewed_at: 2026-06-18
---

# Admin-Only Category Management Prototype

## Decision

- decision: proceed
- prototype_type: production-stack interactive route
- route: `/categories`
- run_command: `npm run dev`
- review_url: `http://localhost:3000/categories`
- no_login_review_url: `http://localhost:3000/categories?previewRole=admin`
- non_admin_preview_url: `http://localhost:3000/categories?previewRole=member`
- owning_stack: Next.js App Router, React client state, Tailwind tokens, shadcn-style UI components, lucide icons
- next_gate: Behavior Spec / BDD / E2E
- next_skill: verification-design

## User Goals

- Admin can discover category management from the sidebar.
- Admin can create income or expense categories.
- Admin can rename active categories.
- Admin can archive categories without breaking historical records.
- Finance managers and general members do not see the sidebar category entry.
- Finance managers and general members receive a denied state if they reach the category route directly.

## Prototype Surface

| Surface | Prototype Treatment |
|---|---|
| Admin sidebar | Intended final behavior is to include `分類`, highlighted as active. |
| Non-admin sidebar | Intended final behavior is to omit `分類`; this remains a BDD/technical-design item because global authorization is not changed in this prototype gate. |
| Direct route denial | Shows an in-dashboard denied state with role badge and return action. |
| Header description | Shows the category lifecycle note under the page title. |
| Category status tabs | `啟用分類` and `封存分類` are switched with the shadcn-style Tabs component using `TabsList variant="line"` instead of stacked vertical sections. |
| Active category list | Active tab groups income and expense categories. |
| Create action placement | Category page removes the default income/expense create actions; `新增分類` appears in the desktop header and in the mobile footer. |
| Create category | `新增分類` opens a modal without changing the URL; the form has type select and category name input plus duplicate/blank validation. |
| Rename category | Row edit icon opens a modal for active category rename. |
| Archive category | Icon action opens a confirmation modal; the modal shows the category's current historical-record reference count and confirms that existing records remain categorized. |
| Archived category | Archived tab groups income and expense categories; exclusion from new-record choices remains a BDD rule, not a visible management-page section. |
| Empty state | Shows empty category management and empty new-record choices. |
| Mutation feedback | Create, rename, archive, validation, and permission outcomes use toast feedback; no persistent page-level alert is shown for these prototype actions. |

## Fixture Strategy

- Data is initialized from the real dashboard category and ledger-record read model.
- Create, rename, and archive interactions are local React state only until server actions are designed.
- Historical record counts are derived from the current monthly records available to the dashboard context.
- Admin/non-admin route access is rendered by the real `/categories` page using the current profile roles.
- Non-production preview query `previewRole=admin|member` renders the real `/categories` page with fixture data when real login is unavailable.
- Empty-data behavior is represented when the dashboard has no categories.

## States Covered

- admin_normal: category page available with management controls.
- non_admin_denied: direct category route denied.
- create_success: admin opens `新增分類` from the desktop header or mobile footer and adds a new active category.
- create_blank_validation: empty category name is rejected inline.
- create_duplicate_validation: duplicate active name in the same type is rejected.
- rename_success: admin opens a row edit modal and renames an active category.
- archive_success: admin confirms archive in a modal, sees a toast, and the category moves to the archived group.
- empty: no categories exist; page remains actionable.

## Responsive Baseline

- Desktop: category list uses two management columns for income and expense categories.
- Tablet/mobile: sections stack vertically; primary create action is fixed in the mobile footer.
- Sidebar behavior is inherited from `HomeDashboardLayout`; final non-admin sidebar hiding remains part of the BDD/technical-design handoff.
- Dense category rows keep stable icon button dimensions.

## Accessibility And Focus Baseline

- Icon-only edit/archive actions have `aria-label`.
- Form inputs have labels and inline descriptions.
- Toast feedback is used for create, rename, archive, validation, and permission outcomes.
- Denied state has a focused heading and clear role-specific explanation.
- Known focus gap: after successful create/archive, focus is not programmatically moved to the changed list or alert in the prototype; implementation design should decide final focus behavior.

## UX Acceptance Criteria Draft

- Admin sees `分類` in sidebar and can open category management.
- Category page shows `新增分類` instead of `新增收入` and `新增支出`; desktop places it in the header, mobile places it in the footer, and opening the form does not change the URL.
- Finance manager and general member do not see `分類` in sidebar.
- Direct non-admin visits to category management show a denied state rather than exposing category controls.
- Admin can create an income or expense category with a non-empty name.
- Admin cannot create a duplicate active category name within the same type.
- Admin can rename only active categories.
- Admin can archive active categories.
- Archived categories are displayed for history but excluded from new-record category options.
- Empty category state remains usable and points admin to create the first category.
- UI copy remains Traditional Chinese and uses household finance language.

## E2E Scenario Candidates

- admin sidebar includes `分類` and category page content is visible.
- finance manager sidebar does not include `分類`; direct `/categories` access shows the selected denied behavior.
- general member sidebar does not include `分類`; direct `/categories` access shows the selected denied behavior.
- admin creates an expense category and sees it in active categories and new-record options.
- admin attempts duplicate active category name and sees validation error.
- admin opens archive confirmation and sees the current historical-record reference count before confirming.
- admin archives a category and it moves out of new-record options while remaining visible in archived list.

## Open Questions

- Should non-admin direct visits render the dashboard denied state used here, redirect to `/`, or return a not-found style response?
- Should archived categories be shown by default as in this prototype, or hidden behind a filter when the list grows?
- Should category names be unique only among active categories, or across active and archived categories of the same type?
- Should archive also require a confirmation modal, or is a single icon action enough for MVP?

## Known Gaps

- Prototype does not integrate Prisma or server actions.
- Prototype does not implement final focus restoration after mutations.
- Prototype keeps archived categories visible by default pending review.
- Prototype assumes direct-route denial renders a dashboard denied state pending review.
- Prototype does not change global category navigation authorization; non-admin sidebar hiding must be specified and implemented after BDD/technical design.
- Preview query is guarded by `NODE_ENV !== "production"` and exists only to unblock local review while real login is unavailable.

## Verification Evidence

- `pnpm lint`: pass.
- `pnpm type-check`: pass after rerunning sequentially.
- `npm run dev`: Next dev server started and reported `http://localhost:3000`.
- Local route check with `curl` could not connect from the sandbox even though `lsof` showed node listening on port `3000`; manual no-login review should use `http://localhost:3000/categories?previewRole=admin`.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm non-admin direct route behavior.
  - Confirm archived category visibility.
  - Confirm inline edit/archive interaction.
- must_check:
  - Admin and non-admin sidebar states are both represented.
  - Category lifecycle states are clear before BDD/E2E.
  - Prototype does not imply backend integration.
- acceptance_signals:
  - Behavior Spec can turn covered states into BDD/E2E scenarios.
  - Technical Design can decide route guard, server action, persistence, cache invalidation, and focus handling.
- unresolved_blockers:
  - None for Behavior Spec / BDD / E2E.
- next_step:
  - verification-design
