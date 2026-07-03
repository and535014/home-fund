# Information Architecture Template

```markdown
---
id: information-architecture
stage: ui-prototype
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/project-context.md
outputs:
  - sitemap
  - navigation_model
  - route_purposes
  - user_paths
  - route_metadata_expectations
trace_links:
  changes: []
  stories: []
  observed_files: []
reviewed_at:
---

# Information Architecture

## Naming Trace

- artifact_id: information-architecture
- route_slug_rule:
- nav_group_slug_rule:
- page_slug_rule:
- related_change_ids:
- related_story_ids:

## Scope

- site_or_app:
- audience:
- release_target:
- delivery_profile:
- source_of_truth:

## Sitemap

| Route / Screen | Purpose | Parent / Group | Primary User | Auth / Visibility | Status |
|---|---|---|---|---|---|

## Navigation Model

- primary_nav:
- secondary_nav:
- mobile_nav:
- breadcrumbs:
- tabs_or_local_nav:
- footer_or_utility_nav:

## Page Purposes

| Page | User Goal | Business Goal | Primary Content | Primary Action |
|---|---|---|---|---|

## User Paths

| Path | Entry Point | Steps | Completion | Recovery / Exit |
|---|---|---|---|---|

## Layout Zones

- app_shell:
- page_header:
- action_bar:
- sidebar:
- content_region:
- feedback_region:

## Route Metadata and SEO

| Route | Title Pattern | Description / Metadata | Canonical / Indexing | Notes |
|---|---|---|---|---|

## Permission and State Visibility

| Route / Nav Item | Anonymous | Authenticated | Role / Condition | Empty / Restricted State |
|---|---|---|---|---|

## Change Log

| Change | Reason | Affected Routes | Related Artifact |
|---|---|---|---|

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

## Update Rules

- Keep this as the project-level IA baseline, not a per-story duplicate.
- Update it only when a change affects routes, navigation, page hierarchy, user paths, permissions visibility, SEO metadata, or repeated layout zones.
- For `delivery_profile: mvp`, a compact sitemap and navigation model is enough if risks are recorded.
- Record route/page status as `planned`, `existing`, `changed`, `deprecated`, or `unknown`.
