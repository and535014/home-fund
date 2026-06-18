---
id: local-google-oauth-login
stage: intent
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-19-local-google-oauth-login
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/intent/home-family-fund.md
  - .ai/domain/home-family-fund.md
  - .ai/release/home-family-fund-local-dev-readiness.md
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  existing_domain:
    - .ai/domain/home-family-fund.md
  existing_release:
    - .ai/release/home-family-fund-local-dev-readiness.md
  current_code:
    - src/auth/config.ts
    - src/auth/index.ts
    - src/auth/google-sign-in.ts
    - src/auth/server-current-member.ts
    - src/auth/current-member.ts
    - src/auth/session-identity.ts
    - src/app/auth/google/route.ts
    - src/app/api/auth/[...all]/route.ts
    - prisma/seed.sql
    - README.md
reviewed_at: 2026-06-19
---

# Local Google OAuth Login

## Decision Summary

- decision: proceed
- first_next_gate: Behavior Spec / BDD / E2E
- owning_skill: behavior-spec
- reason: The app already has Better Auth, Google OAuth routes, current-member mapping, seed guidance, and controlled-auth E2E. The missing decision is the exact local_dev behavior and verification path for a real Google OAuth session, including environment validation, seed account matching, and local smoke evidence.

## User Request

I want local development to actually allow signing in with Google.

## Change Classification

- change_type: feature_change
- secondary_types:
  - backend_behavior
  - auth_integration
  - local_dev_release_change
  - documentation_or_setup
- release_target: local_dev

## Affected Surfaces

| Surface | Impact |
|---|---|
| Auth | Real Google OAuth must start from the existing sign-in gate and complete through Better Auth callback routes. |
| Environment config | Local `.env` must use real `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`; placeholder credentials should not be mistaken for working OAuth. |
| Data/seed | The Google email used in local OAuth must map to an active household member through `SEED_GOOGLE_ACCOUNT_EMAIL` and seed data. |
| Routes | `/auth/google` and `/api/auth/callback/google` must work with `http://localhost:3000` during local development. |
| Access control | After OAuth, the app must still resolve the Google identity to app-owned household membership and block unlinked or inactive accounts. |
| Tests | Existing controlled-auth tests cover current-member behavior; this slice needs a local real-OAuth smoke plan that is likely manual because Google OAuth cannot be automated reliably in CI. |
| Release readiness | Local dev readiness must distinguish "controlled E2E auth works" from "real Google OAuth was smoke-tested locally." |
| Documentation | README or local setup notes may need sharper validation steps and troubleshooting for callback URI, seed email, cookies, and placeholder credentials. |

## Current Code Signals

- `src/auth/config.ts` reads Google OAuth env and uses local placeholders outside production.
- `src/auth/google-sign-in.ts` calls Better Auth `signInSocial` for provider `google` and redirects to the provider URL.
- `src/app/auth/google/route.ts` exposes the local sign-in POST entry.
- `src/app/api/auth/[...all]/route.ts` delegates Better Auth callback handling.
- `src/auth/current-member.ts` resolves the Better Auth session user to a Google account identity, then to an active household member.
- `src/auth/server-current-member.ts` supports controlled E2E overrides outside production; those are not proof of real Google OAuth.
- `README.md` already documents Google OAuth setup, callback URI, and `SEED_GOOGLE_ACCOUNT_EMAIL`.
- `.ai/release/home-family-fund-local-dev-readiness.md` currently marks Google sign-in ready for local_dev based on auth/session implementation and controlled-auth E2E, while production OAuth smoke is explicitly not assessed.

## Domain Discovery Need

- required: false
- reason: The durable domain rule already says all functional pages require Google sign-in and app-owned member authorization. This request does not change member roles, permissions, lifecycle states, or household access policy.

## Foundation Architecture Need

- required: false
- reason: The existing foundation already selected Next.js, Better Auth, Prisma, PostgreSQL, local Docker database, Vitest, Playwright, and local dev scripts.

## Foundation Implementation Need

- required: false
- reason: The scaffold, auth route shape, database adapter, seed workflow, and dev server are already present. Any required work should be scoped as feature behavior and local release hardening, not repo foundation.

## Experience Prototype Need

- required: false
- reason: No new user-facing page or interaction model is requested. The existing sign-in gate and blocked account states are sufficient unless Behavior Spec discovers a need for new local config/error UI.

## Behavior Spec / BDD / E2E Need

- required: true
- timing: next
- reason: The requested outcome must be stated as verifiable behavior before implementation: real OAuth starts, callback completes, linked active Google user reaches the dashboard, unlinked account remains blocked, and local setup errors are diagnosable.
- scenarios_to_cover:
  - With real local Google OAuth credentials and matching seed email, a user can click "使用 Google 登入", complete Google OAuth, and land on the authenticated dashboard.
  - With placeholder or missing Google credentials in local development, the app should fail clearly enough that the developer knows OAuth is not configured.
  - With real OAuth but a Google email that is not linked to an active member, the app blocks access with the existing account-not-linked state.
  - With real OAuth and an inactive linked member, the app blocks access with the existing inactive-member state.
  - Controlled E2E auth remains available outside production and remains disabled in production.
  - Local smoke evidence records Google Cloud redirect URI, seed email alignment, DB migration/seed state, and callback result.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: The implementation may need decisions about local placeholder credential handling, auth error surfacing, setup validation, callback URL/origin behavior, manual smoke scripts, and whether release readiness should record manual proof separately from automated E2E.

## Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: OAuth is an integration/config/secrets concern even for local_dev. The release artifact should explicitly state whether real Google OAuth has been smoke-tested locally, not only controlled-auth browser tests.
- learning_loop_required: false
- learning_reason: This is local developer enablement and auth smoke readiness, not a production product experiment or analytics-driven release.

## Open Questions

- Should local development hard-fail when Google OAuth credentials are placeholders, or keep the app bootable and show a clearer sign-in error only when OAuth is attempted?
- Should the local smoke process stay manual, or should we add a small diagnostic command/page that validates OAuth env and seed alignment without initiating Google OAuth?
- Which Google account email should be seeded as the active local household member? This should be supplied only through local `.env`, not committed.
- Is `http://localhost:3000` the only required local origin, or should `http://127.0.0.1:3000` and alternate dev ports be supported too?

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm that the goal is local_dev real Google OAuth, not production OAuth readiness.
  - Confirm that no new sign-in UI is needed unless config/error behavior requires it.
  - Confirm whether placeholder credentials should be blocked at startup or surfaced during sign-in.
  - Confirm that manual Google OAuth smoke evidence is acceptable where CI automation is impractical.
- acceptance_signals:
  - The next gate can define concrete BDD scenarios and local smoke steps without changing product policy.
  - Technical design can focus on config validation, Better Auth callback behavior, seed matching, and verification evidence.
- unresolved_blockers:
  - Real OAuth cannot be fully verified by the agent unless local Google OAuth credentials are present in the environment and a browser login can be completed by a human.
- next_step:
  - Behavior Spec / BDD / E2E
