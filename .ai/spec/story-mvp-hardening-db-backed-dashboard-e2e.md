---
id: story-mvp-hardening-db-backed-dashboard-e2e
stage: story
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-home-family-fund
  - cu-home-family-fund
  - ia-home-family-fund-mvp-hardening
  - review-ia-home-family-fund-mvp-hardening
outputs:
  - user_story
  - acceptance_criteria_draft
  - experience_design_need
trace_links:
  domain_events:
    - Monthly records viewed
    - Monthly report generated
    - Monthly reimbursement table generated
  business_outcomes:
    - A household can complete one monthly cycle of contributions, expenses, reports, and reimbursements without spreadsheet recalculation.
    - Users can see each member's monthly reimbursement amount and trace it back to individual expenses.
  bounded_contexts:
    - Reporting
    - Reimbursement
    - Fund Ledger
    - Categorization
    - Recurring Schedule
    - Identity and Access
    - Responsive Web Experience
  impact_analysis:
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
  affected_code_areas:
    - e2e/home.spec.ts
    - playwright.config.ts
    - src/app/page.tsx
    - src/app/home-dashboard-data-source.ts
    - src/auth/server-current-member.ts
    - prisma/schema.prisma
    - prisma/seed.sql
reviewed_at:
---

# MVP Hardening: DB-Backed Dashboard E2E

## Delivery Profile
This completion story targets `local_dev` under the MVP release gate. It closes a verification gap for existing monthly report and reimbursement dashboard behavior; it does not introduce new product UI.

## User Story
As a household member, I want the dashboard E2E flow to use real local database records, so that monthly report and reimbursement views are proven against the same Prisma data path used by the app.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Event | Monthly records viewed | The dashboard must show confirmed records for the selected month. |
| Event | Monthly report generated | Totals and category summaries must derive from source records. |
| Event | Monthly reimbursement table generated | Refundable member-paid expenses must appear from real persisted records. |
| Policy | Reports derive from source records | The story exists to replace fixture-only confidence with database-backed proof. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| E2E fixture gap | `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | Current Playwright dashboard test uses fixture data; this story adds DB-backed coverage. |
| Dashboard data source | `src/app/home-dashboard-data-source.ts` | Test must exercise Prisma row mapping for members, categories, ledger records, and pending occurrences. |
| Auth/session fixture | `src/auth/server-current-member.ts` | A narrow non-production auth helper may remain, but dashboard data must not come from `createE2eHomeDashboardData`. |
| Test data lifecycle | `prisma/schema.prisma`, `prisma/seed.sql` | Test database state must be deterministic and isolated enough not to mutate developer data accidentally. |

## Draft Acceptance Criteria
- Given deterministic local E2E seed data, a linked household member can open the selected month dashboard.
- The dashboard E2E reads household members, categories, ledger records, and pending recurring occurrences through the Prisma-backed dashboard data source.
- The dashboard E2E verifies confirmed income, confirmed expenses, at least one member-paid refundable expense, the reimbursement table, and pending recurring items.
- The fixture-only dashboard path remains available only for narrow smoke tests and is not counted as DB-backed coverage.
- The test setup documents how local data is reset or seeded before the DB-backed E2E run.
- The E2E can run under `pnpm test:e2e` or an explicitly documented DB-backed E2E command without requiring real Google OAuth.

## Experience Design Need
- experience_design_required: false
- reason: This is a verification completion slice for an existing dashboard experience; no new user-facing UI behavior is introduced.
- user_facing_surfaces: Existing homepage dashboard, monthly summary, records table, reimbursement table, pending recurring section.
- UX_risks: The E2E must verify real visible states without changing the current UI contract.

## Visual Model

- type: story_trace
- title: DB-Backed Dashboard E2E Completion Trace
- nodes:
  - id: outcome_monthly_confidence
    label: Monthly dashboard confidence from real data
    kind: business_outcome
  - id: event_report_generated
    label: Monthly report generated
    kind: domain_event
  - id: event_table_generated
    label: Monthly reimbursement table generated
    kind: domain_event
  - id: story_db_dashboard
    label: DB-backed dashboard E2E
    kind: story
  - id: code_dashboard_source
    label: Prisma dashboard data source
    kind: code_impact
  - id: code_playwright
    label: Playwright DB-backed test
    kind: code_impact
- edges:
  - from: event_report_generated
    to: story_db_dashboard
    label: traced by
  - from: event_table_generated
    to: story_db_dashboard
    label: traced by
  - from: story_db_dashboard
    to: outcome_monthly_confidence
    label: enables
  - from: story_db_dashboard
    to: code_dashboard_source
    label: exercises
  - from: story_db_dashboard
    to: code_playwright
    label: implemented by

## Priority
P0. This is the first completion slice because it reduces the fixture confidence gap and gives later create-record, reimbursement, and recurring workflows a real browser/database verification base.

## Dependencies
- Existing dashboard UI and data source.
- Existing E2E foundation.
- A local test database lifecycle decision before implementation. Recommended default for story refinement: isolated local Postgres database or schema with reset/seed before the DB-backed E2E run.

## Open Questions
- Should DB-backed E2E reuse the local Docker Postgres database with reset/seed, use a separate database/schema, or use a disposable Postgres instance?
- Should this coverage live under `pnpm test:e2e` by default or a separate command until DB setup is stable?

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm that this story is a completion slice for existing dashboard/report/reimbursement behavior.
  - Confirm the preferred local test database lifecycle before architecture/implementation.
- must_check:
  - Test data comes from Prisma, not `createE2eHomeDashboardData`.
  - Real Google OAuth is not required for this local-dev slice.
  - Seed/reset behavior cannot silently corrupt developer data.
- acceptance_signals:
  - Story can move to architecture planning or verification design with a specific DB lifecycle assumption.
- unresolved_blockers:
  - None for story slicing.
  - DB lifecycle must be resolved before implementation.
- next_step:
  - architecture-planner
