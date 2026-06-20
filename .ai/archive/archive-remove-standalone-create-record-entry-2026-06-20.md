---
id: archive-remove-standalone-create-record-entry-2026-06-20
stage: artifact-compression
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/remove-standalone-create-record-entry.md
  - .ai/prototype/remove-standalone-create-record-entry.md
  - .ai/spec/remove-standalone-create-record-entry.md
  - .ai/technical-design/remove-standalone-create-record-entry.md
  - .ai/implementation/remove-standalone-create-record-entry.md
  - .ai/verification/remove-standalone-create-record-entry.md
  - .ai/release/remove-standalone-create-record-entry-local-dev-readiness.md
  - .ai/learning/remove-standalone-create-record-entry.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/remove-standalone-create-record-entry.md
    - .ai/prototype/remove-standalone-create-record-entry.md
    - .ai/spec/remove-standalone-create-record-entry.md
    - .ai/technical-design/remove-standalone-create-record-entry.md
    - .ai/implementation/remove-standalone-create-record-entry.md
    - .ai/verification/remove-standalone-create-record-entry.md
    - .ai/release/remove-standalone-create-record-entry-local-dev-readiness.md
    - .ai/learning/remove-standalone-create-record-entry.md
  commits_or_prs:
    - 7ff09c4 Refactor homepage record creation
    - 070baaa Verify homepage record creation refactor
    - e9303a3 Cover mobile record creation entry
    - 70d6e90 Add local dev release readiness for record creation
    - 5bcd733 Define learning for record creation IA
reviewed_at: 2026-06-20
---

# Artifact Compression for Remove Standalone Create Record Entry

## Compression Decision

- scope: completed local_dev IA and modal-state slice for removing standalone create-record and records entry points.
- reason: Intent, production-stack prototype plan, Behavior Spec, technical design, TDD implementation, verification, target-aware local_dev release readiness, and learning loop are complete.
- decision: compress
- next_lifecycle_entry: next Intent Intake, optional explicit `artifact-prune`, or production release intake.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Remove standalone create-record and records routes from navigation and URLs, making the homepage the only create-record entry point while preserving ledger creation behavior.
- final_behavior_or_spec:
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
- domain_rules:
  - Ledger creation domain rules did not change.
  - Category validation, member-paid/fund-paid expense rules, reimbursement implications, and authorization remain in existing fund-ledger domain/server action boundaries.
  - General members still cannot create records for others; UI visibility remains helpful but server-side authorization remains the trusted guard.
- foundation_decisions:
  - Existing Next.js App Router, React client state, shadcn-style dialogs/tabs, Prisma/PostgreSQL, Vitest, and Playwright foundations were reused.
  - No new framework, route foundation, schema migration, environment variable, or auth provider change was introduced.
- technical_decisions:
  - `RecordCreateScope` owns modal mode, open/close handlers, and post-success close/refresh/toast.
  - `RecordCreateContext` provides narrow create-record data and actions to trigger buttons and forms.
  - `buildRecordCreateData` adapts `MonthlyWorkspaceContext` into `RecordCreateData` on the server without adding duplicate data queries.
  - `CreateRecordDialog` is a controlled shell; `RecordEntryPanel` owns form submission and action-state rendering.
  - `RecordEntryPanel` is split into independent income and expense forms with local shared field primitives.
  - `PageLayout` no longer has an `overlays` slot for this modal.
  - `NativeSelect` was made full width to fix select layout drift.
  - Obsolete `month`, `returnTo`, redirect/query result, and create/result URL plumbing were removed from create-record action flow.
- release_target_and_result:
  - `local_dev` readiness passed.
  - `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm build`, and `pnpm test:e2e e2e/create-record.spec.ts` passed.
  - Targeted create-record E2E passed with 8 tests including income, fund expense, member expense, validation error, reload close, removed route not-found, homepage-only actions, and mobile footer entry.
  - Production readiness is not claimed.
- accepted_risks:
  - `prisma generate` can race if quality commands run in parallel; sequential reruns pass.
  - Manual focus-return and mobile visual scan were not separately performed; browser tests and existing dialog primitives cover functional behavior.
  - Git reported local repository housekeeping warnings about unreachable loose objects; this is not an app release blocker.
- learning_outcomes:
  - Local_dev learning uses manual review and smoke tasks rather than analytics tooling.
  - Watch whether users can find homepage create buttons, understand `/records` removal, discover mobile footer actions, and accept URL-free modal behavior.
  - Route future confusion through new Intent Intake rather than reopening this completed slice.
- commits_or_prs:
  - 7ff09c4 Refactor homepage record creation.
  - 070baaa Verify homepage record creation refactor.
  - e9303a3 Cover mobile record creation entry.
  - 70d6e90 Add local dev release readiness for record creation.
  - 5bcd733 Define learning for record creation IA.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/workflow.md` | maintained | Workflow source of truth and current inventory. | keep | Updated to point to this archive. |
| `.ai/project-context.md` | maintained | Project-level assumptions and next lifecycle routing. | keep | Updated after compression. |
| `.ai/intent/home-family-fund.md` | maintained | Durable product intent remains relevant. | keep | This archive summarizes the completed change intent only. |
| `.ai/domain/home-family-fund.md` | maintained | Durable domain rules remain source of truth. | keep | Ledger domain rules were unchanged. |
| `.ai/foundation-architecture/home-family-fund.md` | maintained | Foundation decisions remain useful for future work. | keep | No new foundation decision in this slice. |
| `.ai/release/home-family-fund-local-dev-readiness.md` | maintained | Broad local_dev readiness remains useful across slices. | keep | This archive links to slice-specific release readiness. |
| `.ai/intent/remove-standalone-create-record-entry.md` | prune_candidate | Completed change intent is summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/prototype/remove-standalone-create-record-entry.md` | prune_candidate | Prototype decisions were implemented and verified. | mark_prune_candidate | This archive and E2E evidence. |
| `.ai/spec/remove-standalone-create-record-entry.md` | prune_candidate | Behavior spec is implemented, verified, and summarized. | mark_prune_candidate | This archive and verification artifact. |
| `.ai/technical-design/remove-standalone-create-record-entry.md` | prune_candidate | Technical decisions are implemented and summarized. | mark_prune_candidate | This archive and commits. |
| `.ai/implementation/remove-standalone-create-record-entry.md` | prune_candidate | Implementation evidence is summarized here and in git history. | mark_prune_candidate | This archive and commits. |
| `.ai/verification/remove-standalone-create-record-entry.md` | prune_candidate | Verification passed for local_dev and is summarized here. | mark_prune_candidate | This archive and release readiness. |
| `.ai/release/remove-standalone-create-record-entry-local-dev-readiness.md` | prune_candidate | Slice-specific local_dev release readiness is summarized here. | mark_prune_candidate | This archive. |
| `.ai/learning/remove-standalone-create-record-entry.md` | prune_candidate | Learning signals are summarized here. | mark_prune_candidate | This archive. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/remove-standalone-create-record-entry.md`
- `.ai/prototype/remove-standalone-create-record-entry.md`
- `.ai/spec/remove-standalone-create-record-entry.md`
- `.ai/technical-design/remove-standalone-create-record-entry.md`
- `.ai/implementation/remove-standalone-create-record-entry.md`
- `.ai/verification/remove-standalone-create-record-entry.md`
- `.ai/release/remove-standalone-create-record-entry-local-dev-readiness.md`
- `.ai/learning/remove-standalone-create-record-entry.md`

## Workflow Updates

- active_lifecycle_stage: Completed remove standalone create-record entry slice is compressed. No active change remains after compression.
- artifact_inventory_changes:
  - Added this archive as the compact record for the completed slice.
  - Marked completed intermediate artifacts as prune candidates.
  - Preserved maintained project, workflow, domain, foundation, and broad local_dev release artifacts.
- archive_notes:
  - Use this archive first for future context on homepage-only create-record entry and route removal.
  - Use git history for full intermediate details if prune is later requested.

## Risks

- traceability_risks:
  - Low if this archive, maintained workflow/project/domain artifacts, and git history are kept.
- audit_or_compliance_risks:
  - No production incident, compliance audit, legal requirement, or security incident was identified for this local_dev slice.
- unresolved_work:
  - Production readiness remains out of scope.
  - Future product changes to create affordance placement, `/records` behavior, or URL-driven modal behavior should start from Intent Intake.
  - Repository housekeeping warning about `.git/gc.log` / loose objects remains a local maintenance task, not an app workflow blocker.

## Review Gate

- decision: approve
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - release and learning outcomes retained
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary.
  - Future work can resume from maintained files and this archive.
- unresolved_blockers:
  - None.
- next_step:
  - Optional explicit `artifact-prune`, production release intent, or next Intent Intake.
