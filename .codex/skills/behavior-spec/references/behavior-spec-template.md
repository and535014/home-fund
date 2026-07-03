# Behavior Spec Template

````markdown
---
id: spec-<scope>-<behavior>
stage: behavior-spec
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - intent-<slug>
  - domain-<slug>
  - prototype-<slug>
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_test_design
  - test_plan
trace_links:
  intent: []
  domain_rules: []
  prototype: []
reviewed_at:
---

# Behavior Spec for <Scope>

## Delivery Profile

- release_target:
- delivery_profile:
- prototype_decision:

## Acceptance Criteria

- AC1:

## Prototype AC Reconciliation

| Prototype / UX AC | Final AC | Decision | Reason / Risk |
|---|---|---|---|

## BDD Scenarios

```gherkin
Feature: <business capability>

  Scenario: <observable behavior>
    Given <domain state>
    When <business action>
    Then <business outcome>
```

## E2E Test Design

| Scenario | Route / Prototype Path | Component Paths | Viewport | Given | When | Then | Required |
|---|---|---|---|---|---|---|---|

## E2E Data, Selectors, and Mocks

- test_data:
- fixture_or_mock_strategy:
- selectors_or_accessible_names:
- responsive_checks:
- accessibility_checks:
- tracking_expectations:

## Test Plan

| Level | What It Verifies | Candidate Test | Required |
|---|---|---|---|
| Unit | Domain rules and pure logic | | |
| Integration | Module/service collaboration | | |
| Contract | Boundary/API/event contract | | |
| E2E | Critical user/business path | | |
| Manual | Human judgment or operational check | | |

## Technical Design Inputs

- route_or_module_questions:
- data_or_state_ownership_questions:
- validation_questions:
- API_or_contract_questions:
- foundation_gaps:

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
