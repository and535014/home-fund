---
id: mobile-sitewide-layout-redesign
stage: tdd-implementation
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/mobile-sitewide-layout-redesign.md
  - .ai/technical-design/mobile-sitewide-layout-redesign.md
  - .ai/prototype/mobile-sitewide-layout-redesign.md
outputs:
  - focused_component_tests
  - implementation_evidence
trace_links:
  tests:
    - src/components/layout/shared-layout.test.tsx
    - src/components/layout/mobile-navigation-order.test.ts
    - src/components/ui/dialog.test.tsx
    - src/app/category-ordering.test.ts
  components:
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-mobile-nav.tsx
    - src/components/layout/mobile-navigation-order.ts
    - src/components/ui/dialog.tsx
    - src/app/(app)/settings/categories/category-ordering.ts
    - src/app/(app)/settings/categories/category-management-panel.tsx
reviewed_at: 2026-06-24
---

# Mobile Sitewide Layout Redesign Implementation

## Decision Summary

- decision: ready_for_review
- implementation_scope: Harden the accepted mobile prototype with focused TDD coverage for app shell navigation/FAB, shared dialog footer behavior, and mobile category ordering boundary states.
- code_scope: No production behavior changes were required after adding tests; the accepted prototype already contained the traced UI behavior. Test fixtures were adjusted to respect existing context/server-action boundaries.

## TDD Evidence

1. Added focused tests for mobile app shell behavior in `src/components/layout/shared-layout.test.tsx`.
   - Covers mobile bottom navigation rendered from role-aware items.
   - Covers global `新增紀錄` FAB markup when record creation is allowed.
   - Keeps the existing desktop/sidebar layout tests intact.
2. Added `src/components/ui/dialog.test.tsx`.
   - Covers that shared dialog footer actions render through the identifiable `DialogFooter` boundary.
   - Avoids locking tests to Tailwind implementation selectors; browser layout checks remain an E2E concern.
3. Added `src/app/(app)/settings/categories/category-ordering.ts` and `src/app/category-ordering.test.ts`.
   - Extracts category move-state calculation into a pure helper.
   - Covers first, middle, last, and unknown category movement boundaries without parsing rendered HTML.

## Implementation Notes

- The app shell test wraps `AuthenticatedLayout` in `RecordCreateContext.Provider` when `canCreateRecord=true`, matching the real app precondition from `RecordCreateScope`.
- Category management tests mock server-only category actions because this test validates initial client render and disabled button state, not server mutation behavior.
- Added `useActionStateEffect` so `useActionState` results are handled once per action-state object. This prevents repeated toast/refresh side effects when parent components re-render after member create/edit success.
- Audited remaining toast calls: record detail, search batch, category management, binding links, and copy actions are event/promise-handler toasts rather than render-effect toasts, so they do not share the repeated action-state issue.
- Clean-code review follow-up split mobile navigation order into `mobile-navigation-order.ts` with pure tests instead of asserting rendered HTML order.
- Clean-code review follow-up changed `PageLoading` from a variant switch that owned every page layout to a lightweight loading container plus route-selected content components. `/settings/loading.tsx` now renders only settings content skeleton inside the existing settings layout, avoiding duplicate settings shell UI.
- No Prisma schema, server action contract, auth, permission, or domain module changes were made.
- E2E coverage is still recommended for mobile viewport overflow, safe-area, and real browser rendering during Verification or a follow-up TDD pass with a running seeded database.

## Commands Run

- `corepack pnpm test src/components/layout/shared-layout.test.tsx`
  - result: pass before adding new tests; used as baseline.
- `corepack pnpm test src/components/layout/shared-layout.test.tsx src/components/ui/dialog.test.tsx src/app/category-management-panel.test.tsx`
  - first result: fail; missing `RecordCreateContext` fixture and `server-only`/category action mocks.
  - final result: pass, 3 files, 6 tests.
- Review cleanup replaced the category component HTML-regex test with `src/app/category-ordering.test.ts` and removed Tailwind-position assertions from the app shell/dialog tests.
- `corepack pnpm test src/components/layout/shared-layout.test.tsx src/components/ui/dialog.test.tsx src/app/category-ordering.test.ts`
  - final result: pass, 3 files, 8 tests.
- `corepack pnpm test src/components/layout/shared-layout.test.tsx src/components/layout/mobile-navigation-order.test.ts src/components/ui/dialog.test.tsx src/app/category-ordering.test.ts`
  - final result: pass, 4 files, 10 tests.
- `corepack pnpm type-check`
  - first result: fail; test fixture missing `capabilities`.
  - final result: pass.
- `corepack pnpm lint`
  - result: pass.

## Review Gate

- decision: ready_for_review
- reviewer_focus:
  - Confirm the TDD scope is acceptable for this implementation pass.
  - Confirm E2E mobile browser coverage can be completed in Verification or requested as an additional implementation pass.
- acceptance_signals:
  - Focused tests protect the highest-risk shared component boundaries.
  - Type-check and lint pass.
  - No unapproved behavior or package was introduced.
- unresolved_blockers:
  - Full mobile Playwright coverage still depends on local E2E setup and admin-linked settings fixture reliability.
- next_step:
  - Verification after approval.
