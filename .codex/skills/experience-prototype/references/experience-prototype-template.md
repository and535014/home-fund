# Experience Prototype Template

````markdown
---
id: prototype-<scope>-<outcome>
stage: experience-prototype
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - intent-<slug>
  - domain-<slug>
  - foundation-init-<slug>
outputs:
  - interactive_prototype
  - ux_acceptance_criteria_draft
  - e2e_scenario_draft
trace_links:
  intent: []
  domain_events: []
  foundation: []
reviewed_at:
---

# Experience Prototype for <Scope>

## Summary

- primary_user:
- user_goal:
- business_outcome:
- release_target:
- prototype_required: true | false
- prototype_decision: accepted | accepted_with_gaps | skipped_with_risk | blocked

## Prototype Evidence

- prototype_location: intended_app_route | route_group | page_or_layout | route_local_components | shared_components | accepted_exploratory_sandbox
- prototype_path:
- production_route_or_target_path:
- frontend_stack_used:
- component_library:
- component_paths:
- reused_foundation_components:
- new_or_updated_production_candidate_components:
- styling_or_token_source:
- run_command:
- review_url:
- secondary_review_surface:
- fixture_or_mock_strategy:
- states_implemented:
- responsive_baseline:
- keyboard_and_focus_baseline:
- accessibility_baseline:
- known_gaps:
- accepted_gaps:
- invalid_as_gate_evidence:
  - standalone_html_file
  - static_mockup
  - screenshot_only
  - figma_only
  - throwaway_non_project_stack_page
  - isolated_prototype_folder
  - storybook_only_without_route_slice

## Task Flow

| Step | User Intent | System Response | Domain / Intent Link |
|---|---|---|---|

## Information Architecture

- route_or_screen_delta:
- navigation_delta:
- user_path_delta:
- permission_visibility_delta:
- seo_or_metadata_delta:

## Screen States

| State | User Sees | User Can Do | Data / System Need | Prototype Coverage | Risk |
|---|---|---|---|---|---|

## UX Acceptance Criteria Draft

- AC-UX1:

## E2E Scenario Draft

- scenario:
  - route:
  - viewport:
  - given:
  - when:
  - then:
  - selectors_or_accessible_names:
  - mock_or_fixture_needs:

## Frontend / Backend Expectations

- data_needed_by_ui:
- user_actions_crossing_boundary:
- expected_success_responses:
- expected_error_responses:
- client_state_questions:
- server_state_questions:

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
````
