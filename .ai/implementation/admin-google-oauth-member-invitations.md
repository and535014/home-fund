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
  - src/app/(app)/(admin)/members/member-management-prototype.tsx
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
- completed_slice: shared authenticated layout extraction and centralized app/admin access guards
- next_slice: persisted member invitation/domain actions or real Google OAuth callback wiring

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

## Tests First Evidence

- Added failing `src/components/layout/shared-layout.test.tsx` before creating `AuthenticatedLayout` and `PageLayout`.
- Initial failure: missing `./authenticated-layout`, confirming the new shared layout contract did not exist.
- Implemented the shared layout components and migrated call sites until the layout tests passed.
- Added focused Playwright coverage for the accepted Behavior Spec routes and fixed the non-admin denied state to expose a real heading.

## Verification Run During Implementation

- `corepack pnpm vitest run src/components/layout/shared-layout.test.tsx` passed: 2 tests.
- `corepack pnpm type-check` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm exec playwright test e2e/admin-member-invitations.spec.ts` passed: 4 tests.
- `corepack pnpm exec playwright test e2e/auth-session.spec.ts` passed: 4 tests.
- `corepack pnpm exec playwright test e2e/admin-category-management.spec.ts` passed: 6 tests.

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
- `src/app/route-search-params.ts`
- `src/app/dashboard-page-context.ts` removed
- `src/auth/server-current-member-cache.ts`
- `src/app/(app)/(admin)/members/page.tsx`
- `src/app/(app)/(admin)/members/member-management-prototype.tsx`
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

- The persisted `MemberInvitation` model and server actions are not implemented in this slice.
- Real Google OAuth callback/invitation linking remains for a follow-up implementation slice.
- Persisted invitations and real OAuth callback wiring remain for the next implementation slice.

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
