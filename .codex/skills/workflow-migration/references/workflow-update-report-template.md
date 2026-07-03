# Workflow Migration Report Template

````markdown
---
id: migration-v2-<scope-or-date>
stage: workflow-migration
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile:
release_target:
inputs:
  - AGENTS.md
  - .ai/workflow.md
  - .ai/project-context.md
outputs:
  - idempotency_check
  - artifact_inventory
  - stage_mapping
  - gap_classification
  - backfill_plan
  - resume_recommendation
trace_links:
  existing_artifacts: []
reviewed_at: YYYY-MM-DD
---

# Workflow Migration to ddd-website-lifecycle-v2

## Current State

- current_workflow_version_or_shape:
- active_legacy_stage:
- active_intent_or_story_or_release:
- delivery_profile:
- release_target:
- migration_decision: proceed | revise | blocked
- recommended_resume_gate:
- recommended_next_skill:

## Idempotency Check

- workflow_version_current: true | false
- agents_enforcement_present: true | false
- v2_directories_present: true | false
- active_legacy_artifacts_remaining: true | false
- prior_migration_report_found: true | false
- migration_action: no_action_needed | partial_backfill | move_remaining_legacy | blocked
- notes:

## Project-Level Updates

| File | Status | Action | Notes |
|---|---|---|---|
| AGENTS.md | present/missing/unchanged/updated/blocked | DDD-WEBSITE-WORKFLOW section inserted or replaced from init-artifacts.md only when missing or outdated | |
| .ai/workflow.md | present/missing/unchanged/updated | | |
| .ai/project-context.md | present/missing/unchanged/updated | | |

## AGENTS.md Enforcement Verification

- ddd_website_workflow_section_present: true | false
- non_trivial_changes_must_use_lifecycle: true | false
- stop_after_each_gate_for_user_approval: true | false
- no_auto_implementation_or_next_gate: true | false
- blocked_if_missing:

## Artifact Inventory

| Legacy Area | Evidence | v2 Candidate Gate | Notes |
|---|---|---|---|
| idea/change | | Intent Intake | |
| ddd | | Domain Discovery | |
| code-understanding / impact-analysis | | foundation/code reality inputs | |
| stories | | Intent / Behavior input | |
| experience-prototype | | Experience Prototype candidate; static/non-project-stack prototypes require backfill | |
| architecture | | Foundation Architecture or Feature Technical Design candidate | |
| behavior-spec | | Behavior Spec candidate | |
| implementation | | TDD Implementation candidate | |
| verification | | Verification candidate | |
| deploy/post-release | | Target-Aware Release / Learning candidate | |
| archive | | Artifact Compression candidate | |

## Directory Migration

| Legacy Directory | v2 Directory | Action | Active Source of Truth | Notes |
|---|---|---|---|---|
| .ai/idea/ | .ai/intent/ | moved_to_v2 / already_migrated / already_current / blocked_conflict / not_present | | |
| .ai/change/ | .ai/intent/ | moved_to_v2 / already_migrated / already_current / blocked_conflict / not_present | | |
| .ai/ddd/ | .ai/domain/ | moved_to_v2 / already_migrated / already_current / blocked_conflict / not_present | | |
| .ai/stories/ | .ai/spec/ | moved_to_v2 / already_migrated / already_current / blocked_conflict / not_present | | |
| .ai/experience-design/ | .ai/prototype/ | moved_to_v2 / already_migrated / already_current / blocked_conflict / not_present | | |
| .ai/architecture/ | .ai/foundation-architecture/ or .ai/technical-design/ | moved_to_v2 / already_migrated / already_current / blocked_conflict / not_present | | |
| .ai/verification-design/ | .ai/spec/ | moved_to_v2 / already_migrated / already_current / blocked_conflict / not_present | | |
| .ai/deploy/ | .ai/release/ | moved_to_v2 / already_migrated / already_current / blocked_conflict / not_present | | |
| .ai/post-release/ | .ai/learning/ | moved_to_v2 / already_migrated / already_current / blocked_conflict / not_present | | |

## Moved Legacy Artifacts

| Old Path | New Path | Move Method | Notes |
|---|---|---|---|
| | | git mv / filesystem move / already_migrated | |

## Domain Consolidation

- maintained_domain_artifact: .ai/domain/project.md | .ai/domain/<bounded-context>.md
- domain_impact_artifacts_created: .ai/domain-impact/<intent-id>.md
- legacy_domain_files_split_or_consolidated:
- separate_bounded_context_files_created:
- blocked_domain_files:

## Stage Mapping

| v2 Gate | Classification | Evidence | Gap / Risk | Owning Skill |
|---|---|---|---|---|
| Intent Intake | complete / usable_with_gaps / needs_backfill / obsolete / not_applicable | | | intent-intake |
| Domain Discovery | | | | domain-discovery |
| Project Foundation Architecture | | | | project-foundation-architecture |
| Project Foundation Implementation / Init | | | | project-foundation-implementation |
| Experience Prototype | | | | experience-prototype |
| Behavior Spec / BDD / E2E | | | | behavior-spec |
| Feature Technical Design | | | | feature-technical-design |
| TDD Implementation | | | | tdd-implementation |
| Verification | | | | verification |
| Target-Aware Release | | | | target-aware-release |
| Release Execution | | | | release-execution |
| Learning Loop | | | | learning-loop |
| Artifact Compression | | | | artifact-compression |

## Backfill Plan

1.

## No Action Needed

- no_action_needed: true | false
- reason:

## Resume Recommendation

- resume_gate:
- owning_skill:
- required_input:
- reason:
- user_confirmation_required_before_resume: true

## Preserved Legacy Artifacts

-

## Legacy Directory Result

- emptied_legacy_directories:
- blocked_legacy_files:

## Risks

-

## Review Gate

- decision: approve | revise | blocked
- reviewer_focus:
  -
- must_check:
  -
- acceptance_signals:
  -
- unresolved_blockers:
  -
- next_step:
````

## Update Rules

- Keep this report concise.
- Do not duplicate full artifact content.
- Link to existing artifacts as evidence.
- Prefer the smallest next backfill step over restarting the workflow.
- Use only these classifications: `complete`, `usable_with_gaps`, `needs_backfill`, `obsolete`, `not_applicable`.
