---
id: implementation-csv-import-financial-records
stage: tdd-implementation
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/csv-import-financial-records.md
  - .ai/technical-design/csv-import-financial-records.md
  - .ai/prototype/csv-import-financial-records.md
outputs:
  - tested_implementation
  - migration
  - implementation_evidence
trace_links:
  production_route:
    - /settings/import
  server_actions:
    - src/app/csv-import-actions.ts
  client_components:
    - src/app/(app)/settings/import/csv-import-panel.tsx
  domain_modules:
    - src/modules/fund-ledger/ledger-import.ts
    - src/modules/fund-ledger/ledger-import-command.ts
  tests:
    - src/modules/fund-ledger/ledger-import.test.ts
    - src/modules/fund-ledger/ledger-import-command.test.ts
    - src/modules/identity-access/authorization.test.ts
    - src/modules/identity-access/access-hints.test.ts
reviewed_at: 2026-06-25
---

# CSV Import Financial Records Implementation

## Summary

- Replaced the prototype CSV import component with a production-backed `/settings/import` flow.
- Added dedicated `import_ledger_records` authorization and `canImportLedgerRecords` access hint.
- Added server-side CSV preview and confirmation actions.
- Added ledger CSV parser/validator with exact header, row validation, member/category matching, row fingerprints, and duplicate detection.
- Added transactional confirm command that creates ordinary `LedgerRecord` rows plus import audit records.
- Added `LedgerImportBatch` and `LedgerImportRow` Prisma schema and migration.
- Kept reimbursement payment CSV import unsupported.

## TDD Evidence

Tests were added before implementation for:

- authorization and access hints.
- approved CSV header and row parsing.
- invalid/unsupported row validation.
- duplicate rows being counted instead of silently removed.
- preview creating no records.
- confirm creating ledger records and audit rows.
- duplicate summary and removed-row behavior.

## Implementation Notes

- Preview returns a signed `previewToken`; confirm verifies the token and revalidates server-side before writing.
- Raw CSV is not stored in the database.
- Confirm writes one import batch in a transaction, imports valid active rows, audits invalid active rows as failed, and audits removed rows as skipped.
- Duplicate-only rows remain importable and are counted in the preview footer.
- Removed rows are recorded as skipped audit rows.
- Imported member-paid expenses become `refundable`; fund-paid expenses become `not_refundable`; income uses `not_applicable`.
- The client can change member/category mappings and sends those overrides back to confirmation.
- The preview table can sort visible rows by CSV row number, type, date, amount, and status without changing the import payload.
- The preview layout fills the available viewport height after a file is selected, with the table body scrolling inside the preview area.
- Member/category mapping changes trigger server re-preview so row status, summary counts, and import availability stay aligned with confirmation validation.
- The import button remains enabled when at least one active row is importable, allowing partial success when other active rows still need handling.
- The completion toast uses final server confirmation counts in success, failure, skipped order instead of preview counts.

## Verification Commands

- `corepack pnpm vitest run src/modules/fund-ledger/ledger-import-command.test.ts src/modules/fund-ledger/ledger-import.test.ts src/modules/identity-access/authorization.test.ts src/modules/identity-access/access-hints.test.ts`
- `corepack pnpm db:format`
- `corepack pnpm db:validate`
- `corepack pnpm lint`
- `corepack pnpm type-check`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm test:e2e e2e/csv-import.spec.ts`

All commands passed.

## Known Gaps

- Amount parsing is strict and does not accept thousands separators.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm strict amount/header behavior is acceptable.
  - Confirm import audit tables are sufficient for local_dev traceability.
  - Confirm targeted CSV import E2E coverage is sufficient for local_dev.
- must_check:
  - Local database must run the new Prisma migration before manual browser testing.
  - Reimbursement payment import remains unsupported.
- acceptance_signals:
  - Unit/domain/app build checks pass.
  - `/settings/import` is available on the running dev server.
- unresolved_blockers:
  - No unresolved implementation blockers remain for local_dev verification.
- next_step:
  - Verification for `csv-import-financial-records`.
