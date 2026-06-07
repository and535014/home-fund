---
id: ver-home-family-fund-current-member-composition
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - impl-home-family-fund-current-member-composition
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

# Verification for Current Member Composition

## Commands Run
| Command | Result | Notes |
|---|---|---|
| `corepack pnpm test src/auth/current-member.test.ts` | Pass | 1 test file, 3 tests. |
| `corepack pnpm test` | Pass | 17 test files, 75 tests. |
| `corepack pnpm type-check` | Pass | Prisma client generated before `tsc --noEmit`. |
| `corepack pnpm lint` | Pass | Prisma client generated before `eslint .`. |
| `corepack pnpm build` | Pass | Next.js production build compiled `/` and `/api/auth/[...all]`. |

## Coverage Notes
- Verified unauthenticated sessions return `unauthenticated` without loading household data.
- Verified authenticated users without linked Google accounts return `google_account_not_linked`.
- Verified authenticated Google users resolve to an active household member profile through existing domain access logic.

## Residual Risk
This slice verifies the current-member composition contract only. A Prisma-backed data source and server request/session integration remain the next implementation steps.
