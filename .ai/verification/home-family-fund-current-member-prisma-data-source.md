---
id: ver-home-family-fund-current-member-prisma-data-source
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - impl-home-family-fund-current-member-prisma-data-source
outputs:
  - test_results
  - quality_gate_results
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC4
    - AC20
  test_plan_items:
    - Contract: Auth/session boundary
    - Quality Gate: Static checks
reviewed_at:
---

# Verification for Current Member Prisma Data Source

## Commands Run
| Command | Result | Notes |
|---|---|---|
| `corepack pnpm test src/auth/current-member-data-source.test.ts` | Pass | 1 test file, 3 tests. |
| `corepack pnpm test` | Pass | 18 test files, 78 tests. |
| `corepack pnpm type-check` | Pass | Prisma client generated before `tsc --noEmit`. |
| `corepack pnpm lint` | Pass | Prisma client generated before `eslint .`. |
| `corepack pnpm build` | Pass | Next.js production build compiled `/` and `/api/auth/[...all]`. |

## Coverage Notes
- Verified Better Auth account rows are selected by `userId`.
- Verified household members are selected with role and capability relation rows.
- Verified Prisma member rows map to domain `HouseholdMemberAccount` values.
- Verified nullable Google email/subject values are omitted from domain objects.
- Verified Prisma schema can generate with `manage_recurring` capability.

## Residual Risk
This slice verifies query shape and mapping with an injected Prisma-like client. Request-level Better Auth session retrieval and route guard wiring remain separate implementation work.
