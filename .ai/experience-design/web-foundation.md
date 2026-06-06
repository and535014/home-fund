---
id: web-foundation
stage: experience-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/idea/home-family-fund.md
  - .ai/ddd/home-family-fund.md
outputs:
  - web_app_shell
  - design_tokens
  - shared_ui_patterns
  - reuse_rules
trace_links:
  stories:
    - story-authenticated-household-access
    - story-admin-member-management
    - story-category-management
    - story-ledger-entry-creation
    - story-ledger-record-corrections
    - story-recurring-rules-and-confirmation
    - story-monthly-records-and-reports
    - story-reimbursement-table-and-settlement
    - story-responsive-core-web-experience
  existing_ui_files: []
  design_docs: []
reviewed_at:
---

# Web Experience Foundation

## Foundation Scope

- app_name: Home Family Fund
- target_user: Household members managing shared family money.
- product_surface: Authenticated responsive web app.
- source_of_truth: Domain artifacts under `.ai/idea`, `.ai/ddd`, and `.ai/stories`.
- primary_language: Traditional Chinese (`zh-TW`).
- theme_support: Dark-first semantic token system based on the shared `chit` design tokens; explicit light theme can be added later if needed.
- applies_to_routes: Google sign-in, dashboard/monthly report, create income/expense, records, reimbursement, recurring rules, categories, members/settings.
- known_exclusions: Public marketing pages, native mobile apps, payment execution, bank sync, production notification design.

## App Shell

- app_frame: Authenticated app shell with persistent navigation and a single main content region.
- header: Shows current household, selected month where relevant, current member, and role/permission indicator.
- sidebar_or_nav: Desktop uses left navigation; mobile uses bottom navigation or compact menu for primary routes.
- content_region: One primary workflow per page with clear title and action area.
- page_title_placement: Top of content region, before filters and primary actions.
- primary_action_placement: Top right on desktop; fixed or prominent bottom action on mobile when creating records.
- secondary_action_placement: Toolbar or overflow menu near the relevant record/list.
- footer_or_status_region: Optional low-priority sync/status area; avoid consuming mobile vertical space.

## Navigation Model

- primary_routes: Monthly report, Records, Create, Reimbursement, Recurring.
- secondary_routes: Categories, Members, Account/session.
- breadcrumb_or_back_behavior: Use back links from detail/edit screens to the originating month or list.
- tabs_or_segmented_views: Use segmented controls for income/expense creation and month-level report sections.
- mobile_navigation: Keep Create and Monthly report reachable within one tap from the app shell.
- deep_linking_notes: Month, record, reimbursement, and member management screens should be addressable later; route shape is architecture-owned.

## Layout Rules

- page_width: Constrain dense financial pages to readable max width on desktop; allow full-width tables when scanning many records.
- grid_or_stack_rules: Desktop can use two-column layouts for summary plus detail; mobile stacks summary, filters, then list cards.
- spacing_scale: Semantic spacing tokens `xs`, `sm`, `md`, `lg`, `xl`; keep repeated financial rows compact.
- section_spacing: Use full-width sections, not nested decorative cards.
- form_layout: Single column on mobile; grouped fields on desktop when labels remain clear.
- list_table_detail_layout: Desktop tables for scanning; mobile list rows/cards with stable actions and no horizontal overflow.
- responsive_breakpoints: Validate at common mobile, tablet, and desktop widths; exact pixel breakpoints are implementation-owned.
- density: Operational app density, not marketing layout. Prioritize scan, compare, and repeated entry.

## Design Tokens

- color_tokens:
  - background: app background in light and dark theme
  - surface: panels, forms, tables in light and dark theme
  - text: primary text in light and dark theme
  - muted_text: secondary labels and metadata in light and dark theme
  - border: separators and control borders in light and dark theme
  - primary: primary action and active navigation
  - danger: delete and destructive confirmation
  - warning: pending reminders and refundable status
  - success: confirmed, reimbursed, saved
  - info: neutral guidance and role notices
  - income: income primary color, mapped to `--income`
  - expense: expense primary color, mapped to `--expense`
- typography_tokens:
  - font_family: system UI unless implementation selects otherwise
  - page_title: compact page heading
  - section_heading: dense section title
  - body: readable app body
  - caption: metadata and helper text
- spacing_tokens:
  - xs: tight inline gap
  - sm: row/control gap
  - md: form and panel gap
  - lg: section gap
  - xl: page-level separation
- radius_tokens:
  - control: small radius
  - panel: small radius, 8px or less unless final system differs
  - modal: small radius
- shadow_tokens:
  - focus: visible focus ring
  - overlay: modal/popover only
- motion_tokens:
  - duration_fast: short UI feedback
  - duration_normal: dialog/toast transitions
  - easing: standard ease
- z_index_tokens:
  - dropdown: above content
  - toast: above dropdown
  - modal: above toast

## Shared Components

- page_shell: Authenticated shell with responsive navigation.
- page_header: Title, month selector/filter when relevant, role-aware primary action.
- toolbar: Filters, search where useful, bulk actions for reimbursement.
- button: Text or icon+text for commands; destructive buttons use danger treatment.
- icon_button: For edit/delete/overflow actions with accessible labels.
- input: Label, helper text, validation message, disabled state.
- select: Category, member, payment source, role, month.
- checkbox_toggle: Reimbursement expense selection, recurring mode only when binary.
- tabs: Income/expense, report sections, settings sections.
- card_or_panel: Individual repeated mobile rows or modal panels only; avoid page-section cards.
- table_or_list_row: Desktop table rows with stable action column; mobile rows with visible status badges.
- status_badge: Pending, refundable, reimbursed, fund-paid, disabled, role labels.
- modal_dialog: Confirmation for delete, reimbursement, role changes.
- empty_state: Actionable but concise; no marketing copy.
- loading_state: Skeleton rows or stable placeholders; avoid layout jump.
- error_state: Inline retry for local page errors; toast for non-blocking failures.
- confirmation_pattern: Explicit confirmation for delete, reimbursement, and permission changes.

## Toast and Notifications

- toast_provider_location: App shell.
- toast_position: Top right on desktop; bottom or top safe area on mobile.
- variants:
  - success: Saved, reimbursed, confirmed.
  - error: Save failed, permission denied, conflict.
  - warning: Pending item, destructive confirmation outcome.
  - info: Role or read-only explanation.
- default_duration: Short for success/info; persistent or user-dismissed for errors that need action.
- dismissal_behavior: User can dismiss; error toasts should not hide required inline messages.
- action_support: Retry or view affected record where useful.
- accessibility_behavior: Announce toast messages through polite live region; errors may need assertive announcement.
- when_to_use_toast: After background or cross-page actions succeed/fail.
- when_not_to_use_toast: As the only explanation for form validation or permission denial.
- server_error_mapping: Domain/permission errors map to inline field/page messages plus optional toast.

## Feedback and State Patterns

- form_validation: Validate required amount, date/month, category, member/payment source, and permissions before submit.
- inline_errors: Place near field or action; preserve user input.
- global_errors: Use page-level alert for failed loads or permission state mismatch.
- optimistic_updates: Avoid for reimbursement and permission changes in MVP unless rollback is explicit.
- destructive_actions: Confirm record deletion and permission changes.
- permission_denied: Explain allowed role/action without exposing sensitive internals.
- offline_or_retry: Show retry for failed loads/submits; local_dev can use generic network failure language.
- long_running_tasks: Recurring posting and report generation should show stable progress/loading if delayed.

## Reuse and Extraction Rules

- reuse_existing_first: No existing UI files found.
- extract_component_when:
  - second_route_reuses_layout: Extract page shell/header pattern.
  - second_form_reuses_field_pattern: Extract labeled field and validation pattern.
  - second_list_reuses_row_or_toolbar: Extract records list/table and action toolbar.
  - repeated_empty_error_loading_state: Extract shared state components.
  - repeated_toast_or_notification_pattern: Extract toast provider and helper.
- duplication_allowed_when: One-off MVP screen state copy before a second use appears.
- update_foundation_when: Navigation, table/list, form, toast, or permission-state behavior changes.
- accepted_mvp_shortcuts: Lightweight visual styling and in-app reminders only, if product confirms.

## Visual Language

- icon_style: Use established icon library during implementation; icons need labels or tooltips.
- border_usage: Use borders and spacing for dense grouping; avoid decorative nested cards.
- color_usage: Status colors must not be the only status cue.
- theme_usage: Use semantic tokens from `globals.css` instead of fixed colors. Income uses `--income`; expenses use `--expense`.
- elevation_usage: Reserve elevation for overlays.
- copy_tone: Direct Traditional Chinese household finance language; avoid accounting jargon unless domain requires it.
- data_density: Dense but legible financial rows with clear totals and status.
- accessibility_baseline: Keyboard navigable, visible focus, semantic labels, announced errors, sufficient contrast in both light and dark themes.

## Open Questions and Risks

- design_system: None exists yet.
- token_source: Semantic tokens need implementation values later.
- component_ownership: Unknown until architecture.
- responsive_behavior: Minimum supported mobile width needs confirmation.
- accessibility: Dense reimbursement tables need careful mobile, screen reader, and dark-theme contrast design.
- technical_constraints: Stack, routing, persistence, Google OAuth provider implementation, and exact currency decision are undecided.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate app shell, navigation priority, and RWD assumptions.
  - Confirm status language for fund-paid, refundable, and reimbursed expenses.
- must_check:
  - Core workflows remain reachable on desktop and mobile.
  - Permission and validation states have shared patterns.
  - Foundation avoids framework/API decisions.
- acceptance_signals:
  - Story-specific experience designs can reuse these patterns without redefining app shell basics.
  - Architecture planning can identify frontend/backend boundaries from repeated UI needs.
- unresolved_blockers:
  - None for story-specific experience design.
- next_step:
  - experience-design
