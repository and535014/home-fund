---
id: implementation-admin-google-oauth-member-invitations
stage: implementation
status: in_progress
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
outputs:
  - src/components/layout/authenticated-layout.tsx
  - src/components/layout/authenticated-sidebar-nav.tsx
  - src/components/layout/page-layout.tsx
  - src/auth/app-access.ts
  - src/app/(app)/layout.tsx
  - src/app/(app)/(admin)/layout.tsx
  - src/app/unauthenticated/page.tsx
  - src/app/unauthenticated/logout/route.ts
  - src/app/unauthenticated/unauthenticated-reasons.ts
  - src/app/auth/logout/route.ts
  - src/app/monthly-workspace-context.ts
  - src/app/category-management-context.ts
  - src/app/member-management-context.ts
  - src/app/route-search-params.ts
  - src/app/record-create-actions.tsx
  - src/auth/server-current-member-cache.ts
  - src/app/(app)/page.tsx
  - src/app/(app)/records/page.tsx
  - src/app/(app)/(admin)/categories/page.tsx
  - src/app/(app)/recurring/page.tsx
  - src/app/(app)/reimbursements/page.tsx
  - src/app/(app)/(admin)/members/page.tsx
  - src/app/(app)/(admin)/members/member-management-panel.tsx
  - src/app/action-state.ts
  - src/app/member-actions.ts
  - src/app/category-actions.ts
  - src/app/reimbursement-actions.ts
  - src/app/recurring-reminder-actions.ts
  - src/app/reimbursement-settlement-panel.tsx
  - src/app/recurring-reminder-confirmation-panel.tsx
  - prisma/schema.prisma
  - prisma/migrations/20260619183000_add_member_avatar_url/migration.sql
  - src/auth/current-member.ts
  - src/auth/current-member-data-source.ts
  - src/auth/session-identity.ts
  - src/modules/identity-access/member-management-command.ts
  - src/modules/identity-access/member-management-command.test.ts
  - src/components/layout/shared-layout.test.tsx
  - e2e/auth-session.spec.ts
  - e2e/admin-member-invitations.spec.ts
trace_links:
  spec: .ai/spec/admin-google-oauth-member-invitations.md
  technical_design: .ai/technical-design/admin-google-oauth-member-invitations.md
reviewed_at: 2026-06-19
---

# Admin Google OAuth And Member Invitations Implementation

## Decision

- gate: TDD Implementation
- decision: in_progress
- release_target: local_dev
- completed_slice: persisted member invitation creation and accept callback
- next_slice: local real-Google invitation smoke verification and release hardening

## Implemented Scope

- Added `AuthenticatedLayout` as the shared authenticated sidebar layout plus page outlet.
- Added `src/auth/app-access.ts` as the server-only access layer for authenticated app membership, admin route access, and server-action access.
- Moved protected pages into the `(app)` route group and admin-only pages into `(app)/(admin)` so login and admin route redirects are centralized in layouts.
- Added `PageLayout`, `PageHeader`, `PageContent`, `PageFooter`, and `MobileActionBar` for page header/content/footer anatomy.
- Migrated all `HomeDashboardLayout` and `DashboardRouteFrame` call sites to direct `AuthenticatedLayout` plus `PageLayout` composition.
- Removed `HomeDashboardLayout` and `DashboardRouteFrame`.
- Moved record-create header/mobile/dialog behavior into `record-create-actions.tsx`.
- Added `/unauthenticated` as the central app-access failure page.
- Added `/unauthenticated/logout` so blocked app access signs out before redirecting to reason-specific unauthenticated copy.
- Changed app-access blocked states so unauthenticated users redirect to `/login`, and invalid linked Google sessions sign out through `/unauthenticated/logout?reason=...`.
- Changed admin-only route access so non-admin users redirect to `/` instead of rendering page-local permission-denied panels.
- Added the shared sidebar footer logout button to `AuthenticatedLayout`, backed by `/auth/logout`.
- Moved authenticated account display resolution into `AuthenticatedLayout` through a request-level cached current-member helper.
- Split the previous broad dashboard page loader into server-only app access, monthly workspace context, category management context, member management context, and shared route search-param helpers.
- Kept monthly workspace loading only on routes that need monthly ledger/report data; `/categories` now loads category/reference-count data only, and `/members` now loads member-management data only.
- Kept record-create behavior in the dedicated adapter; non-ledger pages no longer pass or know `canCreateOwnRecords`, `createExpenseHref`, or `showCreateRecordActions`.
- Removed page-local non-admin denied screens from category and member management; protected route groups redirect instead.
- Changed navigation icons to serializable names so the server layout can pass navigation data to a client sidebar without crossing the RSC boundary with component functions.
- Updated category, reimbursement, recurring reminder, and ledger server actions to use the centralized access guard for authenticated actor lookup or route-level action authorization before domain command execution.
- Added Vitest alias resolution so component tests can import project modules through `@/*`.
- Added focused E2E coverage for login, invite accept, admin member management layout, and non-admin redirects.
- Added `Member.avatarUrl` plus a database migration so app-owned member profiles can store the Google avatar source.
- Extended Better Auth session identity mapping to include Google display name and image in the app Google identity.
- Added current-member profile synchronization after successful membership resolution:
  - Google `image` updates `Member.avatarUrl`.
  - Google `name` becomes the app display name only when the member still has a blank or seed `Admin` display name.
  - Google email and subject are persisted to the matched member when they differ.
- Threaded `avatarUrl` through `HouseholdMemberAccount`, `HouseholdAccessProfile`, `AuthenticatedLayout`, the sidebar footer account display, and dashboard/member read models.
- Replaced the member page's prototype adapter with a formal `MemberManagementMember` read model built in `loadMemberManagementContext`.
- Renamed `member-management-prototype.tsx` to `member-management-panel.tsx` and removed `PrototypeMember`/`MemberManagementPrototype` naming from production code.
- Removed page-local `buildMembersFromContext`, fake Dicebear avatar generation, and the extra Google-name field from the member page.
- Kept the member page behavior from the prototype: header invite action, modal invite form, copyable invite links with tooltip/icon button, and display-name edit dialog.
- Added `updateMemberDisplayNameAction` as the server action for member display-name updates.
- Added `updateMemberDisplayNameInDatabase` to run the existing member-management domain command and persist only `Member.displayName`.
- Wired the member edit dialog to submit through the server action, revalidate `/`, `/members`, and the return path, then show result feedback on reload.
- Kept avatar immutable from the admin UI; the display-name action only writes the `displayName` column.
- Added `MemberInvitation` persistence with token hash, local/dev preview token, invited email, status, expiry, creator, and target member relations.
- Added invitation domain and command modules for admin-only invite creation, duplicate pending invite reuse, token validation, wrong-account rejection, and invitation acceptance.
- Wired admin invite creation to a server action that creates an invited member with `general_member`, stores a pending invitation, redirects back with the generated link, and lets the modal show the link without a success toast.
- Replaced row re-copy links with persisted pending invitation links from the member-management read model.
- Changed `/invite/accept` to validate real invitation tokens before enabling Google sign-in.
- Changed `/auth/google` to preserve `inviteToken` through Better Auth by routing invited sign-in through `/invite/accept/callback`.
- Added `/invite/accept/callback` to resolve the Google session, verify the token/email, activate the invited member, persist Google subject/name/avatar defaults, mark the invitation accepted, and redirect to `/`.
- Added deterministic seed invitation data for e2e and local development.
- Added `src/app/action-state.ts` as the shared server-action response contract for `useActionState` forms: `status`, `message`, optional `code`, `fieldErrors`, and optional typed `data`.
- Converted member invite and display-name server actions from redirect/query feedback to typed `ActionState` returns.
- Removed member-management URL feedback parsing and made the member panel own its `useActionState` feedback, invitation link reveal, copy behavior, and refresh behavior.
- Converted category create, rename, and archive actions from redirect/query feedback to typed `ActionState` returns.
- Removed category-management URL result parsing; category management now uses one `useActionState` flow per form and keeps feedback local to the panel.
- Converted reimbursement settlement and recurring reminder confirmation from redirect/query feedback to `useActionState` while preserving inline alert feedback and refreshing server data after success.
- Updated reimbursement and recurring E2E expectations so action feedback is asserted in-page and no longer encoded in URL query state.

## Tests First Evidence

- Added failing `src/components/layout/shared-layout.test.tsx` before creating `AuthenticatedLayout` and `PageLayout`.
- Initial failure: missing `./authenticated-layout`, confirming the new shared layout contract did not exist.
- Implemented the shared layout components and migrated call sites until the layout tests passed.
- Added focused Playwright coverage for the accepted Behavior Spec routes and fixed the non-admin denied state to expose a real heading.
- Added failing/auth-focused coverage for session identity Google name/image mapping, current-member Google profile synchronization, and persistence through `createCurrentMemberDataSource`.
- Added command-level coverage for persisted member display-name updates, invalid blank names, and non-admin rejection before wiring the UI to the server action.
- Added invitation domain/command coverage for admin creation, duplicate pending invitation reuse, token states, wrong-account rejection, and accepted invitation persistence.

## Verification Run During Implementation

- `corepack pnpm vitest run src/components/layout/shared-layout.test.tsx` passed: 2 tests.
- `corepack pnpm type-check` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm exec playwright test e2e/admin-member-invitations.spec.ts` passed: 4 tests.
- `corepack pnpm exec playwright test e2e/auth-session.spec.ts` passed: 4 tests.
- `corepack pnpm exec playwright test e2e/admin-category-management.spec.ts` passed: 6 tests.
- `corepack pnpm test src/auth/session-identity.test.ts src/auth/current-member.test.ts src/auth/current-member-data-source.test.ts` passed: 12 tests.
- `corepack pnpm type-check` passed after adding `Member.avatarUrl` and updating affected read models.
- `corepack pnpm lint` passed.
- `pnpm test:e2e e2e/admin-member-invitations.spec.ts` passed: 4 tests.
- `corepack pnpm test src/modules/identity-access/member-management-command.test.ts src/modules/identity-access/member-management.test.ts` passed: 9 tests.
- `corepack pnpm type-check` passed after wiring member actions and result parsing.
- `corepack pnpm lint` passed.
- `pnpm test:e2e e2e/admin-member-invitations.spec.ts` passed: 5 tests.
- `corepack pnpm test src/modules/identity-access/member-invitations.test.ts src/modules/identity-access/member-invitation-command.test.ts` passed: 11 tests.
- `corepack pnpm type-check` passed after adding `MemberInvitation`, invite actions, token validation, and callback wiring.
- `corepack pnpm lint` passed.
- `pnpm test:e2e e2e/admin-member-invitations.spec.ts` passed: 6 tests.
- `corepack pnpm type-check` passed after introducing the shared `ActionState` contract and converting member, category, reimbursement, and recurring reminder forms.
- `corepack pnpm lint` passed.
- `pnpm test:e2e e2e/admin-member-invitations.spec.ts e2e/admin-category-management.spec.ts e2e/reimbursement-settlement.spec.ts e2e/recurring-reminder-confirmation.spec.ts` passed: 17 tests.

## Files Changed

- `src/components/layout/authenticated-layout.tsx`
- `src/components/layout/authenticated-sidebar-nav.tsx`
- `src/components/layout/page-layout.tsx`
- `src/components/layout/shared-layout.test.tsx`
- `src/auth/app-access.ts`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/(admin)/layout.tsx`
- `src/app/unauthenticated/page.tsx`
- `src/app/unauthenticated/logout/route.ts`
- `src/app/unauthenticated/unauthenticated-reasons.ts`
- `src/app/auth/logout/route.ts`
- `src/app/monthly-workspace-context.ts`
- `src/app/category-management-context.ts`
- `src/app/member-management-context.ts`
- `src/app/(app)/(admin)/members/member-management-panel.tsx`
- `src/app/member-actions.ts`
- `src/modules/identity-access/member-management-command.ts`
- `src/modules/identity-access/member-management-command.test.ts`
- `src/modules/identity-access/member-invitations.ts`
- `src/modules/identity-access/member-invitations.test.ts`
- `src/modules/identity-access/member-invitation-command.ts`
- `src/modules/identity-access/member-invitation-command.test.ts`
- `src/app/invite/accept/callback/route.ts`
- `src/app/invite/accept/page.tsx`
- `src/app/auth/google/route.ts`
- `src/auth/google-sign-in.ts`
- `prisma/migrations/20260619194000_add_member_invitations/migration.sql`
- `prisma/seed.sql`
- `src/app/route-search-params.ts`
- `src/app/dashboard-page-context.ts` removed
- `src/auth/server-current-member-cache.ts`
- `src/app/(app)/(admin)/members/page.tsx`
- `src/app/(app)/(admin)/members/member-management-prototype.tsx` renamed to `member-management-panel.tsx`
- `src/app/action-state.ts`
- `src/app/member-actions.ts`
- `src/app/category-actions.ts`
- `src/app/reimbursement-actions.ts`
- `src/app/recurring-reminder-actions.ts`
- `src/app/(app)/(admin)/categories/page.tsx`
- `src/app/(app)/(admin)/categories/category-management-panel.tsx`
- `src/app/(app)/reimbursements/page.tsx`
- `src/app/reimbursement-settlement-panel.tsx`
- `src/app/(app)/recurring/page.tsx`
- `src/app/recurring-reminder-confirmation-panel.tsx`
- `e2e/reimbursement-settlement.spec.ts`
- `e2e/recurring-reminder-confirmation.spec.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260619183000_add_member_avatar_url/migration.sql`
- `src/auth/current-member.ts`
- `src/auth/current-member-data-source.ts`
- `src/auth/session-identity.ts`
- `src/modules/identity-access/member-management.ts`
- `src/modules/identity-access/session-access.ts`
- `src/app/(app)/(admin)/categories/page.tsx`
- `src/app/(app)/(admin)/categories/category-management-panel.tsx`
- `src/app/(app)/page.tsx`
- `src/app/(app)/records/page.tsx`
- `src/app/(app)/recurring/page.tsx`
- `src/app/(app)/reimbursements/page.tsx`
- `src/app/home-access.ts`
- `src/app/record-create-actions.tsx`
- `src/app/home-dashboard-layout.tsx` removed
- `src/app/dashboard-route-frame.tsx` removed
- `src/app/dashboard-access-screen.tsx` removed
- `src/app/authenticated-app-context.ts` removed
- `src/app/redirect-unauthenticated.ts` removed
- `e2e/auth-session.spec.ts`
- `e2e/admin-member-invitations.spec.ts`
- `vitest.config.ts`

## Accepted Gaps

- Local/dev keeps `MemberInvitation.previewToken` so admins can re-copy links. Production release must replace raw-token re-copy with email delivery or a one-time reveal policy.
- Real Google OAuth invitation acceptance should still get a manual local smoke with a real invited Google account before release readiness.
- The record-create flow still uses URL state because the same query currently controls modal routing (`create=income|expense`) and submit feedback. It should be separated into a later slice before converting that form to `useActionState`.

## Review Gate

- decision: proceed
- reviewer_focus:
  - Confirm `AuthenticatedLayout` naming and sidebar/page responsibility split match product architecture expectations.
  - Confirm `/members` no longer depends on record-create layout props.
  - Confirm existing category management layout behavior remains intact.
- must_check:
  - Component tests, type-check, lint, focused member E2E, and category regression E2E pass.
  - No production OAuth secrets are required for automated E2E.
- unresolved_blockers:
  - None for continuing TDD Implementation.
- next_step:
  - Continue TDD Implementation with persisted invitation/domain behavior or Google OAuth callback wiring.
