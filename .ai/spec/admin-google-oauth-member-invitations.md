---
id: spec-admin-google-oauth-member-invitations
stage: spec
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-google-oauth-member-invitations.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-google-oauth-member-invitations.md
  - .ai/prototype/admin-google-oauth-member-invitations.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  routes:
    - src/app/login/page.tsx
    - src/app/invite/accept/page.tsx
    - src/app/members/page.tsx
    - src/app/auth/google/route.ts
    - src/app/api/auth/[...all]/route.ts
  components:
    - src/app/members/member-management-prototype.tsx
    - src/app/dashboard-route-frame.tsx
    - src/app/home-dashboard-layout.tsx
  ui_components:
    - src/components/ui/avatar.tsx
    - src/components/ui/button.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/field.tsx
    - src/components/ui/input.tsx
    - src/components/ui/item.tsx
    - src/components/ui/tooltip.tsx
  auth_domain:
    - src/auth/google-sign-in.ts
    - src/auth/server-current-member.ts
    - src/modules/identity-access/session-access.ts
    - src/modules/identity-access/member-management.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-19
---

# Admin Google OAuth And Member Invitations Behavior Spec

## Decision

- decision: awaiting_approval
- prototype_status: accepted as Behavior Spec input
- route_scope: `/login`, `/invite/accept`, `/members`, Google OAuth start/callback, logout
- next_gate: Feature Technical Design
- next_skill: feature-technical-design

## Final Acceptance Criteria

1. Existing members use `/login` as the general sign-in surface.
2. `/login` shows the product description `和家庭成員一起記錄支出、收入與退款，整理每月共用金流。`
3. `/login` shows one Google sign-in action labeled `使用 Google 登入`.
4. Invitation links use `/invite/accept?token=<token>` and do not reuse `/login`.
5. `/invite/accept` shows invitation-specific copy and one Google sign-in action labeled `使用 Google 登入`.
6. `/invite/accept` does not show a secondary general-login action.
7. `/invite/accept` blocks the Google sign-in action and shows an error when the invitation token is missing.
8. Starting Google sign-in from an invitation keeps enough invitation context for the callback/linking flow to continue.
9. A seeded or previously linked admin can sign in with real Google OAuth in local development and reach authenticated household pages.
10. Automated E2E coverage does not require real Google OAuth secrets; it uses controlled-auth fixtures for admin, finance manager, and general member paths.
11. Admin members can open `/members`.
12. Non-admin members cannot invite members or edit member display names.
13. The member management page shows invite action in the page header only for admins.
14. The member management page does not show default `新增收入` or `新增支出` actions.
15. The member grid renders one column on mobile, two columns on small screens, and three columns on desktop.
16. The member grid uses direct `Item` rows, not cards or a card-wrapped list.
17. Member rows show Google-sourced avatars through the shared `Avatar` component.
18. Member rows show app-owned display name and role badges on the same identity row.
19. Member rows show member status separately below the identity row.
20. Member rows do not show Google profile name or Google email as metadata.
21. Disabled-member states and disable/reactivate controls are not exposed in this slice.
22. Admins invite members by entering only a Google email in a modal.
23. Invite submit rejects invalid email and duplicate member email with toast feedback.
24. Successful invite creation keeps the dialog open and shows a generated invitation link.
25. Successful invite creation does not show a success toast because the generated link is the success state.
26. The generated invitation link appears in a read-only input with an icon-only copy button.
27. Copying an invitation link shows success feedback; copy failure shows error feedback.
28. Invited member rows expose an icon-only action to copy the existing invitation link again.
29. Icon-only actions have accessible names and hover tooltips.
30. New invited members start with the `general_member` role.
31. Admins can edit a member display name.
32. Display-name edit rejects blank names with toast feedback.
33. Saved display-name changes are visible in the member list and become the app-owned name all users see.
34. Admins cannot edit member avatars in this slice.
35. Non-admin members cannot edit their own display name in this slice.
36. Logout is available from the sidebar footer as a ghost button.
37. Logout returns the user to `/login`.
38. The authenticated `/members` route filters out existing disabled members from this prototype view.
39. A valid invitation token plus the intended Google identity activates or links the invited member without adding a separate admin approval step for this MVP slice.
40. A wrong Google account for an invitation remains blocked from household data.

## BDD Scenarios

### Scenario: Existing Member Starts General Google Sign-In

- Given a visitor opens `/login`
- Then the page describes the household fund website
- And the page shows `使用 Google 登入`
- And the page does not mention invitation acceptance
- When the visitor submits Google sign-in
- Then the app starts Google OAuth through the configured auth route

### Scenario: Invited User Opens Invitation Link

- Given an invitation link has a token
- When the invited user opens `/invite/accept?token=preview-token`
- Then the page title is `接受成員邀請`
- And the page shows invitation-specific copy
- And the page shows `使用 Google 登入`
- And no `一般登入` action is shown
- When the invited user starts Google sign-in
- Then the invitation token is preserved for the linking flow

### Scenario: Invitation Link Missing Token

- Given a visitor opens `/invite/accept`
- Then an error explains that the invitation link is missing a token
- And the Google sign-in action is disabled

### Scenario: Admin Opens Member Management

- Given an authenticated household member with admin role
- When the member opens `/members`
- Then the page shows an `邀請成員` header action
- And the member grid is visible
- And the page does not show `新增收入` or `新增支出`
- And the sidebar footer shows `登出`

### Scenario: Non-Admin Cannot Manage Members

- Given an authenticated household member without admin role
- When the member opens `/members`
- Then a denied state is shown
- And invite controls are not visible
- And display-name edit controls are not visible

### Scenario: Admin Creates Invitation Link

- Given an admin is on `/members`
- When the admin activates `邀請成員`
- Then an invite modal opens
- And the modal asks only for `Google email`
- When the admin enters a new valid Google email and submits
- Then an invited member appears in the member grid with status `已邀請`
- And a generated invitation link is shown in the dialog
- And no success toast is shown for link creation

### Scenario: Admin Copies Generated Invitation Link

- Given an admin has generated an invitation link
- When the admin activates the copy icon beside the link
- Then the invitation link is copied to the clipboard
- And a toast confirms the copy result

### Scenario: Admin Copies Existing Invitation Again

- Given an invited member is visible in the member grid
- When the admin activates that row's copy invitation icon
- Then the invited member's invitation link is copied
- And a toast confirms the copy result

### Scenario: Duplicate Or Invalid Invite Is Rejected

- Given an admin is entering an invitation
- When the email is invalid
- Then the modal remains open
- And an error toast asks for a valid Google email
- When the email already belongs to an existing member
- Then the modal remains open
- And an error toast explains that the email already exists

### Scenario: Admin Edits Display Name

- Given an admin sees a member row
- When the admin activates `修改顯示名稱`
- Then a display-name dialog opens
- When the admin enters a non-empty name and saves
- Then the member row shows the new display name
- And a toast confirms the update

### Scenario: Avatar Is Read-Only

- Given an admin sees member rows
- Then avatars are visible
- And there is no avatar edit action

### Scenario: Logout Returns To General Sign-In

- Given an authenticated member is using the dashboard
- When the member activates `登出` in the sidebar footer
- Then the session ends
- And the browser returns to `/login`

### Scenario: Invited Member Links With Google

- Given an invited member opens a valid invitation link
- When the member signs in with the intended Google account
- Then the app links the Google identity to the invited member
- And the member becomes active for this MVP slice
- And the member profile display name and avatar initialize from Google profile data when available

### Scenario: Wrong Google Account Is Blocked

- Given an invitation was created for one Google email
- When a different Google account completes sign-in through the invitation flow
- Then the app does not link that identity to the invited member
- And household data remains inaccessible

## E2E Design

| Scenario | Route | Actor Fixture | Viewport | Selectors And Expected States |
|---|---|---|---|---|
| General login | `/login` | unauthenticated | desktop and mobile | product description visible; button `使用 Google 登入`; no invitation copy. |
| Invitation accept | `/invite/accept?token=preview-token` | unauthenticated | desktop and mobile | heading `接受成員邀請`; copy references invitation; button `使用 Google 登入`; no `一般登入`. |
| Invitation missing token | `/invite/accept` | unauthenticated | desktop | destructive alert visible; Google sign-in button disabled. |
| Admin member management | `/members?previewRole=admin` | admin preview | desktop | `邀請成員` header action visible; 3-column member grid at desktop width; sidebar footer `登出`; no create-record actions. |
| Non-admin member management | `/members?previewRole=member` | member preview | desktop | denied heading visible; no `邀請成員`; no display-name edit buttons. |
| Create invitation link | `/members?previewRole=admin` | admin preview | desktop | open `邀請成員`; field `Google email`; submit `建立邀請連結`; dialog shows `邀請連結已建立`; read-only input appears; no success toast required. |
| Copy generated invite link | `/members?previewRole=admin` | admin preview | desktop | copy icon by accessible name `複製邀請連結`; toast `邀請連結已複製`. |
| Re-copy existing invite link | `/members?previewRole=admin` | admin preview | desktop | existing invited row has button `複製 Kai 的邀請連結`; tooltip `複製邀請連結`; copy toast visible. |
| Invite validation | `/members?previewRole=admin` | admin preview | desktop | invalid email toast; duplicate email toast; modal remains open. |
| Display-name edit | `/members?previewRole=admin` | admin preview | desktop | button `修改 <display name> 的顯示名稱`; dialog `修改顯示名稱`; save updates row; blank name toast. |
| Mobile member management | `/members?previewRole=admin` | admin preview | mobile | member grid stacks to one column; item row remains readable; icon-only actions have accessible names. |

### Fixture And Mock Strategy

- Use the existing controlled-auth / preview fixture path for automated E2E; no real Google OAuth credentials are required in CI.
- Preview admin includes active admin, active finance manager, and invited general member.
- Preview does not include disabled members because disable/reactivate is out of scope for this slice.
- Real OAuth local smoke uses redacted personal emails and local environment variables only.
- Invitation links in automated tests can use deterministic preview tokens; production-grade token entropy, expiry, and revocation are technical-design concerns.

### Accessible Selectors

- `/login` heading: `使用 Google 登入`.
- `/login` Google sign-in button: `使用 Google 登入`.
- `/invite/accept` heading: `接受成員邀請`.
- `/invite/accept` Google sign-in button: `使用 Google 登入`.
- Invite action: button `邀請成員`.
- Invite modal title: `邀請成員`.
- Invite email field: label `Google email`.
- Invite link result title: `邀請連結已建立`.
- Invite link input: label `邀請連結`.
- Copy generated link: button `複製邀請連結`.
- Copy existing invited link: button `複製 <display name> 的邀請連結`.
- Edit display name: button `修改 <display name> 的顯示名稱`.
- Edit dialog title: `修改顯示名稱`.
- Logout: link or button `登出`.
- Tooltip text for icon-only buttons: `複製邀請連結`, `修改顯示名稱`.

### Responsive And Accessibility Checks

- Desktop: member grid uses three columns at `lg` and wider.
- Tablet/small: member grid uses two columns at `sm`.
- Mobile: member grid uses one column and row actions remain reachable.
- Dialog focus is trapped by the Radix-backed `Dialog` component.
- Icon-only buttons have accessible names and hover tooltips.
- Avatar uses the shared `Avatar` component with alt text and fallback.
- Toasts are used for validation errors, copy feedback, and display-name save feedback; invite creation success is represented by the link result UI.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/unit | Admin-only invitation creation; non-admin invitation rejected. |
| Domain/unit | Invite email validation and duplicate email rejection. |
| Domain/unit | Invitation token lookup, expiry/revocation decision, and matching Google email policy. |
| Domain/unit | Valid invitation plus intended Google account links and activates the invited member for this MVP slice. |
| Domain/unit | Wrong Google account remains blocked. |
| Domain/unit | Display-name default from Google profile and admin override; blank display name rejected. |
| Domain/unit | Avatar is initialized from Google profile and remains non-admin-editable in this slice. |
| Integration | Google sign-in start route preserves invitation context from `/invite/accept`. |
| Integration | Logout ends the Better Auth/app session and returns to `/login`. |
| Route/server action | `/members` denies non-admin member management and mutation attempts server-side. |
| E2E | General login, invitation accept page, admin invite link generation/copy/re-copy, display-name edit, non-admin denied, responsive grid. |
| Manual local_dev | Real Google OAuth admin smoke; invitation link accept smoke with redacted test account; logout/switch-account smoke. |

## Technical Design Inputs

- Decide invitation persistence model: token table/fields, token entropy, expiry, revocation, single-use policy, and audit trail.
- Decide how `/auth/google` receives and stores invitation context through Better Auth callback.
- Decide callback behavior for valid token + intended Google identity, expired token, revoked token, already-used token, and wrong Google account.
- Decide first admin bootstrap for local development.
- Decide where Google avatar URL is stored or read from, and whether it syncs every login or only on first link.
- Decide server action/API contracts for invite creation, copy/retrieve invite link, display-name update, and logout.
- Decide whether disabled member data remains filtered from member management views or is handled by a later dedicated member lifecycle slice.
- Keep non-production preview role query and prototype-only local invite links out of production behavior.

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm invite-link flow and `/invite/accept` route are the final MVP direction.
  - Confirm invited members activate automatically after valid invite token plus intended Google identity.
  - Confirm disabled-member management is out of scope for this slice.
  - Confirm `/login` and `/invite/accept` copy and routes are acceptable.
  - Confirm controlled-auth E2E plus manual real OAuth smoke is the right test split.
- must_check:
  - AC covers login, invitation accept, admin-only member management, link generation/copy/re-copy, display-name edit, avatar read-only, logout, non-admin denial, and responsive/accessibility requirements.
  - BDD scenarios use domain language and avoid implementation detail except where UI behavior is the contract.
  - E2E design names routes, fixtures, selectors, viewport expectations, tooltip/copy feedback, and controlled-auth constraints.
- unresolved_blockers:
  - None if automatic activation on valid invitation is accepted.
  - If admin approval after invited sign-in is required instead, Behavior Spec must be revised before Feature Technical Design.
- next_step:
  - Feature Technical Design
