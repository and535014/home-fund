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
    - src/app/record-create.tsx
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
- Follow-up implementation refinement:
  - replaced the temporary `window` custom-event modal opener with scoped React state in `RecordCreateScope`.
  - passed a narrow `RecordCreateData` object from the homepage instead of the full monthly workspace context.
  - removed obsolete create/result query parsing and `returnTo` create-form plumbing.
  - removed the unused `PageLayout` `overlays` slot and kept dialog rendering inside the record-create scope.
  - moved `MobileActionBar` ownership back to the homepage and reused one `RecordCreateActions` component for both desktop header and mobile footer buttons.
  - kept the create action button labels consistent as `新增收入` and `新增支出` across desktop and mobile entry points.
  - removed the redundant `Home` prefix from record-create component names and file path.
  - removed the exported `RecordCreateDialog` adapter and rendered `CreateRecordDialog` directly from `RecordCreateScope`.
  - replaced the record-entry form's local select styling with the shared `NativeSelect` component and made the shared native-select wrapper full width to prevent form select layout drift.
  - changed the expense payment-source control from a select to the shared tab UI while preserving the hidden `paymentSource` form contract.
  - reordered income and expense form fields to put date/category/member before amount/name/note, with date defaulting to today.
  - refactored `RecordEntryPanel` field rendering to config-driven field order arrays plus a single field renderer, with field keys, entry kinds, entry modes, and payment sources defined by const objects.
  - moved record-entry field visibility and disabled rules into field config instead of branching in the main render path.
  - moved record-entry labels, placeholders, default values, input/select control metadata, options, required flags, and hidden disabled submit values into field config; only the payment-source tab remains a special renderer.
  - moved create-record data access into record-create context so `CreateRecordDialog` is only a shell and `RecordEntryPanel` no longer receives pass-through props.
  - reorganized record-entry config into shared field definitions and a single per-mode `RECORD_ENTRY_FORM_CONFIG`, so income and expense data are not split across parallel arrays and render branches.
  - kept `canCreateOwnRecords` at the homepage entry-point boundary instead of passing it through record-create context.
  - removed obsolete `month` plumbing from record-create data, form hidden inputs, parser results, and create action success payload.
  - split `RecordEntryPanel` into independent income and expense forms, with shared form shell and field primitives kept local to the record-entry module instead of a cross-mode config renderer.
  - changed `RecordEntryPanel` local types to derive from `RecordCreateData` instead of homepage dashboard data-source types.
  - extracted `buildRecordCreateData` as the server-side adapter from monthly workspace context to the create-record data contract.
  - renamed the create-success callback to `handleRecordCreated` inside `RecordCreateScope` and `onRecordCreated` in context/form props for clearer intent.

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
| Create triggers | `src/app/record-create.tsx`, `src/app/(app)/page.tsx`, `src/app/(app)/reimbursements/page.tsx`, `src/app/(app)/recurring/page.tsx` | Replaced href/query links with scoped client state; reused one create action component for desktop and mobile entry points; removed create actions from reimbursement/recurring pages. |
| Dialog | `src/app/create-record-dialog.tsx` | Made dialog controlled by client open/mode state. |
| Layout | `src/components/layout/page-layout.tsx`, `src/components/layout/shared-layout.test.tsx` | Removed the unused `overlays` slot from the shared page layout API. |
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
- `corepack pnpm type-check`
  - passed after homepage scoped state refactor.
- `corepack pnpm lint`
  - passed after homepage scoped state refactor.
- `pnpm test:e2e e2e/create-record.spec.ts`
  - passed: 7 browser tests after replacing the window event opener with `RecordCreateScope`.
- `corepack pnpm test src/components/layout/shared-layout.test.tsx`
  - passed: 1 file / 2 tests after removing `PageLayout` overlays.
- `corepack pnpm type-check`
  - passed after removing `PageLayout` overlays.
- `corepack pnpm lint`
  - passed after removing `PageLayout` overlays.
- `pnpm test:e2e e2e/create-record.spec.ts`
  - passed: 7 browser tests after removing `PageLayout` dialog ownership.
- `corepack pnpm type-check`
  - passed after consolidating create-record action buttons.
- `corepack pnpm lint`
  - passed after consolidating create-record action buttons.
- `pnpm test:e2e e2e/create-record.spec.ts`
  - passed: 7 browser tests after moving `MobileActionBar` ownership back to the homepage.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after fixing create action labels to the same desktop/mobile text.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after renaming `HomeRecordCreate*` to `RecordCreate*`.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after moving `CreateRecordDialog` rendering into `RecordCreateScope`.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after switching record-entry selects to the shared `NativeSelect`.
- `corepack pnpm test src/app/ledger-record-form.test.ts`, `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after replacing the expense payment-source select with tabs.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after reordering income and expense fields.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after refactoring `RecordEntryPanel` to config-driven field rendering.
- `corepack pnpm lint`, `corepack pnpm type-check`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after changing record-entry field keys to a const-derived type.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after changing entry kinds, entry modes, and payment sources to const-derived types.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after moving record-entry field visibility and disabled rules into config.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after moving labels, placeholders, options, and input/select metadata into field config.
- `corepack pnpm lint`, `corepack pnpm type-check`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after moving `RecordEntryPanel` data access to record-create context.
- `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after reorganizing income/expense data into `RECORD_ENTRY_FORM_CONFIG`.
- `corepack pnpm lint`, `corepack pnpm type-check`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after moving `canCreateOwnRecords` out of `RecordCreateData`.
- `corepack pnpm test src/app/ledger-record-form.test.ts`, `corepack pnpm type-check`, `corepack pnpm lint`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after removing month from create-record form/action plumbing.
- `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm test src/app/ledger-record-form.test.ts`, and `pnpm test:e2e e2e/create-record.spec.ts`
  - passed after splitting `RecordEntryPanel` into independent income and expense forms.
- `corepack pnpm type-check` and `corepack pnpm lint`
  - passed after deriving record-entry types from `RecordCreateData`.
- `corepack pnpm lint` and `corepack pnpm type-check`
  - passed after extracting `buildRecordCreateData`; an initial parallel type-check attempt hit the known transient Prisma generate `EEXIST` race and passed when rerun sequentially.
- `corepack pnpm type-check` and `corepack pnpm lint`
  - passed after renaming the record-create success callback.

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
