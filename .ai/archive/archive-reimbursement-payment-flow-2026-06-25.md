---
id: archive-reimbursement-payment-flow-2026-06-25
stage: artifact-compression
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/prototype/reimbursement-payment-flow.md
  - .ai/spec/reimbursement-payment-flow.md
  - .ai/technical-design/reimbursement-payment-flow.md
  - .ai/implementation/reimbursement-payment-flow.md
  - .ai/verification/reimbursement-payment-flow.md
  - .ai/release/reimbursement-payment-flow-local-dev-readiness.md
  - .ai/learning/reimbursement-payment-flow.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/reimbursement-payment-flow.md
    - .ai/domain-impact/reimbursement-payment-flow.md
    - .ai/prototype/reimbursement-payment-flow.md
    - .ai/spec/reimbursement-payment-flow.md
    - .ai/technical-design/reimbursement-payment-flow.md
    - .ai/implementation/reimbursement-payment-flow.md
    - .ai/verification/reimbursement-payment-flow.md
    - .ai/release/reimbursement-payment-flow-local-dev-readiness.md
    - .ai/learning/reimbursement-payment-flow.md
  commits_or_prs:
    - 810d6a9 Define reimbursement payment flow domain
    - fb067ec Prototype reimbursement payment capture
    - e2d32f2 Specify reimbursement payment behavior
    - 9f1d660 Design reimbursement payment persistence
    - 8c190e0 Implement reimbursement payment persistence
    - b9d94fb Verify reimbursement payment flow
    - e9a5200 Assess reimbursement payment local dev release
    - 7dd1bb5 Define reimbursement payment learning signals
reviewed_at:
---

# Artifact Compression for Reimbursement Payment Flow

## Compression Decision

- scope: completed `reimbursement-payment-flow` feature slice.
- reason: Intent through Learning Loop is complete for `local_dev`, and future work should resume from a compact decision record instead of rereading every intermediate artifact.
- decision: compress
- next_lifecycle_entry: Optional `artifact-prune` only by explicit request, stricter-target release readiness, or next Intent Intake.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Refund settlement should record real-world reimbursement payment evidence instead of only changing a ledger record to `已退款`.
- final_behavior_or_spec: Single-record and batch refund require payment method and date-only payment date, plus optional transaction note. The refund form shows only editable payment fields and does not expose paid-to member, refund amount, or payment source as form controls. Batch refund shows `將處理`, `略過`, and `退款總金額`; confirmation is disabled when eligible selected records span multiple paid-to members.
- domain_rules: Reimbursement payment evidence records that a real-world reimbursement happened; the app does not execute a transfer. One reimbursement batch records one payment to one paid-to member. Paid-to member, amount, and fixed household-fund payment source are derived from selected eligible member-paid expenses. Cross-member batches, partial refunds, split payment methods, post-settlement edits, corrections, and reversals are out of scope. Payment evidence must not become an ordinary ledger income or expense.
- foundation_decisions: Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, local UI components, Vitest, Playwright, and Docker-based local database foundation were reused. No project foundation change was required.
- technical_decisions: Added `ReimbursementPayment` persistence with Prisma migration `20260624172000_add_reimbursement_payments`. `MarkExpensesReimbursedCommand` remains a pure domain selection command; payment settlement persistence is handled by a separate shared helper. Single-record and batch refund write reimbursement batch, payment evidence, and ledger status atomically. Batch delete and batch refund dialogs are separate components.
- release_target_and_result: Target is `local_dev`; readiness is approved for local review, not production. Verification passed `corepack pnpm db:validate`, `type-check`, `lint`, full unit tests, and full Playwright E2E. E2E applied the reimbursement payment migration to `home_fund_e2e`.
- accepted_risks: Same-member batch refund success is covered by unit/server-action tests but not current E2E fixture data. Legacy reimbursement batches may have no payment row. Payment evidence readback for already reimbursed records remains minimal. E2E depends on Docker Desktop and local PostgreSQL. Production readiness remains unassessed.
- learning_outcomes: Local review should check whether users understand the app records but does not send reimbursement payments, whether the three editable fields are enough for audit, whether derived amount/member/source are still trusted when not shown as form controls, whether cross-member blocking is acceptable, and whether readback, correction, reversal, partial refund, or split payment should become future intents.
- commits_or_prs: See `trace_links.commits_or_prs` above; no PR link is recorded in this local branch workflow.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level defaults and constraints remain active. | keep | Maintained source of truth. |
| `.ai/workflow.md` | maintained | Workflow inventory and next entry point remain active. | keep | Updated by this compression gate. |
| `.ai/domain/home-family-fund.md` | maintained | Durable reimbursement and ledger domain rules remain active for future features. | keep | Maintained source of truth. |
| `.ai/intent/reimbursement-payment-flow.md` | prune_candidate | Intent decisions are summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/domain-impact/reimbursement-payment-flow.md` | prune_candidate | Change-level domain impact is summarized here; durable rules remain in maintained domain artifacts. | mark_prune_candidate | This archive and `.ai/domain/home-family-fund.md`. |
| `.ai/prototype/reimbursement-payment-flow.md` | prune_candidate | Prototype decisions and UX outcomes are summarized here. | mark_prune_candidate | This archive and implemented code. |
| `.ai/spec/reimbursement-payment-flow.md` | prune_candidate | Accepted behavior and E2E design are summarized here. | mark_prune_candidate | This archive and tests. |
| `.ai/technical-design/reimbursement-payment-flow.md` | prune_candidate | Technical decisions are implemented and summarized here. | mark_prune_candidate | This archive and committed code. |
| `.ai/implementation/reimbursement-payment-flow.md` | prune_candidate | Implementation evidence is summarized here. | mark_prune_candidate | This archive, code, and test history. |
| `.ai/verification/reimbursement-payment-flow.md` | prune_candidate | Verification evidence and residual risks are summarized here. | mark_prune_candidate | This archive and command history. |
| `.ai/release/reimbursement-payment-flow-local-dev-readiness.md` | prune_candidate | Local_dev readiness and accepted risks are summarized here. | mark_prune_candidate | This archive. |
| `.ai/learning/reimbursement-payment-flow.md` | prune_candidate | Learning questions and follow-up criteria are summarized here. | mark_prune_candidate | This archive. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/reimbursement-payment-flow.md`
- `.ai/domain-impact/reimbursement-payment-flow.md`
- `.ai/prototype/reimbursement-payment-flow.md`
- `.ai/spec/reimbursement-payment-flow.md`
- `.ai/technical-design/reimbursement-payment-flow.md`
- `.ai/implementation/reimbursement-payment-flow.md`
- `.ai/verification/reimbursement-payment-flow.md`
- `.ai/release/reimbursement-payment-flow-local-dev-readiness.md`
- `.ai/learning/reimbursement-payment-flow.md`

## Workflow Updates

- active_lifecycle_stage: No active reimbursement-payment-flow gate remains after this compression review.
- artifact_inventory_changes: reimbursement-payment-flow intent, domain-impact, prototype, spec, technical-design, implementation, verification, release, and learning artifacts are now summarized in this archive.
- archive_notes: keep this archive as the first read for future reimbursement payment changes, together with maintained project/domain/workflow artifacts.

## Risks

- traceability_risks: Low; the archive preserves source artifact paths and commit hashes, and source files remain available until optional manual prune.
- audit_or_compliance_risks: No production payment execution or regulated transfer occurred. If this feature moves beyond local_dev or integrates external money movement, production compliance and operational readiness need a new gate.
- unresolved_work: Production readiness, payment evidence readback, correction/reversal, partial refunds, split payment methods, and split-by-member batch refund remain separate future intents or release gates.

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
- next_step: Approve this compression, then optionally request `artifact-prune`; otherwise start the next Intent Intake or stricter-target release readiness.
