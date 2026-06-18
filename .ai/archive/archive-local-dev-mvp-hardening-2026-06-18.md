---
id: archive-local-dev-mvp-hardening-2026-06-18
stage: artifact-compression
status: accepted
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/home-family-fund.md
    - .ai/domain/home-family-fund.md
    - .ai/foundation-architecture/home-family-fund.md
    - .ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md
    - .ai/release/home-family-fund-local-dev-readiness.md
    - .ai/prototype/recurring-reminder-confirmation-ui.md
    - .ai/spec/recurring-reminder-confirmation-ui.md
    - .ai/technical-design/recurring-reminder-confirmation-ui.md
    - .ai/implementation/recurring-reminder-confirmation-ui.md
    - .ai/verification/recurring-reminder-confirmation-ui.md
  commits_or_prs:
    - 2d63d71 Adopt DDD workflow v2 scaffold
    - 9dda996 Prototype recurring reminder confirmation
    - 1732df1 Design recurring reminder confirmation implementation
    - 24213cd Implement recurring reminder confirmation
    - 9ecfc34 Mark local dev MVP readiness
    - 9819d28 Split dashboard workflows into dedicated routes
    - df773d9 Migrate DDD workflow artifacts to v2
reviewed_at: 2026-06-18
---

# Artifact Compression for Local Dev MVP Hardening

## Compression Decision

- scope: local_dev MVP hardening iteration plus DDD workflow v2 migration.
- reason: The local_dev MVP hardening work has a release-readiness artifact, the recurring reminder confirmation slice is implemented and verified, and the DDD artifact migration is complete. A compact archive summary is now needed before optional manual pruning.
- decision: compress
- next_lifecycle_entry: User local_dev review, production release intake, or next MVP slice selection.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Home Family Fund is a Traditional Chinese, dark-theme, single-household MVP for tracking shared family fund income, expenses, reimbursements, categories, recurring items, monthly reports, and role-aware access.
- final_behavior_or_spec: The local_dev MVP now supports authenticated household access, dashboard read models, ledger record creation, permission matrix checks, reimbursement settlement UI, DB-backed E2E foundation, and recurring reminder confirmation. Reminder-mode recurring occurrences remain pending until an authorized user confirms them; confirmation creates a matching ledger record, links `ledgerRecordId`, removes the pending item, and updates monthly totals.
- domain_rules: Functional pages require sign-in and app-owned member authorization. General members can create their own records only; admins and finance managers can create records for any member. Reminder confirmation uses the resulting ledger-record creation permission, not recurring-rule management permission. Posted recurring occurrences cannot be confirmed again. Member-paid expenses remain reimbursable until marked reimbursed once by a finance manager.
- foundation_decisions: The project uses Next.js, React, TypeScript, Prisma/PostgreSQL, Better Auth, Vitest, Playwright, Tailwind CSS, and shadcn-style UI primitives. DDD workflow artifacts now live in v2 directories. New workflow artifacts must be written only to v2 directories and agents must stop after each lifecycle gate for user approval.
- technical_decisions: Recurring confirmation uses a dashboard-local panel and server action, a Prisma transaction wrapper around recurring occurrence confirmation and ledger record creation, DB-backed dashboard reload as proof of persistence, and controlled auth headers only outside production. DB-backed E2E uses dedicated port `3100`, `.next-e2e`, and per-test DB reset.
- release_target_and_result: `local_dev` is ready for user review. Production readiness is not assessed and remains blocked on hosting/database target, production Google OAuth callback, secrets, migration/rollback, backup/restore, smoke test, monitoring/logging, analytics, and feedback channels.
- accepted_risks: Full DB-backed E2E is slower because each browser test resets the database. Controlled auth headers are local/E2E-only. Quality gates that invoke `prisma generate` should run sequentially. General-member self-confirmation is covered below browser level because the current seed lacks a linked Kai user.
- learning_outcomes: No production Learning Loop artifact exists yet because production release is not selected. Define analytics, monitoring, logging, and feedback during production release intake.
- commits_or_prs: See frontmatter `commits_or_prs`.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/workflow.md` | maintained | Workflow source of truth and gate enforcement. | keep | This archive plus workflow current state. |
| `.ai/project-context.md` | maintained | Project-level assumptions and next step. | keep | This archive links back to it. |
| `.ai/intent/home-family-fund.md` | maintained | Product intent remains current. | keep | Summary preserves key intent only. |
| `.ai/domain/home-family-fund.md` | maintained | Domain language and rules remain current. | keep | Summary preserves critical rules only. |
| `.ai/foundation-architecture/home-family-fund.md` | maintained | Foundation architecture remains useful for future feature work. | keep | Summary preserves stack and boundary decisions only. |
| `.ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md` | maintained | Migration evidence and old/new path mapping should remain available. | keep | This archive references it. |
| `.ai/release/home-family-fund-local-dev-readiness.md` | active | Next user review input and local_dev release decision. | keep | Summary preserves release result and risks. |
| `.ai/learning/` | active | Production learning not created yet. | keep empty | Backfill after production target selection. |
| `.ai/spec/story-*.md` | active | Remaining story/spec backlog is input for next MVP slice selection. | keep | Use during story-slicing. |
| `.ai/prototype/recurring-reminder-confirmation-ui.md` | summarized | Latest completed slice prototype decisions are captured here. | mark_prune_candidate | This archive, verification report, and git history. |
| `.ai/spec/recurring-reminder-confirmation-ui.md` | summarized | Latest completed behavior spec is captured here. | mark_prune_candidate | This archive and git history. |
| `.ai/technical-design/recurring-reminder-confirmation-ui.md` | summarized | Latest completed technical design is captured here. | mark_prune_candidate | This archive and git history. |
| `.ai/implementation/recurring-reminder-confirmation-ui.md` | summarized | Latest completed implementation log is captured here. | mark_prune_candidate | This archive and git history. |
| `.ai/verification/recurring-reminder-confirmation-ui.md` | summarized | Latest completed verification is captured here. | mark_prune_candidate | This archive and release readiness. |
| Historical completed `.ai/prototype/*.md` except active/backlog review needs | prune_candidate | Completed UX/design evidence is compressed here or remains in git. | mark_prune_candidate | This archive and git history. |
| Historical completed `.ai/spec/home-family-fund-*.md` | prune_candidate | Completed BDD/E2E specs are compressed here or remain in git. | mark_prune_candidate | This archive and git history. |
| Historical completed `.ai/technical-design/home-family-fund-*.md` | prune_candidate | Completed feature design decisions are compressed here or remain in git. | mark_prune_candidate | This archive and git history. |
| Historical completed `.ai/implementation/home-family-fund-*.md` | prune_candidate | Completed implementation logs are summarized at iteration level. | mark_prune_candidate | This archive and git history. |
| Historical completed `.ai/verification/home-family-fund-*.md` | prune_candidate | Completed verification logs are summarized at iteration level. | mark_prune_candidate | This archive and release readiness. |
| `.ai/reviews/**` | prune_candidate | Completed review artifacts are summarized by migration and release state. | mark_prune_candidate | This archive and git history. |
| `.ai/code-understanding/home-family-fund.md` | summarized | Useful code reality input but not the active source of truth. | keep_for_now | Refresh before broad architecture/product changes. |
| `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | summarized | MVP hardening impact decisions are represented in release readiness. | keep_for_now | This archive and git history. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/prototype/recurring-reminder-confirmation-ui.md`
- `.ai/spec/recurring-reminder-confirmation-ui.md`
- `.ai/technical-design/recurring-reminder-confirmation-ui.md`
- `.ai/implementation/recurring-reminder-confirmation-ui.md`
- `.ai/verification/recurring-reminder-confirmation-ui.md`
- `.ai/prototype/story-ledger-record-corrections.md`
- `.ai/prototype/story-ledger-entry-creation.md`
- `.ai/prototype/story-recurring-rules-and-confirmation.md`
- `.ai/prototype/story-mvp-hardening-permission-matrix-browser-checks.md`
- `.ai/prototype/story-category-management.md`
- `.ai/prototype/story-authenticated-household-access.md`
- `.ai/prototype/story-mvp-hardening-reimbursement-settlement-ui.md`
- `.ai/prototype/story-mvp-hardening-browser-create-record-flow.md`
- `.ai/prototype/story-admin-member-management.md`
- `.ai/prototype/story-responsive-core-web-experience.md`
- `.ai/prototype/story-reimbursement-table-and-settlement.md`
- `.ai/prototype/story-monthly-records-and-reports.md`
- `.ai/technical-design/home-family-fund-permission-matrix-browser-checks.md`
- `.ai/technical-design/home-family-fund-db-backed-dashboard-e2e.md`
- `.ai/technical-design/home-family-fund-reimbursement-settlement-ui.md`
- `.ai/technical-design/home-family-fund-controlled-auth-session-e2e.md`
- `.ai/technical-design/home-family-fund-browser-create-record-flow.md`
- `.ai/spec/home-family-fund-permission-matrix-browser-checks.md`
- `.ai/spec/home-family-fund-db-backed-dashboard-e2e.md`
- `.ai/spec/home-family-fund-mvp.md`
- `.ai/spec/home-family-fund-reimbursement-settlement-ui.md`
- `.ai/spec/home-family-fund-controlled-auth-session-e2e.md`
- `.ai/spec/home-family-fund-browser-create-record-flow.md`
- `.ai/implementation/home-family-fund-ledger-entry-creation.md`
- `.ai/implementation/home-family-fund-session-access.md`
- `.ai/implementation/home-family-fund-prisma-schema-foundation.md`
- `.ai/implementation/home-family-fund-permission-matrix-browser-checks.md`
- `.ai/implementation/home-family-fund-e2e-foundation.md`
- `.ai/implementation/home-family-fund-access-hints.md`
- `.ai/implementation/home-family-fund-ledger-record-corrections.md`
- `.ai/implementation/home-family-fund-session-identity-mapping.md`
- `.ai/implementation/home-family-fund-db-backed-dashboard-e2e.md`
- `.ai/implementation/home-family-fund-member-management.md`
- `.ai/implementation/home-family-fund-google-sign-in-entry.md`
- `.ai/implementation/home-family-fund-homepage-auth-gate.md`
- `.ai/implementation/home-family-fund-reimbursement-settlement.md`
- `.ai/implementation/home-family-fund-google-auth-route.md`
- `.ai/implementation/home-family-fund-reimbursement-settlement-ui.md`
- `.ai/implementation/home-family-fund-monthly-report-read-model.md`
- `.ai/implementation/home-family-fund-mvp-baseline.md`
- `.ai/implementation/home-family-fund-current-member-composition.md`
- `.ai/implementation/home-family-fund-current-member-prisma-data-source.md`
- `.ai/implementation/home-family-fund-category-management.md`
- `.ai/implementation/home-family-fund-controlled-auth-session-e2e.md`
- `.ai/implementation/home-family-fund-server-current-member.md`
- `.ai/implementation/home-family-fund-better-auth-persistence-schema.md`
- `.ai/implementation/home-family-fund-prisma-runtime-auth-adapter.md`
- `.ai/implementation/home-family-fund-reimbursement-table-read-model.md`
- `.ai/implementation/home-family-fund-home-access-states.md`
- `.ai/implementation/home-family-fund-app-shell-dashboard.md`
- `.ai/implementation/home-family-fund-recurring-rules.md`
- `.ai/implementation/home-family-fund-browser-create-record-flow.md`
- `.ai/verification/home-family-fund-ledger-entry-creation.md`
- `.ai/verification/home-family-fund-session-access.md`
- `.ai/verification/home-family-fund-prisma-schema-foundation.md`
- `.ai/verification/home-family-fund-permission-matrix-browser-checks.md`
- `.ai/verification/home-family-fund-e2e-foundation.md`
- `.ai/verification/home-family-fund-access-hints.md`
- `.ai/verification/home-family-fund-ledger-record-corrections.md`
- `.ai/verification/home-family-fund-session-identity-mapping.md`
- `.ai/verification/home-family-fund-db-backed-dashboard-e2e.md`
- `.ai/verification/home-family-fund-member-management.md`
- `.ai/verification/home-family-fund-google-sign-in-entry.md`
- `.ai/verification/home-family-fund-homepage-auth-gate.md`
- `.ai/verification/home-family-fund-reimbursement-settlement.md`
- `.ai/verification/home-family-fund-google-auth-route.md`
- `.ai/verification/home-family-fund-reimbursement-settlement-ui.md`
- `.ai/verification/home-family-fund-monthly-report-read-model.md`
- `.ai/verification/home-family-fund-mvp-baseline.md`
- `.ai/verification/home-family-fund-current-member-composition.md`
- `.ai/verification/home-family-fund-current-member-prisma-data-source.md`
- `.ai/verification/home-family-fund-category-management.md`
- `.ai/verification/home-family-fund-controlled-auth-session-e2e.md`
- `.ai/verification/home-family-fund-server-current-member.md`
- `.ai/verification/home-family-fund-better-auth-persistence-schema.md`
- `.ai/verification/home-family-fund-prisma-runtime-auth-adapter.md`
- `.ai/verification/home-family-fund-reimbursement-table-read-model.md`
- `.ai/verification/home-family-fund-home-access-states.md`
- `.ai/verification/home-family-fund-app-shell-dashboard.md`
- `.ai/verification/home-family-fund-recurring-rules.md`
- `.ai/verification/home-family-fund-browser-create-record-flow.md`
- `.ai/reviews/impact-analysis/ia-home-family-fund-mvp-hardening.md`
- `.ai/reviews/verification/review-ver-home-family-fund-reimbursement-settlement-ui.md`
- `.ai/reviews/html/ia-home-family-fund-mvp-hardening.html`

## Workflow Updates

- active_lifecycle_stage: User local_dev review, production release intake, or next MVP slice selection.
- artifact_inventory_changes: This archive is now the first completed-work summary for the local_dev MVP hardening iteration and v2 migration. Workflow inventory should treat historical completed implementation, verification, prototype, spec, and technical-design files listed above as prune candidates after explicit user approval.
- archive_notes: Keep `.ai/workflow.md`, `.ai/project-context.md`, maintained intent/domain/foundation artifacts, workflow migration report, and local_dev release readiness. Use this archive as the compact decision record before optional manual pruning.

## Risks

- traceability_risks: Pruning will remove detailed intermediate prose from the working tree, but git history and this archive preserve traceability. Do not prune without explicit `artifact-prune`.
- audit_or_compliance_risks: No legal, security incident, production incident, or compliance audit evidence was identified in this scope.
- unresolved_work: Production release target, production OAuth smoke, monitoring/logging, analytics, feedback channel, backup/restore, rollback, and Learning Loop remain unresolved.

## Review Gate

- decision: approve
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - release and learning outcomes retained
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary
  - future work can resume from maintained files and archive summary
- unresolved_blockers:
  - None for local_dev review or optional manual prune.
- next_step:
  - optional_manual_artifact_prune_or_user_local_dev_review
