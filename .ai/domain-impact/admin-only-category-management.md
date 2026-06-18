---
id: domain-impact-admin-only-category-management
stage: domain-impact
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - admin-only-category-management
  - ddd-home-family-fund
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/admin-only-category-management.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-18
---

# Domain Impact for Admin-Only Category Management

## Summary

- intent_id: admin-only-category-management
- maintained_domain_artifacts_updated:
  - .ai/domain/home-family-fund.md
- bounded_contexts_touched:
  - Identity and Access
  - Categorization
  - Fund Ledger
  - Reporting
  - Responsive Web Experience
- impact_type: changed_policy

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Category management, category sidebar entry, active category, archived category. | Category is now admin-managed rather than generally user-managed. | Category manager as active MVP language. | The requested behavior makes category management an admin-only workflow. |
| events | Category management entry revealed, category management entry withheld, category management page opened, category management page access denied, category renamed, category archived, category management command rejected. | Category created now has actor `Admin`; category updated is split into rename/archive for clearer lifecycle behavior. | Generic category-management actor wording. | Sidebar visibility, direct route authorization, and archive lifecycle need explicit business facts. |
| commands | Resolve dashboard navigation, open category management page, rename category, archive category. | Create category requires admin. | Capability-based category management command semantics. | UX and backend behavior need both navigation and server-side permission checks. |
| policies | Admin-only category sidebar, admin-only category page browsing, admin-only create/rename/archive, archived categories readable but unavailable for new records. | `manage_categories` capability is dormant for category management in this MVP slice. | Finance-manager or capability-based category management authorization. | Non-admins must not see sidebar category entry or mutate categories. |
| aggregates_or_invariants | CategoryCatalog owns create/rename/archive and rejection events. | CategoryCatalog invariant now states only admins mutate categories and archived categories remain readable for history. | Open question about who manages categories. | Permission decision is now settled. |
| bounded_contexts | Identity and Access participates in category navigation/page/action authorization; Responsive Web Experience must model hidden sidebar and denied direct route states. | Categorization now depends on Identity and Access for admin-only management. | None. | The change crosses category lifecycle, auth policy, and user-facing navigation. |
| lifecycle_or_states | Active category and archived category states are explicit. | Archived categories are excluded from new-record choices but retained for historical reporting. | None. | Archive must not break existing ledger records or reports. |

## Downstream Impact

- prototype_states_or_flows:
  - Admin sidebar shows `分類`; finance manager and general member sidebars do not.
  - Admin can open `/categories` and see income/expense category lists, create controls, rename controls, archive actions, active state, archived state, empty state, validation state, and mutation feedback.
  - Non-admin direct visits to `/categories` must show the selected denied/redirect/not-found behavior.
- bdd_scenarios:
  - Admin sees sidebar category entry and opens category management.
  - Finance manager does not see sidebar category entry and direct `/categories` access is denied, even with `manage_categories`.
  - General member does not see sidebar category entry and direct `/categories` access is denied.
  - Admin creates income and expense categories.
  - Admin renames an active category.
  - Admin archives a category.
  - Archived categories remain readable in historical records/reports and are absent from new-record category choices.
  - Non-admin create, rename, and archive attempts are rejected server-side.
- technical_design_boundaries:
  - Authorization must require admin for category navigation, route access, and mutations.
  - Route protection cannot depend only on hidden sidebar state.
  - Existing `MemberCapability.manage_categories` may remain in schema for future delegation but must not authorize category management in this slice.
  - Category mutations should use `Category.status` rather than deleting categories.
  - Revalidation/cache behavior must refresh category page, dashboard selectors, reports, and any affected forms.
- tdd_domain_tests:
  - `authorize(..., { type: "manage_categories" })` rejects finance managers and general members without admin role.
  - CategoryCatalog rejects non-admin create, rename, and archive commands.
  - CategoryCatalog preserves archive lifecycle and list-active behavior.
  - Access hints hide category navigation for non-admin members.
- release_or_learning_signals:
  - local_dev verification must include sidebar visibility and direct-route denial evidence.
  - Learning loop is not required for this local_dev slice unless production analytics or delegated category management experiments are selected later.

## Open Questions and Risks

- product:
  - Should non-admin direct visits to `/categories` render an access-denied page inside the dashboard frame, redirect to `/`, or return a not-found style response?
  - Should archived categories be shown by default in the admin category list, grouped separately, or hidden behind a filter?
- domain:
  - Should category name uniqueness compare only active categories, or also archived categories of the same type?
- data_or_ownership:
  - Existing ledger records and reports must continue resolving archived category names.
- policy_or_permission:
  - `manage_categories` remains in the schema/code today; implementation must intentionally leave it dormant for this slice or document a separate cleanup decision.

## Review Gate

- decision: approve
- reviewer_focus:
  - durable domain model updated separately
  - this file contains only intent-specific delta
  - downstream impacts are actionable
- must_check:
  - trace links point to maintained domain artifact
  - no long-lived domain rules exist only in this impact file
  - admin-only sidebar, route, and mutation policies are all represented
- acceptance_signals:
  - prototype/BDD/technical design can consume this delta
  - non-admin sidebar invisibility and direct-route denial are explicit
- unresolved_blockers:
  - None for Experience Prototype.
- next_step:
  - experience-design
