---
id: admin-created-member-google-binding
stage: intent-intake
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: feature_change
inputs:
  - user_prompt:2026-06-22-admin-created-member-google-binding
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/domain/home-family-fund.md
  - .ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md
  - .ai/intent/admin-google-oauth-member-invitations.md
  - .ai/spec/story-admin-member-management.md
outputs:
  - intent_intake
  - lifecycle_routing_decision
trace_links:
  supersedes_or_refines:
    - .ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md
    - .ai/intent/admin-google-oauth-member-invitations.md
  bounded_contexts:
    - Identity and Access
    - Responsive Web Experience
  current_domain:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-22
---

# Intent Intake: Admin-Created Member Google Binding

## Intent

Member onboarding should change to an admin-created member model. Admins create the member record first, then generate a link for that specific member. The real user opens the link, signs in with Google, and binds their Google identity to the pre-created member record.

User request: "成員改成統一由管理者建立，建立後可以產生連結，讓實際的使用者透過 Google 登入綁定"

## Classification

- project_type: feature_change
- affected_surfaces: `/members` admin member management, member creation form, member list/status display, bind-link generation, bind-link acceptance route, Google OAuth callback/linking, access gate, auth/session checks, Prisma member/invitation data, tests, local_dev release readiness
- target_users: admins who manage household membership; household users who receive a binding link and complete Google sign-in
- business_outcome: make household membership explicit and admin-owned before any user signs in, so the app can control member names, roles, and access independently from whoever receives a generic invitation link.

## Scope

In scope:

- Replace or refine the current invitation model so every new member starts as an admin-created member record.
- Let admins generate a binding link for a specific unbound member after creation.
- Let the actual user open the link and use Google login to bind that Google account to the pre-created member.
- Preserve app-owned member display name, role, and status as admin-managed data.
- Prevent a binding link from granting access to an arbitrary new member not already created by an admin.
- Block already-bound, disabled, expired, invalid, or reused binding links.
- Keep Google identity as proof of user identity while app-owned membership decides household access.
- Keep automated tests independent from real Google OAuth credentials through controlled-auth fixtures.

Out of scope:

- Real email delivery for binding links.
- Multi-household membership.
- Self-service member signup without admin-created member records.
- Self-service profile editing.
- Production release readiness, production OAuth callback validation, monitoring, and rollback.
- External identity provider support beyond Google.

## Current Context

- The completed admin Google OAuth/member invitation slice currently supports `/login`, `/members`, and `/invite/accept?token=...`.
- That completed slice used account-agnostic invitation links: links are generated first, and accepting a valid token creates an active `general_member`.
- The durable domain currently describes `Invited member` as a pre-created participant "usually by Google email", but the completed archive records the implemented MVP as account-agnostic invite links that do not create visible pending member rows before acceptance.
- This intent changes that policy: member creation becomes admin-owned and explicit before Google binding.
- Existing foundation remains Next.js App Router, Better Auth, Prisma/PostgreSQL, Vitest, Playwright, Tailwind CSS, and shadcn-style UI components.

## Success Criteria

- Admin can create a member record before the real user signs in.
- Admin can generate or reveal a binding link tied to that exact member record.
- The binding flow shows enough context for the recipient to understand which member they are binding, without exposing household data before authorization.
- After Google sign-in through a valid binding link, the Google account is linked to the pre-created member and the member can access the app according to their status and role.
- A Google account already linked to another member cannot bind again.
- A bound member cannot be rebound through an old link unless a later approved policy explicitly allows unlink/rebind.
- Invalid, expired, reused, disabled-member, and wrong-state links fail without exposing household data.
- Existing admin-only member management remains protected from non-admin users.
- Automated coverage verifies the binding lifecycle without real Google OAuth secrets.

## Constraints And Assumptions

- UI copy remains Traditional Chinese and dark-theme first.
- `local_dev` remains the release target for this slice.
- Existing app foundation is reused; no framework or component-library decision is needed.
- The member record is the product-owned source of truth for role, display name, and access status.
- Google account email, subject, name, and avatar remain identity-provider data used during binding and session resolution.
- A binding link is member-specific, not account-agnostic.
- Exact link expiry, regeneration, revocation, and whether links are one-time reveal or re-copyable are downstream policy/design decisions.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required, because the change alters membership lifecycle, invitation semantics, account binding, link validity, authorization, and state transitions.
- Project Foundation Architecture: not required; existing foundation is sufficient.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: required, because admin-created member creation, link generation, pending/unbound status, and binding acceptance are user-facing flows.
- Behavior Spec / BDD / E2E: required before technical design.
- Feature Technical Design: required, because the flow needs explicit route boundaries, server actions, token persistence, binding transaction rules, conflict handling, and auth callback/session integration.
- TDD Implementation: required after approved spec and technical design.
- Verification: required after implementation.
- Target-Aware Release: required for `local_dev` readiness after verification because auth and membership linking are authorization risks.
- Learning Loop: optional for local_dev; recommended if review reveals uncertainty around link wording, pending-member status, or admin workflows.
- Artifact Compression: required after the slice completes.

## Open Questions

- Should an admin-created member start as `pending_binding`, `invited`, or another status name?
- Should admins choose role/capabilities at member creation, or should all new members default to `general_member` until edited?
- Should the binding link be one-time reveal, re-copyable, regeneratable, revocable, or all of these?
- What is the default link expiry for local_dev?
- After binding, should Google profile name/avatar initialize only empty fields, or refresh avatar/name defaults on every login?
- Can admins create members without immediately generating a link?
- Can admins delete or disable an unbound member before binding?
- What copy should the binding page show when the recipient is signed in with the wrong Google account?
- Should this replace `/invite/accept?token=...` or introduce a clearer route such as `/members/bind?token=...`?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm that all members must be admin-created before any user binds Google.
  - Confirm that generated links are tied to a specific pre-created member, not generic invitations.
  - Confirm whether this change should fully replace the current `/invite/accept` behavior.
- must_check:
  - No implementation starts before Domain Discovery, Experience Prototype, Behavior Spec, and Feature Technical Design are approved or explicitly accepted as risk.
  - The flow preserves app-owned authorization and does not let a valid Google account create an unplanned household member.
  - Automated tests remain independent from real Google OAuth credentials.
- acceptance_signals:
  - The intended membership lifecycle is clear enough for Domain Discovery to model states and policies.
  - The product direction intentionally supersedes account-agnostic invite links from the completed local_dev slice.
  - Non-goals keep this slice focused on local_dev binding, not production email delivery or deployment.
- unresolved_blockers:
  - Binding-link state policy and route naming need downstream decisions.
- next_step:
  - Domain Discovery / Domain Impact for `admin-created-member-google-binding`.
