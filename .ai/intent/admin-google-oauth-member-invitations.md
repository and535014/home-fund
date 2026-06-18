---
id: admin-google-oauth-member-invitations
stage: intent
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-19-admin-google-oauth-member-invitations
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/intent/home-family-fund.md
  - .ai/domain/home-family-fund.md
  - .ai/spec/story-authenticated-household-access.md
  - .ai/spec/story-admin-member-management.md
  - .ai/intent/local-google-oauth-login.md
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  supersedes:
    - .ai/intent/local-google-oauth-login.md
    - .ai/spec/local-google-oauth-login.md
  existing_domain:
    - .ai/domain/home-family-fund.md
  existing_stories:
    - .ai/spec/story-authenticated-household-access.md
    - .ai/spec/story-admin-member-management.md
  current_code:
    - src/auth/config.ts
    - src/auth/index.ts
    - src/auth/google-sign-in.ts
    - src/auth/server-current-member.ts
    - src/auth/current-member.ts
    - src/modules/identity-access/member-management.ts
    - src/modules/identity-access/session-access.ts
    - src/app/page.tsx
    - src/app/dashboard-access-screen.tsx
    - src/app/members/page.tsx
    - src/app/auth/google/route.ts
    - src/app/api/auth/[...all]/route.ts
    - prisma/schema.prisma
    - prisma/seed.sql
    - README.md
reviewed_at: 2026-06-19
---

# Admin Google OAuth And Member Invitations

## Decision Summary

- decision: proceed
- first_next_gate: targeted Domain Discovery
- owning_skill: domain-discovery
- reason: The request combines real Google OAuth admin access with an admin-owned invitation/member-linking workflow. This resolves an existing open domain question: whether members join by email invitation, invite link, first-login approval, or manual linking.

## User Request

Admin should be able to sign in to the website through real Google OAuth, then invite other members to join and use the service.

## Change Classification

- change_type: feature_change
- secondary_types:
  - auth_integration
  - member_invitation_workflow
  - admin_page_change
  - backend_behavior
  - data_lifecycle
  - local_dev_release_change
- release_target: local_dev

## Affected Surfaces

| Surface | Impact |
|---|---|
| Auth | Real Google OAuth must support admin sign-in in local development and still route through app-owned member authorization. |
| Session lifecycle | Signed-in members need a visible logout/sign-out path so they can end the Better Auth session and switch Google accounts when needed. |
| Access gate | The current homepage sign-in gate remains the entry surface unless later prototype/design selects a dedicated login route. |
| Member management | `/members` changes from placeholder to an admin-only member invitation and management surface. |
| Invitation workflow | Admin needs a way to invite members, likely by Google email for the MVP unless domain discovery selects invite links. |
| Account linking | A Google OAuth identity must map to a pre-invited active or invited member before household data is available. |
| Member profile | Signed-in members have a display name and avatar. Defaults come from Google profile data; the app-owned member display name controls what everyone sees inside the product, while avatar remains Google-owned for this slice. |
| Roles/permissions | Admin controls who can become a member and what role/capability they receive. Non-admins cannot invite or manage members. |
| Data | Existing `Member.status = invited | active | disabled`, `googleAccountEmail`, roles, and Better Auth user/account tables are directly involved. |
| Tests | Automated tests must continue to run without real Google OAuth credentials by using controlled-auth fixtures; real Google OAuth remains a local manual smoke check. |
| Release readiness | Local readiness must distinguish automated controlled-auth coverage from real Google OAuth plus invitation smoke evidence. |
| Documentation | README needs setup/smoke steps for first admin Google account and invited-member join flow. |

## Current Code Signals

- `src/app/dashboard-access-screen.tsx` is not a dedicated `/login` page; it is the blocked homepage/access-gate state.
- `src/app/auth/google/route.ts` starts Google sign-in through Better Auth.
- `src/app/api/auth/[...all]/route.ts` handles Better Auth callback routes.
- No dedicated logout route or visible sign-out action was observed during intake; this slice should decide and add one.
- `src/modules/identity-access/session-access.ts` already resolves Google subject first, then normalized email.
- `src/modules/identity-access/member-management.ts` already contains member invitation language and `invited`, `active`, `disabled` statuses.
- `Member.displayName` already exists in the domain/schema and is used in dashboard/profile read models.
- Better Auth `User` rows include `name`, `email`, and `image`, which can provide Google profile defaults for display name and avatar.
- `src/app/members/page.tsx` is currently a placeholder stating that member invitations and permissions will live there.
- `prisma/schema.prisma` already has `Member.googleAccountEmail`, `Member.googleSubject`, `Member.status`, role assignments, and Better Auth tables.
- Existing E2E uses controlled-auth headers; this must remain independent from real Google OAuth credentials.

## Domain Discovery Need

- required: true
- scope: targeted Identity and Access / Member Management backfill
- decisions_to_capture:
  - Whether MVP invitation is email-based, invite-link-based, first-login approval, or manual account creation.
  - Whether a member becomes active immediately when the invited Google email first signs in, or remains invited pending admin approval.
  - How Google profile defaults populate app-owned member `displayName` and avatar on first link.
  - Admin can edit member display names but cannot edit avatars.
  - Members cannot edit their own display name in this slice; self-service profile editing is deferred.
  - How first admin bootstrap works in local development.
  - Whether invited members receive default `general_member` role or admin-selected role at invite time.
  - Whether admins can resend, cancel, disable, or reactivate invitations in this slice.
  - Whether a dedicated `/login` route is needed, or the homepage sign-in gate remains sufficient for MVP.
  - Where logout belongs in the authenticated UI and how it returns the user to the sign-in surface.
- reason: Invitation and account linking are membership lifecycle and authorization policies, not just OAuth plumbing.

## Foundation Architecture Need

- required: false
- reason: The app already has Next.js App Router, Better Auth, Prisma/PostgreSQL, a member schema, dashboard route frame, protected routes, and test infrastructure.

## Foundation Implementation Need

- required: false
- reason: Existing app foundation and test foundation are sufficient. This is a feature/domain slice, not a framework or scaffold decision.

## Experience Prototype Need

- required: true
- timing: after targeted Domain Discovery
- reason: Admin invitation is a user-facing workflow. The current `/members` placeholder needs a real production-stack prototype covering invite form, member list/status, permission defaults, blocked non-admin state, and invited-member join/account-link states.
- user_facing_surfaces:
  - homepage sign-in gate or optional dedicated login route decision
  - `/members` admin member management page
  - invite member form
  - member status/profile list with display names and avatars
  - admin display-name edit state
  - invited/unlinked/inactive access states
  - local OAuth setup/error states where needed

## Behavior Spec / BDD / E2E Need

- required: true
- timing: after Experience Prototype
- reason: This slice changes authentication, membership lifecycle, admin-only authorization, persistence, and real/manual OAuth verification.
- scenarios_to_cover:
  - Existing seeded/admin member can sign in with real Google OAuth in local development and reach dashboard.
  - Signed-in admin can log out and return to the unauthenticated sign-in surface.
  - Admin can open `/members`.
  - Non-admin members cannot invite or manage members.
  - Admin can invite a member by the selected invitation mechanism.
  - Invited or newly linked member receives default display name and avatar from Google profile data when available.
  - Everyone sees the app-owned member display name consistently in dashboard/profile/member lists and financial record attribution.
  - Admin can edit a member display name; the changed display name becomes the name all users see.
  - Non-admin members cannot edit their own display name in this slice.
  - Admin cannot edit member avatar; avatar remains sourced from Google profile data for this slice.
  - Invited member can sign in with the intended Google account and become linked according to the selected policy.
  - After logout, a user can choose a different Google account and the app re-evaluates membership for that account.
  - Wrong Google account remains blocked and cannot see household data.
  - Disabled member remains blocked.
  - Automated E2E still runs without real Google OAuth credentials through controlled-auth fixtures.
  - Real OAuth and invitation smoke steps are recorded without storing secrets or personal account details.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: Implementation needs decisions about route boundaries, server actions/API shape, membership lifecycle transitions, Prisma write shape, Google identity linking rules, admin bootstrap, E2E fixtures, and release evidence.

## Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: OAuth, membership invitations, and account linking are integration and authorization risks even for local_dev.
- learning_loop_required: false
- learning_reason: This is still local MVP enablement, not a production analytics or experiment slice.

## Open Questions

- Should the app have a dedicated `/login` route, or keep the homepage sign-in gate for MVP?
- Where should logout live: dashboard header/profile menu, sidebar footer, member menu, or another surface?
- Should logout return to `/login`, `/`, or the originally requested page in unauthenticated state?
- Should invitation be email-based for MVP, or should it generate invite links?
- When an invited Google email signs in, should the member become active automatically or require admin approval?
- How should the first admin be bootstrapped locally: seed email, explicit setup script, or first-login claim flow?
- Can admins choose role/capabilities during invite, or should invited members start as `general_member`?
- Should avatar always mirror Google profile image on each login, or be copied from Google only on first link and then remain read-only?
- Should this slice include disabling/reactivating members, or only invite and link?
- Should real email delivery be out of scope for local_dev, using copyable invite state instead?

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm the new scope supersedes the narrower local Google OAuth-only slice.
  - Confirm whether the MVP should use a dedicated login page or homepage sign-in gate.
  - Confirm the preferred invitation mode if already known: email invite, invite link, first-login approval, or manual/admin-created member.
  - Confirm whether invited users should activate automatically after Google OAuth email match.
  - Confirm display name/avatar ownership: Google defaults, app-owned display name for everyone, admin can edit display name only, and avatar is not admin-editable.
- acceptance_signals:
  - Domain Discovery can resolve invitation/linking lifecycle without inventing policy.
  - Experience Prototype can make the admin member invitation flow reviewable before implementation.
  - Automated tests can remain independent from real OAuth credentials.
- unresolved_blockers:
  - Exact invitation/linking policy must be decided before Behavior Spec and implementation.
- next_step:
  - targeted Domain Discovery
