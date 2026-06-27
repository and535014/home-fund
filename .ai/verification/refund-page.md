---
id: verification-refund-page
stage: verification
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - .ai/intent/refund-page.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/refund-page.md
  - .ai/prototype/refund-page.md
  - .ai/spec/refund-page.md
  - .ai/technical-design/refund-page.md
  - .ai/implementation/refund-page.md
  - commit:2fbed3a0 feat: add refunds page
outputs:
  - verification_result
  - test_evidence
  - traceability_check
  - residual_risks
trace_links:
  implementation_commit:
    - 2fbed3a0 feat: add refunds page
  production_route:
    - /refunds
  e2e:
    - e2e/refund-page.spec.ts
reviewed_at: 2026-06-27
---

# Refund Page Verification

## Result

- decision: pass_for_target_aware_release
- supported_release_target: production_candidate
- unsupported_claims:
  - live_production_deployed
  - production_smoke_passed
  - production_observability_verified
- reason: The implemented `/refunds` route, dashboard entry, desktop navigation entry, mobile navigation omission, member-scoped summaries, selection mode, shared detail dialogs, and shared batch refund validation have automated coverage and passed the verification commands below. Production operations still require Target-Aware Release checks.
- next_gate: Target-Aware Release for `production`.

## Verification Scope

Verified:

- Dedicated authenticated `/refunds` page.
- Home `待退款` action to `/refunds?month=<month>`.
- Desktop sidebar exposes `退款` below `搜尋`.
- Mobile bottom tab bar omits `退款`.
- Route-aware month switcher behavior.
- `全部` plus member scope tabs.
- Month/member-scoped unpaid expense and refund record read models.
- Unpaid/refunded section summaries using shared summary UI.
- Independent list areas through the refund page panel layout.
- Selection mode, selected count, selected amount, and batch refund dialog entry.
- Cross-member batch refund disabled state and warning.
- Shared record detail, refund record detail, linked-record dialog flow.
- Shared reimbursement payment edit permission wiring and action-state handling.
- Shared category/member query helpers.
- Reporting module cleanup: `reporting` now retains monthly report aggregation, while record search and reimbursement read models live under their owning domain modules.

Not verified by Verification alone:

- Live production deployment, observability, rollback, secrets, or external monitoring.
- Real-world bank transfer execution, because this slice records reimbursement payment evidence only.
- Full application regression suite beyond the focused tests listed below.

## Test Evidence

Passed on 2026-06-27:

```bash
corepack pnpm type-check
```

Result: passed. Prisma Client generated, TypeScript completed with no errors.

```bash
corepack pnpm vitest run \
  src/modules/reporting/monthly-report.test.ts \
  src/modules/fund-ledger/search/record-search-state.test.ts \
  src/modules/fund-ledger/search/record-search-query.test.ts \
  src/modules/reimbursement/reimbursement-payment-search-query.test.ts \
  src/modules/reimbursement/refund-page/refund-page-query.test.ts \
  src/app/month-switcher.test.tsx \
  src/app/_record-detail/record-detail-actions.test.ts \
  src/app/_record-detail/reimbursement-payment-dialogs.test.tsx \
  src/app/_reimbursement/batch-refund-client.test.ts \
  src/app/_reimbursement/batch-refund-action-result.test.ts \
  "src/app/(app)/search/_actions/record-search-actions.test.ts" \
  "src/app/(app)/refunds/_components/refund-page-panel.test.tsx"
```

Result: passed. 12 test files, 57 tests.

```bash
corepack pnpm lint
```

Result: passed. Prisma Client generated, ESLint completed with no errors.

```bash
corepack pnpm test:e2e e2e/refund-page.spec.ts
```

Result: passed. 3 Playwright tests:

- opens refunds from dashboard and keeps refund out of the mobile tab bar.
- filters refund page by member and reuses shared detail dialogs.
- shows selection summary and shared batch refund validation.

## Acceptance Criteria Trace

| Area | Evidence | Status |
|---|---|---|
| Authenticated `/refunds` route with title and month switcher | `src/app/(app)/refunds/page.tsx`, `src/app/month-switcher.test.tsx`, e2e route checks | Pass |
| Home refund entry | `e2e/refund-page.spec.ts` checks `前往退款` href `/refunds?month=2026-06` | Pass |
| Desktop sidebar entry below search | e2e checks desktop sidebar includes `/search` and `/refunds` | Pass |
| Mobile bottom tab omission | e2e mobile viewport checks primary mobile nav has no `退款` link | Pass |
| Member tabs and scope filtering | `refund-page-panel.test.tsx`, `refund-page-query.test.ts`, e2e member `Mei` filtering | Pass |
| Unpaid and refunded summaries | `refund-page-panel.test.tsx`, e2e summary assertions | Pass |
| Shared list row/detail behavior | `record-results-list.tsx`, `record-detail-flow.tsx`, e2e detail dialog assertions | Pass |
| Refund record detail and linked records | `reimbursement-payment-dialogs.test.tsx`, e2e refund detail dialog assertions | Pass |
| Selection summary and batch dialog | `refund-page-panel.test.tsx`, `batch-refund-client.test.ts`, e2e selection and dialog assertions | Pass |
| Server-side batch reimbursement semantics | `record-search-actions.test.ts`, `batch-refund-action-result.test.ts`, `batch-refund-client.test.ts`, refund page action wrapper review | Pass |
| Refund payment evidence not ordinary ledger totals | `monthly-report.test.ts`, reimbursement payment search/read model separation, domain trace review | Pass |
| Traditional Chinese / Taiwan copy | UI labels and tests use `退款`, `未退款`, `已退款`, `批次退款`, `付款方式`, `付款日期`, `交易備註` | Pass |

## Code Review Notes

- The refund page uses a real server read model instead of prototype fixtures.
- Batch refund from `/refunds` reuses the reimbursement command path and shared payment form parsing. The refund page has a route-owned action wrapper instead of importing the search route action.
- `RecordDetailFlowDialogs` centralizes ledger detail, refund record detail, and linked-record navigation, reducing duplicated dialog state across home/search/refunds.
- `FormSubmitButton` is now used only inside the relevant form context for refund-record edit and record detail submit actions.
- `src/modules/reporting` is no longer a catch-all for search/read-model queries. Ledger search moved to `src/modules/fund-ledger/search`; reimbursement payment search and refund page read models moved to `src/modules/reimbursement`.
- Technical design originally named `src/modules/reporting/refund-page-query.ts`; implementation deliberately moved it to `src/modules/reimbursement/refund-page/refund-page-query.ts` during architecture cleanup. This is aligned with locality because the read model is specific to reimbursement evidence and unpaid member-paid expenses.

## Prototype Gap Closure

Closed:

- Prototype fixture data replaced by Prisma-backed refund page read model.
- Prototype-only client completion replaced by refund-page server action.
- Batch refund dialog now uses existing payment evidence fields and shared validation.
- Unpaid expense rows and refund record rows reuse shared result list and shared detail flows.
- Route-aware month picker no longer submits back to dashboard when used from `/refunds`.
- Mobile layout now keeps the page container fixed and allows list regions to scroll inside their sections.

Remaining accepted gaps for production candidate:

- Refund page list pagination is not implemented. Technical Design accepted loading all month-scoped rows for the first implementation.
- `/reimbursements` redirect/404 policy remains out of scope.
- Production analytics/monitoring and learning instrumentation are evaluated in Target-Aware Release, not this verification artifact.

## Domain And Policy Check

- Refund records remain reimbursement payment evidence, not ordinary ledger income or expense records.
- Batch reimbursement remains an authorized reimbursement command; the UI selection is only temporary read-model state.
- Server action wrappers revalidate household scope, actor authorization, active status, reimbursement status, and same-paid-to-member policy through the existing command path.
- Device-specific navigation is presentation policy only. Mobile omission of `退款` does not replace route authentication or authorization.
- Member records used for refund page tabs come from the shared household member query so created members are available as active reporting options.

## Residual Risks

- The commit is broad because the refund page required shared detail-flow, batch-refund, month-switcher, and read-model cleanup. Focused tests pass, and full Vitest/build checks are covered in the production readiness artifact.
- The implementation artifact still records intermediate paths from earlier slices. The committed code is the source of truth for final file paths, and this verification artifact records the final architecture.
- E2E covers cross-member batch validation and dialog readback, but does not submit a successful same-member batch refund in browser. Server/client batch helpers and action tests cover command semantics; a future E2E can add a successful confirmation path if needed.

## Review Gate

- decision: pass_for_target_aware_release
- must_review:
  - Confirm the accepted residual risk that successful same-member browser submission is covered below full E2E depth by server/action/helper tests.
  - Confirm the architecture cleanup moving refund read models out of `reporting` is acceptable despite older technical-design path names.
  - Confirm no live production deployment readiness is implied by this verification alone.
- next_step:
  - Target-Aware Release for `production`.
