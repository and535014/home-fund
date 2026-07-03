---
name: workflow-migration
description: Use when an existing or in-progress DDD website workflow project should migrate to ddd-website-lifecycle-v2 without restarting; inventories old .ai artifacts, idempotently moves legacy artifacts into v2 directories, classifies gaps, updates missing or stale scaffolding, and recommends the smallest backfill path.
---

# DDD Workflow Migration / Upgrade

## Purpose

Migrate an existing or in-progress project to `ddd-website-lifecycle-v2` without rerunning completed work. This skill treats migration as an adoption path, not a product implementation step.

## Upgrade Lifecycle

1. Workflow Migration / Upgrade
2. Artifact Inventory
3. Stage Mapping
4. Gap Classification
5. Backfill Plan
6. Resume At New Workflow Stage

## Workflow

1. Read `AGENTS.md`, `.ai/workflow.md`, `.ai/project-context.md`, `.ai/workflow-migration/*.md`, target v2 directories, and existing `.ai/**` artifacts.
2. Run an idempotency check before writing or moving anything:
   - If `.ai/workflow.md` already records `workflow_version: ddd-website-lifecycle-v2`, `AGENTS.md` contains the required workflow enforcement section, v2 directories exist, and no active legacy source-of-truth artifacts remain, classify the project as `already_current` and produce or refresh only a concise migration report if missing.
   - If a legacy source path is absent and the mapped v2 destination already exists, classify that item as `already_migrated`.
   - If a legacy source path still exists and its mapped v2 destination also exists, classify that item as `blocked_conflict`; do not overwrite either file.
3. Identify the current workflow shape, active idea/change/story/release, delivery profile, release target, and completed artifacts.
4. Create only missing v2 workflow directories:
   - `.ai/intent/`
   - `.ai/domain/`
   - `.ai/domain-impact/`
   - `.ai/foundation-architecture/`
   - `.ai/foundation-implementation/`
   - `.ai/prototype/`
   - `.ai/spec/`
   - `.ai/technical-design/`
   - `.ai/implementation/`
   - `.ai/verification/`
   - `.ai/release/`
   - `.ai/learning/`
   - `.ai/workflow-migration/`
   - `.ai/archive/`
   - `.ai/archive/files/`
5. Inventory legacy directories and map them to v2 directories:
   - `.ai/idea/` and `.ai/change/` -> `.ai/intent/`
   - `.ai/ddd/` -> `.ai/domain/`
   - `.ai/stories/` and `.ai/verification-design/` -> `.ai/spec/`
   - `.ai/experience-design/` -> `.ai/prototype/`
   - `.ai/architecture/` -> `.ai/foundation-architecture/` or `.ai/technical-design/`
   - `.ai/deploy/` -> `.ai/release/`
   - `.ai/post-release/` -> `.ai/learning/`
6. Move only legacy artifacts that still exist and have no conflicting v2 destination. Prefer `git mv` when git is available so history stays connected.
   - For `.ai/ddd/`, move durable domain model content into `.ai/domain/project.md` or the relevant `.ai/domain/<bounded-context>.md`.
   - Move per-intent domain deltas into `.ai/domain-impact/<intent-id>.md`.
   - Create separate `.ai/domain/<bounded-context>.md` files only for stable bounded contexts with distinct language, ownership, lifecycle, or invariants.
7. Preserve filenames when clear; otherwise rename to v2 naming during the move and record the old path in trace links and the migration report.
8. Leave legacy directories empty after migration when possible. If a file cannot be safely classified or moved because of conflicts, block and ask the user instead of creating a bridge artifact.
9. Update project-level scaffolding only when missing, stale, or inconsistent:
   - `.ai/workflow.md`
   - `.ai/project-context.md`
   - repo-root `AGENTS.md`
10. Update `AGENTS.md` by inserting or replacing the exact marked `DDD-WEBSITE-WORKFLOW` section from `workflow-init/references/init-artifacts.md` only when the section is missing or outdated. Preserve user-authored content outside the markers.
11. Verify the updated `AGENTS.md` contains these enforcement lines exactly or with equivalent wording:
   - `All non-trivial product, design, frontend, backend, test, release, migration, or artifact-cleanup changes must use this lifecycle.`
   - `After completing any gate, stop and wait for explicit user approval before starting the next gate. Do not continue automatically.`
   - `Do not start implementation just because a plan exists; implementation starts only after Behavior Spec / BDD / E2E and Feature Technical Design are approved or explicitly accepted as risk.`
12. If `AGENTS.md` cannot be written or verified, mark migration `blocked`; do not report success.
13. Map old artifacts to v2 lifecycle candidates:
   - old idea/change -> Intent Intake
   - old DDD -> Domain Discovery
   - old code-understanding / impact-analysis -> foundation/code reality inputs
   - old experience-design -> Experience Prototype candidate
   - old verification-design -> Behavior Spec candidate
   - old architecture -> Project Foundation Architecture or Feature Technical Design candidate
   - old implementation -> TDD Implementation candidate
   - old verification -> Verification candidate
   - old deploy -> Target-Aware Release candidate
   - old post-release -> Learning Loop candidate
   - old archive/compressed summaries -> Artifact Compression candidate
14. Classify each v2 gate as `complete`, `usable_with_gaps`, `needs_backfill`, `obsolete`, or `not_applicable`.
15. Apply the backfill rules below.
16. Produce `.ai/workflow-migration/<migration-id>.md` using `references/workflow-update-report-template.md`.
17. Recommend one resume gate and one owning skill, or report `no_action_needed` when the project is already current. Do not proceed to that gate until the user confirms.

## Backfill Rules

- New project without foundation architecture: backfill Project Foundation Architecture.
- New project with foundation architecture but no scaffold/dev/lint/test/e2e baseline: backfill Project Foundation Implementation / Init.
- Existing UI/UX artifact without runnable production-stack interactive prototype evidence: backfill Experience Prototype.
- Existing AC without BDD/E2E design: backfill Behavior Spec / BDD / E2E.
- Architecture created before prototype/BDD: backfill Feature Technical Design review/update.
- Implementation without tests-first evidence: do not force a rewrite; record a Verification finding and accepted-risk decision.
- Deploy artifact without explicit target: backfill Target-Aware Release readiness.
- Production-bound release without learning/analytics/monitoring signals: backfill Learning Loop.
- Completed release/iteration without a summary artifact: backfill Artifact Compression. Excessive files after compression require explicit manual `artifact-prune`.

## Update Rules

- Treat this as migration/backfill, not a restart.
- This skill must be idempotent: repeated runs must not duplicate directories, rewrite current v2 artifacts, rerun completed moves, or change already migrated files.
- If the project is already on `ddd-website-lifecycle-v2` and only minor scaffolding is missing, update only the missing scaffolding and classify the rest as `already_current`.
- Migration is allowed and expected to move legacy `.ai` artifacts into v2 directories.
- Prefer `git mv` for legacy-to-v2 moves when git is available. If git is unavailable, use filesystem move and record the old path/new path mapping in the migration report.
- Move a legacy artifact only when the source exists and the intended v2 destination does not exist.
- If the old path is gone and the v2 artifact exists, classify it as `already_migrated` and do not touch it.
- If both old and new paths exist, classify it as `blocked_conflict`; do not overwrite or merge without user approval.
- Do not leave active source-of-truth artifacts in legacy directories after migration.
- Do not preserve or create one maintained domain model file per feature/request. Split legacy DDD/domain artifacts into maintained project/context domain models plus `.ai/domain-impact/<intent-id>.md` deltas.
- Do not create bridge artifacts as the normal path. Move the real artifact into the v2 directory.
- If multiple legacy files map to one v2 path, a destination already exists, or the owning v2 gate is ambiguous, stop and ask the user instead of guessing.
- Preserve user-authored `AGENTS.md` content outside the `DDD-WEBSITE-WORKFLOW` markers.
- Always add or refresh the marked DDD workflow section in `AGENTS.md` from `workflow-init/references/init-artifacts.md`; migration is incomplete and must be `blocked` if the section is absent or missing the enforcement lines.
- Backfill only when it reduces current risk, captures a missing decision, proves behavior, or unblocks the next gate.
- After completing migration or any backfill gate, stop and wait for explicit user approval before starting the recommended next gate. Do not automatically implement, scaffold, prototype, test, release, or archive ahead of approval.
- If implementation is already underway, prefer backfilling Behavior Spec, production-stack prototype gaps, technical design review, or verification gaps over rerunning early discovery.
- Static HTML, screenshot, Figma-only, or throwaway non-project-stack prototypes are legacy UX evidence, not complete v2 Experience Prototype artifacts.
- If migration reveals the project is actually at the beginning, resume at Intent Intake instead of pretending legacy artifacts are complete.
- Missing Graphify output is optional and never blocks migration.

## Handoff

End with a migration summary, idempotency result, gate classifications, smallest backfill path, recommended resume gate, and owning skill. If nothing needed to change, state `no_action_needed`.
