---
id: vd-home-family-fund-db-backed-dashboard-e2e
stage: verification-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-db-backed-dashboard-e2e
  - arch-home-family-fund-db-backed-dashboard-e2e
  - ddd-home-family-fund
  - cu-home-family-fund
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - test_plan
trace_links:
  stories:
    - .ai/stories/story-mvp-hardening-db-backed-dashboard-e2e.md
  architecture_decisions:
    - ADR-1 Use an Explicit Dedicated Local E2E Database
    - ADR-2 Keep Auth Fixture Narrow, Move Data Confidence to Prisma
    - ADR-3 Split Fixture Smoke and DB-Backed E2E Coverage
    - ADR-4 Seed Through Repository-Owned Deterministic Data, Not Ad Hoc Test UI
  domain_rules:
    - Reports derive from source records and trace back to record ids.
    - Fund-paid expenses do not enter reimbursement.
    - Member-paid expenses start refundable/unreimbursed.
    - Reminder-based recurring items do not affect totals until confirmed.
reviewed_at: 2026-06-07
---

# Verification Design for DB-Backed Dashboard E2E

## Delivery Profile
This verification design targets `local_dev` under the MVP release profile. It proves local browser/database integration for the existing dashboard, report, reimbursement table, and pending recurring display. It does not prove real Google OAuth, production deployment, or reimbursement/recurring mutation flows.

DB-backed E2E should use a dedicated `home_fund_e2e` database and an explicit `DATABASE_URL`. It may retain the narrow non-production `x-e2e-current-member-email` auth fixture, but dashboard content must come from Prisma-backed data.

## Acceptance Criteria
- AC1: A DB-backed E2E setup creates or resets a dedicated `home_fund_e2e` database without resetting the normal development `home_fund` database.
- AC2: The DB-backed E2E setup applies the current Prisma migrations to `home_fund_e2e`.
- AC3: The DB-backed E2E setup seeds deterministic household, member, category, ledger record, and pending recurring occurrence rows for month `2026-06`.
- AC4: The DB-backed E2E web server runs with explicit `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e`.
- AC5: A linked E2E finance manager can open `/?month=2026-06` through the browser without real Google OAuth.
- AC6: In DB-backed dashboard coverage, the homepage reads dashboard content through `createHomeDashboardDataSource(getPrismaClient())`, not `createE2eHomeDashboardData`.
- AC7: The browser shows confirmed income and confirmed expenses derived from seeded ledger records.
- AC8: The browser shows at least one member-paid refundable expense in the reimbursement table.
- AC9: The browser excludes fund-paid expenses from refundable reimbursement totals.
- AC10: The browser shows at least one pending recurring item separately from confirmed totals.
- AC11: The DB-backed dashboard test is named, located, or commanded separately from fixture smoke tests so verification reports cannot confuse the two.
- AC12: If local Postgres is unavailable, DB-backed E2E fails with an actionable setup failure rather than silently passing against fixture data.

## BDD Scenarios
```gherkin
Feature: DB-backed monthly dashboard verification

  Scenario: Linked member views dashboard from Prisma data
    Given the dedicated E2E database has been reset and seeded for June 2026
    And the app server is using the E2E database URL
    And Lin is resolved through the non-production E2E auth fixture
    When Lin opens the June 2026 dashboard
    Then the dashboard shows confirmed income from persisted ledger records
    And the dashboard shows confirmed expenses from persisted ledger records
    And the dashboard shows the reimbursement table from persisted member-paid expenses
    And the dashboard shows pending recurring items from persisted occurrences
```

```gherkin
Feature: Reimbursement read model from persisted records

  Scenario: Fund-paid and member-paid expenses are separated
    Given the E2E database has a fund-paid internet expense for June 2026
    And the E2E database has a member-paid grocery expense for June 2026
    When Lin views the June 2026 dashboard
    Then the grocery expense contributes to the refundable reimbursement table
    And the internet expense contributes to monthly expenses
    And the internet expense does not contribute to refundable totals
```

```gherkin
Feature: Fixture and DB-backed coverage remain distinct

  Scenario: DB-backed test cannot pass from fixture dashboard data
    Given the DB-backed E2E test is running
    When the dashboard is loaded
    Then the test verifies data values that exist only in the E2E database seed
    And the test run reports DB-backed coverage separately from fixture smoke coverage
```

## Test Plan
| Level | What It Verifies | Candidate Test | Required |
|---|---|---|---|
| Unit | E2E config helpers do not rely on implicit fallback URLs | Test any added DB URL/build helper resolves `home_fund_e2e` only from explicit config | Yes if helper is added |
| Integration | Dashboard data source maps seeded Prisma rows to domain data | `home-dashboard-data-source` test with DB-shaped rows including income, fund-paid expense, member-paid expense, pending occurrence | Yes |
| Contract | E2E auth fixture remains production-disabled and does not imply real OAuth coverage | Existing/expanded `server-current-member.test.ts` for non-production header and production bypass rejection | Yes |
| Contract | DB-backed and fixture tests are distinguishable | Config/script test or static assertion that DB-backed spec/command is named separately from fixture smoke | Yes |
| E2E | Browser reads dashboard from Prisma-backed database | New DB-backed Playwright spec opens `/?month=2026-06` with E2E auth header and asserts seed-backed income, expense, reimbursement, pending recurrence | Yes |
| Manual | Local Postgres precondition is understandable | Review README/script error output for `docker compose up -d` and `home_fund_e2e` setup guidance | Yes |
| Quality Gate | Existing checks remain green | `corepack pnpm test`, `corepack pnpm type-check`, `corepack pnpm lint`, fixture `pnpm test:e2e`, DB-backed E2E command | Yes |

## Domain Rules Under Test
| Rule | Source | Verification Method |
|---|---|---|
| Reports derive from source records | DDD, architecture ADR-4 for DB-backed E2E seed | DB-backed Playwright assertions against seeded ledger values |
| Fund-paid expenses do not enter reimbursement | DDD, MVP verification AC9 | Seed fund-paid expense and assert it is not in refundable totals |
| Member-paid expenses start refundable | DDD, MVP verification AC10 | Seed member-paid refundable expense and assert reimbursement table shows it |
| Pending reminders do not affect confirmed totals | DDD, MVP verification AC14 | Seed pending recurring occurrence and assert it appears separately |
| Auth fixture is not real OAuth coverage | Architecture ADR-2 | Verification report labels DB-backed E2E as data-read coverage only |

## Visual Model

- type: verification_trace
- title: DB-Backed Dashboard E2E Verification Trace
- nodes:
  - id: ac_dedicated_db
    label: AC1-AC4 dedicated E2E database and explicit URL
    kind: acceptance_criterion
  - id: ac_prisma_read
    label: AC5-AC7 dashboard reads Prisma data
    kind: acceptance_criterion
  - id: ac_reimbursement
    label: AC8-AC9 reimbursement from persisted expenses
    kind: acceptance_criterion
  - id: ac_pending
    label: AC10 pending recurring separate
    kind: acceptance_criterion
  - id: ac_distinct
    label: AC11-AC12 DB-backed coverage distinct from fixture
    kind: acceptance_criterion
  - id: bdd_dashboard
    label: Linked member views dashboard from Prisma data
    kind: bdd_scenario
  - id: bdd_reimbursement
    label: Fund-paid and member-paid expenses are separated
    kind: bdd_scenario
  - id: bdd_fixture
    label: DB-backed test cannot pass from fixture data
    kind: bdd_scenario
  - id: test_integration
    label: Integration dashboard data source mapping
    kind: test_level
  - id: test_e2e
    label: Playwright DB-backed dashboard spec
    kind: test_level
  - id: rule_report
    label: Reports derive from source records
    kind: domain_rule
  - id: rule_reimbursement
    label: Fund-paid excluded, member-paid refundable
    kind: domain_rule
- edges:
  - from: ac_dedicated_db
    to: bdd_dashboard
    label: enables
  - from: ac_prisma_read
    to: bdd_dashboard
    label: proven by
  - from: ac_reimbursement
    to: bdd_reimbursement
    label: proven by
  - from: ac_pending
    to: bdd_dashboard
    label: proven by
  - from: ac_distinct
    to: bdd_fixture
    label: proven by
  - from: bdd_dashboard
    to: test_e2e
    label: implemented as
  - from: bdd_reimbursement
    to: test_e2e
    label: implemented as
  - from: ac_prisma_read
    to: test_integration
    label: supported by
  - from: rule_report
    to: ac_prisma_read
    label: requires
  - from: rule_reimbursement
    to: ac_reimbursement
    label: requires

## Implementation Preconditions
- Local Postgres must be available or the DB-backed E2E setup must fail clearly.
- Implementation must choose the concrete script/command name for DB-backed E2E. Recommended: separate from fixture smoke, such as `test:e2e:db` or a clearly named Playwright project/spec.
- Implementation must choose the seed mechanism. Recommended: repository-owned setup script that creates/resets `home_fund_e2e`, runs migrations, and seeds deterministic rows.
- DB-backed assertions should include at least one value that cannot come from `createE2eHomeDashboardData`, preventing accidental fixture pass.
- Production code path must not enable auth fixture behavior.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm the AC distinguish DB-backed data confidence from fixture smoke coverage.
  - Confirm the test plan is enough for implementation without designing real OAuth/session behavior.
  - Confirm local Postgres dependency is acceptable for MVP hardening.
- must_check:
  - `home_fund` development DB is not reset by DB-backed E2E setup.
  - `DATABASE_URL` is explicit and points to `home_fund_e2e`.
  - Verification reports must label this as DB-backed dashboard coverage, not full auth coverage.
- acceptance_signals:
  - Implementation can start with a failing DB-backed Playwright test and setup script.
  - Existing fixture E2E remains useful but separate.
- unresolved_blockers:
  - None for implementation.
- next_step:
  - implementation-cycle
