# Implementation Log Template

```markdown
---
id: impl-<story-slug>
stage: tdd-implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-<story-slug>
outputs:
  - tests
  - code_changes
  - architecture_alignment
  - refactor_notes
trace_links:
  acceptance_criteria: []
  bdd_scenarios: []
  test_plan_items: []
reviewed_at:
---

# Implementation Log for <Story Name>

## Naming Trace

- story_id:
- implementation_id: impl-<story-slug>
- verification_design_id:
- change_id:
- route_slug:
- test_files:
- code_component_names:
- analytics_event_names:

## Delivery Profile
State the release target this implementation supports and any profile-specific constraints followed.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|

## Coding Summary
Files, modules, or boundaries changed and why.

## Web Architecture Alignment

- architecture_artifact:
- route_or_layout_changes:
- page_or_feature_module_changes:
- shared_component_changes:
- state_or_data_boundary_changes:
- validation_boundary_changes:
- provider_or_cross_cutting_changes:
- metadata_or_navigation_changes:
- error_loading_empty_state_changes:
- accepted_duplication:
- extraction_trigger_followed:

## Refactor Summary
What changed after tests were green and what behavior stayed unchanged.

## Deviations
Any implementation detail that required updating story, architecture, or verification design.

## Remaining Risks

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
