---
id: archive-search-route-local-structure-2026-06-26
stage: artifact-compression
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/search-route-local-structure.md
  - .ai/technical-design/search-route-local-structure.md
  - .ai/implementation/search-route-local-structure.md
  - .ai/verification/search-route-local-structure.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/search-route-local-structure.md
    - .ai/technical-design/search-route-local-structure.md
    - .ai/implementation/search-route-local-structure.md
    - .ai/verification/search-route-local-structure.md
  commits_or_prs:
    - 20a27a35 Add search route structure intent
    - db7319b1 Add search route structure technical design
    - 09dc6fb3 Localize search route modules
    - 5a84b00b Verify search route structure
reviewed_at: 2026-06-26
---

# Artifact Compression for Search Route Local Structure

## Compression Decision

- scope: completed `search-route-local-structure` structural refactor.
- reason: Intent through Verification is complete for `local_dev`; future search structure work should start from this compact decision record instead of rereading every intermediate artifact.
- decision: compress
- next_lifecycle_entry: Optional `artifact-prune` only by explicit request, next Intent Intake, or stricter-target release readiness for unrelated release work.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Reduce `src/app` top-level clutter by moving `/search`-specific route implementation closer to the `/search` route without changing search behavior or UI.
- final_behavior_or_spec: No user-facing behavior changed. `/search` still exposes `收支紀錄` and `退款紀錄`, search filters, batch delete/refund actions, refund detail dialogs, related-record readback, and record details exactly as before.
- domain_rules: No domain policy, lifecycle, role, permission, reimbursement, ledger, reporting total, or financial rule changed.
- foundation_decisions: Existing Next.js App Router private-folder convention was reused. Search route-owned code now lives under `src/app/(app)/search/_components`, `_actions`, and `_lib`. Shared record detail/readback code used by both home and search lives under `src/app/_record-detail`. This is a route/app seam decision, not a new domain module.
- technical_decisions: Search page server actions moved to `src/app/(app)/search/_actions/record-search-actions.ts`; reimbursement payment readback actions were split into `src/app/_record-detail/reimbursement-payment-readback-actions.ts` so home dashboard record detail does not depend on `/search` private modules. Search UI moved to route-local `_components`; search batch helper moved to `_lib`. `category-visuals.tsx`, `action-state.ts`, `route-search-params.ts`, `use-action-state-effect.ts`, create-record, dashboard, settings, member, category, CSV import, and ledger action files remained out of scope.
- release_target_and_result: Target is `local_dev`; verification passed structure checks, stale import checks, lint, type-check, and full unit tests. No Target-Aware Release gate was required because there were no schema, config, migration, deployment, auth-provider, or operational changes.
- accepted_risks: Experience Prototype and Behavior Spec / BDD / E2E were skipped as accepted risk because the slice had no intended UI behavior change. Browser E2E was not run in verification for the same reason. Remaining top-level app helpers still deserve future review.
- learning_outcomes: Future `src/app` cleanup should treat route-local private folders and real app-level shared seams separately. Do not move multi-route helpers into a route-private folder. Start new intents for `category-visuals`, `action-state`, create-record, dashboard, or settings cleanup.
- commits_or_prs: See `trace_links.commits_or_prs` above; no PR link is recorded in this local branch workflow.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level defaults and constraints remain active. | keep | Maintained source of truth. |
| `.ai/workflow.md` | maintained | Workflow inventory and next entry point remain active. | keep | Updated by this compression gate. |
| `.ai/archive/archive-app-seam-refactor-2026-06-26.md` | maintained | Prior app seam decision remains relevant for future structure work. | keep | Maintained archive summary. |
| `.ai/foundation-architecture/home-family-fund.md` | maintained | Durable Web App Shell and module ownership decisions remain active. | keep | Maintained source of truth. |
| `.ai/intent/search-route-local-structure.md` | prune_candidate | Intent decisions are summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/technical-design/search-route-local-structure.md` | prune_candidate | Technical decisions are implemented and summarized here. | mark_prune_candidate | This archive and committed code. |
| `.ai/implementation/search-route-local-structure.md` | prune_candidate | Implementation evidence is summarized here. | mark_prune_candidate | This archive, code, and test history. |
| `.ai/verification/search-route-local-structure.md` | prune_candidate | Verification evidence and residual risks are summarized here. | mark_prune_candidate | This archive and command history. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/search-route-local-structure.md`
- `.ai/technical-design/search-route-local-structure.md`
- `.ai/implementation/search-route-local-structure.md`
- `.ai/verification/search-route-local-structure.md`

## Workflow Updates

- active_lifecycle_stage: No active `search-route-local-structure` gate remains after this compression review.
- artifact_inventory_changes: search-route-local-structure intent, technical-design, implementation, and verification artifacts are now summarized in this archive.
- archive_notes: keep this archive as the first read for future `/search` route-local structure, `src/app` top-level cleanup, shared record detail seam, or route-private folder work, together with maintained project/foundation/workflow artifacts.

## Risks

- traceability_risks: Low; the archive preserves source artifact paths and commit hashes, and source files remain available until optional manual prune.
- audit_or_compliance_risks: None identified; this was a local structural refactor with no financial behavior, auth provider, data, migration, or production release change.
- unresolved_work: Remaining top-level `src/app` helpers and workflows include `category-visuals.tsx`, `action-state.ts`, `route-search-params.ts`, `use-action-state-effect.ts`, create-record, dashboard, settings, member, category, CSV import, and ledger action files. These should be separate future intents if pursued.

## Review Gate

- decision: review
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - prune candidates are safe to consider later
  - future cleanup boundaries are clear
- must_check:
  - summary is enough for future `/search` structure context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary
  - future route-structure work can resume from maintained files and this archive summary
- unresolved_blockers:
  - none
- next_step: Approve this compression, then optionally request `artifact-prune`; otherwise start the next Intent Intake or stricter-target release readiness.
