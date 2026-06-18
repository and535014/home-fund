---
id: spec-local-google-oauth-login
stage: spec
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/local-google-oauth-login.md
  - .ai/domain/home-family-fund.md
  - .ai/foundation-architecture/home-family-fund.md
  - .ai/code-understanding/home-family-fund.md
  - .ai/spec/story-authenticated-household-access.md
  - .ai/spec/story-mvp-hardening-controlled-auth-session-e2e.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - manual_smoke_plan
  - test_plan
trace_links:
  auth_routes:
    - src/app/auth/google/route.ts
    - src/app/api/auth/[...all]/route.ts
  auth_modules:
    - src/auth/config.ts
    - src/auth/index.ts
    - src/auth/google-sign-in.ts
    - src/auth/current-member.ts
    - src/auth/server-current-member.ts
    - src/auth/session-identity.ts
    - src/modules/identity-access/session-access.ts
  data_and_docs:
    - prisma/seed.sql
    - README.md
  existing_tests:
    - src/auth/config.test.ts
    - src/auth/google-sign-in.test.ts
    - src/auth/current-member.test.ts
    - src/auth/server-current-member.test.ts
    - e2e/auth-session.spec.ts
reviewed_at: 2026-06-19
---

# Local Google OAuth Login Behavior Spec

## Decision

- decision: proceed
- prototype_status: skipped_with_accepted_risk
- prototype_risk: No new screen or interaction model is required; the existing sign-in gate, account-not-linked state, inactive-member state, and dashboard are the reviewed user-facing surfaces.
- route: `/` with sign-in POST to `/auth/google` and Better Auth callback under `/api/auth/callback/google`
- next_gate: Feature Technical Design
- next_skill: feature-technical-design

## Final Acceptance Criteria

1. In local development, an unauthenticated visitor to `/` sees the existing Google sign-in gate with heading `請先使用 Google 登入`.
2. The `使用 Google 登入` action starts Better Auth Google social sign-in from `/auth/google`.
3. With real local Google OAuth credentials, `BETTER_AUTH_URL="http://localhost:3000"`, and Google Cloud redirect URI `http://localhost:3000/api/auth/callback/google`, Google OAuth redirects back to the local app after the user completes Google sign-in.
4. After callback, Better Auth persists a local session and the app reads that session from request headers on the next dashboard request.
5. A real Google OAuth account whose email matches `SEED_GOOGLE_ACCOUNT_EMAIL` maps to the seeded active household member even when the returned Google subject does not match the seed's E2E-only `googleSubject`.
6. A real or controlled Google account that is authenticated but not linked to any active member is blocked with heading `找不到家庭成員帳號` and cannot see household dashboard data.
7. A real or controlled Google account linked to an inactive member is blocked with heading `帳號尚未啟用` and cannot see household dashboard data.
8. Placeholder local Google credentials must not be treated as a successful real OAuth configuration; attempting sign-in with placeholders should produce a diagnosable local result rather than silently implying the app supports real OAuth.
9. Auth error callbacks return to `/` and show existing non-sensitive Traditional Chinese error copy through the access screen alert.
10. Controlled E2E auth remains available outside production for automated browser coverage and remains disabled in production.
11. The local Google OAuth smoke checklist records environment alignment, migration/seed state, OAuth redirect/callback result, authenticated dashboard result, and any accepted manual-only evidence.
12. No Google client secret, Better Auth secret, session token, OAuth code, access token, refresh token, or personal Google account detail is committed to the repository or written into `.ai` artifacts.

## BDD Scenarios

### Scenario: Local Visitor Starts Google OAuth

- Given the app is running at `http://localhost:3000`
- And the visitor has no Better Auth session
- When the visitor opens `/`
- Then the page shows `請先使用 Google 登入`
- When the visitor activates `使用 Google 登入`
- Then the app starts Google social sign-in
- And the browser is redirected to a Google OAuth authorization URL

### Scenario: Real Google Account Reaches Dashboard By Seed Email

- Given local `.env` contains real Google OAuth credentials
- And `BETTER_AUTH_URL` is `http://localhost:3000`
- And Google Cloud allows redirect URI `http://localhost:3000/api/auth/callback/google`
- And `SEED_GOOGLE_ACCOUNT_EMAIL` equals the Google account email used for sign-in
- And the local database has been migrated and seeded after setting that email
- When the user completes Google OAuth
- Then Better Auth creates or reads the local session
- And the app resolves the Google identity to the active seeded household member by subject or normalized email
- And the dashboard shows heading `家庭資金總覽`

### Scenario: Real Google Account Without Member Link Is Blocked

- Given local OAuth is configured correctly
- And the user signs in with a Google account whose email is not linked to an active seeded member
- When Google OAuth returns to the app
- Then the app shows `找不到家庭成員帳號`
- And no household dashboard data or command controls are visible
- And the user can choose `重新選擇 Google 帳號`

### Scenario: Inactive Linked Member Is Blocked

- Given an authenticated Google identity maps to a disabled member
- When the user opens `/`
- Then the app shows `帳號尚未啟用`
- And no household dashboard data or command controls are visible

### Scenario: Placeholder OAuth Credentials Are Diagnosable

- Given local development is using placeholder Google OAuth credentials
- When the visitor attempts `使用 Google 登入`
- Then the result clearly indicates Google OAuth is not configured for real local sign-in
- And the developer can identify that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` need real local values

### Scenario: Controlled Auth Remains A Test Fixture Only

- Given the app is running outside production
- When an E2E request includes a controlled auth user header
- Then the app can resolve linked, unlinked, and inactive account states for automated tests
- When the app is running in production
- Then controlled auth headers are ignored

## E2E Design

| Scenario | Route | Actor Fixture | Viewport | Selectors And Expected States |
|---|---|---|---|---|
| Unauthenticated gate | `/` | no session | desktop and mobile | heading `請先使用 Google 登入`; button `使用 Google 登入`; no heading `家庭資金總覽`. |
| Controlled linked account | `/?month=2026-06` | `x-e2e-auth-user-id: user-e2e-linked` | desktop | heading `家庭資金總覽`; known seed content `六月生活費`. |
| Controlled unlinked account | `/` | `x-e2e-auth-user-id: user-e2e-unlinked` | desktop | heading `找不到家庭成員帳號`; no household command controls. |
| Controlled inactive account | `/` | `x-e2e-auth-user-id: user-e2e-disabled` | desktop | heading `帳號尚未啟用`; no household command controls. |
| Production guard for controlled auth | current-member unit/integration boundary | forced `NODE_ENV=production` | not browser-dependent | controlled auth headers are ignored; request resolves through Better Auth session path. |
| Google sign-in route redirect contract | `/auth/google` POST unit/route boundary | mocked Better Auth API | not browser-dependent | Better Auth receives provider `google`, callback `/`, error callback `/`, and response preserves redirect and `set-cookie` headers. |
| Placeholder credential diagnostic | `/auth/google` POST or config boundary | local placeholder env | not browser-dependent | expected diagnostic behavior is asserted once technical design selects fail point. |

### Real OAuth Manual Smoke

Real Google OAuth is a local manual smoke check because Google sign-in automation is brittle, account-specific, and unsuitable for CI.

| Step | Expected Evidence |
|---|---|
| Confirm `.env` has `BETTER_AUTH_URL="http://localhost:3000"`, non-placeholder `BETTER_AUTH_SECRET`, non-placeholder `GOOGLE_CLIENT_ID`, non-placeholder `GOOGLE_CLIENT_SECRET`, and `SEED_GOOGLE_ACCOUNT_EMAIL` matching the intended Google account email. | Developer records only variable presence/alignment, never secret values. |
| Confirm Google Cloud OAuth client has authorized origin `http://localhost:3000` and redirect URI `http://localhost:3000/api/auth/callback/google`. | Developer records that the local origin and callback were checked. |
| Run migration and seed after setting `SEED_GOOGLE_ACCOUNT_EMAIL`. | Local command outcome recorded in verification. |
| Start the dev server at `http://localhost:3000`. | Local URL recorded. |
| Open `/`, click `使用 Google 登入`, complete Google sign-in, and allow callback. | Browser returns to local app without `state_mismatch` or Google redirect URI error. |
| Confirm authenticated dashboard appears with heading `家庭資金總覽`. | Screenshot or written smoke note may be recorded without exposing personal account data. |
| Optionally sign out or clear localhost cookies, then try an unlinked Google account. | Account-not-linked state appears and household data remains hidden. |

### Fixture And Mock Strategy

- Keep automated browser tests on controlled E2E auth for linked, unlinked, and inactive access states.
- Use unit tests for Better Auth sign-in request shape, redirect/header preservation, environment reading, current-member subject mapping, and email fallback mapping.
- Add or keep a test that proves a Google identity with an unmatched subject but matching normalized email resolves to the active seeded member.
- Do not automate entry of real Google credentials in Playwright.
- Do not store real OAuth credentials, cookies, or session records in fixtures.

### Accessible Selectors

- Sign-in gate heading: role/name `heading`, text `請先使用 Google 登入`.
- Sign-in button: role/name `button`, text `使用 Google 登入`.
- Auth error alert: role `alert`, existing Traditional Chinese error copy.
- Account-not-linked heading: role/name `heading`, text `找不到家庭成員帳號`.
- Inactive-member heading: role/name `heading`, text `帳號尚未啟用`.
- Dashboard heading: role/name `heading`, text `家庭資金總覽`.

### Responsive And Accessibility Checks

- The sign-in gate remains centered and readable on mobile and desktop.
- The sign-in button text and icon fit without wrapping into an incoherent layout.
- Auth error copy is announced through the existing alert region.
- Keyboard users can focus and submit the Google sign-in button.
- No dashboard content appears in the DOM for unauthenticated, unlinked, or inactive access states.

## Test Plan

| Level | Coverage |
|---|---|
| Unit | `readAuthEnvironment` distinguishes real credentials from placeholders and production missing-env behavior remains strict. |
| Unit | `startGoogleSignIn` sends Better Auth provider `google`, callback `/`, error callback `/`, request headers, and preserves redirect cookies. |
| Unit | Current-member resolution maps by Google subject first and normalized Google email second. |
| Unit | Server current-member resolution ignores controlled auth headers in production. |
| Integration | Local auth route behavior for placeholder or missing Google credentials follows the selected diagnostic strategy. |
| E2E | Controlled auth browser tests cover unauthenticated, linked, unlinked, and inactive states using existing guarded headers. |
| Manual local_dev | Real Google OAuth smoke confirms local origin/callback, seed email alignment, session creation, dashboard access, and blocked unlinked account behavior where feasible. |

## Technical Design Inputs

- Decide whether placeholder credentials should fail at app startup, fail only when `/auth/google` is submitted, or keep current behavior with clearer error messaging.
- Decide whether to add a local diagnostic function, route, or command for OAuth env and seed alignment.
- Decide how verification should record real OAuth smoke evidence without committing secrets or personal account data.
- Decide whether the seed should keep `googleSubject` fixed for controlled E2E while relying on email fallback for real OAuth, or whether seed should avoid subject values that can obscure real login behavior.
- Decide if localhost-only support is enough, or if `127.0.0.1` and alternate dev ports should be supported by documented configuration rather than code.
- Confirm that Better Auth callback and cookie behavior works with the selected `BETTER_AUTH_URL` and Next.js route runtime.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm manual real Google OAuth smoke is acceptable for local_dev integration proof.
  - Confirm controlled E2E remains the automated browser strategy.
  - Confirm placeholder credential behavior should be designed next rather than guessed during implementation.
  - Confirm seed email fallback is an intended local real-OAuth path.
- must_check:
  - Acceptance criteria distinguish unauthenticated, linked active, unlinked, inactive, placeholder-config, and production-guard behavior.
  - BDD scenarios use Identity and Access language and do not treat Google authentication as app authorization.
  - E2E design names routes, fixtures, viewports, selectors, manual smoke steps, accessibility, and secrets-handling constraints.
- unresolved_blockers:
  - Real OAuth cannot be completed by automation without a human-controlled Google account and local OAuth credentials.
- next_step:
  - Feature Technical Design
