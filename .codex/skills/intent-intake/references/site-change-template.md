# Site Change Template

```markdown
---
id: change-<slug>
stage: intent-intake
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/project-context.md
outputs:
  - decision_summary
  - change_type_and_impact
  - ia_impact
  - launch_readiness_scope
  - workflow_path
trace_links:
  source_request:
  related_artifacts: []
  related_files: []
reviewed_at: YYYY-MM-DD
---

# Site Change: <Name>

## Decision Summary

- decision: proceed | revise | blocked
- recommended_next_skill:
- required_steps:
  -
- skipped_steps:
  -
- conditional_steps:
  -
- reason:
- blocking_questions:
  -
- handoff_input_needed:
  -

## Naming Trace

- change_id: change-<scope>-<outcome>
- scope_slug:
- outcome_slug:
- route_slug:
- release_slug:
- related_story_slug_prefix:
- analytics_scope:
- naming_notes:

## Change Type and Impact

- change_type:
- primary_slice_types:
  -
- user_or_business_goal:
- primary_audience:
- success_signal:
- urgency:
- routes:
- pages:
- layouts:
- navigation:
- information_architecture:
- shared_components:
- design_tokens:
- forms:
- content:
- seo:
- analytics:
- backend_or_api:
- data:
- auth_or_permissions:
- deployment:
- launch_readiness:
- post_launch_learning:

## Workflow Step Decision

| Step | Decision | Reason | Required Input |
|---|---|---|---|
| intent-intake | required / skipped / conditional | | |
| domain-discovery | required / skipped / conditional | | |
| code-understanding | required / skipped / conditional | | |
| impact-analysis | required / skipped / conditional | | |
| experience-prototype | required / skipped / conditional | | |
| project-foundation-architecture | required / skipped / conditional | | |
| project-foundation-implementation | required / skipped / conditional | | |
| behavior-spec | required / skipped / conditional | | |
| feature-technical-design | required / skipped / conditional | | |
| tdd-implementation | required / skipped / conditional | | |
| verification | required / skipped / conditional | | |
| target-aware-release | required / skipped / conditional | | |
| release-execution | required / skipped / conditional | production-only; required only when production deployment is explicitly requested | |
| learning-loop | required / skipped / conditional | | |
| artifact-compression | required / skipped / conditional | | |

## IA / Sitemap Impact

- ia_impact: none | local | global
- existing_ia_artifact: present | missing | stale | not_needed
- affected_routes:
- affected_navigation:
- affected_page_hierarchy:
- affected_user_paths:
- affected_permissions_visibility:
- affected_seo_metadata:
- update_needed:

## Domain Complexity

- ddd_needed:
- reason:
- domain_events_or_rules_likely:
- policies_or_state_transitions:
- bounded_contexts_likely:

## Web Foundation Status

- web_foundation_status: present | missing | stale | not_needed
- reason:
- patterns_affected:
- update_needed:

## Launch Readiness Scope

- launch_readiness_required: true | false
- release_target: local_dev | internal_demo | preview | staging | production
- reason:
- environment_or_config_changes:
- secrets_or_provider_config:
- migration_or_data_change:
- redirects_or_routing_release:
- seo_or_indexing_change:
- auth_or_permission_change:
- external_integrations:
- analytics_or_monitoring_change:
- rollback_risk:
- smoke_check_needed:
- post_release_tracking_needed:

## Constraints and Risks

- constraints:
  -
- risks:
  -
- assumptions:
  -
- blockers:
  -

## Handoff

- next_skill:
- why_this_next:
- inputs_to_carry_forward:
  -
- do_not_do:
  -
```

## Update Rules

- Keep this brief short. It routes work; it does not replace downstream artifacts.
- The `Decision Summary` must be enough for a reviewer to decide whether the next skill can start without reading the whole artifact.
- Use `unknown` for missing facts instead of inventing intent.
- Prefer the smallest workflow path that can safely deliver and verify the change.
