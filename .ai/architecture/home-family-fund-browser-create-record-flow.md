---
id: arch-home-family-fund-browser-create-record-flow
stage: architecture
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-browser-create-record-flow
  - exp-story-mvp-hardening-browser-create-record-flow
  - arch-home-family-fund-db-backed-dashboard-e2e
  - arch-home-family-fund-controlled-auth-session-e2e
  - ddd-home-family-fund
  - cu-home-family-fund
outputs:
  - architecture_decisions
  - web_architecture
  - boundaries
  - data_ownership
  - integration_contracts
trace_links:
  stories:
    - .ai/stories/story-mvp-hardening-browser-create-record-flow.md
    - .ai/stories/story-ledger-entry-creation.md
  experience_design:
    - .ai/experience-design/story-mvp-hardening-browser-create-record-flow.md
    - .ai/experience-design/story-ledger-entry-creation.md
  web_foundation:
    - .ai/experience-design/web-foundation.md
  bounded_contexts:
    - Fund Ledger
    - Categorization
    - Reporting
    - Reimbursement
    - Identity and Access
    - Responsive Web Experience
  domain_events:
    - Income recorded
    - Expense recorded
    - Member-paid expense became refundable
    - Monthly report generated
    - Monthly reimbursement table generated
reviewed_at: 2026-06-16
---

# Browser Create-Record Flow Architecture

## Delivery Profile
This architecture targets `local_dev` under the MVP profile. It verifies the existing browser create-record workflow against the real server action and DB-backed dashboard read model. It does not redesign the create UI, add new routes, or introduce production-grade duplicate-submit prevention.

MVP-accepted risks: server-action redirects may clear typed form values on error; success feedback can be proven by visible created rows if toast timing is brittle; general-member permission matrix is a later hardening story.

## Context and Forces
- DB-backed dashboard E2E already proves the dashboard reads persisted members, categories, ledger records, and pending occurrences from `home_fund_e2e`.
- Controlled auth E2E already provides `x-e2e-auth-user-id` for a linked active finance manager without bypassing current-member mapping.
- The existing create form is `RecordEntryPanel` inside the homepage dialog state `/?month=YYYY-MM&create=income|expense`.
- The existing mutation boundary is `createLedgerRecordAction`, which parses `FormData`, resolves current member, calls `createLedgerRecordInDatabase`, revalidates `/`, and redirects.
- The story needs browser/database confidence for income, fund-paid expense, and member-paid expense creation.
- The story should not absorb the later permission-matrix, reimbursement settlement, or recurring confirmation stories.

## Boundaries
| Boundary | Owns | Collaborates With | Reason |
|---|---|---|---|
| Create Record UI Boundary | Existing dialog and `RecordEntryPanel` form fields, visible success/error states | Dashboard layout, server action, shared UI components | Keeps hardening scoped to existing UX, not a redesign. |
| Server Action Boundary | Form parsing, current-member resolution, domain command invocation, redirect/revalidation | Identity and Access, Fund Ledger, Prisma persistence | This is the browser mutation contract under test. |
| Fund Ledger Command Boundary | Domain validation, authorization, derived reimbursement status, Prisma create data | Categorization, Reimbursement, Reporting | Owns whether income/expense records are valid and persisted. |
| Dashboard Read Boundary | Post-create read model and visible monthly report/reimbursement state | Reporting, Reimbursement, Prisma dashboard data source | Verifies the write through user-visible DB-backed output. |
| DB-backed E2E Harness | Reset/seed `home_fund_e2e`, controlled auth, browser assertions | Playwright, Docker Postgres, Prisma CLI | Provides deterministic state and isolates developer data. |

## Routing, Layout, and Metadata

- route_ownership: Existing homepage `/` owns dashboard and create dialog state through `create` query parameter.
- layout_boundaries: Existing `HomeDashboardLayout` owns create action buttons and dialog container; `RecordEntryPanel` owns form body.
- navigation_config_owner: No navigation change.
- breadcrumb_or_title_source: Existing dialog title `新增收入` / `新增支出`; no breadcrumb.
- route_metadata_source: No metadata change.
- permission_visibility_enforcement: Create buttons use existing access hints; server action remains authoritative.
- seo_metadata_generation: Not applicable for local-dev authenticated app.
- content_or_cms_contract: Not applicable.

## Web Architecture

- routing_structure: Continue using `/?month=2026-06&create=income|expense` for modal deep links.
- layout_boundaries: Existing dashboard shell and dialog boundary remain unchanged.
- page_module_structure: `src/app/page.tsx` composes dashboard data, access view, and create dialog.
- feature_module_structure: `src/app/record-entry-panel.tsx`, `src/app/ledger-record-form.ts`, and `src/app/ledger-record-actions.ts` remain the create-record feature slice.
- shared_component_boundaries: Reuse existing UI primitives; no extraction required for this hardening story.
- component_extraction_rules: Extract only if later edit/recurring confirmation stories reuse the same field/error behavior.
- design_token_source: Existing `globals.css` semantic tokens and UI components.
- styling_boundary: No raw styling additions required for this planning slice.
- state_ownership: Client form controls own local select state; server action and redirect own mutation result state.
- form_validation_ownership: HTML required fields and `parseCreateLedgerRecordForm` parse/validate input; domain command validates authorization/category/date.
- data_fetching_boundary: Homepage server component loads dashboard data after redirect/revalidation.
- api_or_server_action_contracts: `createLedgerRecordAction(FormData)` is the only mutation contract; no new API route.
- client_server_boundary: Client form posts to server action; server action writes DB and redirects.
- route_metadata_source: Unchanged.
- breadcrumb_title_source: Dialog title from `page.tsx` based on create mode.
- toast_modal_provider_location: Existing app shell/sonner toast and `CreateRecordToast`.
- analytics_provider_location: None; analytics deferred.
- error_boundary_strategy: Redirect error reasons back into `RecordEntryPanel` inline alert.
- loading_empty_error_state_strategy: Existing disabled submit for no categories; browser submit wait for action; inline errors after redirect.
- permission_visibility_strategy: UI hides create buttons when cannot create own records; server action validates again.
- accessibility_ownership: Existing labels/dialog title/alert roles; E2E should use role/name selectors where possible.
- testability_hooks: Unique record names in DB-backed E2E; controlled auth header; dashboard row and reimbursement selectors.
- mvp_duplication_accepted: Existing form code remains page-local; no new abstraction.
- extraction_trigger: Add shared record form only when edit/recurring confirmation requires same fields.

## Web Architecture Decision Matrix

| Concern | Decision | Owner / Location | Source Artifact | Verification Implication |
|---|---|---|---|---|
| Route / page | Use existing homepage query dialog state | `src/app/page.tsx` | Experience design IA delta | E2E opens `/?month=2026-06&create=...` |
| Layout / shell | Reuse dashboard shell and dialog | `HomeDashboardLayout` | Web foundation | No new layout verification needed |
| Feature module | Keep create feature in app-local modules | `record-entry-panel`, `ledger-record-form`, `ledger-record-actions` | Code understanding | Unit/action/E2E tests target existing modules |
| Shared component | No extraction for MVP hardening | Existing UI primitives | Web foundation | Verification focuses behavior, not component API |
| State / data fetching | Server action redirects, homepage reloads DB-backed data | `ledger-record-actions`, `page.tsx` | Story AC | E2E asserts created row after redirect |
| Forms / validation | Browser required fields + server parser + domain command | `ledger-record-form`, Fund Ledger command | DDD policies | Unit and E2E error scenarios |
| Providers / cross-cutting | Existing toast provider only | `CreateRecordToast` / app shell | Experience design | Toast optional; created row is primary proof |
| Errors / async states | Redirect error reason back to same create intent | `ledger-record-actions`, `RecordEntryPanel` | Experience design | E2E asserts dialog/error stays visible |

## Data Ownership
| Data / Model | Owner | Readers | Consistency Need |
|---|---|---|---|
| New `LedgerRecord` rows | Fund Ledger / Prisma persistence | Dashboard data source, Reporting, Reimbursement | Created income/expense must persist with correct amount/date/category/member/payment source. |
| Derived reimbursement status | Fund Ledger command | Reimbursement table and reporting | `paymentSource=member` becomes `refundable`; `paymentSource=fund` becomes `not_refundable`. |
| Active category/member lists | Categorization / Identity and Access | Create form and command validation | Form choices must match seeded active rows. |
| Dashboard report output | Reporting and Reimbursement read models | Browser E2E | Must reflect post-create DB state after redirect/revalidation. |
| E2E test database | DB-backed E2E Harness | Server action, dashboard data source | Reset/seed before test to avoid duplicate names and flaky totals. |

## Integration Contracts
| Producer | Consumer | Contract | Failure / Retry Notes |
|---|---|---|---|
| Playwright DB-backed create test | Homepage dialog | Opens create dialog with controlled auth and fills visible labels/selects. | If selectors become too brittle, prefer labels/roles over implementation classes. |
| Create form | `createLedgerRecordAction` | Posts `month`, `createIntent`, `recordType`, `name`, `amountTwd`, `occurredOn`, `categoryId`, source/payer/payment fields. | Native validation may block empty required fields before server action. |
| Server action | Fund Ledger command | Resolves current member and passes parsed domain command to `createLedgerRecordInDatabase`. | Permission/domain errors redirect with `result=<reason>`. |
| Fund Ledger command | Prisma | Creates one ledger record with generated id and derived reimbursement status. | Duplicate-submit prevention is out of scope for MVP. |
| Server action | Homepage | Revalidates `/` and redirects to `/?month=<month>&create=success` or same create intent with error. | E2E should assert visible post-redirect state. |

## ADRs
### ADR-1: Verify Create Flow Through Existing Server Action
- Status: accepted
- Decision: Browser create-record E2E uses the current server action rather than adding an API route or test-only DB insert.
- Rationale: The story exists to prove the real browser/database workflow.
- Consequences: Tests must interact with the existing dialog/form and handle redirects.

### ADR-2: Use Controlled Auth Finance Manager for This Story
- Status: accepted
- Decision: This story uses `user-e2e-linked` controlled auth, which maps to finance manager `member-fin`.
- Rationale: It allows creating records for income, fund-paid expenses, and member-paid expenses without mixing in the later permission-matrix story.
- Consequences: General-member self-only/forbidden cases remain for `permission-matrix-browser-checks`.

### ADR-3: Prove Success by Dashboard Output, Not Toast Alone
- Status: accepted
- Decision: E2E assertions must verify created rows and reimbursement/report output; toast is secondary.
- Rationale: The domain value is persisted ledger/report state, and toast timing/history replacement can be brittle.
- Consequences: Test data should use unique record names that can only appear after the create action.

### ADR-4: Keep Existing Error Redirect Contract for MVP
- Status: accepted
- Decision: Validation/permission errors continue redirecting back to the same create dialog with `result=<reason>`.
- Rationale: This is the existing implementation and is adequate for local MVP hardening.
- Consequences: Typed field preservation is accepted risk; future UX refinement can improve form persistence.

## Visual Model

- type: architecture_map
- title: Browser Create-Record Flow Architecture
- nodes:
  - id: playwright
    label: Playwright DB-backed create test
    kind: frontend
  - id: dashboard
    label: Homepage dashboard and create dialog
    kind: frontend
  - id: form
    label: RecordEntryPanel form
    kind: frontend
  - id: action
    label: createLedgerRecordAction
    kind: backend
  - id: current_member
    label: Controlled current-member mapping
    kind: module
  - id: command
    label: Fund Ledger create command
    kind: bounded_context
  - id: prisma
    label: Prisma LedgerRecord persistence
    kind: data_store
  - id: reporting
    label: Reporting and Reimbursement read models
    kind: bounded_context
- edges:
  - from: playwright
    to: dashboard
    label: opens create dialog
  - from: dashboard
    to: form
    label: renders fields
  - from: form
    to: action
    label: posts FormData
  - from: action
    to: current_member
    label: resolves actor
  - from: action
    to: command
    label: executes domain command
  - from: command
    to: prisma
    label: creates ledger record
  - from: prisma
    to: reporting
    label: feeds monthly report
  - from: reporting
    to: dashboard
    label: renders updated output

## Open Risks
- E2E interaction with Radix select controls may require stable helper functions.
- Existing server action redirect errors do not preserve all typed values after failure.
- Duplicate submit prevention is not addressed.
- General-member permission behavior is intentionally deferred.
- If success toast is hard to assert consistently, dashboard row assertions remain the source of truth.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm this story uses existing form/action/read-model contracts rather than adding a parallel API.
  - Confirm finance-manager create coverage is enough before permission-matrix story.
  - Confirm success should be proven by visible dashboard/reimbursement state.
- must_check:
  - Income creation persists and appears in monthly records.
  - Fund-paid expense does not add a refundable reimbursement row.
  - Member-paid expense adds a refundable reimbursement row.
  - Error redirect preserves selected create intent.
- acceptance_signals:
  - Verification design can define BDD scenarios and E2E steps directly from this architecture.
- unresolved_blockers:
  - None for verification design.
- next_step:
  - verification-design
