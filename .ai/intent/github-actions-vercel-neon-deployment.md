---
id: github-actions-vercel-neon-deployment
stage: intent
status: complete
workflow_version: ddd-website-lifecycle-v2
project_type: release_change
delivery_profile: mvp
release_target: production
inputs:
  - user_prompt:2026-06-26-deployment-environment
  - user_prompt:2026-06-26-github-actions-cicd
  - user_prompt:2026-06-26-deployment-setup-docs
outputs:
  - deployment_intent
  - affected_surfaces
  - success_criteria
  - routing_decision
trace_links:
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - .ai/release/home-family-fund-local-dev-readiness.md
  - .ai/foundation-architecture/home-family-fund.md
  - README.md
  - package.json
  - prisma.config.ts
  - prisma/schema.prisma
reviewed_at: 2026-06-26
---

# GitHub Actions Vercel/Neon Deployment

## Problem

Home Family Fund is ready for local development review but does not yet have a controlled hosted deployment path. Production readiness is explicitly unresolved in the current release artifact, especially around hosting target, database target, environment separation, OAuth callback configuration, migration deployment, rollback, monitoring, and smoke checks.

The deployment workflow must be reproducible and auditable through GitHub Actions rather than relying on manual Vercel dashboard deploys or implicit platform automation.

## Audience

- Maintainer deploying and operating the app.
- Household users who need a stable production URL after release.
- Future contributors who need a clear PR CI signal before release.

## Desired Outcome

The repository has a documented GitHub Actions-based CI/CD path:

- Pull requests run CI without deploying a hosted preview environment.
- Semver tags deploy immutable versions to production.
- A manual production deployment can deploy a specific `vX.X.X` tag by version input.
- Deployment setup documentation explains each required service, secret, environment variable, OAuth callback, database migration, and smoke-test step.
- CI failures block deployment, and production deployment remains gated by explicit approval.

## Affected Surfaces

- release: GitHub Actions CI/CD workflows, release gating, tag deployment, manual production deployment.
- data: Neon PostgreSQL environment separation, migration deploy, backup/restore expectation.
- auth: Better Auth base URL, Google OAuth origins and redirect URIs per environment.
- backend/API: Next.js server runtime, Prisma Client generation, production `DATABASE_URL` requirements.
- documentation: README or deployment-specific docs with step-by-step setup instructions.
- learning: production monitoring, smoke checks, and post-release feedback channels.

## Scope

In scope:

- Use GitHub Actions as the authoritative CI/CD runner.
- Use Vercel as the Next.js hosting target.
- Use Neon PostgreSQL as the production hosted database target.
- Keep PRs as CI-only; do not add hosted preview deployment.
- Add production deployment on tags matching `vX.X.X`.
- Add manual production deployment through `workflow_dispatch` with a required version input in `vX.X.X` form.
- Define the CI gate for lint, type-check, unit tests, build, Prisma validation, and E2E strategy.
- Define production migration deployment using `corepack pnpm db:deploy`.
- Define required GitHub repository secrets, GitHub production environment, Vercel production environment, Neon production database, and Google OAuth settings.
- Add step-by-step deployment documentation for initial setup and repeat releases.

Out of scope for this intent:

- Changing product behavior or UI workflows.
- Replacing Better Auth, Prisma, Vercel, Neon, or GitHub Actions.
- Implementing bank integrations, payment execution, or external notification delivery.
- Guaranteeing zero-downtime migrations without a separate migration safety design.

## Constraints

- All production deployment must run through GitHub Actions.
- Pull requests must not deploy to hosted environments.
- Production deployment from Git tags must use immutable tags in `vX.X.X` format.
- Manual production deployment must accept a version such as `v1.2.3` and deploy that exact tag.
- Production should use GitHub Environment protection for approval before deploying.
- Production database credentials must not be stored locally or committed.
- Production secrets must not be available to ordinary PR CI jobs.
- Google OAuth origin and redirect URI must match the production URL.
- Database rollback is not equivalent to Vercel app rollback; migration strategy must be explicit before production.
- Documentation must use Traditional Chinese and Taiwan terminology.

## Success Criteria

- A maintainer can follow documentation from an empty deployment setup to a working production environment.
- A PR runs CI without deploying or running hosted database migrations.
- A `vX.X.X` tag can deploy production through GitHub Actions.
- The manual workflow rejects invalid version input and checks out the requested tag before deploying production.
- Production deployment runs database migrations through a controlled step before or during release.
- Required secrets and environment variables are documented without exposing secret values.
- The docs include Google OAuth setup for production origin/callback.
- The docs include Neon setup for production database and migration connection.
- The docs include Vercel project linking and token setup.
- The docs include post-deploy smoke checks and rollback expectations.
- CI guidance identifies required, optional, and production-only checks.

## CI Recommendations To Validate In The Next Gate

- PR required checks:
  - `corepack pnpm install --frozen-lockfile`
  - `corepack pnpm db:validate`
  - `corepack pnpm type-check`
  - `corepack pnpm lint`
  - `corepack pnpm test`
  - `corepack pnpm build`
- E2E strategy:
  - Run Playwright against an isolated PostgreSQL service or a disposable hosted database target.
  - Upload Playwright reports and traces as artifacts when tests fail.
  - Use `concurrency` to cancel older runs for the same PR.
- Production-only release checks:
  - Verify tag format and tag checkout.
  - Apply Prisma migrations through `corepack pnpm db:deploy`.
  - Run smoke checks against the production deployment URL after deploy.
  - Require GitHub Environment approval before production steps run.

## Routing Decision

- Domain Discovery: not required. This is operational release work, not a new domain behavior or business policy.
- Project Foundation Architecture: required only as a focused deployment architecture update if the next gate finds current foundation decisions insufficient for CI/CD and hosted runtime.
- Project Foundation Implementation / Init: not required as a separate gate unless CI baseline tooling is missing.
- Experience Prototype: not required. This change does not alter user-facing product UI.
- Behavior Spec / BDD / E2E: not required for product behavior, but CI/E2E release checks must be specified in Target-Aware Release.
- Feature Technical Design: recommended for workflow file boundaries, secret names, Prisma direct/pooled connection decision, and documentation structure.
- Target-Aware Release: required for production readiness, because this change introduces hosted deployment, secrets, OAuth callbacks, migrations, rollback, and smoke checks.
- Learning Loop: required or explicitly skipped after production release readiness, because monitoring, feedback, and post-release checks are part of production operation.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm GitHub Actions is the only intended CI/CD control plane.
  - Confirm Vercel plus Neon is the accepted hosted deployment target.
  - Confirm production deployment should be tag-based with manual `vX.X.X` redeploy support.
  - Confirm production should require GitHub Environment approval.
  - Confirm deployment documentation should be added before first hosted deployment.
- must_check:
  - Pull requests do not use hosted deployment databases.
  - Production OAuth callback setup is explicitly documented.
  - Production migration and rollback risks are not hidden behind Vercel rollback.
  - Manual deployment can only deploy existing immutable tags.
  - CI cost and runtime are acceptable for PRs.
- acceptance_signals:
  - The next gate can design exact workflows, secret names, environment names, and docs structure without inventing missing intent.
  - The maintainer agrees that production readiness is not implied until Target-Aware Release is completed.
- unresolved_blockers:
  - Exact Vercel project/team identifiers are not known yet.
  - Exact Neon project/database/branch naming is not known yet.
  - Monitoring/error reporting provider is not selected yet.
  - Whether production smoke checks should be manual checklist-only or automated HTTP checks is not decided.
- approved_decisions:
  - GitHub Actions is the intended CI/CD control plane.
  - Vercel plus Neon is the accepted hosted deployment target.
  - Production deployment should be tag-based with manual `vX.X.X` redeploy support.
  - Pull requests should run CI only, with no hosted preview deployment.
  - Preview environment is explicitly skipped for the MVP.
  - Production should require GitHub Environment approval.
  - Deployment documentation should be added before first hosted deployment.
- recommended_next_gate: Target-Aware Release for production deployment pipeline, followed by Feature Technical Design for workflow/doc implementation details.
