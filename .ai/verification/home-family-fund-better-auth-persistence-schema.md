---
id: ver-home-family-fund-better-auth-persistence-schema
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-better-auth-persistence-schema
  - arch-home-family-fund
outputs:
  - verification_result
  - test_results
  - findings
trace_links:
  implementation:
    - .ai/implementation/home-family-fund-better-auth-persistence-schema.md
  code:
    - prisma/schema.prisma
    - src/auth/config.ts
    - src/auth/config.test.ts
    - src/auth/prisma-adapter.ts
    - src/auth/prisma-adapter.test.ts
  acceptance_criteria:
    - AC1
    - AC2
    - AC20
reviewed_at:
---

# Verification Report for Better Auth Persistence Schema

## Scope
This verification result supports `local_dev` for the Better Auth persistence schema and adapter groundwork. It verifies Prisma schema validity, auth config database adapter injection, adapter factory construction, and the existing auth route build. It does not verify real database migrations, generated Prisma client runtime behavior, persisted sessions, or session-to-member lookup.

## Commands Run
| Command | Result |
|---|---|
| `DATABASE_URL="postgresql://user:password@localhost:5432/home_fund" corepack pnpm db:format` | Pass |
| `DATABASE_URL="postgresql://user:password@localhost:5432/home_fund" corepack pnpm db:validate` | Pass |
| `corepack pnpm test src/auth/config.test.ts src/auth/prisma-adapter.test.ts` | Pass: 2 files, 5 tests |
| `corepack pnpm test` | Pass: 14 files, 66 tests |
| `corepack pnpm lint` | Pass |
| `corepack pnpm type-check` | Pass |
| `corepack pnpm build` | Pass: `/api/auth/[...all]` listed as dynamic route |

## Findings
| Severity | Finding | Evidence | Disposition |
|---|---|---|---|
| Medium | Auth persistence is modeled but not wired into live runtime. | `createAuth` still calls `buildAuthConfig(readAuthEnvironment())` without a database adapter. | Accepted for schema/adapter groundwork; Prisma client runtime setup is next. |
| Medium | No migration has been generated or applied. | `prisma/migrations` remains absent for this slice. | Accepted for local schema validation; migration design is a separate step. |
| Low | Better Auth `User` and app `Member` are separate tables. | Prisma schema has both `User` and `Member`. | Intended boundary: Google proves identity, app member owns household authorization. Mapping remains a follow-up. |

## Domain / UX Rule Check
| Rule | Source | Result |
|---|---|---|
| MVP authentication uses Google sign-in | ADR-10 | Pass partially: Better Auth route, provider config, and persistence schema now exist. |
| Google identity must map to app member before household data is available | AC2 | Not fully verified here; schema supports auth identity but member mapping remains future work. |
| Basic lint, type-check, tests, and build are required | AC20 | Pass. |
| Prisma is the accepted MVP persistence layer | ADR-12 | Pass: Better Auth persistence is represented in Prisma schema and adapter factory. |

## Code Review
- Boundary alignment: Pass. Better Auth identity tables remain separate from app-owned household `Member`.
- Maintainability: Pass. Adapter creation is isolated and testable, and `buildAuthConfig` accepts injected persistence.
- Correctness: Pass with accepted risks. Schema matches Better Auth installed-version default fields inspected through `getSchema`.
- Deployment readiness: Partial. Real migration and Neon/Vercel environment validation remain future work.

## Result
Pass with accepted risks. This slice is ready for the next implementation cycle. Recommended next work is Prisma client generation/runtime setup, then injecting the adapter into `createAuth` and mapping Better Auth session data to household members.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm Better Auth identity tables remain separate from app `Member`.
  - Confirm no production persistence is claimed before migrations and runtime client setup.
- must_check:
  - Prisma schema validates.
  - Full local quality gate passes.
  - Auth route still builds.
- acceptance_signals:
  - Better Auth schema and adapter groundwork are in place.
  - Next implementation can wire runtime Prisma client intentionally.
- unresolved_blockers:
  - None for continuing implementation.
- next_step:
  - implementation-cycle
