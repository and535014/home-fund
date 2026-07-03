---
name: target-aware-release
description: "Use at Target-Aware Release after verification to assess readiness for a specific target environment: local_dev, internal_demo, preview, staging, or production."
---

# Target-Aware Release

## Purpose

Decide whether verified website work is ready for the declared target environment without assuming production deployment.

## Workflow

1. Read intent, verification, implementation, Behavior Spec, technical design, prototype, foundation artifacts, release target, deployment docs, and tracking drafts.
2. Identify release scope, target environment, runtime config, secrets, data migrations, routing/redirects, SEO/indexing, auth/permission, integrations, smoke checks, observability, tracking readiness, and rollback needs.
3. Produce `.ai/release/<release-id>.md`. Legacy `.ai/deploy/<id>.md` may be referenced for compatibility.
4. Mark unresolved deployment risks explicitly.

## Target Rules

- `local_dev`: verify local build/dev/test baseline and basic smoke only.
- `internal_demo`: include demo URL/path, seed/demo data, smoke checks, reset steps, and known risks.
- `preview`: include deploy URL, route smoke, key E2E, config/env checks, and basic monitoring/log access where available.
- `staging`: include production-like config, migrations, auth/permission, rollback, observability, smoke, and integration checks.
- `production`: include secrets/config, migrations, auth/permissions, rollback, backups, observability, monitoring/alerts, incident/runbook, SEO/indexing, analytics/learning signals, and smoke checks.
- Passing release readiness for one target does not imply readiness for a stricter target.

## Handoff

- Handoff to `release-execution` only when `release_target: production` and the decision is `ready_for_production` or `ready_with_accepted_risks`.
- Handoff to `learning-loop` for `local_dev`, `internal_demo`, `preview`, or `staging` when release readiness is complete enough to define or review learning signals.
- If production readiness is blocked, stop at target-aware release and do not hand off to deployment execution.
