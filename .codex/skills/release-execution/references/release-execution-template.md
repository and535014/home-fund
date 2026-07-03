# Release Execution Template

```markdown
---
id: deployment-<slug>
stage: release-execution
status: draft
delivery_profile: production
release_target: production
inputs:
  - deploy-<release-slug>
outputs:
  - production_deployment_record
  - version_or_tag_record
  - smoke_results
  - rollback_evidence
trace_links:
  release_readiness: []
  verification_reports: []
  implementation: []
  commits: []
  tags: []
  deployment_urls: []
  monitoring: []
  incidents: []
reviewed_at:
---

# Release Execution for <Release / Story>

## Naming Trace

- deployment_id: deployment-<release-or-story-slug>
- release_readiness_id:
- release_slug:
- story_ids:
- change_ids:
- production_routes:
- source_branch:
- source_commit:

## Preconditions

- release_target: production
- readiness_decision: ready_for_production | ready_with_accepted_risks
- production_deploy_requested: true | false
- deployment_owner:
- rollback_owner:
- blockers:

## Version and Release Identity

- version_policy: none | package_version | semver_tag | date_tag | platform_release | other
- previous_version_or_tag:
- new_version_or_tag:
- changelog_updated: true | false | not_needed
- release_notes_source:
- artifact_id:

## Predeploy Checks

| Check | Command / Source | Result | Required |
|---|---|---|---|

## Configuration and Secrets

| Name | Source | Verified | Notes |
|---|---|---|---|

## Migration and Data Steps

- migration_required: true | false
- migration_command_or_owner:
- backup_or_snapshot:
- rollback_data_plan:
- result:

## Deployment Execution

- deploy_mode: manual | ci_cd | platform | script | recorded_external
- deploy_command_or_trigger:
- platform:
- deployment_url:
- deployed_at:
- deployed_by:
- deployment_result: not_started | succeeded | failed | blocked | rolled_back
- evidence:

## Production Smoke Results

| Check | URL / Source | Expected | Actual | Result |
|---|---|---|---|---|

## Observability Confirmation

- logs_checked:
- error_monitoring_checked:
- analytics_checked:
- alerts_checked:
- performance_checked:
- notes:

## Rollback Readiness

- rollback_target:
- rollback_command_or_platform_action:
- rollback_verification:
- rollback_owner:
- rollback_window_or_limit:

## Risk Register

| Risk | Impact | Mitigation | Accepted |
|---|---|---|---|

## Final Status

- final_status: deployed | deployed_with_accepted_risks | blocked | failed | rolled_back | recorded_only
- decision_reason:
- next_step:

## Review Gate

- decision: approve | revise | blocked
- reviewer_focus:
  -
- must_check:
  -
- acceptance_signals:
  -
- unresolved_blockers:
  -
- next_step:
```
