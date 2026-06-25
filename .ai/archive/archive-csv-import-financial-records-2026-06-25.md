---
id: archive-csv-import-financial-records-2026-06-25
stage: artifact-compression
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/csv-import-financial-records.md
  - .ai/domain-impact/csv-import-financial-records.md
  - .ai/prototype/csv-import-financial-records.md
  - .ai/spec/csv-import-financial-records.md
  - .ai/technical-design/csv-import-financial-records.md
  - .ai/implementation/csv-import-financial-records.md
  - .ai/verification/csv-import-financial-records.md
  - .ai/release/csv-import-financial-records-local-dev-readiness.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/csv-import-financial-records.md
    - .ai/domain-impact/csv-import-financial-records.md
    - .ai/prototype/csv-import-financial-records.md
    - .ai/spec/csv-import-financial-records.md
    - .ai/technical-design/csv-import-financial-records.md
    - .ai/implementation/csv-import-financial-records.md
    - .ai/verification/csv-import-financial-records.md
    - .ai/release/csv-import-financial-records-local-dev-readiness.md
  commits_or_prs:
    - db7c171 docs: add csv import intent
    - a33a072 docs: add csv import domain impact
    - a1f1854 Add csv import prototype
    - 9852939 docs: add csv import behavior spec
    - f69eb88 docs: add csv import technical design
    - dbb1031 Implement CSV ledger import
    - 6edf02d Verify CSV ledger import
    - 4470fe2 Add CSV import e2e coverage
    - ecde537 Add CSV import local dev readiness
reviewed_at:
---

# Artifact Compression for CSV Import Financial Records

## Compression Decision

- scope: completed `csv-import-financial-records` feature slice for `/settings/import`.
- reason: Intent through Target-Aware Release is complete for `local_dev`, and the user explicitly requested Artifact Compression without a separate Learning Loop.
- decision: compress
- next_lifecycle_entry: Optional `artifact-prune` only by explicit request, Learning Loop if local feedback signals should still be formalized, stricter-target release readiness, or next Intent Intake.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Add controlled CSV import so authorized household finance users can bring existing income and expense records into Home Family Fund without manual re-entry.
- final_behavior_or_spec: CSV import lives at `設定 > CSV 匯入`. Admins and finance managers can access it; general members cannot. The template header is `type,date,name,amount,member,category,note`, with no `payment_source`. File selection opens directly from the import button, no modal. Preview shows selected file, row-level validation, member/category mapping, duplicate summary, removable/add-back rows, sortable table, and footer counts. Successful import resets the page and shows final server counts in `成功`, `失敗`, `略過` order.
- domain_rules: CSV upload/preview has no financial effect. Confirmation creates ordinary active ledger records under the same rules as manual income, fund-paid expense, and member-paid expense creation. Member-paid imported expenses become refundable and are not marked reimbursed. Direct reimbursement payment CSV import is out of scope because payment rows cannot safely identify the settled expenses without a future reconciliation workflow. Duplicate rows are warnings, not automatic skips or blockers.
- foundation_decisions: Existing Next.js App Router, React client/server component split, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, Playwright, and Docker-backed local database foundation were reused. No new app foundation was introduced.
- technical_decisions: Added dedicated `import_ledger_records` authorization and `canImportLedgerRecords` access hint. Server actions preview, re-preview, and confirm import using a signed preview token. Parser/validator live in `src/modules/fund-ledger/ledger-import.ts`; Prisma-backed preview/confirm and audit live in `src/modules/fund-ledger/ledger-import-command.ts`. Import audit persistence uses `LedgerImportBatch`, `LedgerImportRow`, `failedRowCount`, and row statuses `imported`, `failed`, `skipped`. Raw CSV contents are not stored. Confirmation allows partial success: valid active rows are imported, invalid active rows are audited as failed, and removed rows are audited as skipped.
- release_target_and_result: Target is `local_dev`; readiness is approved for local review, not production. Verification passed `corepack pnpm db:validate`, `corepack pnpm test` (42 files / 200 tests), `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm build`, targeted CSV Playwright E2E (5 tests), and full Playwright E2E (49 tests). E2E applied both ledger import audit migrations to `home_fund_e2e`.
- accepted_risks: Partial success replaced the original all-or-nothing policy after Technical Design approval; source artifacts now reflect partial success, but reviewers should explicitly accept it. Amount parsing is strict and does not accept thousands separators or currency symbols. Import audit stores file name, fingerprints, row numbers, status, actor, and created record links, but not raw CSV contents. Production readiness remains unassessed.
- learning_outcomes: Learning Loop was skipped by explicit user direction. Future local feedback should watch whether users can prepare the template, understand `需處理` vs `疑似重複`, trust automatic display-name/category-name matching, recover from failed rows, and accept partial success.
- commits_or_prs: See `trace_links.commits_or_prs` above; no PR link is recorded in this local branch workflow.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level defaults and constraints remain active. | keep | Maintained source of truth. |
| `.ai/workflow.md` | maintained | Workflow inventory and next entry point remain active. | keep | Updated by this compression gate. |
| `.ai/domain/home-family-fund.md` | maintained | Durable CSV import and ledger/reimbursement domain language remains active for future features. | keep | Maintained source of truth. |
| `.ai/intent/csv-import-financial-records.md` | prune_candidate | Intent decisions are summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/domain-impact/csv-import-financial-records.md` | prune_candidate | Change-level domain impact is summarized here; durable rules remain in maintained domain artifacts. | mark_prune_candidate | This archive and `.ai/domain/home-family-fund.md`. |
| `.ai/prototype/csv-import-financial-records.md` | prune_candidate | Prototype decisions and UX outcomes are summarized here. | mark_prune_candidate | This archive and implemented code. |
| `.ai/spec/csv-import-financial-records.md` | prune_candidate | Accepted behavior and E2E design are summarized here. | mark_prune_candidate | This archive and tests. |
| `.ai/technical-design/csv-import-financial-records.md` | prune_candidate | Technical decisions are implemented and summarized here. | mark_prune_candidate | This archive and committed code. |
| `.ai/implementation/csv-import-financial-records.md` | prune_candidate | Implementation evidence is summarized here. | mark_prune_candidate | This archive, code, and test history. |
| `.ai/verification/csv-import-financial-records.md` | prune_candidate | Verification evidence and residual risks are summarized here. | mark_prune_candidate | This archive and command history. |
| `.ai/release/csv-import-financial-records-local-dev-readiness.md` | prune_candidate | Local_dev readiness and accepted risks are summarized here. | mark_prune_candidate | This archive. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/csv-import-financial-records.md`
- `.ai/domain-impact/csv-import-financial-records.md`
- `.ai/prototype/csv-import-financial-records.md`
- `.ai/spec/csv-import-financial-records.md`
- `.ai/technical-design/csv-import-financial-records.md`
- `.ai/implementation/csv-import-financial-records.md`
- `.ai/verification/csv-import-financial-records.md`
- `.ai/release/csv-import-financial-records-local-dev-readiness.md`

## Workflow Updates

- active_lifecycle_stage: No active csv-import-financial-records gate remains after this compression review.
- artifact_inventory_changes: csv-import-financial-records intent, domain-impact, prototype, spec, technical-design, implementation, verification, and release artifacts are now summarized in this archive.
- archive_notes: keep this archive as the first read for future CSV import changes, together with maintained project/domain/workflow artifacts.

## Risks

- traceability_risks: Low; the archive preserves source artifact paths and commit hashes, and source files remain available until optional manual prune.
- audit_or_compliance_risks: Import creates financial ledger records and audit metadata, but no production release, external money movement, or raw CSV retention occurred. Production readiness must decide migration rollout, rollback, audit retention, monitoring, and bulk-import correction policy.
- unresolved_work: Production readiness, import rollback/correction tooling, broader CSV amount formats, raw CSV retention policy, large-file/background processing, and reimbursement payment reconciliation remain future intents or stricter-target release gates.

## Review Gate

- decision: review
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - release outcome retained despite Learning Loop being skipped
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary
  - future work can resume from maintained files and this archive summary
- unresolved_blockers:
  - none
- next_step: Approve this compression, then optionally request `artifact-prune`; otherwise start the next Intent Intake, Learning Loop for local feedback, or stricter-target release readiness.
