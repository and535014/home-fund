---
id: implementation-search-reimbursement-payment-records
stage: tdd-implementation
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/search-reimbursement-payment-records.md
  - .ai/technical-design/search-reimbursement-payment-records.md
  - .ai/prototype/search-reimbursement-payment-records.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
outputs:
  - src/modules/reporting/reimbursement-payment-search-query.ts
  - src/modules/reporting/reimbursement-payment-search-query.test.ts
  - src/app/record-search-actions.ts
  - src/app/record-search-controls.tsx
  - src/app/record-search-panel.tsx
  - prisma/schema.prisma
  - prisma/migrations/20260625233000_add_reimbursement_payment_search_indexes/migration.sql
trace_links:
  spec:
    - .ai/spec/search-reimbursement-payment-records.md
  technical_design:
    - .ai/technical-design/search-reimbursement-payment-records.md
  production_route:
    - /search
reviewed_at: 2026-06-25
---

# Search Reimbursement Payment Records TDD Implementation

## Scope Implemented

- Added a dedicated reimbursement-payment reporting read model for `ReimbursementPayment`.
- Added query builder coverage for household scope, 收款成員 filter by member id, payment date range, keyword predicates, sort order, and cursor pagination.
- Added server actions:
  - `loadReimbursementPaymentSearchPageAction`
  - `loadReimbursementPaymentByLedgerRecordAction`
- Replaced `/search` reimbursement-payment tab prototype fixture data with server-loaded reimbursement payment records.
- Adjusted reimbursement-payment tab default behavior so no reimbursement payment records are loaded or shown until the user enters a keyword or applies a reimbursement payment filter.
- Changed reimbursement payment filter state from display-name filtering to `paidToMemberId`.
- Kept reimbursement payment records read-only and outside ledger selection/batch actions.
- Added lazy evidence readback so already-refunded member-paid expense details show `查看退款紀錄` only after backend evidence exists.
- Refined evidence readback after clean-code review:
  - visible reimbursed expenses now use one batch readback action instead of per-row action calls.
  - related ledger records now open ordinary record detail instead of rendering no-op row buttons.
  - refund Prisma mapper row type is derived from the shared Prisma select instead of an `unknown` cast.
  - server-action tests cover refund page loading, single-record null evidence, and batch evidence mapping.
- Related records continue to render through `RecordListItem`.
- Refund search result rows now also render through `RecordListItem`; the refund row only overrides the leading visual with a fixed-color refund icon plus refund-specific description/date labels.
- Split pure route-local UI out of `record-search-panel.tsx`:
  - `src/app/record-search-results.tsx` owns the result list and refund-row visual treatment.
  - `src/app/reimbursement-payment-dialogs.tsx` owns refund detail and related-record dialogs.
  - `src/app/reimbursement-payment-ui.ts` owns small refund display helpers.
- Added reimbursement payment search indexes to Prisma schema and migration SQL.

## TDD Evidence

Red step:

- `corepack pnpm vitest run src/modules/reporting/reimbursement-payment-search-query.test.ts`
- Initial result failed because `./reimbursement-payment-search-query` did not exist.

Green checks:

- `corepack pnpm vitest run src/modules/reporting/reimbursement-payment-search-query.test.ts src/modules/reporting/record-search-query.test.ts src/app/record-search-actions.test.ts`
- `corepack pnpm vitest run src/app/record-search-actions.test.ts src/modules/reporting/reimbursement-payment-search-query.test.ts`
- `corepack pnpm lint`
- `corepack pnpm type-check`

## Notes

- Full E2E coverage is not added in this slice yet.
- Verification gate should add or run `/search` E2E coverage for tab separation, reimbursement payment filters, refund detail, related records, reimbursed expense readback, and mobile close layout.
- `corepack pnpm type-check` should not be run in parallel with another command that also runs `prisma generate`; doing so caused a transient `EEXIST` on the generated Prisma output directory.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm reimbursement-payment tab now uses backend data instead of prototype fixtures.
  - Confirm `收款成員` filtering uses member id while showing member display names.
  - Confirm lazy evidence readback behavior is acceptable for already-refunded expense details.
  - Confirm migration indexes match the technical design.
- must_check:
  - E2E coverage remains a verification follow-up.
  - Local database migration has not been applied in this implementation gate.
- next_step:
  - Verification for `search-reimbursement-payment-records`.
