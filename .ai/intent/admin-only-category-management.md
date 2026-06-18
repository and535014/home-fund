---
id: admin-only-category-management
stage: intent
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-18-admin-only-category-management
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/intent/home-family-fund.md
  - .ai/domain/home-family-fund.md
  - .ai/spec/story-category-management.md
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  existing_story:
    - .ai/spec/story-category-management.md
  existing_domain:
    - .ai/domain/home-family-fund.md
  current_code:
    - src/app/categories/page.tsx
    - src/app/dashboard-navigation.ts
    - src/modules/identity-access/authorization.ts
    - src/modules/identity-access/access-hints.ts
    - src/modules/categorization/category-catalog.ts
    - prisma/schema.prisma
reviewed_at: 2026-06-18
---

# Admin-Only Category Management

## Decision Summary

- decision: proceed
- first_next_gate: targeted Domain Discovery backfill
- owning_skill: ddd-event-storming
- reason: The request changes a permission policy and category lifecycle workflow. The current domain and story artifacts leave category management roles unresolved or capability-based, while the requested behavior says only admins may browse the category page and create, edit, or archive categories.

## User Request

Only administrators can browse the category page, and only administrators can add, edit, and archive categories. Non-admin members must not see the category entry in the sidebar.

## Change Classification

- change_type: feature_change
- secondary_types:
  - existing_page_change
  - form_or_workflow
  - backend_behavior
  - component_change
- release_target: local_dev

## Affected Surfaces

| Surface | Impact |
|---|---|
| Routes | `/categories` must block non-admin members, not only hide sidebar navigation. |
| Navigation and IA | Category navigation must be visible only to admins; finance managers and general members should not see the sidebar category item at all. |
| Page UI | Category page needs list, create, edit, archive states for income and expense categories. |
| Forms | Create/edit category forms need validation, disabled/submitting/error states, and Traditional Chinese copy. |
| Backend/API | Category mutations need server-side admin authorization and persistence. |
| Domain modules | `manage_categories` currently allows admin or capability-based access; this request makes category management admin-only. |
| Data | Existing `Category.status = archived` can support archive behavior; historical records must keep archived category names readable. |
| Auth/permissions | Finance managers and members with `manage_categories` capability must not browse or mutate categories unless they are admins. |
| Tests | Unit, route/action, and browser permission tests must cover admin and non-admin paths. |
| Release readiness | Local dev release evidence must be refreshed after implementation and verification. |

## Current Code Signals

- `src/app/categories/page.tsx` exists but is a placeholder and does not enforce an admin-only route guard after the dashboard context loads.
- `src/app/dashboard-navigation.ts` already depends on `accessHints.navigation.canOpenCategories`.
- `src/modules/identity-access/authorization.ts` currently allows `manage_categories` for admins or members with the `manage_categories` capability.
- `src/modules/categorization/category-catalog.ts` already has create, rename, archive, and list-active domain functions, but inherits the capability-based authorization.
- `prisma/schema.prisma` already has `CategoryStatus.active` and `CategoryStatus.archived`.
- `.ai/spec/story-category-management.md` has the category story, but its open question asks whether finance managers can manage categories or only admins.

## Domain Discovery Need

- required: true
- scope: targeted backfill for Categorization and Identity and Access
- decisions_to_capture:
  - Category management is admin-only for MVP.
  - Browsing the category management page is also admin-only, not merely mutating categories.
  - Non-admin members must not see the category sidebar entry.
  - `manage_categories` capability is not sufficient for category management under this slice unless a future approved change reintroduces delegated category managers.
  - Archived categories remain readable on historical records and reports but unavailable for new income/expense records.
- reason: This is an authorization policy and category lifecycle change, and it closes a previously unresolved domain question.

## Foundation Architecture Need

- required: false
- reason: The existing foundation has Next.js routes, dashboard frame, auth/current-member resolution, Prisma data source, category schema, and domain modules. No framework, routing foundation, or persistence foundation change is required.

## Experience Prototype Need

- required: true
- timing: after targeted Domain Discovery
- reason: The category page changes from a placeholder into a working management surface with list, create, edit, archive, empty, validation, permission-denied, and responsive states.
- user_facing_surfaces:
  - admin category management page
  - non-admin blocked or redirected category page state
  - sidebar category navigation visibility
  - create/edit/archive controls

## Behavior Spec / BDD / E2E Need

- required: true
- timing: after Experience Prototype
- reason: The behavior changes permissions and persistence-backed category lifecycle.
- scenarios_to_cover:
  - Admin can open `/categories`.
  - Admin can see the category sidebar entry.
  - Finance manager cannot see the category sidebar entry.
  - Finance manager cannot open `/categories`, even with `manage_categories` capability.
  - General member cannot see the category sidebar entry.
  - General member cannot open `/categories`.
  - Admin can create income and expense categories.
  - Admin can rename active categories.
  - Admin can archive categories.
  - Archived categories remain visible where historical records reference them but are not offered for new records.
  - Duplicate active category names are rejected within the same type.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: Implementation needs to decide route guard placement, server actions or API boundaries, Prisma write shape, cache/revalidation behavior, and how to reconcile the existing capability field with the admin-only category policy.

## Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: Auth/permission changes carry release risk and should be reflected in local quality evidence.
- learning_loop_required: false
- learning_reason: No production analytics, experiment, or post-release feedback loop is selected for this local_dev slice.

## Open Questions

- Should non-admin direct visits to `/categories` show an access-denied page inside the dashboard frame, redirect to the dashboard, or return a not-found style route?
- Should archived categories be shown in the admin category list by default, behind a filter, or grouped separately?
- Should category names be unique only among active categories, or unique across active and archived categories for the same type?

## Handoff

- decision: proceed
- next_gate: targeted Domain Discovery backfill
- recommended_next_skill: ddd-event-storming
- stop_condition: Wait for explicit user approval before updating domain artifacts, prototype, spec, technical design, implementation, verification, or release readiness.
