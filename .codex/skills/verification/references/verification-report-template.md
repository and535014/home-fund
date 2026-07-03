# Verification Report Template

```markdown
---
id: ver-<story-slug>
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - impl-<story-slug>
  - vd-<story-slug>
outputs:
  - test_results
  - review_findings
  - domain_rule_check
  - deploy_readiness_recommendation
trace_links:
  implementation: []
  verification_design: []
  domain_rules: []
reviewed_at:
---

# Verification Report for <Story Name>

## Naming Trace

- story_id:
- verification_report_id: ver-<story-slug>
- implementation_id:
- verification_design_id:
- change_id:
- route_slug:
- test_files:
- deploy_or_release_slug:

## Delivery Profile
State the release target this verification result supports. Passing local/dev checks does not imply production readiness.

## Run Tests
| Command / Check | Result | Evidence |
|---|---|---|

## Review
| Finding | Severity | Evidence | Resolution |
|---|---|---|---|

## Domain Rule Check
| Rule / Language / Boundary | Source Artifact | Implementation Evidence | Result |
|---|---|---|---|

## Deploy / Launch Readiness Recommendation

- launch_readiness_required: true | false
- release_target_supported:
- deploy_readiness_next: required | conditional | not_needed | blocked
- reason:
- risks_before_launch:
- recommended_next_skill:

## Traceability
| Implementation Item | Test Plan Item | BDD Scenario | AC | Story | Domain Event / Rule |
|---|---|---|---|---|---|

## Decision
Pass, blocked, or pass with accepted risks.

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
