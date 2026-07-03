# Learning Loop Template

```markdown
---
id:
stage: learning-loop
status: draft
delivery_profile:
release_target:
inputs:
  - .ai/deploy/
  - .ai/verification/
  - .ai/stories/
outputs: []
trace_links: []
reviewed_at: YYYY-MM-DD
---

# Learning Loop

## Naming Trace

- post_release_id: post-release-<release-or-story-slug>
- release_slug:
- deploy_id:
- story_ids:
- change_ids:
- route_slugs:
- analytics_event_scope:
- analytics_event_names:

## Release Context

- release_or_story_id:
- release_target:
- delivery_profile:
- readiness_decision:
- shipped_behavior:
- intended_business_outcome:
- intended_user_outcome:

## Tracking Providers

- tracking_maturity: none | manual | logs | lightweight_events | product_analytics | production_observability
- product_analytics_provider:
- error_monitoring_provider:
- logging_provider:
- feedback_channels:
- provider_notes:

## Analytics Tool Assessment

- tool_needed: true | false | defer
- reason:
- current_providers:
  - product_analytics:
  - error_monitoring:
  - logging:
  - feedback:
- required_capabilities:
  - page_view:
  - custom_events:
  - funnels:
  - cohorts_or_retention:
  - attribution:
  - experiments:
  - dashboards_for_non_engineers:
  - session_replay:
  - error_tracking:
  - performance_monitoring:
  - alerting:
- candidate_tools:
  - none
  - existing_provider
  - manual_feedback
  - logs
  - lightweight_event_adapter
  - posthog
  - mixpanel
  - amplitude
  - ga4
  - sentry
  - custom
- recommendation:
- privacy_or_compliance_notes:
- implementation_scope:
- accepted_risk_if_deferred:

## No-Tool / Fallback Tracking Plan

- manual_feedback:
- log_based:
- lightweight_event_adapter:
- smoke_or_demo_review:
- access_needed:
- limitations:

## Learning Questions

- question:
  - linked_story_or_event:
  - expected_signal:
  - decision_supported:

## Product Analytics

- event:
  - purpose:
  - trigger:
  - required_properties:
  - privacy_notes:
  - expected_direction:

## Post-Launch Web Metrics

- reach_or_exposure:
  - signal:
  - source:
  - decision_supported:
- activation_or_completion:
  - signal:
  - source:
  - decision_supported:
- funnel_or_dropoff:
  - signal:
  - source:
  - decision_supported:
- ux_state_signals:
  - signal:
  - source:
  - decision_supported:
- operational_health:
  - signal:
  - source:
  - decision_supported:
- performance_or_web_quality:
  - signal:
  - source:
  - decision_supported:
- seo_or_acquisition:
  - signal:
  - source:
  - decision_supported:
- retention_or_repeat_use:
  - signal:
  - source:
  - decision_supported:
- guardrails:
  - signal:
  - source:
  - action_if_triggered:

## Operational Signals

- metric_or_log:
  - source:
  - normal_range:
  - alert_or_review_threshold:
  - action_if_triggered:

## User Feedback

- source:
  - collection_method:
  - review_cadence:
  - tagging_or_triage_notes:

## Decision Criteria

- continue_when:
- iterate_when:
- rollback_or_disable_when:
- no_action_when:

## Follow-Up Plan

- review_date:
- owner:
- required_access:
- open_risks:
- next_artifact_or_workflow_step:

## Observed Results

- observation_period:
- observed_facts:
- interpretation:
- decision:
- follow_up_actions:

## Visual Model

- type: learning_loop
- title:
- nodes:
  - id:
    label:
    kind: release | signal | metric | feedback | decision | action | follow_up
- edges:
  - from:
    to:
    label:

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

## Update Rules

- Keep planned signals separate from observed results.
- Use `unknown` when provider, owner, or access is not known.
- Cite dashboards, logs, tickets, support threads, repo files, or release notes when available.
- Do not invent metrics or results; mark missing access or missing instrumentation as risk.
