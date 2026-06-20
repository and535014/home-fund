---
id: category-visual-identity
stage: intent
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-20-category-color-icon
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/intent/admin-only-category-management.md
  - .ai/domain/home-family-fund.md
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  existing_category_management:
    - .ai/archive/archive-admin-only-category-management-2026-06-19.md
    - .ai/intent/admin-only-category-management.md
  current_code:
    - prisma/schema.prisma
    - src/modules/categorization/category-catalog.ts
    - src/modules/categorization/category-command.ts
    - src/app/category-actions.ts
    - src/app/category-management-context.ts
    - src/app/(app)/settings/categories/page.tsx
    - src/app/(app)/settings/categories/category-management-panel.tsx
    - src/app/record-entry-panel.tsx
    - src/app/record-category-label.tsx
    - src/app/record-list-detail.tsx
    - src/app/(app)/page.tsx
    - src/app/dashboard-charts.tsx
    - src/modules/reporting/monthly-report.ts
reviewed_at: 2026-06-20
---

# Category Visual Identity And Ordering

## Decision Summary

- decision: proceed
- first_next_gate: targeted Domain Discovery
- owning_skill: domain-discovery
- reason: The request adds durable category attributes and display ordering, changes how categories are recognized and selected across ledger workflows, and affects multiple user-facing surfaces. The current category model only stores type, name, and lifecycle status.

## User Request

分類要可以自行設定顏色以及 icon，並在對應的地方顯示。分類還要可以排序，且排序會影響新增紀錄時的分類顯示順序。

## Change Classification

- project_type: feature_change
- secondary_types:
  - existing_page_change
  - form_or_workflow
  - visual_polish
  - data_model_change
  - component_change
  - ordering_behavior
- release_target: local_dev
- delivery_profile: mvp

## Target Users And Outcome

- target_users: household admins who maintain categories, and household members who create or review income and expense records.
- problem: categories are currently text-only and implicitly ordered, so users cannot visually scan category choices quickly or put frequently used categories first when creating records.
- business_outcome: make category recognition and selection faster by letting admins assign an icon, color, and order to each category and by applying that identity/order wherever category context appears.

## Affected Surfaces

| Surface | Impact |
|---|---|
| Data | `Category` needs persisted color, icon, and sort order attributes, defaults for existing rows, validation, seed data, and migration handling. |
| Domain modules | Category create/update/reorder commands need to define allowed color, icon, and ordering inputs, defaults, validation, and whether visual identity/order can be edited for archived categories. |
| Admin category management | Create, edit, and reorder flows need color/icon controls, previews, ordering controls, validation errors, and archived/read-only display behavior. |
| Record creation | Category radio choices should show the selected category icon and color and follow the configured order while preserving accessible labels and keyboard selection. |
| Record list and detail | Category labels in record rows and detail modal should render the category visual identity when metadata is available. |
| Dashboard/reporting | Category summary panels and charts should use category color consistently instead of hard-coded chart colors where practical. |
| Shared components | A reusable category badge/label primitive may be needed so icon, color, and name are rendered consistently. |
| Forms | Server actions and client forms need new fields for visual identity and Traditional Chinese validation copy. |
| Tests | Unit and E2E coverage need to assert persistence, validation, accessible labels, and display across management and ledger surfaces. |
| Release | Local dev migration and seed readiness need refresh after implementation. |

## Scope

- In scope:
  - Admin can choose or change a category color and icon when creating or editing a category.
  - Admin can reorder active categories within their income/expense type.
  - Existing categories receive safe default color and icon values.
  - Existing categories receive deterministic default ordering.
  - Category color and icon display in category management, record creation category choices, record list/detail category labels, and dashboard/report category summaries where category metadata is available.
  - New record category choices are ordered by the configured category order for the selected record type.
  - Archived categories keep their visual identity for historical display.
  - Archived categories do not unexpectedly disrupt the active-category ordering used for new records.
  - Color/icon inputs are validated on the server, not only in the browser.
- Out of scope:
  - User-specific category colors or icons.
  - Uploading custom icon files or arbitrary remote images.
  - Per-record overrides of category visual identity.
  - Production deployment readiness beyond the existing `local_dev` target.
  - Analytics experiments or conversion tracking.

## Success Criteria

- Admin category create and edit workflows include usable color and icon selection controls.
- Admin category management includes a usable way to reorder categories within each type.
- Created or edited category visual identity persists after refresh.
- Category order persists after refresh.
- Existing category display remains readable if a category has defaulted visual metadata.
- Existing categories have a stable default order after migration/seed.
- Record creation, historical record display, and dashboard/report category summaries show the configured visual identity without losing accessible category names.
- Record creation category choices follow the configured order for income and expense categories.
- Invalid color or unsupported icon values are rejected consistently by server-side validation.
- Invalid reorder requests are rejected consistently by server-side validation.
- The implementation has focused unit and browser coverage for the changed category lifecycle and display surfaces.

## Current Code Signals

- `prisma/schema.prisma` model `Category` currently has `id`, `householdId`, `type`, `name`, `status`, and timestamps only.
- `src/modules/categorization/category-catalog.ts` type `Category` currently includes `id`, `type`, `name`, and `status`, so visual identity must enter the domain contract before UI rendering can rely on it.
- `src/app/(app)/settings/categories/category-management-panel.tsx` currently supports type, name, edit, archive, and record count, but no color, icon, or ordering controls.
- `src/app/record-entry-panel.tsx` renders category radio options by name only.
- `src/app/record-list-detail.tsx` and `src/app/record-category-label.tsx` currently resolve/display category names for historical records.
- `src/app/(app)/page.tsx`, `src/app/dashboard-charts.tsx`, and `src/modules/reporting/monthly-report.ts` already produce category summaries; chart coloring appears separate from persisted category metadata.

## Domain Discovery Need

- required: true
- scope: targeted backfill for Categorization and Reporting display language
- decisions_to_capture:
  - Whether color and icon are required properties of every category or optional with system defaults.
  - Whether every category has a required numeric sort position per household and type.
  - How new categories are inserted into order by default, for example appended to the end of their type.
  - Whether ordering applies only to active categories or also includes archived categories for admin review.
  - Whether archived categories can have visual identity edited, or only active categories can be changed.
  - Allowed icon source, for example a curated Lucide icon key list rather than arbitrary user input.
  - Allowed color format and palette constraints, including whether admins can pick arbitrary hex values or a curated swatch palette.
  - How reports and historical records behave when category metadata is missing, invalid, or later changed.
- reason: These are durable category attributes and ordering invariants that affect historical ledger readability and new-record selection behavior.

## Foundation Architecture Need

- required: false
- reason: The existing Next.js, Prisma, Tailwind, shadcn-style component, Vitest, and Playwright foundation can support this change. No framework or app-shell decision is needed.

## Experience Prototype Need

- required: true
- timing: after targeted Domain Discovery
- reason: This is user-facing UI across forms, badges, and dashboard summaries. The icon and color controls need reviewable interaction, responsive behavior, focus behavior, and accessible labeling before spec and implementation.
- user_facing_surfaces:
  - category create dialog
  - category edit dialog
  - category reorder controls
  - active and archived category lists
  - record creation category chooser
  - record list/detail category labels
  - dashboard category summary/chart display

## Behavior Spec / BDD / E2E Need

- required: true
- timing: after Experience Prototype
- reason: The change adds persisted fields, validation, and cross-surface display behavior.
- scenarios_to_cover:
  - Admin creates a category with a selected icon and color.
  - Admin edits an active category icon and color.
  - Admin reorders active categories within a type.
  - Invalid color or unsupported icon input is rejected.
  - Invalid reorder input is rejected.
  - Existing/defaulted categories render with fallback visual identity.
  - Existing/defaulted categories have stable ordering.
  - Record creation category options display category icon, color, and accessible name.
  - Record creation category options follow configured order for the selected type.
  - Record list and detail display the configured category identity.
  - Dashboard category summary or chart uses persisted category color where applicable.
  - Archived categories keep visual identity visible for historical records and admin review.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: Implementation needs decisions for Prisma migration/defaults, server action payloads, icon registry, color validation, sort-position storage/reorder algorithm, reusable category label components, chart color mapping, and test fixture updates.

## Target-Aware Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: A Prisma schema/data migration and seed/default ordering changes must be verified for local development.
- learning_loop_required: false
- learning_reason: This local_dev feature does not introduce production analytics, experiments, or post-launch feedback requirements.

## Open Questions

- Should admins choose from a curated color palette, enter arbitrary hex colors, or both?
- Which icon set is approved for category icons, and should it be limited to a curated subset?
- Should the edit flow allow visual identity changes for archived categories?
- Should archived categories be reorderable, or should ordering be limited to active categories used for new records?
- Should a newly created category appear at the end of its type by default?
- Should ordering be manual-only, or should name/type/status sorting remain as a fallback when sort positions are missing?
- Which dashboard/report surfaces are mandatory for the first slice: summary list only, chart only, or both?

## Review Gate

- status: needs_user_review
- decision_needed: approve this intent and route to targeted Domain Discovery, or revise scope/open questions before continuing.
- recommended_next_gate: Domain Discovery
- stop_condition: Wait for explicit user approval before creating domain-impact, prototype, behavior spec, technical design, implementation, verification, release, learning, or compression artifacts.
