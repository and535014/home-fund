---
id: arch-home-family-fund-db-backed-dashboard-e2e
stage: architecture
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-db-backed-dashboard-e2e
  - cu-home-family-fund
  - ia-home-family-fund-mvp-hardening
  - arch-home-family-fund
outputs:
  - architecture_decisions
  - boundaries
  - data_ownership
  - integration_contracts
trace_links:
  stories:
    - .ai/spec/story-mvp-hardening-db-backed-dashboard-e2e.md
  bounded_contexts:
    - Reporting
    - Reimbursement
    - Fund Ledger
    - Categorization
    - Recurring Schedule
    - Identity and Access
    - Responsive Web Experience
  domain_events:
    - Monthly records viewed
    - Monthly report generated
    - Monthly reimbursement table generated
reviewed_at: 2026-06-07
---

# DB-Backed Dashboard E2E Architecture

## Delivery Profile
This architecture targets `local_dev` with an `mvp` delivery profile. Decisions prioritize deterministic browser/database confidence without introducing production-grade test infrastructure, real external Google OAuth, or multi-household tenancy.

MVP-accepted risks: tests may depend on a local Postgres service being available; auth may still use a non-production E2E current-member fixture; production deployment and OAuth callback verification remain separate work.

## Context and Forces
- The current E2E foundation proves dashboard rendering with `createE2eHomeDashboardData`, but the MVP hardening story requires dashboard records to come from Prisma.
- The current dashboard data source already reads members, categories, ledger records, and pending recurring occurrences from Prisma.
- Local Docker Postgres is available through `docker-compose.yml`.
- The development database must not be silently reset or mutated by E2E.
- Real Google OAuth is explicitly out of scope for this local-dev slice.
- `prisma.config.ts` currently has a fallback URL that does not match `docker-compose.yml`; DB-backed E2E must pass an explicit `DATABASE_URL` instead of relying on fallback behavior.
- The story should create a foundation for later browser create-record, reimbursement, and recurring confirmation flows.

## Boundaries
| Boundary | Owns | Collaborates With | Reason |
|---|---|---|---|
| DB-Backed E2E Harness | E2E command, Playwright project selection, test DB setup/reset/seed, explicit env vars | Playwright, Prisma CLI, local Postgres | Keeps destructive test setup outside normal app runtime and away from developer DB. |
| Test Database Boundary | `home_fund_e2e` database/schema and deterministic seed rows | Prisma migrations, dashboard data source, E2E tests | Isolates E2E data from `home_fund` development data. |
| Dashboard Read Boundary | Prisma-backed `createHomeDashboardDataSource` and homepage read flow | Reporting, Reimbursement, Fund Ledger, Categorization, Recurring Schedule | The story specifically verifies real read-model composition from persisted rows. |
| E2E Auth Fixture Boundary | Non-production current-member fixture only for browser access | Identity and Access, Playwright | Allows local deterministic browser flow without real Google OAuth while keeping data reads DB-backed. |
| Fixture Smoke Boundary | Existing fixture dashboard smoke tests | E2E harness | Keeps fast smoke confidence but prevents confusing it with DB-backed coverage. |

## Data Ownership
| Data / Model | Owner | Readers | Consistency Need |
|---|---|---|---|
| `home_fund_e2e` database | DB-Backed E2E Harness | Prisma client, Playwright web server | Must be reset/seeded before DB-backed E2E to make assertions deterministic. |
| Household/member/category/ledger/recurring seed rows | DB-Backed E2E Harness for setup; domain modules own meaning | Dashboard data source, reporting, reimbursement table | Must match DDD examples: income, fund-paid expense, member-paid refundable expense, pending recurring item. |
| Better Auth session rows | Out of scope for this story | None required if E2E auth fixture is retained | Controlled auth/session E2E owns this later. |
| Current member fixture identity | E2E Auth Fixture Boundary | `getCurrentMemberFromHeaders` | Must be disabled in production and enough to authorize dashboard access. |
| Dashboard read data | Dashboard Read Boundary | Homepage UI, E2E assertions | Must come from Prisma for DB-backed E2E, not `createE2eHomeDashboardData`. |

## Integration Contracts
| Producer | Consumer | Contract | Failure / Retry Notes |
|---|---|---|---|
| E2E setup command | Local Postgres | Ensures `home_fund_e2e` exists, applies migrations, and seeds deterministic rows. | If Postgres is unavailable, DB-backed E2E fails with setup instructions; it should not fall back to fixture data silently. |
| E2E setup command | Next dev server | Provides explicit `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e`. | Avoid relying on `.env` or Prisma fallback URL. |
| Playwright DB-backed test | Homepage | Sends E2E auth header only; does not send any dashboard fixture flag. | If the app serves fixture data, the test should fail by asserting DB-only seed values. |
| Homepage | Dashboard data source | For DB-backed E2E, authenticated request calls `createHomeDashboardDataSource(getPrismaClient()).getMonthlyDashboardData(month)`. | Data-source errors should surface as test failures; no fallback to fixture. |
| Fixture smoke tests | Homepage | May keep using `x-e2e-current-member-email` plus fixture dashboard path for fast UI smoke. | Fixture tests must be named or located so they are not mistaken for DB-backed coverage. |

## ADRs
### ADR-1: Use an Explicit Dedicated Local E2E Database
- Status: accepted
- Decision: DB-backed dashboard E2E uses `home_fund_e2e` with an explicit `DATABASE_URL`; it does not reuse or reset the normal `home_fund` development database.
- Rationale: E2E setup may reset/seed data and must not corrupt developer work. Explicit env also avoids the mismatch between `docker-compose.yml` credentials and `prisma.config.ts` fallback.
- Consequences: Developers need local Postgres running before DB-backed E2E. Setup scripts must create/reset/seed `home_fund_e2e`.

### ADR-2: Keep Auth Fixture Narrow, Move Data Confidence to Prisma
- Status: accepted
- Decision: This story may retain the non-production `x-e2e-current-member-email` auth fixture to enter the dashboard, but all dashboard content assertions must use Prisma-backed data.
- Rationale: The story closes the dashboard data confidence gap. Real/controlled auth-session behavior is already a separate completion story.
- Consequences: Verification must clearly label this as DB-backed dashboard coverage, not real OAuth/session coverage.

### ADR-3: Split Fixture Smoke and DB-Backed E2E Coverage
- Status: accepted
- Decision: Existing fast fixture smoke tests can remain, but DB-backed E2E must be a distinct test path, project, file, or command.
- Rationale: Fixture tests are useful for UI reachability, but they must not satisfy acceptance criteria that require real Prisma data.
- Consequences: Test naming and verification artifacts must distinguish `fixture` from `db-backed` coverage.

### ADR-4: Seed Through Repository-Owned Deterministic Data, Not Ad Hoc Test UI
- Status: accepted
- Decision: DB-backed E2E setup seeds the database directly through Prisma/SQL setup before browser tests, rather than relying on UI flows to create dashboard baseline data.
- Rationale: This story verifies read-model/dashboard composition; create-record browser flows are a later slice.
- Consequences: Seed data must include enough domain examples to verify report totals, reimbursement table, and pending recurring section.

## Visual Model

- type: architecture_map
- title: DB-Backed Dashboard E2E Architecture
- nodes:
  - id: playwright_db
    label: Playwright DB-backed dashboard test
    kind: frontend
  - id: e2e_setup
    label: E2E setup/reset/seed command
    kind: backend
  - id: next_server
    label: Next dev server with DATABASE_URL
    kind: backend
  - id: auth_fixture
    label: Non-production E2E auth fixture
    kind: module
  - id: dashboard_page
    label: Homepage dashboard route
    kind: frontend
  - id: dashboard_source
    label: Prisma dashboard data source
    kind: module
  - id: reporting
    label: Reporting/Reimbursement read models
    kind: bounded_context
  - id: e2e_db
    label: Postgres home_fund_e2e
    kind: data_store
  - id: fixture_smoke
    label: Existing fixture smoke E2E
    kind: frontend
- edges:
  - from: e2e_setup
    to: e2e_db
    label: creates resets seeds
  - from: e2e_db
    to: dashboard_source
    label: read by Prisma
  - from: playwright_db
    to: next_server
    label: opens dashboard
  - from: next_server
    to: auth_fixture
    label: resolves test member
  - from: next_server
    to: dashboard_page
    label: renders
  - from: dashboard_page
    to: dashboard_source
    label: loads month data
  - from: dashboard_source
    to: reporting
    label: feeds
  - from: fixture_smoke
    to: dashboard_page
    label: remains separate

## Open Risks
- Local Postgres may not be running; DB-backed E2E should fail with clear setup guidance rather than silently skipping.
- If DB-backed tests share port/server configuration with fixture tests, env leakage could make tests flaky. Verification design should define separate command/project or strict env.
- Auth fixture remains a non-production shortcut; controlled auth/session E2E must still be done later.
- Test seed IDs should not collide with developer seed IDs unless the dedicated `home_fund_e2e` DB is enforced.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm dedicated `home_fund_e2e` database is acceptable for local MVP hardening.
  - Confirm retaining the narrow auth fixture is acceptable for this data-read story.
  - Confirm fixture smoke tests and DB-backed tests must remain distinguishable.
- must_check:
  - DB-backed dashboard assertions cannot pass from `createE2eHomeDashboardData`.
  - E2E setup uses explicit `DATABASE_URL`.
  - Test setup does not reset normal development data.
- acceptance_signals:
  - Verification design can define BDD scenarios and test plan for DB-backed dashboard E2E without inventing architecture.
  - Implementation can add setup scripts/tests with clear data ownership and failure behavior.
- unresolved_blockers:
  - None for verification design.
- next_step:
  - verification-design
