---
id: archive-category-archive-visibility-toggle-2026-06-26
stage: artifact-compression
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/category-archive-visibility-toggle.md
  - .ai/domain-impact/category-archive-visibility-toggle.md
  - .ai/prototype/category-archive-visibility-toggle.md
  - .ai/spec/category-archive-visibility-toggle.md
  - .ai/technical-design/category-archive-visibility-toggle.md
  - .ai/implementation/category-archive-visibility-toggle.md
  - .ai/verification/category-archive-visibility-toggle.md
  - .ai/release/category-archive-visibility-toggle-local-dev-readiness.md
  - .ai/learning/category-archive-visibility-toggle.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/category-archive-visibility-toggle.md
    - .ai/domain-impact/category-archive-visibility-toggle.md
    - .ai/prototype/category-archive-visibility-toggle.md
    - .ai/spec/category-archive-visibility-toggle.md
    - .ai/technical-design/category-archive-visibility-toggle.md
    - .ai/implementation/category-archive-visibility-toggle.md
    - .ai/verification/category-archive-visibility-toggle.md
    - .ai/release/category-archive-visibility-toggle-local-dev-readiness.md
    - .ai/learning/category-archive-visibility-toggle.md
  commits_or_prs:
    - 6227e006 Document category archive visibility intent
    - 11b2eccf Discover category archive restore domain
    - daaf5f4b Prototype category archive visibility toggle
    - 02bee11c Specify category archive visibility behavior
    - 40664f5f Design category archive restore flow
    - fb35d6ba Implement category archive visibility toggle
    - 8a37a91f Verify category archive visibility toggle
    - 8fc8cd98 Assess category archive visibility local dev release
    - 998dafca Define category archive visibility learning loop
reviewed_at: 2026-06-26
---

# Artifact Compression for Category Archive Visibility Toggle

## Compression Decision

- scope: completed `category-archive-visibility-toggle` feature slice.
- reason: Intent through Learning Loop is complete for `local_dev`; future category archive/recovery work should start from this compact decision record plus maintained domain/workflow artifacts.
- decision: compress
- next_lifecycle_entry: Optional `artifact-prune` only by explicit request, next Intent Intake, or stricter-target release readiness for preview/staging/production.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Let admins show archived categories on `/settings/categories`, keep them hidden by default, place archived rows below active rows, and restore archived categories without database/manual intervention.
- final_behavior_or_spec: `/settings/categories` has one page-level `顯示封存分類` switch. Archived categories are hidden by default; when shown, they appear under active categories in `支出分類` and `收入分類`, retain visual identity, show an `已封存` icon in item media, and expose only icon-only `取消封存 <分類名稱>`. Successful unarchive shows `分類已取消封存`, moves the category back to active status, appends it to the active order for its type, and makes it available in new-record choices.
- domain_rules: Category unarchive is an admin-only Categorization lifecycle command. It rejects non-admin actors, missing categories, already-active categories, and duplicate active names in the same household/type. Archived categories remain readable for history and stay unavailable for new records until restored.
- foundation_decisions: No foundation change. The slice reused Next.js App Router, existing admin settings route, server actions, Prisma command adapter, Vitest, Playwright, Tailwind, shadcn-style `Item`, project `Switch`, and Lucide icons.
- technical_decisions: `unarchiveCategory` lives in `src/modules/categorization/category-catalog.ts`; `unarchiveCategoryInDatabase` persists status/sort order in the command adapter; `unarchiveCategoryAction` owns server action access, error mapping, revalidation, and success payload. The category page keeps archive visibility as local UI state. Local/E2E seeds now include archived income and expense categories. `ItemMedia variant="icon"` uses project design tokens for archived status alignment.
- release_target_and_result: Target is `local_dev`; release readiness is `ready_for_local_dev_review`. Evidence includes full Vitest, type-check, lint, schema validation, build, focused category-management E2E, and a temporary desktop/mobile visual probe. Production readiness is explicitly not assessed.
- accepted_risks: Full Playwright suite was not rerun; focused category E2E plus full unit/type/lint/build/schema checks passed. Temporary visual probe was not kept as a permanent test. Production OAuth, hosted database, monitoring, rollback, and analytics are out of scope.
- learning_outcomes: Local review should focus on switch discoverability, archived icon clarity, direct restore without confirmation, append-to-bottom ordering, duplicate-name copy, and whether archived categories stay out of routine category management until requested.
- commits_or_prs: See `trace_links.commits_or_prs` above; no PR link is recorded in this local branch workflow.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level defaults and constraints remain active. | keep | Maintained source of truth. |
| `.ai/workflow.md` | maintained | Workflow inventory and next entry point remain active. | keep | Updated by this compression gate. |
| `.ai/domain/home-family-fund.md` | maintained | Durable Categorization and access rules remain active. | keep | Maintained domain source of truth. |
| `.ai/intent/category-archive-visibility-toggle.md` | prune_candidate | Intent and scope decisions are summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/domain-impact/category-archive-visibility-toggle.md` | prune_candidate | Change-level domain delta is summarized here and durable rules remain in `.ai/domain/home-family-fund.md`. | mark_prune_candidate | This archive, maintained domain, and git history. |
| `.ai/prototype/category-archive-visibility-toggle.md` | prune_candidate | UX decisions and prototype gaps are closed and summarized here. | mark_prune_candidate | This archive, implementation, and verification. |
| `.ai/spec/category-archive-visibility-toggle.md` | prune_candidate | Acceptance criteria and E2E plan are implemented, verified, and summarized here. | mark_prune_candidate | This archive and test history. |
| `.ai/technical-design/category-archive-visibility-toggle.md` | prune_candidate | Domain/action/adapter/UI technical decisions are implemented and summarized here. | mark_prune_candidate | This archive and committed code. |
| `.ai/implementation/category-archive-visibility-toggle.md` | prune_candidate | Implementation evidence is summarized here. | mark_prune_candidate | This archive, code, and test history. |
| `.ai/verification/category-archive-visibility-toggle.md` | prune_candidate | Verification evidence and residual risks are summarized here. | mark_prune_candidate | This archive and command history. |
| `.ai/release/category-archive-visibility-toggle-local-dev-readiness.md` | prune_candidate | Local dev readiness result is summarized here. | mark_prune_candidate | This archive and command history. |
| `.ai/learning/category-archive-visibility-toggle.md` | prune_candidate | Learning questions and follow-up criteria are summarized here. | mark_prune_candidate | This archive. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/category-archive-visibility-toggle.md`
- `.ai/domain-impact/category-archive-visibility-toggle.md`
- `.ai/prototype/category-archive-visibility-toggle.md`
- `.ai/spec/category-archive-visibility-toggle.md`
- `.ai/technical-design/category-archive-visibility-toggle.md`
- `.ai/implementation/category-archive-visibility-toggle.md`
- `.ai/verification/category-archive-visibility-toggle.md`
- `.ai/release/category-archive-visibility-toggle-local-dev-readiness.md`
- `.ai/learning/category-archive-visibility-toggle.md`

## Workflow Updates

- active_lifecycle_stage: No active `category-archive-visibility-toggle` gate remains after this compression review.
- artifact_inventory_changes: category archive visibility intent, domain-impact, prototype, spec, technical-design, implementation, verification, release, and learning artifacts are now summarized in this archive.
- archive_notes: keep this archive as the first read for future category archive visibility, category restore, archived-row UI, or category lifecycle recovery work, together with maintained project/domain/workflow artifacts.

## Risks

- traceability_risks: Low; this archive preserves source artifact paths and commit hashes, and source files remain available until optional manual prune.
- audit_or_compliance_risks: Low; this is local_dev category administration behavior with no schema migration or production release. Historical ledger category references remain intact.
- unresolved_work: Production readiness is not assessed. Future work may revisit restore confirmation, persisted archive visibility preference, archived-category edit-before-restore, bulk restore, or clearer duplicate-name resolution.

## Review Gate

- decision: review
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - release and learning outcomes retained
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future category archive/restore context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary
  - future category archive work can resume from maintained files and this archive summary
- unresolved_blockers:
  - none
- next_step: Approve this compression, then optionally request `artifact-prune`; otherwise start the next Intent Intake or stricter-target release readiness.
