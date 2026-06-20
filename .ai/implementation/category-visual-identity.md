---
id: implementation-category-visual-identity
stage: tdd-implementation
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/category-visual-identity.md
  - .ai/technical-design/category-visual-identity.md
  - .ai/prototype/category-visual-identity.md
outputs:
  - persisted_category_visual_identity
  - category_ordering_implementation
  - focused_test_evidence
trace_links:
  schema:
    - prisma/schema.prisma
    - prisma/migrations/20260620093000_add_category_visual_identity/migration.sql
    - prisma/seed.sql
  domain:
    - src/modules/categorization/category-visual-options.ts
    - src/modules/categorization/category-catalog.ts
    - src/modules/categorization/category-command.ts
  app:
    - src/app/category-actions.ts
    - src/app/category-management-context.ts
    - src/app/(app)/settings/categories/category-management-panel.tsx
    - src/app/category-visuals.tsx
    - src/app/record-entry-panel.tsx
    - src/app/record-category-label.tsx
    - src/app/record-list-detail.tsx
    - src/app/(app)/page.tsx
    - src/app/home-dashboard-data-source.ts
  tests:
    - src/modules/categorization/category-catalog.test.ts
    - src/modules/categorization/category-command.test.ts
    - src/modules/reporting/monthly-report.test.ts
    - src/app/home-dashboard-data-source.test.ts
    - src/app/home-access.test.ts
reviewed_at: 2026-06-20
---

# Category Visual Identity And Ordering Implementation

## Summary

- Added persisted category `color`, `icon`, and `sortOrder` fields with migration and local seed values.
- Added controlled category color/icon registries and server-safe validators.
- Extended Categorization domain commands for create defaults, visual update, active-category ordering, and invalid reorder rejection.
- Extended category DB command adapter and server actions for create/update/archive/reorder.
- Replaced prototype visual derivation with persisted visual metadata across category management, new record category choices, record list media, and dashboard summaries.
- Updated reporting/read models so category summaries carry visual fields and sort by persisted category order.

## TDD Evidence

Tests updated before/with implementation:

- `src/modules/categorization/category-catalog.test.ts`
- `src/modules/categorization/category-command.test.ts`
- `src/modules/reporting/monthly-report.test.ts`
- `src/app/home-dashboard-data-source.test.ts`
- `src/app/home-access.test.ts`

Verification commands:

- `corepack pnpm vitest run src/modules/categorization/category-catalog.test.ts src/modules/categorization/category-command.test.ts src/modules/reporting/monthly-report.test.ts src/app/home-dashboard-data-source.test.ts src/app/home-access.test.ts`
  - result: passed, 5 files / 28 tests
- `corepack pnpm lint`
  - result: passed
- `corepack pnpm type-check`
  - result: passed
- `corepack pnpm test`
  - result: passed, 29 files / 132 tests
- `corepack pnpm db:validate`
  - result: passed

## Implemented Contracts

- Category visual identity is persisted on Category and validated through controlled keys.
- Existing categories receive deterministic migration defaults and stable sort order.
- New categories append to the active order for their selected type.
- Active categories can update name, color, and icon together.
- Archived categories preserve visual identity and are hidden from active category panels.
- Active category list and new-record choices use persisted order.
- Record list category media renders only the visual mark with an accessible category name.
- Dashboard category summary uses persisted category color and visual label.
- Invalid color, icon, and reorder payloads are rejected server-side.

## Known Gaps For Verification

- Playwright E2E was not run in this implementation gate.
- Drag reorder currently persists on drag-enter reorder updates; Verification should exercise the browser behavior and decide whether to defer persistence to drag end for fewer server calls.
- Keyboard reorder via focused sort handle uses ArrowUp/ArrowDown; Verification should exercise this in browser because it was not covered by Playwright in this gate.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - inspect category create/edit UI with persisted color/icon fields
  - inspect active expense/income panel sorting and drag behavior
  - verify record list mark-only category display
  - decide whether keyboard reorder must be completed before Verification
- acceptance_signals:
  - unit/type/lint/schema checks pass
  - persisted visual/order data flows through backend and primary UI surfaces
  - no prototype-only fake visual mapping remains for categories loaded from the app
- unresolved_blockers:
  - Browser E2E/visual verification pending.
- recommended_next_gate:
  - verification
- stop_condition: Wait for explicit user review before committing this implementation or moving to Verification.
