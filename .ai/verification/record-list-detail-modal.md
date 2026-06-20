---
id: record-list-detail-modal
stage: verification
status: complete
delivery_profile: mvp
release_target: local_dev
created_at: 2026-06-20
updated_at: 2026-06-20
inputs:
  - .ai/intent/record-list-detail-modal.md
  - .ai/prototype/record-list-detail-modal.md
  - .ai/spec/record-list-detail-modal.md
  - .ai/technical-design/record-list-detail-modal.md
  - .ai/implementation/record-list-detail-modal.md
outputs:
  - verification_report
  - local_dev_support_statement
review_gate: passed_for_local_dev
---

# Record List Detail Modal Verification

## Summary

Verification passed for `local_dev`.

The implementation matches the approved dashboard record-list/detail modal behavior and the later reviewed dashboard panel refinements: records render as detail-capable item buttons, detail dialogs show selected record data, create-record actor copy uses `支付者`, overview panel chrome is removed except `SummaryMetric`, dashboard panels share a titled top-aligned layout, and the expense category summary uses list-style statistics instead of a pie chart.

## Evidence

- `corepack pnpm lint`: passed.
- `corepack pnpm type-check`: passed.
- `corepack pnpm build`: passed.
- `pnpm test:e2e e2e/dashboard.spec.ts`: passed, 10 tests.
- `pnpm test:e2e e2e/create-record.spec.ts`: passed, 7 tests.

## Behavior Coverage

Covered by `e2e/dashboard.spec.ts`:

- dashboard records are item buttons, not table headers or table navigation.
- detail modal opens for a selected record and shows amount, date, category, status, payer, and note content.
- income detail status displays `---`.
- fund-paid expense detail payer displays `基金`.
- keyboard open/close returns focus to the activated record item.
- no-record month shows empty state and no detail buttons.
- 11-inch iPad landscape keeps desktop two-column dashboard arrangement.
- fixed-height dashboard does not scroll, keeps visual panels inside their cells, preserves `DashboardPanel` top alignment/gap, keeps only three `SummaryMetric` cards, and renders category stats as rows with amounts, percentages, and no pie SVG.

Covered by `e2e/create-record.spec.ts`:

- create-record actor field is labeled `支付者`.
- fund-paid create flow shows `基金` as payer.
- created fund-paid expense is verified through the new record detail modal rather than a removed table row.

## Prototype And Spec Alignment

- The dashboard record table has been replaced with a compact item-list/detail-modal interaction.
- `RecordListDetail` remains a client component owning selected-record state and dialog behavior.
- Full-row native buttons provide accessible names of `查看<record name>詳情`.
- Amounts are absolute values; income/expense tone is visual.
- Dates use `YYYY/MM/DD`.
- Detail dialog has a title, no `DialogDescription`, no footer, and keeps built-in close behavior.
- Focus return after close is implemented and covered by E2E.
- The recent-five-record limit remains unchanged.
- The reviewed dashboard refinements supersede earlier prototype card assumptions: dashboard panels are unframed except `SummaryMetric`, `紀錄` has a title, and right-column separation uses a desktop border.

## Technical Design Alignment

- Route and data ownership remain in `src/app/(app)/page.tsx`.
- `RecordListDetail` does not own outer dashboard chrome.
- Category/member lookup data remains serializable plain objects.
- No Prisma schema, server action, route, auth, permission, reimbursement, or domain rule changes were introduced.
- Helper behavior remains covered through E2E rather than extracted unit tests, which is consistent with the technical design's optional extraction rule.
- The implementation intentionally evolved the homepage dashboard shell beyond the initial records-only technical design based on review feedback; those refinements remain presentation-only and are covered by E2E.

## Code Review Notes

- No behavioral regression found in the touched surfaces.
- No unrelated files or generated artifacts are included.
- `src/app/dashboard-charts.tsx` still exports the unused expense pie chart component. This is not a runtime risk, but it is a cleanup candidate if no other planned surface will use it.
- The verification target is `local_dev`; this does not assert preview, staging, or production readiness.

## Accepted Risks

- No visual screenshot baseline was added; responsive and clipping behavior is checked with Playwright role and bounding-box assertions.
- Full monthly record browsing remains deferred; the dashboard still shows recent five records.
- Production deployment concerns such as rollback, monitoring, and environment-specific smoke checks are out of scope for this local-dev verification.

## Review Gate

Decision: passed for `local_dev`.

Recommended next gate: Target-Aware Release for `local_dev` readiness refresh, unless the reviewer chooses to stop at verified local implementation.
