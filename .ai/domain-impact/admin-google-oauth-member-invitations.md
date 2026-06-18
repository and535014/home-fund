---
id: domain-impact-admin-google-oauth-member-invitations
stage: domain-impact
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-google-oauth-member-invitations.md
  - .ai/domain/home-family-fund.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/admin-google-oauth-member-invitations.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-19
---

# Domain Impact for Admin Google OAuth And Member Invitations

## Summary

- intent_id: admin-google-oauth-member-invitations
- maintained_domain_artifacts_updated:
  - .ai/domain/home-family-fund.md
- bounded_contexts_touched:
  - Identity and Access
  - Responsive Web Experience
- impact_type: changed_policy, changed_state, changed_language, new_behavior

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Invited member, display name, avatar, Google profile defaults, sign-in gate, logout. | Member/account profile language now distinguishes app-owned display name from Google-owned avatar. | None. | The slice combines OAuth identity, household membership, and visible profile naming. |
| events | Admin signed in with Google, Member invited by email, Invited Google account matched, Member profile initialized from Google, Member display name changed, Logout completed. | Existing Member invited/account updated language now carries invitation/linking/profile detail. | None. | Prototype and BDD need concrete membership lifecycle outcomes. |
| commands | Sign in with Google, Invite member by Google email, Link Google account, Update member display name, Log out. | Update member account is narrowed for this slice to admin-managed display name changes. | None. | Implementation needs explicit command boundaries. |
| policies | Admin invites members; app authorization gates household access; Google profile initializes defaults; admin can edit display name only; avatar is not admin-editable; self-service profile editing is deferred; logout is required. | Invitation mode is no longer generic; email invite is the leading MVP policy pending final discovery decision. | None. | Resolves prior ambiguity enough to route to prototype while preserving open questions. |
| aggregates_or_invariants | MemberAccount owns display name, roles, capabilities, status, Google email/subject, and avatar source policy. | Household invariant now includes admin-owned invitations and member profile naming. | None. | Member names and avatars appear across financial read models. |
| bounded_contexts | Identity and Access now owns logout and profile-default language. | Responsive Web Experience must render sign-in/logout/invite/member states. | None. | UI and tests need clear ownership. |
| lifecycle_or_states | Invited member can be matched by Google email; activation policy remains to decide. Logout ends session and returns to unauthenticated state. | Existing invited/active/disabled statuses remain, but first-link transition needs explicit policy. | None. | BDD must cover invited, wrong-account, disabled, and logout flows. |

## Downstream Impact

- prototype_states_or_flows:
  - Dedicated login route versus homepage sign-in gate decision.
  - Admin `/members` page with invite-by-email form, member list, statuses, display names, Google avatars, edit display name action, and blocked non-admin state.
  - Visible logout/sign-out control in authenticated UI.
  - Invited/unlinked/disabled access states after Google OAuth.
- bdd_scenarios:
  - Seeded admin signs in with real Google OAuth locally.
  - Admin logs out and can switch Google account.
  - Admin invites member by selected mechanism.
  - Invited user signs in with matching Google email and follows selected activation policy.
  - Wrong Google account and disabled member remain blocked.
  - Admin edits display name; all users see the changed app-owned name.
  - Admin cannot edit avatar; non-admin cannot edit own display name in this slice.
  - Automated controlled-auth E2E runs without real OAuth credentials.
- technical_design_boundaries:
  - Better Auth sign-in/sign-out route contracts.
  - Member invitation server action or route handler.
  - Member profile data ownership and Prisma shape for avatar source.
  - Current-member resolution and first-link/activation transaction.
  - E2E fixture path independent from real Google OAuth.
- tdd_domain_tests:
  - Admin-only invite and display-name update.
  - Duplicate invite email rejection.
  - Invited/active/disabled access decisions.
  - Display name default from Google profile and admin override.
  - Avatar default/read-only policy.
  - Logout route/session contract at integration level.
- release_or_learning_signals:
  - Local real OAuth smoke for first admin.
  - Local invitation/linking smoke with redacted emails.
  - E2E controlled-auth pass without OAuth secrets.
  - Release artifact must state whether real OAuth/invitation manual smoke passed or was blocked by credentials.

## Open Questions and Risks

- product:
  - Dedicated `/login` route versus homepage sign-in gate.
  - Whether local_dev sends real email, shows copyable invite state, or relies on admin-entered Google email only.
- domain:
  - Whether invited members auto-activate on matching Google email or require admin approval after first sign-in.
  - Whether invited members start as `general_member` or admin-selected role/capabilities.
  - Whether disabling/reactivating members is included in this slice.
- data_or_ownership:
  - Whether Google avatar is synced every login or copied once and kept read-only.
  - Whether Prisma needs a member avatar URL/image field, or can use Better Auth user image through the linked account for MVP.
- policy_or_permission:
  - How first admin is bootstrapped locally.
  - Where logout appears and where it redirects.
  - Last-admin protection remains important if member permissions are edited in this slice.

## Review Gate

- decision: approve
- reviewer_focus:
  - durable domain model updated separately
  - this file contains only intent-specific delta
  - downstream impacts are actionable
- must_check:
  - trace links point to maintained domain artifact
  - no long-lived domain rules exist only in this impact file
  - invitation, profile, avatar, logout, and E2E-independent auth policy are represented
- acceptance_signals:
  - Experience Prototype can design `/members`, sign-in/logout, and invited-member states without inventing policy.
  - Behavior Spec can cover admin OAuth, invitation, display-name, avatar, logout, and blocked-account scenarios.
- unresolved_blockers:
  - Activation policy for invited members must be resolved before implementation.
- next_step:
  - Experience Prototype
