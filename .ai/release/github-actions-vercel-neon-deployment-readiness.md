---
id: release-github-actions-vercel-neon-deployment-readiness
stage: release
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .ai/release/home-family-fund-local-dev-readiness.md
  - .ai/foundation-architecture/home-family-fund.md
  - .ai/project-context.md
  - README.md
  - package.json
  - prisma.config.ts
outputs:
  - ci_only_pr_strategy
  - production_release_strategy
  - ci_gate_recommendation
  - migration_strategy
  - deployment_documentation_requirements
  - blocked_readiness_items
trace_links:
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/release/home-family-fund-local-dev-readiness.md
reviewed_at: 2026-06-26
---

# GitHub Actions Vercel/Neon Deployment Readiness

## Decision

- decision: not_ready_for_production_execution
- preview_readiness: explicitly_skipped_with_accepted_risk
- production_readiness: blocked_until_service_setup_and_live_smoke
- rationale: The deployment workflow and documentation now support production-only release through GitHub Actions. Preview is intentionally skipped to reduce MVP operational complexity. Actual production deployment is not ready because Vercel project identifiers, Neon production database, GitHub secrets/environment, Google OAuth callback URL, monitoring, and smoke checks have not been created or verified.

Passing this Target-Aware Release gate does not authorize production deployment. It authorizes repository merge and external service configuration before a stricter production execution gate.

## Release Scope

In scope for the deployment pipeline:

- GitHub Actions is the CI/CD control plane.
- Vercel hosts the Next.js app.
- Neon PostgreSQL hosts the production database.
- Pull requests run CI only and do not deploy.
- Hosted preview environment and preview migrations are explicitly skipped.
- Tags matching `vX.X.X` deploy production.
- Manual production deployment accepts a `vX.X.X` version input and deploys that exact tag.
- Production deployment requires GitHub Environment approval.
- Deployment documentation must explain initial setup and repeat release steps.

Out of scope for this release assessment:

- Product behavior changes.
- Automated per-PR Neon branch lifecycle.
- Automated Google OAuth end-to-end smoke with real Google credentials.
- Full zero-downtime migration framework.

## Target Environments

| Target | Purpose | App Runtime | Database | Deployment Trigger | Readiness |
|---|---|---|---|---|---|
| PR CI | Pull request quality gate | none | none | GitHub Actions `pull_request` | design-approved |
| production | Household-facing release | Vercel production | Neon production branch/database | Git tag `vX.X.X` or manual version input | blocked until setup, docs, smoke, and approval gates exist |

## PR CI Strategy

PRs should not deploy to hosted environments in the MVP:

- Run CI only.
- Do not expose production secrets to PR jobs.
- Do not run hosted database migrations from PRs.
- Do not configure Google OAuth for PR preview URLs.

Accepted risks:

- PRs have no hosted preview URL.
- UI review happens locally.
- Hosted database migration is first exercised during production deployment.

Upgrade path if needed later:

- Add staging or preview as a separate lifecycle change.
- Prefer a fixed Vercel URL or custom domain for real Google OAuth smoke.

## Production Strategy

Production deployment must be immutable-tag based:

- `push` tags matching `v*.*.*` start the production deployment workflow.
- `workflow_dispatch` accepts a required `version` input in `vX.X.X` form.
- Manual workflow checks out `refs/tags/${version}` and fails if the tag does not exist.
- Production deployment runs only after CI passes.
- Production deployment runs only after GitHub Environment `production` approval.
- Production deploy uses Vercel production environment and Neon production database.
- Production deployment applies migrations through `corepack pnpm db:deploy`.

Production must not deploy from a mutable branch ref.

## CI Gate Recommendation

Required PR and production CI checks:

| Check | Command | Blocks PR Merge | Blocks Production |
|---|---|---:|---:|
| Install | `corepack pnpm install --frozen-lockfile` | yes | yes |
| Prisma schema validation | `corepack pnpm db:validate` | yes | yes |
| TypeScript | `corepack pnpm type-check` | yes | yes |
| Lint | `corepack pnpm lint` | yes | yes |
| Unit/domain tests | `corepack pnpm test` | yes | yes |
| Production build | `corepack pnpm build` | yes | yes |

Recommended CI settings:

- Use `concurrency` per branch or PR to cancel stale runs.
- Cache pnpm store and Playwright browsers where safe.
- Run Prisma-generating commands sequentially inside each job because current scripts generate Prisma Client before checks.
- Upload test reports and build logs as artifacts when failures occur.

E2E recommendation:

- Keep Playwright as a required check before production.
- For PRs, start with scheduled or label-triggered E2E if runtime becomes too high.
- If E2E is required on every PR, use a GitHub Actions PostgreSQL service or dedicated E2E database distinct from production.

## Migration Strategy

PR CI:

- Do not run hosted migrations.
- Validate Prisma schema with `corepack pnpm db:validate`.

Production:

- Run `corepack pnpm db:deploy` after production approval and before Vercel production promotion/deploy.
- Do not run production migrations from a local machine.
- Store production database URL only in GitHub/Vercel secrets.
- Treat Vercel rollback as app rollback only; database rollback requires backup/restore or forward migration.
- Prefer backward-compatible migrations for production: add nullable columns/tables first, deploy compatible app code, backfill if needed, then remove old fields in a later release.

Open technical-design item:

- Decide whether `prisma.config.ts` should support `DATABASE_URL_UNPOOLED` for migration commands while app runtime uses pooled `DATABASE_URL`. This matches Vercel/Neon integration naming, while `DIRECT_URL` remains a local fallback.

## Secrets And Environment Variables

Required GitHub repository or environment secrets:

| Secret | Scope | Purpose |
|---|---|---|
| `VERCEL_TOKEN` | production | Deploy through Vercel CLI from GitHub Actions |
| `VERCEL_ORG_ID` | production | Vercel project lookup |
| `VERCEL_PROJECT_ID` | production | Vercel project lookup |
| `DATABASE_URL` | production environment | Production app/runtime database URL |
| `DATABASE_URL_UNPOOLED` | production environment | Production migration database URL |
| `BETTER_AUTH_URL` | production environment | Production app origin |
| `BETTER_AUTH_SECRET` | production environment | Production auth signing secret |
| `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY` | production environment | Production member binding token encryption |
| `GOOGLE_CLIENT_ID` | production environment | Production Google OAuth client |
| `GOOGLE_CLIENT_SECRET` | production environment | Production Google OAuth secret |
| `SEED_GOOGLE_ACCOUNT_EMAIL` | production environment | Production initial/admin seed only if explicit seed step remains allowed |

Runtime `DATABASE_URL` should use the Neon pooled connection string. Migration `DATABASE_URL_UNPOOLED` should use the Neon unpooled/direct connection string.

## OAuth And Auth Checks

Production setup must include:

- `BETTER_AUTH_URL` set to the production origin.
- Google OAuth authorized origin for the production URL.
- Google OAuth redirect URI: `<production-origin>/api/auth/callback/google`.

Smoke checks must verify:

- `/login` renders.
- Google sign-in can start from the deployed environment.
- Existing/admin member session reaches the dashboard.
- Non-admin access to admin-only routes is denied.
- Logout returns to login.

## Rollback And Backup Expectations

Production rollback:

- Vercel rollback can restore previous app code.
- Database rollback must be handled by backup/restore or forward migration.
- Before first production deploy, Neon backup/restore or point-in-time recovery expectation must be documented.
- Any destructive migration requires explicit pre-release backup confirmation.

## Observability And Learning

Minimum before production:

- Confirm where Vercel runtime logs are reviewed.
- Add a manual incident note path in deployment docs.
- Define post-deploy smoke checklist owner.

Recommended before broader use:

- Select error monitoring provider.
- Add uptime or synthetic check for production `/login`.
- Define feedback channel for household users.

## Deployment Documentation Requirements

Create a deployment guide in Traditional Chinese that includes:

- Architecture overview: GitHub Actions -> Vercel -> Neon -> Google OAuth.
- One-time GitHub setup:
  - repository secrets
  - GitHub Environment `production`
  - production approval rule
  - tag protection recommendation
- One-time Vercel setup:
  - project import/link
  - disable or avoid implicit Vercel Git auto-deploy as the source of truth
  - obtain org/project IDs
  - production environment variables
- One-time Neon setup:
  - create project
  - create production branch/database
  - copy pooled connection string for runtime
  - copy unpooled/direct connection string for `DATABASE_URL_UNPOOLED`
- One-time Google OAuth setup:
  - production origin and callback
- PR CI steps.
- Production tag release steps.
- Manual production deployment steps for a specific version.
- Migration policy.
- Rollback and backup policy.
- Post-deploy smoke checklist.
- Troubleshooting section for failed CI, failed migration, failed Vercel deploy, and OAuth callback mismatch.

## Blockers Before Production Execution

- GitHub Actions workflows need live GitHub validation after secrets are configured.
- Deployment documentation exists and needs live-service validation.
- Vercel project/team identifiers are unknown.
- Neon production database/branch is not configured in the repository.
- Google OAuth production callback is not verified.
- Monitoring/error reporting provider is not selected.
- Production backup/restore expectation is not documented.
- `DATABASE_URL_UNPOOLED` is adopted and needs live secret configuration.
- Production smoke checks are not automated or documented.

## Review Gate

- decision: approve_for_feature_technical_design
- reviewer_focus:
  - Confirm preview environment is intentionally skipped for the first version.
  - Confirm PRs run CI only and do not deploy.
  - Confirm production migration must run only in production workflows after approval.
  - Confirm `DATABASE_URL_UNPOOLED` is adopted for production migrations.
  - Confirm deployment docs should be created before workflow usage.
- accepted_risks:
  - PRs have no hosted preview URL.
  - Hosted database migrations are first exercised in production deploy.
  - Production zero-downtime migrations are not guaranteed yet.
  - Real Google OAuth smoke remains manual unless a later automation decision is made.
- recommended_next_gate: Feature Technical Design for GitHub Actions workflow files, Prisma connection secret model, and deployment documentation structure.
