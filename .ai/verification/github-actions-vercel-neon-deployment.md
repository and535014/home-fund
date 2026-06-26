---
id: ver-github-actions-vercel-neon-deployment
stage: verification
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - .ai/technical-design/github-actions-vercel-neon-deployment.md
  - .ai/implementation/github-actions-vercel-neon-deployment.md
outputs:
  - local_check_results
  - workflow_static_review
  - release_target_assessment
  - live_service_gaps
trace_links:
  - prisma.config.ts
  - .github/workflows/ci.yml
  - .github/workflows/deploy-production.yml
  - docs/deployment.md
  - README.md
reviewed_at: 2026-06-26
---

# GitHub Actions Vercel/Neon Deployment Verification

## Decision

- decision: verified_for_repository_merge
- release_target_supported: ci_and_production_pipeline_code_ready_for_service_configuration
- production_execution_readiness: blocked_until_github_vercel_neon_google_oauth_secrets_are_configured_and_smoked
- rationale: Local checks and static workflow review passed. The workflow implementation matches the approved technical design. Live deployment cannot be verified inside the local workspace because GitHub Environments, Vercel project, Neon databases, Google OAuth callbacks, and secrets are external setup steps.

## Local Checks

| Check | Result | Evidence |
|---|---|---|
| Workflow YAML parse | pass | `ruby -e 'require "yaml"; ...' .github/workflows/*.yml` loaded workflow files. |
| Prisma schema validation | pass | `corepack pnpm db:validate` passed after installing dependencies. |
| TypeScript | pass | `corepack pnpm type-check` passed. |
| Lint | pass | `corepack pnpm lint` passed. |
| Unit/domain tests | pass | `corepack pnpm test` passed: 45 files, 214 tests. |
| Production build with CI env | pass | `corepack pnpm build` passed with CI placeholder env and network access for Google Fonts. |

Notes:

- A bare `corepack pnpm build` without `DATABASE_URL` still fails because production runtime requires database config while prerendering `/search`. The CI workflow now supplies placeholder CI env, and deploy workflows use environment secrets.
- The first sandboxed build failed while fetching Google Fonts. Re-running with network access passed.

## Static Workflow Review

Verified:

- `ci.yml` runs on `pull_request` and `push` to `main`.
- `ci.yml` provides CI placeholder runtime env for production build.
- No preview deployment workflow exists.
- PRs are CI-only and do not run hosted migrations.
- `deploy-production.yml` runs on tags matching `v*.*.*` and manual `workflow_dispatch`.
- Manual production deployment validates `vX.X.X` version format.
- Production workflow checks out `refs/tags/${version}` and does not deploy a branch ref.
- Production workflow uses GitHub Environment `production`.
- Production workflow runs `corepack pnpm db:deploy` before Vercel production deploy.
- Production workflow writes a smoke checklist into the job summary.
- `prisma.config.ts` uses `DATABASE_URL_UNPOOLED ?? DIRECT_URL ?? DATABASE_URL ?? localDatabaseUrl`.
- `docs/deployment.md` documents setup steps, migration policy, rollback, smoke checks, and troubleshooting in Traditional Chinese.

## Accepted Gaps

- Playwright E2E does not run in GitHub Actions in this slice. This matches the approved technical design because current E2E setup assumes local Docker Compose PostgreSQL.
- Real Google OAuth smoke is manual and requires a configured production origin.
- Preview environment is intentionally skipped.
- GitHub Actions workflows have not been executed against live GitHub/Vercel/Neon services in this local verification.

## Live-Service Verification Required Before Production Execution

Before the first production deployment:

- Create GitHub Environment `production`.
- Add required repository/environment secrets.
- Configure production environment reviewers.
- Configure Vercel project IDs and environment variables.
- Configure Neon production pooled/direct connection strings.
- Configure Google OAuth production origin/callback.
- Open a PR and confirm CI runs without deployment or hosted secrets.
- Create or use a real `vX.X.X` tag and confirm production workflow waits for approval.
- Complete production smoke checklist after deploy.

## Review Gate

- decision: approve
- release_target_supported: repository_merge_and_service_configuration
- production_release_execution: not_yet_approved
- recommended_next_gate: Target-Aware Release update after live service setup, or Release Execution only after production readiness blockers are explicitly cleared.
