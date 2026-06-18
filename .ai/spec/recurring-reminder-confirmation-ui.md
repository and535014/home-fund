---
id: spec-recurring-reminder-confirmation-ui
stage: spec
status: accepted
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - proto-recurring-reminder-confirmation-ui
  - story-mvp-hardening-recurring-reminder-confirmation-ui
  - ddd-home-family-fund
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_test_design
  - ia_verification
  - architecture_verification
  - test_plan
trace_links:
  prototype:
    - .ai/prototype/recurring-reminder-confirmation-ui.md
  stories:
    - .ai/spec/story-mvp-hardening-recurring-reminder-confirmation-ui.md
    - .ai/spec/story-recurring-rules-and-confirmation.md
  domain_rules:
    - Reminder-mode recurring occurrences do not create ledger records until confirmed.
    - Confirming a pending occurrence creates one ledger record and marks that occurrence posted.
    - Posted occurrences cannot be confirmed again.
    - Confirmation authorization follows the resulting ledger-record creation permission.
reviewed_at: 2026-06-18
---

# Behavior Spec for Recurring Reminder Confirmation UI

## Delivery Profile
This spec targets `local_dev` under the MVP profile. It turns the accepted recurring reminder confirmation prototype into observable behavior for the existing homepage dashboard. Production Google OAuth, recurring-rule management UI, analytics, and notification scheduling are out of scope.

The prototype is treated as accepted for behavior specification. The authorization policy is now explicit: confirmation uses the same permission as creating the resulting ledger record, not the stricter recurring-rule management permission.

## Acceptance Criteria
- AC1: The selected month dashboard shows pending reminder-mode recurring occurrences with enough detail for a user to identify the rule, amount, month, member, and expected posting date.
- AC2: Pending reminder occurrences are clearly marked as not yet counted in the monthly records or summary totals.
- AC3: A user with permission to create the resulting ledger record can start confirmation from the pending reminder item.
- AC4: Confirmation requires a dialog or equivalent explicit confirmation step before persistence.
- AC5: Confirming a pending income reminder creates the matching income ledger record from the recurring rule, marks the occurrence `posted`, and stores the created `ledgerRecordId`.
- AC6: After successful confirmation, the dashboard for the same month no longer shows that occurrence as pending, shows the created ledger record in `本月紀錄`, and includes its amount in the monthly income/expense/net totals.
- AC7: Posted, stale, mismatched, invalid, or duplicate confirmation attempts are rejected without creating an additional ledger record.
- AC8: Users without permission cannot confirm another member's reminder through visible UI or direct action submission; they receive localized inline feedback and totals remain unchanged.
- AC9: E2E coverage uses deterministic DB seed data and controlled auth headers. It must not use real Google OAuth, fixture-only dashboard data, or direct DB insert as proof of confirmation.
- AC10: The confirmation UI remains accessible and responsive: controls have stable accessible names, the confirmation dialog has focus management, errors use `role=alert`, and mobile layout does not overflow.

## Authorization Policy
| Actor | Reminder Target | Expected Result | Reason |
|---|---|---|---|
| Admin | Any member | Allowed | Admin can create income/expense records for any member. |
| Finance manager | Any member | Allowed | Finance manager can create income/expense records for any member. |
| General member | Same member as resulting ledger record owner | Allowed | General member can create their own income/expense records. |
| General member | Another member's resulting ledger record | Denied | General member cannot create records for another member. |
| Unlinked or disabled member | Any target | Denied | Current dashboard auth gate remains authoritative. |

Implementation must re-load the occurrence and rule server-side and re-run ledger-record creation authorization before mutating the database.

## UX AC Reconciliation
| UX AC Draft | Final AC | Decision | Reason / Risk |
|---|---|---|---|
| AC-UX1 pending reminders visible and not counted | AC1-AC2 | kept | Users need to distinguish planned reminders from confirmed ledger facts. |
| AC-UX2 authorized users open confirmation before creation | AC3-AC5 | kept | Confirmation creates money records and should be deliberate. |
| AC-UX3 success removes pending item and updates dashboard | AC6 | kept | Dashboard output is the user-visible proof of persistence. |
| AC-UX4 permission/conflict feedback without duplicates | AC7-AC8 | kept | Server action must handle stale UI and direct submissions. |

## BDD Scenarios
```gherkin
Feature: Recurring reminder confirmation

  Scenario: Finance manager confirms Kai's pending living-fee reminder
    Given the E2E database is reset and seeded for June 2026
    And Lin is signed in through controlled auth as a finance manager
    And the June 2026 dashboard has pending occurrence "occurrence-living-kai"
    When Lin confirms the pending "Kai 每月生活費提醒" reminder
    Then the reminder is no longer shown as pending
    And the June 2026 records include the created income record
    And the monthly income and net totals include the reminder amount
```

```gherkin
Feature: Recurring reminder confirmation

  Scenario: General member cannot confirm another member's reminder
    Given the E2E database is reset and seeded for June 2026
    And Mei is signed in through controlled auth as a general member
    And Kai's living-fee reminder is pending
    When Mei attempts to confirm Kai's reminder through the UI or direct action
    Then the action is rejected with permission feedback
    And Kai's reminder remains pending
    And no new ledger record is created for that occurrence
```

```gherkin
Feature: Recurring reminder confirmation

  Scenario: Already posted reminder cannot be confirmed again
    Given a recurring occurrence has already been marked posted with a ledger record
    When an authorized user submits confirmation for the same occurrence again
    Then the action is rejected as already confirmed
    And no duplicate ledger record is created
```

```gherkin
Feature: Recurring reminder confirmation

  Scenario: Dashboard has no pending reminders after successful confirmation
    Given an authorized user confirmed the only pending reminder for June 2026
    When the user views the June 2026 dashboard again
    Then the pending reminder area shows the empty state
    And the created ledger record remains visible in the monthly records
```

## E2E Test Design
| Scenario | Route | Viewport | Given | When | Then | Required |
|---|---|---|---|---|---|---|
| Finance manager confirms seeded reminder | `/?month=2026-06` | Desktop Chromium | DB seed, `x-e2e-auth-user-id: user-e2e-linked`, `rule-living-kai`, `occurrence-living-kai` | Open pending item, confirm | Pending item disappears; record row for `Kai 每月生活費提醒` or equivalent created income appears; income/net totals increase by `$80,000` | Yes |
| General member denied for Kai reminder | `/?month=2026-06` | Desktop Chromium | DB seed, `x-e2e-auth-user-id: user-e2e-general` maps to Mei | Attempt visible control if present, otherwise submit direct action | Permission feedback is visible or action result is denied; `occurrence-living-kai` remains pending; no ledger record linked | Yes |
| Already posted duplicate rejected | action/integration or DB E2E | Desktop or integration | Occurrence pre-confirmed once by finance manager | Submit confirmation for same occurrence again | `occurrence_already_posted`/already-confirmed feedback; only one ledger record linked | Yes |
| Empty pending state | `/?month=2026-06` after confirmation or a seeded month without pending items | Mobile Chromium | Authenticated user, no pending occurrences for selected month | Load dashboard | Empty state fits mobile width; no confirm controls are shown | Yes |

## IA / Navigation Verification
- baseline_artifact: `.ai/prototype/recurring-reminder-confirmation-ui.md`
- navigation_reachability: Existing homepage dashboard remains the entry point.
- deep_links: Month query `/?month=2026-06` selects the recurring reminder context.
- breadcrumbs_or_local_nav: Not applicable.
- route_titles_or_metadata: No metadata change required.
- mobile_navigation: Existing dashboard mobile path remains; pending reminder item and dialog must avoid horizontal overflow.
- permission_visibility: Confirmation control is visible/enabled only for authorized users, while the server action remains authoritative for all submissions.
- seo_expectations: Not applicable.
- changed_user_paths: Existing `待確認週期項目` becomes an interactive confirmation workflow.

## Web Architecture Verification
- architecture_artifact: required next via `architecture-planner`.
- route_or_layout_placement: Existing homepage dashboard pending-recurring section.
- page_or_feature_module_boundary: Dashboard UI plus a server action/persistence boundary for confirming a recurring occurrence.
- shared_component_reuse: Existing Button, Card, Dialog, Alert, Badge, and Table primitives.
- design_token_or_styling_boundary: Existing semantic tokens and dashboard density.
- state_ownership: Client owns dialog/loading/error state; server owns authorization, persistence, and final dashboard data.
- form_validation_ownership: Client can guard missing action state; server/domain revalidates occurrence, rule, status, and authorization.
- data_fetching_or_api_boundary: DB-backed dashboard read model after redirect/revalidation; no fixture dashboard proof for the DB E2E.
- provider_placement: Existing app shell; no new global provider expected.
- error_loading_empty_strategy: Inline alert for denial/conflict, disabled/loading submit during confirmation, empty state when no pending reminders remain.
- accepted_duplication_or_extraction_trigger: Dashboard-local component is acceptable for MVP; extract when recurring-rule management UI or a dedicated reminders route appears.
- architecture_contract_tests: Domain unit tests, persistence/action tests, and DB-backed Playwright tests.

## E2E Data, Selectors, and Mocks
- test_data:
  - Seeded recurring rule `rule-living-kai`.
  - Seeded pending occurrence `occurrence-living-kai`.
  - Month `2026-06`.
  - Amount `8000000` cents, displayed as `$80,000`.
  - Finance manager controlled auth `user-e2e-linked` mapped to Lin.
  - General member controlled auth `user-e2e-general` mapped to Mei.
- mock_or_fixture_strategy:
  - Use the `home_fund_e2e` database reset/seed.
  - Use controlled auth headers only.
  - Do not use the fixture dashboard header as the required proof path.
  - Do not call real Google OAuth.
- selectors_or_accessible_names:
  - Section heading `待確認週期項目`.
  - Pending item name `Kai 每月生活費提醒`.
  - Confirmation control `確認入帳` or equivalent stable accessible name.
  - Dialog title `確認週期提醒` or equivalent.
  - Confirm button `確認建立紀錄` or equivalent.
  - `role=alert` for permission/conflict errors.
- toast_expectations: Optional; updated dashboard rows and totals are required proof.
- responsive_checks: Desktop confirmation flow plus mobile empty/pending-state smoke.
- accessibility_checks: Dialog title/description, focus trap/return, keyboard submit/cancel, labelled controls, alert role.
- tracking_expectations: None; analytics provider is not part of MVP.

## Test Plan
| Level | What It Verifies | Candidate Test | Required |
|---|---|---|---|
| Unit | Domain confirmation creates one ledger record, rejects posted occurrence, and delegates authorization to ledger creation | Expand `src/modules/recurring-schedule/recurring-rules.test.ts` for other-member denial and note/name preservation | Yes |
| Integration | Persistence wrapper loads occurrence/rule, confirms in a transaction, updates `RecurringOccurrence.ledgerRecordId`, and rejects stale duplicates | New app/module test around the persistence boundary | Yes |
| Contract | Server action maps domain/persistence results to redirect or inline feedback without hand-crafted auth cookies | Action-level test or DB-backed E2E assertion | Yes |
| E2E | Finance manager confirms seeded reminder through the browser and dashboard updates from DB | New DB-backed Playwright spec | Yes |
| E2E | General member cannot confirm Kai's reminder | New DB-backed Playwright spec or direct-action assertion in the same spec | Yes |
| E2E/Integration | Already-posted conflict creates no duplicate | Integration preferred; browser if practical | Yes |
| Manual | Prototype copy and layout remain aligned after implementation | Artifact/code review | Yes |
| Quality Gate | Existing checks remain green | `corepack pnpm test`, `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm test:e2e`, DB-backed E2E command | Yes |

## Domain Rules Under Test
| Rule | Source | Verification Method |
|---|---|---|
| Reminder-mode recurring items stay pending until confirmation | Recurring schedule domain | Dashboard pending list and no totals change before action |
| Confirmation creates the ledger record from the recurring rule | Recurring schedule domain | Unit/integration and DB-backed E2E row assertion |
| Confirmed occurrence stores `ledgerRecordId` and becomes `posted` | Prisma schema/domain | Integration query after action |
| Posted occurrence cannot be confirmed again | Recurring schedule domain/schema uniqueness | Unit/integration conflict test |
| Confirmation authorization follows ledger creation target member | Authorization module/product decision | General member denied for Kai; finance manager allowed |

## Visual Model
- type: verification_trace
- title: Recurring Reminder Confirmation Verification Trace
- nodes:
  - id: ac_pending
    label: AC1-AC2 pending visibility
    kind: acceptance_criterion
  - id: ac_confirm
    label: AC3-AC6 confirmation success
    kind: acceptance_criterion
  - id: ac_reject
    label: AC7 conflict rejection
    kind: acceptance_criterion
  - id: ac_permission
    label: AC8 permission denial
    kind: acceptance_criterion
  - id: rule_once
    label: One occurrence creates one ledger record
    kind: domain_rule
  - id: e2e_confirm
    label: DB-backed confirmation E2E
    kind: test_level
- edges:
  - from: ac_pending
    to: e2e_confirm
    label: covered by
  - from: ac_confirm
    to: e2e_confirm
    label: covered by
  - from: ac_reject
    to: rule_once
    label: enforces
  - from: ac_permission
    to: e2e_confirm
    label: covered by
  - from: rule_once
    to: e2e_confirm
    label: verified by

## Implementation Preconditions
- Add or extend a dashboard data source so pending occurrences include recurring rule details needed for display and authorization preview.
- Add a server action for confirmation; it must re-load current member, occurrence, rule, and categories server-side.
- Persist the created ledger record and posted occurrence update in one transaction.
- Preserve the narrow controlled-auth fixture approach for E2E; do not add real Google OAuth or hand-written Better Auth cookies for this story.
- Reset or isolate the E2E database between confirmation tests because the seeded occurrence mutates from pending to posted.

## Review Gate
- decision: approve_for_technical_design
- owner: architecture-planner
- rationale: The behavior surface, permission policy, DB seed, and verification obligations are now explicit enough to design the implementation boundary.
- open_risks:
  - Current dashboard pending data only returns occurrence fields; implementation must join or separately load recurring rule details.
  - Existing seed also contains an already confirmed June living-fee ledger record, so E2E assertions must distinguish the newly confirmed record or reset/adjust seed expectations.
  - Kai currently has no linked controlled-auth user in seed; general-member self-confirmation can be unit/integration covered unless a Kai test user is added.
- next_step: Create Feature Technical Design for recurring reminder confirmation UI before implementation.
