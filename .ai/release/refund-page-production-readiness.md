---
id: release-refund-page-production-readiness
stage: target-aware-release
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/refund-page.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/refund-page.md
  - .ai/prototype/refund-page.md
  - .ai/spec/refund-page.md
  - .ai/technical-design/refund-page.md
  - .ai/implementation/refund-page.md
  - .ai/verification/refund-page.md
  - docs/deployment.md
  - .github/workflows/deploy-production.yml
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - .ai/deployment/production-v0.1.2-2026-06-26.md
  - commit:2fbed3a0 feat: add refunds page
outputs:
  - production_readiness_decision
  - release_scope
  - production_preflight_evidence
  - deployment_requirements
  - smoke_check_plan
  - rollback_plan
  - residual_risks
trace_links:
  implementation_commit:
    - 2fbed3a0 feat: add refunds page
  verification:
    - .ai/verification/refund-page.md
  deployment_workflow:
    - .github/workflows/deploy-production.yml
  deployment_docs:
    - docs/deployment.md
reviewed_at: 2026-06-27
---

# Refund Page Production Readiness

## Decision

- decision: ready_with_required_production_release_steps
- production_code_candidate: pass
- release_execution_handoff: blocked_until_version_tag_and_live_evidence
- rationale: The refund page code passed production preflight checks available from the workspace, and the established production workflow can deploy immutable `vX.X.X` tags through GitHub Actions, Vercel, and Neon. Actual production release execution still requires a version tag, production workflow approval, live deployment evidence, and post-deploy smoke results.

This artifact upgrades the refund page target from `local_dev` to `production`. It does not claim the feature is already deployed.

## Release Scope

In scope:

- Deploy commit `2fbed3a0 feat: add refunds page` after it is merged/tagged for production.
- New authenticated `/refunds` route.
- Home `待退款` action linking to `/refunds?month=<month>`.
- Desktop `退款` navigation entry below `搜尋`.
- Mobile bottom tab omission for `退款`.
- Month/member-scoped refund page read model.
- Shared record detail, refund record detail, linked-record, and batch refund flows.
- Shared category/member query helpers and read-model module cleanup.

Out of scope:

- External payment execution or bank transfer integration.
- `/reimbursements` redirect policy.
- New database schema migration for this feature.
- Production analytics provider selection or new alerting implementation.

## Production Preflight Evidence

Passed on 2026-06-27:

```bash
corepack pnpm db:validate
```

Result: passed. Prisma schema is valid.

```bash
corepack pnpm type-check
```

Result: passed.

```bash
corepack pnpm lint
```

Result: passed.

```bash
corepack pnpm test
```

Result: passed. 61 test files, 278 tests.

```bash
corepack pnpm build
```

Result: passed. Next.js production build completed and `/refunds` is dynamic server-rendered.

```bash
corepack pnpm test:e2e e2e/refund-page.spec.ts
```

Result: passed. 3 Playwright tests.

Additional verification evidence:

- `.ai/verification/refund-page.md` records focused refund page tests: 12 test files, 57 tests.
- The refund page E2E covers dashboard entry, desktop navigation, mobile omission, member filtering, shared detail dialogs, selection summary, and cross-member batch refund validation.

## Migration And Data Safety

- This feature does not add or modify Prisma schema files or migration files.
- Production workflow still runs `corepack pnpm db:deploy`; expected result for this feature is no new migration to apply.
- Existing reimbursement payment tables and the existing migration history are reused.
- Rollback of app code should not require database rollback for this feature, because no new schema state is introduced.
- Existing production rollback policy still applies: Vercel rollback or redeploy a previous tag for app code; Neon backup/restore or forward migration for database issues.

## Secrets And Config

No new runtime secrets are introduced by this feature.

Existing production secrets still required by the app and workflow:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `CSV_IMPORT_PREVIEW_SECRET`
- `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Production readiness depends on the already-established GitHub Environment `production`, Vercel Production variables, and Neon production database configuration described in `docs/deployment.md`.

## Auth And Permission Checks

Covered by implementation/tests:

- `/refunds` is under the authenticated app layout.
- Refund page data loads through `requireAuthenticatedMember`.
- Refund page read model is scoped to the authenticated household.
- Batch refund action uses existing authorization and reimbursement command semantics.
- Refund record edit permission is passed explicitly to shared detail flow.
- Mobile hiding of `退款` is presentation-only and not authorization.

Production smoke still must confirm:

- Google sign-in starts from the production origin.
- Admin/finance-capable member can open `/refunds`.
- General member cannot perform unauthorized reimbursement mutation.
- Existing admin-only route denial still works.

## Routing, SEO, And Indexing

- `/refunds` is authenticated and dynamic; it should not be indexed as public content.
- No public SEO route changes are introduced.
- `/reimbursements` remains out of scope; no redirect is required for this release.
- The production build route table includes `ƒ /refunds`.

## Observability And Monitoring

Current production documentation expects manual review of Vercel runtime logs after deploy.

Minimum post-deploy checks for this feature:

- Vercel runtime logs show no repeated `/refunds` server errors.
- Production auth callback logs show no new failures.
- No Prisma errors appear when loading `/refunds`.
- No reimbursement command errors appear during a controlled same-member refund smoke, if a safe production test record is available.

Known operational gap inherited from prior production deployment record:

- Monitoring/error reporting provider remains undecided.
- Production deployment record still has pending evidence for production URL, GitHub Actions run URL, Vercel deployment URL, and manual smoke results.

## Production Deployment Requirements

Before release execution:

1. Merge or otherwise place commit `2fbed3a0` on the production release branch.
2. Create an immutable semver production tag, for example `v0.1.6`.
3. Push the tag to trigger `.github/workflows/deploy-production.yml`, or run the manual workflow for that existing tag.
4. Obtain GitHub Environment `production` approval.
5. Confirm workflow passes:
   - install
   - `db:validate`
   - `type-check`
   - `lint`
   - `test`
   - `build`
   - `db:deploy`
   - Vercel production artifact build
   - Vercel production deploy
   - workflow HTTP smoke for `/login` and `/favicon.ico`

After release execution:

1. Record production URL.
2. Record GitHub Actions run URL.
3. Record Vercel deployment URL.
4. Execute manual smoke checklist below.
5. Update or create a release-execution artifact with evidence.

## Production Smoke Checklist

Required general smoke:

- `/login` opens.
- Google sign-in starts from the production origin.
- Admin member reaches dashboard.
- Non-admin member cannot access admin-only routes.
- Logout returns to login.
- Main ledger/search views can read production data.
- Vercel runtime logs show no repeated errors.

Refund page smoke:

- Home `待退款` block shows `前往退款` and opens `/refunds?month=<current month>`.
- Desktop sidebar shows `退款` below `搜尋`.
- Mobile bottom tab bar does not show `退款`.
- `/refunds` loads for an authenticated member.
- Month switcher previous/next and custom month picker stay on `/refunds`.
- `全部` and member tabs render.
- Unpaid expense list and refund record list render or show empty states.
- Opening an unpaid expense uses the shared record detail dialog.
- Opening a refund record uses the shared refund record detail dialog.
- Selection mode shows selected count and total.
- Cross-member selection shows warning and disables confirmation.
- If safe production data exists, a finance-capable actor performs one same-member batch refund and verifies:
  - selected expenses leave the unpaid list after refresh.
  - a refund record appears in the refund record list.
  - ordinary income/expense totals are not inflated by the refund payment evidence.

## Rollback Plan

Preferred rollback if production issue is UI/read-model only:

- Vercel rollback to previous deployment, or redeploy previous known-good `vX.X.X` tag through the production workflow.

Database rollback:

- Not expected for this feature because it introduces no migration.
- If unrelated migration failure occurs during workflow `db:deploy`, follow `docs/deployment.md`: inspect Prisma migration state and Neon state; do not run production migration from local.

Forward-fix path:

- If `/refunds` alone fails, hide or remove the desktop navigation entry and home link in a hotfix tag while preserving existing search/detail reimbursement flows.

## Residual Risks

- Production live smoke is not executed from this workspace.
- Existing production deployment evidence gaps remain open from `.ai/deployment/production-v0.1.2-2026-06-26.md`.
- No hosted preview environment exists by project policy, so first hosted deployment of this feature will be production.
- E2E does not perform a successful same-member browser refund submission. Server/action/helper tests verify the command path; production smoke should include a controlled same-member refund only if safe test data exists.
- The commit is broad and includes feature plus supporting architecture cleanup. Full Vitest and production build passed, reducing but not eliminating regression risk.

## Review Gate

- decision: ready_with_required_production_release_steps
- must_accept_before_release_execution:
  - Production release will happen from an immutable `vX.X.X` tag, not directly from a branch.
  - Existing production evidence gaps must be filled after deployment.
  - No production readiness is complete until post-deploy smoke is recorded.
  - The absence of preview/staging is an accepted MVP risk.
- handoff:
  - release-execution only after version tag and production workflow approval path are ready.
