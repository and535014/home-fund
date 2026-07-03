# Target-Aware Release Template

```markdown
---
id: deploy-<slug>
stage: target-aware-release
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ver-<story-slug>
outputs:
  - launch_readiness_decision
  - release_checklist
  - risk_register
  - rollback_runbook
trace_links:
  changes: []
  stories: []
  verification_reports: []
  architecture_decisions: []
  information_architecture: []
  post_release_tracking: []
reviewed_at:
---

# Target-Aware Release for <Release / Story>

## Naming Trace

- deploy_id: deploy-<release-or-story-slug>
- release_slug:
- story_ids:
- change_ids:
- route_slugs:
- analytics_event_scope:
- post_release_id: post-release-<release-or-story-slug>

## Delivery Profile and Decision

- delivery_profile:
- release_target:
- launch_readiness_required: true | false
- readiness_decision: not_needed | ready_for_local_dev | ready_for_internal_demo | ready_for_preview | ready_for_staging | ready_for_production | ready_with_accepted_risks | blocked
- decision_reason:

## Release Scope
What verified behavior is included.

## Launch Trigger

- trigger:
- target_url_or_route:
- launch_window:
- owner_or_responsible_party:
- rollback_owner:
- communication_needed:

## Environment Requirements
| Requirement | Needed For | Owner / Source |
|---|---|---|

## Configuration and Secrets
| Name | Required | Notes |
|---|---|---|

## Data and Migration Notes
Apply, verify, and rollback considerations.

## Build and Deploy Checks

- build_command:
- test_command:
- deploy_command_or_platform:
- artifact_or_version:
- feature_flags:
- predeploy_checks:
- postdeploy_checks:

## Website Launch Checks

- changed_routes:
- redirects:
- canonical_or_metadata:
- robots_or_indexing:
- sitemap_update:
- critical_navigation:
- auth_or_permission_visibility:
- responsive_smoke:
- accessibility_smoke:
- forms_or_conversion_paths:
- analytics_events:
- error_monitoring:
- performance_or_core_web_vitals:

## Observability
Logs, metrics, alerts, dashboards, and smoke checks.

## Learning Loop Readiness
Product analytics, error monitoring, logs, feedback channels, review cadence, and follow-up decision criteria.

- tracking_maturity: none | manual | logs | lightweight_events | product_analytics | production_observability
- analytics_tool_assessment: present | missing | not_needed
- tool_needed: true | false | defer | unknown
- no_tool_fallback_acceptable: true | false | unknown
- tracking_readiness_decision: sufficient | sufficient_with_risks | insufficient | not_needed

| Signal | Provider / Source | Required For Target | Status | Risk / Notes |
|---|---|---|---|---|

## Risk Register
| Risk | Impact | Mitigation | Accepted |
|---|---|---|---|

## Rollback / Runbook
Steps to stop, roll back, verify recovery, and communicate status.

## Smoke Test Plan

| Check | Environment | Expected Result | Required |
|---|---|---|---|

## Go / No-Go Criteria

- go_criteria:
- no_go_criteria:
- accepted_risks:
- blockers:
- final_decision:

## Visual Model

- type: release_flow
- title:
- nodes:
  - id:
    label:
    kind: build | deploy | migration | smoke_check | monitor | rollback | decision
- edges:
  - from:
    to:
    label:

## Decision
Ready, blocked, not needed, or ready with accepted risks.

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
