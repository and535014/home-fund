---
id: prototype-admin-created-member-google-binding
stage: prototype
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-created-member-google-binding.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-created-member-google-binding.md
outputs:
  - production_stack_prototype
  - ux_acceptance_inputs
  - e2e_candidates
trace_links:
  routes:
    - src/app/(app)/settings/members/page.tsx
    - src/app/members/bind/page.tsx
  components:
    - src/app/(app)/settings/members/member-list.tsx
  foundation_components:
    - src/components/layout/page-layout.tsx
    - src/components/ui/avatar.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/button.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/field.tsx
    - src/components/ui/input.tsx
    - src/components/ui/item.tsx
    - src/components/ui/native-select.tsx
    - src/components/ui/tooltip.tsx
reviewed_at: 2026-06-22
---

# Admin-Created Member Google Binding Prototype

## Decision

- decision: approve
- route_strategy: replace the intended member settings route with fixture-backed prototype UI for review
- prototype_status: production-stack interactive prototype with fixture-backed state
- next_gate: Behavior Spec / BDD / E2E after approval

## Prototype Surface

| Surface | Path | Purpose |
|---|---|---|
| Member settings route | `src/app/(app)/settings/members/page.tsx` | Renders fixture-backed prototype UI directly on the intended route for review. |
| Member list component | `src/app/(app)/settings/members/member-list.tsx` | Covers admin-created member records, unbound/bound statuses, member-specific binding links, copy action, and simulated Google binding directly in the real list component. |
| Binding link page | `src/app/members/bind/page.tsx` | Covers user-facing valid, missing, expired, invalid, and used binding-link states without exposing household data. |

## Review URL

- Prototype: `http://localhost:3000/settings/members`
- Expired link page: `http://localhost:3000/members/bind?token=preview-expired&state=expired`

Run command:

```sh
corepack pnpm dev
```

## UX Direction

- Keep member management under settings at `/settings/members` and prototype directly on that route.
- Use `建立成員` as the primary action instead of inviting first.
- Creation captures app-owned display name and role before Google is linked.
- A newly created member starts unbound and cannot access household data.
- Admin can generate a member-specific binding link after creation.
- Binding account work is handled from one row action that opens a modal; the modal confirms link generation, shows the generated link and expiry, and provides copy.
- Bound members show Google avatar/profile presence; unbound members use app-owned initials.
- Expired binding links show as `已失效` to admins and can be regenerated from the binding modal.
- Disabled members remain visible as blocked examples and cannot use old links.
- The prototype uses `/members/bind?token=...` as a clearer route candidate; Behavior Spec and Technical Design still need to decide whether to replace the existing `/invite/accept?token=...` route.

## States Covered

| State | Prototype Coverage |
|---|---|
| Existing bound admin | Fixture row shows `已綁定`, admin role, and Google-sourced avatar. |
| Unbound member | Fixture row shows `未綁定` and an action to generate a binding link. |
| Link generated | Fixture row shows `待綁定`; opening the binding modal shows the link, expiry, copy action, and simulated bind action. |
| Link expired | Fixture row shows `已失效`; opening the binding modal explains that the link expired and offers regeneration. |
| Create member | Header action opens a dialog with display-name and role controls; submit adds an unbound member locally. |
| Create member success | Submit closes the create-member dialog and shows a success toast; link generation happens from the member row binding action. |
| Binding completed | Simulated bind action changes the member to `已綁定`, clears link, and shows avatar. |
| Disabled blocked member | Fixture row shows disabled status and blocked copy explaining old links cannot bind. |
| User opens expired link | `/members/bind?token=preview-expired&state=expired` shows a destructive alert and a login-page return action without exposing app data. |

## Fixture Strategy

- Prototype state is local client state inside `MemberList` only.
- Fixtures include one bound admin, one unbound general member, one link-generated finance manager, and one disabled member.
- Generated links are preview-only `/members/bind?token=preview-bind-...` URLs.
- Expired/error link states are query-driven fixtures on `/members/bind`.
- The real server action `createMemberInvitationAction` and current invitation persistence are not used by this prototype.
- No backend member creation, token persistence, Google OAuth callback handling, or email delivery is implied.

## Responsive Baseline

- Desktop: member rows render in a responsive grid with compact icon actions.
- Tablet/mobile: cards collapse to one or two columns; row text wraps and actions remain icon-only with tooltips.
- Dialog forms keep stable field widths and do not require horizontal scrolling.

## Focus And Accessibility

- Header action and row actions are real buttons with accessible labels.
- Icon actions use tooltips for generate, copy, and simulated binding.
- Dialogs use the existing Radix-backed `Dialog` component for focus handling.
- Form controls have explicit labels.
- Avatar fallback keeps unbound member rows visually identifiable without implying Google is linked.

## UX Acceptance Inputs

- Admin can see which members are unbound, waiting for binding, bound, or disabled.
- Admin can create a member before any Google account is linked.
- Admin can open a single binding modal for an unbound member, generate a binding link, review its expiry, and copy it again before the member binds.
- Admin can identify an expired binding link and regenerate it from the same binding modal.
- A member opening an expired link sees a safe, user-facing error page and is directed to request a new link from the admin.
- A generic invitation link is no longer the primary onboarding model.
- The UI makes clear that Google binding happens after app-owned member creation.
- Disabled and already-bound states must not allow stale link binding in later behavior specs.

## E2E Candidates

- `GET /settings/members` renders `建立成員` with fixture-backed member data.
- Creating a member adds an unbound row with status `未綁定`.
- The created-member success dialog can generate a binding link.
- A link-generated row exposes copy and simulated-bind controls.
- Simulated binding changes the row to `已綁定`.
- Disabled fixture row renders blocked-state copy and no active binding affordance.
- Expired fixture row renders `已失效` and can regenerate a link.
- `GET /members/bind?token=preview-expired&state=expired` renders `綁定連結無法使用` and does not show household data.

## Known Gaps

- Prototype is not persisted and intentionally avoids backend server actions.
- Binding route name, token lifecycle, regeneration, revocation, expiry, and one-time reveal policy remain open.
- Real `/settings/members` is temporarily replaced by the fixture-backed prototype in this gate; Behavior Spec, Technical Design, and TDD Implementation still need to approve and implement persisted behavior.
- Real Google OAuth callback binding and already-bound-account conflict handling are not implemented in this gate.
- Production email delivery and production OAuth readiness remain out of scope.
- Implementation should audit all form field validation messages and standardize field-level errors on `FieldError` instead of using description text for errors.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `/settings/members` is the right surface for admin-created membership.
  - Confirm `建立成員 -> 產生綁定連結 -> 使用者 Google 綁定` is the intended task flow.
  - Confirm whether `/members/bind?token=...` is acceptable as the route candidate or whether the existing `/invite/accept?token=...` route should be reused.
  - Confirm role selection at member creation should stay in scope.
- must_check:
  - Prototype uses production route/component paths.
  - Fixture-only behavior is explicit and does not imply persistence.
  - Prototype uses fake data and does not imply backend persistence.
- unresolved_blockers:
  - Behavior Spec must decide status naming, route naming, token reveal/copy/regenerate/revoke policy, and blocked binding scenarios.
- next_step:
  - Behavior Spec / BDD / E2E
