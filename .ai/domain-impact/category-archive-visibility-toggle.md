---
id: domain-impact-category-archive-visibility-toggle
stage: domain-impact
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - category-archive-visibility-toggle
  - ddd-home-family-fund
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/category-archive-visibility-toggle.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-26
---

# Domain Impact for Category Archive Visibility Toggle

## Summary

- intent_id: category-archive-visibility-toggle
- maintained_domain_artifacts_updated:
  - .ai/domain/home-family-fund.md
- bounded_contexts_touched:
  - Categorization
  - Identity and Access
  - Fund Ledger
  - Reporting
  - Responsive Web Experience
- impact_type: changed_state

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Category archive visibility, Category unarchive, `取消封存`. | Archived category now has an admin review and restore path, not only a hidden/readable history state. | None. | Admins need a safe recovery path for accidental or outdated archives. |
| events | Category archive visibility changed, Category unarchived. | Category management command rejected now includes unarchive attempts. | None. | Showing archived categories and restoring them are business-relevant facts that drive UI and tests. |
| commands | Show or hide archived categories, Unarchive category. | Category management command set now includes restore behavior. | None. | The page switch is a view command; unarchive is a persisted category lifecycle command. |
| policies | Archived categories are hidden by default; when shown, they appear below active categories; unarchive is admin-only; restored categories append to active order; duplicate active names block restore. | Archived categories can be reviewed in category management without becoming available for new records until restored. | Silent duplicate active category names. | Prevents accidental active-language duplication and keeps new-record category choices predictable. |
| aggregates_or_invariants | CategoryCatalog owns unarchive and restore ordering. | CategoryCatalog invariants now include active-name conflict checks for unarchive. | None. | Restoring a category changes durable state and active category order. |
| bounded_contexts | Responsive Web Experience needs switch-controlled archived review state. | Categorization now exposes archived categories for admin review, while Fund Ledger still consumes active categories only. | None. | UI visibility must not leak into new-record availability. |
| lifecycle_or_states | Archived -> active transition through Category unarchive. | Archived categories can be reviewed by admins but remain excluded from active filters/new-record choices until restored. | None. | The lifecycle is now reversible under explicit admin control. |

## Downstream Impact

- prototype_states_or_flows:
  - Admin opens `/settings/categories`; archived categories are hidden by default.
  - Admin enables `顯示封存分類`; archived rows appear below active rows within `支出分類` and `收入分類`.
  - Archived rows keep color/icon identity, show a clear archived state, and expose `取消封存`.
  - Admin disables the switch; archived rows disappear without changing persisted category state.
  - Admin cancels archive by activating `取消封存`; the category becomes active and enters the active section.
- bdd_scenarios:
  - Default category management hides archived categories.
  - Switch reveals archived categories at the bottom of each category type.
  - Switch hides archived categories again without mutation.
  - Admin unarchives a category and it becomes available for new records after refresh/revalidation.
  - Unarchive appends the restored category to the bottom of active categories for its type.
  - Unarchive with duplicate active name is rejected with actionable Traditional Chinese copy.
  - Non-admin unarchive attempts are rejected server-side.
- technical_design_boundaries:
  - The show/hide switch is client view state unless a later design explicitly persists preference.
  - Category management loader must fetch archived categories for admin review while record creation/report filters continue to use active categories only.
  - `unarchiveCategory` belongs in Categorization domain and command adapter, not UI-only Prisma writes.
  - Server action must require admin authorization and revalidate `/settings/categories` plus record creation/dashboard surfaces that depend on active categories.
  - Restore ordering should compute `max(active.sortOrder) + 10` within household/type.
  - Duplicate-name checks should compare normalized names against active categories in the same household/type.
- tdd_domain_tests:
  - `unarchiveCategory` rejects non-admin actors.
  - `unarchiveCategory` rejects non-archived or missing category IDs.
  - `unarchiveCategory` rejects duplicate active names in the same household/type.
  - `unarchiveCategory` changes archived status to active and appends active sort order.
  - Listing for new-record choices still returns active categories only.
  - Category management read model can include archived categories and sort active before archived.
- release_or_learning_signals:
  - local_dev verification must include category page default hidden state, switch-visible state, restore behavior, and duplicate-name failure.
  - No production learning loop is required for this local_dev slice.

## Open Questions and Risks

- product:
  - Whether `取消封存` should require confirmation or direct row action with toast feedback should be decided in Experience Prototype.
  - Whether the switch sits once at page level or inside each panel should be decided in Experience Prototype. Current domain assumption allows one view state to affect both types.
- domain:
  - Editing archived category name/color/icon remains deferred; this slice should expose only review and unarchive unless later gates accept broader scope.
- data_or_ownership:
  - Restore must not break historical ledger references because the category identity remains the same record.
  - If old data contains conflicting active and archived names, unarchive must fail rather than mutate unrelated categories.
- policy_or_permission:
  - `manage_categories` remains dormant; admin role is required for unarchive.

## Review Gate

- decision: approve
- reviewer_focus:
  - durable domain model updated separately
  - this file contains only intent-specific delta
  - downstream impacts are actionable
- must_check:
  - trace links point to maintained domain artifact
  - no long-lived domain rules exist only in this impact file
  - unarchive remains admin-only and conflict-safe
  - showing archived categories does not make them available for new records
- acceptance_signals:
  - Prototype can design the switch placement, archived row treatment, and unarchive affordance.
  - BDD/E2E can assert default hidden state, bottom sorting, unarchive, and duplicate rejection.
  - Technical Design can define server action, domain command, persistence update, and revalidation.
- unresolved_blockers:
  - None for Experience Prototype.
- next_step:
  - experience-prototype
