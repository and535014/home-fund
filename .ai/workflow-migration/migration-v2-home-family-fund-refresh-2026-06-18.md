---
id: migration-v2-home-family-fund-refresh-2026-06-18
stage: workflow-migration
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - AGENTS.md
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md
outputs:
  - idempotency_check
  - artifact_inventory
  - stage_mapping
  - gap_classification
  - backfill_plan
  - resume_recommendation
trace_links:
  existing_artifacts:
    - .ai/intent/home-family-fund.md
    - .ai/intent/admin-only-category-management.md
    - .ai/domain/home-family-fund.md
    - .ai/domain-impact/admin-only-category-management.md
    - .ai/foundation-architecture/home-family-fund.md
    - .ai/prototype/web-foundation.md
    - .ai/spec/story-category-management.md
    - .ai/release/home-family-fund-local-dev-readiness.md
    - .ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md
reviewed_at: 2026-06-18
---

# Workflow Migration Refresh to ddd-website-lifecycle-v2

## Current State

- current_workflow_version_or_shape: ddd-website-lifecycle-v2 already adopted.
- active_legacy_stage: none.
- active_intent_or_story_or_release: admin-only category management intent is selected after the completed local_dev MVP hardening iteration.
- delivery_profile: mvp
- release_target: local_dev
- migration_decision: proceed
- recommended_resume_gate: Experience Prototype for admin-only category management.
- recommended_next_skill: experience-design

## Idempotency Check

- workflow_version_current: true
- agents_enforcement_present: true
- v2_directories_present: true after this refresh
- active_legacy_artifacts_remaining: false
- prior_migration_report_found: true
- migration_action: partial_backfill
- notes: The project was already on v2. This refresh only updated stale workflow enforcement wording, restored missing empty v2 scaffold directories, and recorded the active admin-only category management path.

## Project-Level Updates

| File | Status | Action | Notes |
|---|---|---|---|
| AGENTS.md | updated | Replaced the marked `DDD-WEBSITE-WORKFLOW` section with the current v2 init-artifacts enforcement section. | Non-marker content preserved. |
| .ai/workflow.md | updated | Added `.ai/domain-impact/` to the v2 directory map and refreshed the scaffold inventory. | Product workflow order unchanged. |
| .ai/project-context.md | updated | Added `.ai/domain-impact/` and `.ai/archive/` to `v2_artifact_dirs`. | Project defaults remain `mvp` / `local_dev`. |

## AGENTS.md Enforcement Verification

- ddd_website_workflow_section_present: true
- non_trivial_changes_must_use_lifecycle: true
- stop_after_each_gate_for_user_approval: true
- no_auto_implementation_or_next_gate: true
- blocked_if_missing: false

## Artifact Inventory

| Legacy Area | Evidence | v2 Candidate Gate | Notes |
|---|---|---|---|
| idea/change | `.ai/intent/home-family-fund.md`, `.ai/intent/admin-only-category-management.md` | Intent Intake | Current active change has a v2 intent artifact. |
| ddd | `.ai/domain/home-family-fund.md`, `.ai/domain-impact/admin-only-category-management.md` | Domain Discovery | Maintained project domain and active change delta are drafted. |
| code-understanding / impact-analysis | `.ai/code-understanding/home-family-fund.md`, `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | foundation/code reality inputs | Usable as current project context. |
| stories | `.ai/spec/*.md`, including `story-category-management.md` | Intent / Behavior input | Category story exists but needs update after active domain/prototype/spec gates. |
| experience-design | `.ai/prototype/web-foundation.md`, archived completed prototype summaries | Experience Prototype candidate | Active category management UI needs a production-stack prototype artifact after domain impact. |
| architecture | `.ai/foundation-architecture/home-family-fund.md`, `.ai/technical-design/.gitkeep` | Foundation Architecture / Feature Technical Design candidate | Foundation is usable; feature design is needed after BDD/E2E. |
| verification-design | `.ai/spec/*.md` | Behavior Spec candidate | Active category behavior needs BDD/E2E update after prototype. |
| implementation | `.ai/implementation/.gitkeep`, archive summary | TDD Implementation candidate | Completed logs were compressed/pruned; new implementation logs belong here. |
| verification | `.ai/verification/.gitkeep`, archive summary | Verification candidate | Completed reports were compressed/pruned; new verification reports belong here. |
| deploy/post-release | `.ai/release/home-family-fund-local-dev-readiness.md`, `.ai/learning/.gitkeep` | Target-Aware Release / Learning candidate | local_dev readiness exists; production learning remains unselected. |
| archive | `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md` | Artifact Compression candidate | Current archive summary is the source for pruned completed work. |

## Directory Migration

| Legacy Directory | v2 Directory | Action | Active Source of Truth | Notes |
|---|---|---|---|---|
| `.ai/idea/` | `.ai/intent/` | already_migrated | no | Legacy directory absent. |
| `.ai/change/` | `.ai/intent/` | not_present | no | No legacy change directory. |
| `.ai/ddd/` | `.ai/domain/` | already_migrated | no | Legacy directory absent. |
| `.ai/stories/` | `.ai/spec/` | already_migrated | no | Legacy directory absent. |
| `.ai/experience-design/` | `.ai/prototype/` | already_migrated | no | Legacy directory absent. |
| `.ai/architecture/` | `.ai/foundation-architecture/` or `.ai/technical-design/` | already_migrated | no | Legacy directory absent. |
| `.ai/verification-design/` | `.ai/spec/` | already_migrated | no | Legacy directory absent. |
| `.ai/deploy/` | `.ai/release/` | not_present | no | No legacy deploy directory. |
| `.ai/post-release/` | `.ai/learning/` | not_present | no | No legacy post-release directory. |

## Moved Legacy Artifacts

| Old Path | New Path | Move Method | Notes |
|---|---|---|---|
| n/a | n/a | already_migrated | No file moves were needed in this refresh. |

## Domain Consolidation

- maintained_domain_artifact: `.ai/domain/home-family-fund.md`
- domain_impact_artifacts_created: `.ai/domain-impact/admin-only-category-management.md`
- legacy_domain_files_split_or_consolidated: already handled by prior migration
- separate_bounded_context_files_created: none
- blocked_domain_files: none

## Stage Mapping

| v2 Gate | Classification | Evidence | Gap / Risk | Owning Skill |
|---|---|---|---|---|
| Intent Intake | complete | `.ai/intent/admin-only-category-management.md` | None for the active change. | site-change-intake |
| Domain Discovery | complete | `.ai/domain/home-family-fund.md`; `.ai/domain-impact/admin-only-category-management.md` | No current domain blocker; future changes may add additional domain deltas. | ddd-event-storming |
| Project Foundation Architecture | usable_with_gaps | `.ai/foundation-architecture/home-family-fund.md` | No foundation change needed for category management. | architecture-planner |
| Project Foundation Implementation / Init | complete | Existing Next.js/Prisma/Vitest/Playwright foundation and local_dev archive evidence | No scaffold backfill needed. | implementation-cycle |
| Experience Prototype | needs_backfill | `.ai/prototype/web-foundation.md` | Category management page is user-facing and needs admin/non-admin states before BDD. | experience-design |
| Behavior Spec / BDD / E2E | needs_backfill | `.ai/spec/story-category-management.md` | Existing story has unresolved role question; BDD/E2E must reflect admin-only policy. | verification-design |
| Feature Technical Design | needs_backfill | `.ai/technical-design/.gitkeep` | Route guard, server action, persistence, and capability reconciliation need design after spec. | architecture-planner |
| TDD Implementation | needs_backfill | `.ai/implementation/.gitkeep` | Implementation should wait for spec and technical design. | implementation-cycle |
| Verification | needs_backfill | `.ai/verification/.gitkeep` | Permission and category lifecycle verification required after implementation. | verification-runner |
| Target-Aware Release | usable_with_gaps | `.ai/release/home-family-fund-local-dev-readiness.md` | Refresh local_dev readiness after verified category slice. | deploy-readiness |
| Learning Loop | not_applicable | `.ai/learning/.gitkeep` | Not required for this local_dev slice unless production or analytics is selected. | post-release-tracking |
| Artifact Compression | not_applicable | `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md` | No completed new iteration to compress yet. | artifact-compression |

## Backfill Plan

1. Do not restart the whole project workflow.
2. Resume at Experience Prototype for `admin-only-category-management`.
3. Use `.ai/domain-impact/admin-only-category-management.md` as input for admin/non-admin sidebar, direct-route, and category lifecycle states.
4. Then stop for user approval before Behavior Spec / BDD / E2E.

## No Action Needed

- no_action_needed: false
- reason: The project was already v2, but scaffolding and AGENTS enforcement needed a refresh.

## Resume Recommendation

- resume_gate: Experience Prototype
- owning_skill: experience-design
- required_input: `.ai/intent/admin-only-category-management.md`, `.ai/domain/home-family-fund.md`, `.ai/domain-impact/admin-only-category-management.md`, and `.ai/spec/story-category-management.md`
- reason: The admin-only category management intent and domain impact are drafted. Prototype should make admin/non-admin navigation, direct-route denial, and category lifecycle states concrete before BDD/E2E.
- user_confirmation_required_before_resume: true

## Preserved Legacy Artifacts

- Prior migration records remain in `.ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md`.
- Completed local_dev MVP hardening evidence remains summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`.

## Legacy Directory Result

- emptied_legacy_directories: already absent
- blocked_legacy_files: none

## Risks

- The active category management change has an approved intent and domain impact but still needs prototype, BDD/E2E, technical design, implementation, verification, and local_dev release refresh before coding is complete.
- `MemberCapability.manage_categories` exists in the schema; the active change must decide whether to leave it dormant for future delegation or remove/ignore it in current authorization paths.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm the project uses `.ai/domain-impact/` for active change-level domain deltas.
  - Confirm the recommended resume gate is Experience Prototype for admin-only category management.
- must_check:
  - AGENTS.md contains the current v2 enforcement lines.
  - Missing v2 directories exist.
  - No active source-of-truth files remain in legacy directories.
- acceptance_signals:
  - Workflow update can be rerun without duplicating files or moving already migrated artifacts.
  - The next step is explicit and does not skip to implementation.
- unresolved_blockers:
  - None for resuming at Experience Prototype after user approval.
- next_step:
  - experience-design
