---
id: archive-search-reimbursement-payment-records-2026-06-26
stage: artifact-compression
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
  - .ai/prototype/search-reimbursement-payment-records.md
  - .ai/spec/search-reimbursement-payment-records.md
  - .ai/technical-design/search-reimbursement-payment-records.md
  - .ai/implementation/search-reimbursement-payment-records.md
  - .ai/verification/search-reimbursement-payment-records.md
  - .ai/release/search-reimbursement-payment-records-local-dev-readiness.md
  - .ai/learning/search-reimbursement-payment-records.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/search-reimbursement-payment-records.md
    - .ai/domain-impact/search-reimbursement-payment-records.md
    - .ai/prototype/search-reimbursement-payment-records.md
    - .ai/spec/search-reimbursement-payment-records.md
    - .ai/technical-design/search-reimbursement-payment-records.md
    - .ai/implementation/search-reimbursement-payment-records.md
    - .ai/verification/search-reimbursement-payment-records.md
    - .ai/release/search-reimbursement-payment-records-local-dev-readiness.md
    - .ai/learning/search-reimbursement-payment-records.md
  commits_or_prs:
    - 60c0c1b6 Capture reimbursement payment search intent
    - 8d775d28 Prototype reimbursement payment search
    - 8f89cf53 Prototype refund record search tabs
    - d60b0e5a Specify refund record search behavior
    - d12ab1b4 Document refund record search technical design
    - 65cd4de1 Add reimbursement payment search
    - 28faea0c Verify reimbursement payment search
    - 6c633464 Assess reimbursement payment search local release
    - be5cdc73 Define reimbursement payment search learning
reviewed_at:
---

# Artifact Compression for Search Reimbursement Payment Records

## Compression Decision

- scope: completed `search-reimbursement-payment-records` feature slice.
- reason: Intent through Learning Loop is complete for `local_dev`; future work should start from this compact decision record instead of rereading every intermediate artifact.
- decision: compress
- next_lifecycle_entry: Optional `artifact-prune` only by explicit request, stricter-target release readiness, or next Intent Intake.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Make reimbursement payment evidence discoverable from `/search` without mixing it with ordinary income/expense ledger records or report totals.
- final_behavior_or_spec: `/search` has two tabs: `收支紀錄` and `退款紀錄`. `退款紀錄` stays blank until a keyword or filter is applied. Refund records are read-only, use row copy `付給 <收款成員>` with payment method as description, show amount and payment date, and open a read-only `退款紀錄` dialog. The dialog exposes `查看關聯紀錄`, and already-refunded member-paid expenses can open the related refund record through `查看退款紀錄`.
- domain_rules: `退款紀錄` is the user-facing term for reimbursement payment evidence backed by `ReimbursementPayment`. Reimbursement payment evidence is not an ordinary `LedgerRecord`, must not affect income/expense/net totals, remains excluded from selection and batch mutation actions, and is scoped by household and actor access. Legacy `已退款` expenses without payment evidence remain valid and should not fabricate a refund record.
- foundation_decisions: Existing Next.js App Router, React, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, Playwright, and Docker-based local database foundation were reused. No foundation change was required.
- technical_decisions: Added `src/modules/reporting/reimbursement-payment-search-query.ts` as the reporting read model; added `/search` server actions for page load, single-record readback, and batch readback; added reimbursement payment search indexes in migration `20260625233000_add_reimbursement_payment_search_indexes`; split route-local UI into `record-search-results`, `reimbursement-payment-dialogs`, `reimbursement-payment-loader`, and display helpers; kept mutation ownership in ledger/reimbursement server actions.
- release_target_and_result: Target is `local_dev`; release readiness is `ready_for_local_dev_review`, not production. Verification passed targeted query/action/unit tests, type-check, lint, production build, and `corepack pnpm test:e2e e2e/record-search.spec.ts` with 12 Playwright tests. E2E applied the reimbursement payment search migration to `home_fund_e2e`.
- accepted_risks: Full unit suite and full E2E suite were not rerun in the release gate; targeted unit coverage and full record-search E2E passed. E2E reimbursement payment fixtures are verification data only. Production migration rollout, auth smoke, monitoring/logging, query performance at production scale, and correction/reversal policy remain unassessed.
- learning_outcomes: Local review should test whether users understand `退款紀錄` as payment evidence rather than ordinary records, whether blank default state is desirable, whether `收款成員`/payment date/sort are enough filters, whether `付款方式` needs a future filter, whether bidirectional readback is discoverable, and whether edit/reversal/correction/partial refund should become separate intents.
- commits_or_prs: See `trace_links.commits_or_prs` above; no PR link is recorded in this local branch workflow.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level defaults and constraints remain active. | keep | Maintained source of truth. |
| `.ai/workflow.md` | maintained | Workflow inventory and next entry point remain active. | keep | Updated by this compression gate. |
| `.ai/domain/home-family-fund.md` | maintained | Durable ledger/reimbursement/reporting rules remain active for future features. | keep | Maintained source of truth. |
| `.ai/intent/search-reimbursement-payment-records.md` | prune_candidate | Intent decisions are summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/domain-impact/search-reimbursement-payment-records.md` | prune_candidate | Change-level domain impact is summarized here; durable rules remain in maintained domain artifacts. | mark_prune_candidate | This archive and `.ai/domain/home-family-fund.md`. |
| `.ai/prototype/search-reimbursement-payment-records.md` | prune_candidate | Prototype decisions and UX outcomes are summarized here. | mark_prune_candidate | This archive and implemented code. |
| `.ai/spec/search-reimbursement-payment-records.md` | prune_candidate | Accepted behavior and E2E design are summarized here. | mark_prune_candidate | This archive and tests. |
| `.ai/technical-design/search-reimbursement-payment-records.md` | prune_candidate | Technical decisions are implemented and summarized here. | mark_prune_candidate | This archive and committed code. |
| `.ai/implementation/search-reimbursement-payment-records.md` | prune_candidate | Implementation evidence is summarized here. | mark_prune_candidate | This archive, code, and test history. |
| `.ai/verification/search-reimbursement-payment-records.md` | prune_candidate | Verification evidence and residual risks are summarized here. | mark_prune_candidate | This archive and command history. |
| `.ai/release/search-reimbursement-payment-records-local-dev-readiness.md` | prune_candidate | Local_dev readiness and accepted risks are summarized here. | mark_prune_candidate | This archive. |
| `.ai/learning/search-reimbursement-payment-records.md` | prune_candidate | Learning questions and follow-up criteria are summarized here. | mark_prune_candidate | This archive. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/search-reimbursement-payment-records.md`
- `.ai/domain-impact/search-reimbursement-payment-records.md`
- `.ai/prototype/search-reimbursement-payment-records.md`
- `.ai/spec/search-reimbursement-payment-records.md`
- `.ai/technical-design/search-reimbursement-payment-records.md`
- `.ai/implementation/search-reimbursement-payment-records.md`
- `.ai/verification/search-reimbursement-payment-records.md`
- `.ai/release/search-reimbursement-payment-records-local-dev-readiness.md`
- `.ai/learning/search-reimbursement-payment-records.md`

## Workflow Updates

- active_lifecycle_stage: No active `search-reimbursement-payment-records` gate remains after this compression review.
- artifact_inventory_changes: search-reimbursement-payment-records intent, domain-impact, prototype, spec, technical-design, implementation, verification, release, and learning artifacts are now summarized in this archive.
- archive_notes: keep this archive as the first read for future refund-record search, reimbursement payment search, or reimbursement audit-readback changes, together with maintained project/domain/workflow artifacts.

## Risks

- traceability_risks: Low; the archive preserves source artifact paths and commit hashes, and source files remain available until optional manual prune.
- audit_or_compliance_risks: No production payment execution or regulated transfer occurred. If this feature moves beyond local_dev or integrates external money movement, production compliance and operational readiness need a new gate.
- unresolved_work: Production readiness, payment evidence correction/reversal, partial refunds, split payment methods, default recent refund records, stricter member visibility policy, and payment-method filtering remain separate future intents or release gates.

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
