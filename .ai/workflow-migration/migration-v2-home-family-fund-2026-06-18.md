---
id: migration-v2-home-family-fund-2026-06-18
stage: workflow-migration
status: accepted
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - AGENTS.md
  - .ai/workflow.md
  - .ai/project-context.md
outputs:
  - artifact_inventory
  - stage_mapping
  - gap_classification
  - backfill_plan
  - resume_recommendation
trace_links:
  existing_artifacts:
    - .ai/intent/home-family-fund.md
    - .ai/domain/home-family-fund.md
    - .ai/foundation-architecture/home-family-fund.md
    - .ai/code-understanding/home-family-fund.md
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
    - .ai/prototype/recurring-reminder-confirmation-ui.md
    - .ai/spec/recurring-reminder-confirmation-ui.md
    - .ai/technical-design/recurring-reminder-confirmation-ui.md
    - .ai/implementation/recurring-reminder-confirmation-ui.md
    - .ai/verification/recurring-reminder-confirmation-ui.md
    - .ai/release/home-family-fund-local-dev-readiness.md
reviewed_at: 2026-06-18
---

# Workflow Migration to ddd-website-lifecycle-v2

## Current State

- current_workflow_version_or_shape: legacy DDD harness migrated into v2 directories.
- active_legacy_stage: none; legacy idea, DDD, stories, experience-design, architecture, and verification-design artifacts were moved with `git mv`.
- active_intent_or_story_or_release: MVP local_dev hardening; recurring reminder confirmation UI is implemented and verified for local_dev.
- delivery_profile: mvp
- release_target: local_dev
- migration_decision: proceed
- recommended_resume_gate: User local_dev review, production release intake, or next MVP slice selection.
- recommended_next_skill: story-slicing or post-release-tracking after target selection

## Project-Level Updates

| File | Status | Action | Notes |
|---|---|---|---|
| AGENTS.md | present -> refreshed | Workflow marker block now points to v2 artifact locations, the completed recurring reminder slice, and lifecycle enforcement rules. | Non-marker content preserved. |
| .ai/workflow.md | present -> refreshed | Updated migration policy, v2 directory usage, trace links, inventory, and resume recommendation. | Legacy path references replaced with v2 paths. |
| .ai/project-context.md | present -> refreshed | Updated governance wording and current required input paths. | Project defaults remain `mvp` / `local_dev`. |

## Artifact Inventory

| Legacy Area | Evidence After Move | v2 Candidate Gate | Notes |
|---|---|---|---|
| idea/change | `.ai/intent/home-family-fund.md`; `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | Intent Intake | Complete enough for current local_dev MVP. |
| ddd | `.ai/domain/home-family-fund.md` | Domain Discovery | Complete enough; no restart needed. |
| code-understanding / impact-analysis | `.ai/code-understanding/home-family-fund.md`, `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | foundation/code reality inputs | Usable; refresh only before broad production or cross-context changes. |
| stories | 15 moved story artifacts under `.ai/spec/` | Intent / Behavior input | Backlog now lives in v2 spec directory. |
| experience-design | 13 moved design artifacts under `.ai/prototype/` plus `.ai/prototype/recurring-reminder-confirmation-ui.md` | Experience Prototype | Latest active prototype is v2-native and accepted. |
| architecture | `.ai/foundation-architecture/home-family-fund.md` plus 5 moved feature artifacts under `.ai/technical-design/` | Foundation Architecture / Feature Technical Design | Repo-wide and feature designs are separated by v2 gate. |
| verification-design | 6 moved verification-design artifacts under `.ai/spec/` plus `.ai/spec/recurring-reminder-confirmation-ui.md` | Behavior Spec / BDD / E2E | Latest active spec is v2-native and accepted. |
| implementation | 30 artifacts under `.ai/implementation/` | TDD Implementation | Latest recurring reminder confirmation UI implementation is complete. |
| verification | 30 artifacts under `.ai/verification/` | Verification | Latest recurring reminder confirmation UI verification passes for local_dev. |
| deploy/post-release | `.ai/release/home-family-fund-local-dev-readiness.md`; no learning artifact yet | Target-Aware Release / Learning | local_dev readiness exists; production release and learning remain unselected. |

## Directory Migration

| Old Path | New Path | Action |
|---|---|---|
| `.ai/idea/home-family-fund.md` | `.ai/intent/home-family-fund.md` | `git mv` |
| `.ai/ddd/home-family-fund.md` | `.ai/domain/home-family-fund.md` | `git mv` |
| `.ai/stories/*.md` | `.ai/spec/*.md` | `git mv` |
| `.ai/verification-design/*.md` | `.ai/spec/*.md` | `git mv` |
| `.ai/experience-design/*.md` | `.ai/prototype/*.md` | `git mv` |
| `.ai/architecture/home-family-fund.md` | `.ai/foundation-architecture/home-family-fund.md` | `git mv` |
| `.ai/architecture/home-family-fund-*.md` | `.ai/technical-design/home-family-fund-*.md` | `git mv` |
| `.ai/deploy/` | `.ai/release/` | no files to move |
| `.ai/post-release/` | `.ai/learning/` | no files to move |

## Stage Mapping

| v2 Gate | Classification | Evidence | Gap / Risk | Owning Skill |
|---|---|---|---|---|
| Intent Intake | complete | `.ai/intent/home-family-fund.md`, `.ai/spec/`, MVP hardening impact analysis | Next product slice or production target still needs user selection. | idea-intake or story-slicing |
| Domain Discovery | complete | `.ai/domain/home-family-fund.md` | Refresh only if a new slice changes role policy or domain rules. | ddd-event-storming |
| Project Foundation Architecture | usable_with_gaps | `.ai/foundation-architecture/home-family-fund.md`, code-understanding, completed local_dev foundation | Full v2-native foundation review can wait until broader architecture or production deployment changes. | architecture-planner |
| Project Foundation Implementation / Init | complete | Prisma, Next.js, Vitest, Playwright, DB E2E, controlled auth, recent passing gates | Quality scripts should run sequentially because `prisma generate` can race in parallel. | implementation-cycle |
| Experience Prototype | complete | `.ai/prototype/recurring-reminder-confirmation-ui.md` and moved prototype artifacts | Future slices need prototypes only when UX risk warrants it. | experience-design |
| Behavior Spec / BDD / E2E | complete | `.ai/spec/recurring-reminder-confirmation-ui.md` and moved specs | Future slices need specs before implementation. | verification-design |
| Feature Technical Design | complete | `.ai/technical-design/recurring-reminder-confirmation-ui.md` and moved feature designs | Future slices need feature technical design after prototype/spec. | architecture-planner |
| TDD Implementation | complete | `.ai/implementation/recurring-reminder-confirmation-ui.md` and implementation logs | Do not rewrite completed implementation logs. | implementation-cycle |
| Verification | complete | `.ai/verification/recurring-reminder-confirmation-ui.md`, full DB-backed E2E evidence | Production readiness remains out of scope. | verification-runner |
| Target-Aware Release | usable_with_gaps | `.ai/release/home-family-fund-local-dev-readiness.md` | Ready for local_dev review; production target needs separate release intake. | deploy-readiness |
| Learning Loop | needs_backfill | `.ai/learning/` has no artifact | Needed before production-bound release, not current local_dev work. | post-release-tracking |
| Artifact Compression | not_applicable | Migration report is current; no prune requested. | Compression/prune can wait until user requests cleanup. | artifact-compression |

## Backfill Plan

1. Do not restart discovery.
2. Treat recurring reminder confirmation UI as complete for `local_dev`.
3. Use `.ai/release/home-family-fund-local-dev-readiness.md` for user local_dev review.
4. If production release is selected, backfill production Target-Aware Release first, then Learning Loop.
5. If more MVP product work is selected, choose the next story/spec backlog item under `.ai/spec/` and start at the smallest needed gate.

## Resume Recommendation

- resume_gate: User local_dev review, production release intake, or next MVP slice selection.
- owning_skill: story-slicing or post-release-tracking after target selection
- required_input: `.ai/release/home-family-fund-local-dev-readiness.md` plus remaining backlog under `.ai/spec/`.
- reason: The recurring reminder confirmation flow is implemented and verified for local_dev. The next risk-reducing step depends on whether the user wants review, production preparation, or more product slicing.
- user_confirmation_required_before_resume: true

## Preserved Legacy Artifacts

- Legacy source-of-truth artifacts were moved into v2 directories with `git mv`.
- Legacy directories `.ai/idea/`, `.ai/ddd/`, `.ai/stories/`, `.ai/experience-design/`, `.ai/architecture/`, and `.ai/verification-design/` now have no files.
- `.ai/code-understanding/`, `.ai/impact-analysis/`, `.ai/reviews/`, `.ai/implementation/`, and `.ai/verification/` remain in place because they are still supported artifact locations in this project workflow.

## Workflow Enforcement

- `AGENTS.md` now requires future project changes to follow `.ai/workflow.md`.
- New source-of-truth artifacts must be created only in v2 directories.
- Agents must stop after completing a lifecycle gate or backfill gate and wait for explicit user approval before proceeding.
- Agents must not automatically implement, scaffold, prototype, test, release, archive, or prune ahead of the approved gate.

## Risks

- Some moved artifacts still have legacy stage names inside frontmatter or prose; paths now point to v2 directories.
- Historical UX artifacts moved into `.ai/prototype/` are reviewable design docs, not necessarily runnable prototypes. Future active slices should create production-stack prototypes when UX risk is material.
- Production Google OAuth smoke, observability, backup/restore, analytics, and rollback remain out of scope until release target changes.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm legacy source-of-truth artifacts should remain moved into v2 directories.
  - Confirm recurring reminder confirmation UI is accepted as completed for local_dev.
  - Confirm production release/learning backfills can wait until production target is selected.
- must_check:
  - v2 directories contain moved artifacts.
  - legacy mapped directories have no files.
  - AGENTS.md has workflow markers and v2 policy.
  - `.ai/workflow.md` and `.ai/project-context.md` name v2 paths.
- acceptance_signals:
  - Migration report exists and records old/new directory mapping.
  - Active source-of-truth artifacts are not left in legacy mapped directories.
  - One resume decision path and owning skill options are identified.
- unresolved_blockers:
  - None for continuing local_dev review or target selection.
- next_step:
  - user_local_dev_review_or_target_selection
