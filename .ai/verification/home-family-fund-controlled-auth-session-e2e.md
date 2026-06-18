---
id: ver-home-family-fund-controlled-auth-session-e2e
stage: verification
status: approved
delivery_profile: mvp
release_target: local_dev
inputs:
  - impl-home-family-fund-controlled-auth-session-e2e
  - vd-home-family-fund-controlled-auth-session-e2e
outputs:
  - test_results
  - review_findings
  - domain_rule_check
trace_links:
  implementation:
    - .ai/implementation/home-family-fund-controlled-auth-session-e2e.md
  verification_design:
    - .ai/spec/home-family-fund-controlled-auth-session-e2e.md
  domain_rules:
    - Google sign-in is required before app access.
    - Google identity must map to an app member.
    - Inactive members cannot view household data.
reviewed_at: 2026-06-16
---

# Verification Report for Controlled Auth Session E2E

## Delivery Profile
This verification result supports `local_dev` under the MVP profile. It proves controlled current-member mapping and browser access states with deterministic local DB data. It does not prove production OAuth callback behavior, Better Auth cookie serialization, or deployment readiness.

## Run Tests
| Command / Check | Result | Evidence |
|---|---|---|
| `corepack pnpm test src/auth/server-current-member.test.ts src/auth/current-member.test.ts src/modules/identity-access/session-access.test.ts` | Pass | 3 files, 14 tests. |
| `corepack pnpm type-check` | Pass | Prisma generated; `tsc --noEmit` passed. |
| `corepack pnpm lint` | Pass | Prisma generated; `eslint .` passed. |
| `corepack pnpm test` | Pass | 24 files, 105 tests. |
| `corepack pnpm test:e2e` | Pass | 8 fixture smoke Playwright tests. |
| `docker compose up -d` | Pass | Started `home-fund-postgres`. |
| `corepack pnpm test:e2e:db` | Pass | Recreated `home_fund_e2e`, applied 2 migrations, seeded data, and passed 6 DB-backed Playwright tests. |

## Review
| Finding | Severity | Evidence | Resolution |
|---|---|---|---|
| Controlled auth does not verify Better Auth cookie serialization | Accepted MVP risk | Architecture ADR-1 and verification design delivery profile | Documented as local-dev current-member mapping coverage only. |
| E2E test hook must remain non-production | High | `server-current-member.test.ts` production-disabled case | Covered by unit/contract test and implementation guard. |
| Legacy fixed-member fixture still exists | Accepted MVP risk | `e2e/home.spec.ts` still uses `x-e2e-current-member-email` for smoke | Controlled DB E2E uses `x-e2e-auth-user-id`; fixture smoke remains separate. |

## Domain Rule Check
| Rule / Language / Boundary | Source Artifact | Implementation Evidence | Result |
|---|---|---|---|
| Google sign-in is required before app access | DDD policy, AC1 | `e2e-db/auth-session.spec.ts` unauthenticated gate test | Pass |
| Google identity must map to an app member | DDD policy, AC2-AC4 | Controlled `x-e2e-auth-user-id` path goes through account/member lookup and E2E linked/unlinked tests | Pass |
| Inactive members cannot view household data | Identity and Access, AC5 | Disabled member seed plus inactive access-state E2E test | Pass |
| Household data must not leak to blocked states | Story UX risk, AC1/AC4/AC5 | Blocked-state E2E tests assert dashboard metrics absent | Pass |
| Test auth controls are not production access paths | Architecture ADR-4, AC8 | Production unit test ignores controlled auth header | Pass |

## Traceability
| Implementation Item | Test Plan Item | BDD Scenario | AC | Story | Domain Event / Rule |
|---|---|---|---|---|---|
| `x-e2e-auth-user-id` controlled session user | Unit, Integration, Contract | Production ignores controlled auth headers | AC7, AC8 | Controlled Auth Session E2E | Test auth controls are not production access paths |
| Seeded `User` and `Account` rows | E2E data setup | Linked active Google user sees household dashboard | AC2, AC3, AC6 | Controlled Auth Session E2E | Google identity must map to an app member |
| `e2e-db/auth-session.spec.ts` unlinked scenario | E2E browser access states | Unlinked Google user is blocked | AC4 | Controlled Auth Session E2E | Google identity must map to an app member |
| Disabled member seed and E2E scenario | E2E browser access states | Inactive linked member is blocked | AC5 | Controlled Auth Session E2E | Inactive members cannot view household data |
| DB dashboard spec uses controlled auth | Contract, E2E | Linked active Google user sees household dashboard | AC2, AC3, AC9 | Controlled Auth Session E2E | Monthly records viewed |

## Decision
Pass for `local_dev` MVP verification. Production OAuth and Better Auth cookie/session serialization remain accepted risks outside this story.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm this is current-member mapping coverage, not production OAuth coverage.
  - Confirm fixed fixture smoke and controlled DB E2E remain separate.
- must_check:
  - `corepack pnpm test:e2e:db` remains green when Docker/Postgres is running.
  - Controlled auth E2E must not use `x-e2e-current-member-email`.
  - Production must ignore controlled auth headers.
- acceptance_signals:
  - Unit, integration, type-check, lint, fixture E2E, and DB-backed controlled auth E2E are green.
- unresolved_blockers:
  - None for this story.
- next_step:
  - Commit the controlled auth session E2E slice, then move to the next MVP hardening story.
