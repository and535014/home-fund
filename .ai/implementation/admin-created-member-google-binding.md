---
id: implementation-admin-created-member-google-binding
stage: implementation
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/admin-created-member-google-binding.md
  - .ai/technical-design/admin-created-member-google-binding.md
outputs:
  - tdd_implementation_evidence
  - backend_binding_slice
  - persisted_member_management_ui
  - persisted_member_binding_page
trace_links:
  data_model:
    - prisma/schema.prisma
    - prisma/migrations/20260623093000_encrypt_member_binding_tokens/migration.sql
  backend:
    - src/modules/identity-access/member-invitations.ts
    - src/modules/identity-access/member-invitation-command.ts
    - src/app/member-actions.ts
    - src/app/member-management-members.ts
    - src/auth/google-sign-in.ts
    - src/app/auth/google/route.ts
  frontend:
    - src/app/(app)/settings/categories/category-management-panel.tsx
    - src/app/members/bind/page.tsx
    - src/app/members/bind/callback/route.ts
    - src/app/members/bind/member-bind-state.ts
    - src/app/(app)/settings/members/page.tsx
    - src/app/(app)/settings/members/member-list.tsx
    - src/app/(app)/settings/members/member-list-item.tsx
    - src/app/(app)/settings/members/member-binding-dialog.tsx
    - src/app/(app)/settings/members/member-create-dialog.tsx
    - src/app/(app)/settings/members/member-edit-display-name-dialog.tsx
    - src/app/(app)/settings/members/member-ui.ts
  tests:
    - src/app/members/bind/member-bind-state.test.ts
    - src/app/member-management-members.test.ts
    - src/auth/google-sign-in.test.ts
    - src/modules/identity-access/member-invitation-command.test.ts
    - src/modules/identity-access/member-invitations.test.ts
    - src/modules/identity-access/member-management-command.test.ts
    - src/modules/identity-access/member-management.test.ts
    - e2e/admin-member-invitations.spec.ts
  config:
    - README.md
    - .env.example
    - e2e/.env.example
    - playwright.config.ts
    - prisma/seed.e2e.sql
reviewed_at: 2026-06-23
---

# Admin-Created Member Google Binding Implementation

## Decision Summary

- decision: approved
- implementation_scope: backend binding-token slice, persisted `/settings/members` member-management UI, and persisted `/members/bind` token validation
- release_target: local_dev
- next_gate: Verification

## TDD Slice Completed

Implemented the first production-backed behavior slice from the approved spec and technical design:

- Added failing tests first for member-specific binding link generation.
- Replaced memberless invitation generation with member-targeted binding link generation in the identity-access adapter.
- Changed binding links from `/invite/accept?token=...` to `/members/bind?token=...`.
- Enforced active pending link reuse: an unexpired pending link is returned again and no new invitation is created.
- Enforced expired pending link replacement: older pending links for the member are revoked before a replacement is stored.
- Changed acceptance behavior to bind the Google account to the existing invited member instead of creating a new member.
- Preserved admin-owned display name during binding; Google avatar fills only when the target member does not already have an avatar.
- Added encrypted token storage fields and removed plaintext `previewToken` from the current Prisma model.
- Added `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY` configuration points and updated e2e seed data to use encrypted token fields.
- Updated the member invitation server action to call the member-specific binding-link adapter.
- Added a persisted member-management read model that loads invited, active, disabled, waiting-for-binding, and expired-link members.
- Added create-member command/action support for admin-created invited members with selected role.
- Replaced `/settings/members` prototype local state and fake member fixtures with server-loaded members and server actions.
- Wired create-member, edit-display-name, generate/re-copy binding-link, and expired-link regeneration UI to persisted server behavior.
- Removed local `preview-bind-*` link generation and simulated Google binding completion from the member list.
- Split the member-management UI into container, list item, binding dialog, create dialog, edit-display-name dialog, and shared UI helper modules.
- Kept the persisted `roles[]` model, but the member list now presents a single primary role badge because member creation selects one role.
- Replaced `/members/bind` query-state prototype with adapter-backed token validation.
- Added binding-page state mapping for missing, invalid, expired, used, and valid member-specific tokens.
- Added `/members/bind/callback` to bind the Google account through the existing member-binding transaction.
- Centralized binding-token validation for `/members/bind` so stale pending tokens whose target member is already bound, disabled, missing, or outside the invitation household are rejected before Google sign-in.
- Wrapped Google binding acceptance in a Prisma transaction so the target member activation and invitation acceptance are committed together.
- Updated Google sign-in start to preserve `bindToken` through `/members/bind/callback` while keeping legacy `inviteToken` support for the old invite route.
- Added E2E coverage for public binding-link token states, admin link generation/re-copy/regeneration, admin member creation, bound/disabled binding-action visibility, display-name persistence, and non-admin member-management access.
- Adjusted E2E search-pagination fixture dates so search pagination still has 105 June records without hiding the dashboard seed records from dashboard E2E coverage.
- Marked member-management and category-management dialogs without description copy as intentionally undescribed so Radix does not emit `DialogContent` description warnings after removing visible member-list descriptions.
- Documented `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY` in `README.md`, including the `openssl rand -base64 32` generation command and the key-rotation effect on unexpired re-copyable binding links.
- Added a database partial unique index so each member can have at most one pending binding invitation, and handled duplicate-create races by re-reading the concurrently-created pending link.
- Renamed the server action/result surface from invitation wording to binding-link wording.
- Removed unused legacy member invite dialog/link client modules so active member-management code no longer exposes the old memberless invite interaction.
- Converted missing/invalid binding-token encryption configuration into a controlled server-action error instead of an unhandled action exception.

## Files Changed

- `prisma/schema.prisma`
- `prisma/migrations/20260623093000_encrypt_member_binding_tokens/migration.sql`
- `prisma/seed.e2e.sql`
- `.env.example`
- `e2e/.env.example`
- `src/modules/identity-access/member-invitations.ts`
- `src/modules/identity-access/member-invitations.test.ts`
- `src/modules/identity-access/member-invitation-command.ts`
- `src/modules/identity-access/member-invitation-command.test.ts`
- `src/modules/identity-access/member-management.ts`
- `src/modules/identity-access/member-management.test.ts`
- `src/modules/identity-access/member-management-command.ts`
- `src/modules/identity-access/member-management-command.test.ts`
- `src/app/member-actions.ts`
- `src/app/member-management-members.ts`
- `src/app/member-management-members.test.ts`
- `src/app/(app)/settings/members/page.tsx`
- `src/app/(app)/settings/members/member-list.tsx`
- `src/app/(app)/settings/members/member-list-item.tsx`
- `src/app/(app)/settings/members/member-binding-dialog.tsx`
- `src/app/(app)/settings/members/member-create-dialog.tsx`
- `src/app/(app)/settings/members/member-edit-display-name-dialog.tsx`
- `src/app/(app)/settings/members/member-ui.ts`
- `src/app/members/bind/page.tsx`
- `src/app/members/bind/callback/route.ts`
- `src/app/members/bind/member-bind-state.ts`
- `src/app/members/bind/member-bind-state.test.ts`
- `src/auth/google-sign-in.ts`
- `src/auth/google-sign-in.test.ts`
- `src/app/auth/google/route.ts`
- `e2e/admin-member-invitations.spec.ts`
- `playwright.config.ts`
- `README.md`
- `src/app/(app)/settings/categories/category-management-panel.tsx`

## Verification Evidence

- `corepack pnpm vitest run src/modules/identity-access/member-invitation-command.test.ts` passed.
- `corepack pnpm vitest run src/modules/identity-access` passed.
- `corepack pnpm vitest run src/app/member-management-members.test.ts src/modules/identity-access/member-management.test.ts src/modules/identity-access/member-management-command.test.ts src/modules/identity-access/member-invitation-command.test.ts` passed.
- `corepack pnpm vitest run src/app/members/bind/member-bind-state.test.ts src/auth/google-sign-in.test.ts` passed.
- `corepack pnpm test` passed: 35 files, 171 tests.
- `corepack pnpm lint` passed.
- `corepack pnpm type-check` passed.
- `corepack pnpm test:e2e e2e/admin-member-invitations.spec.ts` passed: 7 tests.
- `corepack pnpm test:e2e e2e/auth-session.spec.ts e2e/dashboard.spec.ts e2e/record-search.spec.ts` passed: 21 tests.
- `corepack pnpm test:e2e` passed: 44 tests.
- `corepack pnpm type-check` passed after local dev env and dialog warning fixes.
- `corepack pnpm lint` passed after local dev env and dialog warning fixes.
- `corepack pnpm test:e2e e2e/admin-category-management.spec.ts e2e/admin-member-invitations.spec.ts` passed: 12 tests, with no `DialogContent` description warning observed.
- `corepack pnpm vitest run src/modules/identity-access/member-invitation-command.test.ts src/app/member-management-members.test.ts src/app/members/bind/member-bind-state.test.ts src/auth/google-sign-in.test.ts` passed after clean-code fixes: 4 files, 17 tests.
- `corepack pnpm type-check` passed after clean-code fixes.
- `corepack pnpm lint` passed after clean-code fixes.
- `corepack pnpm test:e2e e2e/admin-member-invitations.spec.ts` passed after adding the pending-link unique index: 7 tests.
- `corepack pnpm test` passed after clean-code fixes: 35 files, 172 tests.
- `corepack pnpm vitest run src/modules/identity-access/member-invitation-command.test.ts src/app/members/bind/member-bind-state.test.ts src/auth/google-sign-in.test.ts` passed after transaction and binding-validator fixes: 3 files, 17 tests.
- `corepack pnpm type-check` passed after transaction and binding-validator fixes.
- `corepack pnpm lint` passed after transaction and binding-validator fixes. One parallel `prisma generate` lint attempt failed with `ENOTEMPTY` while type-check was generating Prisma at the same time; the immediate serial rerun passed.
- `corepack pnpm test:e2e e2e/admin-member-invitations.spec.ts` passed after transaction and binding-validator fixes: 7 tests.
- `corepack pnpm test` passed after transaction and binding-validator fixes: 35 files, 173 tests.

## Remaining Implementation Gaps

- None identified for this TDD Implementation gate.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm the backend token policy matches the approved product decision: re-copy unexpired links, regenerate only after expiry.
  - Confirm encrypted token storage is acceptable for the production-capable re-copy flow.
  - Confirm `/settings/members` no longer depends on prototype fake member state.
  - Confirm `/members/bind` no longer depends on prototype query-state handling.
  - Confirm the E2E coverage captures the intended admin and public binding flows before moving to Verification.
- unresolved_blockers:
  - None for continuing implementation.
- next_step:
  - Commit this TDD Implementation gate and continue to Verification.
