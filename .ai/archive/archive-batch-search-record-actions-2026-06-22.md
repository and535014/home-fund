---
id: archive-batch-search-record-actions-2026-06-22
stage: artifact-compression
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/batch-search-record-actions.md
  - .ai/domain-impact/batch-search-record-actions.md
  - .ai/prototype/batch-search-record-actions.md
  - .ai/spec/batch-search-record-actions.md
  - .ai/technical-design/batch-search-record-actions.md
  - .ai/implementation/batch-search-record-actions.md
  - .ai/verification/batch-search-record-actions.md
  - .ai/release/batch-search-record-actions-local-dev-readiness.md
  - .ai/learning/batch-search-record-actions.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/batch-search-record-actions.md
    - .ai/domain-impact/batch-search-record-actions.md
    - .ai/prototype/batch-search-record-actions.md
    - .ai/spec/batch-search-record-actions.md
    - .ai/technical-design/batch-search-record-actions.md
    - .ai/implementation/batch-search-record-actions.md
    - .ai/verification/batch-search-record-actions.md
    - .ai/release/batch-search-record-actions-local-dev-readiness.md
    - .ai/learning/batch-search-record-actions.md
  commits_or_prs:
    - 7abdfaf Capture batch search record actions intent
    - df2b57f Capture batch search record actions domain impact
    - 333f4ad Prototype batch search record actions
    - 9fdf786 Specify batch search record actions behavior
    - 3d2b84b Clarify visible-row selection semantics
    - c5758f2 Design batch search record actions
    - 449bb6d Implement batch search record actions
    - dc172fd Verify batch search record actions
    - 6d89f63 Assess batch search record actions release readiness
    - e1f4777 Define batch search record actions learning loop
reviewed_at: 2026-06-22
---

# Artifact Compression for Batch Search Record Actions

## Compression Decision

- scope: completed `batch-search-record-actions` feature slice for `/search`.
- reason: Intent through Learning Loop is complete for `local_dev`, and future work should resume from a compact decision record instead of reading every intermediate artifact.
- decision: compress
- next_lifecycle_entry: Optional `artifact-prune` only by explicit request, production readiness follow-up, or next Intent Intake.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Search results now support explicit selection mode and batch actions for delete and refund. The standalone `/reimbursements` page is removed; refund work is reached from record-oriented surfaces.
- final_behavior_or_spec: `/search` keeps normal detail-opening behavior until the user toggles selection mode. The footer appears only after a query/filter is active. Normal mode shows `搜尋結果 <n> 筆` and `總額`; selection mode shows selected count and selected total only. `全選目前顯示` selects only currently loaded/rendered rows. Batch delete/refund are partial-success actions with skipped records, and batch refund confirmation shows `退款總金額`.
- domain_rules: Selection is UI/read-model state and does not grant mutation rights. Batch delete voids eligible active records using existing delete authorization and never hard-deletes. Batch refund marks eligible active member-paid refundable expenses as reimbursed once. Unauthorized, voided, already reimbursed, fund-paid, income, and missing records are skipped.
- foundation_decisions: Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, local UI components, Vitest, and Playwright foundation were reused. No new foundation or domain table was introduced.
- technical_decisions: `/search` uses server-backed cursor pagination with `SEARCH_RECORD_PAGE_SIZE = 100`, stable sort cursors, and query-wide `totalCount` plus signed `totalNetAmountCents`. Search query translation lives in `src/modules/reporting/record-search-query.ts`. Batch commands live in `src/modules/fund-ledger/ledger-record-batch-actions.ts` and `src/modules/reimbursement/reimbursement-batch-actions.ts`. `PageFooter` is the shared non-card footer wrapper. Prisma search pagination indexes were added.
- release_target_and_result: Target is `local_dev`; readiness is approved for local review, not production. Required local review includes applying migrations, seed data, `/search` smoke checks, pagination smoke with `搜尋分頁測試`, and batch action confirmation review.
- accepted_risks: Mobile footer E2E coverage was not run; query-plan evidence was not collected; full browser E2E was not run; direct deleted-route E2E coverage was intentionally removed; production readiness remains unassessed.
- learning_outcomes: Local review should observe whether users understand `批次退款`, skipped records, `全選目前顯示`, footer totals, removal of `/reimbursements`, and 100-record pagination. Future production signals should track selection mode, all-select, processed/skipped counts, server action failures, and pagination latency without logging sensitive record details.
- commits_or_prs: See `trace_links.commits_or_prs` above; no PR link is recorded in this local branch workflow.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level defaults and constraints remain active. | keep | Maintained source of truth. |
| `.ai/workflow.md` | maintained | Workflow inventory and next entry point remain active. | keep | Updated by this compression gate. |
| `.ai/domain/home-family-fund.md` | maintained | Durable domain model remains active for future features. | keep | Maintained source of truth. |
| `.ai/intent/batch-search-record-actions.md` | prune_candidate | Intent decisions are summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/domain-impact/batch-search-record-actions.md` | prune_candidate | Change-level domain impact is summarized here; durable rules remain in maintained domain artifacts. | mark_prune_candidate | This archive and `.ai/domain/home-family-fund.md`. |
| `.ai/prototype/batch-search-record-actions.md` | prune_candidate | Prototype decisions and UX outcomes are summarized here. | mark_prune_candidate | This archive and implemented code. |
| `.ai/spec/batch-search-record-actions.md` | prune_candidate | Accepted behavior and E2E design are summarized here. | mark_prune_candidate | This archive and tests. |
| `.ai/technical-design/batch-search-record-actions.md` | prune_candidate | Technical decisions are summarized here. | mark_prune_candidate | This archive and implemented modules. |
| `.ai/implementation/batch-search-record-actions.md` | prune_candidate | Implementation evidence is summarized here. | mark_prune_candidate | This archive, code, and test history. |
| `.ai/verification/batch-search-record-actions.md` | prune_candidate | Verification evidence and residual risks are summarized here. | mark_prune_candidate | This archive and command history. |
| `.ai/release/batch-search-record-actions-local-dev-readiness.md` | prune_candidate | Local_dev readiness and accepted risks are summarized here. | mark_prune_candidate | This archive. |
| `.ai/learning/batch-search-record-actions.md` | prune_candidate | Learning questions and follow-up criteria are summarized here. | mark_prune_candidate | This archive. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/batch-search-record-actions.md`
- `.ai/domain-impact/batch-search-record-actions.md`
- `.ai/prototype/batch-search-record-actions.md`
- `.ai/spec/batch-search-record-actions.md`
- `.ai/technical-design/batch-search-record-actions.md`
- `.ai/implementation/batch-search-record-actions.md`
- `.ai/verification/batch-search-record-actions.md`
- `.ai/release/batch-search-record-actions-local-dev-readiness.md`
- `.ai/learning/batch-search-record-actions.md`

## Workflow Updates

- active_lifecycle_stage: No active batch-search-record-actions gate remains after this compression review.
- artifact_inventory_changes: batch-search-record-actions intent, domain-impact, prototype, spec, technical-design, implementation, verification, release, and learning artifacts are now summarized in this archive.
- archive_notes: keep this archive as the first read for future search batch action changes, together with maintained project/domain/workflow artifacts.

## Risks

- traceability_risks: Low; the archive preserves source artifact paths and commit hashes, and source files remain available until optional manual prune.
- audit_or_compliance_risks: No legal, compliance, security incident, or production incident evidence was identified that requires preserving full intermediate artifacts as maintained records.
- unresolved_work: Production readiness, mobile Playwright coverage, production query plans, and any future query-wide select-all behavior remain separate future intents or release gates.

## Review Gate

- decision: review
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
  - `.ai` has a clear completed-work summary
  - future work can resume from maintained files and this archive summary
- unresolved_blockers:
  - none
- next_step: Approve this compression, then optionally request `artifact-prune`; otherwise start the next Intent Intake or production-readiness follow-up.
