---
id: ver-home-family-fund-server-current-member
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - impl-home-family-fund-server-current-member
outputs:
  - test_results
  - quality_gate_results
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC20
  test_plan_items:
    - Contract: Auth/session boundary
    - Quality Gate: Static checks
reviewed_at:
---

# Verification for Server Current Member

## Commands Run
| Command | Result | Notes |
|---|---|---|
| `corepack pnpm test src/auth/server-current-member.test.ts` | Pass | 1 test file, 3 tests. |
| `corepack pnpm test` | Pass | 19 test files, 81 tests. |
| `corepack pnpm type-check` | Pass | Prisma client generated before `tsc --noEmit`. |
| `corepack pnpm lint` | Pass | Prisma client generated before `eslint .`. |
| `corepack pnpm build` | Pass | Next.js production build compiled `/` and `/api/auth/[...all]`. |

## Coverage Notes
- Verified Better Auth session lookup receives request headers.
- Verified missing Better Auth session returns `unauthenticated`.
- Verified session user data resolves through current-member composition into an active household member.

## Residual Risk
This slice verifies the request-level helper and runtime wiring compiles. The helper is not yet used by the homepage, protected routes, or server actions.
