---
id: implementation-edit-delete-ledger-records
stage: tdd-implementation
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/edit-delete-ledger-records.md
  - .ai/technical-design/edit-delete-ledger-records.md
  - .ai/prototype/edit-delete-ledger-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/edit-delete-ledger-records.md
outputs:
  - ledger_record_update_action
  - ledger_record_void_action
  - active_record_read_model_filtering
  - focused_test_evidence
trace_links:
  schema:
    - prisma/schema.prisma
    - prisma/migrations/20260621010000_add_ledger_record_status/migration.sql
  app:
    - src/app/(app)/page.tsx
    - src/app/record-list-detail.tsx
    - src/app/ledger-record-actions.ts
    - src/app/ledger-record-form.ts
    - src/app/home-dashboard-data-source.ts
  domain:
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/fund-ledger/ledger-record-corrections.ts
    - src/modules/fund-ledger/ledger-record-command.ts
    - src/modules/reporting/monthly-report.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/reimbursement/reimbursement-table.ts
  tests:
    - src/modules/fund-ledger/ledger-records.test.ts
    - src/modules/fund-ledger/ledger-record-command.test.ts
    - src/modules/fund-ledger/ledger-record-corrections.test.ts
    - src/modules/reporting/monthly-report.test.ts
    - src/modules/reimbursement/reimbursement-table.test.ts
    - src/app/home-dashboard-data-source.test.ts
    - src/app/ledger-record-form.test.ts
reviewed_at: 2026-06-21
---

# Edit And Delete Ledger Records Implementation

## Summary

- Added `LedgerRecordStatus` with active/voided lifecycle persistence and migration defaults.
- Extended ledger record types, creation, update, and void commands so delete uses `voided` semantics instead of physical deletion.
- Enforced edit/delete authorization, voided-record rejection, and reimbursed-expense blocking in the domain/persistence boundary.
- Added edit and delete server actions with form parsing, validation errors, path revalidation, and Traditional Chinese success messages.
- Replaced prototype-only edit/delete behavior in the dashboard record detail with real action-state forms.
- Successful edit/delete closes the record dialog stack, refreshes data, and shows `紀錄已更新` or `紀錄已刪除`.
- Dashboard, monthly reporting, and reimbursement read models now exclude voided records from active calculations.

## TDD Evidence

Tests were added or updated for the behavior before and during implementation:

- `src/modules/fund-ledger/ledger-records.test.ts`
- `src/modules/fund-ledger/ledger-record-command.test.ts`
- `src/modules/fund-ledger/ledger-record-corrections.test.ts`
- `src/modules/reporting/monthly-report.test.ts`
- `src/modules/reimbursement/reimbursement-table.test.ts`
- `src/app/home-dashboard-data-source.test.ts`
- `src/app/ledger-record-form.test.ts`

Verification commands run in this implementation gate:

- `corepack pnpm test src/modules/fund-ledger/ledger-records.test.ts src/modules/fund-ledger/ledger-record-command.test.ts src/modules/fund-ledger/ledger-record-corrections.test.ts src/modules/reporting/monthly-report.test.ts src/modules/reimbursement/reimbursement-table.test.ts src/app/home-dashboard-data-source.test.ts`
  - result: passed
- `corepack pnpm test src/app/ledger-record-form.test.ts`
  - result: passed
- `corepack pnpm type-check`
  - result: passed
- `corepack pnpm test`
  - result: passed, 29 files / 140 tests
- `corepack pnpm lint`
  - result: passed

## Implemented Contracts

- Owners and admins can edit/delete active non-reimbursed records.
- Finance managers can edit active non-reimbursed records and delete only their own active records.
- General members cannot mutate another member's records through direct command/action paths.
- Reimbursed member-paid expenses are blocked from edit/delete for MVP.
- Delete marks the record `voided`, keeps persisted audit identity, and excludes the record from active dashboard/reporting/reimbursement read models.
- Edit supports name, amount, date, note, category, source member, payment source, and payer member.
- UI action visibility mirrors domain authorization for usability, while server/domain authorization remains authoritative.
- Delete cancellation returns to detail without mutation or success toast.

## Known Gaps For Verification

- Browser E2E was not run during this implementation gate.
- Manual focus-return and mobile dialog clipping checks should be completed in Verification.
- Local database migration application should be confirmed during Verification before any release gate.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - inspect edit form defaults and validation messages from the dashboard detail modal
  - inspect delete confirmation copy, close-all behavior, and success toast
  - verify voided records disappear from dashboard and reimbursement calculations after refresh
- acceptance_signals:
  - domain, action parsing, type-check, full unit suite, and lint checks pass
  - delete uses soft-delete / `voided` semantics
  - edit/delete success toasts are present and dialogs close after success
- unresolved_blockers:
  - Browser E2E and manual responsive/focus verification pending.
- recommended_next_gate:
  - verification
- stop_condition: Wait for explicit user approval before moving to Verification.
