---
id: remove-standalone-create-record-entry
stage: verification
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/remove-standalone-create-record-entry.md
  - .ai/technical-design/remove-standalone-create-record-entry.md
  - .ai/implementation/remove-standalone-create-record-entry.md
outputs:
  - verification_result
  - test_evidence
  - residual_risks
trace_links:
  commit:
    - 7ff09c4 Refactor homepage record creation
  tests:
    - src/app/dashboard-navigation.test.ts
    - src/app/ledger-record-form.test.ts
    - src/components/layout/shared-layout.test.tsx
    - e2e/create-record.spec.ts
    - e2e/permission-matrix.spec.ts
reviewed_at: 2026-06-20
---

# Remove Standalone Create Record Entry Verification

## Verification Summary

- result: pass_with_minor_test_gap
- supported_release_target: local_dev
- verified_commit: `7ff09c4 Refactor homepage record creation`
- scope: IA and form-state change only; no schema, auth provider, OAuth callback, or production operations change.

The implemented behavior matches the approved product direction: create-record entry is homepage-only, modal state is client-local instead of URL-driven, `/records` and `/records/new` resolve through the default not-found page, and record creation still uses the existing ledger domain command and authorization rules.

## Acceptance Criteria Check

| Acceptance area | Status | Evidence |
|---|---|---|
| Sidebar removes `新增` and `紀錄` | Pass | `src/app/dashboard-navigation.test.ts`; static search found only negative assertions. |
| Homepage keeps `新增收入` / `新增支出` | Pass | `e2e/create-record.spec.ts` homepage-only entry test. |
| Reimbursements and recurring pages remove create buttons | Pass | `e2e/create-record.spec.ts` homepage-only entry test. |
| Modal opens without URL mutation | Pass | `e2e/create-record.spec.ts` checks no `create` / `result` params after open. |
| Refresh closes modal | Pass | `e2e/create-record.spec.ts` reload case. |
| `/records` and `/records/new` removed | Pass | `e2e/create-record.spec.ts` not-found case; `src/app/(app)/records` has no route files. |
| Submission uses action state, not redirect/query feedback | Pass | `src/app/record-entry-panel.tsx` uses `useActionState`; `src/app/ledger-record-actions.ts` returns `ActionState`. |
| Validation errors stay inline in modal | Pass | `e2e/create-record.spec.ts` missing category case. |
| Success closes modal, refreshes data, shows feedback | Pass | `e2e/create-record.spec.ts` income/expense creation cases; `RecordCreateScope` handles close, `router.refresh()`, and toast. |
| Cross-member authorization remains server-side | Pass | Existing `e2e/permission-matrix.spec.ts` coverage and unchanged ledger command authorization boundary. |
| Desktop and mobile create controls share behavior | Partial | Shared `RecordCreateActions` / `RecordCreateScope` implementation covers both surfaces; a dedicated mobile viewport E2E is not yet present. |

## Test Evidence

Latest post-refactor checks:

- `corepack pnpm type-check`
  - passed.
- `corepack pnpm lint`
  - passed.
- `pnpm test:e2e e2e/create-record.spec.ts`
  - passed: 7 browser tests.
- `git diff --check`
  - passed before commit.

Implementation evidence also recorded:

- `corepack pnpm test src/app/dashboard-navigation.test.ts src/app/ledger-record-form.test.ts`
  - passed: 2 files / 5 tests.
- `corepack pnpm test src/components/layout/shared-layout.test.tsx`
  - passed: 1 file / 2 tests.
- `pnpm test:e2e e2e/create-record.spec.ts e2e/permission-matrix.spec.ts`
  - passed: 10 browser tests.
- `corepack pnpm test`
  - passed: 31 files / 139 tests during implementation.
- Wider E2E implementation runs passed up to 29 browser tests, including dashboard, auth-session, admin category management, admin member invitations, permission matrix, and create-record flows.

Known command note: parallel `prisma generate` through simultaneous pnpm checks can produce transient `EEXIST`; sequential reruns passed.

## Code Review Notes

- `RecordCreateScope` now owns only modal mode/open/close and post-success handling. This keeps client state local to the homepage create entry surface.
- `buildRecordCreateData` is a server-side adapter that narrows `MonthlyWorkspaceContext` into the create-record data contract without adding another data query path.
- `CreateRecordDialog` is a controlled shell; form data and submission live in `RecordEntryPanel`.
- `RecordEntryPanel` is split into independent income and expense forms, with shared local field primitives and a shared action-state shell.
- `canCreateOwnRecords` is enforced at the homepage trigger boundary. Server-side authorization remains the trusted guard for manipulated form submissions.
- `month` and `returnTo` create-form plumbing were removed from create-record action state because modal state is no longer URL/redirect driven.

## Prototype And Spec Gaps

- Closed: standalone create route removal.
- Closed: sidebar create/records removal.
- Closed: no URL-state modal behavior.
- Closed: homepage-only create entry, including removal from reimbursement and recurring pages.
- Closed: validation error stays in modal.
- Closed: success closes modal and refreshes server-rendered data.
- Remaining automated coverage gap: the Behavior Spec asked for one mobile viewport check for the footer action bar. The implementation uses the same scoped actions for mobile and desktop, but no dedicated mobile viewport E2E was added in this slice.

## Domain And Release Check

- Ledger creation command, category validation, and authorization invariants remain in the existing fund-ledger domain layer.
- No database schema migration was introduced.
- No auth/session/OAuth configuration was changed.
- No production readiness claim is made. This verification supports `local_dev` only.

## Review Gate

- decision: pass_with_minor_test_gap
- acceptance_signals:
  - Homepage create flows pass browser tests for income, fund-paid expense, member-paid expense, validation error, reload close, route not-found, and homepage-only entry.
  - Type-check and lint pass.
  - Worktree was clean after commit `7ff09c4`.
- residual_risks:
  - Dedicated mobile viewport E2E for footer action bar remains missing.
  - Manual focus-return and mobile visual scan were not performed in this verification pass.
- recommended_next_gate:
  - Target-Aware Release for `local_dev` if this change is being prepared for a demo or preview handoff.
  - Otherwise, address the mobile E2E gap as a small follow-up before broader release hardening.
