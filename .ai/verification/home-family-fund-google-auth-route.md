---
id: ver-home-family-fund-google-auth-route
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-google-auth-route
  - story-authenticated-household-access
  - exp-authenticated-household-access
outputs:
  - verification_result
  - test_results
  - findings
trace_links:
  implementation:
    - .ai/implementation/home-family-fund-google-auth-route.md
  code:
    - src/auth/config.ts
    - src/auth/config.test.ts
    - src/auth/index.ts
    - src/app/api/auth/[...all]/route.ts
    - .env.example
  acceptance_criteria:
    - AC1
    - AC2
    - AC20
reviewed_at:
---

# Verification Report for Google Auth Route

## Scope
This verification result supports `local_dev` for the Better Auth Google OAuth route entrypoint and environment contract. It verifies that the auth route compiles, the Google provider config is shaped correctly, local builds can run without real secrets, and production env enforcement remains explicit. It does not verify real Google OAuth login, database-backed sessions, member lookup, or route middleware.

## Commands Run
| Command | Result |
|---|---|
| `corepack pnpm test src/auth/config.test.ts` | Pass: 1 file, 3 tests |
| `corepack pnpm test` | Pass: 13 files, 64 tests |
| `corepack pnpm lint` | Pass |
| `corepack pnpm type-check` | Pass |
| `corepack pnpm build` | Pass: `/api/auth/[...all]` listed as dynamic route |

## Findings
| Severity | Finding | Evidence | Disposition |
|---|---|---|---|
| Medium | Better Auth persistence is not wired. | `createAuth` uses `better-auth/minimal` and no adapter. | Accepted for route/env slice; Prisma adapter and auth tables need a dedicated schema slice. |
| Medium | Home page still uses mock Google identity. | `src/app/page.tsx` defines `mockGoogleIdentity`. | Accepted until session-to-member lookup is implemented. |
| Low | Local non-production builds use placeholder OAuth credentials. | `readAuthEnvironment` defaults missing Google env outside production. | Accepted for local quality gates; production env remains mandatory. |

## Domain / UX Rule Check
| Rule | Source | Result |
|---|---|---|
| MVP authentication uses Google sign-in | ADR-10 | Pass partially: Better Auth route and Google provider config exist. Real provider credentials still required. |
| Google identity must map to app member before household data is available | AC2 | Not verified in this slice; covered by session access and home access view-model tests. |
| Basic lint, type-check, tests, and build are required | AC20 | Pass. |

## Code Review
- Boundary alignment: Pass. Auth provider setup lives in `src/auth`; app member authorization remains in Identity and Access.
- Maintainability: Pass. Env parsing and Better Auth config are testable without importing the route handler.
- Correctness: Pass with accepted risks. Production env enforcement is covered by unit tests, and Next build compiles the dynamic auth route.
- Deployment readiness: Partial. `.env.example` documents required variables, but real OAuth callback and provider console setup remain manual.

## Result
Pass with accepted risks. This slice is ready for the next implementation cycle. Recommended next work is adding Better Auth persistence schema/adapter, then mapping session users to household members.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm minimal-mode route is acceptable until persistence wiring.
  - Confirm env variable names match planned Vercel configuration.
- must_check:
  - Do not treat this as completed login.
  - Better Auth route remains buildable.
  - Production env requirements remain explicit.
- acceptance_signals:
  - Full local quality gate passes.
  - Auth route appears in build output.
- unresolved_blockers:
  - None for continuing implementation.
- next_step:
  - implementation-cycle
