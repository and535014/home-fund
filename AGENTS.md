# Repository Agent Notes

<!-- DDD-WEBSITE-WORKFLOW:START -->
## DDD Website Workflow

- workflow_version: ddd-website-lifecycle-v2
- delivery_profile: mvp
- release_target: local_dev
- workflow_source: `.ai/workflow.md`
- project_context: `.ai/project-context.md`
- migration_report: `.ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md`
- policy: Legacy `.ai` artifacts have been moved into v2 directories with `git mv`; create new workflow artifacts only in v2 directories.

### Workflow Enforcement

- All future product, UX, architecture, implementation, verification, release, and learning changes must follow `.ai/workflow.md`.
- Start at the smallest applicable lifecycle gate for the requested change; do not skip required upstream gates when the change affects user behavior, domain rules, architecture, tests, release readiness, or learning signals.
- Create new workflow artifacts only in v2 directories: `.ai/intent/`, `.ai/domain/`, `.ai/foundation-architecture/`, `.ai/foundation-implementation/`, `.ai/prototype/`, `.ai/spec/`, `.ai/technical-design/`, `.ai/implementation/`, `.ai/verification/`, `.ai/release/`, `.ai/learning/`, and `.ai/workflow-migration/`.
- Do not create new source-of-truth artifacts in legacy directories such as `.ai/idea/`, `.ai/ddd/`, `.ai/stories/`, `.ai/experience-design/`, `.ai/architecture/`, `.ai/verification-design/`, `.ai/deploy/`, or `.ai/post-release/`.
- After completing a lifecycle gate or backfill gate, stop and wait for explicit user approval before proceeding to the next gate.
- Do not automatically implement, scaffold, prototype, test, release, archive, or prune ahead of the approved gate.
- Preserve user-authored content outside this marked `DDD-WEBSITE-WORKFLOW` section.

### Current Resume Point

- latest_completed_slice: recurring reminder confirmation UI
- current_stage: recurring reminder confirmation UI is implemented, verified, and committed for `local_dev` in `24213cd`; local_dev release readiness is drafted.
- recommended_resume_gate: User local_dev review, production release intake, or next MVP slice selection.
- recommended_next_skill: story-slicing or post-release-tracking after target selection
- required_input: `.ai/release/home-family-fund-local-dev-readiness.md` plus the remaining story backlog under `.ai/spec/`.

### Local Quality Gates

Run these sequentially because project scripts each invoke `prisma generate`:

1. `pnpm type-check`
2. `pnpm lint`
3. `pnpm test`
4. Targeted E2E as needed, for example `pnpm test:e2e -- e2e/recurring-reminder-confirmation.spec.ts`

<!-- DDD-WEBSITE-WORKFLOW:END -->
