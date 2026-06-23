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
  - .ai/technical-design/admin-only-category-management.md
  - .ai/implementation/admin-only-category-management.md
  - .ai/verification/admin-only-category-management.md
  - .ai/learning/admin-only-category-management.md
  - .ai/archive/archive-admin-only-category-management-2026-06-19.md
  - .ai/intent/local-google-oauth-login.md
  - .ai/spec/local-google-oauth-login.md
  - .ai/intent/admin-google-oauth-member-invitations.md
  - .ai/domain-impact/admin-google-oauth-member-invitations.md
  - .ai/prototype/admin-google-oauth-member-invitations.md
  - .ai/spec/admin-google-oauth-member-invitations.md
  - .ai/technical-design/admin-google-oauth-member-invitations.md
  - .ai/implementation/admin-google-oauth-member-invitations.md
  - .ai/verification/admin-google-oauth-member-invitations.md
  - .ai/learning/admin-google-oauth-member-invitations.md
  - .ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md
  - .ai/intent/remove-standalone-create-record-entry.md
  - .ai/prototype/remove-standalone-create-record-entry.md
  - .ai/spec/remove-standalone-create-record-entry.md
  - .ai/technical-design/remove-standalone-create-record-entry.md
  - .ai/implementation/remove-standalone-create-record-entry.md
  - .ai/verification/remove-standalone-create-record-entry.md
  - .ai/release/remove-standalone-create-record-entry-local-dev-readiness.md
  - .ai/learning/remove-standalone-create-record-entry.md
  - .ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md
  - .ai/intent/desktop-product-structure-layout-redesign.md
  - .ai/prototype/desktop-product-structure-layout-redesign.md
  - .ai/spec/desktop-product-structure-layout-redesign.md
  - .ai/technical-design/desktop-product-structure-layout-redesign.md
  - .ai/implementation/desktop-product-structure-layout-redesign.md
  - .ai/verification/desktop-product-structure-layout-redesign.md
  - .ai/release/desktop-product-structure-layout-redesign-local-dev-readiness.md
  - .ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md
  - .ai/archive/archive-record-list-detail-modal-2026-06-20.md
  - .ai/intent/category-visual-identity.md
  - .ai/domain-impact/category-visual-identity.md
  - .ai/prototype/category-visual-identity.md
  - .ai/spec/category-visual-identity.md
  - .ai/technical-design/category-visual-identity.md
  - .ai/implementation/category-visual-identity.md
  - .ai/verification/category-visual-identity.md
  - .ai/release/category-visual-identity-local-dev-readiness.md
  - .ai/learning/category-visual-identity.md
  - .ai/archive/archive-category-visual-identity-2026-06-21.md
  - .ai/intent/edit-delete-ledger-records.md
  - .ai/domain-impact/edit-delete-ledger-records.md
  - .ai/prototype/edit-delete-ledger-records.md
  - .ai/spec/edit-delete-ledger-records.md
  - .ai/technical-design/edit-delete-ledger-records.md
  - .ai/implementation/edit-delete-ledger-records.md
  - .ai/verification/edit-delete-ledger-records.md
  - .ai/release/edit-delete-ledger-records-local-dev-readiness.md
  - .ai/learning/edit-delete-ledger-records.md
  - .ai/archive/archive-edit-delete-ledger-records-2026-06-21.md
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
  - .ai/archive/archive-record-search-sort-filter-2026-06-21.md
  - .ai/intent/batch-search-record-actions.md
  - .ai/domain-impact/batch-search-record-actions.md
  - .ai/prototype/batch-search-record-actions.md
  - .ai/spec/batch-search-record-actions.md
  - .ai/technical-design/batch-search-record-actions.md
  - .ai/implementation/batch-search-record-actions.md
  - .ai/verification/batch-search-record-actions.md
  - .ai/release/batch-search-record-actions-local-dev-readiness.md
  - .ai/learning/batch-search-record-actions.md
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
  - .ai/intent/admin-created-member-google-binding.md
  - .ai/domain-impact/admin-created-member-google-binding.md
  - .ai/prototype/admin-created-member-google-binding.md
  - .ai/spec/admin-created-member-google-binding.md
  - .ai/code-understanding/home-family-fund.md
  - .ai/impact-analysis/home-family-fund-mvp-hardening.md
  - .ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md
  - .ai/release/home-family-fund-local-dev-readiness.md
  - .ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md
reviewed_at: 2026-06-21
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
- active_change: admin-created-member-google-binding
- latest_completed_slice: batch search record actions, compressed in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md`.
- current_stage: Behavior Spec review for admin-created member Google binding.
- recommended_resume_gate: Feature Technical Design for `admin-created-member-google-binding` after approval.
- recommended_next_skill: feature-technical-design after this Behavior Spec review is approved.

## Artifact Inventory

- idea: maintained `.ai/intent/home-family-fund.md`; completed batch search record actions intent is summarized in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md`; completed record search, sort, and filter intent is summarized in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md`; completed record detail reimbursement intent is summarized in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md`; completed edit/delete ledger records intent is summarized in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md`; completed remove standalone create-record entry and desktop layout redesign intent artifacts are summarized in archives.
- completed record list detail modal: summarized in `.ai/archive/archive-record-list-detail-modal-2026-06-20.md`; source intent/prototype/spec/technical-design/implementation/verification/release artifacts were manually pruned after compression.
- ddd: 1 maintained artifact, `.ai/domain/home-family-fund.md`.
- domain-impact: completed batch search record actions impact is summarized in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md`; completed record search, sort, and filter impact is summarized in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md`; completed record detail reimbursement impact is summarized in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md`; completed edit/delete ledger records impact is summarized in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md`; completed category visual identity and ordering impact is summarized in `.ai/archive/archive-category-visual-identity-2026-06-21.md`; completed admin Google OAuth and member invitations impact is summarized in `.ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md`; completed admin-only category management impact is summarized in `.ai/archive/archive-admin-only-category-management-2026-06-19.md`.
- code-understanding: 1 artifact, `.ai/code-understanding/home-family-fund.md`.
- impact-analysis: 1 artifact, `.ai/impact-analysis/home-family-fund-mvp-hardening.md`.
- stories: 15 story artifacts remain under `.ai/spec/` for future slice selection and historical story context.
- experience-design/prototype: completed batch search record actions prototype is summarized in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md`; completed record search, sort, and filter prototype is summarized in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md`; completed record detail reimbursement prototype is summarized in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md`; completed edit/delete ledger records prototype is summarized in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md`; completed category visual identity and ordering prototype is summarized in `.ai/archive/archive-category-visual-identity-2026-06-21.md`; completed desktop layout redesign prototype is summarized in `.ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md`; completed remove standalone create-record entry prototype is summarized in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md`; completed admin-only category management prototype is summarized in `.ai/archive/archive-admin-only-category-management-2026-06-19.md`; completed prior prototype/design artifacts are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`.
- architecture/technical-design: completed batch search record actions technical design is summarized in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md`; completed record search, sort, and filter technical design is summarized in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md`; completed record detail reimbursement technical design is summarized in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md`; completed edit/delete ledger records technical design is summarized in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md`; completed category visual identity and ordering technical design is summarized in `.ai/archive/archive-category-visual-identity-2026-06-21.md`; completed desktop layout redesign design is summarized in `.ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md`; completed remove standalone create-record entry design is summarized in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md`; completed admin Google OAuth and member invitations design is summarized in `.ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md`; completed admin-only category management design is summarized in `.ai/archive/archive-admin-only-category-management-2026-06-19.md`; completed prior feature design artifacts are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`.
- behavior specs: completed batch search record actions spec is summarized in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md`; completed record search, sort, and filter spec is summarized in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md`; completed record detail reimbursement spec is summarized in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md`; completed edit/delete ledger records spec is summarized in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md`; completed category visual identity and ordering spec is summarized in `.ai/archive/archive-category-visual-identity-2026-06-21.md`; completed desktop layout redesign spec is summarized in `.ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md`; completed remove standalone create-record entry spec is summarized in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md`; completed admin Google OAuth and member invitations spec is summarized in `.ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md`; completed admin-only category management spec is summarized in `.ai/archive/archive-admin-only-category-management-2026-06-19.md`; remaining story specs stay active for future slice selection.
- implementation: completed batch search record actions implementation is summarized in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md`; completed record search, sort, and filter implementation is summarized in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md`; completed record detail reimbursement implementation is summarized in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md`; completed edit/delete ledger records implementation is summarized in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md`; completed category visual identity and ordering implementation is summarized in `.ai/archive/archive-category-visual-identity-2026-06-21.md`; completed desktop layout redesign implementation is summarized in `.ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md`; completed remove standalone create-record entry implementation is summarized in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md`; completed admin Google OAuth and member invitations implementation is summarized in `.ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md`; completed admin-only category management implementation is summarized in `.ai/archive/archive-admin-only-category-management-2026-06-19.md`; completed prior implementation logs are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`.
- verification: completed batch search record actions verification is summarized in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md` and supports `local_dev` with known gaps; completed record search, sort, and filter verification is summarized in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md` and supports `local_dev`; completed record detail reimbursement verification is summarized in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md` and supports `local_dev`; completed edit/delete ledger records verification is summarized in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md` and supports `local_dev`; completed category visual identity and ordering verification is summarized in `.ai/archive/archive-category-visual-identity-2026-06-21.md` and supports `local_dev`; completed desktop layout redesign verification is summarized in `.ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md` and supports `local_dev`; completed remove standalone create-record entry verification is summarized in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md` and supports `local_dev`; completed admin Google OAuth and member invitations verification is summarized in `.ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md` and supports `local_dev`; completed admin-only category management verification is summarized in `.ai/archive/archive-admin-only-category-management-2026-06-19.md` and supports `local_dev`; completed prior verification reports are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`.
- release: completed batch search record actions local_dev readiness is summarized in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md`; completed record search, sort, and filter local_dev readiness is summarized in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md`; completed record detail reimbursement local_dev readiness is summarized in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md`; completed edit/delete ledger records local_dev readiness is summarized in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md`; completed category visual identity and ordering local_dev readiness is summarized in `.ai/archive/archive-category-visual-identity-2026-06-21.md`; completed record list detail modal local_dev readiness is summarized in `.ai/archive/archive-record-list-detail-modal-2026-06-20.md`; completed desktop layout redesign local_dev readiness is summarized in `.ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md`; completed remove standalone create-record entry local_dev readiness is summarized in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md`; v2 local_dev release readiness at `.ai/release/home-family-fund-local-dev-readiness.md` includes prior admin-only category management and admin Google OAuth/member invitations work and supports `local_dev`.
- learning: completed batch search record actions learning loop is summarized in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md`; completed record search, sort, and filter learning loop is summarized in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md`; completed record detail reimbursement learning loop is summarized in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md`; completed edit/delete ledger records learning loop is summarized in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md`; completed category visual identity and ordering learning loop is summarized in `.ai/archive/archive-category-visual-identity-2026-06-21.md`; completed remove standalone create-record entry learning loop is summarized in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md`; completed admin Google OAuth and member invitations learning signals are summarized in `.ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md`; completed admin-only category management learning signals are summarized in `.ai/archive/archive-admin-only-category-management-2026-06-19.md`.
- reviews: completed workflow reviews are summarized in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md`.
- v2 scaffold: `.ai/intent/`, `.ai/domain/`, `.ai/domain-impact/`, `.ai/foundation-architecture/`, `.ai/foundation-implementation/`, `.ai/prototype/`, `.ai/spec/`, `.ai/technical-design/`, `.ai/implementation/`, `.ai/verification/`, `.ai/release/`, `.ai/learning/`, `.ai/workflow-migration/`, and `.ai/archive/` are present.
- deploy/release: completed remove standalone create-record entry readiness is summarized in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md`; v2 local_dev release readiness at `.ai/release/home-family-fund-local-dev-readiness.md` includes prior local_dev slices and supports `local_dev`; production deploy readiness is not assessed.
- release/learning: completed category visual identity local_dev readiness and learning loop are summarized in `.ai/archive/archive-category-visual-identity-2026-06-21.md`; v2 `.ai/release/` has refreshed local_dev readiness; completed remove standalone create-record entry learning signals are summarized in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md`; completed admin Google OAuth and member invitations learning signals are summarized in `.ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md`; completed admin-only category management learning signals are summarized in `.ai/archive/archive-admin-only-category-management-2026-06-19.md`.
- archive: `.ai/archive/archive-batch-search-record-actions-2026-06-22.md` summarizes completed batch search record actions; `.ai/archive/archive-record-search-sort-filter-2026-06-21.md` summarizes completed record search, sort, and filter; `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md` summarizes completed record detail reimbursement; `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md` summarizes completed edit/delete ledger records; `.ai/archive/archive-category-visual-identity-2026-06-21.md` summarizes completed category visual identity and ordering; `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md` summarizes the completed local_dev MVP hardening iteration and v2 migration; `.ai/archive/archive-admin-only-category-management-2026-06-19.md` summarizes completed admin-only category management; `.ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md` summarizes completed admin Google OAuth and member invitations; `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md` summarizes completed remove standalone create-record entry; `.ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md` summarizes completed desktop layout redesign; `.ai/archive/archive-record-list-detail-modal-2026-06-20.md` summarizes completed record list detail modal and dashboard panel refinements.
- prune: completed batch search record actions prune candidates are listed in `.ai/archive/archive-batch-search-record-actions-2026-06-22.md` but have not been pruned; completed record search, sort, and filter prune candidates listed in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md` were manually pruned after compression; completed record detail reimbursement prune candidates are listed in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md` but have not been pruned; completed edit/delete ledger records prune candidates are listed in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md` but have not been pruned; completed category visual identity and ordering prune candidates are listed in `.ai/archive/archive-category-visual-identity-2026-06-21.md` but have not been pruned; completed intermediate artifacts listed in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md` were manually pruned after compression; record list detail modal prune candidates listed in `.ai/archive/archive-record-list-detail-modal-2026-06-20.md` were manually pruned after compression; remove standalone create-record entry prune candidates are listed in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md` but have not been pruned; use archive summaries and git history for full trace.

## Notes

- Assumptions: project defaults remain `delivery_profile: mvp` and `release_target: local_dev` because existing artifacts consistently use those values.
- Open questions: production target, hosting environment, monitoring provider, analytics provider, and feedback channels are not yet selected.
- Deferred cleanup: production deployment slicing remains blocked until target environment is selected.
- Smallest next path: next Intent Intake or stricter-target release readiness.
- Archive notes: completed record search, sort, and filter prune candidates listed in `.ai/archive/archive-record-search-sort-filter-2026-06-21.md` were pruned by explicit manual `artifact-prune` approval. Completed record detail reimbursement prune candidates are listed in `.ai/archive/archive-record-detail-reimbursement-2026-06-21.md` but have not been pruned. Completed edit/delete ledger records prune candidates are listed in `.ai/archive/archive-edit-delete-ledger-records-2026-06-21.md` but have not been pruned. Completed category visual identity and ordering prune candidates are listed in `.ai/archive/archive-category-visual-identity-2026-06-21.md` but have not been pruned. Completed intermediate artifacts listed in `.ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md` were pruned by explicit manual `artifact-prune` approval. Record list detail modal prune candidates listed in `.ai/archive/archive-record-list-detail-modal-2026-06-20.md` were pruned by explicit manual `artifact-prune` approval. Admin-only category management prune candidates are listed in `.ai/archive/archive-admin-only-category-management-2026-06-19.md` but have not been pruned. Admin Google OAuth and member invitation prune candidates are listed in `.ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md` but have not been pruned. Remove standalone create-record entry prune candidates are listed in `.ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md` but have not been pruned. Desktop layout redesign prune candidates are listed in `.ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md` but have not been pruned. Do not delete maintained intent, domain, foundation, workflow, project context, migration, release readiness, archive summaries, or active backlog artifacts.
