---
id: cu-home-family-fund
stage: code-understanding
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-home-family-fund
  - idea-home-family-fund
  - project
outputs:
  - repo_map
  - observed_boundaries
  - test_landscape
  - domain_language_gap
trace_links:
  ddd_artifacts:
    - .ai/domain/home-family-fund.md
    - .ai/intent/home-family-fund.md
    - .ai/project-context.md
  source_files:
    - package.json
    - prisma/schema.prisma
    - src/app/page.tsx
    - src/app/ledger-record-actions.ts
    - src/app/home-dashboard-data-source.ts
    - src/auth/server-current-member.ts
    - src/db/prisma.ts
    - src/modules/identity-access/authorization.ts
    - src/modules/fund-ledger/ledger-record-command.ts
    - src/modules/reporting/monthly-report.ts
    - src/modules/reimbursement/reimbursements.ts
    - e2e/home.spec.ts
  docs:
    - README.md
reviewed_at: 2026-06-07
---

# Code Understanding for Home Family Fund

## Delivery Profile
This analysis inherits `delivery_profile: mvp` and `release_target: local_dev` from `.ai/project-context.md`, `.ai/intent/home-family-fund.md`, and `.ai/domain/home-family-fund.md`. The current code map focuses on local development behavior, not production readiness, external OAuth smoke, backup/restore, or observability.

## Repository State
Observed fact: this is an existing system, not an empty or scaffold-only repo. Evidence includes a Next.js application in `src/app/`, domain modules in `src/modules/`, auth and Prisma infrastructure in `src/auth/` and `src/db/`, a PostgreSQL Prisma schema in `prisma/schema.prisma`, Vitest unit tests beside modules, and Playwright E2E coverage in `e2e/home.spec.ts`.

Observed fact: `.ai/` already contains idea, DDD, stories, experience design, architecture, verification design, implementation, verification, workflow, and project context artifacts. This code-understanding artifact fills the previously empty `.ai/code-understanding/` stage.

Observed fact: Graphify CLI is installed according to `.ai/project-context.md`, but no `graphify-out/` output exists. This artifact is based on manual source inspection.

## Technology and Tooling
| Tooling | Observed Use | Evidence |
|---|---|---|
| Next.js / React / TypeScript | App Router pages, server actions, route handlers, typed React UI | `package.json`, `src/app/page.tsx`, `src/app/ledger-record-actions.ts` |
| Prisma / PostgreSQL | Domain and Better Auth persistence schema, generated client under `src/generated/prisma` | `prisma/schema.prisma`, `src/db/prisma.ts` |
| Better Auth / Google OAuth | Session lookup and Google sign-in route integration | `src/auth/index.ts`, `src/auth/server-current-member.ts`, `src/app/auth/google/route.ts` |
| Vitest | Unit and integration-style module tests | `package.json`, `src/**/*.test.ts` |
| Playwright | Browser smoke tests for access gate, dashboard, and mobile overflow | `playwright.config.ts`, `e2e/home.spec.ts` |
| Tailwind / UI components / lucide-react | Dark-first UI shell and reusable shadcn-style primitives | `src/app/globals.css`, `src/components/ui/*`, `src/app/home-dashboard-layout.tsx` |

## Current Structure
| Area | Path / Module | Responsibility | Evidence |
|---|---|---|---|
| App shell and routes | `src/app/` | Homepage access gate, dashboard rendering, create-record form/dialog, server action, auth route entry | `src/app/page.tsx`, `src/app/ledger-record-actions.ts`, `src/app/auth/google/route.ts` |
| Identity and access | `src/modules/identity-access/`, `src/auth/` | Role/capability authorization, Google session identity mapping, current-member resolution, Better Auth config/adapter | `src/modules/identity-access/authorization.ts`, `src/auth/server-current-member.ts` |
| Fund ledger | `src/modules/fund-ledger/` | Pure ledger record rules and DB-backed create command wrapper | `src/modules/fund-ledger/ledger-records.ts`, `src/modules/fund-ledger/ledger-record-command.ts` |
| Categorization | `src/modules/categorization/` | Category catalog rules and active/archived category language | `src/modules/categorization/category-catalog.ts` |
| Recurring schedule | `src/modules/recurring-schedule/` | Recurring events, immediate posting, pending reminders, duplicate occurrence prevention | `src/modules/recurring-schedule/recurring-rules.ts` |
| Reimbursement | `src/modules/reimbursement/` | Reimbursement read table and one-time mark-reimbursed rule | `src/modules/reimbursement/reimbursement-table.ts`, `src/modules/reimbursement/reimbursements.ts` |
| Reporting | `src/modules/reporting/` | Derived monthly report totals, category summaries, pending items, reimbursement summary | `src/modules/reporting/monthly-report.ts` |
| Persistence | `prisma/schema.prisma`, `src/db/prisma.ts` | Household domain tables and Better Auth tables using PostgreSQL | `prisma/schema.prisma`, `src/db/prisma.ts` |
| Browser verification | `e2e/` | Local browser smoke coverage using E2E-only header fixture | `e2e/home.spec.ts`, `src/auth/server-current-member.ts` |

## Observed Boundaries and Data Ownership
| Boundary / Module | Owns | Collaborates With | Evidence |
|---|---|---|---|
| Identity and Access | `Member`, roles, capabilities, current session-to-member mapping, authorization decisions | Auth adapter, every command module, app access gate | `src/modules/identity-access/authorization.ts`, `src/auth/current-member.ts`, `src/auth/server-current-member.ts` |
| Fund Ledger | `LedgerRecord` command rules and Prisma create wrapper | Identity for authorization, Categorization for valid categories, Reporting/Reimbursement as downstream readers | `src/modules/fund-ledger/ledger-records.ts`, `src/modules/fund-ledger/ledger-record-command.ts` |
| Categorization | Category type/status rules | Ledger validation, Reporting category names | `src/modules/categorization/category-catalog.ts`, `src/app/home-dashboard-data-source.ts` |
| Recurring Schedule | `RecurringEvent`, `RecurringOccurrence`, posting mode | Ledger command creation, Reporting pending items | `src/modules/recurring-schedule/recurring-rules.ts`, `prisma/schema.prisma` |
| Reimbursement | Refundable member-paid expense grouping and reimbursement state transition | Ledger expense records, Identity finance-manager authorization, Reporting summary | `src/modules/reimbursement/reimbursement-table.ts`, `src/modules/reimbursement/reimbursements.ts` |
| Reporting | Derived monthly read model, not persisted report state | Ledger, Categories, Recurring, Reimbursement | `src/modules/reporting/monthly-report.ts`, `src/app/home-access.ts` |
| App/UI | Routing, forms, dashboard layout, visual state, E2E fixture entry | Auth/current member, dashboard data source, domain read models, server actions | `src/app/page.tsx`, `src/app/home-dashboard-layout.tsx`, `src/app/record-entry-panel.tsx` |
| Prisma persistence | Relational data model for household and Better Auth | Auth adapter, dashboard data source, ledger command persistence | `prisma/schema.prisma`, `src/db/prisma.ts` |

## Existing Domain Language
| Code Term | DDD Term | Match / Gap | Notes |
|---|---|---|---|
| `Household`, `Member`, `MemberRole`, `MemberCapability` | Household, Member, Admin, Finance manager, General member | Match | Prisma and authorization terms align with DDD language. |
| `createdByMemberId` | Record owner | Partial match | Code uses creator terminology; DDD uses record owner for edit/delete rights. Impact analysis should remember these are the same current concept. |
| `sourceMemberId` | Payer/source member for income | Partial match | Clear in code for income, but DDD "payer member" language can be broader. |
| `paymentSource: fund/member`, `payerMemberId` | Fund-paid expense, member-paid expense, payer member | Match | Matches reimbursement and ledger rules. |
| `reimbursementStatus: refundable/reimbursed/not_refundable` | Refundable expense, reimbursed expense | Match | Code expresses one-time reimbursement state directly on ledger records. |
| `RecurringOccurrence.status: pending/posted/skipped` | Pending recurring item, immediate/reminder posting | Match with extra state | `skipped` exists in schema and mapper but is not central in current MVP UI. |
| `MonthlyReport`, `MonthlyReimbursementTable` | Monthly report, reimbursement table | Match | Reporting is derived in memory from source records, not persisted. |
| `E2E current member` / `x-e2e-current-member-email` | No DDD term | Intentional test-only gap | Non-production testing fixture, not product language. |
| `DEFAULT_HOUSEHOLD_ID = household-demo` | Single household assumption | Gap / local shortcut | DB-backed command wrappers currently default to demo household id. Multi-household impact would be cross-cutting. |

## Test Landscape
| Test Type | Location / Command | Coverage Notes |
|---|---|---|
| Unit/domain tests | `corepack pnpm test`, `src/modules/**/*.test.ts` | Covers authorization, member management, categories, ledger records/commands/corrections, recurring events, reimbursement, reports. |
| App/auth/data-source tests | `corepack pnpm test`, `src/app/*.test.ts`, `src/auth/*.test.ts`, `src/db/prisma.test.ts` | Covers home access composition, dashboard data mapping, form parsing, month selection, Better Auth config, current member resolution, Prisma runtime setup. |
| E2E smoke tests | `pnpm test:e2e`, `e2e/home.spec.ts` | Covers unauthenticated gate, auth error alert, dashboard fixture rendering, and mobile horizontal overflow. Uses a non-production header-based current-member fixture. |
| Static checks | `corepack pnpm type-check`, `corepack pnpm lint` | Both run Prisma generation first according to `package.json`. |
| Build | `corepack pnpm build` | Next production build compiles dynamic `/`, `/api/auth/[...all]`, `/auth/google`, and static `/records/new`. |

## Data Flow
Observed fact: read-side homepage flow is `src/app/page.tsx` -> `getCurrentMemberFromHeaders` -> `createHomeDashboardDataSource(getPrismaClient()).getMonthlyDashboardData(month)` -> `buildHomeAccessViewFromAccess` -> reimbursement/reporting read models -> dashboard UI.

Observed fact: create-record write flow is `RecordEntryPanel` form -> `createLedgerRecordAction` -> `parseCreateLedgerRecordForm` -> `getCurrentMemberFromHeaders` -> `createLedgerRecordInDatabase` -> pure ledger command validation -> Prisma `ledgerRecord.create` -> redirect with query feedback.

Observed fact: E2E currently can bypass real Better Auth and database-backed dashboard reads only when `NODE_ENV !== "production"` and a request includes `x-e2e-current-member-email`.

## Inferences
- The codebase is organized around DDD bounded-context candidates, with pure domain modules generally separated from Next/Prisma integration wrappers.
- Read models are currently computed in app memory from Prisma rows and pure module functions; there is no separate persisted report table.
- Persistence is still single-household biased in write wrappers because `createLedgerRecordInDatabase` defaults to `household-demo`.
- The most reliable next impact analysis should focus on gaps between pure domain coverage and integrated browser/database workflows, especially real auth/session/database E2E and deployment readiness.

## Unknowns and Risks
- Real Google OAuth redirect/callback behavior has not been manually or browser-automated in current evidence.
- DB-backed E2E for dashboard reads, record creation, and reimbursement mutation is not present; E2E dashboard coverage uses fixture data.
- Production deployment target, environment variable management, connection pooling, migrations, observability, and rollback are not documented in `.ai/release/`.
- Multi-household behavior is not implemented as a first-class runtime concern even though the schema includes `householdId`.
- Category management, recurring event management, member management, ledger corrections, and reimbursement settlement have domain coverage but limited or no complete UI mutation workflows observed in the inspected app routes.
- Graphify output is absent; manual inspection is sufficient for this artifact, but Graphify could accelerate future repo-wide dependency queries.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm that the mapped boundaries match the intended bounded contexts before impact analysis.
  - Confirm that `record owner` and `createdByMemberId` are acceptable as the same current implementation concept.
  - Confirm whether local single-household shortcuts should be treated as MVP assumptions or impact risks.
- must_check:
  - App/UI, auth, Prisma, and pure domain modules are separated correctly in this map.
  - Test landscape distinguishes fixture E2E from real DB/OAuth coverage.
  - Unknowns are explicit enough to guide impact analysis.
- acceptance_signals:
  - Impact analysis can use this artifact to identify affected modules for DB-backed E2E, deployment readiness, or a new vertical feature.
  - Domain language gaps are visible without redesigning the architecture here.
- unresolved_blockers:
  - None for moving to impact analysis.
- next_step:
  - impact-analysis
