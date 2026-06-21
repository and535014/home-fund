---
id: archive-record-detail-reimbursement-2026-06-21
stage: artifact-compression
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/record-detail-reimbursement.md
  - .ai/domain-impact/record-detail-reimbursement.md
  - .ai/prototype/record-detail-reimbursement.md
  - .ai/spec/record-detail-reimbursement.md
  - .ai/technical-design/record-detail-reimbursement.md
  - .ai/implementation/record-detail-reimbursement.md
  - .ai/verification/record-detail-reimbursement.md
  - .ai/release/record-detail-reimbursement-local-dev-readiness.md
  - .ai/learning/record-detail-reimbursement.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/record-detail-reimbursement.md
    - .ai/domain-impact/record-detail-reimbursement.md
    - .ai/prototype/record-detail-reimbursement.md
    - .ai/spec/record-detail-reimbursement.md
    - .ai/technical-design/record-detail-reimbursement.md
    - .ai/implementation/record-detail-reimbursement.md
    - .ai/verification/record-detail-reimbursement.md
    - .ai/release/record-detail-reimbursement-local-dev-readiness.md
    - .ai/learning/record-detail-reimbursement.md
  commits_or_prs:
    - 60324e4 Prototype record detail reimbursement
    - 3af3bca Specify record detail reimbursement behavior
    - a7c95e1 Design record detail reimbursement implementation
    - 4764a9e Implement record detail reimbursement
    - e6a94ac Verify record detail reimbursement
    - f098828 Assess record detail reimbursement local dev readiness
    - 86024e8 Define record detail reimbursement learning signals
reviewed_at: 2026-06-21
---

# Artifact Compression for Record Detail Reimbursement

## Compression Decision

- scope: feature slice `record-detail-reimbursement`
- reason: local_dev lifecycle is complete through Learning Loop and can be summarized for future work.
- decision: compress
- next_lifecycle_entry: next Intent Intake, optional stricter-target release readiness, or explicit artifact-prune.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Users can open a dashboard record detail and perform `退款` on an eligible member-paid expense.
- final_behavior_or_spec: Eligible active member-paid refundable expenses show `退款`; confirmation uses `確認退款`; success marks exactly one record as `已退款`, shows `已完成退款`, refreshes dashboard data, and hides `退款`, `編輯`, and `刪除`.
- domain_rules: `退款` means app settlement state, not bank transfer. Reimbursement remains one-time. Only admin/finance-capable actors can reimburse. Income, fund-paid, voided, non-refundable, and already reimbursed records are not eligible.
- foundation_decisions: Reused existing Next.js App Router, React client modal, local Dialog/Button/Item/Alert components, Prisma/PostgreSQL, Vitest, Playwright, and existing workflow artifacts.
- technical_decisions: Added `reimburseLedgerRecordAction`, `parseReimburseLedgerRecordForm`, active-only reimbursement persistence, domain rejection for non-active expenses, and real form submission from `RefundRecordDialog`. Reused `markExpensesReimbursedInDatabase` and `ReimbursementBatch`.
- release_target_and_result: `local_dev` ready for review. `corepack pnpm test`, `type-check`, `lint`, `build`, and full `test:e2e` passed; E2E suite includes record-detail refund success.
- accepted_risks: `/reimbursements` remains a placeholder; refund reversal is out of scope; production readiness, monitoring, rollback, OAuth production smoke, and external payment behavior are not assessed.
- learning_outcomes: Local review should check whether users discover `退款`, understand it as app settlement, trust the confirmation, and understand why edit/delete disappear after `已退款`.
- commits_or_prs: local commits `60324e4`, `3af3bca`, `a7c95e1`, `4764a9e`, `e6a94ac`, `f098828`, `86024e8`.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/intent/record-detail-reimbursement.md` | prune_candidate | Completed slice intent is summarized here. | mark_prune_candidate | This archive. |
| `.ai/domain-impact/record-detail-reimbursement.md` | prune_candidate | Change-level domain delta is summarized here. | mark_prune_candidate | This archive and maintained `.ai/domain/home-family-fund.md`. |
| `.ai/prototype/record-detail-reimbursement.md` | prune_candidate | Prototype decisions are now implemented and summarized. | mark_prune_candidate | This archive and E2E coverage. |
| `.ai/spec/record-detail-reimbursement.md` | prune_candidate | Behavior spec is completed and summarized. | mark_prune_candidate | This archive and tests. |
| `.ai/technical-design/record-detail-reimbursement.md` | prune_candidate | Design decisions are implemented and summarized. | mark_prune_candidate | This archive and committed code. |
| `.ai/implementation/record-detail-reimbursement.md` | prune_candidate | Implementation evidence is summarized. | mark_prune_candidate | This archive and commits. |
| `.ai/verification/record-detail-reimbursement.md` | prune_candidate | Verification evidence is summarized. | mark_prune_candidate | This archive. |
| `.ai/release/record-detail-reimbursement-local-dev-readiness.md` | prune_candidate | local_dev readiness is summarized. | mark_prune_candidate | This archive. |
| `.ai/learning/record-detail-reimbursement.md` | prune_candidate | Learning signals are summarized. | mark_prune_candidate | This archive. |
| `.ai/domain/home-family-fund.md` | maintained | Durable domain model remains source of truth. | keep | Maintained domain artifact. |
| `.ai/workflow.md` | maintained | Workflow inventory and next state remain active. | keep | Updated in this compression gate. |
| `.ai/project-context.md` | maintained | Project defaults and release target remain active. | keep | Maintained project context. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/record-detail-reimbursement.md`
- `.ai/domain-impact/record-detail-reimbursement.md`
- `.ai/prototype/record-detail-reimbursement.md`
- `.ai/spec/record-detail-reimbursement.md`
- `.ai/technical-design/record-detail-reimbursement.md`
- `.ai/implementation/record-detail-reimbursement.md`
- `.ai/verification/record-detail-reimbursement.md`
- `.ai/release/record-detail-reimbursement-local-dev-readiness.md`
- `.ai/learning/record-detail-reimbursement.md`

## Workflow Updates

- active_lifecycle_stage: Artifact Compression review for `record-detail-reimbursement`.
- artifact_inventory_changes: record detail reimbursement lifecycle artifacts are now summarized by this archive.
- archive_notes: future work should start from this archive, maintained domain/project artifacts, and git history unless full intermediate evidence is needed.

## Risks

- traceability_risks: Low; archive links all source artifacts and commits.
- audit_or_compliance_risks: No production financial transfer or regulated payment execution occurred; app state only.
- unresolved_work: refund reversal, batch reimbursement table completion, and production release readiness remain future intents.

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
  - `.ai` has a clear completed-work summary
  - future work can resume from maintained files and archive summary
- unresolved_blockers:
  - none
- next_step: approve compression, then optionally request `artifact-prune` or start the next Intent Intake.
