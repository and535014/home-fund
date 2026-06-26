---
id: edit-reimbursement-payment-records-production-readiness
stage: target-aware-release
status: ready_for_release_execution_with_controls
created_at: 2026-06-27
updated_at: 2026-06-27
release_target: production
decision: ready_for_production_release_execution_with_required_evidence_controls
review_gate: pending_user_review
reviewed_at:
trace_links:
  - .ai/intent/edit-reimbursement-payment-records.md
  - .ai/domain-impact/edit-reimbursement-payment-records.md
  - .ai/prototype/edit-reimbursement-payment-records.md
  - .ai/spec/edit-reimbursement-payment-records.md
  - .ai/technical-design/edit-reimbursement-payment-records.md
  - .ai/implementation/edit-reimbursement-payment-records.md
  - .ai/verification/edit-reimbursement-payment-records.md
  - .ai/deployment/production-v0.1.2-2026-06-26.md
  - .ai/release/github-actions-vercel-neon-deployment-readiness.md
  - prisma/migrations/20260627090000_add_reimbursement_payment_edit_metadata/migration.sql
  - src/app/_record-detail/reimbursement-payment-dialogs.tsx
  - src/app/_record-detail/reimbursement-payment-edit-actions.ts
  - src/app/(app)/search/_components/record-search-panel.tsx
  - src/app/_record-detail/record-list-detail.tsx
  - src/modules/reimbursement/reimbursement-payment-corrections.ts
  - src/modules/identity-access/authorization.ts
---

# Edit Reimbursement Payment Records Production Readiness

## Decision

- decision: ready_for_production_release_execution_with_required_evidence_controls
- release_target_supported: production release execution
- current_production_state: project is recorded as deployed to production in `.ai/deployment/production-v0.1.2-2026-06-26.md`
- rationale: this feature changes production database schema and financial evidence editing behavior. Code-level checks, production build, E2E migration setup, and focused browser coverage now pass. Production deployment can move to release execution, but the deployment record must still capture production URL, CI/CD run, Vercel deployment, smoke checks, logs, backup/restore expectation, and rollback owner before the release is treated as fully audited.

## Release Scope

Included in this production readiness assessment:

- Authorized refund-record edit action from refund record detail.
- Separate `編輯退款紀錄` dialog.
- Editable fields limited to `付款日期`, `付款方式`, and `備註`.
- Shared reimbursement payment method options.
- Server-side authorization through `edit_reimbursement_payment`.
- Server-side validation for payment date and payment method.
- Household-scoped update of existing `ReimbursementPayment`.
- Correction metadata: `editedAt` and `editedByMemberId`.
- Success toast: `退款紀錄已更新`.
- Project form pattern: `useActionState`, `useActionStateEffect`, and `FormSubmitButton`.
- Pending state disables inputs, cancel, close, and submit.

Out of scope:

- Editing refund amount, paid-to member, paid-from source, linked ledger records, reimbursement batch, recorded-by actor, or reimbursed state.
- Full correction history table.
- Reversing, deleting, splitting, or reissuing reimbursement payments.
- Executing production deployment from this local thread.

## Production Readiness Checks

| Check | Evidence | Status |
|---|---|---|
| Schema validation | `corepack pnpm db:validate` | pass |
| Type checking | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass |
| Unit/integration tests | `corepack pnpm test`, 52 files / 248 tests | pass |
| Production build | `corepack pnpm build` | pass |
| Local migration deployment | `env DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund corepack pnpm db:deploy` | pass |
| E2E migration application | `npm run test:e2e` applied all migrations to `home_fund_e2e`, including `20260627090000_add_reimbursement_payment_edit_metadata` | pass |
| Full E2E browser suite | `npm run test:e2e`, 7 passed / 36 failed / 12 skipped | fail |
| Focused E2E scenarios | `corepack pnpm test:e2e -- e2e/record-search.spec.ts -g "reimbursement payment"` | pass, 15 passed |
| Focused E2E edit success | `e2e/record-search.spec.ts` | pass |
| Focused E2E cancel path | `e2e/record-search.spec.ts` | pass |
| Focused E2E general-member no-edit affordance | `e2e/record-search.spec.ts` | pass |
| Production URL | `.ai/deployment/production-v0.1.2-2026-06-26.md` | pending |
| GitHub Actions run URL | `.ai/deployment/production-v0.1.2-2026-06-26.md` | pending |
| Vercel deployment URL | `.ai/deployment/production-v0.1.2-2026-06-26.md` | pending |
| Production smoke checklist | `.ai/deployment/production-v0.1.2-2026-06-26.md` | pending |
| Production backup/restore evidence | deployment record evidence gaps | pending |
| Monitoring/error reporting | deployment record evidence gaps | pending |

## Required Release Execution Evidence

### 1. Production Deployment Evidence Is Still Incomplete

- severity: release execution required evidence
- evidence source: `.ai/deployment/production-v0.1.2-2026-06-26.md`
- missing: production URL, GitHub Actions run URL, Vercel deployment URL, smoke checklist result, OAuth smoke, monitoring/log review, backup/restore evidence

Required during production release execution:

1. Record production URL.
2. Record GitHub Actions run URL for the deployment commit/tag.
3. Record Vercel deployment URL.
4. Confirm production smoke checks:
   - `/login` renders.
   - Google sign-in starts from production origin.
   - Admin member reaches dashboard.
   - General member cannot access admin-only routes.
   - Main `/search` path can read data.
   - Refund-record edit path works for authorized role.
   - General member cannot edit refund records.
5. Confirm Vercel runtime logs have no repeated errors after smoke.
6. Confirm Neon backup/restore or point-in-time recovery expectation before applying production migration.

### 2. Production Migration Risk Needs Explicit Handling

- severity: release execution required evidence
- migration: `20260627090000_add_reimbursement_payment_edit_metadata`
- schema change: nullable `editedAt`, nullable `editedByMemberId`, FK to `Member`
- risk level: low-to-moderate because columns are nullable and backward-compatible, but still touches production financial evidence table

Required during production release execution:

1. Confirm production migration runs through CI/CD, not local machine.
2. Confirm migration uses production unpooled/direct database URL if configured.
3. Confirm rollback path: app rollback via Vercel; database rollback via Neon backup/restore or forward migration.

## Production Runtime Requirements

- GitHub Actions production workflow must deploy immutable tag or approved manual version input.
- Production deployment must run `corepack pnpm db:deploy`.
- Vercel production environment variables must be configured.
- Neon production database must be reachable by migration and runtime.
- Google OAuth production callback must match production origin.
- Production logs must be available for smoke review.

## Required Production Smoke

After deploying this feature to production:

1. Open production `/login`.
2. Start Google sign-in from production origin.
3. Sign in as admin or finance manager.
4. Open `/search`.
5. Switch to `退款紀錄`.
6. Search `退款紀錄`.
7. Open a refund record.
8. Confirm `編輯` is visible.
9. Open `編輯退款紀錄`.
10. Confirm editable fields are only `付款日期`, `付款方式`, and `備註`.
11. Save a safe test change and confirm toast `退款紀錄已更新`.
12. Confirm readback updates and monthly totals are unchanged.
13. Sign in as a general member and confirm `編輯` is absent.
14. Check Vercel runtime logs for errors.

## Ready For Release Execution

Hand off to `release-execution` for production deployment.

Release execution must not mark the deployment fully audited until the production URL, CI/CD run, Vercel deployment, smoke checks, logs, backup/restore expectation, and rollback owner are recorded.

## Review Gate

- decision: ready_for_production_release_execution_with_required_evidence_controls
- reviewer_focus:
  - Confirm production is the correct target.
  - Confirm focused E2E coverage is sufficient for this feature.
  - Confirm production deployment evidence gaps must be closed during release execution.
  - Confirm migration rollback/backup expectations for production.
- recommended_next_gate:
  - Release Execution for `production`.
