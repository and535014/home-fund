---
id: archive-app-seam-refactor-2026-06-26
stage: artifact-compression
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/app-seam-refactor.md
  - .ai/technical-design/app-seam-refactor.md
  - .ai/implementation/app-seam-refactor.md
  - .ai/verification/app-seam-refactor.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/app-seam-refactor.md
    - .ai/technical-design/app-seam-refactor.md
    - .ai/implementation/app-seam-refactor.md
    - .ai/verification/app-seam-refactor.md
  commits_or_prs:
    - 3bdd8fc6 Add app seam refactor intent
    - 51951527 Add app seam refactor technical design
    - 0720654c Refactor app seam imports
    - 00d0d80d Verify app seam refactor
reviewed_at: 2026-06-26
---

# Artifact Compression for App Seam Refactor

## Compression Decision

- scope: completed `app-seam-refactor` structural refactor.
- reason: Intent through Verification is complete for `local_dev`; future structural work should start from this compact decision record instead of rereading every intermediate artifact.
- decision: compress
- next_lifecycle_entry: Optional `artifact-prune` only by explicit request, next Intent Intake, or stricter-target release readiness for unrelated release work.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Remove inward dependencies on `src/app` so the Next.js App Router layer stays a route adapter instead of becoming a shared core module.
- final_behavior_or_spec: No user-facing behavior changed. The refactor only changed module ownership and import direction. Traditional Chinese blocked-access copy was preserved exactly.
- domain_rules: No domain policy, lifecycle, role, permission, reimbursement, ledger, reporting total, or financial rule changed.
- foundation_decisions: Existing Next.js App Router, TypeScript path alias, module-per-bounded-context structure, Vitest, Prisma generation flow, and DDD workflow foundation were reused. No foundation change was required.
- technical_decisions: `RecordQueryState` and pure in-memory record query helpers now live at `src/modules/reporting/record-query.ts`; Reporting search query construction imports that seam. `HomeBlockedView` and access-failure view shaping now live at `src/modules/identity-access/home-blocked-view.ts`; `src/auth/app-access.ts` depends on Identity and Access instead of `src/app`. `src/app/home-access.ts` remains the Web App Shell adapter for dashboard/access composition. Generic shared folders were intentionally avoided.
- release_target_and_result: Target is `local_dev`; verification passed import-direction check, lint, type-check, and full unit tests. No Target-Aware Release gate was required because there were no schema, config, migration, deployment, auth-provider, or operational changes.
- accepted_risks: Experience Prototype and Behavior Spec / BDD / E2E were skipped as accepted risk because the slice had no intended UI behavior change. Wider `src/components/layout/* -> @/app/record-create-context` imports remain as a future Web App Shell cleanup candidate.
- learning_outcomes: Future architecture cleanup should first address remaining Web App Shell imports only if they create real inward dependency pressure. Avoid broad `src/app` folder moves without a focused seam or workflow slice.
- commits_or_prs: See `trace_links.commits_or_prs` above; no PR link is recorded in this local branch workflow.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level defaults and constraints remain active. | keep | Maintained source of truth. |
| `.ai/workflow.md` | maintained | Workflow inventory and next entry point remain active. | keep | Updated by this compression gate. |
| `.ai/foundation-architecture/home-family-fund.md` | maintained | Durable Web App Shell and module ownership decisions remain active. | keep | Maintained source of truth. |
| `.ai/code-understanding/home-family-fund.md` | maintained | Repo map remains useful for future architecture work. | keep | Maintained source of truth. |
| `.ai/intent/app-seam-refactor.md` | prune_candidate | Intent decisions are summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/technical-design/app-seam-refactor.md` | prune_candidate | Technical decisions are implemented and summarized here. | mark_prune_candidate | This archive and committed code. |
| `.ai/implementation/app-seam-refactor.md` | prune_candidate | Implementation evidence is summarized here. | mark_prune_candidate | This archive, code, and test history. |
| `.ai/verification/app-seam-refactor.md` | prune_candidate | Verification evidence and residual risks are summarized here. | mark_prune_candidate | This archive and command history. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/app-seam-refactor.md`
- `.ai/technical-design/app-seam-refactor.md`
- `.ai/implementation/app-seam-refactor.md`
- `.ai/verification/app-seam-refactor.md`

## Workflow Updates

- active_lifecycle_stage: No active `app-seam-refactor` gate remains after this compression review.
- artifact_inventory_changes: app-seam-refactor intent, technical-design, implementation, and verification artifacts are now summarized in this archive.
- archive_notes: keep this archive as the first read for future app seam, import-direction, Reporting query-state, Identity and Access blocked-view, or Web App Shell cleanup work, together with maintained project/foundation/workflow artifacts.

## Risks

- traceability_risks: Low; the archive preserves source artifact paths and commit hashes, and source files remain available until optional manual prune.
- audit_or_compliance_risks: None identified; this was a local structural refactor with no financial behavior, auth provider, data, migration, or production release change.
- unresolved_work: `src/components/layout` still imports `@/app/record-create-context`; broader `src/app` top-level grouping remains a future cleanup candidate and should start with its own Intent Intake if pursued.

## Review Gate

- decision: review
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - prune candidates are safe to consider later
  - remaining Web App Shell cleanup is clearly out of scope
- must_check:
  - summary is enough for future app seam context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary
  - future structural work can resume from maintained files and this archive summary
- unresolved_blockers:
  - none
- next_step: Approve this compression, then optionally request `artifact-prune`; otherwise start the next Intent Intake or stricter-target release readiness.
