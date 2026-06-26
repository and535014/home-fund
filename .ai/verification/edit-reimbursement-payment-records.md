---
id: verification-edit-reimbursement-payment-records
stage: verification
status: review_with_findings
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-reimbursement-payment-records.md
  - .ai/domain-impact/edit-reimbursement-payment-records.md
  - .ai/prototype/edit-reimbursement-payment-records.md
  - .ai/spec/edit-reimbursement-payment-records.md
  - .ai/technical-design/edit-reimbursement-payment-records.md
  - .ai/implementation/edit-reimbursement-payment-records.md
outputs:
  - verification_evidence
  - findings
  - release_target_assessment
trace_links:
  production_routes:
    - /
    - /search
  verified_components:
    - src/app/_record-detail/reimbursement-payment-dialogs.tsx
    - src/app/_record-detail/reimbursement-payment-edit-actions.ts
    - src/app/(app)/search/_components/record-search-panel.tsx
    - src/app/_record-detail/record-list-detail.tsx
  verified_domain_modules:
    - src/modules/reimbursement/reimbursement-payment-corrections.ts
    - src/modules/identity-access/authorization.ts
  verified_persistence:
    - prisma/schema.prisma
    - prisma/migrations/20260627090000_add_reimbursement_payment_edit_metadata/migration.sql
reviewed_at: 2026-06-27
---

# Verification: Edit Reimbursement Payment Records

## Decision Summary

- decision: review_with_findings
- release_target_supported: partial local_dev only
- unit_integration_status: pass
- schema_status: pass
- migration_status: pass for local deploy and e2e fresh deploy
- e2e_status: failed due unstable E2E environment after Postgres connection termination
- implementation_alignment: matches approved behavior and technical design for the covered layers
- next_step: resolve or accept E2E finding before Target-Aware Release

## Verification Commands

| Command | Result | Notes |
|---|---|---|
| `corepack pnpm db:validate` | passed | Prisma schema valid. |
| `corepack pnpm type-check` | passed after sequential rerun | Initial parallel run raced on `prisma generate`; sequential rerun passed. |
| `corepack pnpm lint` | passed after sequential rerun | Initial parallel run raced on `prisma generate`; sequential rerun passed. |
| `corepack pnpm test` | passed | 52 test files / 248 tests. |
| `env DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund corepack pnpm db:deploy` | passed | Local DB had no pending migrations. |
| `npm run test:e2e` | failed | E2E setup applied all migrations, including `20260627090000_add_reimbursement_payment_edit_metadata`, then suite failed after Postgres connection termination. |
| `sh e2e/setup-db.sh` focused rerun precheck | failed | After the failed full E2E run, Docker daemon was unavailable. |

## E2E Evidence

The full E2E run successfully:

- created the E2E database.
- applied all 16 migrations, including the new reimbursement payment edit metadata migration.
- seeded base and E2E data.
- started the Playwright web server.
- passed the first 7 tests before the suite became unstable.

The first observed infrastructure error was:

- `DriverAdapterError: terminating connection due to administrator command`
- source path in stack: `src/auth/current-member-data-source.ts:91`
- later failures were mostly `net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/...`

This pattern indicates the E2E web server or database connection became unavailable after the Postgres termination event. The failures are broad across admin, auth, dashboard, and search specs, so they are not isolated to the refund-record edit feature. However, browser verification for this feature is still not complete.

## Behavior Verification

Covered by unit/integration tests:

- Admin and finance manager can use the new `edit_reimbursement_payment` permission.
- General member is rejected for reimbursement payment editing.
- Correction validation accepts valid payment date, method, and note.
- Blank note normalizes to `null`.
- Unsupported payment method and invalid date are rejected.
- Server action updates only `method`, `paidOn`, `note`, `editedAt`, and `editedByMemberId`.
- Cross-household payment IDs return `not_found` and do not mutate.
- Invalid input returns field errors and does not mutate.
- Successful action returns mapped reimbursement payment readback.

Covered by code review:

- Edit dialog remains a separate dialog.
- Edit form exposes `付款日期`, `付款方式`, and `備註`.
- Note placeholder matches the reimbursement capture form.
- Edit dialog uses `useActionState`, `useActionStateEffect`, and `FormSubmitButton`.
- Pending state disables fields, cancel, close, and submit.
- Success toast remains `退款紀錄已更新`.
- UI edit affordance is controlled by server-derived authorization state on `/search`.
- Server action remains authoritative for authorization.

Not covered by passing E2E yet:

- Browser happy path for saving edited refund evidence.
- Browser cancel path.
- Browser general-member no-edit affordance.
- Mobile edit dialog layout.

## Findings

1. E2E verification is incomplete.
   - Severity: blocking for full local_dev browser confidence.
   - Evidence: `npm run test:e2e` failed after Postgres connection termination and later server connection refused errors.
   - Impact: The implementation has unit/integration confidence but not browser-level proof for the new edit flow.
   - Recommended action: rerun focused E2E once Docker/Postgres is stable, and add/enable browser scenarios for edit success, cancel, and unauthorized UI.

2. The project E2E harness resets the database during tests while the web server has active Prisma connections.
   - Severity: medium.
   - Evidence: first failure was `terminating connection due to administrator command`.
   - Impact: Full-suite E2E reliability may be limited independent of this feature.
   - Recommended action: review E2E fixture reset strategy or ensure server/client connections recover after each database reset.

## Release Target Assessment

This result supports partial `local_dev` readiness for code-level behavior, schema validity, and local migration shape.

It does not support full `local_dev` release readiness until E2E browser coverage is either:

- rerun successfully in a stable Docker/Postgres environment, or
- explicitly accepted as risk for this local_dev slice.

## Review Gate

- decision: review_with_findings
- reviewer_focus:
  - Decide whether to fix E2E harness instability now or accept browser verification risk temporarily.
  - Decide whether to add focused refund-record edit E2E before Target-Aware Release.
  - Confirm partial local_dev verification is enough to continue.
- must_check:
  - Do not claim production or preview readiness from this verification.
  - Do not proceed to Target-Aware Release as passed without addressing or accepting the E2E finding.
- next_step:
  - Resolve/accept E2E finding, then Target-Aware Release for `local_dev`.
