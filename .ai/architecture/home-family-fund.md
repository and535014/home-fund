---
id: arch-home-family-fund
stage: architecture
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - idea-home-family-fund
  - ddd-home-family-fund
  - story-authenticated-household-access
  - story-admin-member-management
  - story-category-management
  - story-ledger-entry-creation
  - story-ledger-record-corrections
  - story-recurring-rules-and-confirmation
  - story-monthly-records-and-reports
  - story-reimbursement-table-and-settlement
  - story-responsive-core-web-experience
  - web-foundation
outputs:
  - architecture_decisions
  - boundaries
  - data_ownership
  - integration_contracts
trace_links:
  stories:
    - .ai/stories/story-authenticated-household-access.md
    - .ai/stories/story-admin-member-management.md
    - .ai/stories/story-category-management.md
    - .ai/stories/story-ledger-entry-creation.md
    - .ai/stories/story-ledger-record-corrections.md
    - .ai/stories/story-recurring-rules-and-confirmation.md
    - .ai/stories/story-monthly-records-and-reports.md
    - .ai/stories/story-reimbursement-table-and-settlement.md
    - .ai/stories/story-responsive-core-web-experience.md
  bounded_contexts:
    - Identity and Access
    - Fund Ledger
    - Categorization
    - Recurring Schedule
    - Reimbursement
    - Reporting
    - Responsive Web Experience
  domain_events:
    - Member invited
    - Member account updated
    - Member permissions changed
    - Category created
    - Category updated
    - Income recorded
    - Expense recorded
    - Member-paid expense became refundable
    - Ledger record corrected
    - Ledger record deleted
    - Recurring rule created
    - Recurring rule updated
    - Immediate recurring item posted
    - Recurring reminder created
    - Recurring reminder confirmed
    - Monthly records viewed
    - Monthly report generated
    - Monthly reimbursement table generated
    - Reimbursement expenses selected
    - Expenses reimbursed
reviewed_at:
---

# Home Family Fund Architecture

## Delivery Profile
This architecture targets `local_dev` with an `mvp` delivery profile. Decisions prioritize a coherent single-household web app that can validate the full monthly household fund workflow before production concerns such as external notification delivery, payment execution, bank synchronization, multi-household tenancy, operational observability, backups, and audit-grade history are fully designed.

Stack choices remain open. The architecture describes module boundaries, data ownership, command/query contracts, UI state ownership, and domain invariants without choosing framework, database, API transport, or hosting.

## Context and Forces
- All functional routes require authentication.
- Every authenticated member can browse household records.
- Authorization is command-specific: general members can create records for themselves and edit/delete only records they created; admins can create/edit/delete all records; finance managers can create/edit others' records and perform reimbursements but cannot delete others' records in the MVP permission set.
- Admin-managed permissions should be flexible enough to expand finance-manager capabilities later.
- Expense payment source is a core invariant: fund-paid expenses do not enter reimbursement; member-paid expenses start as refundable/unreimbursed and may be marked reimbursed once.
- Reminder-based recurring items must not affect ledger totals until confirmed.
- Reports and reimbursement tables are read models derived from ledger, category, recurring, reimbursement, and member data.
- Desktop and mobile routes share behavior but use different presentation density.
- The repo is currently artifact-only; no existing code, design system, persistence, auth, routing, or test architecture constrains the plan.

## Boundaries
| Boundary | Owns | Collaborates With | Reason |
|---|---|---|---|
| Web App Shell | Authenticated layout, navigation, route-level loading/error/permission states, toast provider, responsive shell | All feature modules | Keeps app-wide UX patterns consistent across desktop/mobile without owning domain rules. |
| Identity and Access Module | Session identity, members, display names, roles/capabilities, invitation/account-management commands, authorization decisions | All command handlers, Web App Shell | Authorization is cross-cutting but must have one authoritative owner. |
| Member Management UI | Member list, invite/create form, display-name edit, role/capability controls | Identity and Access Module | Keeps admin workflows separate from auth enforcement. |
| Category Catalog Module | Income/expense category lifecycle, active/archive status, category pickers | Fund Ledger, Recurring Schedule, Reporting | Categories are shared reference data and must preserve historical readability. |
| Fund Ledger Module | Income records, expense records, record ownership, payment source, correction/deletion rules, fund-paid/member-paid classification | Identity and Access, Category Catalog, Reimbursement, Reporting, Recurring Schedule | Ledger records are the financial source of truth for confirmed activity. |
| Recurring Schedule Module | Recurring rules, posting mode, monthly occurrences, pending reminders, confirmation into ledger records | Fund Ledger, Category Catalog, Reporting | Recurring rules own schedule and pending/confirmed semantics but do not own final ledger totals. |
| Reimbursement Module | Reimbursement table read model, refundable expense selection, one-time reimbursed status transition | Fund Ledger, Identity and Access, Reporting | Reimbursement owns settlement status and double-reimbursement prevention. |
| Reporting Module | Monthly report read models, category summaries, pending recurring visibility, reimbursement status summaries | Fund Ledger, Category Catalog, Recurring Schedule, Reimbursement | Reporting derives views; it must not become a second source of truth. |
| Shared UI Component Layer | Page header, month selector, record row/table/list, status badge, form field, confirmation dialog, toast patterns | Web App Shell, feature UIs | Supports RWD and consistency while remaining domain-agnostic. |

## Data Ownership
| Data / Model | Owner | Readers | Consistency Need |
|---|---|---|---|
| Current session | Identity and Access | Web App Shell, all command/query flows | Must be current before command execution. |
| Member account | Identity and Access | Ledger, Reimbursement, Reporting, UI | Strong consistency for permissions; display-name changes can be reflected on next read. |
| Role/capability assignment | Identity and Access | Command authorization, navigation, UI actions | Strong consistency; permission changes apply to future commands immediately. |
| Category | Category Catalog | Ledger forms, recurring forms, reports | Active categories required for new records; archived categories remain readable historically. |
| Ledger record | Fund Ledger | Reporting, Reimbursement, record views | Strong consistency for create/edit/delete effects on reports and reimbursement. |
| Record ownership metadata | Fund Ledger | Identity and Access authorization checks, record UI | Strong consistency for edit/delete decisions. |
| Payment source | Fund Ledger | Reimbursement, Reporting, record UI | Strong consistency; drives fund-paid vs member-paid behavior. |
| Reimbursement status | Reimbursement | Reporting, reimbursement table, record UI | Strong consistency; selected refundable expense can transition to reimbursed once. |
| Recurring rule | Recurring Schedule | Pending reminders, generated records, reports | Strong consistency for schedule changes after save; historical generated records remain independent. |
| Recurring occurrence / pending reminder | Recurring Schedule | Reporting, ledger confirmation flow | Idempotent per rule/month; pending items excluded from ledger totals. |
| Monthly report read model | Reporting | Web report pages | Derived; may be rebuilt from source modules on read for MVP. |
| Reimbursement table read model | Reimbursement | Reimbursement UI, monthly report summary | Derived from member-paid expenses and reimbursement status. |
| UI route/filter state | Web App Shell / feature UI | Current page only | Client-owned; server remains source for financial state. |

## Integration Contracts
| Producer | Consumer | Contract | Failure / Retry Notes |
|---|---|---|---|
| Identity and Access | Web App Shell | `getCurrentMember()` returns member id, display name, roles/capabilities, and allowed navigation/action hints. | Expired/invalid session redirects to login; permission errors render access-denied state. |
| Identity and Access | Command handlers | `authorize(member, command, target)` permits or rejects command based on role/capability and target ownership. | Denials are explicit domain errors; UI must not rely only on hidden controls. |
| Member Management UI | Identity and Access | `inviteOrCreateMember`, `updateMemberAccount`, `updateMemberPermissions`. | Validation errors inline; permission changes require confirmation and return updated member permissions. |
| Category UI | Category Catalog | `createCategory`, `updateCategory`, `archiveCategory`, `listCategories(type,status)`. | Duplicate/invalid names return field errors; archived categories remain visible on historical records. |
| Ledger UI | Fund Ledger | `createIncome`, `createExpense`, `updateLedgerRecord`, `deleteLedgerRecord`, `getRecord`. | Permission, validation, stale category/member, and lifecycle conflicts return structured errors. |
| Fund Ledger | Reimbursement | Member-paid expenses emit/are queryable as refundable until reimbursed; fund-paid expenses are excluded. | Payment source changes after reimbursement need explicit conflict behavior during verification design. |
| Recurring UI | Recurring Schedule | `createRecurringRule`, `updateRecurringRule`, `listPendingOccurrences`, `confirmOccurrence`. | Duplicate rule/month occurrence must be rejected idempotently. |
| Recurring Schedule | Fund Ledger | `confirmOccurrence` creates a confirmed income/expense ledger record with trace to recurring rule/occurrence. | If ledger creation fails, occurrence remains pending or failed with retry. |
| Reimbursement UI | Reimbursement | `getReimbursementTable(month)`, `markExpensesReimbursed(expenseIds)`. | Must be atomic for selected ids or return per-id conflict policy; already reimbursed ids cannot be reimbursed twice. |
| Reporting UI | Reporting | `getMonthlyReport(month)` returns totals, records, category summaries, pending reminders, reimbursement summary, and trace ids. | Failed reads show retry; report values are derived and refresh after mutations. |
| Feature UIs | Shared UI Component Layer | Use shared form validation display, status badges, dialogs, list/table rows, toast provider. | Component failures remain client concerns; domain errors must map to accessible messages. |

## Frontend Route and State Boundaries
| Route / Surface | Primary Module | UI State Owned Locally | Server/Domain State Needed |
|---|---|---|---|
| `/login` | Identity and Access | Form inputs, validation display | Session creation result |
| App shell | Web App Shell | Navigation open/closed, selected route | Current member, capabilities |
| Monthly report | Reporting | Selected month, section/filter state | Monthly report read model |
| Records list/detail | Fund Ledger | Filter/sort, expanded rows | Records, permissions, categories, members |
| Create record | Fund Ledger | Form draft, income/expense type | Categories, members, permissions, create command result |
| Edit record | Fund Ledger | Form draft, confirmation modal | Record, lifecycle status, permissions |
| Reimbursement | Reimbursement | Selected expense ids, confirmation modal | Reimbursement table, current role |
| Recurring | Recurring Schedule | Rule form draft, pending list UI state | Rules, pending occurrences, categories, members |
| Categories | Category Catalog | Category form draft, tab selection | Category catalog and permissions |
| Members | Identity and Access | Member form draft, permission-control draft | Members, roles/capabilities |

## ADRs
### ADR-1: Keep Domain Modules Separate Inside One MVP Application
- Status: accepted
- Decision: Build the MVP as a modular application with explicit internal boundaries for Identity and Access, Fund Ledger, Category Catalog, Recurring Schedule, Reimbursement, Reporting, and Web Experience rather than separate deployable services.
- Rationale: The release target is `local_dev`; separate services would add operational cost before the household workflow is validated. Internal boundaries still preserve DDD language and ownership.
- Consequences: Architecture must enforce module contracts in code structure and tests. Future extraction remains possible but is not optimized now.

### ADR-2: Make Identity and Access the Authoritative Authorization Boundary
- Status: accepted
- Decision: All commands must call an authorization boundary owned by Identity and Access; UI role-aware controls are advisory and cannot be the only enforcement.
- Rationale: Permission rules affect every financial operation and include ownership, admin rights, finance-manager settlement rights, and future configurable capabilities.
- Consequences: Verification must include direct command authorization tests, not only UI tests.

### ADR-3: Treat Ledger Records as the Source of Truth for Confirmed Financial Activity
- Status: accepted
- Decision: Fund Ledger owns confirmed income and expense records. Reports and reimbursement tables derive from ledger records and related statuses.
- Rationale: The app needs traceability from monthly summaries and reimbursement totals back to individual records.
- Consequences: Reporting read models should be rebuildable from source records for MVP; do not let reports become writable state.

### ADR-4: Model Expense Payment Source Explicitly
- Status: accepted
- Decision: Expense records must store payment source as fund-paid or member-paid. Fund-paid expenses never enter reimbursement. Member-paid expenses start as refundable/unreimbursed.
- Rationale: Reimbursement behavior depends on payment source and cannot be inferred reliably from notes or category alone.
- Consequences: Entry/edit UI and validation must make payment source explicit; reimbursement tests must cover both paths.

### ADR-5: Reimbursement Is a One-Time Status Transition for MVP
- Status: accepted
- Decision: Marking reimbursement changes selected refundable member-paid expenses to reimbursed. It does not execute payment and does not, for now, create a separate fund-balance transaction unless later product decision requires it.
- Rationale: User explicitly needs a reimbursement table and marking selected expenses as refunded; payment execution and fund-balance accounting effect remain unresolved.
- Consequences: Architecture must prevent double reimbursement. A future decision may add fund-balance transaction effects.

### ADR-6: Recurring Reminder Items Are Not Ledger Records Until Confirmed
- Status: accepted
- Decision: Reminder-based recurring occurrences are owned by Recurring Schedule and excluded from confirmed ledger totals until confirmed into ledger records.
- Rationale: Life expense contributions should only count after money is actually received or paid.
- Consequences: Reporting must display pending reminders separately from confirmed totals; confirmation must be idempotent.

### ADR-7: Use Derived Read Models for Monthly Reports and Reimbursement Tables in MVP
- Status: accepted
- Decision: Monthly report and reimbursement table can be computed on read or through simple derived projections, as long as they trace to source ids and do not own financial truth.
- Rationale: MVP local_dev favors correctness and traceability over complex projection infrastructure.
- Consequences: Performance is an accepted MVP risk; production may require caching/projections later.

### ADR-8: Establish Shared Responsive UI Foundations Before Feature Implementation
- Status: accepted
- Decision: Implement shared app shell, route state patterns, form fields, table/list rows, status badges, dialogs, and toast provider before duplicating feature UI patterns.
- Rationale: All stories are user-facing and RWD is explicit; inconsistent form/list/status behavior would create UX and accessibility risk.
- Consequences: Architecture must include a shared UI/component layer even if visual styling remains lightweight.

### ADR-9: Default Finance Manager Delete Permission to Disabled, Keep Capability Model Extensible
- Status: accepted
- Decision: Finance managers cannot delete other members' records in MVP, but the permission model should represent capabilities so admins can expand finance-manager rights later.
- Rationale: User confirmed current behavior and asked for future flexibility.
- Consequences: Authorization should avoid hard-coding roles as only boolean flags where capability expansion would be painful.

## Visual Model

- type: architecture_map
- title: Home Family Fund Modular Architecture
- nodes:
  - id: frontend_shell
    label: Web App Shell
    kind: frontend
  - id: frontend_shared_ui
    label: Shared UI Components
    kind: frontend
  - id: identity
    label: Identity and Access
    kind: bounded_context
  - id: categories
    label: Category Catalog
    kind: bounded_context
  - id: ledger
    label: Fund Ledger
    kind: bounded_context
  - id: recurring
    label: Recurring Schedule
    kind: bounded_context
  - id: reimbursement
    label: Reimbursement
    kind: bounded_context
  - id: reporting
    label: Reporting
    kind: bounded_context
  - id: datastore
    label: Local app data store
    kind: data_store
  - id: external_none
    label: No external payment/bank systems in MVP
    kind: external_system
- edges:
  - from: frontend_shell
    to: identity
    label: session and permissions
  - from: frontend_shell
    to: frontend_shared_ui
    label: uses common layout and states
  - from: frontend_shared_ui
    to: ledger
    label: record forms and lists
  - from: frontend_shared_ui
    to: reporting
    label: report views
  - from: frontend_shared_ui
    to: reimbursement
    label: reimbursement table
  - from: identity
    to: ledger
    label: authorizes record commands
  - from: identity
    to: reimbursement
    label: authorizes settlement
  - from: categories
    to: ledger
    label: valid categories
  - from: categories
    to: recurring
    label: recurring rule categories
  - from: recurring
    to: ledger
    label: confirmed occurrence creates record
  - from: ledger
    to: reimbursement
    label: member-paid refundable expenses
  - from: ledger
    to: reporting
    label: confirmed records
  - from: recurring
    to: reporting
    label: pending reminders
  - from: reimbursement
    to: reporting
    label: reimbursement status
  - from: identity
    to: datastore
    label: owns members/permissions
  - from: categories
    to: datastore
    label: owns categories
  - from: ledger
    to: datastore
    label: owns ledger records
  - from: recurring
    to: datastore
    label: owns rules and occurrences
  - from: reimbursement
    to: datastore
    label: owns reimbursement status
  - from: external_none
    to: reimbursement
    label: no actual payment execution

## Open Risks
- Currency and locale remain unresolved. Architecture should leave currency formatting/configuration explicit rather than burying it in UI constants.
- Role composition remains unresolved. The capability model should support a member holding multiple roles/capabilities unless product later forbids it.
- Category and recurring-rule manager roles remain unresolved. Authorization should support configuring this without rewriting feature code.
- Reimbursement accounting effect remains unresolved. MVP marks status only; fund-balance transaction behavior may require a later ADR.
- Deletion semantics remain unresolved. MVP can choose hard delete during implementation, but void/archive is safer for financial history and should be revisited before production.
- Invitation mechanism remains unresolved. MVP can support manual account creation locally, with email/link invitations deferred.
- Recurring occurrence generation needs idempotency per rule/month; implementation must not rely on UI preventing duplicates.
- Reporting performance is an accepted MVP risk if computed on read.
- Dense mobile reimbursement/report screens need verification for no horizontal overflow and accessible labels.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate module boundaries and data ownership against household finance language.
  - Confirm ADRs for reimbursement status-only behavior, payment source, recurring confirmation, and finance-manager delete permission.
  - Check that stack decisions remain open while architecture is specific enough for verification design.
- must_check:
  - Authorization is enforced in command contracts.
  - Ledger remains source of truth for confirmed records.
  - Reimbursement prevents double settlement.
  - Reminder-based recurring items are excluded from totals until confirmed.
  - Reporting and reimbursement tables trace summaries to record ids.
  - Shared responsive UI foundations are represented as architectural boundaries.
- acceptance_signals:
  - Verification design can derive unit, integration, and end-to-end test levels from the boundaries and contracts.
  - Implementation planning can choose a stack without changing domain ownership.
  - Open product risks are explicit and not hidden in implementation details.
- unresolved_blockers:
  - None for moving to Verification Design.
- next_step:
  - verification-design
