---
id: technical-design-admin-created-member-google-binding
stage: technical-design
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-created-member-google-binding.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/admin-created-member-google-binding.md
  - .ai/prototype/admin-created-member-google-binding.md
  - .ai/spec/admin-created-member-google-binding.md
outputs:
  - feature_technical_design
  - implementation_boundaries
  - tdd_handoff
trace_links:
  routes:
    - src/app/(app)/settings/members/page.tsx
    - src/app/members/bind/page.tsx
    - src/app/auth/google/route.ts
    - src/app/invite/accept/page.tsx
    - src/app/invite/accept/callback/route.ts
  member_ui:
    - src/app/(app)/settings/members/member-list.tsx
    - src/app/member-management-members.ts
    - src/app/member-actions.ts
  identity_access:
    - src/modules/identity-access/member-management.ts
    - src/modules/identity-access/member-management-command.ts
    - src/modules/identity-access/member-invitations.ts
    - src/modules/identity-access/member-invitation-command.ts
    - src/modules/identity-access/session-access.ts
    - src/modules/identity-access/authorization.ts
  auth:
    - src/auth/app-access.ts
    - src/auth/google-sign-in.ts
    - src/auth/current-member-data-source.ts
  data_model:
    - prisma/schema.prisma
  tests:
    - src/modules/identity-access/member-management*.test.ts
    - src/modules/identity-access/member-invitation*.test.ts
    - src/modules/identity-access/session-access.test.ts
    - e2e/
reviewed_at: 2026-06-23
---

# Admin-Created Member Google Binding Technical Design

## Decision Summary

- decision: approved
- implementation_handoff: TDD Implementation after approval
- release_target: local_dev
- route_decision: use `/members/bind?token=...` for binding links; keep `/invite/accept` only as legacy/deprecated compatibility until removed or redirected by an approved later cleanup.
- status_decision: reuse `Member.status = invited` as the persisted unbound/pending-binding status for this slice; UI copy renders it as `未綁定`.
- invitation_model_decision: reuse existing `MemberInvitation` table, but make `memberId` required by behavior and treat each pending token as member-specific.
- token_policy: 7-day expiry; while a pending invitation for the same member is still unexpired, do not create another link and return the existing link for copy. Create a new link only after the previous pending link has expired or is no longer usable.
- token_storage_policy: validate with `tokenHash`; store the raw token only as encrypted ciphertext so the admin re-copy flow is production-capable, not a local_dev-only compromise.

## Scope

This design converts the approved prototype/spec into production-capable persisted behavior for the current `local_dev` release target:

- Admin-created member records with role selection and field-level validation.
- Member list showing unbound, waiting-for-binding, expired, bound, and disabled states.
- Single binding-account modal for link generation, active-link copy, and expired-link regeneration.
- `/members/bind` public binding page with valid/missing/expired/invalid/used states.
- Google OAuth start/callback preserving binding token and binding the Google identity to a pre-created member.
- Tests that run without real Google OAuth credentials.

Out of scope:

- Real email delivery.
- Multi-household membership.
- Self-service profile editing.
- Unlink/rebind Google account.
- Production deployment readiness beyond the binding-token storage decision.
- Deleting or disabling unbound members beyond existing disabled-state read behavior.

## Architecture Decisions

### ADR-1: Reuse `Member.status = invited` For Unbound Members

- Status: accepted for this slice.
- Decision: Do not add a new Prisma enum value during this slice. Persist admin-created, not-yet-bound members as `Member.status = invited`; render this as `未綁定` in the UI.
- Rationale: The current schema already has `invited`, `active`, and `disabled`, and existing access code expects only active members to access household data.
- Consequences: Technical naming remains `invited` while product copy says `未綁定`. Tests must assert product labels, not enum names.

### ADR-2: Keep `/members/bind` As The New Binding Route

- Status: accepted for this slice.
- Decision: New binding links use `/members/bind?token=<rawToken>`.
- Rationale: The new behavior is not a generic invitation accept flow. The route name should match account binding to an existing member record.
- Consequences: Existing `/invite/accept` remains legacy code until TDD either removes, redirects, or leaves it unused. This slice should not keep generating `/invite/accept` links.

### ADR-3: Reuse And Tighten `MemberInvitation`

- Status: accepted.
- Decision: Use the existing `MemberInvitation` model as the binding-token model. New pending invitations must have `memberId`; `googleAccountEmail` becomes optional legacy data and should not drive binding for this slice.
- Rationale: The table already stores token hash, status, expiry, creator, and target relation.
- Consequences: The adapter must stop creating a member during token acceptance and instead update the target member. A Prisma migration is required to support encrypted token re-copy without storing raw tokens.

### ADR-4: Active Pending Links Are Reused Until Expiry

- Status: accepted.
- Decision: When an admin requests a binding link for a member that already has a pending, unexpired invitation, return that existing link and expiry instead of creating another invitation. Create a fresh invitation only when no pending link exists, or when the latest pending link is expired or otherwise unusable.
- Rationale: A not-yet-expired link remains valid, so creating a second active link would make expiry and support conversations ambiguous.
- Consequences: At most one unexpired pending binding link is usable per member. The member list reads the newest pending token when present; expired/revoked tokens are not copyable and expired links may be replaced.

### ADR-5: Active/Expired State Is Derived From Token Plus Time

- Status: accepted.
- Decision: Keep `MemberInvitation.status` as `pending | accepted | revoked`; derive `已失效` when the latest pending token has `expiresAt <= now`.
- Rationale: Existing enum lacks `expired`, and expiry is naturally time-derived.
- Consequences: List/read model and token validation need an injected clock for deterministic tests.

### ADR-6: Binding Is A Transaction On Existing Member

- Status: accepted.
- Decision: Accepting a valid token updates the existing `Member` with Google email/subject/avatar defaults and status `active`, then marks the `MemberInvitation` accepted in the same transaction.
- Rationale: Behavior requires no unplanned member creation from a token.
- Consequences: Existing `acceptMemberInvitationInDatabase` must be replaced or refactored because it currently creates a new active member.

### ADR-7: Field-Level Errors Use `FieldError`

- Status: accepted.
- Decision: Forms touched in this slice render field validation failures with `FieldError`, not `FieldDescription`.
- Rationale: The design system has a dedicated error component and user feedback should be consistent.
- Consequences: Member creation and display-name edit fields must use typed field errors. Implementation should audit any touched member form paths.

### ADR-8: Re-Copy Uses Encrypted Token Storage

- Status: accepted.
- Decision: Keep `tokenHash` as the validation/index field and add encrypted raw-token storage for admin re-copy, for example `tokenCiphertext`, `tokenIv`, and `tokenAuthTag` fields on `MemberInvitation`.
- Rationale: The approved product flow requires admins to reopen the modal and copy an unexpired link again. That flow must be viable beyond local development. Storing only the hash prevents re-copy; storing raw token text is not acceptable for production.
- Consequences: TDD Implementation must add Prisma schema/migration coverage, encryption/decryption adapter tests, and an environment secret such as `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`. If decryption fails or the secret is missing, the admin UI should show a recovery path to create a new link only when policy permits; it must not expose partial token data.

## Data Model

Schema migration is required because the re-copy flow must be production-capable:

- `Member.status`: `invited | active | disabled`
- `Member.googleAccountEmail`: nullable unique
- `Member.googleSubject`: nullable unique
- `Member.avatarUrl`: nullable
- `MemberInvitation.memberId`: nullable in schema but required by new commands
- `MemberInvitation.status`: `pending | accepted | revoked`
- `MemberInvitation.expiresAt`: DateTime
- `MemberInvitation.tokenHash`: unique hash used for token validation
- `MemberInvitation.tokenCiphertext`: encrypted raw token used only to rebuild the admin-copy link
- `MemberInvitation.tokenIv`: encryption initialization vector/nonce
- `MemberInvitation.tokenAuthTag`: authenticated-encryption tag

Implementation invariant:

- New binding invitations must always include `memberId`.
- Binding must fail if `memberId` is missing.
- Accepted invitation sets target member active; it must not create a new member.
- A member cannot receive a second pending binding invitation while the current pending invitation is unexpired.
- After the current pending invitation expires or becomes unusable, a new pending invitation can be created; older pending invitations for the same member should be revoked before the replacement is stored.
- Raw binding tokens must not be stored in plaintext.
- The server validates submitted tokens by hashing and comparing `tokenHash`; decryption is only for admin re-copy of an unexpired pending link.

Future production hardening:

- Make `MemberInvitation.memberId` non-nullable after legacy invitation records are migrated or pruned.
- Rotate `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY` through an explicit key-version strategy if token lifetime or production operations later require it.

## Route And Component Boundaries

| Boundary | File(s) | Responsibility |
|---|---|---|
| Admin member page | `src/app/(app)/settings/members/page.tsx` | Server route guarded by app/admin access; loads member binding read model and renders page header plus member list. |
| Member list client UI | `src/app/(app)/settings/members/member-list.tsx` | Client interactions for dialogs, toasts, clipboard, and server-action submission state. No domain decisions. |
| Member server actions | `src/app/member-actions.ts` | `createMemberAction`, `generateMemberBindingLinkAction`, `updateMemberDisplayNameAction`; enforce server-action access and return typed `ActionState`. |
| Binding page | `src/app/members/bind/page.tsx` | Public token validation surface; valid token starts Google sign-in; invalid/missing/expired/used states show safe copy. |
| Google auth start | `src/app/auth/google/route.ts`, `src/auth/google-sign-in.ts` | Accept optional `bindToken`; preserve it through Better Auth callback/return URL. |
| Binding callback | existing `src/app/invite/accept/callback/route.ts` renamed or new `src/app/members/bind/callback/route.ts` | Resolve Better Auth session, call binding adapter, redirect to app or back to `/members/bind` with error. |
| Domain rules | `src/modules/identity-access/member-invitations.ts`, `member-management.ts` | Pure authorization, validation, state transition decisions. |
| Prisma adapters | `src/modules/identity-access/member-invitation-command.ts`, `member-management-command.ts` | Persistence, transactions, token hashing, read model assembly. |

## Read Models

Add or update member-management read model:

```ts
type MemberManagementMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  roles: MemberRole[];
  status: "invited" | "active" | "disabled";
  binding: {
    state: "none" | "active" | "expired" | "accepted" | "revoked";
    link?: string;
    expiresAt?: Date;
  };
};
```

UI mapping:

- `status=invited`, no active latest token -> `未綁定`
- `status=invited`, latest pending token and `expiresAt > now` -> `待綁定`
- `status=invited`, latest pending token and `expiresAt <= now` -> `已失效`
- `status=active` -> `已綁定`
- `status=disabled` -> `已停用`

Only admins receive `binding.link` in the read model.

## Server Action Contracts

### Create Member

Input:

- `displayName`: string
- `role`: `admin | finance_manager | general_member`

Authorization:

- `manage_members`

Validation:

- Display name trimmed and non-empty.
- Role must be a known `MemberRole`.
- Last-admin protection applies if future role changes are introduced; creation can add admin but cannot remove existing admin.

Success:

- Create `Member(status=invited, displayName, roles=[role])`.
- Revalidate `/settings/members`.
- Return member row data.
- UI toast: `成員已建立。`

Errors:

- `permission_denied`
- `invalid_display_name`
- `invalid_role`
- `unknown_error`

### Generate Member Binding Link

Input:

- `memberId`: string

Authorization:

- `manage_members`

Validation:

- Target member exists.
- Target member belongs to the actor household.
- Target member status must be `invited`.
- Target member must not already have `googleSubject` or `googleAccountEmail`.

Success:

- If a pending invitation for the target member exists and `expiresAt > now`, decrypt its stored token ciphertext, rebuild `bindingLink`, and return it with `expiresAt` without creating a new row.
- If no pending invitation exists, or the latest pending invitation is expired, revoke older pending invitations for the target member and create a new `MemberInvitation(status=pending, memberId, tokenHash, tokenCiphertext, tokenIv, tokenAuthTag, expiresAt=now+7d, createdById)`.
- Return `bindingLink` and `expiresAt`.
- Revalidate `/settings/members`.

Errors:

- `permission_denied`
- `member_not_found`
- `member_already_bound`
- `member_disabled`
- `unknown_error`

### Bind Google Account

Input:

- `token`: string
- Google session subject/email/name/avatar from Better Auth session.

Validation:

- Token exists by hash.
- Invitation status is pending.
- Invitation is not expired.
- Invitation has a target member.
- Target member is `invited`, not active or disabled.
- Google subject/email is not already linked to an active member.

Success:

- Transaction:
  - Update target member:
    - `googleSubject`
    - normalized `googleAccountEmail`
    - `avatarUrl` if empty and Google avatar exists
    - `displayName` remains admin-owned and is not overwritten
    - `status=active`
  - Mark invitation `accepted`, set `acceptedAt`
- Redirect to `/`.

Errors:

- `missing_token`
- `invalid_bind_link`
- `expired_bind_link`
- `used_bind_link`
- `revoked_bind_link`
- `member_already_bound`
- `member_disabled`
- `google_account_already_member`
- `missing_google_account`

## UI State And Error Strategy

- Member list loads from server read model; client state should not be source of truth after implementation.
- Create member dialog closes only after success.
- Field validation errors use `FieldError`.
- Binding modal shows:
  - no link: instruction text + `產生綁定連結`
  - active link: read-only link input, copy button, red expiry
  - expired link: red expired message + original expiry + `重新產生連結`
  - active link: copy-only behavior; requesting/generating from the modal reuses the existing unexpired link and must not extend the expiry.
- Bound/disabled rows do not render binding action.
- `/members/bind` never renders household data before successful auth/binding.
- Copy errors remain client-only toasts.

## Test Mapping

| Behavior | Test Level | Target |
|---|---|---|
| Admin creates unbound member | unit + server action + E2E | `member-management*.test.ts`, `member-actions.ts`, E2E |
| Non-admin cannot create/generate | unit + server action | `authorization.test.ts`, member action tests |
| Field errors use `FieldError` | component/E2E | member creation dialog |
| Binding link generation | unit + adapter + E2E | `member-invitations.test.ts`, `member-invitation-command.test.ts` |
| Binding token encryption for admin re-copy | unit + adapter | token crypto helper tests, Prisma adapter tests |
| Expired link derivation | unit + E2E | injected clock in domain/adapter tests |
| Active pending link cannot be regenerated before expiry | unit + adapter + E2E | invitation command tests, member modal E2E |
| Expired pending link replacement revokes older pending tokens | adapter/integration | Prisma adapter tests |
| `/members/bind` expired/missing/invalid/used | route/component E2E | public route tests |
| Valid binding callback | adapter/integration | controlled Better Auth session fixtures |
| Already-linked Google account rejected | unit + adapter | identity-access tests |
| Current member resolves after binding | integration | `session-access.test.ts` |

## TDD Implementation Preconditions

- Keep `local_dev` target.
- Implement production-capable encrypted token storage for the admin re-copy flow; do not introduce local_dev-only token reveal behavior.
- Start with domain/unit tests for create member, generate link, active-link reuse, validate token, bind account, and regenerate expired link.
- Add or update Prisma migration/schema before adapter implementation so `previewToken` plaintext storage is not the final design.
- Then adapter tests for transaction behavior.
- Then server-action/UI E2E for admin flows.
- Then `/members/bind` E2E states.
- Preserve existing admin Google OAuth/member invitation tests until replaced or explicitly updated.

## Release Implications

- Local_dev release readiness must mention:
  - controlled-auth E2E covers binding without real OAuth secrets.
  - real Google OAuth binding requires manual local smoke.
  - token re-copy uses encrypted storage and requires `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`.
  - `/invite/accept` legacy route behavior is either unused, redirected, or left as accepted local_dev risk.
- Production release remains out of scope.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm `/members/bind` as the implementation route.
  - Confirm `Member.status=invited` can represent unbound members for this slice.
  - Confirm active pending links cannot be regenerated before expiry and are only copied/reused.
  - Confirm encrypted token storage is the required implementation for admin re-copy.
- must_check:
  - Design satisfies approved Behavior Spec.
  - No implementation starts before approval.
  - Existing invitation code path is explicitly refactored rather than duplicated.
- unresolved_blockers:
  - None for TDD Implementation if route/status/token decisions are accepted.
- next_step:
  - TDD Implementation
