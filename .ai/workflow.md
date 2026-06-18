---
id: workflow
stage: init
status: active
delivery_profile: mvp
release_target: local_dev
inputs: []
outputs:
  - .ai/project-context.md
  - .ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md
trace_links:
  - .ai/intent/home-family-fund.md
  - .ai/intent/admin-only-category-management.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-only-category-management.md
  - .ai/foundation-architecture/home-family-fund.md
  - .ai/prototype/admin-only-category-management.md
  - .ai/spec/admin-only-category-management.md
  - .ai/code-understanding/home-family-fund.md
  - .ai/impact-analysis/home-family-fund-mvp-hardening.md
  - .ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md
  - .ai/release/home-family-fund-local-dev-readiness.md
  - .ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md
reviewed_at: 2026-06-18
---

# DDD Harness Workflow

## Workflow Version

- workflow_version: ddd-website-lifecycle-v2
- migration_report: `.ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md`
- migration_policy: Legacy artifacts have been moved into v2 directories with `git mv`. New workflow artifacts should be created only in v2 directories.

## Workflow Order

1. Intent Intake - clarify idea, change, audience, outcome, constraints, and release intent.
2. Domain Discovery - model events, commands, actors, policies, aggregates, bounded contexts, and language.
3. Project Foundation Architecture - establish repo-wide architecture, web foundation, route/layout conventions, data ownership, and integration boundaries.
4. Project Foundation Implementation / Init - prove scaffold, dev server, lint, type-check, unit, and E2E baseline.
5. Experience Prototype - make user-facing flows concrete enough to review before final specs.
6. Behavior Spec / BDD / E2E - define acceptance criteria, scenarios, selectors, data, and test strategy.
7. Feature Technical Design - record feature-specific boundaries, state/data ownership, server actions, persistence, and ADRs.
8. TDD Implementation - implement through failing tests, minimal code, and refactor.
9. Verification - run tests, review code, validate UX/domain/architecture traceability, and record accepted risks.
10. Target-Aware Release - assess release target, migrations, secrets, OAuth callbacks, rollback, smoke tests, and observability.
11. Learning Loop - define product analytics, monitoring, feedback, cadence, and follow-up decision criteria.

Use `workflow-review` as a non-linear review gate before any handoff when a concise approval, revision, or blocked decision is needed.
When visual review is useful, `workflow-review` may also create self-contained HTML under `.ai/reviews/html/`.

## Artifact Governance

Do not create a downstream artifact just because it exists in the workflow. Create it only when it reduces risk, captures a decision, proves behavior, or unblocks the next step.

### Required

- `.ai/project-context.md`
- `.ai/workflow.md`
- Intent/story artifact for the active change.
- Behavior spec or verification-design artifact before implementation.
- Implementation log for shipped local changes.
- Verification report for implemented behavior.

### V2 Directories

- `.ai/intent/` - v2 intent intake and active change framing.
- `.ai/domain/` - v2 domain discovery artifacts.
- `.ai/domain-impact/` - per-intent domain deltas and downstream implications.
- `.ai/foundation-architecture/` - repo-wide foundation architecture.
- `.ai/foundation-implementation/` - scaffold/dev/test baseline evidence.
- `.ai/prototype/` - interactive or reviewable experience prototypes.
- `.ai/spec/` - behavior specs, BDD, E2E plans.
- `.ai/technical-design/` - feature-level technical designs and ADR updates.
- `.ai/implementation/` - implementation logs.
- `.ai/verification/` - verification reports.
- `.ai/release/` - target-aware release readiness.
- `.ai/learning/` - post-release learning loop.
- `.ai/workflow-migration/` - workflow migration reports.
- `.ai/archive/` - compressed completed-work summaries and prune candidate records.

### Historical Inputs Now Migrated

- old `.ai/idea/` -> `.ai/intent/`
- old `.ai/ddd/` -> `.ai/domain/`
- old `.ai/stories/` and `.ai/verification-design/` -> `.ai/spec/`
- old `.ai/experience-design/` -> `.ai/prototype/`
- old `.ai/architecture/home-family-fund.md` -> `.ai/foundation-architecture/home-family-fund.md`
- old `.ai/architecture/*feature*.md` -> `.ai/technical-design/`
- old `.ai/deploy/` -> `.ai/release/`
- old `.ai/post-release/` -> `.ai/learning/`

### Conditional

- `.ai/intent/` - new idea or unclear product/change intent.
- `.ai/domain/` - non-trivial domain behavior, unclear language, policies, aggregates, or bounded contexts.
- `.ai/code-understanding/` - existing repo, non-trivial codebase, or change depends on current implementation.
- `.ai/impact-analysis/` - cross-module, data, integration, deploy, or high-risk impact.
- `.ai/prototype/` - user-facing web UX, forms, flows, states, accessibility, or tracking draft.
- `.ai/prototype/web-foundation.md` - first user-facing web story or repeated page/layout/component patterns need app-level UI consistency.
- `.ai/technical-design/` - boundary, contract, data ownership, integration, or quality-attribute decisions.
- `.ai/release/` - release target, environment, migration, rollback, secrets, observability, or operations concern.
- `.ai/learning/` - production-facing release learning, product analytics, feedback, monitoring, or follow-up decision criteria.

### Optional / On Demand

- `.ai/reviews/` - user requests review, handoff is high risk, artifact is long, or approval criteria are unclear.
- `.ai/reviews/html/` - visual review is requested or a complex `Visual Model` would materially reduce review effort.
- `Visual Model` sections - only for complex flows, maps, traces, or loops that are hard to review as prose.
- Graphify refresh - only at code-understanding boundaries and only when useful.

### Size Budget

- idea, code-understanding, impact-analysis, story: 1-2 pages unless risk requires more.
- experience-design, architecture, verification-design: 2-3 pages unless production risk requires more.
- implementation, verification, deploy: concise evidence logs with links to commands, files, or artifacts.
- reviewer brief: 1 page.
- static HTML: review surface only; not a second source of truth.

## Current State

- project_classification: existing_with_ai
- active_change: admin-only category management.
- latest_completed_slice: recurring reminder confirmation UI.
- current_stage: admin-only category management Behavior Spec / BDD / E2E is drafted.
- recommended_resume_gate: Feature Technical Design for admin-only category management.
- recommended_next_skill: architecture-planner

## Artifact Inventory

- idea: 1 artifact, `.ai/intent/home-family-fund.md`.
- ddd: 1 maintained artifact, `.ai/domain/home-family-fund.md`.
- domain-impact: 1 active change artifact, `.ai/domain-impact/admin-only-category-management.md`.
- code-understanding: 1 artifact, `.ai/code-understanding/home-family-fund.md`.
- impact-analysis: 1 artifact, `.ai/impact-analysis/home-family-fund-mvp-hardening.md`.
- stories: 15 story artifacts remain under `.ai/spec/` for future slice selection and historical story context.
- experience-design/prototype: active admin-only category management prototype exists at `.ai/prototype/admin-only-category-management.md`; completed prototype/design artifacts are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`.
- architecture/technical-design: completed feature design artifacts are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`; future active feature designs should be created under `.ai/technical-design/`.
- behavior specs: active admin-only category management spec exists at `.ai/spec/admin-only-category-management.md`; completed feature specs are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`.
- implementation: completed implementation logs are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`; latest completed slice is `recurring-reminder-confirmation-ui`.
- verification: completed verification reports are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`; latest completed slice is `recurring-reminder-confirmation-ui` and is approved for `local_dev` with accepted risks.
- reviews: completed workflow reviews are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`.
- v2 scaffold: `.ai/intent/`, `.ai/domain/`, `.ai/domain-impact/`, `.ai/foundation-architecture/`, `.ai/foundation-implementation/`, `.ai/prototype/`, `.ai/spec/`, `.ai/technical-design/`, `.ai/implementation/`, `.ai/verification/`, `.ai/release/`, `.ai/learning/`, `.ai/workflow-migration/`, and `.ai/archive/` are present.
- deploy/release: v2 local_dev release readiness exists at `.ai/release/home-family-fund-local-dev-readiness.md`; production deploy readiness is not assessed.
- release/learning: v2 `.ai/release/` has local_dev readiness; v2 `.ai/learning/` exists with no artifacts.
- archive: `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md` summarizes the completed local_dev MVP hardening iteration and v2 migration, including optional manual prune candidates.
- prune: completed intermediate artifacts listed in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md` were manually pruned after compression; use the archive summary and git history for full trace.

## Notes

- Assumptions: project defaults remain `delivery_profile: mvp` and `release_target: local_dev` because existing artifacts consistently use those values.
- Open questions: production target, hosting environment, monitoring provider, analytics provider, feedback channels, and category management technical-design decisions are not yet selected.
- Deferred cleanup: release readiness and learning artifacts are absent; production deployment slicing remains blocked until target environment is selected.
- Smallest next backfill path: do not restart discovery, prototype, or behavior spec. Continue admin-only category management at Feature Technical Design, then implementation, verification, and local_dev release refresh.
- Archive notes: completed intermediate artifacts listed in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md` were pruned by explicit manual `artifact-prune` approval. Do not delete maintained intent, domain, foundation, workflow, project context, migration, release readiness, archive summaries, or active backlog artifacts.
