# Architecture Template

```markdown
---
id: arch-<slug>
stage: feature-technical-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-<slug>
  - ddd-<slug>
outputs:
  - architecture_decisions
  - web_architecture
  - boundaries
  - routing_and_layout_decisions
  - data_ownership
  - integration_contracts
trace_links:
  stories: []
  experience_design: []
  information_architecture: []
  web_foundation: []
  bounded_contexts: []
  domain_events: []
reviewed_at:
---

# <Architecture Name>

## Naming Trace

- architecture_id: arch-<scope>-<decision>
- story_id:
- change_id:
- scope_slug:
- decision_slug:
- route_slug:
- module_slug:
- related_artifact_ids:

## Delivery Profile
State the release target and whether decisions are MVP-accepted or production-required.

## Context and Forces
Business, domain, operational, and technical forces shaping the design.

## Boundaries
| Boundary | Owns | Collaborates With | Reason |
|---|---|---|---|

## Routing, Layout, and Metadata

- route_ownership:
- layout_boundaries:
- navigation_config_owner:
- breadcrumb_or_title_source:
- route_metadata_source:
- permission_visibility_enforcement:
- seo_metadata_generation:
- content_or_cms_contract:

## Web Architecture

- routing_structure:
- layout_boundaries:
- page_module_structure:
- feature_module_structure:
- shared_component_boundaries:
- component_extraction_rules:
- design_token_source:
- styling_boundary:
- state_ownership:
- form_validation_ownership:
- data_fetching_boundary:
- api_or_server_action_contracts:
- client_server_boundary:
- route_metadata_source:
- breadcrumb_title_source:
- toast_modal_provider_location:
- analytics_provider_location:
- error_boundary_strategy:
- loading_empty_error_state_strategy:
- permission_visibility_strategy:
- accessibility_ownership:
- testability_hooks:
- mvp_duplication_accepted:
- extraction_trigger:

## Web Architecture Decision Matrix

| Concern | Decision | Owner / Location | Source Artifact | Verification Implication |
|---|---|---|---|---|
| Route / page | | | | |
| Layout / shell | | | | |
| Feature module | | | | |
| Shared component | | | | |
| State / data fetching | | | | |
| Forms / validation | | | | |
| Providers / cross-cutting | | | | |
| Errors / async states | | | | |

## Data Ownership
| Data / Model | Owner | Readers | Consistency Need |
|---|---|---|---|

## Integration Contracts
| Producer | Consumer | Contract | Failure / Retry Notes |
|---|---|---|---|

## ADRs
### ADR-<n>: <Decision>
- Status:
- Decision:
- Rationale:
- Consequences:

## Visual Model

- type: architecture_map
- title:
- nodes:
  - id:
    label:
    kind: frontend | backend | module | bounded_context | data_store | external_system
- edges:
  - from:
    to:
    label:

## Open Risks

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
