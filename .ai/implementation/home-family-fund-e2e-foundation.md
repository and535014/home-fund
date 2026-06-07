---
id: impl-home-family-fund-e2e-foundation
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-google-sign-in-entry
  - impl-home-family-fund-homepage-auth-gate
  - impl-home-family-fund-app-shell-dashboard
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC18
    - AC19
    - AC20
    - AC21
  bdd_scenarios:
    - Google sign-in and household authorization: Unlinked Google account cannot access household data
    - Responsive and accessible core workflows: Finance manager settles reimbursement on mobile
  test_plan_items:
    - E2E Critical happy path
    - E2E Responsive workflows
    - E2E Accessibility smoke
    - Quality Gate Static checks
reviewed_at:
---

# Implementation Log for E2E Foundation

## Delivery Profile
This implementation supports `local_dev` under the MVP profile. The slice establishes a Playwright E2E foundation for the homepage access gate, dashboard smoke coverage, and mobile overflow checks without requiring live Google OAuth or a running Postgres database.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `e2e/home.spec.ts` blocked homepage and auth error tests | Passed after Playwright webServer configuration was validated | Added `playwright.config.ts` webServer coverage for local dev | Covers unauthenticated access and auth callback error visibility. |
| 2 | Dashboard smoke test using an E2E linked household member | Failed while reusing a dev server without E2E env, then passed after switching to request-header controlled fixture auth | Added non-production `x-e2e-current-member-email` override and fixture dashboard data | Avoids external OAuth and database dependencies for this foundation slice. |
| 3 | Mobile dashboard overflow test | Passed after dashboard fixture was reachable in both Playwright projects | Added responsive E2E assertion for document-level horizontal overflow | Runs under desktop Chromium and Pixel 7 projects. |

## Coding Summary
- Added `e2e/home.spec.ts` with homepage access, auth error, dashboard, and mobile overflow smoke tests.
- Added Playwright `webServer` configuration so `pnpm test:e2e` can start or reuse the local dev server.
- Added a production-disabled E2E current-member override keyed by `x-e2e-current-member-email`.
- Added fixture dashboard data that exercises income, member-paid expense, fund-paid expense, reimbursement, categories, and pending recurring items.
- Passed `currentMonth` through the dashboard layout contract from the homepage.

## Refactor Summary
- Kept E2E-only auth and dashboard fixture behavior behind production guards and explicit test headers.
- Did not refactor the dashboard layout or domain read models; fixture data reuses existing app types.

## Deviations
- This slice does not perform real Google OAuth or database-backed E2E setup.
- The E2E dashboard fixture is intentionally local-dev only and exists to stabilize browser workflow coverage before database lifecycle automation is added.

## Remaining Risks
- Real Better Auth session cookies, Google redirect behavior, and Prisma-backed dashboard reads still need a later DB/OAuth E2E slice.
- The reimbursement action itself is not yet automated through the browser; current coverage checks visibility and reachability of the reimbursement area.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm request-header E2E override is acceptable for local dev and remains disabled in production.
  - Confirm fixture coverage is sufficient as a foundation before DB-backed E2E.
- must_check:
  - Unauthenticated users still see the Google sign-in gate without household data.
  - E2E dashboard fixture requires the explicit test header.
  - Mobile dashboard has no document-level horizontal overflow.
- acceptance_signals:
  - `pnpm test:e2e` passes across desktop and mobile Playwright projects.
  - Full unit test, lint, type-check, and build gates pass.
- unresolved_blockers:
  - None for this foundation slice.
- next_step:
  - verification-runner
