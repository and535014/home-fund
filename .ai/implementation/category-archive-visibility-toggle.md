---
id: implementation-category-archive-visibility-toggle
stage: tdd-implementation
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-archive-visibility-toggle.md
  - .ai/domain-impact/category-archive-visibility-toggle.md
  - .ai/prototype/category-archive-visibility-toggle.md
  - .ai/spec/category-archive-visibility-toggle.md
  - .ai/technical-design/category-archive-visibility-toggle.md
outputs:
  - category_archive_visibility_toggle_implementation
  - category_unarchive_command
  - category_unarchive_server_action
  - archived_category_e2e_fixtures
trace_links:
  domain:
    - src/modules/categorization/category-catalog.ts
    - src/modules/categorization/category-command.ts
  app:
    - src/app/category-actions.ts
    - src/app/(app)/settings/categories/category-management-panel.tsx
    - src/app/(app)/settings/categories/category-management-ui.tsx
    - src/components/ui/item.tsx
    - src/components/ui/switch.tsx
  fixtures:
    - prisma/seed.sql
    - prisma/seed.e2e.sql
  tests:
    - src/modules/categorization/category-catalog.test.ts
    - src/modules/categorization/category-command.test.ts
    - e2e/admin-category-management.spec.ts
reviewed_at: 2026-06-26
---

# Category Archive Visibility Toggle Implementation

## Summary

- Added the domain unarchive command with admin authorization, archived-state validation, duplicate active-name rejection, and append-to-active-order behavior.
- Added the Prisma command adapter to update archived categories back to active status inside the existing transaction path.
- Added `unarchiveCategoryAction` and wired the category management panel to use the server action instead of prototype-only local state logic.
- Seeded archived income and expense categories for local and E2E fixtures.
- Extended the category management E2E flow to cover default hidden archived categories, the archive visibility switch, archived row controls, and unarchiving into new-record choices.

## TDD Evidence

Tests updated before/with implementation:

- `src/modules/categorization/category-catalog.test.ts`
- `src/modules/categorization/category-command.test.ts`
- `e2e/admin-category-management.spec.ts`

Verification commands:

- `corepack pnpm vitest run src/modules/categorization/category-catalog.test.ts src/modules/categorization/category-command.test.ts`
  - result: passed, 2 files / 22 tests
- `corepack pnpm type-check`
  - result: passed
- `corepack pnpm lint`
  - result: passed
- `corepack pnpm test:e2e e2e/admin-category-management.spec.ts`
  - result: passed, 7 tests

## Implemented Contracts

- Archived categories are hidden by default on `/settings/categories`.
- `顯示封存分類` uses the shadcn `Switch` inside the existing `Item` layout.
- When shown, active categories render before archived categories for each type.
- Archived rows show the archived icon in item media, aligned with active row drag handles.
- Archived rows expose only an icon-only `取消封存 <分類名稱>` action.
- Unarchive is authorized server-side and rejects non-admin, missing, already-active, or duplicate active-name commands.
- Successful unarchive appends the category to the active order and returns the toast message `分類已取消封存`.
- Unarchived categories appear in the new-record category choices.

## Known Gaps For Verification

- Full regression test suite was not run in this gate; focused unit, type, lint, and category management E2E passed.
- Visual verification should still inspect the icon-media alignment in desktop and mobile viewports before release readiness.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - inspect archived item icon-media alignment against active drag handles
  - confirm the switch placement and row density match the category settings page
  - confirm unarchived categories append where expected in each type list
- acceptance_signals:
  - focused unit/type/lint/category-management E2E checks pass
  - unarchive behavior runs through the server action and domain command
  - archived rows do not expose edit, archive, or reorder controls
- unresolved_blockers:
  - none
- recommended_next_gate:
  - verification
- stop_condition: Wait for explicit user approval before moving to Verification.
