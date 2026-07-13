# Remove Standalone Create Record Entry

- status: done
- date: 2026-06-20
- source: .ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md

## 需求

Remove standalone create-record and records routes from navigation and URLs, making the homepage the only create-record entry point while preserving ledger creation behavior.

## 執行方式

- Existing Next.js App Router, React client state, shadcn-style dialogs/tabs, Prisma/PostgreSQL, Vitest, and Playwright foundations were reused.
  - No new framework, route foundation, schema migration, environment variable, or auth provider change was introduced.

- `RecordCreateScope` owns modal mode, open/close handlers, and post-success close/refresh/toast.
  - `RecordCreateContext` provides narrow create-record data and actions to trigger buttons and forms.
  - `buildRecordCreateData` adapts `MonthlyWorkspaceContext` into `RecordCreateData` on the server without adding duplicate data queries.
  - `CreateRecordDialog` is a controlled shell; `RecordEntryPanel` owns form submission and action-state rendering.
  - `RecordEntryPanel` is split into independent income and expense forms with local shared field primitives.
  - `PageLayout` no longer has an `overlays` slot for this modal.
  - `NativeSelect` was made full width to fix select layout drift.
  - Obsolete `month`, `returnTo`, redirect/query result, and create/result URL plumbing were removed from create-record action flow.

## 最終結果

- Sidebar no longer shows `新增` or `紀錄` for any role.
  - Homepage navigation/page title is `總覽`.
  - `/records` and `/records/new` are removed route surfaces and fall through to default not-found.
  - Homepage is the only place with `新增收入` and `新增支出`.
  - Reimbursements and recurring pages keep their workflows but expose no create-record buttons.
  - Clicking homepage create buttons opens a client-state modal without `?create=` or `?result=` URL state.
  - Browser reload closes an open create modal.
  - Create-record submit uses `useActionState`; validation and permission errors stay inline inside the modal.
  - Successful create closes the modal, refreshes server-rendered data, and shows toast feedback.
  - Mobile footer actions share the same create modal behavior and are covered by E2E.

- `local_dev` readiness passed.
  - `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm build`, and `pnpm test:e2e e2e/create-record.spec.ts` passed.
  - Targeted create-record E2E passed with 8 tests including income, fund expense, member expense, validation error, reload close, removed route not-found, homepage-only actions, and mobile footer entry.
  - Production readiness is not claimed.

## 特殊決策

- Ledger creation domain rules did not change.
  - Category validation, member-paid/fund-paid expense rules, reimbursement implications, and authorization remain in existing fund-ledger domain/server action boundaries.
  - General members still cannot create records for others; UI visibility remains helpful but server-side authorization remains the trusted guard.

- Local_dev learning uses manual review and smoke tasks rather than analytics tooling.
  - Watch whether users can find homepage create buttons, understand `/records` removal, discover mobile footer actions, and accept URL-free modal behavior.
  - Route future confusion through new Intent Intake rather than reopening this completed slice.

## Bug / 阻礙

- `prisma generate` can race if quality commands run in parallel; sequential reruns pass.
  - Manual focus-return and mobile visual scan were not separately performed; browser tests and existing dialog primitives cover functional behavior.
  - Git reported local repository housekeeping warnings about unreachable loose objects; this is not an app release blocker.
