---
id: implementation-refund-page
stage: tdd-implementation
status: in_progress
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/refund-page.md
  - .ai/technical-design/refund-page.md
  - .ai/prototype/refund-page.md
  - .ai/domain-impact/refund-page.md
outputs:
  - tdd_evidence
  - implementation_delta
trace_links:
  behavior_spec:
    - .ai/spec/refund-page.md
  technical_design:
    - .ai/technical-design/refund-page.md
reviewed_at: 2026-06-27
---

# Refund Page TDD Implementation

## Status

- decision: in_progress
- current_slice: navigation/component/e2e coverage
- next_slice: verification gate

## Completed TDD Slices

### Shared month navigation

Trace:

- AC 3: `/refunds` page header includes the existing month switcher pattern.
- AC 4: Month switcher links stay on `/refunds?month=YYYY-MM`.
- Technical Design: Shared Month Navigation Refactor.

Tests first:

- `src/app/month-switcher.test.tsx`

Implementation:

- `src/app/month-switcher.tsx`
  - exported `buildMonthHref`.
  - passes `hrefPath` to `MonthPickerDialog`.
- `src/app/month-picker-dialog.tsx`
  - accepts `hrefPath`.
  - uses `hrefPath` as the form action.
  - changed screen-reader description from month-report-specific copy to generic month copy.

Evidence:

- `corepack pnpm vitest run src/app/month-switcher.test.tsx`

### Record detail action access

Trace:

- AC 40: Activating an unpaid expense row opens the existing `RecordDetailDialog`.
- AC 41: The unpaid expense detail dialog shows existing edit, delete, and refund actions according to actor permissions and record eligibility.
- Technical Design: Shared Record Detail Flow Refactor.

Tests first:

- `src/app/_record-detail/record-detail-actions.test.ts`

Implementation:

- `src/app/_record-detail/record-detail-actions.ts`
  - extracted `recordActionAccess`.
  - exported `RecordDetailActionAccess`.
- `src/app/_record-detail/record-detail-ui.tsx`
  - imports the shared access type.
- `src/app/_record-detail/record-list-detail.tsx`
  - imports the shared access helper instead of owning a private copy.

Evidence:

- `corepack pnpm vitest run src/app/month-switcher.test.tsx src/app/_record-detail/record-detail-actions.test.ts`

### Refund record detail dialog characterization

Trace:

- AC 42: Activating a refund record row opens the existing `ReimbursementPaymentDetailDialog`.
- AC 44: Refund record detail shows the existing `查看關聯紀錄` action.
- Technical Design: Shared Refund Record Dialog Cleanup.

Tests first:

- `src/app/_record-detail/reimbursement-payment-dialogs.test.tsx`

Implementation:

- Added jsdom characterization coverage for refund payment evidence fields, edit visibility through `canEdit`, and linked-record callback behavior.
- Mocked the server edit action in the dialog test so UI behavior can be characterized without loading `server-only`.

Evidence:

- `corepack pnpm vitest run src/app/_record-detail/reimbursement-payment-dialogs.test.tsx`

### Shared batch reimbursement client helper

Trace:

- AC 52-56: Batch refund opens the existing confirmation dialog, shows processed/skipped/total values, enforces same-paid-to-member preview, and reads payment evidence fields.
- Technical Design: Shared Batch Reimbursement Refactor.

Tests first:

- `src/app/_reimbursement/batch-refund-client.test.ts`

Implementation:

- `src/app/_reimbursement/batch-refund-client.ts`
  - added `getBatchRefundDialogState`.
  - added `canBatchReimburseRecord`.
  - added `readBatchRefundPaymentFormData`.
  - added `sumRecordAmounts`.
- `src/app/(app)/search/_components/batch-refund-dialog.tsx`
  - now uses `getBatchRefundDialogState`.
- `src/app/(app)/search/_components/record-search-panel.tsx`
  - now uses `readBatchRefundPaymentFormData`.
- `src/app/(app)/search/_lib/record-search-batch-utils.ts`
  - re-exports shared reimbursement helpers for existing search footer imports.

Evidence:

- `corepack pnpm vitest run src/app/_reimbursement/batch-refund-client.test.ts src/app/_record-detail/reimbursement-payment-dialogs.test.tsx src/app/_record-detail/record-detail-actions.test.ts src/app/month-switcher.test.tsx`

### Shared batch reimbursement action result helper

Trace:

- AC 57-60: Batch refund from `/refunds` must use the same server command semantics and error handling as `/search`.
- Technical Design: Shared Batch Reimbursement Refactor.

Tests first:

- `src/app/_reimbursement/batch-refund-action-result.test.ts`

Implementation:

- `src/app/_reimbursement/batch-refund-action-result.ts`
  - added `isPaymentErrorReason`.
  - added `messageForPaymentError`.
  - added `messageForBatchRefundError`.
- `src/app/(app)/search/_actions/record-search-actions.ts`
  - now imports shared batch refund message helpers instead of owning private copies.

Evidence:

- `corepack pnpm vitest run src/app/_reimbursement/batch-refund-action-result.test.ts 'src/app/(app)/search/_actions/record-search-actions.test.ts'`

### Shared record detail flow extraction

Trace:

- AC 40-44: Refund page unpaid expenses and refund records must open the existing record/refund detail dialogs.
- Technical Design: Shared Record Detail Flow Refactor and Shared Refund Record Dialog Cleanup.

Implementation:

- `src/app/_record-detail/record-detail-dialog.tsx`
  - moved the existing record detail/edit/delete/refund dialog implementation out of the list component.
- `src/app/_record-detail/record-detail-flow.tsx`
  - added `useRecordDetailFlow` for selected ledger record, linked record, refund payment, pending state, and refresh coordination.
  - added `RecordDetailFlowDialogs` to render `RecordDetailDialog`, `ReimbursementPaymentDetailDialog`, and `LinkedRecordsDialog` from one shared place.
  - supports injected reimbursement-payment loading and update sync so search can keep its readback cache.
- `src/app/_record-detail/record-list-detail.tsx`
  - now owns only list rendering and infinite-load observation.
  - delegates all record/payment dialog behavior to the shared flow.
- `src/app/(app)/search/_components/record-search-panel.tsx`
  - now uses the shared flow while preserving reimbursement-payment readback caching and refresh behavior.
- `src/app/(app)/refunds/_components/refund-page-panel.tsx`
  - now uses the shared flow for unpaid expense detail, refund record detail, and linked-record detail navigation.

Evidence:

- `corepack pnpm type-check`
- `corepack pnpm vitest run src/app/month-switcher.test.tsx src/app/_record-detail/record-detail-actions.test.ts src/app/_record-detail/reimbursement-payment-dialogs.test.tsx src/app/_reimbursement/batch-refund-client.test.ts src/app/_reimbursement/batch-refund-action-result.test.ts 'src/app/(app)/search/_actions/record-search-actions.test.ts'`
- `corepack pnpm lint`

### Production refund page read model and route action

Trace:

- AC 5-6: The refund page uses the selected month and the shared default-month policy.
- AC 13-16: Member tabs filter unpaid expenses, refund records, and summaries.
- AC 19-39: The page displays real unpaid expense rows and refund record rows using shared search row components.
- AC 61-63: Refund records are loaded as reimbursement payment evidence and do not affect ordinary ledger totals.
- Technical Design: `src/modules/reporting/refund-page-query.ts` and `src/app/(app)/refunds/_actions/refund-page-actions.ts`.

Tests first:

- `src/modules/reporting/refund-page-query.test.ts`

Implementation:

- `src/modules/reporting/refund-page-query.ts`
  - added month-scoped unpaid expense predicates using `occurredOn`.
  - added month-scoped refund payment predicates using `paidOn`.
  - loads active member tabs, categories, unpaid ledger records, refund payment records, and summary totals.
- `src/app/(app)/refunds/_actions/refund-page-actions.ts`
  - added `loadRefundPageDataAction`.
  - uses authenticated household scope and `browse_household_records`.
  - exposes `canEditReimbursementPayments` from the existing `edit_reimbursement_payment` authorization policy.
- `src/app/(app)/refunds/page.tsx`
  - now uses `readDashboardMonth` instead of a route-local fixed month fallback.
  - loads real refund page data and passes it to the panel.
- `src/app/(app)/refunds/_components/refund-page-panel.tsx`
  - replaced prototype fixtures with read-model props.
  - keeps local member-tab filtering and selection behavior.

Evidence:

- `corepack pnpm vitest run src/modules/reporting/refund-page-query.test.ts`
- `corepack pnpm type-check`

### Refund page batch reimbursement action

Trace:

- AC 52-61: Batch refund uses the existing confirmation dialog, existing command semantics, authoritative server validation, and refreshes page data after success.
- Technical Design: route-owned refund action wrapper; do not import search route action into refund page.

Implementation:

- `src/app/(app)/refunds/_actions/refund-page-actions.ts`
  - added `batchRefundRefundPageRecordsAction`.
  - reuses `batchMarkLedgerRecordsReimbursedInDatabase`.
  - reuses shared payment/batch error message helpers.
  - revalidates `/`, `/search`, and `/refunds`.
- `src/app/(app)/refunds/_components/refund-page-panel.tsx`
  - submits selected records through the refund-page action.
  - uses shared payment form parsing.
  - shows success/error toasts, clears selection, and refreshes the route after success.

Evidence:

- `corepack pnpm vitest run src/modules/reporting/refund-page-query.test.ts src/app/_reimbursement/batch-refund-action-result.test.ts src/app/_reimbursement/batch-refund-client.test.ts`
- `corepack pnpm type-check`
- `corepack pnpm lint`

### Navigation, panel behavior, and E2E coverage

Trace:

- AC 1-2: Dashboard pending-refund panel links to `/refunds?month=YYYY-MM`.
- AC 7-12: Desktop sidebar exposes refunds after search; mobile bottom tab bar does not expose refunds.
- AC 13-18: Member tabs update unpaid and refunded summaries without a separate summary card.
- AC 31-39: Selection mode swaps the unpaid summary to selected count/total and opens the shared batch refund dialog.
- AC 40-44: Unpaid expense and refund record rows use shared detail dialog flows.

Tests first:

- `src/app/(app)/refunds/_components/refund-page-panel.test.tsx`
- `e2e/refund-page.spec.ts`

Implementation:

- `src/app/(app)/refunds/_components/refund-page-panel.tsx`
  - renders one active tab content panel instead of one duplicate panel per member.
  - extracts `selectScope` so tab switching consistently clears selection state.
  - accepts the route-owned batch refund action as a prop, keeping the client component free of server-action imports.
- `e2e/refund-page.spec.ts`
  - covers dashboard refund entry, desktop sidebar refund entry, and absence from mobile primary nav.
  - covers member filtering, unpaid/refund summaries, shared record detail dialog, shared refund record dialog, selection summary, and shared batch refund validation.

Evidence:

- `corepack pnpm vitest run src/modules/reporting/refund-page-query.test.ts src/app/month-switcher.test.tsx src/app/_record-detail/record-detail-actions.test.ts src/app/_record-detail/reimbursement-payment-dialogs.test.tsx src/app/_reimbursement/batch-refund-client.test.ts src/app/_reimbursement/batch-refund-action-result.test.ts "src/app/(app)/search/_actions/record-search-actions.test.ts" "src/app/(app)/refunds/_components/refund-page-panel.test.tsx"`
- `corepack pnpm type-check`
- `corepack pnpm lint`
- `corepack pnpm test:e2e e2e/refund-page.spec.ts`

## Verification Run

- Passed: `corepack pnpm vitest run src/app/month-switcher.test.tsx`
- Passed: `corepack pnpm vitest run src/app/month-switcher.test.tsx src/app/_record-detail/record-detail-actions.test.ts`
- Passed: `corepack pnpm vitest run src/app/_record-detail/reimbursement-payment-dialogs.test.tsx`
- Passed: `corepack pnpm vitest run src/app/_reimbursement/batch-refund-client.test.ts src/app/_record-detail/reimbursement-payment-dialogs.test.tsx src/app/_record-detail/record-detail-actions.test.ts src/app/month-switcher.test.tsx`
- Passed: `corepack pnpm vitest run src/app/_reimbursement/batch-refund-action-result.test.ts 'src/app/(app)/search/_actions/record-search-actions.test.ts'`
- Passed: `corepack pnpm vitest run src/app/month-switcher.test.tsx src/app/_record-detail/record-detail-actions.test.ts src/app/_record-detail/reimbursement-payment-dialogs.test.tsx src/app/_reimbursement/batch-refund-client.test.ts src/app/_reimbursement/batch-refund-action-result.test.ts 'src/app/(app)/search/_actions/record-search-actions.test.ts'`
- Passed: `corepack pnpm type-check`
- Passed: `corepack pnpm lint`
- Passed after shared detail flow migration: `corepack pnpm type-check`
- Passed: `corepack pnpm vitest run src/modules/reporting/refund-page-query.test.ts src/app/month-switcher.test.tsx src/app/_record-detail/record-detail-actions.test.ts src/app/_record-detail/reimbursement-payment-dialogs.test.tsx src/app/_reimbursement/batch-refund-client.test.ts src/app/_reimbursement/batch-refund-action-result.test.ts "src/app/(app)/search/_actions/record-search-actions.test.ts" "src/app/(app)/refunds/_components/refund-page-panel.test.tsx"` (8 files, 33 tests)
- Passed: `corepack pnpm type-check`
- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm test:e2e e2e/refund-page.spec.ts` (3 tests)

## Review Gate

- decision: ready_for_verification
- notes:
  - TDD implementation now has production read model, route action, shared detail flow, shared batch refund flow, panel behavior tests, and E2E coverage for refund-specific entry/navigation behavior.
  - E2E evidence is scoped to the refund page and reuses existing broader search/dashboard E2E coverage for edit/delete/refund command depth.
- recommended_next_gate: Verification
- Passed after shared detail flow migration: `corepack pnpm vitest run src/app/month-switcher.test.tsx src/app/_record-detail/record-detail-actions.test.ts src/app/_record-detail/reimbursement-payment-dialogs.test.tsx src/app/_reimbursement/batch-refund-client.test.ts src/app/_reimbursement/batch-refund-action-result.test.ts 'src/app/(app)/search/_actions/record-search-actions.test.ts'`
- Passed after shared detail flow migration: `corepack pnpm lint`
- Passed after production read model: `corepack pnpm vitest run src/modules/reporting/refund-page-query.test.ts`
- Passed after refund batch action wiring: `corepack pnpm vitest run src/modules/reporting/refund-page-query.test.ts src/app/_reimbursement/batch-refund-action-result.test.ts src/app/_reimbursement/batch-refund-client.test.ts`
- Passed after production panel wiring: `corepack pnpm vitest run src/modules/reporting/refund-page-query.test.ts src/app/month-switcher.test.tsx src/app/_record-detail/record-detail-actions.test.ts src/app/_record-detail/reimbursement-payment-dialogs.test.tsx src/app/_reimbursement/batch-refund-client.test.ts src/app/_reimbursement/batch-refund-action-result.test.ts 'src/app/(app)/search/_actions/record-search-actions.test.ts'`
- Passed after production panel wiring: `corepack pnpm type-check`
- Passed after production panel wiring: `corepack pnpm lint`

## Remaining Implementation Work

- Add navigation, component, and E2E coverage.

## Review Gate

- decision: continue_tdd
- next_step:
  - Continue TDD Implementation with navigation/component/E2E coverage for the production refund page.
