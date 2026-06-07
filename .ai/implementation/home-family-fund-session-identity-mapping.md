---
id: impl-home-family-fund-session-identity-mapping
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC20
  bdd_scenarios:
    - Google sign-in and household authorization: Unlinked Google account cannot access household data
  test_plan_items:
    - Contract: Auth/session boundary
    - Integration: Identity + command handlers
    - Quality Gate: Static checks
reviewed_at:
---

# Implementation Log for Session Identity Mapping

## Delivery Profile
This implementation targets `local_dev` for the MVP. It keeps the auth boundary small and deterministic by mapping Better Auth user/account data into the existing `GoogleIdentity` domain shape before household member resolution.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `src/auth/session-identity.test.ts` covering unauthenticated user, linked Google account mapping, non-linked accounts, and blank email handling | Red: module did not exist | Added `src/auth/session-identity.ts` with `resolveGoogleIdentityFromAuthSession` | Keeps external auth provider details outside `Identity and Access` domain logic. |

## Coding Summary
- Added `src/auth/session-identity.ts` as an auth boundary helper that converts Better Auth session user and account rows into the domain `GoogleIdentity`.
- Added `src/auth/session-identity.test.ts` to verify Google account matching, subject mapping, normalized email, unauthenticated state, and missing Google link behavior.

## Refactor Summary
No refactor was needed after tests passed. The implementation intentionally remains pure and does not query Prisma yet.

## Deviations
No upstream artifact changes were required. This slice does not replace the dashboard mock identity yet; that should happen after server session retrieval and member repository reads are available.

## Remaining Risks
- Better Auth runtime session/account return shapes still need an integration adapter once `getCurrentMember` is wired to server requests.
- The dashboard still uses mock data until the app has repository-backed member and ledger reads.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm Google provider account id is the correct value to use as app `GoogleIdentity.subject`.
  - Confirm unlinked Google accounts continue to flow to the existing account-not-recognized state.
- must_check:
  - `resolveGoogleIdentityFromAuthSession` only returns an identity for the authenticated user's linked Google account.
  - Blank emails are not passed into member email fallback matching.
- acceptance_signals:
  - Auth/session boundary has a tested conversion into the Identity and Access domain language.
  - Existing household access resolution can consume the mapped identity without Better Auth coupling.
- unresolved_blockers:
  - None for this slice.
- next_step:
  - Add server-side `getCurrentMember` composition that reads Better Auth session, loads linked accounts/members from Prisma, and returns the app access profile.
