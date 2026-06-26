---
id: impl-github-actions-vercel-neon-deployment
stage: implementation
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - .ai/technical-design/github-actions-vercel-neon-deployment.md
outputs:
  - prisma_direct_url_support
  - github_actions_ci_workflow
  - github_actions_production_deploy_workflow
  - deployment_documentation
trace_links:
  - prisma.config.ts
  - .github/workflows/ci.yml
  - .github/workflows/deploy-production.yml
  - docs/deployment.md
  - README.md
reviewed_at: 2026-06-26
---

# GitHub Actions Vercel/Neon Deployment Implementation

## Summary

Implemented the approved CI/CD deployment slice for GitHub Actions, Vercel, and Neon.

## Changes

- Updated `prisma.config.ts` to prefer `DATABASE_URL_UNPOOLED`, then `DIRECT_URL`, then `DATABASE_URL`, then the local default. This keeps local development compatible while allowing GitHub Actions migration jobs to use Neon/Vercel unpooled connections.
- Added `.github/workflows/ci.yml` with the required quality gate:
  - install
  - Prisma schema validation
  - type-check
  - lint
  - unit tests
  - build
- Removed preview deployment from the first deployment version:
  - PRs run CI only.
  - PRs do not deploy to Vercel.
  - PRs do not run hosted database migrations.
  - PRs do not receive production secrets.
- Added `.github/workflows/deploy-production.yml` for production deployment:
  - tag trigger for `v*.*.*`
  - manual `workflow_dispatch` version input
  - `vX.X.X` validation
  - checkout by tag ref only
  - production GitHub Environment approval
  - production database migration before Vercel deploy
  - smoke checklist in job summary
- Added `docs/deployment.md` with Traditional Chinese step-by-step deployment setup and operating instructions.
- Added README deployment entry linking to the deployment guide.

## Accepted Implementation Limits

- GitHub Actions Playwright E2E is deferred because the current E2E setup assumes local Docker Compose PostgreSQL.
- Preview environment is explicitly skipped in the first version.
- Real Google OAuth smoke is documented as a manual check against the production origin.
- Live Vercel/Neon/GitHub secret validation cannot run until external services and secrets are configured.

## Commands Planned For Verification

- `corepack pnpm db:validate`
- `corepack pnpm type-check`
- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`
- static workflow inspection

## Review Gate

- decision: ready_for_verification
- recommended_next_gate: Verification for local checks, workflow static review, and remaining live-service gaps.
