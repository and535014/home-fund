---
id: archive-admin-google-oauth-member-invitations-2026-06-20
stage: artifact-compression
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/admin-google-oauth-member-invitations.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-google-oauth-member-invitations.md
  - .ai/prototype/admin-google-oauth-member-invitations.md
  - .ai/spec/admin-google-oauth-member-invitations.md
  - .ai/technical-design/admin-google-oauth-member-invitations.md
  - .ai/implementation/admin-google-oauth-member-invitations.md
  - .ai/verification/admin-google-oauth-member-invitations.md
  - .ai/release/home-family-fund-local-dev-readiness.md
  - .ai/learning/admin-google-oauth-member-invitations.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/admin-google-oauth-member-invitations.md
    - .ai/domain-impact/admin-google-oauth-member-invitations.md
    - .ai/prototype/admin-google-oauth-member-invitations.md
    - .ai/spec/admin-google-oauth-member-invitations.md
    - .ai/technical-design/admin-google-oauth-member-invitations.md
    - .ai/implementation/admin-google-oauth-member-invitations.md
    - .ai/verification/admin-google-oauth-member-invitations.md
    - .ai/learning/admin-google-oauth-member-invitations.md
    - .ai/release/home-family-fund-local-dev-readiness.md
  commits_or_prs:
    - b360e58 Record member invitation verification and release readiness
    - 26b05a6 Clean up residual prototype route before verification
    - 5cba6ac Update member invitation implementation notes
reviewed_at: 2026-06-20
---

# Artifact Compression for Admin Google OAuth And Member Invitations

## Compression Decision

- scope: completed local_dev feature slice for admin Google OAuth and member invitations.
- reason: Intent, domain impact, prototype, Behavior Spec, technical design, TDD implementation, verification, target-aware release, and learning loop are complete for `local_dev`.
- decision: compress
- next_lifecycle_entry: next Intent Intake, production release intake, or optional explicit `artifact-prune`.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Admins can sign in with real Google OAuth locally, invite household members, and allow invited Google accounts to join the household app while automated E2E remains independent of real OAuth credentials.
- final_behavior_or_spec:
  - `/login` is the general Google sign-in surface for existing members.
  - `/invite/accept?token=...` is the invitation acceptance surface; missing or invalid tokens block sign-in.
  - `/members` is admin-only and contains invite-link creation plus app-owned display-name editing.
  - Admins generate account-agnostic invitation links. Links are one-time reveal links in the modal, auto-copied, valid for 7 days, and do not create visible pending member rows before acceptance.
  - Invitation acceptance creates an active `general_member` only after a valid pending token plus Google OAuth session.
  - The accepted member stores Google email, Google subject, Google display-name default, and Google avatar default.
  - Existing active Google email or Google subject cannot accept another invitation.
  - Admins can update app-owned display names; avatars remain Google-sourced and read-only.
  - Sidebar logout posts to `/auth/logout` and returns to `/login`.
- domain_rules:
  - Identity and Access owns Google sign-in, logout, member invitation, invitation acceptance, app access, display-name update, and authorization.
  - Google identity proves identity; app-owned membership decides household access.
  - App-owned display name is mutable by admins; avatar is not admin-editable in this slice.
  - Invited-member lifecycle is accepted-token plus Google session -> active `general_member` for local_dev MVP.
- foundation_decisions:
  - Existing Next.js App Router, Better Auth, Prisma/PostgreSQL, Vitest, Playwright, and shadcn-style UI foundation was reused.
  - No project foundation migration was required.
  - Completed prototype route residue under `src/app/prototypes/` was removed before verification.
- technical_decisions:
  - Shared `AuthenticatedLayout`, sidebar navigation, and `PageLayout` replaced the previous dashboard/record-create-centered layout coupling.
  - Protected pages moved under `(app)` and admin-only pages under `(app)/(admin)` so route access is centralized.
  - `src/auth/app-access.ts` centralizes app/admin/server-action access checks.
  - `MemberInvitation` persistence uses token hash plus local/dev `previewToken` for one-time reveal behavior.
  - Server actions use shared `ActionState` instead of URL feedback for member, category, reimbursement, and recurring flows touched by this slice.
  - Local seed data and E2E seed data are separated; E2E uses controlled-auth fixtures.
- release_target_and_result:
  - `local_dev` readiness passed.
  - `corepack pnpm test` passed: 30 files / 137 tests.
  - `corepack pnpm type-check`, `corepack pnpm lint`, and `corepack pnpm build` passed.
  - `pnpm test:e2e` passed: 31 DB-backed browser tests.
  - User-reported real Google OAuth manual smoke passed on 2026-06-20.
  - Production readiness is not ready.
- accepted_risks:
  - `MemberInvitation.previewToken` is a local_dev compromise only; production needs a secure delivery/retrieval policy.
  - Real email delivery, disable/reactivate lifecycle, self-service profile editing, admin-selected invite roles, and production monitoring/rollback are out of scope.
  - Controlled-auth E2E remains non-production only.
  - Record-create feedback still uses URL state and should be split in a later slice before converting to `useActionState`.
- learning_outcomes:
  - Local_dev learning uses manual review notes and smoke checks, not analytics tooling.
  - Follow-up should route through Intent Intake if admins need resend/revoke, visible pending invites, email delivery, role selection, disable/reactivate, or self-service profile editing.
  - Production release requires a separate intent/readiness path for hosting, production OAuth redirects, secrets, token policy, monitoring/logging, rollback, backups, and production smoke.
- commits_or_prs:
  - b360e58 Record member invitation verification and release readiness.
  - 26b05a6 Clean up residual prototype route before verification.
  - 5cba6ac Update member invitation implementation notes.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/domain/home-family-fund.md` | maintained | Durable domain language and policies remain source of truth. | keep | This archive links to it. |
| `.ai/release/home-family-fund-local-dev-readiness.md` | maintained | Current local_dev release readiness spans multiple completed slices. | keep | Updated with this slice. |
| `.ai/project-context.md` | maintained | Project-level assumptions and next-step routing. | keep | Updated after compression. |
| `.ai/workflow.md` | maintained | Workflow inventory and current state. | keep | Updated after compression. |
| `.ai/intent/admin-google-oauth-member-invitations.md` | prune_candidate | Completed change intent is summarized here. | mark_prune_candidate | This archive. |
| `.ai/domain-impact/admin-google-oauth-member-invitations.md` | prune_candidate | Change-level domain delta is summarized here; durable rules live in domain artifact. | mark_prune_candidate | This archive and `.ai/domain/home-family-fund.md`. |
| `.ai/prototype/admin-google-oauth-member-invitations.md` | prune_candidate | Prototype decisions and gaps are closed/summarized. | mark_prune_candidate | This archive. |
| `.ai/spec/admin-google-oauth-member-invitations.md` | prune_candidate | Behavior outcomes are implemented, verified, and summarized; early email/re-copy drift is captured. | mark_prune_candidate | This archive and verification artifact. |
| `.ai/technical-design/admin-google-oauth-member-invitations.md` | prune_candidate | Feature design decisions are implemented and summarized. | mark_prune_candidate | This archive. |
| `.ai/implementation/admin-google-oauth-member-invitations.md` | prune_candidate | Implementation evidence is summarized here and in commit history. | mark_prune_candidate | This archive and commits. |
| `.ai/verification/admin-google-oauth-member-invitations.md` | prune_candidate | Verification passed for local_dev and is summarized here. | mark_prune_candidate | This archive and release readiness. |
| `.ai/learning/admin-google-oauth-member-invitations.md` | prune_candidate | Learning signals are summarized here. | mark_prune_candidate | This archive. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/admin-google-oauth-member-invitations.md`
- `.ai/domain-impact/admin-google-oauth-member-invitations.md`
- `.ai/prototype/admin-google-oauth-member-invitations.md`
- `.ai/spec/admin-google-oauth-member-invitations.md`
- `.ai/technical-design/admin-google-oauth-member-invitations.md`
- `.ai/implementation/admin-google-oauth-member-invitations.md`
- `.ai/verification/admin-google-oauth-member-invitations.md`
- `.ai/learning/admin-google-oauth-member-invitations.md`

## Workflow Updates

- active_lifecycle_stage: completed slice; no active change after compression.
- artifact_inventory_changes:
  - Added this archive summary as the compact record for admin Google OAuth and member invitations.
  - Marked completed intermediate artifacts as prune candidates.
  - Preserved `.ai/domain/home-family-fund.md`, `.ai/release/home-family-fund-local-dev-readiness.md`, `.ai/workflow.md`, and `.ai/project-context.md`.
- archive_notes:
  - Use this archive first for future context on admin Google OAuth and member invitations.
  - Use git history for full intermediate details if prune is later requested.

## Risks

- traceability_risks:
  - Low if this archive, maintained domain artifact, release readiness, and git history are kept.
- audit_or_compliance_risks:
  - No production incident, compliance audit, or legal context identified for this local_dev slice.
- unresolved_work:
  - Production readiness remains not ready and should be handled by a separate target-aware production release intent.
  - Future product work should use Intent Intake for resend/revoke, email delivery, role selection, self-service profiles, disable/reactivate, or production monitoring.

## Review Gate

- decision: approve
- reviewer_focus:
  - Traceability preserved from intent through learning.
  - Active work is not compressed.
  - Release and learning outcomes are retained.
  - Prune candidates are safe to consider later.
- must_check:
  - Summary is enough for future context.
  - Maintained artifacts remain clear.
  - Next lifecycle entry is clear.
- acceptance_signals:
  - `.ai` has a clear completed-work summary.
  - Future work can resume from maintained files and archive summary.
- unresolved_blockers:
  - None.
- next_step:
  - Optional explicit `artifact-prune`, production release intent, or next Intent Intake.
