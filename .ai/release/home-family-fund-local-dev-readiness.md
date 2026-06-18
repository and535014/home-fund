---
id: release-home-family-fund-local-dev-readiness
stage: release
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - ver-recurring-reminder-confirmation-ui
  - ver-home-family-fund-reimbursement-settlement-ui
  - .ai/workflow.md
outputs:
  - local_dev_release_assessment
  - release_checks
  - accepted_risks
  - production_gap_list
trace_links:
  verification:
    - .ai/verification/recurring-reminder-confirmation-ui.md
    - .ai/verification/home-family-fund-reimbursement-settlement-ui.md
  current_code:
    - package.json
    - playwright.config.ts
    - README.md
reviewed_at: 2026-06-18
---

# Local Dev Release Readiness for Home Family Fund

## Decision
- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_ready
- rationale: The current app has passing unit, type, lint, and DB-backed browser E2E coverage for the completed MVP hardening flows. It is suitable for local development review with Docker PostgreSQL and controlled E2E auth. It is not yet assessed for a hosted production environment.

## Included Local Dev Capabilities
| Capability | Status | Evidence |
|---|---|---|
| Google sign-in entry and current-member access gate | ready for local_dev | Existing auth/session implementation and controlled-auth E2E. |
| Dashboard read model and monthly totals | ready for local_dev | DB-backed dashboard E2E and recurring confirmation verification. |
| Ledger record creation | ready for local_dev | Browser create-record flow and unit coverage. |
| Permission matrix checks | ready for local_dev | DB-backed permission E2E. |
| Reimbursement settlement UI | ready for local_dev | Verification report and browser E2E. |
| Recurring reminder confirmation UI | ready for local_dev | `24213cd` and `.ai/verification/recurring-reminder-confirmation-ui.md`. |
| DB-backed E2E foundation | ready for local_dev | `pnpm test:e2e` now runs the DB-backed suite on port `3100`. |

## Release Checks
| Check | Command / Evidence | Status |
|---|---|---|
| Install/runtime scripts present | `package.json` has `dev`, `build`, `lint`, `type-check`, `test`, `test:e2e`, Prisma scripts | pass |
| Local DB setup documented | `README.md` documents Docker PostgreSQL and Prisma setup | pass |
| Unit and domain tests | `corepack pnpm test` | pass in latest verification |
| Type checking | `corepack pnpm type-check` | pass in latest verification |
| Lint | `corepack pnpm lint` | pass in latest verification |
| Browser E2E | `corepack pnpm test:e2e` | pass in latest verification, 19 DB-backed tests |
| E2E isolation | dedicated `E2E_PORT=3100`, `.next-e2e`, per-test DB reset | pass |

## Accepted Local Dev Risks
- Full DB-backed E2E is slower because it resets the database before each browser test.
- Quality scripts that run `prisma generate` should be run sequentially; parallel runs can race while creating generated Prisma directories.
- Controlled auth headers are intentionally available only outside production and remain part of the local/E2E workflow.
- Local dev review still depends on Docker Desktop and the local PostgreSQL service being available.

## Not Production Ready
Production release is blocked until these are decided and verified:
- Hosting target, database target, and environment separation.
- Production Google OAuth origin and redirect URI.
- `BETTER_AUTH_SECRET`, production `DATABASE_URL`, and secret management.
- Migration/rollback procedure and backup/restore expectation.
- Production smoke test using real OAuth rather than controlled E2E auth.
- Error monitoring, logging provider, analytics provider, and feedback channel.
- Deployment checklist and post-release tracking plan.

## Handoff
- decision: ready_for_user_local_dev_review
- recommended_next_skill: story-slicing or post-release-tracking after target selection
- next_step: Decide whether to review the current local_dev MVP manually, choose a production deployment target, or select the next product story.
