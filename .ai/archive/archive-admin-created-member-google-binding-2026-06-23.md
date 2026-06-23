---
id: archive-admin-created-member-google-binding-2026-06-23
stage: artifact-compression
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/admin-created-member-google-binding.md
  - .ai/domain-impact/admin-created-member-google-binding.md
  - .ai/prototype/admin-created-member-google-binding.md
  - .ai/spec/admin-created-member-google-binding.md
  - .ai/technical-design/admin-created-member-google-binding.md
  - .ai/implementation/admin-created-member-google-binding.md
  - .ai/verification/admin-created-member-google-binding.md
  - .ai/release/admin-created-member-google-binding-local-dev-readiness.md
  - .ai/learning/admin-created-member-google-binding.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/admin-created-member-google-binding.md
    - .ai/domain-impact/admin-created-member-google-binding.md
    - .ai/prototype/admin-created-member-google-binding.md
    - .ai/spec/admin-created-member-google-binding.md
    - .ai/technical-design/admin-created-member-google-binding.md
    - .ai/implementation/admin-created-member-google-binding.md
    - .ai/verification/admin-created-member-google-binding.md
    - .ai/release/admin-created-member-google-binding-local-dev-readiness.md
    - .ai/learning/admin-created-member-google-binding.md
  commits_or_prs:
    - 63f41b3 Record member binding domain discovery
    - b97b4d2 Prototype admin-created member binding
    - da9e630 Define member binding behavior spec
    - 084c2fd Design member binding implementation
    - 8a5c639 Implement admin-created member binding
reviewed_at: 2026-06-23
---

# Artifact Compression for Admin-Created Member Google Binding

## Compression Decision

- scope: completed feature lifecycle for `admin-created-member-google-binding`
- reason: Learning Loop is approved, local_dev release readiness is complete, and future work should start from this compact summary plus maintained project/domain artifacts.
- decision: compress
- next_lifecycle_entry: Optional `artifact-prune`, stricter-target release readiness, or next Intent Intake.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Replace account-agnostic invitations with an admin-created membership model. Admins create a member record first, then generate a member-specific Google binding link for the actual user.
- final_behavior_or_spec: `/settings/members` supports admin-created members, role selection, app-owned display names, unbound/waiting/expired/bound/disabled statuses, active-link re-copy, expired-link regeneration, and non-admin access denial. `/members/bind` validates missing, invalid, expired, used, and valid token states without exposing household data. `/members/bind/callback` binds Google identity to the pre-created member.
- domain_rules: Membership is admin-owned before Google binding. Binding links are member-specific. App-owned display name and role remain authoritative. A Google identity can bind to exactly one active member. Invalid, expired, used, disabled-target, already-bound-target, and already-linked-account paths do not grant access.
- foundation_decisions: Existing Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Better Auth, Vitest, Playwright, Tailwind, and shadcn-style UI foundation was reused.
- technical_decisions: Reuse `Member.status = invited` for unbound members and render `未綁定`. Use `/members/bind?token=...` for new links while leaving legacy `/invite/accept` compatibility code. Reuse `MemberInvitation` with member-specific behavior, encrypted token re-copy fields, `tokenHash` validation, and a partial unique index for one pending invitation per member. Binding acceptance runs member activation and invitation acceptance in one Prisma transaction.
- release_target_and_result: `local_dev` is ready for user review. Passing local_dev readiness does not imply preview, staging, or production readiness.
- accepted_risks: Automated OAuth binding uses controlled-auth coverage, not real Google OAuth end-to-end. `MemberInvitation.memberId` remains nullable for legacy compatibility. Production needs separate assessment for secret storage, OAuth callbacks, migration rollback, monitoring, audit logging, abuse prevention, and real OAuth smoke.
- learning_outcomes: Local learning should watch whether admins understand `未綁定` / `待綁定` / `已失效`, whether re-copy and expired-link regeneration match expectations, whether `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY` setup is clear, and whether real OAuth smoke reveals wrong-account or callback UX gaps.
- commits_or_prs: `63f41b3`, `b97b4d2`, `da9e630`, `084c2fd`, `8a5c639`; later verification/release/learning/compression artifact changes were pending at compression time.

## Verification And Release Evidence

- `corepack pnpm test` passed: 35 files, 173 tests.
- `corepack pnpm type-check` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm build` passed and route list included `/settings/members`, `/members/bind`, and `/members/bind/callback`.
- `corepack pnpm test:e2e e2e/admin-member-invitations.spec.ts` passed: 7 tests.
- `corepack pnpm test:e2e` passed: 44 tests.
- E2E setup applied migration `20260623093000_encrypt_member_binding_tokens`.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level source of truth. | keep | Read with `.ai/workflow.md` for future work. |
| `.ai/workflow.md` | maintained | Current lifecycle inventory and next-entry source. | keep | Updated by this compression. |
| `.ai/domain/home-family-fund.md` | maintained | Durable domain model. | keep | Domain-impact decisions are summarized here. |
| `.ai/intent/admin-created-member-google-binding.md` | prune_candidate | Completed intent is summarized. | mark_prune_candidate | This archive. |
| `.ai/domain-impact/admin-created-member-google-binding.md` | prune_candidate | Change-level domain impact is summarized. | mark_prune_candidate | This archive plus maintained domain artifact. |
| `.ai/prototype/admin-created-member-google-binding.md` | prune_candidate | Prototype gaps were closed by implementation and summarized. | mark_prune_candidate | This archive. |
| `.ai/spec/admin-created-member-google-binding.md` | prune_candidate | Final behavior and BDD outcomes are summarized. | mark_prune_candidate | This archive. |
| `.ai/technical-design/admin-created-member-google-binding.md` | prune_candidate | Technical decisions are summarized. | mark_prune_candidate | This archive. |
| `.ai/implementation/admin-created-member-google-binding.md` | prune_candidate | Implementation evidence is summarized. | mark_prune_candidate | This archive and git commits. |
| `.ai/verification/admin-created-member-google-binding.md` | prune_candidate | Verification evidence is summarized. | mark_prune_candidate | This archive. |
| `.ai/release/admin-created-member-google-binding-local-dev-readiness.md` | prune_candidate | local_dev release decision is summarized. | mark_prune_candidate | This archive. |
| `.ai/learning/admin-created-member-google-binding.md` | prune_candidate | Learning questions and signals are summarized. | mark_prune_candidate | This archive. |
| `.ai/archive/archive-admin-created-member-google-binding-2026-06-23.md` | maintained | Long-term compressed record. | keep | Primary future trace for this completed slice. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/admin-created-member-google-binding.md`
- `.ai/domain-impact/admin-created-member-google-binding.md`
- `.ai/prototype/admin-created-member-google-binding.md`
- `.ai/spec/admin-created-member-google-binding.md`
- `.ai/technical-design/admin-created-member-google-binding.md`
- `.ai/implementation/admin-created-member-google-binding.md`
- `.ai/verification/admin-created-member-google-binding.md`
- `.ai/release/admin-created-member-google-binding-local-dev-readiness.md`
- `.ai/learning/admin-created-member-google-binding.md`

## Workflow Updates

- active_lifecycle_stage: completed and compressed
- artifact_inventory_changes: workflow now lists this archive as the completed summary for intent, domain-impact, prototype, spec, technical design, implementation, verification, release, and learning evidence for `admin-created-member-google-binding`.
- archive_notes: This archive is the durable entry point for future work on admin-created member Google binding. The maintained domain and project/workflow artifacts remain active sources of truth.

## Risks

- traceability_risks: Low if this archive and git commits are kept; medium if source artifacts are pruned before reviewers accept this summary.
- audit_or_compliance_risks: No formal compliance requirement identified for local_dev. Production release must retain or recreate migration rollback, secret storage, monitoring, and real OAuth smoke evidence.
- unresolved_work: Production/preview readiness, real OAuth smoke, revoke/delete unbound member policy, analytics/error monitoring provider selection, and abuse prevention remain future work.

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
  - None for compression.
- next_step:
  - Stop. If file cleanup is desired, explicitly request `artifact-prune`; otherwise start the next Intent Intake or stricter-target release readiness when needed.
