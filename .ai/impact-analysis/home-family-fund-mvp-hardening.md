---
id: ia-home-family-fund-mvp-hardening
stage: impact-analysis
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-home-family-fund
  - cu-home-family-fund
  - idea-home-family-fund
  - vd-home-family-fund-mvp
outputs:
  - affected_contexts
  - affected_code_areas
  - risk_map
  - story_slicing_recommendations
trace_links:
  domain_events:
    - Income recorded
    - Expense recorded
    - Member-paid expense became refundable
    - Expenses reimbursed
    - Recurring reminder confirmed
    - Monthly report generated
    - Monthly reimbursement table generated
  bounded_contexts:
    - Identity and Access
    - Fund Ledger
    - Categorization
    - Recurring Schedule
    - Reimbursement
    - Reporting
    - Responsive Web Experience
  code_understanding:
    - .ai/code-understanding/home-family-fund.md
  source_files:
    - src/app/page.tsx
    - src/app/ledger-record-actions.ts
    - src/app/home-dashboard-data-source.ts
    - src/auth/server-current-member.ts
    - src/modules/fund-ledger/ledger-record-command.ts
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/recurring-schedule/recurring-rules.ts
    - prisma/schema.prisma
    - e2e/home.spec.ts
reviewed_at: 2026-06-07
---

# Impact Analysis for Home Family Fund MVP Hardening

## Delivery Profile
This impact analysis inherits `delivery_profile: mvp` and `release_target: local_dev`. The target is not a production launch yet; the analysis focuses on closing the gap between current implementation evidence and the MVP verification design for local browser/database workflows. Production deployment concerns are identified but should be sliced separately once a concrete target environment is selected.

## Change Summary
The current system has strong domain-module coverage, a Prisma schema, a homepage dashboard, Better Auth integration, create-record server action, and a fixture-based Playwright E2E foundation. The hardening change is to move from fixture/browser smoke coverage toward realistic local-dev confidence: database-backed browser flows, real or controlled auth/session behavior, command-level mutation verification through the UI, and deployment risk visibility.

This is not a new domain feature. It is a verification and integration hardening effort for the DDD intent already captured in the MVP verification design.

## Affected Domain Areas
| Domain Event / Rule / Context | Impact | Risk |
|---|---|---|
| Google sign-in is required before app access | DB-backed and OAuth-aware tests must keep household data hidden until a linked member is resolved. | High: current E2E can use a non-production header fixture, not real Better Auth/OAuth state. |
| Google identity must map to an app member | Browser flows need seeded user/account/member data or a controlled auth fixture that exercises the same mapping contract. | High: unlinked and inactive member states can regress if only fixture dashboard tests run. |
| Income recorded / Expense recorded | Browser create-record flow should persist real Prisma rows and refresh dashboard/report totals. | Medium: server action exists, but current E2E does not submit against DB-backed data. |
| Member-paid expense became refundable | Member-paid expense creation should appear in reimbursement table after persistence. | Medium: read model rules exist; browser/database integration is not proved. |
| Expenses reimbursed | Reimbursement UI and persistence are not complete enough to prove one-time settlement through browser flows. | High: domain rule exists, but full UI mutation path is not observed. |
| Recurring reminder confirmed | Recurring rule domain supports confirmation, but UI/persistence flow is not fully observed. | Medium: can be sliced after ledger/report DB-backed path is reliable. |
| Monthly report generated / reimbursement table generated | Dashboard read model should derive from real DB data by month and trace to records. | Medium: dashboard data source exists; current E2E dashboard uses fixture data. |
| Responsive Web Experience | Mobile tests should cover actual create/report/reimbursement workflows, not only dashboard reachability. | Medium: foundation catches horizontal overflow, but not full mobile task completion. |

## Affected Code Areas
| Area | Path / Module / Contract | Expected Impact | Evidence |
|---|---|---|---|
| Playwright setup | `playwright.config.ts`, `e2e/home.spec.ts` | Add DB-backed setup/teardown or seed hooks; split fixture smoke from DB integration tests. | Current E2E uses header fixture and no DB lifecycle. |
| Auth/session boundary | `src/auth/server-current-member.ts`, `src/auth/current-member.ts`, `src/auth/current-member-data-source.ts` | Add test path that uses Better Auth-compatible user/account rows, or keep header fixture only for narrow smoke tests. | Current non-production header bypass returns a fixed finance manager. |
| Dashboard read data | `src/app/home-dashboard-data-source.ts`, `src/app/page.tsx` | Verify real Prisma rows map into members/categories/records/pending occurrences without relying on fixture data. | Data source already selects Prisma rows by month and maps to domain types. |
| Create ledger record | `src/app/ledger-record-actions.ts`, `src/app/record-entry-panel.tsx`, `src/modules/fund-ledger/ledger-record-command.ts` | Browser flow should submit income and expense forms, persist rows, and display redirect feedback. | Server action exists and writes via `createLedgerRecordInDatabase`. |
| Reimbursement mutation | `src/modules/reimbursement/reimbursements.ts`, future app action/UI | Need integration wrapper and UI action if reimbursement is to be completed through browser. | Domain transition exists, but inspected app only displays reimbursement groups/action button. |
| Recurring confirmation | `src/modules/recurring-schedule/recurring-rules.ts`, future app action/UI | Need persistence/UI contract for confirming pending occurrences. | Pure rules exist; dashboard displays pending items. |
| Prisma schema/data | `prisma/schema.prisma`, `prisma/seed.sql`, `prisma/seed.sh` | Tests need deterministic DB state and cleanup; single-household defaults must be explicit. | Schema has household IDs and unique recurring occurrence guard; command wrapper defaults to `household-demo`. |
| Deployment and env | `README.md`, `docker-compose.yml`, `prisma.config.ts`, `.env*` conventions | Deploy readiness needs env/secrets/migration/pooling plan. | README references local Postgres and future Vercel/Neon setup; no deploy artifact exists. |

## Data and Integration Impact
| Data / Integration | Owner | Impact | Compatibility Concern |
|---|---|---|---|
| PostgreSQL test data | Prisma persistence | E2E needs deterministic household, members, Better Auth users/accounts/sessions, categories, records, recurring occurrences. | Reusing dev DB without isolation can make tests flaky or mutate developer data. |
| Better Auth tables | Identity and Access / Auth adapter | Controlled session testing may require inserting `User`, `Account`, and `Session` rows or using a narrow non-production test hook. | Real cookie format/provider behavior may differ from simplified test setup. |
| Household IDs | Persistence / Fund Ledger | Hardcoded `household-demo` is acceptable for local MVP but constrains multi-household and isolated test data. | Parallel E2E or future tenancy may conflict with global seed IDs. |
| LedgerRecord reimbursement state | Fund Ledger / Reimbursement | Browser reimbursement settlement must update source records and prevent double settlement. | Current domain function returns updated records but persistence/UI path is not established. |
| RecurringOccurrence to LedgerRecord link | Recurring Schedule / Fund Ledger | Confirmation flow should create a ledger record and preserve trace to occurrence/rule. | Schema supports link; browser persistence flow is not observed. |
| Google OAuth | Better Auth / external Google provider | Manual or mocked OAuth verification is needed before relying on production-like login. | External provider tests are environment-dependent and should not block local deterministic E2E. |
| Vercel/Neon | Deployment | Production readiness needs connection pooling, migrations, env vars, and callback URLs. | Not required for `local_dev`, but blocks production release confidence. |

## Test Impact
| Existing / Needed Test Area | Impact | Notes |
|---|---|---|
| Existing unit/domain tests | Preserve | Continue proving pure rules; add only if integration work reveals missing domain errors. |
| Existing app/auth tests | Expand | Add tests for any DB-backed E2E auth helper or session fixture contract. |
| Existing fixture E2E | Preserve as smoke | Keep fast unauthenticated/dashboard/mobile smoke tests, but label as fixture-based. |
| Needed DB-backed E2E | New | Seed DB, browse dashboard from real data, submit income/expense, verify report/reimbursement updates. |
| Needed permission E2E | New | Test general member cannot create for another member through UI/direct action; finance manager can create for others. |
| Needed reimbursement E2E | New after UI action exists | Select member-paid expenses, mark reimbursed once, verify totals and duplicate rejection. |
| Needed recurring E2E | New after UI action exists | Confirm pending reminder and verify ledger/report update. |
| Needed deploy checks | New later | Build, migration deploy dry run, env validation, OAuth callback config, health/smoke plan. |

## Story Slicing Recommendations
| Candidate Slice | Business Value | Implementation Risk | Dependencies |
|---|---|---|---|
| DB-backed dashboard E2E foundation | Proves monthly report and reimbursement read models work from real Prisma data instead of fixture data. | Medium | Deterministic local test DB strategy; seed data for members/categories/records/occurrences. |
| Controlled auth/session E2E | Proves linked/unlinked/inactive member states through the same current-member data source used by the app. | High | Better Auth-compatible session fixture or carefully scoped test-only route/header contract. |
| Browser create-record happy path | Proves household members can create income/member-paid/fund-paid records and see updated dashboard totals. | Medium | DB-backed dashboard E2E and controlled auth/session path. |
| Permission matrix browser checks | Proves command-level authorization is not only hidden by UI. | Medium | Multiple seeded roles and direct server action/request checks. |
| Reimbursement settlement UI path | Delivers finance-manager reimbursement workflow promised by MVP. | High | UI selection model, server action/persistence wrapper, DB-backed E2E. |
| Recurring reminder confirmation UI path | Delivers reminder-to-ledger workflow promised by MVP. | Medium | Persistence wrapper and UI for pending occurrence confirmation. |
| Deploy readiness package | Converts local MVP into deployment-ready plan with secrets, migrations, OAuth callbacks, rollback, and observability. | Medium to high | Concrete target environment, likely Vercel/Neon decision. |

## Visual Model

- type: impact_map
- title: Home Family Fund MVP Hardening Impact Map
- nodes:
  - id: d_auth
    label: Google sign-in and member mapping
    kind: domain_area
  - id: d_ledger
    label: Income and expense recording
    kind: domain_area
  - id: d_reimbursement
    label: One-time reimbursement settlement
    kind: domain_area
  - id: d_recurring
    label: Recurring reminder confirmation
    kind: domain_area
  - id: d_reporting
    label: Monthly report and reimbursement table
    kind: domain_area
  - id: c_auth
    label: src/auth current-member boundary
    kind: code_area
  - id: c_dashboard
    label: src/app dashboard data source and page
    kind: code_area
  - id: c_actions
    label: server actions for mutations
    kind: code_area
  - id: data_prisma
    label: Prisma PostgreSQL schema and seed data
    kind: data
  - id: int_google
    label: Better Auth and Google OAuth
    kind: integration
  - id: t_fixture_e2e
    label: current fixture Playwright E2E
    kind: test
  - id: t_db_e2e
    label: needed DB-backed E2E
    kind: test
  - id: risk_fixture_gap
    label: fixture confidence gap
    kind: risk
  - id: risk_deploy_unknown
    label: deployment target unknown
    kind: risk
  - id: s_db_dashboard
    label: slice DB-backed dashboard E2E
    kind: story_candidate
  - id: s_create_record
    label: slice browser create-record flow
    kind: story_candidate
  - id: s_reimbursement
    label: slice reimbursement settlement UI
    kind: story_candidate
  - id: s_deploy
    label: slice deploy readiness package
    kind: story_candidate
- edges:
  - from: d_auth
    to: c_auth
    label: resolved by
  - from: d_auth
    to: int_google
    label: depends on
  - from: d_reporting
    to: c_dashboard
    label: rendered by
  - from: c_dashboard
    to: data_prisma
    label: reads
  - from: d_ledger
    to: c_actions
    label: mutates through
  - from: c_actions
    to: data_prisma
    label: writes
  - from: d_reimbursement
    to: c_actions
    label: needs UI action
  - from: d_recurring
    to: c_actions
    label: needs confirmation action
  - from: t_fixture_e2e
    to: risk_fixture_gap
    label: leaves
  - from: risk_fixture_gap
    to: t_db_e2e
    label: mitigated by
  - from: t_db_e2e
    to: s_db_dashboard
    label: first slice
  - from: s_db_dashboard
    to: s_create_record
    label: enables
  - from: s_create_record
    to: s_reimbursement
    label: enables
  - from: risk_deploy_unknown
    to: s_deploy
    label: constrains

## Blockers and Open Questions
- DB-backed E2E story slicing needs a decision on test database lifecycle: reuse local Docker DB with reset/seed, create an isolated database/schema, or use another disposable Postgres strategy.
- Controlled auth/session story slicing needs a decision on whether to insert Better Auth-compatible session rows or keep a test-only auth override for browser flows.
- Reimbursement and recurring confirmation UI slices need product-level confirmation of minimum UI interaction: inline row actions, modal confirmation, or dedicated routes.
- Deploy readiness slicing is blocked until the target environment is confirmed; README hints at Vercel/Neon, but project context still records production target as unknown.
- Multi-household behavior should not be silently introduced during hardening; current MVP should either keep `household-demo` as an explicit local assumption or create a bounded single-household context provider.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm that MVP hardening is the right change umbrella before slicing.
  - Choose the first slice: DB-backed dashboard E2E is recommended because it reduces fixture risk and enables later mutation workflows.
  - Decide whether production deploy readiness should remain separate from local-dev E2E hardening.
- must_check:
  - Domain impacts stay tied to existing DDD events and verification criteria.
  - Fixture E2E is not mistaken for real DB/OAuth coverage.
  - Story candidates are not final stories yet and still need story-slicing.
- acceptance_signals:
  - Story slicing can create a small first story with clear dependencies and tests.
  - High-risk unknowns are explicit enough to avoid hidden architecture decisions during implementation.
- unresolved_blockers:
  - Production deploy story slicing is blocked pending target environment.
  - Local DB-backed E2E slicing is not blocked, but needs a test database lifecycle choice.
- next_step:
  - story-slicing
