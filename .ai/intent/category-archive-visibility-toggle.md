---
id: category-archive-visibility-toggle
stage: intent
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-26-category-archive-visibility-toggle
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/domain/home-family-fund.md
  - .ai/archive/archive-category-visual-identity-2026-06-21.md
  - .ai/intent/admin-only-category-management.md
  - .ai/domain-impact/admin-only-category-management.md
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  related_routes:
    - src/app/(app)/settings/categories/page.tsx
  related_components:
    - src/app/(app)/settings/categories/category-management-panel.tsx
  related_domain:
    - src/modules/categorization/category-catalog.ts
    - src/modules/categorization/category-command.ts
  related_actions:
    - src/app/category-actions.ts
  maintained_domain:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-26
---

# Category Archive Visibility Toggle

## Decision Summary

- decision: proceed
- first_next_gate: targeted Domain Discovery
- owning_skill: domain-discovery
- reason: The request adds a category lifecycle transition from archived back to active and changes the admin category management display rules. The existing durable domain model says archived categories remain readable and unavailable for new records, but it does not yet define unarchive policy, ordering after restore, duplicate-name conflict behavior, or the switch-controlled review state.

## User Request

On the category page, add a switch that controls whether archived categories are shown. When shown, archived categories should sort at the bottom, and admins should be able to unarchive them.

## Change Classification

- project_type: feature_change
- secondary_types:
  - existing_page_change
  - form_or_workflow
  - backend_behavior
  - component_change
  - data_behavior
- release_target: local_dev
- delivery_profile: mvp

## Affected Surfaces

| Surface | Impact |
|---|---|
| Routes | `/settings/categories` keeps admin-only access and adds an archived-category visibility mode. |
| Page UI | Category panels need a switch for showing archived categories and a visible state for archived rows. |
| Shared components | Use an existing switch/toggle pattern if available; otherwise add the smallest consistent control. |
| Forms/actions | Admins need a restore/unarchive command from an archived category row. |
| Backend/API | Category mutations need server-side admin authorization for unarchive, not only client visibility. |
| Domain modules | `CategoryCatalog` needs explicit restore/unarchive behavior and conflict handling. |
| Data | Restored categories move from `archived` to `active` and must re-enter active ordering without corrupting historical references. |
| Auth/permissions | Existing admin-only category policy remains; non-admin members must not gain any archived category management capability. |
| Tests | Unit/action/browser tests should cover default hidden state, switch-visible archived rows, bottom ordering, and unarchive behavior. |
| Release readiness | Local dev verification should be refreshed after implementation. |

## Current Context Signals

- Category management currently treats archived categories as hidden from the management page.
- Existing durable domain language defines `Active category` and `Archived category`, and says archived categories remain readable but unavailable for new records.
- Completed category visual identity work preserved a decision that category management shows active `支出分類` and `收入分類` panels, while archived categories are not shown there.
- The `Category` model already has `CategoryStatus.active` and `CategoryStatus.archived`.
- Existing category ordering applies only to active categories; restored category placement needs an explicit decision.

## Problem

Admins can archive categories, but once a category is hidden from category management there is no clear review or recovery path. This increases the cost of accidental archive actions and makes category lifecycle management one-way in the UI, even though the data model can represent both active and archived states.

## Business Outcome

Admins can safely inspect archived categories only when needed, keep normal category management focused on active categories, and recover an archived category without database/manual intervention.

## Success Criteria

1. `/settings/categories` defaults to hiding archived categories.
2. A switch lets admins show or hide archived categories without leaving the page.
3. When archived categories are shown, active categories stay first and archived categories sort at the bottom within their category type.
4. Archived rows are visually distinguishable from active rows without disrupting the existing category visual identity.
5. Admins can unarchive a category from the archived row.
6. Restored categories become available for new records after refresh/revalidation.
7. Unarchive rejects non-admin actors server-side.
8. Unarchive handles duplicate active category-name conflicts explicitly.
9. Traditional Chinese UI copy uses Taiwan terms: `封存`, `取消封存`, and `顯示封存分類`.
10. Existing archive behavior, active ordering, category visual identity, and historical record readability do not regress.

## Scope

- Add switch-controlled archived category visibility on the admin category management page.
- Show archived categories below active categories when enabled.
- Add an unarchive/restore category command and UI action.
- Preserve admin-only route and mutation authorization.
- Preserve existing create, update, archive, reorder, visual identity, and active-category selection behavior.
- Add behavior coverage for default hidden state, display toggle, bottom ordering, and unarchive.

## Non-Goals

- Bulk restore or bulk archive.
- Editing archived category name, color, icon, or order before restore.
- Showing archived categories in new record category pickers.
- Letting non-admin users browse category management.
- Redesigning the category management page beyond the required switch and archived row affordance.
- Production release readiness, monitoring, rollback, or analytics.

## Constraints And Assumptions

- UI copy must remain Traditional Chinese with Taiwan wording.
- The switch should not persist as a user preference unless a later gate decides it is worth the added state.
- Active category order remains the source of truth for new-record choices.
- Unarchive ordering is unresolved: likely append restored categories to the bottom of the active list for that type, but Domain Discovery must confirm.
- Duplicate-name behavior is unresolved: if an archived category name conflicts with an active category in the same type, unarchive should probably fail with actionable copy rather than silently rename.

## Domain Discovery Need

- required: true
- scope: targeted Categorization lifecycle delta
- decisions_to_capture:
  - Whether `取消封存分類` is the approved domain command name.
  - Who may unarchive categories; expected answer is admin-only.
  - Whether restored categories append to active order, recover previous sort order, or require explicit reorder afterward.
  - How duplicate active category names block or transform unarchive.
  - Whether archived categories can be edited while still archived or only after restore.
- reason: Unarchive is a lifecycle/state transition and domain policy, not just presentation.

## Foundation Architecture Need

- required: false
- reason: The existing Next.js App Router, settings route, category domain module, Prisma model, server actions, UI component patterns, Vitest, and Playwright foundation are sufficient.

## Experience Prototype Need

- required: true
- timing: after targeted Domain Discovery
- reason: This is user-facing category management UI. The switch placement, archived row treatment, bottom ordering, and unarchive affordance need review before specs and implementation.
- user_facing_surfaces:
  - `/settings/categories`
  - expense and income category panels
  - archived row state
  - unarchive confirmation or direct action feedback

## Behavior Spec / BDD / E2E Need

- required: true
- timing: after Experience Prototype
- reason: The behavior touches state transitions, ordering, admin authorization, and visible default/expanded states.
- scenarios_to_cover:
  - Admin opens category management and archived categories are hidden by default.
  - Admin turns on `顯示封存分類` and sees archived categories at the bottom of each relevant type.
  - Admin turns the switch off and archived categories are hidden again.
  - Admin unarchives an archived category and it becomes active.
  - Restored category appears in new-record category choices after refresh/revalidation.
  - Unarchive rejects a duplicate active name in the same type.
  - Non-admin unarchive attempts are rejected server-side.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: Implementation must decide server action shape, domain command contract, Prisma write/update behavior, revalidation paths, ordering rules after restore, error mapping, and test boundaries.

## Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: Category lifecycle changes affect admin data management and new-record category availability.
- learning_loop_required: false
- learning_reason: No production analytics, experiment, or post-launch feedback loop is selected for this local_dev slice.

## Open Questions

- Should restored categories append to the bottom of active categories for their type, preserve their previous `sortOrder`, or require the admin to reorder after restoring?
- If an archived category has the same name as an active category in the same type, should unarchive be blocked until the active category is renamed?
- Should unarchive require a confirmation dialog, or is a single row action with toast feedback enough?
- Should archived rows expose edit/archive/reorder controls, or only `取消封存`?
- Should `顯示封存分類` apply to both income and expense panels together or be separate per panel?

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - Confirm the switch should be a single page-level control for both category types.
  - Confirm archived categories should sort below active categories within each panel.
  - Confirm unarchive should be admin-only and should make the category available for new records.
  - Confirm unresolved ordering and duplicate-name decisions should be settled in Domain Discovery.
- must_check:
  - No implementation, prototype, or test decisions are being made prematurely.
  - The next gate captures lifecycle policy before UI hardening.
  - The release target remains `local_dev`.
- acceptance_signals:
  - Intent accurately frames the requested category page behavior.
  - Downstream gates can produce prototype, BDD, technical design, implementation, and verification artifacts.
- unresolved_blockers:
  - None for targeted Domain Discovery.
- next_gate: targeted Domain Discovery
- recommended_next_skill: domain-discovery
- stop_condition: Wait for explicit user approval before updating domain artifacts, prototype, spec, technical design, implementation, verification, or release readiness.
