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
reviewed_at: 2026-06-07
---

# DDD Harness Workflow

## Workflow Order

1. `idea-intake` - clarify product or change intent.
2. `ddd-event-storming` - model events, commands, actors, policies, aggregates, bounded contexts, and language.
3. `code-understanding` - map current repo reality, architecture, tests, data flow, and code language.
4. `impact-analysis` - compare desired domain behavior with implementation impact.
5. `story-slicing` - create traceable vertical stories.
6. `experience-design` - design traceable user journeys, task flows, screen states, accessibility, tracking drafts, and frontend/backend expectations for user-facing web stories.
7. `architecture-planner` - record boundaries, ownership, contracts, and ADR-style decisions.
8. `verification-design` - define acceptance criteria, BDD scenarios, and test plan.
9. `implementation-cycle` - implement through TDD within the verified story scope.
10. `verification-runner` - run tests, review code, and check domain alignment.
11. `deploy-readiness` - assess release readiness, risks, rollback, operations, and environment needs.
12. `post-release-tracking` - define or review release learning signals, analytics, monitoring, feedback, and follow-up decisions.

Use `workflow-review` as a non-linear review gate before any handoff when a concise approval, revision, or blocked decision is needed.
When visual review is useful, `workflow-review` may also create self-contained HTML under `.ai/reviews/html/`.

## Artifact Governance

Do not create a downstream artifact just because it exists in the workflow. Create it only when it reduces risk, captures a decision, proves behavior, or unblocks the next step.

### Required

- `.ai/project-context.md`
- `.ai/workflow.md`
- `.ai/stories/<story-id>.md`
- `.ai/verification-design/<story-id>.md`
- `.ai/implementation/<story-id>.md`
- `.ai/verification/<story-id>.md`

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
- active_change: home-family-fund MVP local_dev implementation; latest slice is permission matrix browser checks.
- current_stage: verification passed for permission matrix browser checks.
- recommended_next_skill: story-slicing

## Artifact Inventory

- idea: 1 artifact, `.ai/idea/home-family-fund.md`.
- ddd: 1 artifact, `.ai/ddd/home-family-fund.md`.
- code-understanding: 1 artifact, `.ai/code-understanding/home-family-fund.md`.
- impact-analysis: 1 artifact, `.ai/impact-analysis/home-family-fund-mvp-hardening.md`.
- stories: 15 story artifacts: 9 original capability stories and 6 MVP hardening completion stories.
- experience-design: 12 artifacts including `.ai/experience-design/story-mvp-hardening-permission-matrix-browser-checks.md`.
- architecture: 5 artifacts, including `.ai/architecture/home-family-fund-permission-matrix-browser-checks.md`.
- verification-design: 5 artifacts, including `.ai/verification-design/home-family-fund-permission-matrix-browser-checks.md`.
- implementation: 28 implementation artifacts; latest observed slice is `home-family-fund-permission-matrix-browser-checks`.
- verification: 28 verification artifacts; latest observed slice is `home-family-fund-permission-matrix-browser-checks` and is approved for `local_dev`.
- deploy: directory created, no artifacts yet.
- post-release: directory created, no artifacts yet.
- reviews: directory created, no review artifacts yet.

## Notes

- Assumptions: project defaults remain `delivery_profile: mvp` and `release_target: local_dev` because existing artifacts consistently use those values.
- Open questions: production target, hosting environment, monitoring provider, analytics provider, and feedback channels are not yet selected.
- Deferred cleanup: deploy readiness and post-release artifacts are absent; production deployment slicing remains blocked until target environment is selected.
