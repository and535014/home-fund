---
name: workflow-init
description: Use when starting, bootstrapping, initializing, adopting, or resuming the DDD website harness lifecycle; creates .ai workflow scaffolding, records project defaults, classifies whether foundation architecture/init is required, and routes to the first lifecycle gate.
---

# DDD Workflow Init

## Purpose

Prepare a repository to use the redesigned DDD website harness lifecycle. This skill creates the project-level scaffolding, records defaults, inventories current context, and routes the project into the correct lifecycle gate without creating downstream decisions prematurely.

## Lifecycle

The current workflow version is `ddd-website-lifecycle-v2`.

Main lifecycle:

1. `Intent Intake` - capture a product, feature, page, content, release, migration, or rewrite intent.
2. `Domain Discovery` - model domain events, commands, actors, policies, aggregates, bounded contexts, and language only when business behavior warrants it.
3. `Project Foundation Architecture` - for new projects, migrations, rewrites, or unclear foundations, decide the site-wide framework, tooling, lint, tests, routing, styling, component strategy, prototype host, commands, and CI baseline.
4. `Project Foundation Implementation / Init` - scaffold and verify the foundation immediately after foundation decisions; do not proceed to repo-based prototype until dev/lint/test/e2e baseline is runnable.
5. `Experience Prototype` - produce a repo-based production-stack interactive prototype using the actual frontend stack, component library, and project components for user-facing work.
6. `Behavior Spec / BDD / E2E` - finalize acceptance criteria, BDD scenarios, E2E design, fixtures, selectors, accessibility, responsive, and tracking checks before feature technical design.
7. `Feature Technical Design` - decide route/module boundaries, frontend/backend contracts, data/state ownership, validation, API shape, and test mapping for a specific slice.
8. `TDD Implementation` - implement tests first, evolve prototype into production code, and stay inside the behavior spec.
9. `Verification` - prove tests, BDD/E2E, UX gaps, DDD trace, and architecture alignment.
10. `Target-Aware Release` - assess release readiness for the declared target environment.
11. `Release Execution` - execute or record production deployment only after production readiness is approved and deployment is explicitly requested.
12. `Learning Loop` - define post-release signals, feedback, analytics/monitoring maturity, and follow-up decision criteria.
13. `Artifact Compression` - summarize completed lifecycle work, preserve traceability, and identify optional prune candidates without deleting files.

Upgrade lifecycle:

1. `Workflow Migration / Upgrade`
2. `Artifact Inventory`
3. `Stage Mapping`
4. `Gap Classification`
5. `Backfill Plan`
6. `Resume At New Workflow Stage`

## Workflow

1. Inspect the project root, including existing `.ai/`, README/docs, manifests, source folders, tests, deployment config, and git status when available.
2. Classify the project as `new_empty`, `new_scaffolded`, `existing_without_ai`, or `existing_with_ai`.
3. Create missing `.ai` directories for the v2 lifecycle:
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
   - `.ai/deployment/`
   - `.ai/learning/`
   - `.ai/workflow-migration/`
   - `.ai/archive/`
   - `.ai/archive/files/`
4. Do not create legacy workflow directories during v2 initialization. Legacy directories such as `.ai/idea/`, `.ai/change/`, `.ai/ddd/`, `.ai/stories/`, `.ai/experience-design/`, `.ai/architecture/`, `.ai/verification-design/`, `.ai/deploy/`, and `.ai/post-release/` are migration inputs only and belong to `workflow-migration`.
5. Create or update `.ai/workflow.md`, `.ai/project-context.md`, and repo-root `AGENTS.md` using `references/init-artifacts.md`; `AGENTS.md` must include the DDD workflow enforcement and gate approval rules.
6. Preserve existing artifacts. Do not overwrite user-authored `.ai` files unless the user asks for a refresh.
7. Record `workflow_version: ddd-website-lifecycle-v2`, `active_lifecycle_stage`, `release_target`, and `migration_status`.
8. Determine whether Project Foundation Architecture and Project Foundation Implementation / Init are required:
   - required for `new_project`, `new_empty`, major migration, rewrite, unclear foundation, or missing frontend/test foundation.
   - skipped for ordinary existing-project feature work when the stack and baseline commands are already known.
9. Detect optional code-understanding aids such as Graphify, but do not require them.
10. Report classification, created/updated files, foundation requirement, release target, migration status, and recommended next skill.

## Profile and Target Selection

- Honor explicit user-provided `delivery_profile`, `release_target`, project type, and target environment first.
- Accepted `delivery_profile` values are `mvp` and `production` unless the repo defines a broader vocabulary.
- Accepted `release_target` values are `local_dev`, `internal_demo`, `preview`, `staging`, `production`, and `unknown`.
- Default to `delivery_profile: mvp`.
- Default to `release_target: local_dev` unless the user or repo names a target.
- Passing a release gate for one target never implies readiness for a stricter target.

## Routing

- Existing `.ai` workflow or stale workflow version: route to `workflow-migration`.
- No clear product, feature, website, or release intent: route to `intent-intake`.
- Clear existing-site change intent: route to `intent-intake`.
- Clear new product/site intent with no intent artifact: route to `intent-intake`.
- Domain behavior, policies, workflows, state transitions, roles, permissions, payments, approvals, lifecycle, quotas, or cross-role collaboration: route to `domain-discovery`.
- New project, migration, rewrite, or missing/unclear foundation: route to `project-foundation-architecture` for Project Foundation Architecture.
- Foundation decisions exist but scaffold/dev/lint/test/e2e/prototype-host baseline is missing: route to `project-foundation-implementation` for Project Foundation Implementation / Init.
- User-facing work with foundation ready: route to `experience-prototype` for Experience Prototype.
- Prototype accepted or skipped with accepted risk: route to `behavior-spec` for Behavior Spec / BDD / E2E.
- Behavior spec exists: route to `feature-technical-design` for Feature Technical Design.
- Technical design and behavior spec exist: route to `tdd-implementation`.
- Implementation complete: route to `verification`.
- Verification passed or risks accepted: route to `target-aware-release`.
- Production release readiness passed or risks accepted and deployment is explicitly requested: route to `release-execution`.
- Release complete or learning signals needed: route to `learning-loop`.
- Learning loop complete and release/iteration should be closed: route to `artifact-compression`.

## Rules

- Initialization is non-destructive. Never delete, rename, or rewrite existing artifacts as part of init.
- New v2 artifacts must use v2 directories only. Do not create new files in legacy directories.
- Treat architecture as two separate gates: project foundation architecture for site-wide foundation, and feature technical design for story-level implementation choices.
- For new projects, Project Foundation Implementation / Init is required immediately after Project Foundation Architecture.
- Do not allow production-stack interactive prototype, BDD/E2E, or TDD implementation to proceed in a new project until foundation init has verified runnable baseline commands, selected component library setup, and a production-stack prototype host.
- Keep assumptions explicit in `.ai/project-context.md` and responses.
- Each lifecycle artifact carries its own `Review Gate`; do not route to a separate review skill.
- Project `AGENTS.md` must enforce this workflow for all non-trivial project changes.
- After completing any lifecycle gate, stop and wait for explicit user approval before starting the next gate. Do not continue automatically, scaffold, prototype, test, implement, release, archive, or otherwise develop ahead of approval.
- After completing Experience Prototype, stop for user review and do not commit prototype code or `.ai/prototype/` artifacts until the user explicitly approves the prototype.
- If the user asks for implementation while an upstream gate is incomplete, complete only the owning gate artifact and ask for confirmation before moving on.

## Handoff

End by naming the next lifecycle gate, owning skill, and minimum input required.
