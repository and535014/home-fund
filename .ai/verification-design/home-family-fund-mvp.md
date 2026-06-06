---
id: vd-home-family-fund-mvp
stage: verification-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-authenticated-household-access
  - story-admin-member-management
  - story-category-management
  - story-ledger-entry-creation
  - story-ledger-record-corrections
  - story-recurring-rules-and-confirmation
  - story-monthly-records-and-reports
  - story-reimbursement-table-and-settlement
  - story-responsive-core-web-experience
  - arch-home-family-fund
  - ddd-home-family-fund
  - web-foundation
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - test_plan
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
  architecture_decisions:
    - ADR-1 modular MVP application
    - ADR-2 authoritative authorization boundary
    - ADR-3 ledger source of truth
    - ADR-4 explicit expense payment source
    - ADR-5 one-time reimbursement status transition
    - ADR-6 reminder items not ledger records until confirmed
    - ADR-7 derived read models for reports and reimbursement tables
    - ADR-8 shared responsive UI foundation
    - ADR-9 finance manager delete disabled by default
    - ADR-10 Google sign-in for MVP authentication
    - ADR-11 basic lint and type-check quality gates
    - ADR-12 Next.js/Vercel/Neon/Prisma stack
  domain_rules:
    - Google sign-in is required before app access.
    - Google identity must map to an app member before household data is available.
    - Authorization is enforced for commands, not only UI controls.
    - Fund-paid expenses do not enter reimbursement.
    - Member-paid expenses start refundable/unreimbursed.
    - Reimbursed expenses cannot be reimbursed again.
    - Reminder-based recurring items do not affect totals until confirmed.
    - Reports derive from source records and trace back to record ids.
reviewed_at:
---

# Verification Design for Home Family Fund MVP

## Delivery Profile
This verification design targets `local_dev` for an `mvp` release. The plan requires local lint/type-check, focused unit tests for domain rules, integration tests for module contracts, E2E tests for critical user flows, and manual responsive/accessibility checks. Production-grade checks such as Vercel deployment smoke tests, Neon backup/restore, spend limits, migration rollback, observability, and secret rotation are recorded as later deploy-readiness work, not blockers for initial implementation.

## Acceptance Criteria
- AC1: Unauthenticated users cannot access any functional household route.
- AC2: A Google-authenticated account that is not linked to an app member cannot view household financial data.
- AC3: Every command that changes household data is authorized by the Identity and Access boundary, regardless of whether the UI hides the action.
- AC4: Admins can invite/link members, edit display names, and change member roles/capabilities.
- AC5: Finance managers can create or edit records for other members and perform reimbursements, but cannot delete other members' records in the MVP permission set.
- AC6: General members can browse all records, create income/expense records for themselves, and edit/delete only records they created.
- AC7: Income and expenses require valid categories, and archived categories remain readable on historical records.
- AC8: Expense records require a payment source of fund-paid or member-paid.
- AC9: Fund-paid expenses do not appear in reimbursement tables.
- AC10: Member-paid expenses appear as refundable/unreimbursed until a finance manager marks them reimbursed.
- AC11: Marking selected expenses reimbursed changes those expenses to reimbursed exactly once and removes them from future refundable totals.
- AC12: Attempting to reimburse an already reimbursed expense is rejected.
- AC13: Immediate recurring items create confirmed ledger records for the target month.
- AC14: Reminder-based recurring items create pending reminders that are excluded from confirmed ledger totals.
- AC15: Confirming a pending recurring item creates a confirmed ledger record with trace to the recurring rule/occurrence and prevents duplicate confirmation for the same rule/month.
- AC16: Monthly reports show confirmed income, confirmed expenses, category summaries, pending recurring items, reimbursement status, and trace ids to underlying records.
- AC17: Report and reimbursement summary values are derived from ledger, recurring, category, and reimbursement data, not manually edited report state.
- AC18: Desktop and mobile layouts support login, browse records, create records, monthly report review, reimbursement selection/settlement, and key permission-denied states without horizontal overflow.
- AC19: Form validation, permission errors, loading, empty, error, and success states are visible and accessible through keyboard and screen-reader semantics where applicable.
- AC20: The implementation provides baseline `lint`, `type-check`, unit/integration test, and E2E test commands before a story is considered ready.
- AC21: User-facing UI copy uses Traditional Chinese (`zh-TW`) as the primary language.
- AC22: User-facing screens use the shared dark-first semantic design tokens, with income represented by `--income`, expenses represented by `--expense`, and sufficient contrast for financial status colors.

## BDD Scenarios
```gherkin
Feature: Google sign-in and household authorization

  Scenario: Unlinked Google account cannot access household data
    Given a person signs in with Google
    And the Google account is not linked to a household member
    When the person opens the monthly report
    Then household records are not shown
    And the person sees an account-not-recognized state

  Scenario: General member cannot create a record for another member
    Given Mei is a general member
    And Kai is another household member
    When Mei tries to create an expense paid by Kai
    Then the command is rejected
    And no ledger record is created

  Scenario: Admin can manage a member's permissions
    Given Ana is an admin
    And Bo is a general member
    When Ana grants Bo finance manager capability
    Then Bo can create or edit records for other members
    And Bo still cannot delete other members' records in the MVP permission set
```

```gherkin
Feature: Ledger entries and reimbursement states

  Scenario: Fund-paid expense is excluded from reimbursement
    Given a valid expense category exists
    When a member records an expense with payment source fund-paid
    Then the expense is included in monthly expense totals
    And the expense is not included in the reimbursement table

  Scenario: Member-paid expense becomes refundable
    Given a valid expense category exists
    When a member records an expense with payment source member-paid
    Then the expense is included in monthly expense totals
    And the expense appears in the reimbursement table as refundable

  Scenario: Finance manager reimburses selected expenses once
    Given a member-paid expense is refundable
    And Fin is a finance manager
    When Fin marks the expense reimbursed
    Then the expense status becomes reimbursed
    And the expense is removed from refundable totals
    And a second reimbursement attempt is rejected
```

```gherkin
Feature: Recurring rules and monthly reports

  Scenario: Immediate recurring expense posts to ledger
    Given an immediate recurring internet expense exists for June 2026
    When the June 2026 occurrence is processed
    Then a confirmed expense record is created for June 2026
    And the expense is included in June confirmed expense totals

  Scenario: Reminder-based contribution waits for confirmation
    Given a reminder-based monthly living expense contribution exists for June 2026
    When the June 2026 reminder is created
    Then the reminder is shown as pending
    And it is excluded from confirmed ledger totals
    When an authorized member confirms the reminder
    Then a confirmed ledger record is created
    And the confirmed total includes the record

  Scenario: Monthly report traces totals to records
    Given June 2026 has confirmed income, fund-paid expenses, member-paid expenses, and pending reminders
    When a member views the June 2026 report
    Then the report shows confirmed income and expense totals
    And pending reminders are shown separately
    And each summary can be traced to source record ids
```

```gherkin
Feature: Responsive and accessible core workflows

  Scenario: Finance manager settles reimbursement on mobile
    Given a finance manager is signed in on a mobile viewport
    And the selected month has refundable member-paid expenses
    When the finance manager opens the reimbursement table
    And selects one or more expenses
    Then the selected total remains visible
    And the confirmation action is reachable without horizontal scrolling

  Scenario: Permission denied state is accessible
    Given a general member opens an admin-only members route
    When the route is blocked
    Then focus moves to a clear permission denied message
    And the member can navigate back to an allowed route with the keyboard
```

## Test Plan
| Level | What It Verifies | Candidate Test | Required |
|---|---|---|---|
| Unit | Authorization decisions independent of UI | `authorize` rejects unlinked users, general-member cross-member create, finance-manager delete of others, duplicate reimbursement | Yes |
| Unit | Ledger payment-source rules | fund-paid excludes reimbursement; member-paid starts refundable; status transition rules | Yes |
| Unit | Recurring occurrence rules | reminder excluded from totals; immediate posts; duplicate rule/month prevention | Yes |
| Unit | Report derivation rules | totals derive from records, pending reminders, categories, reimbursement state | Yes |
| Integration | Identity + command handlers | Google-linked app member can perform allowed commands; unlinked account cannot read data | Yes |
| Integration | Ledger + Reimbursement | member-paid expense appears in reimbursement table; reimbursed status removes it from refundable totals | Yes |
| Integration | Recurring + Ledger + Reporting | confirm occurrence creates ledger record and updates report | Yes |
| Integration | Category + Ledger + Reporting | archived category remains visible on historical record/report | Yes |
| Contract | Auth/session boundary | `getCurrentMember` includes Google link status, member id, roles/capabilities, allowed actions | Yes |
| Contract | Command errors | permission denied, validation, stale category/member, already reimbursed, duplicate occurrence return structured errors | Yes |
| Contract | Report/reimbursement read models | report and reimbursement responses include trace ids and status values needed by UI | Yes |
| E2E | Critical happy path | Google sign-in mock -> create categories -> create income/expenses -> view report -> reimburse member-paid expense | Yes |
| E2E | Permission matrix | admin, finance manager, general member action availability and direct command rejection | Yes |
| E2E | Recurring workflow | create immediate rule, create reminder rule, confirm reminder, verify report totals | Yes |
| E2E | Responsive workflows | run core create/report/reimbursement flows at desktop and mobile viewport widths | Yes |
| E2E | Accessibility smoke | keyboard navigation for login, permission denied, forms, reimbursement selection, dialogs | Yes |
| Manual | RWD visual review | Inspect desktop/mobile layouts for dense reports, reimbursement groups, dialogs, text wrapping | Yes for MVP |
| Manual | Google OAuth local setup | Verify provider callback/env configuration with a test Google account or mocked provider | Yes before auth implementation accepted |
| Manual | Production readiness notes | Review Vercel/Neon pooling, migration deploy, backups, spend limits | No for MVP; required before deploy-readiness |
| Quality Gate | Static checks | `lint`, `type-check`, unit/integration tests, E2E tests run locally | Yes |

## Domain Rules Under Test
| Rule | Source | Verification Method |
|---|---|---|
| Google sign-in is required before functional access | ADR-10, story-authenticated-household-access | Auth integration, E2E |
| Google identity must map to app member | ADR-10, architecture Identity boundary | Auth integration, E2E |
| Authorization is command-level | ADR-2 | Unit, integration, E2E direct-action checks |
| General members act only on self-owned records | DDD policies, ledger correction story | Unit, integration, E2E |
| Admins can manage all records and member permissions | DDD policies, member management story | Integration, E2E |
| Finance managers cannot delete others' records in MVP | ADR-9 | Unit, integration, E2E |
| Fund-paid expense excludes reimbursement | ADR-4 | Unit, integration, E2E |
| Member-paid expense starts refundable | ADR-4, ADR-5 | Unit, integration, E2E |
| Reimbursement is one-time | ADR-5 | Unit, integration, E2E conflict case |
| Reminder-based recurring item excluded until confirmed | ADR-6 | Unit, integration, E2E |
| Monthly reports are derived and traceable | ADR-3, ADR-7 | Unit, integration, contract, E2E |
| Responsive workflows avoid horizontal overflow | Web foundation, RWD story | E2E viewport checks, manual visual review |
| Baseline lint/type-check required | ADR-11 | Quality gate command execution |
| Traditional Chinese is primary UI language | Idea brief, web foundation | UI copy review, E2E/manual visual checks |
| Dark-first semantic theme is supported | Idea brief, web foundation | UI token review, E2E/manual contrast checks |

## Visual Model

- type: verification_trace
- title: Home Family Fund MVP Verification Trace
- nodes:
  - id: ac_auth
    label: AC1-AC3 Auth and authorization
    kind: acceptance_criterion
  - id: ac_roles
    label: AC4-AC6 Role permissions
    kind: acceptance_criterion
  - id: ac_ledger
    label: AC7-AC12 Ledger and reimbursement
    kind: acceptance_criterion
  - id: ac_recurring
    label: AC13-AC15 Recurring rules
    kind: acceptance_criterion
  - id: ac_reporting
    label: AC16-AC17 Reports
    kind: acceptance_criterion
  - id: ac_rwd
    label: AC18-AC19 RWD and accessibility
    kind: acceptance_criterion
  - id: ac_quality
    label: AC20 Quality gates
    kind: acceptance_criterion
  - id: bdd_auth
    label: Google sign-in and permissions scenarios
    kind: bdd_scenario
  - id: bdd_money
    label: Ledger and reimbursement scenarios
    kind: bdd_scenario
  - id: bdd_recurring
    label: Recurring and report scenarios
    kind: bdd_scenario
  - id: unit_tests
    label: Unit tests
    kind: test_level
  - id: integration_tests
    label: Integration tests
    kind: test_level
  - id: e2e_tests
    label: E2E tests
    kind: test_level
  - id: manual_checks
    label: Manual RWD/OAuth checks
    kind: test_level
  - id: quality_gate
    label: Lint and type-check
    kind: test_level
- edges:
  - from: ac_auth
    to: bdd_auth
    label: proven by
  - from: ac_roles
    to: bdd_auth
    label: proven by
  - from: ac_ledger
    to: bdd_money
    label: proven by
  - from: ac_recurring
    to: bdd_recurring
    label: proven by
  - from: ac_reporting
    to: bdd_recurring
    label: proven by
  - from: ac_rwd
    to: e2e_tests
    label: viewport checks
  - from: ac_quality
    to: quality_gate
    label: command gate
  - from: bdd_auth
    to: unit_tests
    label: authorization rules
  - from: bdd_money
    to: integration_tests
    label: module collaboration
  - from: bdd_recurring
    to: integration_tests
    label: module collaboration
  - from: e2e_tests
    to: manual_checks
    label: visual/accessibility review

## Implementation Preconditions
- Accepted stack is Next.js App Router, TypeScript, Vercel, Neon Postgres, Prisma, Google OAuth, Tailwind CSS, shadcn/ui, Vitest, and Playwright.
- Primary UI language is Traditional Chinese (`zh-TW`); currency remains unresolved.
- Dark-first semantic tokens are required; income uses `--income`, expense uses `--expense`, and an explicit light theme switcher can be designed later.
- Project scaffolding must define baseline commands for lint, type-check, tests, and E2E before feature implementation is considered complete.
- Google OAuth local development approach must be decided or mocked for tests.
- Member-to-Google-account linking flow must be selected before implementing authentication.
- Category and recurring-rule manager roles must be finalized or represented as configurable capabilities before implementation.
- Reimbursement fund-balance accounting effect remains deferred; MVP verification treats reimbursement as status-only.
- Delete semantics remain open; implementation must choose hard delete, archive, or void before ledger deletion tests are finalized.
- Production deployment readiness is deferred but must later cover Vercel/Neon connection pooling, env vars, migrations, backups, restore, spend limits, and rollback.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm acceptance criteria cover all MVP domain rules and UX states.
  - Confirm status-only reimbursement is acceptable for MVP verification.
  - Confirm Google sign-in plus app member authorization is the intended auth model.
  - Confirm quality gates are required from the first implementation slice.
- must_check:
  - Authorization tests include direct command rejection, not only hidden UI actions.
  - Reimbursement tests cover fund-paid, refundable member-paid, reimbursed, and duplicate reimbursement.
  - Recurring tests cover immediate posting, reminder pending state, confirmation, and duplicate prevention.
  - Reports trace summary values to source record ids.
  - RWD checks cover desktop and mobile for create, report, and reimbursement flows.
- acceptance_signals:
  - Implementation can start with TDD against the listed AC and BDD scenarios.
  - Test levels identify where each architecture decision is verified.
  - Known product/deployment risks are explicit preconditions or deferred production checks.
- unresolved_blockers:
  - None for moving to Implementation Cycle, provided the implementation slice chooses local auth mocking/member linking and deletion semantics before coding those behaviors.
- next_step:
  - implementation-cycle
