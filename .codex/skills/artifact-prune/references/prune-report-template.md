# Artifact Prune Report Template

````markdown
---
id: prune-<scope>-<date>
stage: artifact-prune
status: draft
workflow_version: ddd-website-lifecycle-v2
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/archive/<archive-id>.md
outputs:
  - prune_report
trace_links:
  archive_summaries: []
  commits_or_prs: []
reviewed_at: YYYY-MM-DD
---

# Artifact Prune for <Scope>

## Prune Decision

- explicit_user_request: true | false
- decision: prune | blocked
- reason:

## Git Safety

- git_repository_present: true | false
- working_tree_status:
- source_artifacts_committed: true | false
- prune_allowed: true | false
- blocker:

## File Actions

| File | Classification | Action | Reason / Trace |
|---|---|---|---|
| | keep_maintained / keep_active / delete_completed / blocked | keep / delete / block | |

## Result

- kept_files:
- deleted_files:
- blocked_files:
- workflow_inventory_changes:
- next_lifecycle_entry:

## Review Gate

- decision: approve | revise | blocked
- reviewer_focus:
  - only explicit prune request was honored
  - git safety passed
  - active and maintained files were preserved
- unresolved_blockers:
  -
- next_step:
````
