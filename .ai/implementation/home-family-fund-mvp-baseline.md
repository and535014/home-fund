---
id: impl-home-family-fund-mvp-baseline
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
    - AC3
    - AC5
    - AC6
    - AC20
  bdd_scenarios:
    - General member cannot create a record for another member
    - Admin can manage a member's permissions
  test_plan_items:
    - Unit authorization decisions independent of UI
    - Quality Gate static checks
reviewed_at:
---

# Implementation Log for Home Family Fund MVP Baseline

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice establishes the accepted Next.js/TypeScript baseline, core quality gate scripts, and the first pure domain authorization rules before persistence, Google OAuth wiring, or user-facing financial workflows are implemented.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `authorization.test.ts` for unlinked Google accounts, browse access, cross-member create, finance-manager delete, admin delete, and reimbursement role checks | Failed before implementation, then passed | Added `src/modules/identity-access/authorization.ts` with command-level authorization rules | Covers AC3, AC5, AC6 and the first unit test plan item. |
| 2 | Quality gate execution for `test`, `type-check`, `lint`, and `build` | Initially failed on TypeScript `baseUrl` deprecation and ESLint 10 compatibility | Removed `baseUrl`, pinned ESLint to 9.x, set Next Turbopack root | Covers AC20 baseline commands and build readiness. |

## Coding Summary
- Added Next.js App Router project baseline with TypeScript, Tailwind CSS v4 entrypoint, ESLint, Vitest, Playwright config, and pnpm lockfile.
- Added a minimal app shell landing page in `src/app`.
- Added Identity and Access domain authorization types and rules for linked Google accounts, admin, finance manager, and general member roles.
- Added unit tests for the first authorization rules, including finance-manager reimbursement and MVP delete restriction.

## Refactor Summary
- Adjusted tooling after verification: ESLint was pinned to a Next-compatible 9.x range instead of `latest`.
- Removed deprecated TypeScript `baseUrl` usage.
- Set `turbopack.root` in `next.config.ts` so Next does not infer the workspace root from a parent lockfile.
- No behavioral refactor was performed after tests were green.

## Deviations
- Google OAuth itself is not implemented in this slice. The tested boundary starts at the app-owned `googleAccountLinked` member state, matching the verification precondition that local auth mocking/member linking may be chosen before coding auth.
- Database, Prisma schema, reimbursement status persistence, recurring rules, reports, and UI permission states are intentionally deferred to later implementation slices.

## Remaining Risks
- Role/capability expansion is represented only through roles so far; future member-management implementation should introduce configurable capabilities before admin-managed finance permissions are expanded.
- E2E command exists, but no browser workflow tests are implemented in this slice.
- Prisma is installed but not configured with schema or migrations yet.
- Better Auth is installed but not configured for Google OAuth yet.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm the first implementation slice is appropriately limited to project baseline and command-level authorization.
  - Confirm the tested MVP finance-manager delete restriction matches the accepted product decision.
- must_check:
  - `authorize` rejects unlinked Google accounts before any command.
  - UI visibility is not treated as authorization enforcement.
  - Quality gate scripts exist and pass locally.
- acceptance_signals:
  - `pnpm test`, `pnpm type-check`, `pnpm lint`, and `pnpm build` pass.
  - Authorization behavior is covered by unit tests before broader auth/ledger work.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
