---
id: ver-home-family-fund-session-identity-mapping
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - impl-home-family-fund-session-identity-mapping
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

# Verification for Session Identity Mapping

## Commands Run
| Command | Result | Notes |
|---|---|---|
| `corepack pnpm test src/auth/session-identity.test.ts` | Pass | 1 test file, 4 tests. |
| `corepack pnpm test` | Pass | 16 test files, 72 tests. |
| `corepack pnpm type-check` | Pass | Prisma client generated before `tsc --noEmit`. |
| `corepack pnpm lint` | Pass | Prisma client generated before `eslint .`. |
| `corepack pnpm build` | Pass | Next.js production build compiled `/` and `/api/auth/[...all]`. |

## Coverage Notes
- Verified unauthenticated sessions do not produce a Google identity.
- Verified only a Google account linked to the authenticated Better Auth user maps to `GoogleIdentity.subject`.
- Verified emails are trimmed/lowercased and blank email values are omitted.

## Residual Risk
This slice verifies pure auth identity mapping only. Server-side session loading and Prisma-backed member lookup remain the next implementation step.
