# Code Understanding Template

```markdown
---
id: cu-<scope-slug>
stage: code-understanding
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-<slug>
  - idea-<slug>
outputs:
  - repo_map
  - observed_boundaries
  - test_landscape
  - domain_language_gap
trace_links:
  ddd_artifacts: []
  source_files: []
  docs: []
reviewed_at:
---

# Code Understanding for <Scope>

## Delivery Profile
State the inherited delivery profile and release target that constrain code reality analysis.

## Repository State
Empty, scaffolded, or existing system. Include evidence.

## Technology and Tooling
Manifests, frameworks, runtimes, package managers, test tools, build tools.

## Current Structure
| Area | Path / Module | Responsibility | Evidence |
|---|---|---|---|

## Observed Boundaries and Data Ownership
| Boundary / Module | Owns | Collaborates With | Evidence |
|---|---|---|---|

## Existing Domain Language
| Code Term | DDD Term | Match / Gap | Notes |
|---|---|---|---|

## Test Landscape
| Test Type | Location / Command | Coverage Notes |
|---|---|---|

## Inferences
Reasonable conclusions drawn from observed facts.

## Unknowns and Risks
Items that block reliable impact analysis.

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
