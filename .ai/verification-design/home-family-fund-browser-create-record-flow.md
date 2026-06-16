---
id: vd-home-family-fund-browser-create-record-flow
stage: verification-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-browser-create-record-flow
  - exp-story-mvp-hardening-browser-create-record-flow
  - arch-home-family-fund-browser-create-record-flow
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
    - .ai/stories/story-mvp-hardening-browser-create-record-flow.md
  experience_design:
    - .ai/experience-design/story-mvp-hardening-browser-create-record-flow.md
  architecture_decisions:
    - ADR-1 Verify Create Flow Through Existing Server Action
    - ADR-2 Use Controlled Auth Finance Manager for This Story
    - ADR-3 Prove Success by Dashboard Output, Not Toast Alone
    - ADR-4 Keep Existing Error Redirect Contract for MVP
  domain_rules:
    - Income records increase monthly income.
    - Fund-paid expenses increase monthly expenses but do not enter reimbursement.
    - Member-paid expenses become refundable and appear in reimbursement.
reviewed_at: 2026-06-16
---

# Verification Design for Browser Create-Record Flow

## Delivery Profile
This verification design targets `local_dev` under the MVP profile. It proves existing create-record browser workflows through the real server action and `home_fund_e2e` database. It does not verify general-member permission matrix, production OAuth, duplicate-submit prevention, or reimbursement settlement.

## Acceptance Criteria
- AC1: A linked active controlled-auth finance manager can open the income create dialog for month `2026-06`.
- AC2: Submitting a valid income through the browser persists a new `LedgerRecord` and returns to the selected month dashboard.
- AC3: The dashboard shows the newly created income record from DB-backed data.
- AC4: A linked active controlled-auth finance manager can open the expense create dialog and create a fund-paid expense.
- AC5: The fund-paid expense appears in monthly records/expense output but does not add Lin to the reimbursement table.
- AC6: A linked active controlled-auth finance manager can create a member-paid expense.
- AC7: The member-paid expense appears in monthly records and adds the payer to refundable reimbursement output.
- AC8: Successful creation uses existing success feedback or equivalent visible created-record proof after redirect.
- AC9: A server-side validation or domain error redirects back to the same selected month and create intent with an inline error alert.
- AC10: Browser create-record E2E uses `home_fund_e2e`, controlled auth `x-e2e-auth-user-id`, and the real `createLedgerRecordAction`; it must not insert rows directly or use fixture dashboard data.

## UX AC Reconciliation
| UX AC Draft | Final AC | Decision | Reason / Risk |
|---|---|---|---|
| AC-UX1 income dialog submit | AC1-AC3, AC8 | kept | Proves income through existing UI and DB-backed dashboard. |
| AC-UX2 fund-paid expense behavior | AC4-AC5, AC8 | kept | Confirms fund-paid excluded from reimbursement. |
| AC-UX3 member-paid expense behavior | AC6-AC7, AC8 | kept | Confirms member-paid becomes refundable. |
| AC-UX4 error preserves create intent | AC9 | kept | Existing redirect error contract is part of the user recovery path. |

## BDD Scenarios
```gherkin
Feature: Browser ledger creation

  Scenario: Finance manager creates income
    Given the E2E database is reset and seeded for June 2026
    And Lin is signed in through controlled auth as a finance manager
    When Lin creates an income record through the browser
    Then the June 2026 dashboard shows the new income record
    And the app remains on the June 2026 dashboard
```

```gherkin
Feature: Browser ledger creation

  Scenario: Finance manager creates fund-paid expense
    Given the E2E database is reset and seeded for June 2026
    And Lin is signed in through controlled auth as a finance manager
    When Lin creates a fund-paid expense through the browser
    Then the June 2026 dashboard shows the new expense
    And Lin is not added as a refundable reimbursement payer for that expense
```

```gherkin
Feature: Browser ledger creation

  Scenario: Finance manager creates member-paid expense
    Given the E2E database is reset and seeded for June 2026
    And Lin is signed in through controlled auth as a finance manager
    When Lin creates a member-paid expense through the browser
    Then the June 2026 dashboard shows the new expense
    And the reimbursement table shows Lin has a refundable expense
```

```gherkin
Feature: Browser ledger creation recovery

  Scenario: Invalid create keeps the create dialog visible
    Given Lin is signed in through controlled auth as a finance manager
    When Lin submits a create request that fails server-side validation
    Then the same create dialog remains open
    And an inline error alert explains the failure
```

## E2E Test Design
| Scenario | Route | Viewport | Given | When | Then | Required |
|---|---|---|---|---|---|---|
| Create income | `/?month=2026-06&create=income` | Desktop Chromium | DB seed, `x-e2e-auth-user-id: user-e2e-linked` | Fill unique income name, amount, date, category, source member; submit | Dashboard shows unique income record and remains on `month=2026-06` | Yes |
| Create fund-paid expense | `/?month=2026-06&create=expense` | Desktop Chromium | DB seed, controlled auth | Switch expense type to `基金支出`, fill unique name, amount, date, category; submit | Dashboard shows unique expense; reimbursement section does not show Lin for this fund-paid record | Yes |
| Create member-paid expense | `/?month=2026-06&create=expense` | Desktop Chromium | DB seed, controlled auth | Keep `成員代墊`, fill unique name, amount, date, category, payer Lin; submit | Dashboard shows unique expense; reimbursement section includes Lin/refundable output | Yes |
| Error keeps create intent | `/?month=2026-06&create=income` | Desktop Chromium | DB seed, controlled auth | Trigger server-side invalid amount or missing category without direct DB insert | Dialog title `新增收入` remains visible and alert shows error copy | Yes |

## IA / Navigation Verification

- baseline_artifact: not_needed
- navigation_reachability: Existing dashboard create buttons remain reachable; E2E may deep link directly to create dialog.
- deep_links: `/?month=2026-06&create=income|expense` open the correct dialog.
- breadcrumbs_or_local_nav: Not applicable.
- route_titles_or_metadata: No metadata changes.
- mobile_navigation: No new mobile requirement; existing fixture smoke continues mobile overflow coverage.
- permission_visibility: Create buttons remain role-gated by access hints; server action remains authoritative.
- seo_expectations: Not applicable.
- changed_user_paths: Existing create actions are now verified through DB-backed browser submit.

## Web Architecture Verification

- architecture_artifact: `.ai/architecture/home-family-fund-browser-create-record-flow.md`
- route_or_layout_placement: Existing homepage query dialog and `HomeDashboardLayout`.
- page_or_feature_module_boundary: Existing `RecordEntryPanel`, `ledger-record-form`, and `ledger-record-actions`.
- shared_component_reuse: Existing UI primitives only.
- design_token_or_styling_boundary: No style changes expected.
- state_ownership: Client select state plus server-action redirect state.
- form_validation_ownership: HTML required fields, `parseCreateLedgerRecordForm`, Fund Ledger domain command.
- data_fetching_or_api_boundary: Real server action and DB-backed homepage read after redirect.
- provider_placement: Existing toast provider and dialog.
- error_loading_empty_strategy: Inline alert after redirect; disabled submit when categories missing.
- accepted_duplication_or_extraction_trigger: Existing form remains page-local; extract later for edit/recurring confirmation reuse.
- architecture_contract_tests: Existing/expanded form parser tests; DB-backed E2E through server action.

## E2E Data, Selectors, and Mocks

- test_data:
  - `home_fund_e2e` reset/seed.
  - Controlled auth user `user-e2e-linked`.
  - Unique record names such as `E2E 新增收入`, `E2E 基金支出`, `E2E 成員代墊`.
  - Existing active categories `income-living` or `income-rent`, `expense-grocery`, `expense-internet`.
- mock_or_fixture_strategy:
  - Use real browser form submit and server action.
  - Use controlled auth header.
  - Do not use fixture dashboard header or direct DB insert for created records.
- selectors_or_accessible_names:
  - Dialog headings `新增收入`, `新增支出`
  - Labels `名稱`, `金額`, `日期`, `分類`, `收入來源`, `支出類型`, `代墊成員`
  - Options `生活費`, `日用品`, `基金支出`, `成員代墊`, `Lin`
  - Section heading `退款表`
- toast_expectations: Success toast may be asserted if stable, but created row is required proof.
- responsive_checks: Existing `test:e2e` mobile overflow remains required; create-flow E2E can be desktop only for MVP.
- accessibility_checks: Use role/name/label selectors where possible; error alert must use `role=alert`.
- tracking_expectations: None; analytics provider unknown.

## Test Plan
| Level | What It Verifies | Candidate Test | Required |
|---|---|---|---|
| Unit | Form parser maps income/fund-paid/member-paid and errors correctly | Existing `ledger-record-form.test.ts`, add cases if needed | Yes |
| Integration | Server action redirect contract and domain command path | Add action-level test only if implementation changes action behavior | Conditional |
| Contract | Create flow still uses controlled auth and real server action | DB-backed E2E and artifact review | Yes |
| E2E | Browser creates income, fund-paid expense, member-paid expense, and sees dashboard update | New `e2e-db/create-record.spec.ts` | Yes |
| E2E | Error keeps create intent and inline alert | New or existing DB-backed create-record spec | Yes |
| Manual | Confirm UX copy remains understandable | Artifact/readme review only | Yes |
| Quality Gate | Existing checks remain green | `corepack pnpm test`, `type-check`, `lint`, `test:e2e`, `test:e2e:db` | Yes |

## Domain Rules Under Test
| Rule | Source | Verification Method |
|---|---|---|
| Income records are persisted and included in monthly report | DDD, story AC | Browser create income and dashboard row assertion |
| Fund-paid expenses do not enter reimbursement | DDD policy | Browser create fund-paid expense; reimbursement table excludes Lin for that record |
| Member-paid expenses start refundable | DDD policy | Browser create member-paid expense; reimbursement table includes payer |
| Server action is authorization boundary | Architecture ADR-1/ADR-2 | Controlled auth browser submit through real action |
| Error recovery preserves create intent | Experience design AC-UX4 | Browser error scenario checks dialog remains open |

## Visual Model

- type: verification_trace
- title: Browser Create-Record Flow Verification Trace
- nodes:
  - id: ac_income
    label: AC1-AC3 create income
    kind: acceptance_criterion
  - id: ac_fund_expense
    label: AC4-AC5 fund-paid expense
    kind: acceptance_criterion
  - id: ac_member_expense
    label: AC6-AC7 member-paid expense
    kind: acceptance_criterion
  - id: ac_error
    label: AC9 error keeps intent
    kind: acceptance_criterion
  - id: adr_action
    label: ADR-1 real server action
    kind: architecture_decision
  - id: e2e_create
    label: DB-backed create-record Playwright tests
    kind: test_level
  - id: rule_reimbursement
    label: Fund-paid excluded, member-paid refundable
    kind: domain_rule
- edges:
  - from: adr_action
    to: e2e_create
    label: constrains
  - from: ac_income
    to: e2e_create
    label: covered by
  - from: ac_fund_expense
    to: e2e_create
    label: covered by
  - from: ac_member_expense
    to: e2e_create
    label: covered by
  - from: ac_error
    to: e2e_create
    label: covered by
  - from: rule_reimbursement
    to: ac_fund_expense
    label: requires
  - from: rule_reimbursement
    to: ac_member_expense
    label: requires

## Implementation Preconditions
- Docker Postgres must be running for final DB-backed E2E verification.
- Use existing `test:e2e:db` setup and `home_fund_e2e`.
- Use `x-e2e-auth-user-id: user-e2e-linked`.
- Do not add direct DB insertion for the records under test.
- Keep permission-matrix scenarios out of this story unless needed to unblock create flow.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm AC focus on visible persisted outcomes, not toast alone.
  - Confirm finance-manager coverage is acceptable before permission matrix.
  - Confirm error scenario can be tested without introducing artificial APIs.
- must_check:
  - E2E creates records through the browser and server action.
  - Fund-paid and member-paid reimbursement behavior diverges correctly.
  - Same month and create intent are preserved on redirect paths.
- acceptance_signals:
  - Implementation can start with failing DB-backed Playwright create-record spec.
- unresolved_blockers:
  - None for implementation.
- next_step:
  - implementation-cycle
