---
id: prototype-category-archive-visibility-toggle
stage: prototype
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-archive-visibility-toggle.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/category-archive-visibility-toggle.md
  - .ai/archive/archive-category-visual-identity-2026-06-21.md
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
    - src/app/(app)/settings/categories/category-management-ui.tsx
reviewed_at: 2026-06-26
---

# Category Archive Visibility Toggle Prototype

## Decision Summary

- decision: accepted_for_behavior_spec
- route: `/settings/categories`
- review_url: `http://localhost:3000/settings/categories`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style UI components, Lucide icons.
- component_library_usage: `Button`, `Badge`, `Item`, `ItemContent`, `ItemDescription`, `ItemActions`, `Switch`, and existing dialog/form/category visual components.

## Prototype Scope

- Add a single page-level switch labeled `顯示封存分類`.
- Keep the existing two-panel layout: `支出分類` and `收入分類`.
- Default state hides archived categories.
- When the switch is on, archived categories appear at the bottom of each relevant panel after active categories.
- Archived rows keep their category visual identity and show an `已封存` icon in item media so they align with active-row drag handles.
- Archived rows expose only `取消封存`; they do not expose edit, archive, or reorder controls.
- `取消封存` is prototyped as local client state with toast feedback and appends the restored category to the bottom of the active ordering for its type.

## Fixture And Mock Strategy

- The prototype uses the existing category management loader and real category objects from `/settings/categories`.
- No seed data is changed in this gate.
- No server action, Prisma mutation, domain command, migration, or persistence behavior is implemented in this gate.
- To review the archived-row state from a fresh local seed, an admin can archive an existing category, then enable `顯示封存分類`.
- `取消封存` updates only local React state for review; durable restore belongs to Behavior Spec, Feature Technical Design, and TDD Implementation.

## States Covered

- archived categories hidden by default
- switch on/off state
- archived categories shown below active categories
- archived row visual treatment
- empty archived review state (`目前沒有封存分類。`)
- local unarchive success feedback
- duplicate-name conflict copy path retained for future server/domain parity

## Responsive Baseline

- Desktop: the switch sits above the two category panels and keeps panel layout unchanged.
- Mobile/tablet: the switch stacks label/help text and control without shrinking the category panels.
- Archived row action uses an icon button with an accessible label and tooltip, matching the other category row actions.

## Keyboard And Focus Baseline

- The visibility control uses the shadcn-style `Switch` component with a stable accessible name.
- The switch is keyboard focusable as a native button.
- Archived row action has accessible name `取消封存 <分類名稱>`.
- Existing edit/archive/reorder keyboard behavior for active rows is unchanged.
- Archived rows are not reorderable, avoiding keyboard focus traps around inactive sort targets.

## UX Acceptance Inputs

- Use one page-level switch for both income and expense panels unless Behavior Spec decides separate controls are necessary.
- Do not introduce tabs for active/archived categories.
- Keep archived categories out of new-record category choices until restored.
- Place archived categories below active categories within each panel.
- Treat unarchive as a direct row action with toast feedback in the prototype; Behavior Spec should decide whether confirmation is required.
- Archived categories should be visually distinct with an item-media icon, while keeping row alignment close to active categories.

## E2E Scenario Candidates

- Opening `/settings/categories` shows `顯示封存分類` switch and hides archived categories by default.
- After archiving a category, turning the switch on shows the archived row at the bottom of the matching panel.
- Turning the switch off hides archived rows without changing persisted category status.
- Clicking `取消封存 <分類名稱>` moves the row back into the active section and shows `分類已取消封存`.
- Archived rows do not expose `修改`, `封存`, or sort controls.
- New-record category choices continue to show active categories only before unarchive.

## Known Gaps

- Unarchive is local-only in this prototype; it is not persisted and does not call a server action.
- Duplicate active-name rejection is represented in UX copy direction but not backed by a domain command yet.
- Local seeds do not include an archived category by default, so archived-row review starts by archiving a category.
- Browser route probe reached the running dev server, but `/settings/categories` redirected to `/unauthenticated?reason=google_account_not_linked` without a valid local Google-bound session; no category-page screenshot evidence was captured.
- Target-aware release remains out of scope; this is a local_dev prototype.

## Review Gate

- decision: approve
- reviewer_focus:
  - confirm one page-level switch is enough
  - confirm archived rows belong under active rows in the same panels
  - confirm direct `取消封存` with toast is acceptable, or request confirmation dialog
  - confirm archived rows should expose only restore, not edit/reorder
- acceptance_signals:
  - prototype route is reviewable in the running app
  - UX states are concrete enough to write BDD/E2E scenarios
  - persistence and backend gaps are explicit
- unresolved_blockers:
  - None for Behavior Spec after review approval.
- recommended_next_gate:
  - behavior-spec
- stop_condition: Behavior Spec may proceed; wait for explicit approval before Feature Technical Design, Implementation, Verification, Release, Learning, or Artifact Compression.
