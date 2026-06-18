# Repository Agent Notes

<!-- DDD-WEBSITE-WORKFLOW:START -->
## DDD Website Harness Workflow

Use `.ai/` artifacts as the source of truth for product intent, domain behavior, foundation decisions, production-stack interactive prototype, behavior spec, technical design, TDD implementation, verification, target-aware release, learning, and artifact compression. This repository is governed by the DDD Website Harness Workflow for all non-trivial changes.

### Lifecycle

Intent Intake -> Domain Discovery -> Project Foundation Architecture -> Project Foundation Implementation / Init -> Experience Prototype -> Behavior Spec / BDD / E2E -> Feature Technical Design -> TDD Implementation -> Verification -> Target-Aware Release -> Learning Loop -> Artifact Compression.

### Workflow Enforcement

- All non-trivial product, design, frontend, backend, test, release, migration, or artifact-cleanup changes must use this lifecycle.
- Do not skip directly to coding, scaffolding, prototype work, tests, release, or prune cleanup unless the current lifecycle gate explicitly allows it.
- Every lifecycle gate must end with a `Review Gate` decision and a recommended next gate.
- After completing any gate, stop and wait for explicit user approval before starting the next gate. Do not continue automatically.
- Do not start implementation just because a plan exists; implementation starts only after Behavior Spec / BDD / E2E and Feature Technical Design are approved or explicitly accepted as risk.
- If the user asks for work that belongs to a later gate, complete only the missing current gate and ask for confirmation before moving forward.

### Entry and Upgrade

- Start with `.ai/workflow.md` and `.ai/project-context.md`.
- Use `ddd-workflow-init` for new or adopted projects.
- Use `ddd-workflow-update` when an existing `.ai/` workflow must migrate to `ddd-website-lifecycle-v2`.
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
- Prototype artifacts must include path, component paths, frontend stack, component library, run command, review URL, states covered, mock/fixture data, responsive baseline, accessibility/focus baseline, and known gaps.
- Standalone HTML files, static mockups, screenshots, Figma-only designs, and throwaway pages that do not use the selected project stack are not valid Experience Prototype outputs.
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
