---
id: release-home-family-fund-local-dev-readiness
stage: release
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - ver-recurring-reminder-confirmation-ui
  - ver-home-family-fund-reimbursement-settlement-ui
  - .ai/verification/admin-only-category-management.md
  - .ai/verification/admin-google-oauth-member-invitations.md
  - .ai/workflow.md
outputs:
  - local_dev_release_assessment
  - release_checks
  - accepted_risks
  - production_gap_list
trace_links:
  verification:
    - .ai/verification/recurring-reminder-confirmation-ui.md
    - .ai/verification/home-family-fund-reimbursement-settlement-ui.md
    - .ai/verification/admin-only-category-management.md
    - .ai/verification/admin-google-oauth-member-invitations.md
  current_code:
    - package.json
    - playwright.config.ts
    - README.md
reviewed_at: 2026-06-20
---

# Local Dev Release Readiness for Home Family Fund

## Decision
- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_ready
- rationale: The current app has passing build, unit, type, lint, DB-backed browser E2E coverage, and user-reported real Google OAuth smoke for the completed MVP hardening flows, admin-only category management, and admin Google OAuth member invitations. It is suitable for local development review with Docker PostgreSQL, configured local Google OAuth, and controlled E2E auth. It is not yet assessed for a hosted production environment.

## Included Local Dev Capabilities
| Capability | Status | Evidence |
|---|---|---|
| Google sign-in entry and current-member access gate | ready for local_dev | Existing auth/session implementation and controlled-auth E2E. |
| Dashboard read model and monthly totals | ready for local_dev | DB-backed dashboard E2E and recurring confirmation verification. |
| Ledger record creation | ready for local_dev | Browser create-record flow and unit coverage. |
| Permission matrix checks | ready for local_dev | DB-backed permission E2E. |
| Admin-only category management | ready for local_dev | `.ai/verification/admin-only-category-management.md`; `pnpm test:e2e` covers admin category browse/create/archive and non-admin sidebar/direct-route denial. |
| Admin Google OAuth and member invitations | ready for local_dev | `.ai/verification/admin-google-oauth-member-invitations.md`; `pnpm test:e2e` covers controlled-auth invitation routes/member management and user-reported real Google OAuth invitation smoke passed on 2026-06-20. |
| Reimbursement settlement UI | ready for local_dev | Verification report and browser E2E. |
| Recurring reminder confirmation UI | ready for local_dev | `24213cd` and `.ai/verification/recurring-reminder-confirmation-ui.md`. |
| DB-backed E2E foundation | ready for local_dev | `pnpm test:e2e` now runs the DB-backed suite on port `3100`. |

## Release Checks
| Check | Command / Evidence | Status |
|---|---|---|
| Install/runtime scripts present | `package.json` has `dev`, `build`, `lint`, `type-check`, `test`, `test:e2e`, Prisma scripts | pass |
| Local DB setup documented | `README.md` documents Docker PostgreSQL and Prisma setup | pass |
| Unit and domain tests | `corepack pnpm test` | pass in latest verification, 30 files / 137 tests |
| Type checking | `corepack pnpm type-check` | pass in latest verification |
| Lint | `corepack pnpm lint` | pass in latest verification |
| Build | `corepack pnpm build` | pass in latest verification; route list contains no `/prototypes/...` route |
| Targeted category browser E2E | `corepack pnpm test:e2e -- e2e/admin-category-management.spec.ts` | pass in latest verification, 6 tests |
| Browser E2E | `pnpm test:e2e` | pass in latest verification, 31 DB-backed tests |
| Local OAuth smoke | user-run browser smoke | pass by user report on 2026-06-20 for admin Google sign-in, invite link creation, invited-member Google acceptance, dashboard access, and logout. |
| E2E isolation | dedicated `E2E_PORT=3100`, `.next-e2e`, per-test DB reset | pass |

## Admin-Only Category Management Release Notes
- No Prisma migration is required for this slice; it uses existing `Category.status` and existing role/capability schema.
- Local seed data now includes an admin E2E identity for controlled-auth verification.
- `/categories` is dynamic and server-rendered on demand; admins can manage categories, while non-admin direct visits render a denied dashboard state without loading category reference counts or mutation actions.
- New category create, rename, and archive server actions revalidate `/`, `/categories`, and the submitted return path so dashboard forms and category management stay aligned.

## Admin Google OAuth And Member Invitations Release Notes
- `/login` is the general Google sign-in surface for existing members.
- `/invite/accept?token=...` is the invitation acceptance surface; missing/invalid token states block sign-in.
- `/members` is admin-only through the `(app)/(admin)` route group and centralized app-access guards.
- Admins create account-agnostic invitation links; generated links are one-time reveal links in the dialog, automatically copied, expire after 7 days, and do not create visible pending member rows before acceptance.
- Invited users become active members only after a valid pending token plus Google OAuth session. The accepted member gets `general_member`, Google email/subject, Google display-name default, and Google avatar default.
- Existing active Google email or Google subject cannot accept another invitation.
- Admins can update app-owned display names; avatars remain Google-sourced and read-only in this slice.
- Sidebar logout posts to `/auth/logout` and returns to `/login`.
- Local real-Google smoke passed by user report on 2026-06-20 after `db:deploy`, `db:seed`, and local dev server setup.
- Automated browser tests intentionally use controlled-auth fixtures and do not require Google OAuth secrets.

## Accepted Local Dev Risks
- Full DB-backed E2E is slower because it resets the database before each browser test.
- Quality scripts that run `prisma generate` should be run sequentially; parallel runs can race while creating generated Prisma directories.
- Controlled auth headers are intentionally available only outside production and remain part of the local/E2E workflow.
- Local dev review still depends on Docker Desktop and the local PostgreSQL service being available.
- `MemberInvitation.previewToken` is acceptable only for local_dev one-time reveal behavior; production must use delivery-only invites or another secure token retrieval policy.
- Invitation links are account-agnostic in this MVP local_dev slice. Production should revisit abuse prevention, rate limiting, expiry/revocation UX, and audit trails.

## Not Production Ready
Production release is blocked until these are decided and verified:
- Hosting target, database target, and environment separation.
- Production Google OAuth origin and redirect URI.
- `BETTER_AUTH_SECRET`, production `DATABASE_URL`, and secret management.
- Migration/rollback procedure and backup/restore expectation.
- Production smoke test using real OAuth rather than controlled E2E auth.
- Production invitation token delivery/retrieval policy replacing local_dev `previewToken`.
- Production invitation lifecycle decisions: resend, revoke, expiry messaging, rate limiting, audit logging, and abuse prevention.
- Production category-management smoke tests for admin and non-admin users with real OAuth sessions.
- Production member-invitation smoke tests for admin, invited member, duplicate active account, and non-admin access.
- Error monitoring, logging provider, analytics provider, and feedback channel.
- Deployment checklist and post-release tracking plan.

## Handoff
- decision: ready_for_user_local_dev_review
- recommended_next_skill: learning-loop
- next_step: Define or explicitly skip learning signals for this local_dev admin Google OAuth/member invitations slice before artifact compression.
