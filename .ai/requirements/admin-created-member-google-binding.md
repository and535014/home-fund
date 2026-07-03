# Admin-Created Member Google Binding

- status: done
- date: 2026-06-23
- source: .ai/archive/archive-admin-created-member-google-binding-2026-06-23.md

## 需求

Replace account-agnostic invitations with an admin-created membership model. Admins create a member record first, then generate a member-specific Google binding link for the actual user.

## 執行方式

Existing Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Better Auth, Vitest, Playwright, Tailwind, and shadcn-style UI foundation was reused.

Reuse `Member.status = invited` for unbound members and render `未綁定`. Use `/members/bind?token=...` for new links while leaving legacy `/invite/accept` compatibility code. Reuse `MemberInvitation` with member-specific behavior, encrypted token re-copy fields, `tokenHash` validation, and a partial unique index for one pending invitation per member. Binding acceptance runs member activation and invitation acceptance in one Prisma transaction.

## 最終結果

`/settings/members` supports admin-created members, role selection, app-owned display names, unbound/waiting/expired/bound/disabled statuses, active-link re-copy, expired-link regeneration, and non-admin access denial. `/members/bind` validates missing, invalid, expired, used, and valid token states without exposing household data. `/members/bind/callback` binds Google identity to the pre-created member.

`local_dev` is ready for user review. Passing local_dev readiness does not imply preview, staging, or production readiness.

## 特殊決策

Membership is admin-owned before Google binding. Binding links are member-specific. App-owned display name and role remain authoritative. A Google identity can bind to exactly one active member. Invalid, expired, used, disabled-target, already-bound-target, and already-linked-account paths do not grant access.

Local learning should watch whether admins understand `未綁定` / `待綁定` / `已失效`, whether re-copy and expired-link regeneration match expectations, whether `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY` setup is clear, and whether real OAuth smoke reveals wrong-account or callback UX gaps.

## Bug / 阻礙

Automated OAuth binding uses controlled-auth coverage, not real Google OAuth end-to-end. `MemberInvitation.memberId` remains nullable for legacy compatibility. Production needs separate assessment for secret storage, OAuth callbacks, migration rollback, monitoring, audit logging, abuse prevention, and real OAuth smoke.
