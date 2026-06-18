---
id: vd-home-family-fund-reimbursement-settlement-ui
stage: verification-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-reimbursement-settlement-ui
  - exp-story-mvp-hardening-reimbursement-settlement-ui
  - arch-home-family-fund-reimbursement-settlement-ui
  - ddd-home-family-fund
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_test_design
  - ia_verification
  - architecture_verification
  - test_plan
trace_links:
  stories:
    - .ai/spec/story-mvp-hardening-reimbursement-settlement-ui.md
  experience_design:
    - .ai/prototype/story-mvp-hardening-reimbursement-settlement-ui.md
  architecture_decisions:
    - ADR-1 Keep Settlement Inline on the Dashboard for MVP
    - ADR-2 Persist a Reimbursement Batch Even if Batch History Is Not Yet Shown
    - ADR-3 Server Action Is the Only Browser Mutation Contract
  domain_rules:
    - Only finance managers perform reimbursement.
    - Selected refundable expenses can be marked reimbursed once.
    - Reimbursed expenses are excluded from refundable totals.
reviewed_at: 2026-06-18
---

# Verification Design for Reimbursement Settlement UI

## Delivery Profile
This verification design targets `local_dev` under the MVP profile. It proves the reimbursement settlement browser flow against the real server action and DB-backed dashboard read model. Production audit UI, analytics, and deployment readiness are out of scope.

## Acceptance Criteria
- AC1: A finance manager can see individual refundable member-paid expenses grouped by member on the selected month dashboard.
- AC2: A finance manager can select one or more refundable expenses and see the selected count/total before submission.
- AC3: Settlement requires a confirmation dialog before persistence.
- AC4: Confirming settlement persists selected expenses as reimbursed and creates a reimbursement batch record.
- AC5: Settled expenses no longer appear in refundable reimbursement table/totals for the same month.
- AC6: Attempting to settle an empty selection, a non-refundable expense, or an already reimbursed expense is rejected without mutating additional records.
- AC7: A non-finance member cannot perform settlement through UI or direct server-action submission.
- AC8: Permission/conflict/error feedback is visible with localized inline alert copy.
- AC9: Tests use controlled auth and deterministic DB seed data, not real Google OAuth.

## UX AC Reconciliation

| UX AC Draft | Final AC | Decision | Reason / Risk |
|---|---|---|---|
| AC-UX1 selectable refundable expenses | AC1-AC2 | kept | Selection is central to exact settlement. |
| AC-UX2 selected total/count | AC2 | kept | Prevents accidental wrong total. |
| AC-UX3 confirmation dialog | AC3-AC5 | kept | Settlement is status-changing and should be confirmed. |
| AC-UX4 non-finance denied | AC7-AC8 | kept | Permission is command-level and user-visible. |

## BDD Scenarios
```gherkin
Feature: Reimbursement settlement

  Scenario: Finance manager settles a selected refundable expense
    Given the E2E database is reset and seeded with refundable member-paid expenses
    And Lin is signed in as a finance manager
    When Lin selects one refundable expense and confirms reimbursement
    Then the selected expense is marked reimbursed
    And the monthly reimbursement table no longer counts that expense as refundable
```

```gherkin
Feature: Reimbursement settlement

  Scenario: General member cannot settle reimbursements
    Given the E2E database is reset and seeded with refundable member-paid expenses
    And Mei is signed in as a general member
    When Mei attempts to submit a reimbursement settlement
    Then the action is rejected with permission feedback
    And reimbursement totals remain unchanged
```

```gherkin
Feature: Reimbursement settlement

  Scenario: Stale or invalid reimbursement selection is rejected
    Given an expense is already reimbursed or not refundable
    When a finance manager attempts to settle it
    Then the action is rejected
    And no duplicate reimbursement batch item is created
```

## E2E Test Design

| Scenario | Route | Viewport | Given | When | Then | Required |
|---|---|---|---|---|---|---|
| Finance manager settles one expense | `/?month=2026-06` | Desktop Chromium | DB seed, `user-e2e-linked` | Select one expense under `退款表`, click `執行退款`, confirm | Pending count/total decreases and selected payer amount updates/disappears | Yes |
| General member denied settlement | `/?month=2026-06` | Desktop Chromium | DB seed, `user-e2e-general` | Submit direct settlement action or attempt visible UI if exposed | Alert shows permission denial and totals unchanged | Yes |
| Invalid/stale selected expense rejected | action/integration or DB E2E | Desktop or integration | Finance manager and non-refundable/already reimbursed id | Submit invalid id | Error result and no duplicate batch item/status change | Yes |
| Empty selection guarded | `/?month=2026-06` | Desktop Chromium | Finance manager | No checkbox selected | `執行退款` disabled or inline validation; no mutation | Yes |

## IA / Navigation Verification

- baseline_artifact: not_needed
- navigation_reachability: Existing dashboard remains entry point.
- deep_links: Month query `/?month=2026-06` still selects reimbursement context.
- breadcrumbs_or_local_nav: Not applicable.
- route_titles_or_metadata: No metadata changes.
- mobile_navigation: Existing mobile smoke remains required; implementation should avoid horizontal overflow.
- permission_visibility: Settlement controls visible/enabled for finance manager only; server action rejects non-finance members.
- seo_expectations: Not applicable.
- changed_user_paths: Existing `退款表` becomes an interactive workflow.

## Web Architecture Verification

- architecture_artifact: `.ai/technical-design/home-family-fund-reimbursement-settlement-ui.md`
- route_or_layout_placement: Existing homepage dashboard reimbursement section.
- page_or_feature_module_boundary: App-local settlement UI/action plus reimbursement domain/persistence wrapper.
- shared_component_reuse: Existing Button/Dialog/Alert/form controls.
- design_token_or_styling_boundary: Existing semantic tokens only.
- state_ownership: Client selection/dialog state; server action persisted result state.
- form_validation_ownership: Client empty-selection guard, server/domain revalidation.
- data_fetching_or_api_boundary: Server action + Prisma transaction + dashboard revalidation.
- provider_placement: Existing app shell/toast; local confirmation dialog.
- error_loading_empty_strategy: Inline alert and disabled action states.
- accepted_duplication_or_extraction_trigger: Dashboard-local component accepted for MVP; extract when `/reimbursements` route adds batch history.
- architecture_contract_tests: Unit/domain tests, persistence/action tests, DB-backed E2E.

## E2E Data, Selectors, and Mocks

- test_data:
  - Seeded refundable expenses: `expense-grocery-june` for Mei and `expense-supplies-june` for Kai.
  - Controlled auth finance manager `user-e2e-linked`.
  - Controlled auth general member `user-e2e-general`.
  - Existing fund-paid `expense-internet-june` for non-refundable rejection.
- mock_or_fixture_strategy:
  - Use `home_fund_e2e` reset/seed.
  - Use controlled auth headers only.
  - Do not directly update records in E2E except through setup/seed.
- selectors_or_accessible_names:
  - `退款表`, `執行退款`, `確認退款` or equivalent confirm button
  - checkbox labels including payer/amount/date
  - `role=alert` for errors
- toast_expectations: Optional; updated dashboard table is primary proof.
- responsive_checks: Existing `test:e2e` mobile smoke plus targeted visual/overflow check if implementation introduces dense mobile selection.
- accessibility_checks: Checkboxes labelled, dialog title, alert role.
- tracking_expectations: None.

## Test Plan
| Level | What It Verifies | Candidate Test | Required |
|---|---|---|---|
| Unit | Domain function rules for permission, empty selection, not refundable, already reimbursed | Existing/expanded `reimbursements.test.ts` | Yes |
| Integration | Persistence wrapper creates batch/items and updates statuses transactionally | New app/module test if wrapper is testable without browser | Yes |
| Contract | Server action maps results to redirects/error feedback | DB-backed E2E or action-level test | Yes |
| E2E | Finance manager settlement and non-finance denial through browser/server action | New `e2e-db/reimbursement-settlement.spec.ts` | Yes |
| Manual | Confirm inline selection and copy clarity | Artifact/code review | Yes |
| Quality Gate | Existing checks remain green | `corepack pnpm test`, `type-check`, `lint`, `test:e2e`, `test:e2e:db` | Yes |

## Domain Rules Under Test
| Rule | Source | Verification Method |
|---|---|---|
| Only finance managers perform reimbursement | DDD policy, authorization module | General member denied E2E/direct action |
| Selected refundable expenses can be marked reimbursed once | Reimbursement aggregate policy | Unit/integration and finance-manager E2E |
| Non-refundable/already reimbursed expenses are rejected | Reimbursement domain | Unit/integration stale selection test |
| Reimbursed expenses leave refundable totals | Reporting/reimbursement read model | DB-backed E2E dashboard assertions |

## Visual Model

- type: verification_trace
- title: Reimbursement Settlement Verification Trace
- nodes:
  - id: ac_select
    label: AC1-AC2 select expenses
    kind: acceptance_criterion
  - id: ac_confirm
    label: AC3 confirmation
    kind: acceptance_criterion
  - id: ac_persist
    label: AC4-AC5 persisted settlement
    kind: acceptance_criterion
  - id: ac_reject
    label: AC6 invalid rejection
    kind: acceptance_criterion
  - id: ac_permission
    label: AC7-AC8 permission feedback
    kind: acceptance_criterion
  - id: e2e_settlement
    label: DB-backed settlement E2E
    kind: test_level
  - id: rule_once
    label: Expenses reimbursed once
    kind: domain_rule
- edges:
  - from: ac_select
    to: e2e_settlement
    label: covered by
  - from: ac_confirm
    to: e2e_settlement
    label: covered by
  - from: ac_persist
    to: e2e_settlement
    label: covered by
  - from: ac_reject
    to: rule_once
    label: enforces
  - from: rule_once
    to: e2e_settlement
    label: verified by
  - from: ac_permission
    to: e2e_settlement
    label: covered by

## Implementation Preconditions
- Add server action/persistence wrapper for reimbursement settlement.
- Preserve existing dashboard data source and read model filtering of `refundable`.
- Use a transaction for batch creation, batch items, and ledger status updates.
- Keep batch history UI out of this story unless required to prove settlement.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm implementation can start with failing E2E for settlement.
  - Confirm transaction and duplicate rejection are covered.
- must_check:
  - Finance-manager-only settlement.
  - Selected total/count and confirmation before mutation.
  - Dashboard no longer counts reimbursed expenses as refundable.
- acceptance_signals:
  - Implementation can proceed with `implementation-cycle`.
- unresolved_blockers:
  - None for local_dev.
- next_step:
  - implementation-cycle
