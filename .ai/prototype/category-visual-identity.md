---
id: prototype-category-visual-identity
stage: prototype
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-visual-identity.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/category-visual-identity.md
outputs:
  - interactive_prototype
  - ux_acceptance_inputs
  - e2e_scenario_candidates
trace_links:
  route:
    - /settings/categories
  component_paths:
    - src/app/(app)/settings/categories/page.tsx
    - src/app/(app)/settings/categories/category-management-panel.tsx
    - src/app/category-visuals.tsx
    - src/app/record-entry-panel.tsx
    - src/app/record-category-label.tsx
    - src/app/(app)/page.tsx
reviewed_at: 2026-06-20
---

# Category Visual Identity And Ordering Prototype

## Decision Summary

- decision: proceed_to_review
- route: `/settings/categories`
- review_url: `http://localhost:3000/settings/categories`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style UI components, Lucide icons.
- component_library_usage: `Button`, `Card`, `Field`, `Input`, `Item`, `NativeSelect`, `Badge`, `Tabs`.

## Prototype Scope

- Admin can create a local fixture category with type, name, curated color, and curated Lucide icon from the existing category management page.
- Admin can edit a local fixture category name, color, and icon from the existing edit dialog.
- Admin can reorder active categories within income or expense independently in the existing category list.
- Category management shows active expense and income categories in two side-by-side panels.
- New record category choices display active categories in configured fake order.
- Record list labels and dashboard category summary display the category visual identity.
- Archived categories retain saved visual identity for historical records but are not shown in category management or new-record choices.

## Fixture And Mock Strategy

- The slice uses local React state and fake visual metadata in existing app components.
- `src/app/category-visuals.tsx` centralizes temporary color/icon/order mapping until persistence exists.
- No Prisma schema, server action, migration, seed, or persistence behavior is implemented in this gate.
- New local categories append to the end of their selected type to model the domain default.
- Drag reordering rewrites local sort positions by type to model the intended transaction shape.

## States Covered

- create category with visual preview
- edit active category visual identity
- active income ordering
- active expense ordering
- side-by-side expense and income category panels with internal scrolling
- new-record category selection ordered by type
- record list category badge display
- dashboard category color summary display
- empty name create guard through non-submitting local validation

## Responsive Baseline

- Desktop: expense and income category panels sit side by side with fixed title spacing and internally scrollable lists.
- Desktop: category panels use two columns with `支出` on the left and `收入` on the right, filling the available height and scrolling within each list. Mobile uses line tabs for `支出(數量)` and `收入(數量)` instead of stacking both panels, and the active panel omits a repeated panel title.
- Fixed-size icon/swatch controls prevent layout shift when selections change.

## Keyboard And Focus Baseline

- Color and icon choices are button-based radio groups with `aria-checked` and visible focus rings.
- Reorder uses draggable category rows with a visible drag handle.
- New-record preview uses a real radio group with accessible category names.
- Tooltip labels expose icon meaning on hover/focus without relying on icon shape alone.

## UX Acceptance Inputs

- Category visual identity uses curated color and icon values, not arbitrary uploads or remote images.
- Category visual identity appears as a compact badge: color-backed icon plus category name.
- Active category order is scoped to category type, controlled by drag reordering, and controls the new-record selector order.
- Archived category visual identity remains visible for historical records but is not shown in category management or offered for new records.
- Dashboard category summaries should use the persisted category color where category metadata is available.

## E2E Scenario Candidates

- Opening `/settings/categories` shows the existing category management page with color/icon controls and ordering using local fake data.
- Creating a fixture expense category appends it after existing expense categories.
- Reordering an expense category changes the new-record expense category order.
- Switching to income order does not change expense ordering.
- Editing a category color/icon updates the category badge in category management.
- New-record category choices, record category labels, and dashboard category summaries use shared fake visual metadata.
- Archived category does not appear in category management panels or the new-record category selector.

## Known Gaps

- Persistence, Prisma migration, seed defaults, server validation, and server actions are intentionally deferred to Behavior Spec, Technical Design, and TDD Implementation.
- Category create/edit/archive behavior is local front-end slicing for review; durable mutation remains existing backend work for the implementation gate.
- The curated palette and icon list are prototype candidates and can still be revised during review.
- Drag-and-drop sorting is prototyped with native drag events; keyboard-accessible reorder behavior still needs final specification before implementation hardening.
- Dashboard pie chart integration remains out of this page slice; the dashboard summary row now uses category visual metadata.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - confirm curated palette/icon direction
  - confirm drag ordering is acceptable for MVP
  - confirm new-record ordering preview matches expectation
  - confirm which dashboard/report surfaces require first-slice visual identity
- acceptance_signals:
  - prototype route is reviewable in the running app
  - UX states are concrete enough to write BDD/E2E scenarios
  - known backend and persistence gaps are explicit
- unresolved_blockers:
  - None for Behavior Spec after review approval.
- recommended_next_gate:
  - behavior-spec
- stop_condition: Wait for explicit user approval before Behavior Spec, Technical Design, Implementation, Verification, Release, Learning, Artifact Compression, or committing prototype changes.
