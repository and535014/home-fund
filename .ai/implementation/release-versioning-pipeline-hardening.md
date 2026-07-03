---
id: implementation-release-versioning-pipeline-hardening
stage: implementation
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/release-versioning-pipeline-hardening.md
  - .ai/technical-design/release-versioning-pipeline-hardening.md
  - .github/workflows/deploy-production.yml
  - .github/workflows/ci.yml
  - docs/deployment.md
  - package.json
outputs:
  - release_version_workflow
  - create_release_tag_workflow
  - deploy_preflight_hardening
  - vercel_cli_pinning
  - deployment_docs_update
  - release_runbook
trace_links:
  - .ai/intent/release-versioning-pipeline-hardening.md
  - .ai/technical-design/release-versioning-pipeline-hardening.md
reviewed_at: 2026-07-03
---

# Release Versioning Pipeline Hardening Implementation

## Scope Implemented

- Added `.github/workflows/release-version.yml` for explicit `vX.Y.Z` release PR preparation.
- Added `.github/workflows/create-release-tag.yml` for manual tag creation from `main` package version.
- Updated `.github/workflows/deploy-production.yml` with:
  - separate preflight job before production approval
  - tag/package version consistency check
  - tag containment check against `origin/main`
  - production secrets scoped only to the approved deploy job
  - pnpm cache setup
  - pinned Vercel CLI invocation through project dependency
  - Vercel artifact build before production database migration
  - automated cron invalid-token smoke expecting HTTP `401`
- Added pinned `vercel` devDependency and lockfile entries.
- Updated `docs/deployment.md` with release PR, tag creation, versioning policy, deploy guardrails, cron smoke, and PR-centered release evidence guidance.
- Added `docs/release-runbook.md` for recurring release execution without first-deploy or secret setup SOPs.
- Linked the runbook from `README.md` and `docs/deployment.md`.

## Implementation Notes

- `release-version.yml` requires `RELEASE_BOT_TOKEN` and fails early when the secret is missing.
- The release workflow validates the requested `vX.Y.Z` is greater than the current `package.json.version`.
- The release workflow updates only `package.json`; lockfile updates are intentionally not part of version-only PRs.
- `create-release-tag.yml` has no version input. It reads `package.json.version` from `main` to avoid operator input drift.
- `deploy-production.yml` still supports manual redeploy of an existing `vX.Y.Z` tag.
- Correct-secret cron smoke remains manual because it can mutate production recurring ledger data.

## Verification Plan

- Static review changed workflow files and YAML structure.
- Run available local checks after implementation.

## Verification Evidence

- Workflow YAML parse check: passed for CI, deploy-production, release-version, and create-release-tag workflow files.
- `corepack pnpm install --frozen-lockfile`: passed.
- `corepack pnpm db:validate`: passed.
- `corepack pnpm type-check`: passed.
- `corepack pnpm lint`: passed.
- `corepack pnpm test`: passed, 71 test files and 325 tests.
- `corepack pnpm build`: passed; production route table includes `/api/cron/recurring-posting`.

## Remaining Verification

- Full workflow behavior remains pending until merged and run in GitHub Actions:
  - release PR creation using `RELEASE_BOT_TOKEN`
  - tag creation from `main`
  - production preflight before approval
  - production deployment and smoke checks

## Review Gate

- decision: implemented_with_local_checks_passed
- recommended_next_gate: Verification for final workflow review and accepted GitHub Actions live-run gaps.
