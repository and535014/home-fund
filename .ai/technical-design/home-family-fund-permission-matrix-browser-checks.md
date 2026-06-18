---
id: arch-home-family-fund-permission-matrix-browser-checks
stage: architecture
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-permission-matrix-browser-checks
  - exp-story-mvp-hardening-permission-matrix-browser-checks
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
    - .ai/spec/story-mvp-hardening-permission-matrix-browser-checks.md
  experience_design:
    - .ai/prototype/story-mvp-hardening-permission-matrix-browser-checks.md
  information_architecture: []
  web_foundation:
    - .ai/prototype/web-foundation.md
  bounded_contexts:
    - Identity and Access
    - Fund Ledger
    - Responsive Web Experience
  domain_events:
    - Income recorded
    - Expense recorded
    - Member permissions changed
reviewed_at: 2026-06-16
---

# Permission Matrix Browser Checks Architecture

## Delivery Profile
This architecture targets `local_dev` under the MVP profile. It proves command-level create-record authorization through deterministic DB-backed browser tests. Production OAuth, audit logging, and reimbursement action authorization are deferred.

MVP-accepted risks: direct browser form submission may be used to exercise hidden member controls; generic permission copy is acceptable; reimbursement permission checks wait for a reimbursement mutation surface.

## Context and Forces
- Unit tests already prove `authorize` and `createLedgerRecord` rules, but browser integration needs to show server actions cannot be bypassed.
- DB-backed dashboard and controlled-auth E2E are already in place.
- Browser create-record flow already proves happy paths for finance-manager creation.
- Seed data currently includes finance manager `member-fin` and general members `member-mei` / `member-kai`, but only the finance manager has an active controlled auth user.
- The create UI may hide other members for general members; E2E can submit controlled form data to prove server-side enforcement without expanding UI controls.

## Boundaries
| Boundary | Owns | Collaborates With | Reason |
|---|---|---|---|
| Identity and Access | Member role/capability resolution and authorization decisions | Controlled auth fixture, Fund Ledger command | Permission rules are domain policy, not UI-only behavior. |
| Fund Ledger Command | Create income/expense validation, authorization invocation, persistence data | Categories, Identity and Access, Prisma | Owns whether a ledger record can be created. |
| Server Action Boundary | Form parsing, current-member resolution, redirect/error mapping | Dashboard UI, Fund Ledger command | Browser mutation contract under test. |
| DB-backed E2E Harness | Seeded role fixtures and browser assertions | Prisma seed, Playwright | Provides deterministic allowed/denied scenarios. |
| Create Dialog UI | Visible permission feedback after redirect | Server action, dashboard layout | User-facing recovery surface. |

## Routing, Layout, and Metadata

- route_ownership: Existing homepage `/` owns dashboard and `create` query dialog state.
- layout_boundaries: Existing `HomeDashboardLayout` and `CreateRecordDialog`.
- navigation_config_owner: No navigation changes.
- breadcrumb_or_title_source: Existing dialog titles.
- route_metadata_source: No metadata changes.
- permission_visibility_enforcement: UI may hide cross-member controls, but server action and domain command are authoritative.
- seo_metadata_generation: Not applicable.
- content_or_cms_contract: Not applicable.

## Web Architecture

- routing_structure: Continue using `/?month=2026-06&create=income|expense`.
- layout_boundaries: No layout or shell change.
- page_module_structure: `src/app/page.tsx` composes access hints, dashboard data, and create dialog.
- feature_module_structure: `src/app/record-entry-panel.tsx`, `src/app/ledger-record-form.ts`, `src/app/ledger-record-actions.ts`, `src/modules/fund-ledger/ledger-records.ts`, and `src/modules/identity-access/authorization.ts`.
- shared_component_boundaries: No new shared component required.
- component_extraction_rules: Extract permission feedback mapping only when more mutation actions reuse it.
- design_token_source: Existing semantic tokens and Alert styling.
- styling_boundary: No new styling expected.
- state_ownership: Client form state remains local; server redirect owns permission result state.
- form_validation_ownership: Parser validates shape; Fund Ledger/Identity Access validates authorization.
- data_fetching_boundary: DB-backed homepage reads post-submit state.
- api_or_server_action_contracts: `createLedgerRecordAction(FormData)` remains the only mutation contract for this slice.
- client_server_boundary: Browser submits form data, server action resolves controlled auth and calls domain command.
- route_metadata_source: Unchanged.
- breadcrumb_title_source: Existing dialog title.
- toast_modal_provider_location: Existing toast/dialog providers.
- analytics_provider_location: None.
- error_boundary_strategy: `permission_denied` redirects to same create intent and inline alert.
- loading_empty_error_state_strategy: Existing form disabled/no-category behavior remains; permission denial is an inline error state.
- permission_visibility_strategy: Hide/self-scope member controls for general members when practical; never rely on hiding as authorization.
- accessibility_ownership: Existing dialog heading and `role=alert`.
- testability_hooks: Controlled auth header, deterministic user IDs, unique record names, dashboard row absence/presence.
- mvp_duplication_accepted: Direct form-submission helper in E2E is acceptable to prove server enforcement.
- extraction_trigger: Add test helper only if another server-action permission E2E needs direct form submission.

## Web Architecture Decision Matrix

| Concern | Decision | Owner / Location | Source Artifact | Verification Implication |
|---|---|---|---|---|
| Route / page | Reuse homepage create dialog state | `src/app/page.tsx` | Experience design | E2E deep-links to create dialog |
| Layout / shell | No shell change | `HomeDashboardLayout` | Web foundation | Existing smoke E2E covers dashboard reachability |
| Feature module | Keep permission enforcement in domain command path | `authorization.ts`, `ledger-records.ts`, `ledger-record-actions.ts` | DDD policies | E2E must submit through server action |
| Shared component | No new UI primitive | `RecordEntryPanel`, `Alert` | Experience design | Inline alert remains assertion surface |
| State / data fetching | Redirect/reload from server action | `ledger-record-actions.ts`, dashboard data source | Browser create flow architecture | Assert row absence/presence after redirect |
| Forms / validation | Shape validation before authorization; E2E inputs must be valid | `ledger-record-form.ts`, `ledger-records.ts` | Verification design | Permission tests must not fail on category/amount/date |
| Providers / cross-cutting | Use controlled auth fixture only in non-production | `server-current-member.ts` | Controlled auth story | Add active general-member controlled auth seed |
| Errors / async states | Permission denial maps to existing result copy | `RecordEntryPanel` | Experience design | Assert `role=alert` and no mutation |

## Data Ownership
| Data / Model | Owner | Readers | Consistency Need |
|---|---|---|---|
| Member roles and linked users | Identity and Access / Prisma seed | Current-member data source, E2E | Need a linked active general member user for denied scenarios. |
| LedgerRecord rows | Fund Ledger | Dashboard read model, Reporting, Reimbursement | Denied submissions must not create rows; allowed submissions must create exactly visible records. |
| Active categories and members | Categorization / Identity and Access | Create form and parser | Tests need valid categories and member IDs to isolate permission failures. |
| Permission result | Identity and Access + Fund Ledger | Server action redirect, UI alert | Unauthorized target must map to `permission_denied`. |

## Integration Contracts
| Producer | Consumer | Contract | Failure / Retry Notes |
|---|---|---|---|
| Seed data | Controlled auth data source | `user-e2e-general` links to active general member `member-mei` or equivalent. | Missing user would test auth failure, not permission. |
| Browser form / E2E helper | `createLedgerRecordAction` | Posts valid shape plus cross-member `sourceMemberId` or `payerMemberId`. | Permission scenario must avoid native required validation. |
| Server action | Fund Ledger command | Resolves current member and passes parsed command. | Domain returns `permission_denied` with authorization reason. |
| Server action | Create dialog | Redirects to `/?month=<month>&create=<intent>&result=permission_denied`. | Dialog remains visible with inline alert. |
| Dashboard read model | E2E assertions | Shows allowed created rows; does not show denied unique rows. | Unique names prevent false positives. |

## ADRs
### ADR-1: Scope Permission Matrix to Create-Record Authorization First
- Status: accepted
- Decision: This slice verifies create income/expense allowed and denied paths; reimbursement permission waits for a mutation action/UI.
- Rationale: Create flow now has complete DB-backed browser coverage, while reimbursement settlement is not yet a browser mutation surface.
- Consequences: Story AC will explicitly mark reimbursement permission checks as deferred.

### ADR-2: Use Controlled Auth Seeded Roles, Not Real Google OAuth
- Status: accepted
- Decision: Use `x-e2e-auth-user-id` with Better Auth-compatible seeded users for finance-manager and general-member roles.
- Rationale: The goal is app authorization, not external OAuth provider behavior.
- Consequences: Seed data must add or expose a linked active general-member user.

### ADR-3: Prove Hidden-Control Bypass With Direct Form Submission
- Status: accepted
- Decision: E2E may submit browser-controlled form data with a target member that the UI would hide from a general member.
- Rationale: The story's risk is server-action bypass, so tests must prove the server refuses valid but unauthorized form data.
- Consequences: Tests should still assert visible user feedback and no dashboard mutation after redirect.

## Visual Model

- type: architecture_map
- title: Permission Matrix Browser Check Architecture
- nodes:
  - id: playwright
    label: DB-backed Playwright permission tests
    kind: frontend
  - id: create_dialog
    label: Create dialog and permission alert
    kind: frontend
  - id: server_action
    label: createLedgerRecordAction
    kind: backend
  - id: current_member
    label: Controlled current-member resolution
    kind: module
  - id: authorization
    label: Identity and Access authorize
    kind: bounded_context
  - id: fund_ledger
    label: Fund Ledger create command
    kind: bounded_context
  - id: prisma
    label: Prisma ledger persistence
    kind: data_store
- edges:
  - from: playwright
    to: create_dialog
    label: opens and submits
  - from: create_dialog
    to: server_action
    label: posts FormData
  - from: server_action
    to: current_member
    label: resolves actor
  - from: server_action
    to: fund_ledger
    label: requests create
  - from: fund_ledger
    to: authorization
    label: checks target member
  - from: fund_ledger
    to: prisma
    label: writes only if allowed
  - from: server_action
    to: create_dialog
    label: redirects permission error

## Open Risks
- Reimbursement `perform_reimbursement` browser verification remains blocked by missing mutation surface.
- Direct form submission E2E must be carefully named so it is not mistaken for normal UX behavior.
- Seeded role IDs must stay stable across DB resets.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm direct form submission is acceptable for server-action bypass proof.
  - Confirm reimbursement permission is deferred explicitly.
- must_check:
  - Denied create attempts do not persist ledger rows.
  - Finance manager create-for-other remains allowed.
  - General-member current-member fixture resolves through the same controlled auth data source.
- acceptance_signals:
  - Verification design can define exact AC and E2E test data.
- unresolved_blockers:
  - Reimbursement permission E2E blocked until reimbursement mutation story.
- next_step:
  - verification-design
