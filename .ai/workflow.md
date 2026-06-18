---
id: workflow
stage: init
status: active
delivery_profile: mvp
release_target: local_dev
inputs: []
outputs:
  - .ai/project-context.md
trace_links:
  - .ai/idea/home-family-fund.md
  - .ai/ddd/home-family-fund.md
  - .ai/architecture/home-family-fund.md
  - .ai/code-understanding/home-family-fund.md
  - .ai/impact-analysis/home-family-fund-mvp-hardening.md
  - .ai/verification-design/home-family-fund-mvp.md
  - .ai/implementation/home-family-fund-e2e-foundation.md
  - .ai/verification/home-family-fund-e2e-foundation.md
  - .ai/architecture/home-family-fund-db-backed-dashboard-e2e.md
  - .ai/verification-design/home-family-fund-db-backed-dashboard-e2e.md
  - .ai/implementation/home-family-fund-db-backed-dashboard-e2e.md
  - .ai/verification/home-family-fund-db-backed-dashboard-e2e.md
  - .ai/architecture/home-family-fund-controlled-auth-session-e2e.md
  - .ai/verification-design/home-family-fund-controlled-auth-session-e2e.md
  - .ai/implementation/home-family-fund-controlled-auth-session-e2e.md
  - .ai/verification/home-family-fund-controlled-auth-session-e2e.md
  - .ai/experience-design/story-mvp-hardening-browser-create-record-flow.md
  - .ai/architecture/home-family-fund-browser-create-record-flow.md
  - .ai/verification-design/home-family-fund-browser-create-record-flow.md
  - .ai/implementation/home-family-fund-browser-create-record-flow.md
  - .ai/verification/home-family-fund-browser-create-record-flow.md
  - .ai/experience-design/story-mvp-hardening-permission-matrix-browser-checks.md
  - .ai/architecture/home-family-fund-permission-matrix-browser-checks.md
  - .ai/verification-design/home-family-fund-permission-matrix-browser-checks.md
  - .ai/implementation/home-family-fund-permission-matrix-browser-checks.md
  - .ai/verification/home-family-fund-permission-matrix-browser-checks.md
  - .ai/experience-design/story-mvp-hardening-reimbursement-settlement-ui.md
  - .ai/architecture/home-family-fund-reimbursement-settlement-ui.md
  - .ai/verification-design/home-family-fund-reimbursement-settlement-ui.md
  - .ai/implementation/home-family-fund-reimbursement-settlement-ui.md
  - .ai/verification/home-family-fund-reimbursement-settlement-ui.md
  - .ai/reviews/verification/review-ver-home-family-fund-reimbursement-settlement-ui.md
  - .ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md
reviewed_at: 2026-06-18
---

# DDD Harness Workflow

## Workflow Version

- workflow_version: ddd-website-lifecycle-v2
- migration_report: `.ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md`
- migration_policy: Legacy artifacts are preserved in place. New v2 directories exist for future artifacts and backfills. Do not delete, rename, or bulk rewrite completed legacy artifacts only to fit v2 naming.

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
- `.ai/foundation-architecture/` - repo-wide foundation architecture.
- `.ai/foundation-implementation/` - scaffold/dev/test baseline evidence.
- `.ai/prototype/` - interactive or reviewable experience prototypes.
- `.ai/spec/` - behavior specs, BDD, E2E plans.
- `.ai/technical-design/` - feature-level technical designs and ADR updates.
- `.ai/implementation/` - implementation logs; legacy and v2 logs both live here.
- `.ai/verification/` - verification reports; legacy and v2 reports both live here.
- `.ai/release/` - target-aware release readiness.
- `.ai/learning/` - post-release learning loop.
- `.ai/workflow-migration/` - workflow migration reports.

### Conditional

- `.ai/idea/` - new idea or unclear product/change intent.
- `.ai/ddd/` - non-trivial domain behavior, unclear language, policies, aggregates, or bounded contexts.
- `.ai/code-understanding/` - existing repo, non-trivial codebase, or change depends on current implementation.
- `.ai/impact-analysis/` - cross-module, data, integration, deploy, or high-risk impact.
- `.ai/experience-design/` - user-facing web UX, forms, flows, states, accessibility, or tracking draft.
- `.ai/experience-design/web-foundation.md` - first user-facing web story or repeated page/layout/component patterns need app-level UI consistency.
- `.ai/architecture/` - boundary, contract, data ownership, integration, or quality-attribute decisions.
- `.ai/deploy/` - release target, environment, migration, rollback, secrets, observability, or operations concern.
- `.ai/post-release/` - production-facing release learning, product analytics, feedback, monitoring, or follow-up decision criteria.

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
- active_change: home-family-fund MVP local_dev hardening.
- latest_completed_slice: reimbursement settlement UI.
- current_stage: v2 migration complete; reimbursement settlement UI is verified and workflow-reviewed for `local_dev`.
- recommended_resume_gate: Experience Prototype for recurring reminder confirmation UI.
- recommended_next_skill: experience-design

## Artifact Inventory

- idea: 1 artifact, `.ai/idea/home-family-fund.md`.
- ddd: 1 artifact, `.ai/ddd/home-family-fund.md`.
- code-understanding: 1 artifact, `.ai/code-understanding/home-family-fund.md`.
- impact-analysis: 1 artifact, `.ai/impact-analysis/home-family-fund-mvp-hardening.md`.
- stories: 15 story artifacts: 9 original capability stories and 6 MVP hardening completion stories.
- experience-design: 13 artifacts including `.ai/experience-design/story-mvp-hardening-reimbursement-settlement-ui.md`.
- architecture: 6 artifacts, including `.ai/architecture/home-family-fund-reimbursement-settlement-ui.md`.
- verification-design: 6 artifacts, including `.ai/verification-design/home-family-fund-reimbursement-settlement-ui.md`.
- implementation: 29 implementation artifacts; latest completed slice is `home-family-fund-reimbursement-settlement-ui`.
- verification: 29 verification artifacts; latest completed slice is `home-family-fund-reimbursement-settlement-ui` and is approved for `local_dev` with accepted risks.
- reviews: workflow reviews exist for impact analysis and reimbursement settlement verification.
- v2 scaffold: `.ai/intent/`, `.ai/domain/`, `.ai/foundation-architecture/`, `.ai/foundation-implementation/`, `.ai/prototype/`, `.ai/spec/`, `.ai/technical-design/`, `.ai/release/`, `.ai/learning/`, and `.ai/workflow-migration/` are present.
- deploy/release: legacy `.ai/deploy/` exists but no deploy artifacts; v2 `.ai/release/` exists with no artifacts.
- post-release/learning: legacy `.ai/post-release/` exists but no artifacts; v2 `.ai/learning/` exists with no artifacts.

## Notes

- Assumptions: project defaults remain `delivery_profile: mvp` and `release_target: local_dev` because existing artifacts consistently use those values.
- Open questions: recurring reminder confirmation role policy, production target, hosting environment, monitoring provider, analytics provider, and feedback channels are not yet selected.
- Deferred cleanup: release readiness and learning artifacts are absent; production deployment slicing remains blocked until target environment is selected.
- Smallest next backfill path: do not restart discovery. Continue with recurring reminder confirmation UI at Experience Prototype / `experience-design`, then Behavior Spec, Feature Technical Design, Implementation, and Verification.
