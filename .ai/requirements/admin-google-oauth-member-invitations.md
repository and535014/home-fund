# Admin Google OAuth And Member Invitations

- status: done
- date: 2026-06-20
- source: .ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md

## 需求

Admins can sign in with real Google OAuth locally, invite household members, and allow invited Google accounts to join the household app while automated E2E remains independent of real OAuth credentials.

## 執行方式

- Existing Next.js App Router, Better Auth, Prisma/PostgreSQL, Vitest, Playwright, and shadcn-style UI foundation was reused.
  - No project foundation migration was required.
  - Completed prototype route residue under `src/app/prototypes/` was removed before verification.

- Shared `AuthenticatedLayout`, sidebar navigation, and `PageLayout` replaced the previous dashboard/record-create-centered layout coupling.
  - Protected pages moved under `(app)` and admin-only pages under `(app)/(admin)` so route access is centralized.
  - `src/auth/app-access.ts` centralizes app/admin/server-action access checks.
  - `MemberInvitation` persistence uses token hash plus local/dev `previewToken` for one-time reveal behavior.
  - Server actions use shared `ActionState` instead of URL feedback for member, category, reimbursement, and recurring flows touched by this slice.
  - Local seed data and E2E seed data are separated; E2E uses controlled-auth fixtures.

## 最終結果

- `/login` is the general Google sign-in surface for existing members.
  - `/invite/accept?token=...` is the invitation acceptance surface; missing or invalid tokens block sign-in.
  - `/members` is admin-only and contains invite-link creation plus app-owned display-name editing.
  - Admins generate account-agnostic invitation links. Links are one-time reveal links in the modal, auto-copied, valid for 7 days, and do not create visible pending member rows before acceptance.
  - Invitation acceptance creates an active `general_member` only after a valid pending token plus Google OAuth session.
  - The accepted member stores Google email, Google subject, Google display-name default, and Google avatar default.
  - Existing active Google email or Google subject cannot accept another invitation.
  - Admins can update app-owned display names; avatars remain Google-sourced and read-only.
  - Sidebar logout posts to `/auth/logout` and returns to `/login`.

- `local_dev` readiness passed.
  - `corepack pnpm test` passed: 30 files / 137 tests.
  - `corepack pnpm type-check`, `corepack pnpm lint`, and `corepack pnpm build` passed.
  - `pnpm test:e2e` passed: 31 DB-backed browser tests.
  - User-reported real Google OAuth manual smoke passed on 2026-06-20.
  - Production readiness is not ready.

## 特殊決策

- Identity and Access owns Google sign-in, logout, member invitation, invitation acceptance, app access, display-name update, and authorization.
  - Google identity proves identity; app-owned membership decides household access.
  - App-owned display name is mutable by admins; avatar is not admin-editable in this slice.
  - Invited-member lifecycle is accepted-token plus Google session -> active `general_member` for local_dev MVP.

- Local_dev learning uses manual review notes and smoke checks, not analytics tooling.
  - Follow-up should route through Intent Intake if admins need resend/revoke, visible pending invites, email delivery, role selection, disable/reactivate, or self-service profile editing.
  - Production release requires a separate intent/readiness path for hosting, production OAuth redirects, secrets, token policy, monitoring/logging, rollback, backups, and production smoke.

## Bug / 阻礙

- `MemberInvitation.previewToken` is a local_dev compromise only; production needs a secure delivery/retrieval policy.
  - Real email delivery, disable/reactivate lifecycle, self-service profile editing, admin-selected invite roles, and production monitoring/rollback are out of scope.
  - Controlled-auth E2E remains non-production only.
  - Record-create feedback still uses URL state and should be split in a later slice before converting to `useActionState`.
