# Event Storming Template

```markdown
---
id: domain-project | domain-<bounded-context>
stage: domain-discovery
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - intent-<slug>
outputs:
  - domain_events
  - command_event_matrix
  - aggregate_candidates
  - bounded_context_candidates
trace_links: []
reviewed_at:
---

# <Project or Bounded Context> Domain Model

## Delivery Profile
State the inherited delivery profile and release target that constrain the domain discovery.

## Maintenance Scope

- artifact_role: project_domain_model | bounded_context_model
- owning_context:
- update_policy: update_in_place
- create_new_domain_file_only_when:
  - a stable bounded context has distinct language, ownership, lifecycle, or invariants

## Ubiquitous Language
| Term | Meaning | Context |
|---|---|---|

## Event Timeline
| Order | Domain Event | Triggering Command | Actor | Business Outcome |
|---:|---|---|---|---|

## Command Catalog
| Command | Actor | Intent | Resulting Events | Notes |
|---|---|---|---|---|

## Policies
| When Event Happens | Policy / Rule | Command Issued | Notes |
|---|---|---|---|

## Aggregate Candidates
| Aggregate | Events Owned | Invariants | Open Questions |
|---|---|---|---|

## Bounded Context Candidates
| Context | Language | Responsibilities | Upstream / Downstream |
|---|---|---|---|

## Visual Model

- type: event_flow
- title:
- nodes:
  - id:
    label:
    kind: command | event | policy | actor | aggregate | context
- edges:
  - from:
    to:
    label:

## Risks and Open Questions

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
