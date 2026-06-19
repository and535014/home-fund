---
id: technical-design-admin-google-oauth-member-invitations
stage: technical-design
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-google-oauth-member-invitations.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-google-oauth-member-invitations.md
  - .ai/prototype/admin-google-oauth-member-invitations.md
  - .ai/spec/admin-google-oauth-member-invitations.md
outputs:
  - feature_technical_design
  - implementation_boundaries
  - tdd_handoff
trace_links:
  routes:
    - src/app/login/page.tsx
    - src/app/invite/accept/page.tsx
    - src/app/members/page.tsx
    - src/app/auth/google/route.ts
    - src/app/api/auth/[...all]/route.ts
  auth:
    - src/auth/config.ts
    - src/auth/google-sign-in.ts
    - src/auth/current-member.ts
    - src/auth/current-member-data-source.ts
    - src/auth/server-current-member.ts
  identity_access:
    - src/modules/identity-access/member-management.ts
    - src/modules/identity-access/session-access.ts
    - src/modules/identity-access/authorization.ts
  ui:
    - src/app/members/member-management-prototype.tsx
    - src/app/dashboard-route-frame.tsx
    - src/app/home-dashboard-layout.tsx
    - src/components/ui/avatar.tsx
  data_model:
    - prisma/schema.prisma
  tests:
    - src/modules/identity-access/*.test.ts
    - src/auth/*.test.ts
    - e2e/
reviewed_at: 2026-06-19
---

# Admin Google OAuth And Member Invitations Technical Design

## Decision

- gate: feature_technical_design
- decision: awaiting_approval
- implementation_handoff: TDD Implementation
- recommended_next_skill: tdd-implementation
- release_target: local_dev

## Scope

This design turns the accepted prototype and Behavior Spec into persisted local_dev behavior for:

- `/login` general Google sign-in.
- `/invite/accept?token=...` invitation accept sign-in.
- Real Google OAuth start/callback with invitation context.
- Admin-only member invitation link generation and re-copy.
- Admin-only display-name updates.
- Read-only Google avatar display.
- Sidebar-footer logout returning to `/login`.
- Controlled-auth automated E2E without Google OAuth credentials.
- Shared app/page layout extraction so member management does not keep depending on a record-creation-oriented `HomeDashboardLayout` interface.

Out of scope:

- Real email delivery.
- Disable/reactivate member management UI or commands.
- Self-service profile editing.
- Admin-selected roles during invitation.
- Production observability, rate limiting, and full security hardening beyond local_dev readiness.

## Architecture Decisions

### ADR-1: Persist Invitations As First-Class Tokens

- Status: accepted
- Decision: Add a `MemberInvitation` Prisma model owned by Identity and Access. Invitation records store token hash, invited member id, normalized email, status, expiry, created-by member, and timestamps.
- Rationale: Behavior requires copyable invitation links, re-copy from invited member rows, token validation, wrong-account blocking, and future expiry/revocation behavior. A token cannot be reconstructed safely from the member email.
- Consequences: This slice requires a Prisma migration and token generation utility. The UI copies the raw token URL only at creation and later retrieves/copies the persisted current invitation link.

### ADR-2: Store Token Hash, Not Raw Token

- Status: accepted
- Decision: Store `tokenHash` in the database and return the raw token only in server action responses or read models where admin is authorized to copy it from local_dev UI.
- Rationale: Raw invitation tokens are bearer credentials. Even in local_dev, the data model should not normalize storing bearer secrets in clear text.
- Consequences: Re-copy requires either storing a separate short-lived display token, or for MVP local_dev storing raw token encrypted is overkill. Selected local_dev compromise: store raw token in `MemberInvitation.previewToken` only when `NODE_ENV !== "production"` and treat production token retrieval as a release blocker. Production design must replace this with email delivery or one-time reveal. This must be called out in release readiness.

### ADR-3: Invitation Acceptance Auto-Activates Matching Invited Member

- Status: accepted
- Decision: A valid, unexpired invitation token plus matching Google email links `Member.googleSubject`, initializes profile defaults, sets member status to `active`, and marks the invitation accepted.
- Rationale: Behavior Spec selected no separate admin approval step for the MVP slice.
- Consequences: Wrong Google email must not activate. The transaction must be atomic.

### ADR-4: Preserve Invitation Context Through Google OAuth With Callback URL

- Status: accepted
- Decision: `/auth/google` accepts optional `inviteToken` form field. When present, it starts Google OAuth with a callback URL containing an opaque invite context parameter that returns to an app-owned post-auth route.
- Rationale: Better Auth owns provider redirect/callback; the app still needs to resume invitation linking after Google returns.
- Consequences: Add an app-owned callback/resume route such as `/auth/invite/callback?token=...` or encode return URL as `/invite/accept/callback?token=...`. The callback route resolves the current Better Auth session, validates invitation, links/activates, then redirects to `/`.

### ADR-5: Keep Core Domain Rules In Identity-Access Modules

- Status: accepted
- Decision: Add pure functions to `src/modules/identity-access/member-invitations.ts` for create invitation, validate token state, accept invitation, and update display name. Add a Prisma adapter for persistence and transactions.
- Rationale: Existing code keeps identity rules separate from Next route handlers; this avoids burying membership policy in React/server action files.
- Consequences: TDD starts with unit tests for pure rules, then adapter/action tests.

### ADR-6: Use Server Actions For Member Mutations

- Status: accepted
- Decision: Add server actions under `src/app/member-actions.ts` or `src/app/members/actions.ts` for invite creation and display-name update. Server actions enforce current member authorization and return typed results consumed by the client component.
- Rationale: Existing mutation flows use server actions and Prisma adapters. Member management should follow the same app conventions.
- Consequences: The prototype component must evolve from local state to action-backed state while preserving preview mode for non-production visual review if useful.

### ADR-7: Logout Uses A Dedicated Route Handler

- Status: accepted
- Decision: Add `/auth/logout` route or server action that calls Better Auth sign-out and redirects to `/login`.
- Rationale: UI already places logout in sidebar footer and Behavior Spec requires real session termination.
- Consequences: The current prototype link to `/login` must be replaced by a POST or route action that actually clears the Better Auth session.

### ADR-8: Split Generic App/Page Layout From Record-Creation Convenience

- Status: accepted
- Decision: Extract the reusable authenticated app chrome from `HomeDashboardLayout` into `AuthenticatedLayout`, and extract page anatomy into `PageLayout` plus `PageHeader` / `PageContent` / `PageFooter`. Replace the misleading generic use of `DashboardRouteFrame` with an `AppRouteFrame` adapter, and keep record-creation actions plus `CreateRecordDialog` wiring in a separate record-action adapter instead of the shared layout. Mobile bottom actions become `MobileActionBar`, a shared app UI primitive, not page-local markup.
- Rationale: `HomeDashboardLayout` currently mixes a general dashboard page frame with home/ledger-specific create-record actions. Member management and category management already have to pass `showCreateRecordActions={false}`, custom header actions, mobile footer actions, and sidebar footer actions. That is a shallow interface: callers must understand unrelated record-creation behavior to render non-ledger pages.
- Consequences: TDD Implementation must include a small layout refactor before wiring persisted member management. The refactor should preserve current visual behavior while creating a deeper module interface for authenticated app pages without spreading dashboard naming.

## Data Model

### Prisma Migration

Add model:

```prisma
enum MemberInvitationStatus {
  pending
  accepted
  revoked
  expired
}

model MemberInvitation {
  id           String                 @id @default(cuid())
  householdId  String
  memberId     String
  email        String
  tokenHash    String                 @unique
  previewToken String?
  status       MemberInvitationStatus @default(pending)
  expiresAt    DateTime
  acceptedAt   DateTime?
  revokedAt    DateTime?
  createdById  String
  createdAt    DateTime               @default(now())
  updatedAt    DateTime               @updatedAt

  household Household @relation(fields: [householdId], references: [id], onDelete: Restrict)
  member    Member    @relation(fields: [memberId], references: [id], onDelete: Cascade)
  createdBy Member    @relation("MemberInvitationCreator", fields: [createdById], references: [id], onDelete: Restrict)

  @@index([householdId, email])
  @@index([memberId, status])
  @@index([expiresAt])
}
```

Add relations:

- `Household.memberInvitations MemberInvitation[]`
- `Member.invitations MemberInvitation[]`
- `Member.createdInvitations MemberInvitation[] @relation("MemberInvitationCreator")`

Keep existing `MemberStatus.disabled` in the schema for legacy/security handling, but do not expose disable/reactivate in member management UI in this slice.

### Token Policy

- Token generation: `crypto.randomBytes(32)` base64url.
- Token hash: SHA-256 hex digest.
- Expiry: 7 days for local_dev MVP.
- Re-copy in local_dev: use `previewToken` to reconstruct the URL. This is acceptable only for local_dev; production release must replace it.
- Link URL: `${baseUrl}/invite/accept?token=${rawToken}`.

## Module And File Plan

| Area | File(s) | Change |
|---|---|---|
| Domain rules | `src/modules/identity-access/member-invitations.ts` | New pure invitation create/accept/validation functions and result types. |
| Domain tests | `src/modules/identity-access/member-invitations.test.ts` | Admin-only invite, duplicate email, token status, wrong email, valid activation, expiry/revocation. |
| Member management | `src/modules/identity-access/member-management.ts` | Narrow create command to email-only invitation or delegate invitation creation to new module; keep display-name update. |
| Prisma adapter | `src/modules/identity-access/member-invitation-command.ts` | Load current members/invitations, persist invited member + invitation, accept invitation in transaction, update display names. |
| Auth start | `src/auth/google-sign-in.ts`, `src/app/auth/google/route.ts` | Accept optional callback URL/invite token and preserve invite context. |
| Invite callback | `src/app/invite/accept/callback/route.ts` or `src/app/auth/invite/callback/route.ts` | Resolve session, validate token, activate/link member, redirect to `/` or back to invite page on error. |
| Logout | `src/app/auth/logout/route.ts` or server action | Sign out Better Auth session and redirect to `/login`. |
| Shared layout suite | `src/components/layout/authenticated-layout.tsx`, `src/components/layout/page-layout.tsx`, `src/components/layout/page-header.tsx`, `src/components/layout/mobile-action-bar.tsx` | New generic layout architecture: authenticated app chrome plus page header/content/footer anatomy. No record-create knowledge and no dashboard-specific naming. |
| Mobile action bar | `src/components/layout/mobile-action-bar.tsx` or `src/app/mobile-action-bar.tsx` | Shared fixed mobile bottom action bar with safe-area padding, border/background tokens, layout constraints, and action slot rendering. It is app-level UI infrastructure, not dashboard-specific. |
| App route frame | `src/app/app-route-frame.tsx` | Generic adapter from authenticated route context to `AuthenticatedLayout` and `PageLayout` props. It should know about authenticated app chrome, blocked access, navigation, and route slots; it should not know about record creation. |
| Record action adapter | `src/app/record-action-frame.tsx` or `src/app/record-create-route-actions.tsx` | Owns create-record hrefs/dialog/query parsing and passes record-specific actions/dialog content into `AppRouteFrame` slots. |
| Legacy wrappers | `src/app/dashboard-route-frame.tsx`, `src/app/home-dashboard-layout.tsx` | Existing names should become temporary compatibility wrappers or be deleted after call sites migrate. New code should not use dashboard-named wrappers for generic app layout. |
| Member actions | `src/app/members/actions.ts` | Server actions for create invitation, update display name, maybe copy/retrieve invitation link. |
| Member data source | `src/app/members/member-data-source.ts` or app data source extension | Read members plus latest pending invitation link for invited rows. |
| Member page | `src/app/members/page.tsx` | Replace local prototype mutation with server-action-backed member management for authenticated route; keep preview mode only in non-production. |
| Member panel | `src/app/members/member-management-prototype.tsx` -> `member-management-panel.tsx` | Rename or adapt to production component; preserve UI behavior from prototype. |
| Login/Invite pages | `src/app/login/page.tsx`, `src/app/invite/accept/page.tsx` | Keep current copy; wire invite token hidden field into auth start. |
| E2E | `e2e/admin-member-invitations.spec.ts` | Add spec from Behavior Spec using preview/controlled-auth fixtures. |

## Server Contracts

### Create Invitation Server Action

Input:

- `googleEmail`: string
- `returnTo`: default `/members`

Authorization:

- Current member must be admin or otherwise authorized for `manage_members`.

Validation:

- Email must be syntactically valid enough for MVP (`name@domain` minimum in UI; stricter normalization in domain module).
- Email normalized to lowercase.
- Reject if any member already has that `googleAccountEmail`.
- Reject if there is an active/pending invitation for the same email unless implementation chooses to return the existing link. For MVP, return existing pending invitation link if member is already invited, so admin can re-copy instead of seeing a hard error.

Success result:

```ts
type CreateInvitationResult = {
  ok: true;
  member: MemberListItem;
  invitationLink: string;
};
```

Error result:

```ts
type CreateInvitationError =
  | "permission_denied"
  | "invalid_email"
  | "member_already_active"
  | "unknown_error";
```

### Copy Existing Invitation Link

Implementation option:

- The member list read model includes `invitationLink` for invited rows when the current user is admin.
- No extra mutation is needed for copy. Copy is a client clipboard operation.

Security note:

- In local_dev MVP this read model may expose re-copyable preview links to admins. Production release must revisit raw-token exposure.

### Update Display Name Server Action

Input:

- `memberId`
- `displayName`

Authorization:

- Admin/manage-members only.

Validation:

- Non-empty trimmed display name.
- No avatar fields accepted.
- No self-service member path in this slice.

Success:

- Persist `Member.displayName`.
- Revalidate `/members`, `/`, and dashboard pages that show display names.

### Logout

Preferred:

- POST route/action to `/auth/logout`.
- Calls Better Auth sign-out API if available in the project’s Better Auth version, or clears session through the adapter-supported API.
- Redirects to `/login`.

Fallback if Better Auth minimal API lacks convenient sign-out:

- Add a documented integration wrapper and test against the actual Better Auth API during TDD before wiring UI.

## Invitation Accept Flow

1. Admin creates invitation for `email`.
2. App creates `Member(status=invited, googleAccountEmail=email, displayName=email-local-part, roles=[general_member])`.
3. App creates `MemberInvitation(status=pending, tokenHash, previewToken, expiresAt, memberId)`.
4. Admin copies `/invite/accept?token=<raw>`.
5. Invited user opens `/invite/accept?token=<raw>`.
6. Page submits `inviteToken` to `/auth/google`.
7. Google OAuth completes through Better Auth.
8. App-owned invite callback resolves current Better Auth session:
   - Google subject from `Account.accountId` where `providerId=google`.
   - Google email/name/image from `User`.
9. Callback hashes token, loads pending invitation, verifies not expired/revoked/accepted.
10. Callback compares normalized invitation email with Google user email.
11. On match, transaction:
    - update member `googleSubject`
    - update member `status=active`
    - if current member display name is still invite fallback, update to Google user name
    - mark invitation `accepted`
12. Redirect to `/`.

Wrong account behavior:

- Do not link or activate.
- Redirect to `/invite/accept?token=<raw>&auth_error=wrong_account` for local_dev MVP.

Expired/revoked/already accepted:

- Redirect to `/invite/accept?auth_error=invalid_invite` or render token-specific error if token still present.

## Read Models

Member list item:

```ts
type MemberListItem = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  roles: MemberRole[];
  status: "active" | "invited";
  invitationLink?: string;
};
```

Data source:

- Query members ordered by display name.
- Exclude `status=disabled` from this route.
- Join role assignments.
- For active linked users, get avatar from Better Auth `User.image` through `Member.googleSubject -> Account.accountId -> User`.
- For invited rows, provide latest pending invitation link if admin and local_dev preview token exists.
- Do not expose Google email or profile name in the UI read model.

## UI State Ownership

Server-owned:

- Member list, roles, statuses, display names, invitation links.
- Authorization and route denial.
- Invitation token lifecycle.
- Logout/session state.

Client-owned:

- Invite modal open/closed state.
- Invite email draft before submit.
- Generated link display state after action result.
- Clipboard copy feedback.
- Display-name edit dialog and draft before submit.
- Tooltip display.

The production member panel should not maintain a separate authoritative member array after server action success. It may use optimistic display only if the server result is canonical and immediately revalidated.

## Shared Layout Architecture

The implementation should not create another narrowly named layout wrapper. The target is a small generic layout suite with clear page anatomy:

```tsx
<AuthenticatedLayout navigation={...} account={...} sidebarFooter={...}>
  <PageLayout
    header={<PageHeader title="成員" description="..." actions={...} />}
    footer={<MobileActionBar>{...}</MobileActionBar>}
    overlays={...}
  >
    {content}
  </PageLayout>
</AuthenticatedLayout>
```

### `AuthenticatedLayout`

Purpose: authenticated sidebar layout plus page outlet.

```ts
type AuthenticatedLayoutProps = {
  children: ReactNode;
  account: {
    displayName: string;
  };
  navigation: AppNavigationItem[];
  sidebarFooter?: ReactNode;
};

type AppNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};
```

Responsibilities:

- Sidebar provider/inset layout.
- Sidebar structure for the authenticated app.
- App identity block inside the sidebar.
- App navigation inside the sidebar.
- Account display inside the sidebar.
- Sidebar footer slot.
- Render `children` as the page outlet.
- App-wide background/text tokens.

Non-responsibilities:

- Page title or page description.
- Record creation.
- Month switching.
- Mobile bottom action content.
- Route query parsing.
- Domain-specific controls.

### `PageLayout`

Purpose: universal page anatomy: header, content, footer, overlays.

```ts
type PageLayoutProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  overlays?: ReactNode;
};
```

Responsibilities:

- Content max width.
- Responsive horizontal padding.
- Top padding based on fixed header height.
- Bottom padding when mobile footer exists.
- Render order: header, content, footer, overlays.

Non-responsibilities:

- Navigation.
- Authentication.
- Record creation.
- Domain data loading.

### `PageHeader`

Purpose: consistent page heading/action region.

```ts
type PageHeaderProps = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};
```

Responsibilities:

- Fixed or sticky page header presentation if the product keeps that pattern.
- Title typography.
- Optional description.
- Optional eyebrow/subtitle such as current month.
- Action slot aligned consistently on desktop and stacked sanely on mobile.

### `PageContent`

Purpose: optional semantic wrapper when pages need a named content region.

```ts
type PageContentProps = {
  children: ReactNode;
};
```

Responsibilities:

- Main content semantics and spacing.
- No domain behavior.

### `PageFooter`

Purpose: optional desktop or non-fixed footer region for page-level secondary actions or status.

```ts
type PageFooterProps = {
  children: ReactNode;
};
```

This is not the same as the mobile bottom action bar.

### `MobileActionBar`

Purpose: app-wide mobile fixed action region.

```ts
type MobileActionBarProps = {
  children: ReactNode;
};
```

Responsibilities:

- Fixed bottom placement.
- Mobile-only visibility.
- Safe-area padding.
- Border/background/backdrop/shadow design tokens.
- Max-width and horizontal action layout.
- Stable action sizing so buttons do not resize page content.

Non-responsibilities:

- Dashboard behavior.
- Record behavior.
- Member behavior.
- Category behavior.

Pages and route adapters pass already-built actions as children.

### Route Adapters

`AppRouteFrame` should be a thin adapter from authenticated route context to generic layout:

```ts
type AppRouteFrameProps = {
  children: ReactNode;
  context: AuthenticatedAppRouteContext;
  header: ReactNode;
  footer?: ReactNode;
  overlays?: ReactNode;
  sidebarFooter?: ReactNode;
};
```

Responsibilities:

1. Handle blocked access state.
2. Provide `AuthenticatedLayout` with sidebar account, navigation, and sidebar footer.
3. Provide `PageLayout` with page header/content/footer/overlays.

Record creation becomes a separate composition:

- `RecordCreateActions` builds desktop header and mobile action buttons.
- `RecordCreateDialogHost` owns `CreateRecordDialog`.
- Ledger/home pages compose those into `PageHeader.actions`, `MobileActionBar`, and `PageLayout.overlays`.

Members/categories/recurring/reimbursements should not know `canCreateOwnRecords`, `createExpenseHref`, `showCreateRecordActions`, or `CreateRecordDialog` exist.

### Props That Must Disappear From Generic Layout

- `canCreateOwnRecords`
- `createIncomeHref`
- `createExpenseHref`
- `showCreateRecordActions`
- `createRecordDialogContent`
- `CreateRecordDialog`
- `readCreateRecordMode`
- `readCreateRecordFeedback`

These belong to record-specific adapters, not shared layout.

### Migration Plan

1. Add `AuthenticatedLayout`, `PageLayout`, `PageHeader`, and `MobileActionBar`.
2. Rebuild `HomeDashboardLayout` as a temporary wrapper over the new layout suite, preserving current behavior.
3. Add `AppRouteFrame` for generic authenticated routes.
4. Move record-create logic from `HomeDashboardLayout` into `RecordCreateActions` and `RecordCreateDialogHost`.
5. Migrate `/members` to `AppRouteFrame` and shared layout components first.
6. Migrate `/categories`, `/recurring`, `/reimbursements`, `/records`, and home routes.
7. Delete or deprecate `HomeDashboardLayout` and `DashboardRouteFrame` once call sites move.

This refactor is a precondition for implementation because member management should depend on a stable shared page architecture, not on a home/ledger-specific layout that happens to be configurable enough.

### Naming Cleanup

Current dashboard-named modules exist because the original first screen was the household fund overview. For this slice, that naming has become misleading:

- `HomeDashboardLayout` is not home-only and not a dashboard domain module; it is app chrome plus record-create convenience.
- `DashboardRouteFrame` is not dashboard-specific; it adapts authenticated route context into app chrome and currently mixes record-create behavior.
- `DashboardNavigationItem` should become `AppNavigationItem`.

Implementation should avoid adding new dashboard-named generic modules. Existing dashboard-named files may remain as temporary wrappers only if migrating every call site in one step is too risky.

## Route And Authorization Boundaries

### `/members`

1. Load dashboard context.
2. If blocked, render existing access screen.
3. If authenticated but non-admin, render denied card.
4. If admin, render member management panel.
5. Server actions still enforce admin/manage-members. Hidden controls are not authorization.

### `/login`

- General sign-in only.
- Product description plus Google sign-in.
- No invitation copy.

### `/invite/accept`

- Invitation sign-in only.
- Missing token disables sign-in.
- No general-login link.

### Preview Role Query

- Keep `previewRole` route behavior guarded by `NODE_ENV !== "production"` for visual review only.
- TDD implementation must keep persisted behavior independent from query-only preview.

## Error And Feedback Strategy

- Invite invalid email: toast.
- Duplicate active member email: toast.
- Existing pending invite: return the existing link, not a toast-only dead end.
- Invite creation success: show generated link UI, no success toast.
- Copy success/failure: toast.
- Display-name blank: toast.
- Display-name saved: toast.
- Missing invite token: page-level destructive `Alert`.
- Wrong Google account: invite page destructive `Alert`.
- Auth cancellation/error: page-level destructive `Alert` on `/login` or `/invite/accept`.

## Test Mapping

### Unit

- `member-invitations.test.ts`
  - admin can create invitation
  - non-admin rejected
  - invalid email rejected
  - duplicate active member rejected
  - pending invited member returns/reuses invitation link
  - expired/revoked/accepted token rejected
  - wrong Google email rejected
  - valid Google email activates invited member
- `member-management.test.ts`
  - display-name update remains admin-only
  - blank display name rejected
  - avatar cannot be changed through display-name command
- `session-access.test.ts`
  - active linked member resolves
  - invited member remains blocked before invitation acceptance
  - disabled member remains blocked by existing security policy

### Adapter / Integration

- `member-invitation-command.test.ts`
  - create invitation persists member, role, invitation
  - accept invitation transaction updates member and invitation atomically
  - wrong account does not mutate
  - pending invite read model includes invitation link in local_dev admin view
- `google-sign-in.test.ts`
  - normal sign-in uses callback `/`
  - invite sign-in uses invite callback URL with token
- `logout.test.ts`
  - logout clears session and redirects `/login`

### E2E

- `admin-member-invitations.spec.ts`
  - login page copy and CTA
  - invite accept page with token and missing token
  - admin members page desktop 3-column grid
  - invite link generation without success toast
  - copy generated link toast
  - copy existing invited link tooltip and toast
  - invalid/duplicate invite validation
  - display-name edit
  - non-admin denied
  - mobile one-column member grid

Manual smoke:

- Real Google OAuth admin sign-in with real env vars.
- Create invitation link and accept with intended Google account.
- Attempt invitation with wrong Google account.
- Logout and switch Google account.

## Migration And Seed Plan

- Add Prisma migration for `MemberInvitation` and enum.
- Seed data may include:
  - active admin with `googleAccountEmail` configured by local env or seed default
  - active finance manager
  - invited general member with pending invitation for local preview
- Do not seed disabled member into prototype/member preview fixtures for this slice.
- README/local setup must document:
  - Google OAuth env vars
  - local callback URL
  - first admin bootstrap
  - controlled-auth E2E does not need Google credentials

## Release Target Implications

For `local_dev` readiness:

- Required automated evidence:
  - unit/domain tests
  - adapter/integration tests
  - E2E controlled-auth tests
  - lint and type-check
- Required manual evidence:
  - real Google OAuth admin smoke if credentials are configured
  - invitation accept smoke if a second test Google account is available
- Release artifact must distinguish:
  - automated controlled-auth pass
  - real OAuth smoke pass
  - real OAuth smoke skipped because credentials/accounts are unavailable

Production blockers:

- Raw invitation token re-copy strategy.
- Invite token rate limiting and revocation UI.
- Email delivery or a safe one-time reveal design.
- Monitoring/alerts for OAuth callback failures.

## TDD Implementation Preconditions

- Behavior Spec accepted without changing automatic activation policy.
- Prisma migration can be created and applied locally.
- Better Auth sign-out and callback URL APIs verified against the installed version.
- E2E fixture path is understood and remains non-production guarded.
- Real Google OAuth credentials are available only for manual smoke, not required for automated tests.
- App shell extraction accepted so implementation can remove `showCreateRecordActions={false}` from non-ledger pages instead of spreading the mixed layout interface further.

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm `MemberInvitation` persistence and token strategy are acceptable for local_dev.
  - Confirm automatic activation after valid invite token plus intended Google identity.
  - Confirm server actions are the right mutation boundary.
  - Confirm generic app shell extraction should happen before persisted member-management wiring.
  - Confirm logout should be a real sign-out route/action redirecting to `/login`.
  - Confirm production blockers can remain deferred while local_dev proceeds.
- must_check:
  - Design maps every Behavior Spec AC to a route/module/data/test boundary.
  - Invitation context survives Google OAuth without relying on client-only state.
  - Wrong-account and disabled-member safety paths remain explicit.
  - Controlled-auth E2E remains independent of real Google OAuth credentials.
- unresolved_blockers:
  - Better Auth sign-out API and callback URL behavior must be verified during TDD before final wiring.
- next_step:
  - TDD Implementation
