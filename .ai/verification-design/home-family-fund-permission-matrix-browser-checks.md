---
id: vd-home-family-fund-permission-matrix-browser-checks
stage: verification-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-permission-matrix-browser-checks
  - exp-story-mvp-hardening-permission-matrix-browser-checks
  - arch-home-family-fund-permission-matrix-browser-checks
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
    - .ai/stories/story-mvp-hardening-permission-matrix-browser-checks.md
  experience_design:
    - .ai/experience-design/story-mvp-hardening-permission-matrix-browser-checks.md
  architecture_decisions:
    - ADR-1 Scope Permission Matrix to Create-Record Authorization First
    - ADR-2 Use Controlled Auth Seeded Roles, Not Real Google OAuth
    - ADR-3 Prove Hidden-Control Bypass With Direct Form Submission
  domain_rules:
    - Authorization is command-level.
    - General members act only on self-owned records.
    - Finance managers can create records for others.
reviewed_at: 2026-06-16
---

# Verification Design for Permission Matrix Browser Checks

## Delivery Profile
This verification design targets `local_dev` under the MVP profile. It proves create-record authorization across roles using DB-backed Playwright, controlled auth, real server action redirects, and dashboard row absence/presence. Production OAuth and reimbursement mutation authorization are out of scope.

## Acceptance Criteria
- AC1: A linked active general member can browse the DB-backed household dashboard.
- AC2: A linked active general member cannot create an income record for another member through browser-controlled submission.
- AC3: A denied income create attempt redirects back to the selected month and income create dialog with visible `permission_denied` feedback.
- AC4: A denied income create attempt does not persist the unique ledger record.
- AC5: A linked active general member cannot create a member-paid expense for another member through browser-controlled submission.
- AC6: A denied member-paid expense create attempt redirects back to the selected month and expense create dialog with visible `permission_denied` feedback.
- AC7: A denied member-paid expense create attempt does not persist the unique ledger record or add a reimbursement row for that member.
- AC8: A linked active finance manager can create an income or expense for another active member through the same server action path.
- AC9: Permission tests use controlled auth and deterministic seeded role/member fixtures; they do not depend on real Google OAuth.
- AC10: Reimbursement permission browser checks are explicitly deferred until a reimbursement mutation UI/action exists.

## UX AC Reconciliation

| UX AC Draft | Final AC | Decision | Reason / Risk |
|---|---|---|---|
| AC-UX1 general member browse | AC1 | kept | Browsing remains allowed while mutation is constrained. |
| AC-UX2 general member denied cross-member create | AC2-AC7 | kept | Splits income and expense denial plus no-mutation proof. |
| AC-UX3 finance manager allowed create-for-other | AC8 | kept | Proves positive role path still works. |
| AC-UX4 reimbursement deferred | AC10 | kept | No reimbursement mutation surface exists yet. |

## BDD Scenarios
```gherkin
Feature: Permission matrix browser checks

  Scenario: General member is blocked from creating income for another member
    Given the E2E database is reset and seeded with a linked active general member
    And the general member can browse the June 2026 dashboard
    When the general member submits an income record for another member
    Then the create income dialog shows permission-denied feedback
    And the dashboard does not show the submitted income record
```

```gherkin
Feature: Permission matrix browser checks

  Scenario: General member is blocked from creating member-paid expense for another member
    Given the E2E database is reset and seeded with a linked active general member
    When the general member submits a member-paid expense for another member
    Then the create expense dialog shows permission-denied feedback
    And the dashboard does not show the submitted expense record
    And the reimbursement table does not add a row for that denied expense
```

```gherkin
Feature: Permission matrix browser checks

  Scenario: Finance manager can create for another member
    Given the E2E database is reset and seeded with a linked active finance manager
    When the finance manager submits a valid record for another active member
    Then the dashboard shows the created record for June 2026
```

## E2E Test Design

| Scenario | Route | Viewport | Given | When | Then | Required |
|---|---|---|---|---|---|---|
| General member browses dashboard | `/?month=2026-06` | Desktop Chromium | DB seed, `x-e2e-auth-user-id: user-e2e-general` | Visit dashboard | `家庭資金總覽` and seeded records visible | Yes |
| General member denied income for other | `/?month=2026-06&create=income` | Desktop Chromium | General member controlled auth | Submit valid income with `sourceMemberId=member-kai` | Dialog stays `新增收入`, alert contains permission copy, unique record absent | Yes |
| General member denied member-paid expense for other | `/?month=2026-06&create=expense` | Desktop Chromium | General member controlled auth | Submit valid member-paid expense with `payerMemberId=member-kai` | Dialog stays `新增支出`, alert contains permission copy, unique record absent, reimbursement table unchanged for denied unique expense | Yes |
| Finance manager allowed create-for-other | `/?month=2026-06&create=income` or expense | Desktop Chromium | `user-e2e-linked` finance manager | Submit valid record for `member-kai` or `member-mei` | Dashboard shows unique created record | Yes |

## IA / Navigation Verification

- baseline_artifact: not_needed
- navigation_reachability: No new navigation; existing dashboard create deep links remain reachable.
- deep_links: `/?month=2026-06&create=income|expense` must open the correct dialog.
- breadcrumbs_or_local_nav: Not applicable.
- route_titles_or_metadata: No metadata changes.
- mobile_navigation: Existing `test:e2e` mobile smoke remains required; permission checks can be desktop only for MVP.
- permission_visibility: General-member UI may self-scope controls, but server action rejection is required.
- seo_expectations: Not applicable.
- changed_user_paths: Existing create path gains role-aware negative proof.

## Web Architecture Verification

- architecture_artifact: `.ai/architecture/home-family-fund-permission-matrix-browser-checks.md`
- route_or_layout_placement: Existing homepage and create dialog.
- page_or_feature_module_boundary: Existing `RecordEntryPanel`, `ledger-record-form`, `ledger-record-actions`, `ledger-records`, `authorization`.
- shared_component_reuse: Existing form/dialog/alert components.
- design_token_or_styling_boundary: No new styling required.
- state_ownership: Client form state; server redirect result state.
- form_validation_ownership: E2E must submit valid shape and assert authorization failure, not parser failure.
- data_fetching_or_api_boundary: Real server action and DB-backed dashboard read.
- provider_placement: Existing dialog/toast providers.
- error_loading_empty_strategy: Inline alert after redirect; no mutation on denied action.
- accepted_duplication_or_extraction_trigger: A direct form-submission E2E helper is accepted for MVP and should be extracted only if reused in more permission stories.
- architecture_contract_tests: DB-backed E2E plus existing unit authorization tests.

## E2E Data, Selectors, and Mocks

- test_data:
  - Add or expose controlled auth user `user-e2e-general` linked to active general member `member-mei`.
  - Existing finance-manager user `user-e2e-linked` maps to `member-fin`.
  - Other active target member can be `member-kai`.
  - Use unique names such as `E2E 未授權收入`, `E2E 未授權代墊`, `E2E 權限允許收入`.
- mock_or_fixture_strategy:
  - Use `home_fund_e2e` reset/seed through existing DB E2E setup.
  - Use controlled auth header only.
  - Do not use direct DB insert for created/denied records.
- selectors_or_accessible_names:
  - `家庭資金總覽`, `新增收入`, `新增支出`, `role=alert`
  - Alert copy `目前帳號沒有新增這筆紀錄的權限。`
  - Unique denied/allowed record names
- toast_expectations: Not required; inline alert and dashboard row absence/presence are authoritative.
- responsive_checks: Existing non-DB mobile smoke remains part of quality gate.
- accessibility_checks: Permission alert must use `role=alert`.
- tracking_expectations: None for MVP.

## Test Plan
| Level | What It Verifies | Candidate Test | Required |
|---|---|---|---|
| Unit | Authorization and ledger command rules remain intact | Existing `authorization.test.ts`, `ledger-records` tests; add seed/user tests only if needed | Yes |
| Integration | Controlled auth resolves general member through data source | Extend DB-backed auth/session E2E or add dedicated permission E2E setup assertion | Yes |
| Contract | Server action maps domain permission failure to `result=permission_denied` | DB-backed E2E through real form/server action | Yes |
| E2E | General member denied cross-member income/expense; finance manager allowed | New `e2e-db/permission-matrix.spec.ts` | Yes |
| Manual | Confirm copy and deferred reimbursement scope | Artifact review only | Yes |
| Quality Gate | Existing checks remain green | `corepack pnpm test`, `type-check`, `lint`, `test:e2e`, `test:e2e:db` | Yes |

## Domain Rules Under Test
| Rule | Source | Verification Method |
|---|---|---|
| Authorization is command-level | DDD policy | Direct browser-controlled submission attempts unauthorized target and verifies denial/no mutation |
| General members act only on self-owned records | DDD policy | General-member cross-member income and expense denied |
| Finance managers can create records for others | DDD policy | Finance-manager create-for-other allowed and visible |
| Permission denied is user visible | Experience design | Inline alert after redirect |

## Visual Model

- type: verification_trace
- title: Permission Matrix Verification Trace
- nodes:
  - id: ac_browse
    label: AC1 general member browse
    kind: acceptance_criterion
  - id: ac_denied_income
    label: AC2-AC4 denied income
    kind: acceptance_criterion
  - id: ac_denied_expense
    label: AC5-AC7 denied expense
    kind: acceptance_criterion
  - id: ac_finance_allowed
    label: AC8 finance manager allowed
    kind: acceptance_criterion
  - id: e2e_permission
    label: DB-backed permission matrix E2E
    kind: test_level
  - id: rule_command_auth
    label: Command-level authorization
    kind: domain_rule
- edges:
  - from: rule_command_auth
    to: ac_denied_income
    label: requires
  - from: rule_command_auth
    to: ac_denied_expense
    label: requires
  - from: ac_browse
    to: e2e_permission
    label: covered by
  - from: ac_denied_income
    to: e2e_permission
    label: covered by
  - from: ac_denied_expense
    to: e2e_permission
    label: covered by
  - from: ac_finance_allowed
    to: e2e_permission
    label: covered by

## Implementation Preconditions
- Add deterministic active general-member controlled auth seed data.
- Use existing `home_fund_e2e` DB lifecycle.
- Ensure denied tests submit valid categories, amount, date, and member IDs so failure is authorization-only.
- Keep reimbursement permission checks out of implementation until a reimbursement mutation action exists.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm the test plan isolates authorization failures from validation failures.
  - Confirm reimbursement checks are explicitly deferred.
  - Confirm direct form submission is acceptable for bypass proof.
- must_check:
  - Denied attempts do not mutate DB-visible dashboard state.
  - Permission alert is visible in the same create intent.
  - Finance-manager positive path remains covered.
- acceptance_signals:
  - Implementation can start with failing DB-backed `permission-matrix.spec.ts`.
- unresolved_blockers:
  - Reimbursement permission browser checks blocked by missing reimbursement mutation UI/action.
- next_step:
  - implementation-cycle
