# Archive Summary Template

````markdown
---
id: archive-<scope>-<date>
stage: artifact-compression
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile:
release_target:
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts: []
  commits_or_prs: []
reviewed_at: YYYY-MM-DD
---

# Artifact Compression for <Scope>

## Compression Decision

- scope:
- reason:
- decision: compress | blocked
- next_lifecycle_entry:
- optional_manual_prune_recommended: true | false

## Preserved Decision Summary

- intent:
- final_behavior_or_spec:
- domain_rules:
- foundation_decisions:
- technical_decisions:
- release_target_and_result:
- accepted_risks:
- learning_outcomes:
- commits_or_prs:

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| | maintained / active / summarized / superseded / prune_candidate | | keep / summarize / mark_prune_candidate | |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

-

## Workflow Updates

- active_lifecycle_stage:
- artifact_inventory_changes:
- archive_notes:

## Risks

- traceability_risks:
- audit_or_compliance_risks:
- unresolved_work:

## Review Gate

- decision: approve | revise | blocked
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - release and learning outcomes retained
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - .ai has a clear completed-work summary
  - future work can resume from maintained files and archive summary
- unresolved_blockers:
  -
- next_step:
````
