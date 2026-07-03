# Init Artifacts

Use these templates when creating or updating project-level DDD website harness files for `ddd-website-lifecycle-v2`.

## `.ai/workflow.md`

````markdown
---
id: workflow
stage: workflow
status: active
workflow_version: ddd-website-lifecycle-v2
active_lifecycle_stage: intent-intake
migration_status: not_applicable
delivery_profile: mvp
release_target: local_dev
inputs: []
outputs:
  - .ai/project-context.md
trace_links: []
reviewed_at: YYYY-MM-DD
---

# DDD Website Harness Workflow

## Lifecycle

1. Intent Intake
2. Domain Discovery
3. Project Foundation Architecture
4. Project Foundation Implementation / Init
5. Experience Prototype
6. Behavior Spec / BDD / E2E
7. Feature Technical Design
8. TDD Implementation
9. Verification
10. Target-Aware Release
11. Release Execution (production only)
12. Learning Loop
13. Artifact Compression

## Upgrade Lifecycle

1. Workflow Migration / Upgrade
2. Artifact Inventory
3. Stage Mapping
4. Gap Classification
5. Backfill Plan
6. Resume At New Workflow Stage

## Lifecycle Gates

| Gate | Required When | Owning Skill | Exit Criteria |
|---|---|---|---|
| Intent Intake | every product, feature, content, page, migration, or release intent | intent-intake | intent, project type, scope, non-goals, success criteria, and release target are clear |
| Domain Discovery | domain behavior, policy, workflow, state transition, roles, permissions, payments, approvals, quotas, lifecycle, or cross-role collaboration | domain-discovery | maintained project/context domain model is updated and `.ai/domain-impact/<intent-id>.md` captures the intent-specific delta |
| Project Foundation Architecture | new project, migration, rewrite, unknown stack, or missing frontend/test foundation | project-foundation-architecture | framework, tooling, lint, tests, routing, styling, component library, component strategy, prototype host, commands, and CI baseline are decided |
| Project Foundation Implementation / Init | foundation architecture is required or scaffold is missing | project-foundation-implementation | app scaffold, component library, foundation components/tokens, and dev/lint/test/e2e baseline are runnable |
| Experience Prototype | user-facing website work unless explicitly skipped with risk | experience-prototype | real route/page/component slice path, component paths, run command, review URL, states, gaps, responsive and accessibility baseline are recorded |
| Behavior Spec / BDD / E2E | any behavior that will be implemented | behavior-spec | AC, BDD scenarios, E2E design, fixtures, selectors, and test plan are complete |
| Feature Technical Design | behavior spec exists and implementation boundaries are not trivial | feature-technical-design | route/module boundaries, contracts, state/data/validation ownership, API shape, and tests are mapped |
| TDD Implementation | behavior spec and technical design are approved or accepted as risk | tdd-implementation | tests are written/enabled first and implementation stays inside traceable behavior |
| Verification | implementation is complete | verification | tests, BDD/E2E, prototype gaps, DDD trace, and architecture alignment are checked |
| Target-Aware Release | target is internal_demo, preview, staging, production, or release risk exists | target-aware-release | readiness is decided for exactly one release target |
| Release Execution | production target-aware release is ready or risks are accepted and deployment is explicitly requested | release-execution | production deployment, version/tag evidence, smoke results, rollback readiness, and final status are recorded |
| Learning Loop | release learning, feedback, analytics, or monitoring decisions matter | learning-loop | metrics, signals, cadence, and decision criteria are recorded |
| Artifact Compression | release, iteration, migration, or abandoned work is complete | artifact-compression | decisions and traceability are summarized, prune candidates are identified, and active `.ai/` remains readable |

Passing a release gate for `preview` or `staging` does not imply `production` readiness.

## Artifact Governance

Create an artifact only when it reduces risk, captures a decision, proves behavior, or unblocks the next gate. Do not create downstream artifacts simply because they exist in the lifecycle.

## Artifact Map

- `.ai/intent/<id>.md` - intent, project type, success criteria, scope, non-goals, release target.
- `.ai/domain/project.md` or `.ai/domain/<bounded-context>.md` - maintained project or bounded-context domain model. Do not create one domain file per requirement.
- `.ai/domain-impact/<intent-id>.md` - per-intent domain delta and downstream impact. This is change-level and can be compressed/pruned after completion.
- `.ai/foundation-architecture/<id>.md` - site-wide foundation architecture decisions.
- `.ai/foundation-implementation/<id>.md` - scaffold/init steps and baseline verification.
- `.ai/prototype/<id>.md` - experience design and real production-stack frontend slice evidence.
- `.ai/spec/<id>.md` - AC, BDD, E2E design, and test plan.
- `.ai/technical-design/<id>.md` - feature technical design.
- `.ai/implementation/<id>.md` - TDD implementation log.
- `.ai/verification/<id>.md` - verification report.
- `.ai/release/<id>.md` - target-aware release readiness.
- `.ai/deployment/<id>.md` - production release execution evidence. Create only for explicit production deployments.
- `.ai/learning/<id>.md` - post-release learning loop.
- `.ai/workflow-migration/<id>.md` - old-to-new workflow migration.
- `.ai/archive/<id>.md` - compressed long-term decision and traceability record for pruned completed work.

Do not create legacy directories for new v2 projects. During `workflow-migration`, legacy artifacts should be moved into v2 directories: `.ai/idea/` and `.ai/change/` to `.ai/intent/`, `.ai/ddd/` to `.ai/domain/`, `.ai/stories/` and `.ai/verification-design/` to `.ai/spec/`, `.ai/experience-design/` to `.ai/prototype/`, `.ai/architecture/` to `.ai/foundation-architecture/` or `.ai/technical-design/`, `.ai/deploy/` to `.ai/release/`, and `.ai/post-release/` to `.ai/learning/`.

## Naming

- artifact_id_style: kebab-case
- intent_id_pattern: `intent-<scope>-<outcome>`
- domain_id_pattern: `domain-project` for single-domain/early projects; `domain-<bounded-context>` only for stable bounded contexts.
- domain_impact_id_pattern: `domain-impact-<intent-slug>`
- foundation_architecture_id_pattern: `foundation-arch-<project-or-scope>`
- foundation_implementation_id_pattern: `foundation-init-<project-or-scope>`
- prototype_id_pattern: `prototype-<scope>-<outcome>`
- spec_id_pattern: `spec-<scope>-<behavior>`
- technical_design_id_pattern: `tech-design-<scope>-<behavior>`
- implementation_id_pattern: `impl-<scope>-<behavior>`
- verification_report_id_pattern: `ver-<scope>-<behavior>`
- release_id_pattern: `release-<target>-<scope>`
- learning_id_pattern: `learning-<scope>-<outcome>`
- migration_id_pattern: `migration-v2-<date-or-scope>`
- route_slug_rule: use route path words in order.
- analytics_event_pattern: `<scope>_<action>_<result-or-state>`
- test_name_pattern: `<slice-or-route>.<behavior>.spec`
- naming_trace_required: true

## Current State

- project_classification:
- project_type:
- active_intent:
- active_lifecycle_stage:
- foundation_required:
- foundation_status:
- release_target:
- migration_status:
- recommended_next_skill:

## Artifact Inventory

- intent:
- domain:
- domain-impact:
- foundation-architecture:
- foundation-implementation:
- prototype:
- spec:
- technical-design:
- implementation:
- verification:
- release:
- learning:
- workflow-migration:
- archive:
- legacy:

## Notes

- Assumptions:
- Open questions:
- Deferred cleanup:
````

## `.ai/project-context.md`

````markdown
---
id: project
stage: project-context
status: active
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs: []
outputs:
  - .ai/workflow.md
trace_links: []
reviewed_at: YYYY-MM-DD
---

# Project Context

## Project Snapshot

- name:
- classification:
- project_type:
- primary_users:
- business_outcome:
- repository_state:
- selected_stack:
- deployment_signals:

## Harness Defaults

- workflow_version: ddd-website-lifecycle-v2
- delivery_profile:
- release_target:
- active_lifecycle_stage:
- migration_status:
- source_of_truth:

## Foundation Baseline

- foundation_required:
- foundation_status: missing | planned | initialized | existing | not_applicable
- framework:
- language:
- package_manager:
- routing:
- styling:
- component_library:
- component_strategy:
- lint_command:
- format_command:
- unit_test_command:
- e2e_test_command:
- build_command:
- dev_command:
- prototype_host:
- ci_baseline:

## Target-Aware Release

- supported_targets:
  - local_dev
  - internal_demo
  - preview
  - staging
  - production
- current_release_target:
- release_target_rule: Passing one target does not imply readiness for a stricter target.

## Existing System Signals

- entry_points:
- modules_or_context_candidates:
- data_stores:
- integrations:
- auth_or_permission_model:
- deployment_model:

## Tracking Providers

- product_analytics_provider: unknown
- error_monitoring_provider: unknown
- logging_provider: unknown
- feedback_channels: unknown
- tracking_maturity: unknown

## Constraints

- hard_constraints:
- non_goals:
- compliance_or_security_notes:
- operational_assumptions:

## Next Step

- recommended_lifecycle_gate:
- recommended_next_skill:
- required_input:
- reason:
````

## `AGENTS.md`

Preserve existing project instructions and add or update only the marked section.

````markdown
<!-- DDD-WEBSITE-WORKFLOW:START -->
## DDD Website Harness Workflow

Use `.ai/` artifacts as the source of truth for product intent, domain behavior, foundation decisions, production-stack interactive prototype, behavior spec, technical design, TDD implementation, verification, target-aware release, learning, and artifact compression. This repository is governed by the DDD Website Harness Workflow for all non-trivial changes.

### Lifecycle

Intent Intake → Domain Discovery → Project Foundation Architecture → Project Foundation Implementation / Init → Experience Prototype → Behavior Spec / BDD / E2E → Feature Technical Design → TDD Implementation → Verification → Target-Aware Release → Release Execution (production only) → Learning Loop → Artifact Compression.

### Workflow Enforcement

- All non-trivial product, design, frontend, backend, test, release, migration, or artifact-cleanup changes must use this lifecycle.
- Do not skip directly to coding, scaffolding, prototype work, tests, release, or prune cleanup unless the current lifecycle gate explicitly allows it.
- Every lifecycle gate must end with a `Review Gate` decision and a recommended next gate.
- After completing any gate, stop and wait for explicit user approval before starting the next gate. Do not continue automatically.
- After completing Experience Prototype, stop for user review and do not commit prototype code or `.ai/prototype/` artifacts until the user explicitly approves the prototype.
- Do not start implementation just because a plan exists; implementation starts only after Behavior Spec / BDD / E2E and Feature Technical Design are approved or explicitly accepted as risk.
- If the user asks for work that belongs to a later gate, complete only the missing current gate and ask for confirmation before moving forward.

### Entry and Upgrade

- Start with `.ai/workflow.md` and `.ai/project-context.md`.
- Use `workflow-init` for new or adopted projects.
- Use `workflow-migration` when an existing `.ai/` workflow must migrate to `ddd-website-lifecycle-v2`.
- Use the smallest lifecycle path that captures the missing decision, proof, or release gate. Do not restart completed work unless the user asks.

### Domain Rules

- Maintain durable project/domain knowledge in `.ai/domain/project.md` or `.ai/domain/<bounded-context>.md`.
- Do not create one domain model artifact per feature, requirement, story, or request.
- Put per-intent domain deltas, change impact, affected flows, risks, and downstream implications in `.ai/domain-impact/<intent-id>.md`.
- Treat domain-impact artifacts as change-level evidence that can be summarized by Artifact Compression and later removed by explicit manual Artifact Prune.
- Create a separate bounded-context domain file only when the language, ownership, lifecycle, policies, invariants, or state transitions are meaningfully distinct.

### Foundation Rules

- New projects, migrations, rewrites, unknown stacks, or missing frontend/test foundations require Project Foundation Architecture.
- After Project Foundation Architecture, run Project Foundation Implementation / Init before production-stack prototype.
- Foundation init must establish scaffold, app shell, routing baseline, lint/format/test/e2e config, selected component library, foundation components/tokens, prototype host, and runnable dev/build/test commands.
- Existing projects normally reuse observed foundation instead of reselecting React/Vue/etc., unless the change is a migration or rewrite.

### Prototype and Behavior Rules

- User-facing website work requires an interactive production-stack prototype unless explicitly skipped with accepted risk.
- Prototype artifacts must include intended route/page/component path, component paths, frontend stack, component library, run command, review URL, states covered, mock/fixture data, responsive baseline, accessibility/focus baseline, and known gaps.
- Do not default prototype code to `src/app/prototypes`, `/prototypes`, sandbox routes, Storybook-only stories, or component playgrounds; build the real route/page/component slice unless the user explicitly accepts exploratory-only prototype risk.
- Standalone HTML files, static mockups, screenshots, Figma-only designs, throwaway pages, and isolated prototype-only folders that do not represent the intended production route/component structure are not valid Experience Prototype outputs.
- Prototype completion is a review stop: do not commit prototype code or artifacts until the user has reviewed and approved the result.
- Behavior Spec / BDD / E2E must be complete before Feature Technical Design.
- Implementation must be TDD: write or enable the test first, implement the minimum behavior, then refactor.

### Release Rules

- Release is target-aware: `local_dev`, `internal_demo`, `preview`, `staging`, or `production`.
- Passing preview/staging readiness does not imply production readiness.
- Production readiness must address secrets/config, migrations, auth/permissions, rollback, observability, monitoring, smoke checks, and learning signals where relevant.

### Migration Rules

- Move legacy artifacts into v2 directories during workflow migration; use git history as the old-path record.
- New v2 artifacts must be created in v2 directories only; do not add new files to legacy `.ai/idea/`, `.ai/change/`, `.ai/ddd/`, `.ai/stories/`, `.ai/experience-design/`, `.ai/architecture/`, `.ai/verification-design/`, `.ai/deploy/`, or `.ai/post-release/`.
- Classify old artifacts as `complete`, `usable_with_gaps`, `needs_backfill`, `obsolete`, or `not_applicable`.
- Backfill only the minimum missing gate needed to continue safely.
<!-- DDD-WEBSITE-WORKFLOW:END -->
````
