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
| Dedicated sign-in candidate | `src/app/login/page.tsx` | Review whether login should be a dedicated route instead of only homepage blocked state. |
| Member management page | `src/app/members/page.tsx` | Replace placeholder with route-level prototype using dashboard shell and protected route context. |
| Interactive member panel | `src/app/members/member-management-prototype.tsx` | Invite-by-email form, member list with avatars/status/roles, admin display-name edit dialog, denied non-admin state, logout CTA. |

## Review URLs

- Admin preview: `http://localhost:3000/members?previewRole=admin`
- Non-admin preview: `http://localhost:3000/members?previewRole=member`
- Login candidate: `http://localhost:3000/login`
- Real route after auth: `http://localhost:3000/members`

Run command:

```sh
corepack pnpm dev
```

## UX Direction

- Use a dedicated `/login` route as the prototype candidate because invitation, wrong-account, logout, and switching-account flows need a stable sign-in destination.
- Keep the existing homepage sign-in gate available as current behavior until Behavior Spec/technical design chooses final routing.
- Put admin member management on `/members`, not a prototype-only route.
- Show logout as both a session lifecycle concept and a reviewable CTA; final Better Auth sign-out wiring is intentionally not implemented in prototype.
- Use app-owned display name as the prominent member name.
- Show Google source metadata below display name so reviewers can see the distinction between app display name and Google profile name.
- Show avatar as Google-sourced and read-only; no edit avatar control appears.

## States Covered

| State | Prototype Coverage |
|---|---|
| Admin member management | `previewRole=admin` shows invite form, member list, status summary, display-name edit, logout CTA. |
| Non-admin denied | `previewRole=member` shows a denied card and no invite/edit controls. |
| Invite success | Submitting valid Google email adds an invited member locally and shows a toast. |
| Invite validation | Invalid email and duplicate email show toast errors. |
| Display-name edit | Edit icon opens dialog; saving updates app-owned display name locally and shows a toast. |
| Avatar read-only | Avatar is visible but has no edit action. |
| Logout review | Logout CTA links to `/login` in the shell and shows a prototype toast in the member panel. |
| Login candidate | `/login` shows sign-in copy and POSTs to `/auth/google`. |

## Fixture Strategy

- Prototype uses route-local fixture members for preview mode:
  - active admin
  - active finance manager
  - invited general member
  - disabled general member
- Fixture avatars are generated from email seeds to represent Google profile images without storing personal assets.
- The authenticated real `/members` path maps current dashboard members into the same prototype component but still does not persist invite or edit actions.
- No backend invitation, Better Auth logout, avatar persistence, or email delivery is implied by prototype interactions.

## Responsive Baseline

- Desktop: invite form and member list use a two-column operational layout for repeated admin work.
- Mobile: sections stack, item rows preserve avatar, labels, status, and edit icon without requiring horizontal scrolling.
- Mobile logout remains visible through the session lifecycle card even though the header logout CTA is desktop-only in this prototype.

## Focus And Accessibility

- Invite fields use explicit labels.
- Display-name edit action has per-member accessible names.
- Dialog uses existing Radix-backed `Dialog` component for focus trap and close behavior.
- Avatar image containers expose `role="img"` and descriptive labels.
- Non-admin denied state has a named card heading.
- Toasts are supplementary feedback; form and dialog labels remain the primary interaction affordances.

## UX Acceptance Inputs

- Admin can review all member statuses on `/members`.
- Admin can invite by Google email in the prototype.
- Admin can edit app-owned display name and cannot edit avatar.
- Non-admin members cannot access invite or display-name edit controls.
- Sign-in copy makes clear Google proves identity, while app membership controls access.
- Logout is visible enough to support switching Google accounts during review and future smoke tests.

## E2E Candidates

- `GET /login` renders the dedicated sign-in candidate with `使用 Google 登入`.
- `GET /members?previewRole=admin` renders invite form, member list, Google avatar labels, edit display-name buttons, and logout CTA.
- Admin preview can add an invited member and see status `已邀請`.
- Admin preview can edit a display name and see the row update.
- `GET /members?previewRole=member` renders denied state and no invite button.
- Real authenticated `/members` should use controlled-auth admin fixture in later BDD/E2E and remain independent of real Google OAuth credentials.

## Known Gaps

- Prototype is not persisted; invite and edit actions mutate local component state only.
- Real Better Auth sign-out is not wired.
- Real Google OAuth callback, first admin bootstrap, invited-member activation, and avatar sync/copy policy remain for Behavior Spec and Technical Design.
- Real email delivery is not represented.
- `/login` is a route candidate; Behavior Spec should decide whether it becomes the final sign-in destination.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm dedicated `/login` route is the preferred sign-in surface.
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
