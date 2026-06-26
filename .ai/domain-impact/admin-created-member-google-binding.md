---
id: domain-impact-admin-created-member-google-binding
stage: domain-impact
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-created-member-google-binding.md
  - .ai/domain/home-family-fund.md
  - .ai/archive/archive-admin-google-oauth-member-invitations-2026-06-20.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/admin-created-member-google-binding.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-22
---

# Domain Impact for Admin-Created Member Google Binding

## Summary

- intent_id: admin-created-member-google-binding
- maintained_domain_artifacts_updated:
  - .ai/domain/home-family-fund.md
- bounded_contexts_touched:
  - Identity and Access
  - Responsive Web Experience
- impact_type: changed_policy, changed_state, changed_language, new_behavior

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Admin-created member, member availability status, unbound member, member binding link, bound member. | Member now emphasizes app-owned member record as the source of role, display name, availability, and financial attribution. Google binding state is expressed by binding invitation/link state, not member availability status. Admin now creates active usable members and generates binding links separately. | Generic invited-member language as the primary onboarding model. | The product direction requires membership to exist and be usable before Google binding. |
| events | Member created, Member binding link generated, Member Google account bound. | Prior invitation/linking events are refined into member-specific binding events. | Account-agnostic invite acceptance as the durable domain path. | Prototype and BDD need explicit states for created, link-generated, and bound members. |
| commands | Create member, Generate member binding link, Bind Google account to member. | Authenticate member now distinguishes first binding from later sign-in. | Invite link that creates a new member during acceptance. | Implementation must prevent valid Google accounts from creating unplanned household members. |
| policies | Only admins create members; newly created members are active usable household participants; binding links are tied to one unbound member; already-bound Google accounts cannot bind again; invalid/expired/reused/disabled/wrong-state links expose no household data. | Google identity remains proof of sign-in identity, but app-owned member records decide availability, attribution, roles, and access after binding. | Generic invitation links that create active `general_member` records on acceptance. | The user explicitly wants admin-created membership before Google binding and wants binding state separated from member status. |
| aggregates_or_invariants | MemberAccount owns member availability, unbound/bound lifecycle, and one-Google-identity-to-one-member binding invariant. Binding invitation/link owns pending/expired/used binding state. Household owns admin-created membership and binding-link generation. | MemberAccount open questions shift from binding status naming to disabled-member selection policy and rebind policy. | Email-match activation as the leading policy. | State transitions and transaction boundaries must be explicit before technical design. |
| bounded_contexts | Identity and Access owns admin-created membership and member-specific binding links. | Responsive Web Experience must show unbound, link-generated, binding success, and blocked binding states. | None. | User-facing member management and binding acceptance must use the same language. |
| lifecycle_or_states | Active admin-created member, unbound member, binding link generated, bound member, disabled member with blocked binding/access. | Member availability status is separate from binding invitation/link state; pending binding is not a member status. | Acceptance that immediately creates an active member without a pre-existing member record; invited member status as a proxy for pending binding. | Behavior specs need precise state fixtures and expected transitions. |

## Downstream Impact

- prototype_states_or_flows:
  - `/members` should support admin-created member records before Google binding.
  - Member list should distinguish unbound, link available/generated, bound, and disabled states.
  - Admin needs a clear action to generate/copy/regenerate/revoke a binding link once downstream policy is decided.
  - Binding acceptance should show the target member context without exposing household records.
  - Blocked states are needed for invalid, expired, reused, disabled-member, wrong-state, and already-bound-account links.
- bdd_scenarios:
  - Admin creates an active unbound member.
  - Admin generates a binding link for that member.
  - A user opens the link, signs in with Google, and binds to the pre-created member.
  - A Google account already linked to another member cannot bind through a second link.
  - A reused or expired binding link cannot bind again.
  - A disabled or already-bound member cannot be claimed through a stale link.
  - Generic invitation acceptance no longer creates unplanned active members.
  - Controlled-auth E2E covers binding without real OAuth secrets.
- technical_design_boundaries:
  - Member creation server action and binding-link generation boundary.
  - Binding token persistence, hashing, expiry, reveal/copy, regeneration, and revocation policy.
  - Binding transaction that links Google subject/email to the target member exactly once.
  - Current-member resolution after binding and after later Google sign-ins.
  - Route decision: replace `/invite/accept?token=...` or introduce `/members/bind?token=...`.
- tdd_domain_tests:
  - Admin-only member creation and link generation.
  - Non-admin cannot create members or generate binding links.
  - Member creation persists an active usable member before Google binding.
  - Binding succeeds for a valid active unbound member and unlinked Google account.
  - Binding rejects already-bound Google accounts, reused tokens, expired tokens, disabled members, and already-bound members.
  - Session access recognizes the bound member on subsequent sign-ins.
- release_or_learning_signals:
  - Local_dev release must distinguish controlled-auth automated binding coverage from any real Google OAuth manual smoke.
  - Manual smoke should redact personal emails and tokens.
  - Learning should watch whether admins understand the difference between member availability and Google binding state.

## Open Questions and Risks

- product:
  - Should the route remain `/invite/accept?token=...` for continuity or become a clearer binding route?
  - Should admins be able to create members without immediately generating a link?
  - Should links be one-time reveal, re-copyable, regeneratable, revocable, or all of these?
- domain:
  - Should disabled members remain selectable for new financial records, or only readable on historical records?
  - Should admins choose role/capabilities at member creation, or should new members default to `general_member`?
  - Can admins delete an unbound member, or only disable it?
- data_or_ownership:
  - Binding needs a durable relationship between a token and a specific member record without storing raw tokens unsafely.
  - Google profile defaults should not overwrite admin-owned display names unexpectedly.
- policy_or_permission:
  - Last-admin protection remains important if member roles can be changed while adding binding.
  - Rebinding or unlinking a Google account is out of scope unless explicitly added later.

## Review Gate

- decision: approve
- reviewer_focus:
  - durable domain model updated separately
  - this file contains only intent-specific delta
  - downstream impacts are actionable
- must_check:
  - trace links point to maintained domain artifact
  - no long-lived domain rules exist only in this impact file
  - admin-created membership fully replaces generic invite-created membership for this active slice
- acceptance_signals:
  - Experience Prototype can design member creation, binding-link generation, and binding acceptance states without inventing policy.
  - Behavior Spec can derive state fixtures and blocked binding scenarios from the domain delta.
- unresolved_blockers:
  - Route naming and binding-link reveal/regenerate/revoke policy need approval before implementation.
- next_step:
  - Experience Prototype for `admin-created-member-google-binding`
