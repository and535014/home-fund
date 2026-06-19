---
id: remove-standalone-create-record-entry
stage: implementation
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/remove-standalone-create-record-entry.md
  - .ai/technical-design/remove-standalone-create-record-entry.md
outputs:
  - production_code_changes
  - test_first_evidence
  - verification_handoff
trace_links:
  tests:
    - src/app/dashboard-navigation.test.ts
    - e2e/create-record.spec.ts
    - e2e/permission-matrix.spec.ts
  changed_files:
    - src/app/dashboard-navigation.ts
    - src/app/ledger-record-actions.ts
    - src/app/record-create-actions.tsx
    - src/app/create-record-dialog.tsx
    - src/app/record-entry-panel.tsx
    - src/app/(app)/records/page.tsx
    - src/app/(app)/records/new/page.tsx
reviewed_at: 2026-06-20
---

# Remove Standalone Create Record Entry Implementation

## Scope Revision

- New user decision after implementation: `/records` should also be removed because it is too similar to the homepage/monthly report surface.
- Additional user decision after implementation: homepage should be the only create-record entry point, so `/reimbursements` and `/recurring` should not show `新增收入` or `新增支出`.
- Revision completed:
  - removed `/records` route and sidebar item.
  - removed homepage link/copy that pointed to `/records`.
  - updated E2E routes that previously used `/records`.
  - removed `revalidatePath("/records")` from create-record action.
  - removed create-record actions from reimbursement and recurring pages.

## Implementation Summary

- Removed the standalone sidebar `新增` navigation item for all roles.
- Removed the standalone sidebar `紀錄` navigation item for all roles.
- Renamed the homepage sidebar item and page title from `月報` / `家庭資金總覽` to `總覽`.
- Deleted `src/app/(app)/records/new/page.tsx`, so `/records/new` falls through to the default not-found route.
- Deleted `src/app/(app)/records/page.tsx`, so `/records` falls through to the default not-found route.
- Replaced query-link create-record entry points with client-state button triggers.
- Limited create-record entry points to the homepage only.
- Converted create-record submission from redirect/query feedback to the shared `ActionState` / `useActionState` pattern.
- Successful create closes the modal, refreshes page data, and shows success toast feedback.
- Validation and permission failures stay inline inside the modal without URL mutation.

## TDD Evidence

1. Added `src/app/dashboard-navigation.test.ts` before implementation; it initially failed because navigation still returned `新增` with `/?create=income`.
2. Updated `e2e/create-record.spec.ts` and `e2e/permission-matrix.spec.ts` to open modals through page-local buttons instead of query deep links.
3. Implemented the minimum code to satisfy the new navigation, modal, URL, action-state, success-close, and not-found behavior.
4. Adjusted the not-found E2E selector after the route deletion produced the expected default 404 page.

## Code Changes

| Area | Files | Change |
|---|---|---|
| Navigation | `src/app/dashboard-navigation.ts`, `src/app/dashboard-navigation.test.ts` | Removed standalone create navigation and added unit coverage. |
| Route | `src/app/(app)/records/page.tsx`, `src/app/(app)/records/new/page.tsx` | Deleted duplicate records route and create redirect route. |
| Create triggers | `src/app/record-create-actions.tsx`, `src/app/(app)/page.tsx`, `src/app/(app)/reimbursements/page.tsx`, `src/app/(app)/recurring/page.tsx` | Replaced href/query links with client button triggers on homepage only; removed create actions from reimbursement/recurring pages. |
| Dialog | `src/app/create-record-dialog.tsx` | Made dialog controlled by client open/mode state. |
| Form/action | `src/app/record-entry-panel.tsx`, `src/app/ledger-record-actions.ts` | Switched to `useActionState`, typed action results, inline errors, success close/refresh/toast. |
| Browser coverage | `e2e/create-record.spec.ts`, `e2e/permission-matrix.spec.ts` | Covered clean URL, reload close, success close, validation/permission inline errors, and `/records/new` not-found. |
| Browser coverage | `e2e/dashboard.spec.ts`, `e2e/recurring-reminder-confirmation.spec.ts` | Covered removed records link and moved recurring confirmation post-check back to homepage. |

## Verification Commands Run

- `corepack pnpm test src/app/dashboard-navigation.test.ts`
  - expected initial failure before implementation: sidebar still returned `新增`.
- `corepack pnpm test src/app/dashboard-navigation.test.ts src/app/ledger-record-form.test.ts`
  - passed: 2 files / 5 tests.
- `corepack pnpm type-check`
  - passed after regenerating stale Next route types.
- `corepack pnpm lint`
  - passed.
- `pnpm test:e2e e2e/create-record.spec.ts e2e/permission-matrix.spec.ts`
  - passed: 10 browser tests.
- `pnpm test:e2e e2e/create-record.spec.ts e2e/dashboard.spec.ts e2e/recurring-reminder-confirmation.spec.ts`
  - passed: 11 browser tests.
- `pnpm test:e2e e2e/create-record.spec.ts e2e/dashboard.spec.ts e2e/admin-category-management.spec.ts e2e/admin-member-invitations.spec.ts e2e/auth-session.spec.ts e2e/permission-matrix.spec.ts`
  - passed: 29 browser tests.
- `corepack pnpm test`
  - passed: 31 files / 139 tests.
- `corepack pnpm test && corepack pnpm lint && corepack pnpm type-check`
  - passed sequentially. Parallel runs can race Prisma generate output.

## Notes

- `corepack pnpm type-check` initially failed because stale `.next/dev/types` still referenced deleted `/records/new`; `corepack pnpm exec next typegen` did not clear that stale dev validator, so `.next/dev/types` was removed and regenerated as local build output.
- A concurrent `type-check` / `lint` / `test` run produced a transient Prisma `EEXIST` generate race. Re-running `type-check` alone passed.
- `next-env.d.ts` remains a pre-existing/generated local modification and is not part of this implementation.

## Review Gate

- decision: awaiting_verification
- reviewer_focus:
  - Confirm implementation matches Behavior Spec and Technical Design.
  - Confirm no URL-state create modal behavior remains.
  - Confirm ledger creation domain rules remain unchanged.
- acceptance_signals:
  - Targeted E2E and full unit tests pass.
  - Type-check and lint pass.
- unresolved_blockers:
  - None for Verification.
- next_step:
  - Verification
