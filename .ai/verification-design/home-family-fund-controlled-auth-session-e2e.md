---
id: vd-home-family-fund-controlled-auth-session-e2e
stage: verification-design
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-controlled-auth-session-e2e
  - arch-home-family-fund-controlled-auth-session-e2e
  - ddd-home-family-fund
  - cu-home-family-fund
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_test_design
  - test_plan
trace_links:
  stories:
    - .ai/stories/story-mvp-hardening-controlled-auth-session-e2e.md
  architecture_decisions:
    - ADR-1 Use a Controlled Auth API Header, Not a Better Auth Cookie
    - ADR-2 Seed Better Auth-Compatible User and Account Rows
    - ADR-3 Keep Legacy Fixed-Member Header Only for Fixture Smoke
    - ADR-4 Production Must Ignore All E2E Auth Controls
  domain_rules:
    - Google sign-in is required before app access.
    - Google identity must map to an app member.
    - Inactive members cannot view household data.
reviewed_at: 2026-06-16
---

# Verification Design for Controlled Auth Session E2E

## Delivery Profile
This verification design targets `local_dev` under the MVP profile. It proves app-owned auth/member mapping in deterministic browser tests without external Google OAuth. Passing this design does not imply production OAuth callback, Better Auth cookie serialization, or deployment readiness.

## Acceptance Criteria
- AC1: Unauthenticated browser access to `/` still shows the Google sign-in gate and no household dashboard data.
- AC2: A controlled linked active Google user can open `/?month=2026-06` and see the dashboard.
- AC3: The linked active controlled user is resolved through `resolveCurrentMemberFromRequest`, Prisma-backed account lookup, Prisma-backed member lookup, and `resolveHouseholdAccess`; it must not use the fixed `x-e2e-current-member-email` shortcut.
- AC4: A controlled Google user with no matching app member sees the account-not-linked state and no household dashboard data.
- AC5: A controlled Google user linked to a disabled or invited member sees the inactive-member state and no household dashboard data.
- AC6: Controlled auth setup seeds deterministic `User`, `Account`, and `Member` rows in `home_fund_e2e`.
- AC7: Controlled auth uses an explicit non-production request contract such as `x-e2e-auth-user-id`.
- AC8: `NODE_ENV=production` ignores the controlled auth header and falls back to normal Better Auth resolution.
- AC9: Fixture smoke tests may continue using `x-e2e-current-member-email`, but controlled auth E2E must not send that header.
- AC10: README or verification artifacts document that this coverage is controlled auth/member mapping, not real Google OAuth.

## UX AC Reconciliation
| UX AC Draft | Final AC | Decision | Reason / Risk |
|---|---|---|---|
| Existing sign-in gate remains clear | AC1 | kept | This story verifies existing access states, not new UI. |
| Account-not-linked state remains clear | AC4 | kept | Prevents unrecognized Google accounts from seeing household data. |
| Inactive-member state remains clear | AC5 | kept | Verifies disabled/invited member protection. |
| Dashboard remains available to linked active member | AC2 | kept | Proves successful mapping does not block legitimate access. |

## BDD Scenarios
```gherkin
Feature: Controlled current-member access

  Scenario: Linked active Google user sees household dashboard
    Given the E2E database has a Better Auth user with a Google account
    And the Google account maps to an active household member
    When the user opens the June 2026 dashboard through the controlled auth contract
    Then the dashboard is visible
    And household data is loaded through the DB-backed dashboard path
```

```gherkin
Feature: Controlled current-member access

  Scenario: Unlinked Google user is blocked
    Given the E2E database has a Better Auth user with a Google account
    And no household member maps to that Google account
    When the user opens the homepage through the controlled auth contract
    Then the account-not-linked state is visible
    And household dashboard data is not visible
```

```gherkin
Feature: Controlled current-member access

  Scenario: Inactive linked member is blocked
    Given the E2E database has a Better Auth user with a Google account
    And the Google account maps to a disabled household member
    When the user opens the homepage through the controlled auth contract
    Then the inactive-member state is visible
    And household dashboard data is not visible
```

```gherkin
Feature: Controlled auth safety

  Scenario: Production ignores controlled auth headers
    Given the app is running in production mode
    When a request includes the controlled auth header
    Then the header is ignored
    And current-member resolution uses normal Better Auth behavior
```

## E2E Test Design
| Scenario | Route | Viewport | Given | When | Then | Required |
|---|---|---|---|---|---|---|
| Linked active user | `/?month=2026-06` | Desktop Chromium | `home_fund_e2e` seeded with user/account/member active state | Send `x-e2e-auth-user-id: user-e2e-linked` | Dashboard heading and DB-backed seed values are visible | Yes |
| Unlinked Google user | `/` | Desktop Chromium | Seeded user/account with no matching member | Send `x-e2e-auth-user-id: user-e2e-unlinked` | `找不到家庭成員帳號` visible; dashboard metrics absent | Yes |
| Disabled member | `/` | Desktop Chromium | Seeded user/account matching disabled member | Send `x-e2e-auth-user-id: user-e2e-disabled` | `帳號尚未啟用` visible; dashboard metrics absent | Yes |
| Unauthenticated baseline | `/` | Desktop Chromium | No auth headers | Open homepage | `請先使用 Google 登入` visible; dashboard metrics absent | Yes |

## IA / Navigation Verification

- baseline_artifact: not_needed
- navigation_reachability: No route changes; all scenarios use `/`.
- deep_links: `/?month=2026-06` must remain directly openable for linked active member.
- breadcrumbs_or_local_nav: Not applicable.
- route_titles_or_metadata: No metadata changes.
- mobile_navigation: Not required for this auth mapping story; mobile reachability remains covered by fixture smoke E2E.
- permission_visibility: Server-side current-member resolution must block dashboard data before UI navigation is rendered.
- seo_expectations: Not applicable for local-dev authenticated app.
- changed_user_paths: None; this verifies existing access states.

## E2E Data, Selectors, and Mocks

- test_data:
  - `user-e2e-linked` with Google account subject/email matching active member `member-fin`.
  - `user-e2e-unlinked` with Google account subject/email not present on any member.
  - `user-e2e-disabled` with Google account subject/email matching disabled member.
  - Existing June 2026 dashboard seed data from DB-backed dashboard E2E.
- mock_or_fixture_strategy:
  - Use `home_fund_e2e` reset/migrate/seed.
  - Use production-disabled `x-e2e-auth-user-id` to construct only the session user.
  - Do not use `x-e2e-current-member-email` in controlled auth E2E.
- selectors_or_accessible_names:
  - `家庭資金總覽`
  - `請先使用 Google 登入`
  - `找不到家庭成員帳號`
  - `帳號尚未啟用`
  - DB-only text such as `六月生活費` or `補充用品代墊`
- toast_expectations: None.
- responsive_checks: Not required for this slice.
- accessibility_checks: Use role/name selectors for headings and buttons where possible.
- tracking_expectations: No analytics provider exists; tracking is out of scope.

## Test Plan
| Level | What It Verifies | Candidate Test | Required |
|---|---|---|---|
| Unit | Controlled auth header parsing is production-disabled | Expand `server-current-member.test.ts` for controlled header in development and production | Yes |
| Integration | Controlled session user still goes through current-member data source and member mapping | Test `getCurrentMemberFromHeaders` with controlled auth header and mocked factories/data source | Yes |
| Contract | Fixed fixture header remains separate from controlled auth header | Test `x-e2e-current-member-email` behavior remains fixture-only and controlled tests omit it | Yes |
| E2E | Browser access states for linked, unlinked, disabled, unauthenticated users | New/expanded DB-backed Playwright spec under `e2e-db/` | Yes |
| Manual | Confirm docs describe controlled auth, not real OAuth | README/artifact review | Yes |
| Quality Gate | Existing checks remain green | `corepack pnpm test`, `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm test:e2e`, `corepack pnpm test:e2e:db` | Yes |

## Domain Rules Under Test
| Rule | Source | Verification Method |
|---|---|---|
| Google sign-in is required before app access | DDD policy, AC1 | Unauthenticated E2E gate assertion |
| Google identity must map to an app member | DDD policy, AC3-AC4 | Controlled auth E2E and current-member integration test |
| Inactive members cannot view household data | Identity and Access, AC5 | Disabled-member controlled auth E2E |
| Household data must not leak to blocked states | Story UX risk, AC1/AC4/AC5 | Assert dashboard metrics/records are absent for blocked states |
| Test auth controls are not production access paths | Architecture ADR-4, AC8 | Production contract unit test |

## Visual Model

- type: verification_trace
- title: Controlled Auth Session E2E Verification Trace
- nodes:
  - id: ac_linked
    label: AC2-AC3 linked active user dashboard
    kind: acceptance_criterion
  - id: ac_unlinked
    label: AC4 unlinked user blocked
    kind: acceptance_criterion
  - id: ac_inactive
    label: AC5 inactive member blocked
    kind: acceptance_criterion
  - id: ac_production
    label: AC8 production ignores header
    kind: acceptance_criterion
  - id: bdd_mapping
    label: Controlled current-member access scenarios
    kind: bdd_scenario
  - id: test_contract
    label: Unit and integration contract tests
    kind: test_level
  - id: test_e2e
    label: DB-backed controlled auth Playwright tests
    kind: test_level
  - id: rule_mapping
    label: Google identity maps to app member
    kind: domain_rule
- edges:
  - from: rule_mapping
    to: ac_linked
    label: requires
  - from: rule_mapping
    to: ac_unlinked
    label: blocks
  - from: ac_linked
    to: bdd_mapping
    label: covered by
  - from: ac_unlinked
    to: bdd_mapping
    label: covered by
  - from: ac_inactive
    to: bdd_mapping
    label: covered by
  - from: ac_production
    to: test_contract
    label: proven by
  - from: bdd_mapping
    to: test_e2e
    label: implemented as

## Implementation Preconditions
- Keep `home_fund_e2e` as the dedicated local E2E database.
- Add deterministic `User` and `Account` rows to the E2E seed/setup path.
- Add a controlled auth header that returns only a session user and remains disabled in production.
- Do not remove the existing fixture smoke path in this story.
- Do not attempt real Google OAuth automation in this story.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm controlled auth is scoped to current-member mapping, not real OAuth.
  - Confirm four visible access states are enough for this hardening slice.
  - Confirm production-disabled contract tests are mandatory.
- must_check:
  - Controlled E2E does not use `x-e2e-current-member-email`.
  - Blocked states do not render dashboard data.
  - Linked active scenario uses DB-backed dashboard seed values.
- acceptance_signals:
  - Implementation can start with failing tests for controlled auth header and browser access states.
  - Test plan has clear unit, integration, contract, and E2E coverage.
- unresolved_blockers:
  - None for implementation.
- next_step:
  - implementation-cycle
