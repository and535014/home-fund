---
id: csv-import-financial-records
stage: verification
status: review
created_at: 2026-06-25
updated_at: 2026-06-25
review_gate: pending_user_review
reviewed_at:
release_target: local_dev
trace_links:
  - .ai/intent/csv-import-financial-records.md
  - .ai/domain-impact/csv-import-financial-records.md
  - .ai/prototype/csv-import-financial-records.md
  - .ai/spec/csv-import-financial-records.md
  - .ai/technical-design/csv-import-financial-records.md
  - .ai/implementation/csv-import-financial-records.md
---

# CSV Import Financial Records Verification

## Result

- decision: pass_for_local_dev_review
- release_target_supported: local_dev
- recommended_next_gate: Target-Aware Release for local_dev.

## Scope Verified

- `/settings/import` is guarded by `canImportLedgerRecords`, and settings navigation uses the same `CSV 匯入` label as the page title.
- The CSV template contract is `type,date,name,amount,member,category,note`; `payment_source` and reimbursement payment import remain unsupported.
- File selection opens directly from the import action, selected-file display uses the project `Item` pattern, and preview state keeps file controls, validation summary, and table flat.
- Member/category names auto-match on preview, missing mappings render as `未選擇`, and changed mappings trigger server re-preview.
- Duplicate rows are counted as warnings and do not become blocking `需處理` rows.
- Import confirmation revalidates server-side, imports valid active rows, audits invalid active rows as failed, audits removed rows as skipped, and returns final success/failure/skipped counts for the toast.
- Imported member-paid expenses remain ordinary refundable ledger records; no reimbursement batch or payment evidence is created.
- The homepage record list now shows current-month records so imported records can appear in the records column, not only in charts.
- Import options include active and invited household members so unbound members can still be selected.
- Playwright E2E now covers authorized navigation, unauthorized access, template download, file upload preview, mapping correction, row remove/add-back, duplicate warning, import success/reset, imported records appearing on the homepage, and mobile preview control usability.
- Local database migration `20260625203000_add_ledger_import_failed_audit` has been applied in local dev.

## Commands Run

- `corepack pnpm db:validate`
  - Result: passed.
- `corepack pnpm test`
  - Result: passed, 42 files, 200 tests.
- `corepack pnpm type-check`
  - Result: passed.
- `corepack pnpm lint`
  - Result: passed.
- `corepack pnpm build`
  - Result: passed.
- `corepack pnpm db:deploy`
  - Result: passed earlier in this verification cycle; applied the local import failed-audit migration.
- `corepack pnpm test:e2e e2e/csv-import.spec.ts`
  - Result: passed, 5 Playwright tests.
- `corepack pnpm test:e2e`
  - Result: passed, 49 Playwright tests.

## Trace And Alignment

- Behavior Spec and Technical Design were updated to reflect the user-approved partial success policy. Earlier all-or-nothing language is no longer the active decision.
- The import batch schema and Technical Design both include `failedRowCount` and `LedgerImportRowStatus.failed`.
- Implementation evidence now matches the live behavior: success toast uses final server counts in `成功`, `失敗`, `略過` order.
- Prototype layout decisions are preserved in production components: no modal, no card wrappers for the import areas, icon-only table actions, content-width file item on desktop, and scrollable preview table body.

## Residual Risk

- Partial success changed the original atomic policy after technical design approval. The source artifacts have been corrected, but this deserves explicit user review before release readiness.
- Amount parsing remains strict and does not accept thousands separators; this is documented as a current MVP limitation.

## Review Gate

- Decision needed: approve local_dev verification, request changes, or block.
- Recommended next gate after approval: Target-Aware Release for `local_dev`.
