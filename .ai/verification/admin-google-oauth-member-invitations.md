---
id: verification-admin-google-oauth-member-invitations
stage: verification
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
  - .ai/technical-design/admin-google-oauth-member-invitations.md
  - .ai/implementation/admin-google-oauth-member-invitations.md
outputs:
  - automated_verification_evidence
  - bdd_e2e_trace
  - code_review_findings
  - release_target_assessment
trace_links:
  implementation: .ai/implementation/admin-google-oauth-member-invitations.md
  spec: .ai/spec/admin-google-oauth-member-invitations.md
  technical_design: .ai/technical-design/admin-google-oauth-member-invitations.md
reviewed_at: 2026-06-20
---

# Admin Google OAuth And Member Invitations Verification

## Decision

- gate: Verification
- decision: pass
- release_target_supported: local_dev
- production_readiness: not_ready
- next_gate: Target-Aware Release
- next_skill: target-aware-release

## Verification Scope

- `/login` general Google sign-in surface.
- `/invite/accept?token=...` invitation accept surface and token validation state.
- `/auth/google` invitation-context preservation.
- `/invite/accept/callback` invited Google account activation path.
- Admin-only `/members` page, invitation-link creation, display-name edit, avatar read-only display, and non-admin redirect.
- Shared authenticated layout and page layout extraction.
- Member invitation persistence, token hashing, expiry, accepted state, duplicate active-account protection, and general-member default role on acceptance.
- Regression coverage for category management, record creation, reimbursement, recurring reminder confirmation, auth-session gates, and permission matrix.
- Residual prototype route cleanup: no completed `/prototypes/recurring-reminder-confirmation` route remains in the production route tree.

## Automated Verification Evidence

| Check | Command | Result |
|---|---|---|
| Unit/domain/component suite | `corepack pnpm test` | pass, 30 files / 137 tests |
| TypeScript | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass |
| Production build | `corepack pnpm build` | pass; route list contains no `/prototypes/...` route |
| Full browser E2E | `pnpm test:e2e` | pass, 31 tests |

## BDD / E2E Trace

| Behavior Area | Evidence | Status |
|---|---|---|
| General login separate from invitation acceptance | `e2e/admin-member-invitations.spec.ts` checks `/login` copy and Google button without invite copy. | pass |
| Invitation accept page and missing-token state | `e2e/admin-member-invitations.spec.ts` checks `/invite/accept?token=seed-invite-token` and missing token disabled state. | pass |
| Admin member management layout | E2E checks `/members`, invite action, logout button, no record-create actions, no Google metadata line, and 3-column desktop layout. | pass |
| Admin invitation link creation | E2E creates an expiring invitation link, verifies auto-copy, verifies no pending member row or re-copy/revoke controls. | pass |
| Display-name edit persistence | E2E updates Admin display name and verifies persistence after reload. | pass |
| Non-admin member management denial | E2E verifies general member is redirected to `/` and cannot see invite/edit controls. | pass |
| Current-member and blocked-account gates | `e2e/auth-session.spec.ts` covers unauthenticated, active linked, unlinked, and inactive controlled-auth states. | pass |
| Invitation domain and persistence rules | Unit tests cover invitation creation, token states, acceptance, duplicate active account rejection, and command persistence. | pass |
| Google profile defaults and avatar sync | Auth/current-member tests cover session identity name/image mapping and current-member profile sync. | pass |
| Logout route | Implemented in `/auth/logout`; covered by visible sidebar logout in E2E and passed real-Google manual smoke. | pass |
| Real Google OAuth admin sign-in and invitation accept | User-reported manual smoke passed on 2026-06-20 after local DB deploy/seed and dev server prep. | pass |

## Code Review Findings

- No blocking automated findings found for local_dev automated verification.
- The implementation intentionally drifted from the early Behavior Spec and Technical Design wording that described email-entry invites and re-copying invited rows. The shipped local_dev behavior is account-agnostic one-time reveal links: admins create a link without entering a Google email, pending invites do not create visible member rows, and pending links are not re-copyable from the member list. This drift is explicitly recorded in the implementation artifact and covered by current E2E.
- The callback creates the member only after accepting a valid pending token and receiving a Google account, assigns `general_member`, stores Google email/subject/name/avatar defaults, and marks the invitation accepted.
- Existing active Google email or subject is rejected before accepting a new invitation, preserving single active membership per Google account.
- `MemberInvitation.previewToken` remains a local/dev compromise for one-time reveal UI and must not be treated as production-ready token delivery.
- No completed production-stack prototype route remains under `src/app/prototypes`; the previous residual recurring reminder prototype route was removed before verification.

## Prototype Gap Closure

- Prototype-only member management local state was replaced with server actions and database-backed member/invitation commands.
- Prototype-only logout link was replaced by `/auth/logout`.
- Prototype-only invitation accept UI now validates real invitation tokens before enabling Google sign-in.
- Prototype-only member routes were not kept as standalone prototype pages; `/members`, `/login`, and `/invite/accept` are production routes.
- Real Google OAuth callback behavior is implemented and passed user-reported manual local smoke; automated suite intentionally remains controlled-auth without Google credentials.

## Domain And Technical Alignment

- Identity and Access owns invitation creation, token validation, invitation acceptance, display-name update, and app-access authorization.
- App-owned display name is mutable by admins only; avatar is Google-sourced and read-only in the admin UI.
- Admin-only `/members` route access is centralized through `(app)/(admin)` routing and server-side access guards.
- Server actions enforce `manage_members` access before mutation.
- The implementation supports the local_dev release target only. Production release still requires a token-delivery decision, secret management, OAuth redirect setup, monitoring/logging, rollback, and production smoke checks.

## Manual Smoke

Manual real-Google smoke passed by user report on 2026-06-20:

1. Seed local DB with the configured admin Google account.
2. Start local dev at `BETTER_AUTH_URL`, normally `http://localhost:3000`.
3. Sign in at `/login` with the seeded admin Google account and confirm dashboard access.
4. Open `/members`, generate an invitation link, and copy it.
5. In a clean browser profile or after logout, open the invitation link and complete Google sign-in with a different Google account.
6. Confirm redirect to `/`, new member access, default `general_member` role, Google display-name/avatar initialization, and invitation status accepted.
7. Try signing in with a Google account that is already an active member and confirm duplicate-account acceptance is blocked.
8. Use sidebar logout and confirm return to `/login`.

### Local Smoke Prep

- `corepack pnpm db:deploy` passed on 2026-06-20 for local `home_fund`; no pending migrations.
- `corepack pnpm db:seed` passed on 2026-06-20 using `.env.local`.
- Dev server started on `http://localhost:3000`, matching the expected local OAuth base URL.
- `.env.local` contains required DB/OAuth/seed variables; values were checked without printing secrets.

## Accepted Risks / Open Items

- `MemberInvitation.previewToken` is acceptable only for local_dev one-time reveal behavior; production must use delivery-only or another secure token retrieval policy.
- Real email delivery is out of scope.
- Disable/reactivate member lifecycle is out of scope.
- Self-service profile editing is out of scope.
- Record-create feedback still uses URL state because route query also controls the create-record modal; convert in a later slice.
- Production OAuth/invitation smoke is not covered; this verification supports local_dev only.

## Review Gate

- decision: pass
- must_check:
  - Automated verification evidence passes.
  - Manual real-Google smoke passed or is explicitly accepted as skipped risk for local_dev.
  - Release artifact distinguishes automated controlled-auth coverage from real OAuth smoke status.
- unresolved_blockers:
  - None for local_dev Target-Aware Release.
- next_step:
  - Target-Aware Release for `admin-google-oauth-member-invitations`.
