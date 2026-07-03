# Domain Impact Template

````markdown
---
id: domain-impact-<intent-slug>
stage: domain-impact
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - intent-<slug>
  - domain-project | domain-<bounded-context>
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent: []
  maintained_domain_artifacts: []
reviewed_at:
---

# Domain Impact for <Intent>

## Summary

- intent_id:
- maintained_domain_artifacts_updated:
- bounded_contexts_touched:
- impact_type: new_behavior | changed_rule | changed_policy | changed_state | changed_language | no_domain_change

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | | | | |
| events | | | | |
| commands | | | | |
| policies | | | | |
| aggregates_or_invariants | | | | |
| bounded_contexts | | | | |
| lifecycle_or_states | | | | |

## Downstream Impact

- prototype_states_or_flows:
- bdd_scenarios:
- technical_design_boundaries:
- tdd_domain_tests:
- release_or_learning_signals:

## Open Questions and Risks

- product:
- domain:
- data_or_ownership:
- policy_or_permission:

## Review Gate

- decision: approve | revise | blocked
- reviewer_focus:
  - durable domain model updated separately
  - this file contains only intent-specific delta
  - downstream impacts are actionable
- must_check:
  - trace links point to maintained domain artifact
  - no long-lived domain rules exist only in this impact file
- acceptance_signals:
  - prototype/BDD/technical design can consume this delta
- unresolved_blockers:
  -
- next_step:
````
