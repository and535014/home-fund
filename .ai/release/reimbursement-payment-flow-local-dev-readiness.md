---
id: reimbursement-payment-flow-local-dev-readiness
stage: target-aware-release
status: review
created_at: 2026-06-24
updated_at: 2026-06-24
release_target: local_dev
decision: ready_for_local_dev_review
review_gate: pending_user_review
reviewed_at:
trace_links:
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/prototype/reimbursement-payment-flow.md
  - .ai/spec/reimbursement-payment-flow.md
  - .ai/technical-design/reimbursement-payment-flow.md
  - .ai/implementation/reimbursement-payment-flow.md
  - .ai/verification/reimbursement-payment-flow.md
  - README.md
  - prisma/migrations/20260624172000_add_reimbursement_payments/migration.sql
  - src/modules/reimbursement/reimbursement-command.ts
  - src/modules/reimbursement/reimbursement-payment.ts
  - src/app/batch-refund-dialog.tsx
  - src/app/batch-delete-dialog.tsx
  - src/app/record-search-actions.ts
  - src/app/record-search-panel.tsx
  - src/app/ledger-record-actions.ts
---

# Reimbursement Payment Flow Local Dev Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: `local_dev`
- production_readiness: not assessed
- rationale: The reimbursement payment flow has passing schema validation, type-check, lint, full unit tests, full Playwright E2E, and E2E migration deployment for the local development target.

## Release Scope

Included for local dev review:

- Single-record refund requires payment method and date-only payment date before completing reimbursement.
- Single-record refund persists a `ReimbursementPayment` row linked to the created reimbursement batch.
- Batch refund uses a dedicated refund dialog instead of sharing the batch delete dialog.
- Batch refund form only exposes editable payment evidence fields.
- Batch refund blocks records that span multiple paid-to members and shows an alert.
- Refund total is visible in the batch refund dialog.
- `ReimbursementPayment` is stored separately from ordinary ledger income/expense records.
- README documents local dev DB reset flows.

Out of scope:

- Cross-member refund batches.
- Partial refunds.
- Split payment methods.
- Post-settlement edits.
- Corrections or reversals.
- External payment execution.
- Production deployment readiness.

## Local Dev Checks

| Check | Evidence | Status |
|---|---|---|
| Schema validation | `corepack pnpm db:validate` | pass |
| Type checking | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass |
| Unit/domain tests | `corepack pnpm test`, 40 files / 185 tests | pass |
| Full E2E | `corepack pnpm test:e2e`, 44 tests | pass |
| Migration application | E2E setup applied `20260624172000_add_reimbursement_payments` to `home_fund_e2e` | pass |
| Seed compatibility | E2E setup ran base seed and E2E seed after migration reset | pass |
| Working tree before release artifact | `git status --short` was clean after commit `b9d94fb` before this release artifact | pass |

## Local Dev Runtime Requirements

- Docker Desktop and local PostgreSQL must be available.
- Apply migrations before local review:
  - `corepack pnpm db:deploy`
- Refresh deterministic dev data when needed:
  - `corepack pnpm db:seed`
- Reset local dev DB when needed:
  - `corepack pnpm db:up`
  - `corepack pnpm exec prisma migrate reset`
  - `corepack pnpm db:seed`
- Start local app:
  - `corepack pnpm dev`
- Review routes:
  - `/`
  - `/search`

## Smoke Checks

Recommended local smoke after applying migrations and seed:

1. Open `/`.
2. Open an eligible member-paid reimbursement record.
3. Click `退款`.
4. Fill payment method, payment date, and optional note.
5. Confirm refund and verify the record becomes `已退款`.
6. Open `/search`.
7. Select refundable records that belong to the same paid-to member when available and confirm the dialog shows refund total.
8. Select refundable records that span different paid-to members and verify the dialog blocks confirmation with the warning.
9. Confirm batch delete uses its own delete dialog and does not show refund payment fields.

## Accepted Local Dev Risks

- Same-member batch refund success is covered by unit/server-action tests, but not by current E2E fixture data because current E2E refundable member-paid records span different payer members.
- Legacy reimbursement batches may not have `ReimbursementPayment`; this is expected and remains compatible.
- Payment evidence readback for already reimbursed records is intentionally minimal in this slice.
- E2E depends on Docker Desktop and local PostgreSQL availability.
- `NO_COLOR` warnings may appear during Playwright startup because of environment color settings; this did not block E2E.

## Not Production Ready

Production readiness remains blocked until these are selected and verified:

- Hosting target, database target, environment separation, and production secrets.
- Production migration rollout, rollback, and backup/restore expectations for `ReimbursementPayment`.
- Production Google OAuth smoke with real users and role coverage.
- Monitoring/logging and alerting for refund persistence failures.
- Operational policy for correcting, reversing, editing, or reconciling refund payment evidence.
- External money movement integration, if reimbursement payment execution is ever added.

## Review Gate

- Decision needed: approve, request changes, or block.
- Recommended next gate after approval: Learning Loop for local_dev feedback signals, or Artifact Compression if learning is explicitly skipped.
