# Impact Analysis Template

```markdown
---
id: ia-<change-slug>
stage: impact-analysis
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-<slug>
  - cu-<scope-slug>
outputs:
  - affected_contexts
  - affected_code_areas
  - risk_map
  - story_slicing_recommendations
trace_links:
  domain_events: []
  bounded_contexts: []
  code_understanding: []
  source_files: []
reviewed_at:
---

# Impact Analysis for <Change>

## Delivery Profile
State the inherited delivery profile and release target that constrain impact and risk analysis.

## Change Summary
What domain behavior or product outcome is being introduced or changed.

## Affected Domain Areas
| Domain Event / Rule / Context | Impact | Risk |
|---|---|---|

## Affected Code Areas
| Area | Path / Module / Contract | Expected Impact | Evidence |
|---|---|---|---|

## Data and Integration Impact
| Data / Integration | Owner | Impact | Compatibility Concern |
|---|---|---|---|

## Test Impact
| Existing / Needed Test Area | Impact | Notes |
|---|---|---|

## Story Slicing Recommendations
| Candidate Slice | Business Value | Implementation Risk | Dependencies |
|---|---|---|---|

## Visual Model

- type: impact_map
- title:
- nodes:
  - id:
    label:
    kind: domain_area | code_area | data | integration | test | risk | story_candidate
- edges:
  - from:
    to:
    label:

## Blockers and Open Questions
Unknowns that should stop or constrain story slicing.

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
