---
id: prototype-admin-google-oauth-member-invitations
stage: prototype
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-google-oauth-member-invitations.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-google-oauth-member-invitations.md
outputs:
  - production_stack_prototype
  - ux_acceptance_inputs
  - e2e_candidates
trace_links:
  routes:
    - src/app/login/page.tsx
    - src/app/invite/accept/page.tsx
    - src/app/members/page.tsx
  components:
    - src/app/members/member-management-prototype.tsx
    - src/app/dashboard-route-frame.tsx
    - src/app/home-dashboard-layout.tsx
  foundation_components:
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/field.tsx
    - src/components/ui/input.tsx
    - src/components/ui/item.tsx
    - src/components/ui/badge.tsx
reviewed_at: 2026-06-19
---

# Admin Google OAuth And Member Invitations Prototype

## Decision

- decision: proceed
- route_strategy: add dedicated `/login` candidate and update intended `/members` route
- prototype_status: production-stack interactive prototype
- next_gate: Behavior Spec / BDD / E2E

## Prototype Surface

| Surface | Path | Purpose |
|---|---|---|
| General sign-in candidate | `src/app/login/page.tsx` | Existing members sign in with Google without invitation-specific copy. |
| Invitation accept candidate | `src/app/invite/accept/page.tsx` | Invited users open an invitation link, see invitation-specific copy, and start Google sign-in with the invitation token preserved in the form. |
| Member management page | `src/app/members/page.tsx` | Replace placeholder with route-level prototype using dashboard shell and protected route context. |
| Interactive member panel | `src/app/members/member-management-prototype.tsx` | Header invite action opening an invite form modal, member list with avatars/status/roles, admin display-name edit dialog, denied non-admin state, sidebar logout CTA. |

## Review URLs

- Admin preview: `http://localhost:3000/members?previewRole=admin`
- Non-admin preview: `http://localhost:3000/members?previewRole=member`
- Login candidate: `http://localhost:3000/login`
- Invitation accept candidate: `http://localhost:3000/invite/accept?token=preview-existing-kai.invited%40example.com`
- Real route after auth: `http://localhost:3000/members`

Run command:

```sh
corepack pnpm dev
```

## UX Direction

- Use `/login` for existing-member general sign-in.
- Use `/invite/accept?token=...` for invitation links so invite copy, token handling, expiry/revocation states, and wrong-account handling can evolve separately from general login.
- Keep the existing homepage sign-in gate available as current behavior until Behavior Spec/technical design chooses final routing.
- Put admin member management on `/members`, not a prototype-only route.
- Show logout as both a session lifecycle concept and a reviewable CTA; final Better Auth sign-out wiring is intentionally not implemented in prototype.
- Put invite entry in the page header action area; the flow is invite button -> Google email form modal -> generated invitation link -> quick copy confirmation.
- Keep the invite modal focused on Google email only; admins do not set a default display name during invitation.
- Put logout in the sidebar footer instead of the page header.
- Render members as individual cards without an outer wrapping card, extra list title, or list description.
- Use Item rows directly in the member grid, without wrapping them in Card.
- Use the shared Avatar component inside member items, with token-based fallback and border styling.
- Keep member name and role badges on the same identity row; show status separately below.
- Use app-owned display name as the prominent member name.
- Do not show Google profile name or email as a separate metadata line in member cards.
- Show avatar as Google-sourced and read-only; no edit avatar control appears.
- Do not expose disabled-member states or controls in this prototype stage.

## States Covered

| State | Prototype Coverage |
|---|---|
| Admin member management | `previewRole=admin` shows invite header action, invite modal, member list with per-member status badges, display-name edit, logout CTA. |
| Non-admin denied | `previewRole=member` shows a denied card and no invite/edit controls. |
| Invite success | Header invite button opens a form modal; submitting valid Google email adds an invited member locally, keeps the dialog open, and shows a generated invitation link. |
| Re-copy invite link | Invited member rows show a copy invitation link action so admins can resend an existing invite. |
| Invite validation | Invalid email and duplicate email keep the modal open and show toast errors. |
| Display-name edit | Edit icon opens dialog; saving updates app-owned display name locally and shows a toast. |
| Avatar read-only | Avatar is visible but has no edit action. |
| Logout review | Logout CTA sits in the sidebar footer and links to `/login` for account switching review. |
| General login candidate | `/login` shows a concise product description, a Google sign-in card, and POSTs to `/auth/google`. |
| Invitation accept candidate | `/invite/accept?token=...` shows invitation-specific copy, validates token presence in the prototype UI, and POSTs to `/auth/google` with the invite token as a hidden field. |

## Fixture Strategy

- Prototype uses route-local fixture members for preview mode:
  - active admin
  - active finance manager
  - invited general member
- Fixture avatars are generated from email seeds to represent Google profile images without storing personal assets.
- The authenticated real `/members` path maps current dashboard members into the same prototype component but still does not persist invite or edit actions.
- No backend invitation, Better Auth logout, avatar persistence, or email delivery is implied by prototype interactions.

## Responsive Baseline

- Desktop: invite action sits in the header action area and opens a modal; member items render in a three-column grid without an extra list container.
- Mobile: sections stack, item rows preserve avatar, labels, status, and edit icon without requiring horizontal scrolling.
- Mobile logout remains available from the sidebar footer.

## Focus And Accessibility

- Invite header action is a button; the Google email field and generated invitation link live in a dialog and use explicit labels.
- Invitation link result uses a read-only input and a copy button with an accessible label.
- Invited member rows include a per-member copy invitation link button with an accessible label.
- Icon-only buttons show hover tooltips describing the action.
- Display-name edit action has per-member accessible names.
- Dialog uses existing Radix-backed `Dialog` component for focus trap and close behavior.
- Avatar image containers expose `role="img"` and descriptive labels.
- Non-admin denied state has a named card heading.
- Toasts are used for copy confirmation and validation errors; the generated invitation link is the success state for invite creation.

## UX Acceptance Inputs

- Admin can review each member status directly in the member list on `/members`.
- Admin can invite by Google email through header action -> form modal -> generated invitation link -> quick copy confirmation.
- Admin can copy an existing invitation link again from an invited member row.
- Admin can edit app-owned display name and cannot edit avatar.
- Non-admin members cannot access invite or display-name edit controls.
- Sign-in copy asks users to use an invited Google account without explaining internal authorization policy.
- Logout is visible enough to support switching Google accounts during review and future smoke tests.

## E2E Candidates

- `GET /login` renders the general sign-in candidate with `使用 Google 登入`.
- `GET /invite/accept?token=preview-token` renders the invite accept candidate with `使用 Google 登入`.
- `GET /members?previewRole=admin` renders invite header action, member list, Google avatar labels, edit display-name buttons, and sidebar logout CTA.
- Admin preview can add an invited member, see status `已邀請`, see the generated invitation link, and copy it quickly.
- Admin preview can copy the invitation link again from an existing `已邀請` row.
- Admin preview can edit a display name and see the row update.
- `GET /members?previewRole=member` renders denied state and no invite button.
- Real authenticated `/members` should use controlled-auth admin fixture in later BDD/E2E and remain independent of real Google OAuth credentials.

## Known Gaps

- Prototype is not persisted; invite and edit actions mutate local component state only.
- Invitation links are preview-only local URLs; real token format, expiry, revocation, and accept route behavior remain for Behavior Spec and Technical Design.
- Real Better Auth sign-out is not wired.
- Real Google OAuth callback invite-token consumption, first admin bootstrap, invited-member activation, and avatar sync/copy policy remain for Behavior Spec and Technical Design.
- Real email delivery is not represented.
- `/login` and `/invite/accept` are route candidates; Behavior Spec should decide final callback, token, and wrong-account behavior.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm dedicated `/login` route is the preferred general sign-in surface.
  - Confirm `/invite/accept` route behavior for invitation links.
  - Confirm `/members` layout supports admin invitation and display-name management.
  - Confirm avatar read-only behavior is clear.
  - Confirm logout placement is sufficient for MVP review.
- must_check:
  - Prototype uses production route/component paths.
  - Fixture-only behavior is explicit and does not imply persistence.
  - Non-admin denied state and automated-test independence remain visible.
- unresolved_blockers:
  - Behavior Spec must decide invited-member activation policy and final sign-out route behavior.
- next_step:
  - Behavior Spec / BDD / E2E
