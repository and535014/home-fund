---
id: arch-home-family-fund-reimbursement-settlement-ui
stage: architecture
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-reimbursement-settlement-ui
  - exp-story-mvp-hardening-reimbursement-settlement-ui
  - ddd-home-family-fund
  - ia-home-family-fund-mvp-hardening
outputs:
  - architecture_decisions
  - web_architecture
  - boundaries
  - routing_and_layout_decisions
  - data_ownership
  - integration_contracts
trace_links:
  stories:
    - .ai/spec/story-mvp-hardening-reimbursement-settlement-ui.md
  experience_design:
    - .ai/prototype/story-mvp-hardening-reimbursement-settlement-ui.md
  information_architecture: []
  web_foundation:
    - .ai/prototype/web-foundation.md
  bounded_contexts:
    - Reimbursement
    - Fund Ledger
    - Identity and Access
    - Reporting
  domain_events:
    - Reimbursement expenses selected
    - Expenses reimbursed
    - Monthly reimbursement table generated
reviewed_at: 2026-06-18
---

# Reimbursement Settlement UI Architecture

## Delivery Profile
This architecture targets `local_dev` under the MVP profile. It adds the missing browser mutation path for reimbursement settlement without introducing a dedicated reimbursement route or production audit UI.

MVP-accepted risks: reimbursement batch history is persisted but not yet browsable; inline dashboard selection is acceptable until a dedicated reimbursement page is justified; analytics and production audit logging are deferred.

## Context and Forces
- `markExpensesReimbursed` already enforces finance-manager permission and rejects empty, missing, non-refundable, or already reimbursed selections.
- Prisma schema already has `ReimbursementBatch` and `ReimbursementBatchItem`.
- Dashboard currently renders reimbursement groups but only exposes a placeholder `執行退款` button.
- DB-backed E2E, controlled auth, create-record flow, and permission-matrix checks are already in place.
- Settlement must update ledger reimbursement status and reimbursement batch data consistently.

## Boundaries
| Boundary | Owns | Collaborates With | Reason |
|---|---|---|---|
| Reimbursement Domain | Validates selected refundable expenses and permission | Identity and Access, Fund Ledger records | Owns one-time settlement policy. |
| Persistence Wrapper | Loads selected records, runs domain function, writes batch/items/status updates | Prisma, server action | Keeps DB mutation atomic and testable. |
| Server Action Boundary | Parses selection, resolves current member, maps result to redirect feedback | Dashboard UI, current-member data source | Browser mutation contract. |
| Dashboard Reimbursement UI | Selection, selected total, confirmation dialog, visible feedback | Server action, dashboard read model | Existing user surface for MVP settlement. |
| Reporting Read Model | Removes reimbursed items from refundable table/totals | Dashboard data source | Verifies outcome after settlement. |

## Routing, Layout, and Metadata

- route_ownership: Existing homepage `/` owns monthly dashboard and reimbursement section.
- layout_boundaries: Existing `HomeDashboardLayout`; reimbursement selection can be a client component inside the dashboard content.
- navigation_config_owner: No navigation change.
- breadcrumb_or_title_source: Existing dashboard title and `退款表` section heading.
- route_metadata_source: No metadata change.
- permission_visibility_enforcement: UI hides/disables settlement action for non-finance users; server action remains authoritative.
- seo_metadata_generation: Not applicable.
- content_or_cms_contract: Not applicable.

## Web Architecture

- routing_structure: Stay on `/?month=YYYY-MM`; use query result feedback such as `reimbursement=<result>` if needed.
- layout_boundaries: Dashboard section remains embedded in homepage.
- page_module_structure: `src/app/page.tsx` passes reimbursement table and access hints to a settlement UI component.
- feature_module_structure: Add app-local reimbursement action/persistence wrapper near existing server actions or in a dedicated app module; keep domain policy in `src/modules/reimbursement`.
- shared_component_boundaries: Use existing `Dialog`, `Button`, `Alert`, and form controls.
- component_extraction_rules: Extract a reusable selectable expense list only if a dedicated reimbursement route later repeats it.
- design_token_source: Existing semantic tokens and UI components.
- styling_boundary: No raw color/spacing outside existing class patterns.
- state_ownership: Client component owns checkbox selection and confirm dialog state; server action owns persisted result state.
- form_validation_ownership: Client disables empty selection; server action/domain function validates again.
- data_fetching_boundary: Homepage server component reloads dashboard read model after action redirect/revalidation.
- api_or_server_action_contracts: New `markExpensesReimbursedAction(FormData)` posts selected expense IDs and month.
- client_server_boundary: Browser form submits to server action; server action resolves current member and calls persistence wrapper.
- route_metadata_source: Unchanged.
- breadcrumb_title_source: Existing dashboard/section headings.
- toast_modal_provider_location: Existing app shell; confirmation dialog local to settlement UI.
- analytics_provider_location: None.
- error_boundary_strategy: Redirect error reason back to same month with inline alert in reimbursement section.
- loading_empty_error_state_strategy: Disable action for no selection; show empty state if no refundable groups; inline error for permission/conflict.
- permission_visibility_strategy: Use access hints for UI visibility, but domain authorization remains final.
- accessibility_ownership: Checkbox labels, selected total text, and confirmation dialog semantics belong to settlement UI.
- testability_hooks: Accessible section heading `退款表`, checkbox labels, `執行退款`, confirmation dialog, unique seeded amounts/names.
- mvp_duplication_accepted: Dashboard-local component and reason mapping.
- extraction_trigger: A `/reimbursements` route or batch history view should trigger extraction.

## Web Architecture Decision Matrix

| Concern | Decision | Owner / Location | Source Artifact | Verification Implication |
|---|---|---|---|---|
| Route / page | Keep settlement inline on homepage dashboard | `src/app/page.tsx` | Experience design | E2E uses `/?month=2026-06` |
| Layout / shell | Reuse dashboard shell and `退款表` section | `HomeDashboardLayout` | Web foundation | No new navigation checks |
| Feature module | Add server action plus persistence wrapper; keep domain function unchanged | app action + `modules/reimbursement` | DDD policy | Unit/integration/E2E can target layers |
| Shared component | Reuse Button/Dialog/Alert/checkbox patterns | existing UI components | Web foundation | Accessibility selectors required |
| State / data fetching | Client selection; server redirect/reload | settlement UI + action | Experience design | Assert updated dashboard read model |
| Forms / validation | Client empty-selection guard and server/domain validation | settlement UI + `markExpensesReimbursed` | Domain rules | Test empty/permission/conflict |
| Providers / cross-cutting | Controlled auth only; no analytics | auth boundary | Project context | Use `user-e2e-linked` and `user-e2e-general` |
| Errors / async states | Inline section alert via redirect reason | dashboard page | UX AC | Assert localized alert |

## Data Ownership
| Data / Model | Owner | Readers | Consistency Need |
|---|---|---|---|
| `LedgerRecord.reimbursementStatus` | Fund Ledger/Reimbursement | Reporting, reimbursement table | Selected refundable expenses become `reimbursed` exactly once. |
| `ReimbursementBatch` | Reimbursement | Future audit/batch history | Create one batch per confirmed settlement. |
| `ReimbursementBatchItem` | Reimbursement | Future audit/batch history | Each ledger record can appear once. |
| Monthly reimbursement table | Reporting/Reimbursement read model | Dashboard UI | Reimbursed records disappear from refundable groups/totals. |
| Current member permission | Identity and Access | Server action/UI hints | Only finance managers can settle. |

## Integration Contracts
| Producer | Consumer | Contract | Failure / Retry Notes |
|---|---|---|---|
| Settlement UI | Server action | Posts `month` and `selectedExpenseIds[]`. | Empty selection prevented client-side and rejected server-side. |
| Server action | Current member boundary | Resolves actor from headers. | Unauthenticated/unlinked maps to permission denial. |
| Persistence wrapper | Prisma | Transaction loads selected ledger records, calls domain function, creates batch/items, updates statuses. | Must reject stale already reimbursed/non-refundable selections. |
| Server action | Dashboard | Revalidates `/` and redirects to selected month with result. | E2E asserts dashboard state after redirect. |
| Dashboard read model | UI | Excludes `reimbursed` expenses from refundable table. | Existing read model already filters refundable. |

## ADRs
### ADR-1: Keep Settlement Inline on the Dashboard for MVP
- Status: accepted
- Decision: Implement selection and confirmation inside the existing dashboard reimbursement section.
- Rationale: The dashboard already shows grouped refundable expenses, and MVP needs a completed workflow more than a new route.
- Consequences: A future dedicated reimbursement route can extract the component and add batch history.

### ADR-2: Persist a Reimbursement Batch Even if Batch History Is Not Yet Shown
- Status: accepted
- Decision: Successful settlement creates `ReimbursementBatch` and `ReimbursementBatchItem` rows while updating ledger statuses.
- Rationale: Schema already models batch traceability, and the domain event is a settlement action, not only a status flag.
- Consequences: Implementation needs a transaction and generated batch ID.

### ADR-3: Server Action Is the Only Browser Mutation Contract
- Status: accepted
- Decision: Use a Next server action rather than a new API route.
- Rationale: Existing create-record flows use server actions and DB-backed E2E can exercise them directly.
- Consequences: Error/success state uses redirect/revalidation patterns consistent with the dashboard.

## Visual Model

- type: architecture_map
- title: Reimbursement Settlement Architecture
- nodes:
  - id: dashboard_ui
    label: Dashboard reimbursement settlement UI
    kind: frontend
  - id: server_action
    label: markExpensesReimbursedAction
    kind: backend
  - id: current_member
    label: Current-member resolution
    kind: module
  - id: reimbursement_domain
    label: markExpensesReimbursed domain rule
    kind: bounded_context
  - id: persistence
    label: Reimbursement persistence wrapper
    kind: backend
  - id: prisma
    label: Prisma LedgerRecord and ReimbursementBatch
    kind: data_store
  - id: reporting
    label: Dashboard reimbursement read model
    kind: bounded_context
- edges:
  - from: dashboard_ui
    to: server_action
    label: posts selected ids
  - from: server_action
    to: current_member
    label: resolves actor
  - from: server_action
    to: persistence
    label: requests settlement
  - from: persistence
    to: reimbursement_domain
    label: validates selected expenses
  - from: persistence
    to: prisma
    label: transaction writes batch/status
  - from: prisma
    to: reporting
    label: refreshes read model
  - from: reporting
    to: dashboard_ui
    label: renders updated table

## Open Risks
- Batch history is not user-visible in MVP.
- Inline dashboard selection can become dense on mobile.
- Server action must be careful to reject stale direct submissions.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm inline settlement and batch persistence decisions.
  - Confirm server action transaction boundary is explicit enough for implementation.
- must_check:
  - Finance-manager only.
  - Reimbursed/non-refundable duplicate rejection.
  - Updated dashboard read model proves success.
- acceptance_signals:
  - Verification design can define failing DB-backed E2E and unit/integration checks.
- unresolved_blockers:
  - None for local_dev.
- next_step:
  - verification-design
