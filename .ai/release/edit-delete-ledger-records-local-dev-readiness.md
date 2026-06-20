---
id: release-edit-delete-ledger-records-local-dev-readiness
stage: release
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-delete-ledger-records.md
  - .ai/domain-impact/edit-delete-ledger-records.md
  - .ai/spec/edit-delete-ledger-records.md
  - .ai/technical-design/edit-delete-ledger-records.md
  - .ai/implementation/edit-delete-ledger-records.md
  - .ai/verification/edit-delete-ledger-records.md
outputs:
  - local_dev_release_assessment
  - migration_readiness
  - release_checks
  - accepted_risks
trace_links:
  commits:
    - 02ba00f
    - 8d29c60
    - 2635f86
  migration:
    - prisma/migrations/20260621010000_add_ledger_record_status/migration.sql
  e2e:
    - e2e/record-edit-delete.spec.ts
reviewed_at: 2026-06-21
---

# Edit And Delete Ledger Records Local Dev Release Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_assessed
- next_gate: Learning Loop
- rationale: The edit/delete ledger record slice has passing build, type, lint, unit, schema validation, and DB-backed browser E2E coverage. The additive `LedgerRecordStatus` migration was applied successfully in the E2E database and defaults existing records to `active`.

## Release Scope

- Dashboard record detail supports edit and delete actions for authorized active records.
- Delete is a soft-delete transition to `voided`; no hard deletion is used.
- Voided records are removed from active dashboard, monthly reporting, and reimbursement calculations.
- Successful edit/delete closes dialogs, refreshes data, and shows Traditional Chinese success toasts.
- No standalone `/records` route is introduced.

## Local Dev Checks

| Check | Command / Evidence | Status |
|---|---|---|
| TypeScript | `corepack pnpm type-check` | pass |
| Unit/domain tests | `corepack pnpm test` | pass, 29 files / 140 tests |
| Lint | `corepack pnpm lint` | pass |
| Prisma schema | `corepack pnpm db:validate` | pass |
| Production build | `corepack pnpm build` | pass; route list has no `/records` route |
| DB-backed E2E | `corepack pnpm test:e2e` | pass, 37 tests |
| Focused edit/delete E2E | `e2e/record-edit-delete.spec.ts` | pass; covers edit toast, delete toast, dialog close, voided record removal, and delete footer spacing |
| Migration application | `test:e2e` setup `prisma migrate deploy` | pass; `20260621010000_add_ledger_record_status` applied to `home_fund_e2e` |

## Runtime And Config

- Local dev continues to require Docker PostgreSQL and `DATABASE_URL`.
- No new external services, secrets, OAuth scopes, callbacks, storage buckets, or third-party integrations are required for this slice.
- Existing auth and role/capability configuration remains unchanged.
- Controlled E2E auth remains local/E2E-only.

## Migration Readiness

- Migration creates `LedgerRecordStatus` enum with `active` and `voided`.
- Migration adds `LedgerRecord.status` with `NOT NULL DEFAULT 'active'`, so existing local records become active automatically.
- Migration adds active-record query indexes for household/month and reimbursement access patterns.
- Rollback for local_dev can reset/recreate the local database from seed if needed. Production rollback is not assessed.

## Smoke Steps For Local Review

1. Apply local migrations with `DATABASE_URL=... corepack pnpm db:deploy`.
2. Start local app with `corepack pnpm dev`.
3. Open `/` for a month containing active records.
4. Open an owned active record, edit name/amount/date/category/note, and confirm `紀錄已更新` plus refreshed list values.
5. Open the edited record, confirm delete, and confirm `紀錄已刪除`, dialog close, and active list removal.
6. Check `/reimbursements?month=YYYY-MM` for reimbursement totals after voiding member-paid expenses.

## Accepted Local Dev Risks

- Full audit/history UI for voided records is out of scope.
- Reimbursement reversal remains out of scope; reimbursed member-paid expenses are blocked from edit/delete.
- E2E covers one successful browser edit/delete path. Admin-specific browser mutation and reimbursed blocked browser cases can be added later if those paths become regression-prone.
- Quality scripts that run `prisma generate` should be run sequentially; parallel execution can race on generated Prisma directories.

## Not Production Ready

Production or staging release still needs:

- Target database and migration rollout/rollback plan.
- Backup/restore expectation before applying the `LedgerRecord.status` migration.
- Production auth smoke for owner/admin/finance-manager edit/delete paths.
- Observability/logging for failed edit/delete attempts.
- Audit/history product decision for viewing voided records.
- Reimbursement reversal design before allowing edits/deletes of reimbursed expenses.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - confirm local migration/readiness checks are sufficient
  - confirm local smoke path for edit/delete and reimbursement recalculation
  - confirm Learning Loop is the next gate
- unresolved_blockers:
  - None for local_dev release readiness.
- recommended_next_gate:
  - learning-loop
- stop_condition: Wait for explicit user approval before starting Learning Loop.
