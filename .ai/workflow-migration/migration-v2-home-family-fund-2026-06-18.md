---
id: migration-v2-home-family-fund-2026-06-18
stage: workflow-migration
status: draft
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
    - .ai/idea/home-family-fund.md
    - .ai/ddd/home-family-fund.md
    - .ai/code-understanding/home-family-fund.md
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
    - .ai/stories/story-mvp-hardening-recurring-reminder-confirmation-ui.md
    - .ai/verification/home-family-fund-reimbursement-settlement-ui.md
    - .ai/reviews/verification/review-ver-home-family-fund-reimbursement-settlement-ui.md
reviewed_at: 2026-06-18
---

# Workflow Migration to ddd-website-lifecycle-v2

## Current State

- current_workflow_version_or_shape: legacy DDD harness with idea, DDD, code-understanding, impact-analysis, stories, experience-design, architecture, verification-design, implementation, verification, and workflow-review artifacts.
- active_legacy_stage: post-verification review for latest reimbursement settlement UI slice.
- active_intent_or_story_or_release: MVP local_dev hardening; next unresolved story is `story-mvp-hardening-recurring-reminder-confirmation-ui`.
- delivery_profile: mvp
- release_target: local_dev
- migration_decision: proceed
- recommended_resume_gate: Experience Prototype
- recommended_next_skill: experience-design

## Project-Level Updates

| File | Status | Action | Notes |
|---|---|---|---|
| AGENTS.md | missing -> updated | Added root workflow marker block. | Preserves future non-marker content by using `DDD-WEBSITE-WORKFLOW` markers. |
| .ai/workflow.md | present -> updated | Added v2 workflow version, v2 directory map, latest completed slice, and resume recommendation. | Legacy workflow history remains in place. |
| .ai/project-context.md | present -> updated | Added v2 migration metadata, v2 directories, and current resume gate. | Project defaults remain `mvp` / `local_dev`. |

## Artifact Inventory

| Legacy Area | Evidence | v2 Candidate Gate | Notes |
|---|---|---|---|
| idea/change | `.ai/idea/home-family-fund.md`; MVP hardening change in `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | Intent Intake | Complete enough for current local_dev MVP. |
| ddd | `.ai/ddd/home-family-fund.md` | Domain Discovery | Complete enough; no restart needed. |
| code-understanding / impact-analysis | `.ai/code-understanding/home-family-fund.md`, `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | foundation/code reality inputs | Usable; refresh only before new reimbursement/batch-history or production slicing. |
| stories | 15 story artifacts under `.ai/stories/` | Intent / Behavior input | Recurring reminder confirmation UI remains the most obvious incomplete hardening story. |
| experience-design | 13 artifacts under `.ai/experience-design/` | Experience Prototype candidate | Usable as design artifacts, but most are not runnable prototypes. Backfill only for the active next story. |
| architecture | 6 artifacts under `.ai/architecture/` | Foundation Architecture or Feature Technical Design candidate | Existing architecture is usable; feature technical design should be refreshed per active slice after prototype/spec. |
| verification-design | 6 artifacts under `.ai/verification-design/` | Behavior Spec candidate | Completed hardening slices have specs; recurring reminder confirmation UI does not yet. |
| implementation | 29 implementation artifacts under `.ai/implementation/` | TDD Implementation candidate | Existing implemented slices are preserved; do not rewrite for v2. |
| verification | 29 verification artifacts under `.ai/verification/` | Verification candidate | Latest reimbursement settlement UI is verified and workflow-reviewed. |
| deploy/post-release | No deploy/post-release artifacts; empty legacy dirs exist | Target-Aware Release / Learning candidate | Needs backfill only when release target moves beyond `local_dev`. |

## Stage Mapping

| v2 Gate | Classification | Evidence | Gap / Risk | Owning Skill |
|---|---|---|---|---|
| Intent Intake | complete | `.ai/idea/home-family-fund.md`, `.ai/stories/`, MVP hardening impact analysis | Current next story still has one role-policy open question. | idea-intake or story-slicing |
| Domain Discovery | complete | `.ai/ddd/home-family-fund.md` with recurring/reimbursement/ledger policies | Refresh only if role policy changes the domain model. | ddd-event-storming |
| Project Foundation Architecture | usable_with_gaps | `.ai/architecture/home-family-fund.md`, web foundation, many feature architecture artifacts | No v2-native foundation architecture artifact; legacy architecture is usable for local_dev. | architecture-planner |
| Project Foundation Implementation / Init | complete | Prisma, Next.js, Vitest, Playwright, DB E2E, controlled auth, recent passing gates | Quality scripts should run sequentially because `prisma generate` races in parallel. | implementation-cycle |
| Experience Prototype | needs_backfill | Many experience-design artifacts exist; next recurring confirmation story has no experience artifact | Active next story needs prototype/UX decisions for role policy and confirmation pattern. | experience-design |
| Behavior Spec / BDD / E2E | needs_backfill | Completed hardening slices have verification-design; recurring confirmation does not | Need BDD/E2E design for pending-to-confirmed recurring flow. | verification-design |
| Feature Technical Design | needs_backfill | Architecture artifacts exist for completed slices | Recurring confirmation needs feature technical design after prototype/spec. | architecture-planner |
| TDD Implementation | usable_with_gaps | 29 implementation logs and recent TDD evidence for hardening slices | Do not rewrite legacy implementations; enforce tests-first for future slices. | implementation-cycle |
| Verification | usable_with_gaps | 29 verification reports and latest workflow review | Future recurring flow must add verification report; production readiness remains out of scope. | verification-runner |
| Target-Aware Release | needs_backfill | README hints Vercel/Neon; no deploy/release artifact | Backfill only after target environment is selected or release scope expands beyond local_dev. | deploy-readiness |
| Learning Loop | needs_backfill | Providers unknown in project context | Needed before production-bound release, not current local_dev work. | post-release-tracking |

## Backfill Plan

1. Do not restart discovery or rewrite legacy artifacts.
2. Resume the next MVP hardening slice at Experience Prototype using `.ai/stories/story-mvp-hardening-recurring-reminder-confirmation-ui.md`.
3. Resolve recurring confirmation UX and role-policy questions in experience design.
4. Create Behavior Spec / BDD / E2E for the recurring pending-to-confirmed flow.
5. Create or update Feature Technical Design for the recurring confirmation server action, persistence wrapper, dashboard UI, and idempotency/conflict handling.
6. Implement through TDD and verify with local_dev quality gates.
7. Defer Target-Aware Release and Learning Loop until production target, OAuth callback, monitoring, analytics, and feedback channels are selected.

## Resume Recommendation

- resume_gate: Experience Prototype
- owning_skill: experience-design
- required_input: `.ai/stories/story-mvp-hardening-recurring-reminder-confirmation-ui.md`
- reason: The project has completed local_dev foundation and several hardening slices. The smallest remaining risk-reducing path is the user-facing recurring reminder confirmation flow, which still has UX and authorization-role questions.

## Preserved Legacy Artifacts

- All existing legacy `.ai` directories and artifacts are preserved in place.
- Empty v2 directories are scaffolded with `.gitkeep` files so future work can write v2-native artifacts without moving old content.
- `.ai/implementation/` and `.ai/verification/` continue to hold both legacy and future v2-compatible logs/reports.

## Risks

- `.ai/workflow.md` was stale before migration and has now been updated, but older artifacts still use legacy stage names.
- Existing experience-design artifacts are reviewable design docs, not runnable interactive prototypes; backfill only active slices rather than forcing historical prototypes.
- Target-Aware Release and Learning Loop are intentionally incomplete because the project target remains `local_dev`.
- Production Google OAuth smoke, observability, backup/restore, analytics, and rollback remain out of scope until release target changes.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm v2 migration should preserve old artifacts instead of rewriting them.
  - Confirm recurring reminder confirmation UI is the next local_dev hardening slice.
  - Confirm release/learning backfills can wait until production target is selected.
- must_check:
  - v2 directories exist.
  - AGENTS.md has workflow markers.
  - `.ai/workflow.md` and `.ai/project-context.md` name v2 and the current resume gate.
  - Latest reimbursement settlement UI verification remains closed for local_dev.
- acceptance_signals:
  - Migration report exists.
  - Legacy artifacts remain in place.
  - One resume gate and owning skill are identified.
- unresolved_blockers:
  - None for continuing local_dev work.
- next_step:
  - experience-design
