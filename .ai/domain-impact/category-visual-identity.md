---
id: domain-impact-category-visual-identity
stage: domain-impact
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - category-visual-identity
  - ddd-home-family-fund
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/category-visual-identity.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-20
---

# Domain Impact for Category Visual Identity And Ordering

## Summary

- intent_id: category-visual-identity
- maintained_domain_artifacts_updated:
  - .ai/domain/home-family-fund.md
- bounded_contexts_touched:
  - Categorization
  - Fund Ledger
  - Reporting
  - Responsive Web Experience
  - Identity and Access
- impact_type: new_behavior

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Category visual identity, category color, category icon, category sort order. | Category now carries recognition and ordering semantics, not only type/name/status. | None. | Users need category choices and historical records to be visually scannable and ordered by household preference. |
| events | Category visual identity changed, Category order changed. | Category management command rejected now covers visual identity and ordering commands. | None. | New durable category attributes and ordering behavior need explicit business facts. |
| commands | Change category visual identity, Reorder categories. | Create category now assigns default color/icon/order when not chosen. | None. | Category creation/editing and new-record selection must share the same domain rules. |
| policies | Category color comes from an approved palette; category icon comes from an approved Lucide-backed registry; active categories are manually ordered within household/type; new categories append to their type; archived categories retain identity but do not affect new-record ordering. | Admin-only category management now includes visual identity and ordering mutations. | Arbitrary remote image icons and free-form icon names from MVP scope. | Curated values protect visual consistency, accessibility, and implementation safety. |
| aggregates_or_invariants | CategoryCatalog owns visual identity and sort order. | CategoryCatalog invariant now includes required visual defaults, active-category ordering, and archived visual identity retention. | None. | Persisted category metadata must remain consistent across creation, selection, records, and reports. |
| bounded_contexts | Reporting consumes category color/identity for category summaries; Fund Ledger consumes active-category order for new-record choices. | Categorization feeds more than category name/status to downstream read models. | None. | Visual identity and ordering are category-owned but displayed by ledger and reporting surfaces. |
| lifecycle_or_states | Active-category order, defaulted visual identity. | Archived categories keep saved visual identity and are excluded from active ordering. | None. | Historical readability must not break when categories are archived or reordered. |

## Downstream Impact

- prototype_states_or_flows:
  - Admin creates a category with name, type, icon, color, and preview.
  - Admin edits an active category's name, icon, and color.
  - Admin reorders active income categories and active expense categories separately.
  - Category management displays active categories in configured order and archived categories with retained visual identity.
  - New-record category chooser displays icon, color, name, and configured order for the selected record type.
  - Record list/detail category labels display icon, color, and name.
  - Dashboard category summary/chart uses persisted category color where practical.
- bdd_scenarios:
  - Admin creates a category with selected icon and color; it persists after refresh.
  - Admin creates a category without selecting visual options; system defaults are applied.
  - Admin edits an active category visual identity; records and summaries display the updated identity.
  - Admin reorders active categories within one type; new-record choices follow the new order.
  - Reordering income categories does not affect expense category order, and vice versa.
  - Archived categories retain color/icon for historical display and are absent from new-record choices.
  - Invalid color, unsupported icon, cross-type reorder, duplicate/missing reorder IDs, or non-admin mutation is rejected server-side.
- technical_design_boundaries:
  - Category visual identity and sort order belong to the Categorization model, not individual ledger records.
  - Ledger record creation should read active categories ordered by household/type sort order.
  - Reporting should derive category identity from category metadata and provide fallback defaults for legacy/migration gaps.
  - Icon rendering should use a controlled registry, not dynamic arbitrary component names from persisted data.
  - Color validation should use a controlled palette for MVP and preserve accessible contrast in UI components.
  - Reorder should be transactional per household and category type to prevent duplicate or missing active sort positions.
- tdd_domain_tests:
  - Category creation applies default color, icon, and appended sort order when omitted.
  - Category visual identity update rejects unsupported palette/icon values.
  - Reorder rejects non-admin actors, cross-type category IDs, archived category IDs, missing IDs, and duplicate IDs.
  - List-available categories returns only active categories in configured sort order.
  - Archived categories retain saved visual identity for read models.
- release_or_learning_signals:
  - local_dev readiness must include Prisma migration/default data evidence.
  - Seed data must include deterministic color/icon/order values.
  - No production learning loop is required unless visual identity/order becomes an analytics or feedback experiment.

## Open Questions and Risks

- product:
  - Exact curated palette and icon list should be selected during Experience Prototype so users can review density, recognizability, and contrast.
  - Dashboard first-slice scope should verify whether both summary list and chart need visual identity in the prototype.
- domain:
  - Category name uniqueness across archived categories remains unresolved from earlier category management work.
- data_or_ownership:
  - Migration must assign deterministic defaults for existing categories and avoid unstable sort order between local runs.
  - Sort order should be scoped by household and category type; this must be preserved if multi-household support expands.
- policy_or_permission:
  - `manage_categories` remains dormant for this workflow; visual identity and reorder commands stay admin-only for MVP.

## Review Gate

- decision: approve
- reviewer_focus:
  - durable domain model updated separately
  - this file contains only intent-specific delta
  - downstream impacts are actionable
- must_check:
  - trace links point to maintained domain artifact
  - no long-lived domain rules exist only in this impact file
  - active-category order controls new-record category choices
  - visual identity remains category-owned and not copied into ledger records
- acceptance_signals:
  - prototype can design color/icon controls, order controls, category badges, and new-record ordering.
  - BDD/E2E can assert persistence, defaults, server validation, and ordered category choices.
  - technical design can decide schema fields, migrations, controlled registries, and transactional reorder behavior.
- unresolved_blockers:
  - None for Experience Prototype.
- next_step:
  - experience-prototype
