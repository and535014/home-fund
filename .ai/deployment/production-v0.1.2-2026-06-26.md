---
id: deployment-production-v0.1.2-2026-06-26
stage: release-execution
status: complete_with_evidence_pending
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - user_report:2026-06-26-production-deployed
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - .ai/verification/github-actions-vercel-neon-deployment.md
  - .github/workflows/deploy-production.yml
  - docs/deployment.md
outputs:
  - production_deployment_status
  - deployment_source_record
  - rollback_path
  - evidence_gaps
trace_links:
  - .ai/intent/github-actions-vercel-neon-deployment.md
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - .ai/implementation/github-actions-vercel-neon-deployment.md
  - .ai/verification/github-actions-vercel-neon-deployment.md
  - .github/workflows/deploy-production.yml
  - docs/deployment.md
reviewed_at: 2026-06-26
---

# Production Deployment v0.1.2

## Deployment Status

- final_status: deployed_to_production_by_user_report
- production_release_target: production
- deployment_record_type: external_or_existing_workflow_execution_record
- deployment_date_recorded: 2026-06-26
- production_url: pending_user_confirmation
- github_actions_run: pending_user_confirmation
- vercel_deployment_url: pending_user_confirmation
- smoke_result: pending_user_confirmation

This record updates the project state after the maintainer reported that the project has been formally deployed to production. Codex did not execute the production deployment in this turn and did not verify live production services from the local workspace.

## Deployment Source

Local repository evidence at the time this record was created:

- branch: `main`
- commit: `9358ca8f6c44b292f9906f7d3c5602067075c66a`
- tag_on_head: `v0.1.2`
- expected deployment workflow: `.github/workflows/deploy-production.yml`
- expected deployment trigger: `vX.X.X` tag push or manual workflow dispatch for an existing tag

Assumption to verify:

- `v0.1.2` is the version currently deployed to production.

If production was deployed from another tag or commit, update this record before using it as release evidence.

## Expected Production Checks

The production workflow is designed to run:

- `corepack pnpm db:validate`
- `corepack pnpm type-check`
- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm db:deploy`
- Vercel production build and deploy
- HTTP smoke checks for `/login` and `/favicon.ico`

Manual smoke still needs confirmation for:

- Google sign-in starts from the production origin.
- Admin member reaches the dashboard.
- Non-admin member cannot access admin-only routes.
- Logout returns to login.
- Main ledger/search views can read production data.
- Vercel runtime logs do not show repeated production errors.

## Rollback Path

- app rollback: Vercel rollback or redeploy a previously known-good `vX.X.X` tag through the production workflow.
- database rollback: Neon backup/restore, point-in-time recovery, or forward migration.
- constraint: redeploying an older app tag is not a database rollback.

Before destructive migrations, confirm Neon backup/restore evidence and recovery owner.

## Evidence Gaps

These are not blockers to recording the status update, but they are blockers to treating this file as complete audited production evidence:

- Production URL is not recorded.
- GitHub Actions run URL is not recorded.
- Vercel deployment URL is not recorded.
- Production smoke checklist result is not recorded.
- Google OAuth production callback has not been independently verified in this record.
- Monitoring/error reporting provider remains undecided.
- Production backup/restore evidence is not linked.

## Review Gate

- decision: record_production_deployment_with_evidence_pending
- accepted_risks:
  - Deployment completion is based on maintainer report plus local tag evidence, not Codex-executed production checks.
  - Live OAuth, role-permission, and operational smoke evidence still needs to be attached.
- recommended_next_gate: Learning Loop for production monitoring and feedback signals after evidence links are filled in.
