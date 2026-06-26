---
id: tech-github-actions-vercel-neon-deployment
stage: technical-design
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - .ai/release/home-family-fund-local-dev-readiness.md
  - .ai/foundation-architecture/home-family-fund.md
  - package.json
  - prisma.config.ts
  - playwright.config.ts
  - e2e/setup-db.sh
outputs:
  - workflow_boundaries
  - secret_model
  - prisma_connection_decision
  - ci_test_mapping
  - deployment_docs_structure
  - implementation_preconditions
trace_links:
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - .ai/workflow.md
reviewed_at: 2026-06-26
---

# GitHub Actions Vercel/Neon Deployment Technical Design

## Decision

- decision: ready_for_tdd_implementation
- release_target_supported_by_design: PR CI and production pipeline implementation
- production_execution: still blocked until workflows, secrets, docs, and smoke checks are implemented and verified
- rationale: The release gate defines the target deployment strategy. This design fixes the implementation boundaries, workflow files, secret model, migration connection model, and documentation structure needed for the next implementation slice.

## Accepted Gate Exceptions

This is operational release work, not a user-facing behavior slice:

- Experience Prototype: not applicable.
- Behavior Spec / BDD / E2E: not applicable for product behavior; CI and release checks are the behavior contract.
- Domain Discovery: not required.

The release artifact is the source of acceptance criteria for this design.

## Files To Add Or Change

| Path | Ownership | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | Engineering quality boundary | Required PR/push quality gate: install, Prisma validate, type-check, lint, unit tests, build. |
| `.github/workflows/deploy-production.yml` | Release boundary | Production deployment from `vX.X.X` tag or manual version input, protected by production environment approval. |
| `prisma.config.ts` | Persistence boundary | Use `DATABASE_URL_UNPOOLED` for Prisma CLI migrations when available, with `DIRECT_URL` and `DATABASE_URL` fallback for local compatibility. |
| `docs/deployment.md` | Release documentation | Step-by-step setup and operating guide in Traditional Chinese. |
| `README.md` | Project entry docs | Link to deployment guide and keep local-development docs concise. |
| `.ai/implementation/github-actions-vercel-neon-deployment.md` | Workflow evidence | Record implementation decisions, commands, and known gaps. |
| `.ai/verification/github-actions-vercel-neon-deployment.md` | Verification evidence | Record static workflow validation, local checks, and remaining live-service checks. |

## Workflow Boundaries

### `ci.yml`

Triggers:

- `pull_request`
- `push` to default integration branches if needed after repository branch policy is known

Responsibilities:

- Checkout source.
- Set up Node from the project package manager.
- Enable Corepack.
- Install with `corepack pnpm install --frozen-lockfile`.
- Run:
  - `corepack pnpm db:validate`
  - `corepack pnpm type-check`
  - `corepack pnpm lint`
  - `corepack pnpm test`
  - `corepack pnpm build`

Concurrency:

- Use PR/head-ref based concurrency so stale commits cancel earlier runs.

Not included in first implementation:

- Playwright E2E on every PR. Current `e2e/setup-db.sh` requires Docker Compose and local PostgreSQL assumptions. That should be redesigned separately for GitHub Actions PostgreSQL service or a dedicated hosted E2E database.

### Preview Environment

Preview is intentionally skipped for the MVP:

- PRs run CI only.
- PRs do not deploy to Vercel.
- PRs do not run hosted database migrations.
- PRs do not receive production secrets.
- Google OAuth is configured only for production.

### `deploy-production.yml`

Triggers:

- `push` tags matching `v*.*.*`
- `workflow_dispatch` with required `version`

GitHub environment:

- `production`, with required reviewer approval.

Responsibilities:

- Resolve deployment ref:
  - tag push uses `github.ref_name`
  - manual deployment validates `version` against `^v[0-9]+\\.[0-9]+\\.[0-9]+$`
  - manual deployment checks out `refs/tags/${version}`
- Install dependencies.
- Run full CI gate.
- Run production migration after environment approval:
  - `DATABASE_URL_UNPOOLED="${{ secrets.DATABASE_URL_UNPOOLED }}" DATABASE_URL="${{ secrets.DATABASE_URL }}" corepack pnpm db:deploy`
- Pull Vercel production environment:
  - `corepack pnpm dlx vercel pull --yes --environment=production --token="$VERCEL_TOKEN"`
- Build production prebuilt artifact:
  - `corepack pnpm dlx vercel build --prod --token="$VERCEL_TOKEN"`
- Deploy production:
  - `corepack pnpm dlx vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"`
- Print deployment URL and post-deploy smoke checklist in job summary.

Production workflow must not deploy from a branch ref.

## Prisma Connection Decision

Adopt `DATABASE_URL_UNPOOLED`.

Decision:

- Runtime app uses pooled Neon `DATABASE_URL`.
- Prisma CLI migration commands use Neon/Vercel `DATABASE_URL_UNPOOLED`.
- Local development remains backward-compatible: `prisma.config.ts` should read `DATABASE_URL_UNPOOLED ?? DIRECT_URL ?? DATABASE_URL ?? localDatabaseUrl`.

Reason:

- Neon recommends pooled connections for application runtime and direct connections for Prisma CLI schema operations.
- Separating the two avoids hiding migration behavior behind the app runtime pooler.

Required implementation:

- Update `prisma.config.ts` datasource URL selection.
- Document `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for production.
- GitHub Actions migration steps must set both env vars.

## Secret Model

Use the GitHub `production` Environment to avoid suffix-heavy workflow logic.

Repository-level secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Production environment secrets:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SEED_GOOGLE_ACCOUNT_EMAIL` only if an explicit production seed procedure remains accepted

Vercel environment variables:

- Must mirror runtime variables for Production:
  - `DATABASE_URL`
  - `BETTER_AUTH_URL`
  - `BETTER_AUTH_SECRET`
  - `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `SEED_GOOGLE_ACCOUNT_EMAIL` only where intentionally used
- `DATABASE_URL_UNPOOLED` is not required by runtime, but may be stored in Vercel if the Vercel/Neon integration provides it automatically. GitHub Actions must also have it as a production environment secret for migration jobs.

## CI And Test Mapping

| Risk | Check | First Implementation |
|---|---|---|
| Prisma schema invalid | `corepack pnpm db:validate` | required in CI/deploy workflows |
| Type errors | `corepack pnpm type-check` | required |
| Lint regressions | `corepack pnpm lint` | required |
| Domain/unit regressions | `corepack pnpm test` | required |
| Next.js build/runtime import errors | `corepack pnpm build` | required |
| Migration cannot apply | `corepack pnpm db:deploy` against target DB | required in production deploy |
| Browser flow regression | Playwright | defer GitHub Actions automation until E2E DB strategy is redesigned |
| OAuth callback mismatch | manual smoke checklist | required in docs; automation deferred |
| Production rollback confusion | docs and job summary | required |

## Deployment Documentation Structure

Create `docs/deployment.md` with:

1. Overview
2. Required accounts and tools
3. One-time Vercel setup
4. One-time Neon setup
5. One-time Google OAuth setup
6. GitHub repository secrets and production environment
7. Vercel environment variables
8. PR CI flow
9. Production tag deployment flow
10. Manual production deployment for a specific version
11. Migration policy
12. Rollback and backup policy
13. Smoke checklist
14. Troubleshooting

Docs language:

- Traditional Chinese.
- Taiwan terminology.
- Explicitly state that preview is skipped.

## Rollback Strategy

Production:

- Vercel rollback handles app code only.
- Database rollback is backup/restore or forward migration.
- Destructive migrations require explicit backup confirmation before production deploy.
- Documentation must tell maintainers not to treat GitHub tag redeploy as database rollback.

## TDD Implementation Preconditions

Before implementation:

- Confirm this technical design Review Gate.
- Accept that first CI/CD implementation will not run Playwright E2E in GitHub Actions.
- Accept no hosted preview environment for the first deployment version.

Implementation should proceed in this order:

1. Update `prisma.config.ts` for `DATABASE_URL_UNPOOLED`.
2. Add deployment docs skeleton and required setup details.
3. Add `ci.yml`.
4. Add `deploy-production.yml`.
6. Add implementation and verification artifacts.
7. Run local static checks where possible.

## Verification Plan

Local verification:

- `corepack pnpm db:validate`
- `corepack pnpm type-check`
- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`

Static workflow verification:

- Inspect YAML syntax and trigger coverage.
- Confirm production workflow rejects invalid manual versions.
- Confirm production workflow checks out tags, not branches.
- Confirm production migration steps use environment-scoped secrets.

Live verification after secrets are configured:

- Open a PR and confirm CI runs without deploying or accessing hosted secrets.
- Create a `vX.X.X` test tag only after production approval process is configured.
- Run manual deployment with an existing tag and confirm exact ref.
- Complete smoke checklist.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm `DATABASE_URL_UNPOOLED` adoption.
  - Confirm first implementation can defer Playwright E2E in GitHub Actions.
  - Confirm preview environment is intentionally skipped.
  - Confirm workflow split into `ci.yml` and `deploy-production.yml`.
  - Confirm deployment docs should live at `docs/deployment.md`.
- accepted_risks:
  - PRs have no hosted preview URL.
  - Hosted database migrations are first exercised in production deploy.
  - GitHub Actions E2E automation is deferred because current E2E setup assumes local Docker Compose.
  - Real OAuth smoke remains manual until production URL is configured.
- approved_decisions:
  - Adopt `DATABASE_URL_UNPOOLED` for Prisma migration commands.
  - Defer Playwright E2E in GitHub Actions for the first CI/CD implementation.
  - Skip preview environment for the first deployment version.
  - Split workflows into `ci.yml` and `deploy-production.yml`.
  - Put deployment documentation in `docs/deployment.md`.
- recommended_next_gate: TDD Implementation for CI workflow, production deployment workflow, Prisma `DATABASE_URL_UNPOOLED`, and deployment documentation.
