---
id: archive-edit-delete-ledger-records-2026-06-21
stage: artifact-compression
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/edit-delete-ledger-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/edit-delete-ledger-records.md
  - .ai/prototype/edit-delete-ledger-records.md
  - .ai/spec/edit-delete-ledger-records.md
  - .ai/technical-design/edit-delete-ledger-records.md
  - .ai/implementation/edit-delete-ledger-records.md
  - .ai/verification/edit-delete-ledger-records.md
  - .ai/release/edit-delete-ledger-records-local-dev-readiness.md
  - .ai/learning/edit-delete-ledger-records.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/edit-delete-ledger-records.md
    - .ai/domain-impact/edit-delete-ledger-records.md
    - .ai/prototype/edit-delete-ledger-records.md
    - .ai/spec/edit-delete-ledger-records.md
    - .ai/technical-design/edit-delete-ledger-records.md
    - .ai/implementation/edit-delete-ledger-records.md
    - .ai/verification/edit-delete-ledger-records.md
    - .ai/release/edit-delete-ledger-records-local-dev-readiness.md
    - .ai/learning/edit-delete-ledger-records.md
  maintained_artifacts:
    - .ai/domain/home-family-fund.md
  commits_or_prs:
    - 03d6c33 Add edit delete ledger records intent
    - d5a6299 Define ledger record edit delete domain
    - c53fdc5 Prototype ledger record edit delete flow
    - 184b9ad Specify ledger record edit delete behavior
    - 9431d4c Design ledger record edit delete implementation
    - 02ba00f Implement ledger record edit delete
    - 8d29c60 Fix record dialog footer spacing
    - 2635f86 Verify ledger record edit delete flow
    - d150875 Assess ledger record edit delete local release
    - 89ceeb9 Define ledger record edit delete learning loop
reviewed_at: 2026-06-21
---

# Artifact Compression for Edit And Delete Ledger Records

## Compression Decision

- scope: completed local_dev edit/delete ledger records feature slice.
- reason: Intent, domain impact, production-stack prototype, Behavior Spec, Feature Technical Design, TDD implementation, verification, local_dev release readiness, and learning loop are complete.
- decision: compress
- next_lifecycle_entry: next product change should start at Intent Intake; stricter preview/staging/production release should start at Target-Aware Release for the selected environment.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Let authorized household users correct or delete existing income/expense ledger records from the dashboard record detail flow while preserving role boundaries and accurate financial totals.
- final_behavior_or_spec:
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
- domain_rules:
  - Fund Ledger owns correction and voiding commands.
  - Identity and Access remains the authority for `edit_ledger_record` and `delete_ledger_record`.
  - Delete is a voiding transition, not physical hard deletion.
  - Existing reimbursement batch history keeps persisted trace to any record that later becomes voided.
  - Reporting and Reimbursement consume active-only ledger records.
  - Reimbursed member-paid expenses are blocked from edit/delete in MVP because reversal is not modeled.
- foundation_decisions:
  - Existing Next.js App Router, React, Prisma/PostgreSQL, Tailwind, shadcn-style UI components, Better Auth, Vitest, and Playwright foundations were reused.
  - No new framework, component library, auth provider, analytics provider, or monitoring provider was added.
- technical_decisions:
  - Prisma gained `LedgerRecordStatus` enum with `active` and `voided`.
  - `LedgerRecord.status` is `NOT NULL DEFAULT active`, with active-query indexes for household/month and reimbursement access patterns.
  - `updateLedgerRecordInDatabase` and `voidLedgerRecordInDatabase` load active records inside transactions, run domain validation, and persist update/void transitions.
  - Shared `isActiveLedgerRecord` protects reporting and reimbursement read models from voided records.
  - Server actions parse edit/delete forms, require authenticated household access, call domain/persistence commands, and revalidate `/` and `/reimbursements`.
  - Edit/delete client forms await server action results and run success handling before refresh/unmount so toasts are not lost.
  - Form-wrapped dialog footers use explicit spacing so buttons do not touch content.
  - Focused Playwright E2E covers edit success, delete success, toast feedback, dialog close, active-list removal, and delete modal spacing.
- release_target_and_result:
  - `local_dev` readiness passed.
  - Evidence includes `corepack pnpm type-check`, `corepack pnpm test` with 29 files / 140 tests, `corepack pnpm lint`, `corepack pnpm db:validate`, `corepack pnpm build`, and full `corepack pnpm test:e2e` with 37 tests.
  - E2E setup applied migration `20260621010000_add_ledger_record_status` successfully to the E2E database.
  - Production readiness is not claimed.
- accepted_risks:
  - Full audit/history UI for voided records is out of scope.
  - Reimbursement reversal remains out of scope; reimbursed member-paid expenses stay blocked.
  - E2E covers one successful browser edit/delete path. Admin-specific browser mutation and reimbursed blocked browser cases can be added later if those paths become regression-prone.
  - Quality scripts that run `prisma generate` should be run sequentially to avoid generated-client directory races.
  - E2E depends on Docker Desktop and local PostgreSQL availability.
- learning_outcomes:
  - Local_dev learning uses manual review and regression checks, not analytics tooling.
  - Watch whether users can find edit/delete in record detail, trust destructive confirmation, understand active removal/voided trace, accept reimbursed-expense blocking, and see coherent reimbursement/reporting changes.
  - Route future issues through new Intent Intake.
- commits_or_prs:
  - 03d6c33, d5a6299, c53fdc5, 184b9ad, 9431d4c, 02ba00f, 8d29c60, 2635f86, d150875, 89ceeb9.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level stack and workflow defaults remain source of truth. | keep | Updated after compression. |
| `.ai/workflow.md` | maintained | Workflow inventory and current state remain active. | keep | Updated to reference this archive. |
| `.ai/domain/home-family-fund.md` | maintained | Durable ledger record correction/voiding domain rules live here. | keep | This archive summarizes the completed change, not the durable domain model. |
| `.ai/release/home-family-fund-local-dev-readiness.md` | maintained | Broad local_dev readiness remains useful across slices. | keep | Slice readiness is summarized here. |
| `.ai/intent/edit-delete-ledger-records.md` | prune_candidate | Completed change intent is summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/domain-impact/edit-delete-ledger-records.md` | prune_candidate | Change-level domain delta is summarized here; durable rules remain in maintained domain artifact. | mark_prune_candidate | This archive and `.ai/domain/home-family-fund.md`. |
| `.ai/prototype/edit-delete-ledger-records.md` | prune_candidate | Prototype decisions were implemented and verified. | mark_prune_candidate | This archive and E2E evidence. |
| `.ai/spec/edit-delete-ledger-records.md` | prune_candidate | Acceptance criteria are implemented, verified, and summarized. | mark_prune_candidate | This archive and verification artifact. |
| `.ai/technical-design/edit-delete-ledger-records.md` | prune_candidate | Technical decisions are implemented and summarized. | mark_prune_candidate | This archive and commits. |
| `.ai/implementation/edit-delete-ledger-records.md` | prune_candidate | Implementation evidence is summarized here and in git history. | mark_prune_candidate | This archive and commits. |
| `.ai/verification/edit-delete-ledger-records.md` | prune_candidate | Verification result is summarized here. | mark_prune_candidate | This archive and release readiness. |
| `.ai/release/edit-delete-ledger-records-local-dev-readiness.md` | prune_candidate | Slice-specific local_dev readiness is summarized here. | mark_prune_candidate | This archive. |
| `.ai/learning/edit-delete-ledger-records.md` | prune_candidate | Learning signals are summarized here. | mark_prune_candidate | This archive. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/edit-delete-ledger-records.md`
- `.ai/domain-impact/edit-delete-ledger-records.md`
- `.ai/prototype/edit-delete-ledger-records.md`
- `.ai/spec/edit-delete-ledger-records.md`
- `.ai/technical-design/edit-delete-ledger-records.md`
- `.ai/implementation/edit-delete-ledger-records.md`
- `.ai/verification/edit-delete-ledger-records.md`
- `.ai/release/edit-delete-ledger-records-local-dev-readiness.md`
- `.ai/learning/edit-delete-ledger-records.md`

## Workflow Updates

- active_lifecycle_stage: completed and compressed edit/delete ledger records slice.
- artifact_inventory_changes:
  - Added this archive as the compact long-term record for the completed edit/delete ledger records work.
  - Marked completed intermediate slice artifacts as prune candidates.
  - Preserved maintained project, workflow, domain, foundation, broad local_dev release, migration, and archive summaries.
- archive_notes:
  - Use this archive first for future context on ledger record correction, voided delete semantics, reimbursement/reporting exclusion, and delete toast/modal-spacing decisions.
  - Use `.ai/domain/home-family-fund.md` for durable Fund Ledger and Reimbursement rules.
  - Use git history for full intermediate details if prune is later requested.

## Risks

- traceability_risks:
  - Low if this archive, maintained workflow/project/domain artifacts, and git history are kept.
- audit_or_compliance_risks:
  - Low for local_dev. The slice includes a schema migration and financial-record lifecycle language, but no production incident, legal requirement, or security incident was identified.
- unresolved_work:
  - Production readiness remains out of scope.
  - Voided-record history/restore UI is a possible future feature.
  - Reimbursement reversal is required before reimbursed expense edits/deletes can be allowed.
  - Admin-specific and reimbursed-blocked browser E2E can be added later if those paths become regression-prone.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - traceability preserved
  - durable domain artifact remains maintained
  - active work is not compressed prematurely
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a compact completed-work summary.
  - Future work can resume from maintained files and this archive.
- unresolved_blockers:
  - None.
- next_step:
  - Optional explicit `artifact-prune`, production release intent, or next Intent Intake.
