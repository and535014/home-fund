# Web Foundation Template

Use this project-level artifact before implementing the first user-facing web story, or when app-level UI patterns become stale.

```markdown
---
id: web-foundation
stage: experience-prototype
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/project-context.md
outputs:
  - web_app_shell
  - design_tokens
  - shared_ui_patterns
  - reuse_rules
trace_links:
  stories: []
  existing_ui_files: []
  design_docs: []
reviewed_at:
---

# Web Experience Foundation

## Foundation Scope

- app_name:
- target_user:
- product_surface:
- source_of_truth:
- applies_to_routes:
- known_exclusions:

## App Shell

- app_frame:
- header:
- sidebar_or_nav:
- content_region:
- page_title_placement:
- primary_action_placement:
- secondary_action_placement:
- footer_or_status_region:

## Navigation Model

- primary_routes:
- secondary_routes:
- breadcrumb_or_back_behavior:
- tabs_or_segmented_views:
- mobile_navigation:
- deep_linking_notes:

## Layout Rules

- page_width:
- grid_or_stack_rules:
- spacing_scale:
- section_spacing:
- form_layout:
- list_table_detail_layout:
- responsive_breakpoints:
- density:

## Design Tokens

- color_tokens:
  - background:
  - surface:
  - text:
  - muted_text:
  - border:
  - primary:
  - danger:
  - warning:
  - success:
  - info:
- typography_tokens:
  - font_family:
  - page_title:
  - section_heading:
  - body:
  - caption:
- spacing_tokens:
  - xs:
  - sm:
  - md:
  - lg:
  - xl:
- radius_tokens:
  - control:
  - panel:
  - modal:
- shadow_tokens:
  - focus:
  - overlay:
- motion_tokens:
  - duration_fast:
  - duration_normal:
  - easing:
- z_index_tokens:
  - dropdown:
  - toast:
  - modal:

## Shared Components

- page_shell:
- page_header:
- toolbar:
- button:
- icon_button:
- input:
- select:
- checkbox_toggle:
- tabs:
- card_or_panel:
- table_or_list_row:
- status_badge:
- modal_dialog:
- empty_state:
- loading_state:
- error_state:
- confirmation_pattern:

## Toast and Notifications

- toast_provider_location:
- toast_position:
- variants:
  - success:
  - error:
  - warning:
  - info:
- default_duration:
- dismissal_behavior:
- action_support:
- accessibility_behavior:
- when_to_use_toast:
- when_not_to_use_toast:
- server_error_mapping:

## Feedback and State Patterns

- form_validation:
- inline_errors:
- global_errors:
- optimistic_updates:
- destructive_actions:
- permission_denied:
- offline_or_retry:
- long_running_tasks:

## Reuse and Extraction Rules

- reuse_existing_first:
- extract_component_when:
  - second_route_reuses_layout:
  - second_form_reuses_field_pattern:
  - second_list_reuses_row_or_toolbar:
  - repeated_empty_error_loading_state:
  - repeated_toast_or_notification_pattern:
- duplication_allowed_when:
- update_foundation_when:
- accepted_mvp_shortcuts:

## Visual Language

- icon_style:
- border_usage:
- color_usage:
- elevation_usage:
- copy_tone:
- data_density:
- accessibility_baseline:

## Open Questions and Risks

- design_system:
- token_source:
- component_ownership:
- responsive_behavior:
- accessibility:
- technical_constraints:

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

- Keep this artifact at app-level. Do not duplicate story-specific flow details here.
- Prefer semantic token roles over raw colors so implementation can swap themes later.
- Use `unknown` for token values that must be derived from existing UI or brand decisions.
- Update this artifact when a second screen introduces repeated layout, title, action, form, list, toast, empty, error, loading, or navigation behavior.
