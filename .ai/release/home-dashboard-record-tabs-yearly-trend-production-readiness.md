---
id: release-home-dashboard-record-tabs-yearly-trend-production-readiness
stage: target-aware-release
status: blocked
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/home-dashboard-record-tabs-yearly-trend.md
  - .ai/prototype/home-dashboard-record-tabs-yearly-trend.md
  - .ai/spec/home-dashboard-record-tabs-yearly-trend.md
  - .ai/technical-design/home-dashboard-record-tabs-yearly-trend.md
  - .ai/implementation/home-dashboard-record-tabs-yearly-trend.md
  - .ai/verification/home-dashboard-record-tabs-yearly-trend.md
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - .ai/deployment/production-v0.1.2-2026-06-26.md
  - docs/deployment.md
  - .github/workflows/deploy-production.yml
outputs:
  - production_readiness_decision
  - production_evidence_audit
  - blocked_release_items
  - required_release_evidence
trace_links:
  - src/app/(app)/(home)/page.tsx
  - src/app/home-record-tabs.tsx
  - src/app/home-dashboard-data-source.ts
  - src/app/home-dashboard-data-source.test.ts
  - e2e/dashboard.spec.ts
  - prisma/seed.sh
reviewed_at: 2026-06-27
---

# Home Dashboard Record Tabs And Yearly Trend Production Readiness

## Decision

- decision: blocked_for_production
- target: production
- requested_action: deploy current home dashboard record tabs and yearly trend changes
- feature_verification_head: `9ee9567e7876671eaf6549b9ec8cdcd05a9bb70d`
- evidence_audit_started_from_head: `73968f1e`
- branch_state: detached HEAD
- tag_on_head: none
- production_workflow: `.github/workflows/deploy-production.yml`
- rationale: The change is verified for `local_dev`, but this workspace is not on a branch, the release commits are not on `main`, and the current commit has no immutable `vX.X.X` tag. The repository production policy only deploys version tags that already point to production-ready commits.

This gate intentionally stops before Release Execution. Deploying from this state would bypass the documented release strategy and would make rollback, audit, and production evidence ambiguous.

## Production Evidence Audit

Evidence checked on 2026-06-27 from the local Codex workspace and GitHub/Vercel network reads:

- GitHub auth: readable as repository account `and535014`.
- Remote `main`: `cef98eaaea51ad56fcc2569bbb34d624b3e955ac`.
- Remote branches:
  - `main` at `cef98eaaea51ad56fcc2569bbb34d624b3e955ac`
  - `codex/edit-reimbursement-payment-records` at `c7afae2c9183389219abb950be0ab9cf3a9f7bcf`
- Remote tags:
  - latest observed production tag: `v0.1.5`
  - `v0.1.5` resolves to commit `743a1c32666cae5c156578885baa0b609169c8aa`
- Latest `Deploy Production` workflow:
  - run: `28249000394`
  - run URL: `https://github.com/and535014/home-fund/actions/runs/28249000394`
  - status: completed
  - conclusion: success
  - event: push
  - version/tag branch: `v0.1.5`
  - head SHA: `743a1c32666cae5c156578885baa0b609169c8aa`
  - created at: `2026-06-26T15:47:50Z`
  - updated at: `2026-06-26T15:49:58Z`
- Workflow log evidence for `v0.1.5`:
  - checked out `refs/tags/v0.1.5`
  - ran production build for `home-family-fund@0.1.5`
  - deployed Vercel production artifact
  - recorded production deployment URL: `https://home-fund-qp9ivm9of-ythsiao.vercel.app`
  - workflow smoke ran `/login` and `/favicon.ico` against the deployment URL
- Manual HTTP checks from Codex:
  - `https://home-fund.vercel.app/login` returned HTTP success, but the response body appears to be a different Japanese login page (`ふたり家計`), so it is not reliable evidence for this release scope.
  - `https://home-fund-qp9ivm9of-ythsiao.vercel.app/login` returned HTTP success, but the response body is Vercel authentication UI, not the app login page.
  - `https://home-fund-qp9ivm9of-ythsiao.vercel.app/favicon.ico` returned HTTP success, but the response also appeared to be Vercel authentication UI rather than the app favicon.

Audit conclusion:

- Existing production deployment evidence is present for `v0.1.5`.
- Existing production deployment evidence is not evidence for this dashboard tabs/yearly trend change.
- The dashboard tabs/yearly trend commits are not present on any observed remote branch and are not reachable from any observed production tag.
- Manual app-level production smoke is inconclusive because the deployment URL appears protected by Vercel authentication and the documented public URL appears to serve a different app/version.

## Verified Inputs

The feature implementation has local verification evidence:

- `corepack pnpm vitest run src/app/home-dashboard-data-source.test.ts`
- `corepack pnpm lint`
- `corepack pnpm type-check`
- `CI=true corepack pnpm test:e2e e2e/dashboard.spec.ts`

Verification target was `local_dev`, not production.

## Production Policy Check

The documented production path requires:

- `main` contains the release commit.
- An immutable semver tag such as `v0.1.6` points to that commit.
- `deploy-production.yml` checks out `refs/tags/<version>`.
- GitHub Environment `production` approval happens before deployment.
- Production CI, build, migration, Vercel deployment, and smoke checks run in GitHub Actions.

Current local state does not satisfy this:

- `origin/main` is at `cef98eaa`.
- Current detached `HEAD` for this readiness audit is `73968f1e`.
- Commits between `origin/main` and `HEAD`:
  - `712012f2` Prototype home dashboard record tabs
  - `ec480ad3` Spec home dashboard record tabs
  - `e46f3f3a` Design home dashboard record tabs
  - `2b2f529b` Implement home dashboard record tabs
  - `9ee9567e` Verify home dashboard record tabs
  - `73968f1e` Assess production readiness for dashboard tabs
- No production tag points at `HEAD`.

Remote production evidence also confirms no production tag currently points at this release scope. The latest production tag is `v0.1.5`, which points at `743a1c32`, while this release scope is based on local commits through `73968f1e`.

## Required Before Release Execution

1. Put the release commits onto a named branch and integrate them into `main` through the normal review path, or explicitly accept a documented emergency release exception.
2. Confirm the intended next production version. `package.json` is currently `0.1.5`; the next tag would normally be `v0.1.6` unless another versioning decision is made.
3. Push the branch and confirm GitHub CI for the release commit.
4. Create and push an immutable `vX.X.X` tag only after the release commit is on `main`.
5. Confirm GitHub Environment `production` reviewer approval.
6. Confirm production secrets are present and current:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `BETTER_AUTH_URL`
   - `BETTER_AUTH_SECRET`
   - `CSV_IMPORT_PREVIEW_SECRET`
   - `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
7. Confirm production backup or point-in-time recovery evidence before migration.
8. After deployment, attach production evidence:
   - production URL
   - GitHub Actions run URL
   - Vercel deployment URL
   - `/login` smoke result
   - Google sign-in start result
   - admin dashboard access result
   - record tabs and yearly trend dashboard smoke result
   - Vercel runtime log review
   - rollback owner and rollback path

## Review Gate

- decision: blocked_for_production
- deployment_executed: no
- blocker_summary:
  - current work is not on `main`
  - current work is on detached `HEAD`
  - no production tag points at the release commit
  - latest production evidence only covers `v0.1.5`, not this feature
  - manual production smoke is inconclusive because observed URLs do not cleanly serve the expected app surface
  - this feature has only `local_dev` verification evidence
- recommended_next_gate: either integrate and tag through the documented production path, or explicitly approve a risk-accepted production release exception before Release Execution.
