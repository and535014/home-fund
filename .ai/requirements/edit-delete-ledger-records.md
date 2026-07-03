# Edit And Delete Ledger Records

- status: done
- date: 2026-06-21
- source: .ai/archive/archive-edit-delete-ledger-records-2026-06-21.md

## 需求

Let authorized household users correct or delete existing income/expense ledger records from the dashboard record detail flow while preserving role boundaries and accurate financial totals.

## 執行方式

- Existing Next.js App Router, React, Prisma/PostgreSQL, Tailwind, shadcn-style UI components, Better Auth, Vitest, and Playwright foundations were reused.
  - No new framework, component library, auth provider, analytics provider, or monitoring provider was added.

- Prisma gained `LedgerRecordStatus` enum with `active` and `voided`.
  - `LedgerRecord.status` is `NOT NULL DEFAULT active`, with active-query indexes for household/month and reimbursement access patterns.
  - `updateLedgerRecordInDatabase` and `voidLedgerRecordInDatabase` load active records inside transactions, run domain validation, and persist update/void transitions.
  - Shared `isActiveLedgerRecord` protects reporting and reimbursement read models from voided records.
  - Server actions parse edit/delete forms, require authenticated household access, call domain/persistence commands, and revalidate `/` and `/reimbursements`.
  - Edit/delete client forms await server action results and run success handling before refresh/unmount so toasts are not lost.
  - Form-wrapped dialog footers use explicit spacing so buttons do not touch content.
  - Focused Playwright E2E covers edit success, delete success, toast feedback, dialog close, active-list removal, and delete modal spacing.

## 最終結果

- Edit/delete actions are surfaced from the existing dashboard record detail modal on `/`.
  - No standalone `/records` route was restored.
  - Owners and admins can edit/delete active non-reimbursed records.
  - Finance managers can edit active non-reimbursed records and can delete only records they created.
  - General members cannot edit/delete another member's record through UI or direct server action paths.
  - Reimbursed member-paid expenses are blocked for MVP until reimbursement reversal exists.
  - Edit supports name, amount, date, category, note, payment source, payer member, and income source member.
  - Delete uses user-facing `刪除` copy, destructive confirmation, and domain-level `voided` semantics.
  - Successful edit/delete closes dialogs, refreshes page data, and shows `紀錄已更新` / `紀錄已刪除`.
  - Voided records disappear from active dashboard record lists, monthly totals, category summaries, and reimbursement calculations.

- `local_dev` readiness passed.
  - Evidence includes `corepack pnpm type-check`, `corepack pnpm test` with 29 files / 140 tests, `corepack pnpm lint`, `corepack pnpm db:validate`, `corepack pnpm build`, and full `corepack pnpm test:e2e` with 37 tests.
  - E2E setup applied migration `20260621010000_add_ledger_record_status` successfully to the E2E database.
  - Production readiness is not claimed.

## 特殊決策

- Fund Ledger owns correction and voiding commands.
  - Identity and Access remains the authority for `edit_ledger_record` and `delete_ledger_record`.
  - Delete is a voiding transition, not physical hard deletion.
  - Existing reimbursement batch history keeps persisted trace to any record that later becomes voided.
  - Reporting and Reimbursement consume active-only ledger records.
  - Reimbursed member-paid expenses are blocked from edit/delete in MVP because reversal is not modeled.

- Local_dev learning uses manual review and regression checks, not analytics tooling.
  - Watch whether users can find edit/delete in record detail, trust destructive confirmation, understand active removal/voided trace, accept reimbursed-expense blocking, and see coherent reimbursement/reporting changes.
  - Route future issues through new Intent Intake.

## Bug / 阻礙

- Full audit/history UI for voided records is out of scope.
  - Reimbursement reversal remains out of scope; reimbursed member-paid expenses stay blocked.
  - E2E covers one successful browser edit/delete path. Admin-specific browser mutation and reimbursed blocked browser cases can be added later if those paths become regression-prone.
  - Quality scripts that run `prisma generate` should be run sequentially to avoid generated-client directory races.
  - E2E depends on Docker Desktop and local PostgreSQL availability.
