---
id: search-reimbursement-payment-records
stage: verification
status: review
created_at: 2026-06-26
updated_at: 2026-06-26
review_gate: pending_user_review
reviewed_at:
release_target: local_dev
trace_links:
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
  - .ai/prototype/search-reimbursement-payment-records.md
  - .ai/spec/search-reimbursement-payment-records.md
  - .ai/technical-design/search-reimbursement-payment-records.md
  - .ai/implementation/search-reimbursement-payment-records.md
---

# Search Reimbursement Payment Records Verification

## Result

- decision: pass_for_local_dev_review
- release_target_supported: local_dev
- recommended_next_gate: Target-Aware Release for local_dev.

## Scope Verified

- `/search` separates `收支紀錄` and `退款紀錄` into independent tabs.
- `退款紀錄` does not load or display records before a keyword or filter is applied.
- `退款紀錄` search uses backend `ReimbursementPayment` data instead of prototype fixtures.
- Refund search results are read-only, excluded from selection mode and batch actions, and show summary totals for refund payments.
- Refund filters include `收款成員`, payment date range, and sort; `付款方式` remains searchable/display-only rather than a filter.
- Refund rows use the shared record-row structure while replacing the leading visual with the refund icon and fixed color.
- Refund detail opens as a read-only dialog and can open related ledger records rendered with `RecordListItem`.
- Already-refunded member-paid expense details can open the related refund record dialog when payment evidence exists.
- Existing ordinary record search, filter, sort, selection, batch refund, batch delete, and pagination E2E coverage continues to pass.
- Mobile `/search` keeps tabs and close control in one row, with the close control named `關閉搜尋頁`.
- E2E seed now includes reimbursement payment evidence for two historical reimbursed expenses without disturbing the June dashboard fixture.

## Commands Run

- `corepack pnpm vitest run src/modules/reporting/reimbursement-payment-search-query.test.ts src/app/record-search-actions.test.ts src/modules/reporting/record-search-query.test.ts src/app/record-query.test.ts src/lib/utils.test.ts`
  - Result: passed, 5 files, 23 tests.
- `corepack pnpm type-check`
  - Result: passed.
- `corepack pnpm lint`
  - Result: passed.
- `corepack pnpm test:e2e e2e/record-search.spec.ts`
  - Result: passed, 12 Playwright tests.
  - Evidence: E2E reset `home_fund_e2e`, applied all migrations including `20260625233000_add_reimbursement_payment_search_indexes`, seeded base and E2E data, then passed record-search checks.

## E2E Adjustments During Verification

- Added E2E reimbursement payment fixtures:
  - one bank-transfer refund payment paid to Mei and linked to `已退款網路費`.
  - one cash refund payment paid to Kai and linked to `已退款停車費`.
- Added record-search E2E coverage for:
  - tab separation and refund default prompt state.
  - refund search result count and total amount.
  - refund filter fields and absence of `付款方式` as a filter.
  - refund detail read-only fields and related-record dialog.
  - opening refund detail from an already-refunded expense detail.
  - mobile tabs plus close control alignment.
- Updated the existing sort selector expectation to match the current visible `排序` label.

## Trace And Alignment

- Behavior Spec and Technical Design were corrected to reflect later user decisions:
  - refund records are not shown by default before search/filter.
  - refund row title is `付給 <收款成員>` and description is payment method.
  - refund detail no longer displays a separate `關聯紀錄` field; related records remain available through `查看關聯紀錄`.
- Implementation keeps `ReimbursementPayment` as the code/read-model name while UI copy remains `退款紀錄`.
- The reimbursement payment search indexes are present in Prisma schema and applied during E2E migration deploy.

## Residual Risk

- Full `corepack pnpm test` and full `corepack pnpm test:e2e` were not rerun in this verification turn; targeted unit checks and the full `record-search` E2E spec passed.
- Production readiness is not implied. Database migration deployment, rollback posture, and local-dev smoke steps should be covered in Target-Aware Release.

## Review Gate

- Decision needed: approve local_dev verification, request changes, or block.
- Recommended next gate after approval: Target-Aware Release for `local_dev`.
