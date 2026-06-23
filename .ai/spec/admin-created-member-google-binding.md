---
id: spec-admin-created-member-google-binding
stage: behavior-spec
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-created-member-google-binding.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-created-member-google-binding.md
  - .ai/prototype/admin-created-member-google-binding.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/admin-created-member-google-binding.md
  domain_impact:
    - .ai/domain-impact/admin-created-member-google-binding.md
  prototype:
    - .ai/prototype/admin-created-member-google-binding.md
  production_routes:
    - /settings/members
    - /members/bind
    - /auth/google
  target_components:
    - src/app/(app)/settings/members/page.tsx
    - src/app/(app)/settings/members/member-list.tsx
    - src/app/members/bind/page.tsx
    - src/app/member-actions.ts
  domain_modules:
    - src/modules/identity-access/member-management.ts
    - src/modules/identity-access/member-management-command.ts
    - src/modules/identity-access/member-invitations.ts
    - src/modules/identity-access/member-invitation-command.ts
    - src/modules/identity-access/session-access.ts
  existing_e2e:
    - e2e/dashboard.spec.ts
reviewed_at: 2026-06-23
---

# Admin-Created Member Google Binding Behavior Spec

## Decision Summary

- decision: approve
- prototype_status: accepted as Behavior Spec input
- primary_admin_route: `/settings/members`
- binding_route: `/members/bind?token=<token>`
- onboarding_policy: admins create member records before Google account binding
- binding_link_policy: member-specific links, 7-day local_dev expiry, regeneratable after expiry
- default_new_member_role: admin-selected at creation, defaulting to `general_member`
- next_gate: Feature Technical Design after approval

## Final Acceptance Criteria

1. `/settings/members` remains the member management surface for admins.
2. Non-admin members cannot create members, generate binding links, or edit member display names.
3. Admins can create a member before any Google account is linked.
4. Member creation captures app-owned display name and role.
5. New member creation defaults role to `general_member`.
6. Blank display name is rejected with a field-level `FieldError`.
7. Successful member creation closes the creation dialog and shows a toast `成員已建立。`.
8. Newly created members start as unbound and cannot access household data.
9. Member rows show app-owned display name, role, and status.
10. Status is shown in the item description area, not the identity title row.
11. Member rows show `未綁定`, `待綁定`, `已失效`, `已綁定`, or `已停用` as applicable.
12. Bound members do not show the binding-account action.
13. Disabled members do not show the binding-account action.
14. Unbound, waiting-for-binding, and expired-link members show one `綁定帳號` icon action.
15. The `綁定帳號` action opens one modal for all binding-link work.
16. For an unbound member without a link, the modal instructs the admin to generate a binding link and send it to the member.
17. Generating a binding link creates a member-specific link for that exact member.
18. Generated binding links have a visible expiry.
19. Expiry copy is shown in red.
20. For a member with an active binding link, opening the modal shows the link, expiry, and copy button.
21. Admins can copy an active binding link again before the member binds.
22. Copy success and copy failure use toast feedback.
23. For a member with an expired binding link, the row shows `已失效`.
24. For a member with an expired binding link, opening the modal explains the link has expired and offers `重新產生連結`.
25. Regenerating an expired binding link returns the member to waiting-for-binding state with a new visible expiry.
26. Once a member completes binding, the link is no longer shown in member management.
27. Once a member completes binding, the binding-account action disappears.
28. The binding page `/members/bind` supports valid, missing, expired, invalid, and used token states.
29. A missing token on `/members/bind` shows a user-facing error and does not show Google sign-in.
30. An expired token on `/members/bind` shows `綁定連結無法使用`, explains the link has expired, and directs the member to request a new link from the admin.
31. Invalid and used token states on `/members/bind` do not expose household data.
32. A valid binding link page shows `綁定 Google 帳號` and one Google sign-in action.
33. Starting Google sign-in from a valid binding link preserves enough token context for callback binding.
34. Google binding links one Google subject/email to exactly one pre-created member.
35. A Google account already linked to another member cannot bind through another link.
36. A bound member cannot be rebound through a stale link in this slice.
37. A disabled member cannot be bound through an old link.
38. The app-owned display name remains admin-managed after binding.
39. Google profile name/avatar can initialize empty profile data during first binding, but must not overwrite admin-owned display name unexpectedly.
40. Existing automated tests must remain independent from real Google OAuth credentials.
41. Real email delivery is out of scope; links are copied manually for local_dev.
42. Implementation must audit all form field validation messages touched by this slice and use `FieldError` for field-level errors.

## BDD Scenarios

### Scenario: Admin Creates An Unbound Member

Given an authenticated admin opens `/settings/members`  
When the admin activates `建立成員`  
And enters display name `柏宇`  
And keeps role `一般成員`  
And submits the form  
Then the creation dialog closes  
And a toast says `成員已建立。`  
And the member list shows `柏宇` with status `未綁定`

### Scenario: Blank Display Name Is Rejected

Given an admin is creating a member  
When the admin submits a blank display name  
Then the dialog remains open  
And the display-name field shows `顯示名稱不能空白。` through `FieldError`

### Scenario: Admin Generates A Binding Link

Given an unbound member `柏宇` exists  
When the admin activates `綁定帳號` for `柏宇`  
Then a `綁定 Google 帳號` modal opens  
And it tells the admin to generate a binding link  
When the admin activates `產生綁定連結`  
Then the modal shows `綁定帳號連結`  
And the link is tied to `柏宇`  
And the modal shows a red `有效期限`

### Scenario: Admin Copies An Existing Binding Link

Given member `佳蓉` has status `待綁定`  
When the admin activates `綁定帳號` for `佳蓉`  
Then the modal shows the existing binding link and expiry  
When the admin activates the copy button  
Then the link is copied  
And a toast says `綁定連結已複製`

### Scenario: Expired Binding Link Can Be Regenerated

Given member `失效測試成員` has status `已失效`  
When the admin activates `綁定帳號`  
Then the modal explains the binding link has expired  
And it shows the original expiry if available  
When the admin activates `重新產生連結`  
Then a new binding link is generated  
And the member status becomes `待綁定`  
And a new red expiry is visible

### Scenario: Bound Member Has No Binding Action

Given member `安琪` is already bound  
Then the row shows status `已綁定`  
And no `綁定帳號` action is visible for that row

### Scenario: Disabled Member Cannot Be Bound

Given a disabled member is visible  
Then the row shows status `已停用`  
And no `綁定帳號` action is visible for that row

### Scenario: Member Opens Expired Binding Link

Given a member receives an expired binding link  
When they open `/members/bind?token=preview-expired&state=expired`  
Then the page title is `綁定連結無法使用`  
And the page explains the link has expired  
And the page provides a return-to-login action  
And no household data is shown

### Scenario: Member Opens Valid Binding Link

Given a member receives a valid binding link  
When they open `/members/bind?token=preview-valid`  
Then the page title is `綁定 Google 帳號`  
And the page offers one `使用 Google 登入` action  
When they start Google sign-in  
Then the binding token is preserved for the callback flow

### Scenario: Google Account Already Belongs To Another Member

Given a valid binding link exists for an unbound member  
And the signed-in Google account already belongs to another active member  
When the callback attempts binding  
Then the app rejects the binding  
And household access is not granted through that link

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Admin creates member | `/settings/members` | controlled-auth admin | desktop | Button `建立成員`; dialog `建立成員`; field `顯示名稱`; select `角色`; toast `成員已建立。`; row status `未綁定`. |
| Blank display name | `/settings/members` | admin | desktop | Submit blank field; `顯示名稱不能空白。` appears as field error; dialog remains open. |
| Generate binding link | `/settings/members` | admin with unbound member | desktop | Row button `管理 <name> 的綁定帳號連結`; modal `綁定 Google 帳號`; button `產生綁定連結`; field label `綁定帳號連結`; red text `有效期限`. |
| Copy binding link | `/settings/members` | admin with waiting member | desktop | Copy button `複製 <name> 的綁定帳號連結`; toast `綁定連結已複製`. |
| Expired link regeneration | `/settings/members` | admin with expired member | desktop | Status `已失效`; modal text `綁定連結已失效`; button `重新產生連結`; status becomes `待綁定`. |
| Bound row hides binding | `/settings/members` | admin with bound member | desktop | Row `已綁定`; no binding action accessible for that member. |
| Disabled row hides binding | `/settings/members` | admin with disabled member | desktop | Row `已停用`; no binding action accessible for that member. |
| Expired binding page | `/members/bind?token=preview-expired&state=expired` | unauthenticated | desktop and mobile | Heading `綁定連結無法使用`; destructive alert explains expiry; no household data; link `返回登入頁`. |
| Valid binding page | `/members/bind?token=preview-valid` | unauthenticated | desktop and mobile | Heading `綁定 Google 帳號`; button `使用 Google 登入`; hidden `bindToken` value preserved. |

## Fixture And Data Strategy

- Use controlled-auth fixtures for admin and non-admin browser checks.
- Seed or fixture members:
  - bound admin with Google avatar.
  - unbound general member.
  - waiting-for-binding finance manager with active token and future expiry.
  - expired-link general member with past expiry.
  - disabled member with no active binding action.
- Binding links use deterministic test tokens.
- Link expiry should be relative and deterministic in tests through injected clock or fixed fixture dates.
- Clipboard tests may stub `navigator.clipboard.writeText`.
- OAuth callback binding is tested through controlled callback fixtures or domain/integration tests, not real Google OAuth in CI.

## Accessible Selectors

- Header action: `建立成員`.
- Create dialog title: `建立成員`.
- Create field: `顯示名稱`.
- Role select: `角色`.
- Display-name error: `顯示名稱不能空白。`.
- Row edit action: `修改 <display name> 的顯示名稱`.
- Row binding action: `管理 <display name> 的綁定帳號連結`.
- Binding modal title: `綁定 Google 帳號`.
- Binding link field: `綁定帳號連結`.
- Copy binding link: `複製 <display name> 的綁定帳號連結`.
- Link expiry text: `有效期限`.
- Regenerate expired link: `重新產生連結`.
- Binding page headings: `綁定 Google 帳號`, `綁定連結無法使用`.
- Binding page Google action: `使用 Google 登入`.
- Return action: `返回登入頁`.

## Responsive And Accessibility Requirements

- `/settings/members` grid renders one column on mobile, two columns on small screens, and three columns on wide screens.
- Member item text must not overlap icon actions.
- Icon-only row actions must have accessible names and tooltips.
- Dialog focus must be trapped by the Radix-backed dialog.
- The binding link input and copy button must fit on mobile without horizontal scroll.
- Red expiry and destructive link-error alerts must maintain dark-theme contrast.
- `/members/bind` error page must be usable without authentication and must not expose household/member-management data.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/unit | Admin-created member starts unbound and cannot access household data. |
| Domain/unit | Non-admin cannot create members or generate binding links. |
| Domain/unit | Blank display name is rejected. |
| Domain/unit | Binding link belongs to one member and cannot create an unplanned member. |
| Domain/unit | Link expiry, invalid token, used token, disabled-member, and bound-member cases are rejected. |
| Domain/unit | Already-linked Google account cannot bind to another member. |
| Domain/unit | Valid token plus unlinked Google account binds subject/email to the target member exactly once. |
| Integration | `/members/bind` preserves binding token into Google sign-in start. |
| Integration | Binding callback links Google identity to pre-created member in one transaction. |
| Integration | Current-member resolution recognizes the newly bound member on later sign-ins. |
| UI/E2E | Admin create-member flow, binding modal generation/copy, expired regeneration, and hidden actions for bound/disabled rows. |
| UI/E2E | Binding page expired and valid states on desktop and mobile. |
| Manual local smoke | Real Google OAuth binding with redacted email and no secrets committed. |

## Open Questions For Technical Design

- Whether to keep `/members/bind` or reuse `/invite/accept` with renamed semantics.
- Exact database status name for unbound members: `pending_binding`, `invited`, or existing `invited`.
- Whether generated links are one-time reveal or re-copyable after generation.
- Whether regeneration revokes previous active token immediately.
- Whether admins can disable or delete unbound members in this slice.
- Whether Google avatar sync happens once at binding or on each login.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm status labels and binding modal behavior.
  - Confirm expired-link behavior for both admin and member views.
  - Confirm `/members/bind` route candidate.
  - Confirm role selection remains in scope for member creation.
- must_check:
  - No implementation starts before Feature Technical Design approval.
  - Behavior is testable without real Google OAuth credentials.
  - Expired/invalid/used links do not expose household data.
- unresolved_blockers:
  - Route naming and token persistence details remain for Feature Technical Design.
- next_step:
  - Feature Technical Design
