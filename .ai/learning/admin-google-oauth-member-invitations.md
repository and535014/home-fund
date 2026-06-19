---
id: learning-admin-google-oauth-member-invitations
stage: learning
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-google-oauth-member-invitations.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-google-oauth-member-invitations.md
  - .ai/prototype/admin-google-oauth-member-invitations.md
  - .ai/spec/admin-google-oauth-member-invitations.md
  - .ai/implementation/admin-google-oauth-member-invitations.md
  - .ai/verification/admin-google-oauth-member-invitations.md
  - .ai/release/home-family-fund-local-dev-readiness.md
outputs:
  - learning_questions
  - local_dev_review_signals
  - follow_up_decision_criteria
trace_links:
  release: .ai/release/home-family-fund-local-dev-readiness.md
  verification: .ai/verification/admin-google-oauth-member-invitations.md
reviewed_at: 2026-06-20
---

# Admin Google OAuth And Member Invitations Learning Loop

## Decision

- gate: Learning Loop
- decision: complete
- release_target: local_dev
- tracking_maturity: manual_local_dev
- production_analytics: not_configured
- next_gate: Artifact Compression
- next_skill: artifact-compression

## Learning Questions

| Question | Linked Outcome | Signal |
|---|---|---|
| Can the seeded admin reliably sign in with real Google OAuth and reach household pages? | Admin Google OAuth local_dev access. | Manual smoke after DB reset/seed; `/login` -> Google -> dashboard succeeds. |
| Can an admin invite another real Google account without operational confusion? | Admin-owned invitation workflow. | Manual review of `/members`: create link, auto-copy, understand 7-day validity, share link. |
| Does invited-member activation produce the expected domain state? | Valid invite token plus Google account creates an active `general_member`. | Manual smoke and optional Prisma Studio check: accepted invitation has member, new member is active with Google email/subject/avatar defaults. |
| Are wrong-account and duplicate-account risks visible early enough? | Existing active Google account cannot accept a second invite; unlinked accounts stay blocked. | Manual duplicate-account check plus controlled-auth E2E for unlinked/inactive users. |
| Does logout support account switching during review? | User can end session and select another Google account. | Manual sidebar logout smoke; returns to `/login`. |
| Does the local release baseline stay operable after auth/member changes? | Existing dashboard, records, category, reimbursement, recurring flows keep working. | `pnpm test:e2e`, `corepack pnpm test`, `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm build`. |
| Are production blockers clear before anyone treats local_dev readiness as deploy readiness? | Production readiness remains not ready. | Release artifact keeps production gaps: OAuth redirect, secrets, token delivery, abuse prevention, monitoring, rollback, production smoke. |

## Local Dev Signals

- Manual smoke path:
  - Reset or seed local DB with `corepack pnpm db:deploy` and `corepack pnpm db:seed`.
  - Start `corepack pnpm dev` on `http://localhost:3000`.
  - Open `/login`, sign in with the configured seed admin Google account, and confirm dashboard access.
  - Open `/members`, create an invitation link, confirm the generated-link dialog and auto-copy feedback.
  - In a clean browser profile or after logout, open the invitation link with a different Google account and confirm dashboard access.
  - Confirm the new member is `general_member`, has Google-derived profile defaults, and does not appear before invite acceptance.
  - Confirm sidebar logout returns to `/login`.
- Automated guardrails:
  - `pnpm test:e2e`
  - `pnpm test:e2e e2e/admin-member-invitations.spec.ts`
  - `corepack pnpm test`
  - `corepack pnpm type-check`
  - `corepack pnpm lint`
  - `corepack pnpm build`
- Feedback channel for local_dev:
  - Developer/user review notes in this Codex workflow thread or a follow-up Intent Intake artifact.
  - No product analytics, error monitoring, logging provider, or production feedback channel is configured for this local_dev slice.

## Guardrails And Risks

- Do not treat local_dev invitation behavior as production-ready. `MemberInvitation.previewToken` is a local one-time reveal compromise and needs a production token-delivery policy.
- Controlled-auth E2E verifies app behavior without Google credentials; real OAuth still needs manual smoke until production-grade OAuth test infrastructure exists.
- Invitation links are account-agnostic for MVP local_dev. Production should revisit rate limits, revocation, resend, expiry messaging, audit logging, and abuse prevention.
- Self-service profile editing, disable/reactivate member lifecycle, real email delivery, and admin-selected invite roles remain out of scope.
- If manual local review finds confusing account switching, copied-link handling, or duplicate-account behavior, route the follow-up through Intent Intake instead of expanding this closed slice.

## Follow-Up Decision Criteria

- Create a new Intent Intake item if admins cannot complete sign-in, invite creation, or logout/account switching without manual DB intervention.
- Create a new Intent Intake item if invited members are created with the wrong role, missing profile defaults, duplicate account linkage, or unclear blocked-account behavior.
- Create a new Intent Intake item if household users need invitation resend/revoke, visible pending invites, email delivery, role selection, disable/reactivate, or self-service profile editing.
- Create a production release intent before selecting hosting, production database, OAuth redirect URIs, token delivery, monitoring/logging, rollback, backups, and production smoke checks.
- Do not add analytics tooling solely for this local_dev slice. Revisit analytics and error monitoring when a preview/staging/production target is selected.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm manual local_dev signals are enough for this target.
  - Confirm production analytics and monitoring are intentionally not configured.
  - Confirm production invitation/OAuth risks are visible and not silently accepted.
- must_check:
  - Signals link to intent, domain events, BDD outcomes, verification, or release risks.
  - Follow-up criteria route new work back to Intent Intake.
  - Artifact Compression is the next lifecycle gate.
- unresolved_blockers:
  - None for Artifact Compression.
- next_step:
  - artifact-compression
