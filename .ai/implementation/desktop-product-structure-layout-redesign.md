---
id: desktop-product-structure-layout-redesign
stage: tdd-implementation
status: accepted
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/desktop-product-structure-layout-redesign.md
  - .ai/technical-design/desktop-product-structure-layout-redesign.md
  - commit:d8fb50a
  - commit:2e49955
  - commit:1470e88
outputs:
  - implementation_evidence
  - test_evidence
trace_links:
  implementation_commit:
    - d8fb50a
  artifact_commits:
    - 2e49955
    - 1470e88
  primary_files:
    - src/app/(app)/page.tsx
    - src/app/(app)/search/page.tsx
    - src/app/(app)/reimbursements/page.tsx
    - src/app/(app)/settings/layout.tsx
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-sidebar-nav.tsx
    - src/components/layout/page-layout.tsx
    - src/app/dashboard-charts.tsx
    - src/app/month-picker-dialog.tsx
    - src/app/record-entry-panel.tsx
reviewed_at: 2026-06-20
---

# Desktop Product Structure Layout Redesign Implementation

## Implementation Summary

The accepted production-stack prototype in `d8fb50a Refine desktop app layout prototype` is the implementation for this slice. This TDD gate records the evidence and checks needed to treat that prototype as the current production behavior for `local_dev`.

Implemented behavior:

- Replaced top-level authenticated IA with `總覽`, `搜尋`, permission-gated `退款`, and `設定`.
- Converted the primary sidebar to icon-only navigation with a primary sidebar-footer `新增紀錄` action.
- Added `/search` placeholder and changed `/reimbursements` to a permission-gated placeholder.
- Moved members/categories under `/settings/*`, added settings sidebar, and redirected `/settings` to `/settings/account`.
- Removed recurring reminder app/module/test code from the active app surface.
- Reworked overview dashboard layout with Recharts trend and expense-category charts.
- Added responsive chart container behavior and text-only expense-category empty state.
- Split month switching into toolbar and dialog components with shared Dialog portal/backdrop behavior.
- Reworked create-record modal around line tabs, custom category radio grid, and the three approved record types.
- Preserved existing ledger creation validation and role-aware permissions.

## TDD Notes

- This slice had iterative production-stack prototype changes before the formal spec/design artifacts were backfilled.
- Test hardening happened during the implementation iteration and is recorded here as accepted risk for this migrated workflow sequence.
- Follow-up implementation after the failed verification pass updated stale E2E coverage, fixed chart measurement to avoid browser-level Recharts sizing warnings, and aligned the create-record member field label with the approved copy.

## Verification Commands

Commands run after `1470e88`:

```sh
corepack pnpm lint
corepack pnpm type-check
corepack pnpm test src/app/dashboard-navigation.test.ts src/components/layout/shared-layout.test.tsx src/app/ledger-record-form.test.ts src/app/home-dashboard-data-source.test.ts src/app/home-access.test.ts src/modules/reporting/monthly-report.test.ts src/modules/identity-access/access-hints.test.ts src/modules/identity-access/authorization.test.ts src/modules/identity-access/member-management.test.ts src/auth/current-member-data-source.test.ts
corepack pnpm exec playwright test e2e/admin-category-management.spec.ts e2e/create-record.spec.ts e2e/permission-matrix.spec.ts --reporter=line
corepack pnpm test:e2e
```

Results:

- `corepack pnpm lint`: passed.
- `corepack pnpm type-check`: passed.
- focused Vitest suite: 10 files passed, 43 tests passed.
- targeted Playwright run for updated admin category, create-record, and permission specs: 16 passed.
- full Playwright E2E suite: 29 passed.

## Acceptance Mapping

| Spec Area | Implementation Evidence |
|---|---|
| Primary IA and sidebar | `dashboard-navigation.ts`, `authenticated-layout.tsx`, `authenticated-sidebar-nav.tsx`, `record-create-sidebar-button.tsx` |
| Page shell scroll ownership | `page-layout.tsx`, `authenticated-layout.tsx`, settings layout |
| Search/reimbursement placeholders | `/search/page.tsx`, `/reimbursements/page.tsx` |
| Settings redirect and nested admin pages | `/settings/page.tsx`, `/settings/layout.tsx`, `/settings/members`, `/settings/categories` |
| Overview dashboard and month switcher | `/page.tsx`, `month-switcher.tsx`, `month-picker-dialog.tsx` |
| Charts and empty states | `dashboard-charts.tsx` |
| Create-record modal layout | `create-record-dialog.tsx`, `record-entry-panel.tsx` |
| Recurring app/module removal | deleted `src/modules/recurring-schedule/*` and recurring app action/panel files |

## Known Gaps

- Visual screenshot review is still manual.
- Prisma schema/migrations/seed still contain recurring objects and need a separate migration slice if database cleanup is desired.
- Reimbursement settlement workflow is intentionally deferred.
- Search remains placeholder-only.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm the committed prototype is acceptable as this slice's implementation baseline.
  - Confirm the verification evidence is sufficient before moving to Verification gate.
  - Confirm remaining gaps are acceptable for `local_dev`.
- unresolved_blockers:
  - None for Verification after approval.
- recommended_next_gate:
  - Verification
- approval_evidence:
  - User requested commit and next step after implementation evidence was drafted.
