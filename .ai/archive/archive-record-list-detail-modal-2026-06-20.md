---
id: archive-record-list-detail-modal-2026-06-20
stage: artifact-compression
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/record-list-detail-modal.md
  - .ai/prototype/record-list-detail-modal.md
  - .ai/spec/record-list-detail-modal.md
  - .ai/technical-design/record-list-detail-modal.md
  - .ai/implementation/record-list-detail-modal.md
  - .ai/verification/record-list-detail-modal.md
  - .ai/release/record-list-detail-modal-local-dev-readiness.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/record-list-detail-modal.md
    - .ai/prototype/record-list-detail-modal.md
    - .ai/spec/record-list-detail-modal.md
    - .ai/technical-design/record-list-detail-modal.md
    - .ai/implementation/record-list-detail-modal.md
    - .ai/verification/record-list-detail-modal.md
    - .ai/release/record-list-detail-modal-local-dev-readiness.md
  commits_or_prs:
    - afaa5a0 Add record list detail modal intent
    - b153be8 Prototype record list detail modal
    - 3b01cf2 Refine record list prototype
    - 8d43564 Add record list behavior spec
    - dd202ec Sync record list spec details
    - ec9ec5e Add record list technical design
    - d260940 Implement record list detail modal tests
    - 7a5744a Refine dashboard panel layout
    - 8cd2a8a Verify record list detail modal
    - 47b82d9 Add record list local dev readiness
reviewed_at: 2026-06-20
---

# Artifact Compression for Record List Detail Modal

## Compression Decision

- scope: completed dashboard record list/detail modal and related overview panel refinement slice.
- reason: The slice reached local_dev release readiness and has no active implementation or release blockers. Future work should read this archive first instead of re-reading every intermediate lifecycle artifact.
- decision: compress
- next_lifecycle_entry: next product change should start at Intent Intake; stricter preview/staging/production release should start at Target-Aware Release for the selected environment.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Replace the overview records table with an item list and read-only detail modal, while preserving existing selected-month data, recent-record limit, ledger domain behavior, auth, permissions, and Traditional Chinese dark-theme UI.
- final_behavior_or_spec: Dashboard records render as titled `紀錄` item buttons with category/name/payer/amount/date, absolute amount display, `YYYY/MM/DD` dates, and detail dialogs showing selected record amount/date/category/status/payer/note. Income detail status is `---`; fund-paid payer is `基金`; create-record actor copy is `支付者`.
- domain_rules: No schema, persistence, ledger, reimbursement, category, auth, permission, or route behavior changed. The dashboard still shows recent five selected-month records.
- foundation_decisions: Reuse existing Next.js App Router, server-loaded dashboard context, client-side `RecordListDetail`, Tailwind, local shadcn-style `Dialog`/`Item`, and Playwright E2E. No foundation or package change was required.
- technical_decisions: `RecordListDetail` owns selected-record client state and focus return; `HomePage` owns dashboard layout and serializable category/member lookup objects. A local `DashboardPanel` wrapper standardizes `待退款`, `支出分類`, and `紀錄` sections with `gap-3`, full cell sizing, top alignment, and a desktop divider before the records column. Overview keeps only `SummaryMetric` card frames; `收支趨勢` is unframed with top spacing; `支出分類` uses row statistics rather than a pie chart.
- release_target_and_result: Ready for `local_dev` review only. Verification passed lint, type-check, build, dashboard E2E 10/10, and create-record E2E 7/7. Local-dev readiness requires no migrations, secrets, OAuth callback changes, route changes, or deployment config changes.
- accepted_risks: No visual screenshot baseline was added; Playwright role/bounding-box assertions cover responsive and clipping behavior. Full monthly record browsing remains deferred. `src/app/dashboard-charts.tsx` still contains an unused expense pie chart export, which is a cleanup candidate but not a release blocker. Production readiness was not assessed.
- learning_outcomes: Learning Loop was explicitly skipped by user request. If this local-dev slice is reviewed with users, capture record-list scanability, detail modal usefulness, dashboard panel density, category stats readability, and trend chart spacing feedback in a future Learning Loop.
- commits_or_prs: `afaa5a0`, `b153be8`, `3b01cf2`, `8d43564`, `dd202ec`, `ec9ec5e`, `d260940`, `7a5744a`, `8cd2a8a`, `47b82d9`.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level stack and workflow defaults remain source of truth. | keep | This archive references it but does not replace it. |
| `.ai/workflow.md` | maintained | Workflow inventory and current state remain active. | keep | Updated to reference this archive. |
| `.ai/domain/home-family-fund.md` | maintained | Durable domain model remains authoritative. | keep | No domain replacement. |
| `.ai/intent/record-list-detail-modal.md` | prune_candidate | Intent is fully implemented, verified, released for local_dev, and summarized here. | mark_prune_candidate | This archive preserves scope and non-goals. |
| `.ai/prototype/record-list-detail-modal.md` | prune_candidate | Prototype decisions were implemented and later refined through review. | mark_prune_candidate | This archive preserves final UI decisions and superseding refinements. |
| `.ai/spec/record-list-detail-modal.md` | prune_candidate | Acceptance criteria are implemented, verified, and summarized. | mark_prune_candidate | This archive preserves final behavior and risks. |
| `.ai/technical-design/record-list-detail-modal.md` | prune_candidate | Component/data/state decisions are implemented and summarized. | mark_prune_candidate | This archive preserves the key technical decisions. |
| `.ai/implementation/record-list-detail-modal.md` | prune_candidate | Implementation evidence is summarized and committed. | mark_prune_candidate | This archive points to commits and verification. |
| `.ai/verification/record-list-detail-modal.md` | prune_candidate | Verification result is preserved here. | mark_prune_candidate | This archive records local_dev pass and accepted risks. |
| `.ai/release/record-list-detail-modal-local-dev-readiness.md` | prune_candidate | Local-dev readiness is summarized here. | mark_prune_candidate | This archive records release target/result and stricter-target gaps. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/record-list-detail-modal.md`
- `.ai/prototype/record-list-detail-modal.md`
- `.ai/spec/record-list-detail-modal.md`
- `.ai/technical-design/record-list-detail-modal.md`
- `.ai/implementation/record-list-detail-modal.md`
- `.ai/verification/record-list-detail-modal.md`
- `.ai/release/record-list-detail-modal-local-dev-readiness.md`

## Workflow Updates

- active_lifecycle_stage: completed and compressed record list detail modal slice.
- artifact_inventory_changes: add this archive as the long-term summary for the completed record list/detail modal and overview panel refinement work; mark intermediate slice artifacts as prune candidates.
- archive_notes: Do not delete source artifacts unless the user explicitly requests `artifact-prune`; use this archive plus git history as the compact trace.

## Risks

- traceability_risks: Low. Source artifacts and commit hashes remain available until explicit prune; this archive preserves scope, decisions, evidence, and release result.
- audit_or_compliance_risks: Low for local_dev. No financial data migration, schema migration, secrets change, production incident, or compliance decision was made.
- unresolved_work: Full monthly record browsing, optional cleanup of unused expense pie chart export, optional visual snapshot baseline, production readiness, and future UX learning signals.

## Review Gate

- decision: approve
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - release outcome retained
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary.
  - Future work can resume from maintained files and this archive summary.
- unresolved_blockers:
  - None.
- next_step:
  - Optional manual `artifact-prune` only if explicitly requested.
  - Otherwise start the next product/release change with Intent Intake.
