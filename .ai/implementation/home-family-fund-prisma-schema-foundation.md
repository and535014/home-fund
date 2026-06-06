---
id: impl-home-family-fund-prisma-schema-foundation
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - arch-home-family-fund
  - impl-home-family-fund-ledger-entry-creation
  - impl-home-family-fund-reimbursement-settlement
  - impl-home-family-fund-reimbursement-table-read-model
  - impl-home-family-fund-category-management
outputs:
  - prisma_schema
  - validation_scripts
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC3
    - AC7
    - AC8
    - AC9
    - AC10
    - AC11
    - AC12
    - AC13
    - AC14
    - AC15
    - AC16
    - AC17
  architecture_decisions:
    - ADR-3
    - ADR-4
    - ADR-5
    - ADR-6
    - ADR-7
    - ADR-10
    - ADR-12
reviewed_at:
---

# Implementation Log for Prisma Schema Foundation

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice introduces the first Prisma 7 schema foundation for the accepted Next.js + Vercel + Neon Postgres + Prisma stack. It defines persistence structure only; it does not create migrations, connect to a real database, generate client code, or implement repository/command handlers.

## TDD / Verification Cycles
| Cycle | Test or Check Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `corepack pnpm db:format` | Failed because Prisma 7 no longer supports datasource `url` inside `schema.prisma` | Added `prisma.config.ts` and moved `DATABASE_URL` config there | Aligns with installed Prisma 7.8.0 behavior. |
| 2 | `corepack pnpm db:validate` with temporary local `DATABASE_URL` | Passed | Added schema models and enums for household, members, roles/capabilities, categories, ledger records, recurring rules/occurrences, and reimbursement batches/items | No database connection was made. |
| 3 | Schema/domain alignment review | Adjusted | Replaced category global unique constraint with an index | Domain only forbids duplicate active names; partial unique index can be revisited during migration design if needed. |

## Coding Summary
- Added `prisma/schema.prisma` using Postgres provider and Prisma 7 config style.
- Added `prisma.config.ts` with schema path, migration path, and `DATABASE_URL` datasource config.
- Added `.env.example` documenting the required database URL shape.
- Added `db:validate` and `db:format` scripts.
- Modeled app-owned identity state: household, member, Google account mapping fields, member roles, and member capabilities.
- Modeled category lifecycle with type and active/archived status.
- Modeled ledger records with record type, category, creator, source/payer member fields, payment source, and reimbursement status.
- Modeled recurring rules and occurrences with idempotency by rule/month.
- Modeled reimbursement batches and items with a unique ledger-record item link to prevent double settlement at persistence level.

## Refactor Summary
- No runtime refactor was performed. Existing domain modules remain pure and do not import Prisma.

## Deviations
- No migration files were generated because no real Neon/Postgres database target is configured yet.
- Category duplicate-active-name enforcement remains application/domain validation. Prisma schema indexes name/type/status for query support, but does not express a partial unique index.
- Fund-balance accounting for reimbursement remains deferred; reimbursement is status-only plus optional batch trace.
- Better Auth tables are not modeled yet because Google OAuth/session implementation has not started.

## Remaining Risks
- Prisma 7 client generation and runtime adapter setup need a dedicated slice before persistence code is written.
- Migration design must decide whether to add custom SQL for partial uniqueness, check constraints, and stricter ledger invariants.
- Month is represented as a `String` on recurring occurrences for now; database check constraints can be added later if needed.
- Production readiness still needs Neon connection/pooling, migration deploy policy, backups, restore, spend limits, and rollback plan.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm schema fields reflect current domain language and do not overcommit unresolved accounting behavior.
  - Confirm Prisma 7 config style is acceptable for the project.
- must_check:
  - Domain modules remain persistence-agnostic.
  - Reimbursement double-settlement has a persistence-level guard.
  - Category archive semantics do not break historical ledger references.
- acceptance_signals:
  - `db:format` and `db:validate` pass with a temporary local `DATABASE_URL`.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
