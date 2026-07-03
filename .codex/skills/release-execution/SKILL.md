---
name: release-execution
description: Use only after target-aware-release approves or explicitly accepts risks for a production release, to execute or record production deployment steps, version/tag evidence, smoke results, rollback readiness, and final deployment status.
---

# Release Execution

## Purpose

Execute or record the production deployment of verified website work after `target-aware-release` has made an explicit production go decision.

This skill is production-only. Do not use it for `local_dev`, `internal_demo`, `preview`, or `staging`; those targets stop at target-aware release readiness and then proceed to learning-loop when learning signals are needed.

## Preconditions

- `release_target: production`.
- A `target-aware-release` artifact exists for the same release scope.
- The readiness decision is `ready_for_production` or `ready_with_accepted_risks`.
- Any required production owner, rollback owner, deploy command/platform, secrets/config, migration plan, and smoke checks are known or explicitly marked as blockers.

## Workflow

1. Read the production target-aware release artifact, verification report, implementation notes, technical design, Behavior Spec, project context, deployment docs, CI/CD config, package/version files, migration docs, and monitoring/runbook docs.
2. Confirm deployment source: branch, commit SHA, artifact id, version, tag, and whether the worktree is clean enough for the repo's release policy.
3. Decide and record versioning actions: no version bump, package version bump, release tag, changelog entry, GitHub release, or platform release label.
4. Run or record predeploy checks: build, tests, migrations dry-run or review, feature flags, env/secrets, backups, rollback target, monitoring access, and final go/no-go.
5. Execute the approved production deployment only when the user explicitly requested execution and the required command/platform is available. Otherwise record the exact manual/CI step to perform.
6. Run or record postdeploy smoke checks against production routes, auth/permissions, forms/API paths, SEO/indexing, analytics, error monitoring, logs, and performance checks appropriate to the release.
7. Produce `.ai/deployment/<deployment-id>.md` with deployment evidence, final status, rollback path, and unresolved production risks.

## Rules

- Never infer production deployment intent from preview, staging, or a generic release request.
- Never deploy to production without an explicit user request or an existing approved deployment trigger.
- Version/tag changes are optional and should follow the repo's existing release policy.
- If any production blocker remains, set final status to `blocked` and do not execute deployment.
- If deployment was executed outside Codex, record evidence links, timestamps, commit/artifact ids, and smoke results instead of pretending to have run it.
- Passing release execution for production does not replace learning-loop; production outcomes still need monitoring, analytics, and follow-up criteria.

## Handoff

Handoff to `learning-loop` after production deployment is complete, blocked, or completed with accepted risks.
