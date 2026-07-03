---
id: release-versioning-pipeline-hardening
stage: intent
status: complete
workflow_version: ddd-website-lifecycle-v2
project_type: release_change
delivery_profile: mvp
release_target: production
inputs:
  - user_prompt:2026-07-02-deploy-pipeline-review
  - user_prompt:2026-07-02-versioning-in-deploy-pipeline
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .ai/project-context.md
  - .ai/workflow.md
  - .github/workflows/deploy-production.yml
  - .github/workflows/ci.yml
  - docs/deployment.md
  - package.json
outputs:
  - release_pipeline_hardening_intent
  - versioning_automation_scope
  - deployment_guardrail_scope
  - routing_decision
trace_links:
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .ai/workflow.md
  - .ai/project-context.md
reviewed_at: 2026-07-03
---

# Release Versioning Pipeline Hardening

## Problem

The current production deployment path is tag-based and auditable, but release preparation still depends on manual version bumps, manual tag creation, and human discipline to keep `package.json`, Git tags, deployment evidence, and workflow documentation aligned.

The current deploy workflow also leaves several low-cost guardrails outside automation:

- It accepts any `vX.X.X` tag without checking that the tag matches `package.json.version`.
- It does not verify that the deployed tag commit is contained in `main`.
- GitHub Environment approval currently gates the full production job, so some CI/preflight failures can require production approval before failing.
- Vercel CLI is resolved through `pnpm dlx vercel`, which can drift across releases.
- Automated smoke only checks public `/login` and `/favicon.ico`, while cron invalid-token protection is still manual evidence.
- Release documentation does not yet describe an automated release PR and tag creation path.

## Audience

- Maintainer preparing and approving production releases.
- Future contributors who need a predictable release path.
- Household users indirectly affected by deployment safety and rollback clarity.

## Desired Outcome

Release preparation, tag creation, and production deployment form one clear GitHub Actions-driven path:

1. A maintainer manually starts a version-prep workflow and enters a target `vX.Y.Z` version.
2. The workflow validates that the target version is greater than the current package version, updates `package.json`, creates a release branch, and opens a release PR.
3. After the release PR is merged to `main`, a tag workflow creates an immutable `vX.X.X` tag from `main`.
4. The existing production deploy workflow deploys only that immutable tag.
5. The deploy workflow proves that the tag, package version, and main-line source are consistent before touching production.

The production deploy workflow should remain a deployer of immutable tags. It should not commit, bump versions, or create tags during deployment.

## Affected Surfaces

- release: GitHub Actions workflows for release PR creation, tag creation, and production deploy.
- documentation: deployment guide and release operating instructions.
- CI/CD governance: semver bump rules, tag/package consistency, main-line containment, production approval sequencing.
- backend/API smoke: cron invalid-token smoke for `/api/cron/recurring-posting`.
- operational evidence: future deployment records should identify whether version-prep and tag workflows were used.

## Scope

In scope:

- Add a release version workflow that accepts an explicit target `vX.Y.Z` input.
- The release version workflow creates a release branch and PR instead of committing directly to `main`.
- Add a tag creation workflow that reads `package.json.version` from `main`, validates monotonic SemVer progression, verifies the tag does not already exist, and pushes `vX.X.X`.
- Keep production deployment triggered by `vX.X.X` tags or manual existing-tag redeploy.
- Add deploy preflight checks:
  - tag format is valid
  - `package.json.version` matches the tag
  - tag commit is contained in `origin/main`
- Split deploy workflow so CI/preflight can fail before production environment approval is requested.
- Pin or otherwise stabilize the Vercel CLI version used by production deployment.
- Add a non-mutating cron invalid-token smoke that expects HTTP `401`.
- Update deployment documentation with the new release flow and versioning policy.

Out of scope:

- Deploying directly from release branches.
- Bumping version inside the production deploy workflow.
- Automating production OAuth sign-in E2E.
- Automating correct-secret cron execution unless a future dry-run mode is designed.
- Adding preview or staging environments.
- Implementing monitoring, uptime checks, or error reporting provider setup.
- Automating database rollback.

## Constraints

- Production deployment must remain tag-based and auditable.
- Production deployment must require GitHub Environment `production` approval before migration and deploy steps.
- Pull requests must not receive production secrets.
- Version bumps must go through a PR so review and CI still apply.
- A pushed production tag must be treated as immutable; failed deploy follow-up should use a new patch version rather than mutating the old tag.
- Documentation must use Traditional Chinese and Taiwan terminology.

## Success Criteria

- A maintainer can run a workflow to prepare an explicit target version without hand-editing `package.json`.
- Release PRs contain only intentional release metadata changes unless the maintainer explicitly adds more.
- A separate workflow can create `vX.X.X` from `main` after the release PR is merged.
- The production deploy workflow rejects mismatched tag/package versions.
- The production deploy workflow rejects tags that are not contained in `main`.
- CI and version preflight run before production approval is requested.
- Production deploy uses a stable Vercel CLI version.
- Production deploy automatically proves cron invalid-token protection returns `401`.
- Deployment docs explain when to choose `patch`, `minor`, or `major`.
- Deployment docs preserve the rule that deployment does not bump versions.

## Versioning Policy

- `patch`: bug fixes, deployment hardening, documentation corrections, small UI adjustments, cron fixes, and non-breaking operational changes.
- `minor`: user-visible features, meaningful workflow capability changes, schema additions that support new behavior, or larger operational release improvements.
- `major`: reserved until the project is ready to declare a stable `1.0.0` operating contract.

Current likely next version:

- If this pipeline hardening ships next from package version `0.1.9`, use `v0.1.10`.
- If additional user-facing feature work is bundled before release, reassess whether `v0.2.0` is more honest.

## Routing Decision

- Domain Discovery: not required. This is release automation and deployment governance, not household fund domain behavior.
- Project Foundation Architecture: not required. Existing GitHub Actions, Next.js, pnpm, Vercel, and Neon foundation remains accepted.
- Project Foundation Implementation / Init: not required as a separate gate.
- Experience Prototype: not required. No user-facing product UI changes.
- Behavior Spec / BDD / E2E: not required for product behavior. The workflow contracts and smoke checks should be captured in Feature Technical Design and verified through workflow/static checks.
- Feature Technical Design: required next to define exact workflow files, permissions, branch/tag behavior, GitHub token/PR creation approach, Vercel CLI pinning method, and shell validation details.
- TDD Implementation: required after technical design approval or explicitly accepted risk; workflow checks should be implemented in the smallest safe slice.
- Verification: required after implementation with local/static workflow review and any available command validation.
- Target-Aware Release: required before using the hardened pipeline for production because it changes production release operation, approval sequencing, and smoke evidence.
- Learning Loop: optional for this change unless production use reveals new operational signals or accepted risks.

## Review Gate

- decision: approved
- recommended_next_gate: Feature Technical Design for release versioning pipeline hardening.
- reviewer_focus:
  - Confirm version bump should be PR-based, not deploy-time.
  - Confirm production deploy should reject tags not contained in `main`.
  - Confirm cron invalid-token smoke is safe to automate.
  - Confirm correct-secret cron smoke remains manual until a dry-run endpoint exists.
  - Confirm Vercel CLI pinning is worth adding now.
- accepted_assumptions:
  - The existing tag-based production deployment model remains the right production control point.
  - `v0.1.10` is the likely next patch version if this operational hardening ships before new user-facing features.
- unresolved_questions:
  - Full workflow behavior must be proven in GitHub Actions after merge because local static checks cannot create real PRs, tags, or production deployments.
