---
id: tech-release-versioning-pipeline-hardening
stage: technical-design
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/release-versioning-pipeline-hardening.md
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .github/workflows/deploy-production.yml
  - .github/workflows/ci.yml
  - docs/deployment.md
  - package.json
outputs:
  - workflow_boundaries
  - version_bump_contract
  - tag_creation_contract
  - deploy_preflight_contract
  - smoke_check_contract
  - documentation_update_contract
  - implementation_preconditions
trace_links:
  - .ai/intent/release-versioning-pipeline-hardening.md
  - .ai/workflow.md
  - .ai/project-context.md
reviewed_at: 2026-07-03
---

# Release Versioning Pipeline Hardening Technical Design

## Decision

- decision: ready_for_tdd_implementation_after_review
- release_target_supported_by_design: production release pipeline hardening
- prototype_status: not_applicable; this is release automation, not product UI.
- behavior_spec_status: accepted_as_workflow_contract; workflow validations and smoke checks are the behavior boundary.

Keep production deployment as an immutable-tag deployer. Add release preparation and tag creation as separate workflows so version changes remain reviewable and production deployment remains auditable.

## Files To Add Or Change

| Path | Ownership | Purpose |
|---|---|---|
| `.github/workflows/release-version.yml` | Release preparation | Validate target SemVer version, update `package.json`, push release branch, and open release PR. |
| `.github/workflows/create-release-tag.yml` | Release source control | Create immutable `vX.X.X` tag from `main` after release PR merge. |
| `.github/workflows/deploy-production.yml` | Production deployment | Add preflight job, tag/package/main checks, approval sequencing, Vercel CLI pinning, and cron invalid-token smoke. |
| `package.json` | Tooling manifest | Pin Vercel CLI in `devDependencies` so deploy uses a stable CLI version. |
| `docs/deployment.md` | Release operations | Document version prep, tag creation, deploy guardrails, version bump policy, and smoke evidence. |
| `.ai/implementation/release-versioning-pipeline-hardening.md` | Workflow evidence | Record implementation decisions, changed files, and command evidence. |
| `.ai/verification/release-versioning-pipeline-hardening.md` | Verification evidence | Record static workflow validation and remaining live GitHub/Vercel checks. |

## Workflow Boundary

### Existing `ci.yml`

Leave the existing PR/push quality gate unchanged for this slice:

- install
- Prisma validate
- type-check
- lint
- unit tests
- build

The release PR created by the new workflow should pass the same CI as any other PR.

### New `release-version.yml`

Trigger:

- `workflow_dispatch`

Inputs:

- `version`: required string in `vX.Y.Z` format.

Permissions:

- `contents: write`
- `pull-requests: write`

Token model:

- Prefer a repository secret named `RELEASE_BOT_TOKEN` from a fine-grained PAT or GitHub App installation token with contents and pull request write access.
- Do not rely on plain `GITHUB_TOKEN` for the default path because PRs or branch pushes created by `GITHUB_TOKEN` may not trigger the normal CI path reliably enough for release governance.
- If `RELEASE_BOT_TOKEN` is missing, fail with a clear setup error instead of silently creating a weak release PR.

Steps:

1. Checkout `main` with fetch depth `0`.
2. Read `package.json.version`.
3. Validate package version as strict SemVer without prerelease/build metadata: `^[0-9]+\.[0-9]+\.[0-9]+$`.
4. Validate input version as strict production tag format: `^v[0-9]+\.[0-9]+\.[0-9]+$`.
5. Verify the input version is greater than the current package version.
5. Create branch `release/vX.Y.Z`.
6. Update only `package.json` for the first implementation. Do not modify lockfile because package metadata version changes do not require dependency resolution.
7. Commit `Bump version to X.Y.Z`.
8. Push the release branch.
9. Open PR:
   - title: `Release vX.Y.Z`
   - body includes previous version, next version, expected tag, and a reminder that merge does not deploy production until tag creation.

Failure rules:

- Fail if the release branch already exists.
- Fail if tag `vX.Y.Z` already exists locally or remotely.
- Fail if working tree contains changes after the version update other than expected `package.json`.

### New `create-release-tag.yml`

Trigger:

- `workflow_dispatch`

Inputs:

- none in the first implementation. The workflow reads `package.json.version` from `main`.

Permissions:

- `contents: write`

Steps:

1. Checkout `main` with fetch depth `0`.
2. Fetch tags.
3. Read `package.json.version` and derive `tag=vX.Y.Z`.
4. Validate strict SemVer.
5. Fail if the tag already exists.
6. Determine the latest `vX.Y.Z` tag by SemVer order.
7. Fail if `package.json.version` is not greater than the latest existing tag.
8. Create an annotated tag `vX.Y.Z` on `main` HEAD.
9. Push the tag.

Manual-only tag creation is intentional. It prevents release PR merge from automatically deploying production before the maintainer is ready.

### Updated `deploy-production.yml`

Keep triggers:

- `push` tags matching `v*.*.*`
- `workflow_dispatch` with required `version`

Jobs:

1. `resolve-version`
   - Resolve tag from push or manual input.
   - Validate `^v[0-9]+\.[0-9]+\.[0-9]+$`.

2. `preflight`
   - Runs before `environment: production`.
   - Checkout requested tag with `fetch-depth: 0`.
   - Fetch `origin/main` and tags.
   - Verify `package.json.version` equals the tag without leading `v`.
   - Verify tag commit is contained in `origin/main`.
   - Install dependencies.
   - Run the full existing CI gate:
     - `corepack pnpm db:validate`
     - `corepack pnpm type-check`
     - `corepack pnpm lint`
     - `corepack pnpm test`
     - `corepack pnpm build`

3. `deploy-production`
   - Needs `preflight`.
   - Uses `environment: production`.
   - Checkout the same tag.
   - Install dependencies.
   - Pull and build the Vercel production artifact with pinned Vercel CLI.
   - Run `corepack pnpm db:deploy` only after the production artifact has built successfully.
   - Deploy the prebuilt Vercel production artifact.
   - Run production smoke checks.

Production secrets must only be scoped to `deploy-production`, not `preflight`.

## Vercel CLI Pinning

Add `vercel` to `devDependencies` with a fixed version range selected at implementation time, then replace:

```sh
corepack pnpm dlx vercel ...
```

with:

```sh
corepack pnpm vercel ...
```

This keeps the deploy CLI version under lockfile review.

## Smoke Check Contract

Automated smoke after deploy:

- `GET $DEPLOYMENT_URL/login` returns success.
- `GET $DEPLOYMENT_URL/favicon.ico` returns success.
- `GET $DEPLOYMENT_URL/api/cron/recurring-posting` with `Authorization: Bearer invalid-token` returns HTTP `401`.

Do not automate correct-secret cron execution in this slice because it can mutate production data by posting recurring ledger records. Keep correct-secret smoke manual until a dedicated dry-run mode exists.

## Versioning Contract

Use strict SemVer tags without prerelease suffixes:

- Allowed production tag: `vX.Y.Z`
- Allowed package version: `X.Y.Z`
- Reject prerelease and build metadata for production workflow simplicity.

Policy:

- `patch`: bug fixes, release pipeline hardening, documentation corrections, small UI adjustments, cron fixes.
- `minor`: user-visible features, meaningful workflow capability changes, schema additions that support new behavior.
- `major`: reserved until the project intentionally declares a stable `1.0.0` operating contract.

Failed production deploy follow-up:

- Do not move or rewrite the failed production tag.
- Fix forward with a new patch version.

## Documentation Contract

Update `docs/deployment.md` to describe:

- Release preparation workflow.
- Required `RELEASE_BOT_TOKEN` setup and why it exists.
- Tag creation workflow.
- Production deploy workflow guardrails.
- Versioning policy.
- Failed deploy follow-up rule.
- Deployment evidence expectation: create or update `.ai/deployment/production-vX.Y.Z-YYYY-MM-DD.md` after each production deployment.

## Auth And Permission Boundary

- `release-version.yml` may write branches and PRs but must not access production secrets.
- `create-release-tag.yml` may write tags but must not access production secrets.
- `deploy-production.yml` preflight must not access production secrets.
- Only the deploy job after production environment approval may access Vercel, Neon, Better Auth, Google OAuth, and runtime production secrets.

## Test And Verification Mapping

| Risk | Verification |
|---|---|
| Version input validation is wrong | Exercise or inspect workflow logic for valid `vX.Y.Z`, non-increasing versions, and package/tag conversion. |
| Release workflow creates non-reviewable release | Verify workflow opens PR from `release/vX.Y.Z`, not direct commit to `main`. |
| Tag does not match package version | Static review and deploy preflight check. |
| Tag created from non-main commit | `create-release-tag.yml` checks out `main`; deploy preflight also checks tag containment in `origin/main`. |
| Production approval requested before CI failure | `deploy-production` job receives `environment: production`; `preflight` does not. |
| Production secrets leak into preflight | Review env placement; production env vars scoped only to deploy job. |
| Vercel CLI drift | `vercel` dependency pinned and invoked through pnpm script resolution. |
| Cron secret missing or wrong | Invalid-token smoke expects `401`; missing secret would return current production failure mode and fail smoke. |
| Correct-secret cron mutates production data | Do not automate correct-secret cron smoke in this slice. |

## Implementation Preconditions

- Confirm this design Review Gate.
- Add `RELEASE_BOT_TOKEN` before expecting release PR automation to work end to end.
- Accept that workflow syntax can be statically reviewed locally, but full PR/tag/deploy behavior requires GitHub Actions execution.
- Keep `.ai` deployment truth updated after using the hardened pipeline.

## Review Gate

- decision: approved
- recommended_next_gate: TDD Implementation after approval, followed by Verification and Target-Aware Release before using the hardened pipeline for production.
- approved_design_points:
  - Release version bump is PR-based.
  - Tag creation is manual workflow-dispatch from `main`.
  - Production deploy remains tag-only.
  - Deploy preflight runs before production approval.
  - Production secrets are only available after approval.
  - Vercel production artifact is built before production database migration.
  - Cron invalid-token smoke is automated; correct-secret cron smoke remains manual.
- open_review_items:
  - Confirm GitHub Actions execution after merge because full PR/tag/deploy behavior cannot be proven locally.
