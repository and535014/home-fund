---
id: record-list-detail-modal
stage: tdd-implementation
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
outputs:
  - src/app/record-list-detail.tsx
  - src/app/(app)/page.tsx
  - src/app/dashboard-charts.tsx
  - e2e/dashboard.spec.ts
  - e2e/create-record.spec.ts
review_gate: ready_for_verification
---

# Record List Detail Modal TDD Implementation

## Scope

This implementation completes the dashboard record list/detail modal behavior described by the approved prototype, behavior spec, and technical design.

The production UI implementation was already introduced during the prototype pass. This TDD pass focused on aligning executable coverage with the final UI behavior, then closing the implementation gap found by the tests.

## Tests First

Updated `e2e/dashboard.spec.ts` before final implementation fixes to cover:

- dashboard records render as clickable item-list buttons instead of table column headers.
- detail modal opens from a record item and shows absolute amount, `YYYY/MM/DD` date, category, status, payer, and note.
- income detail status is `---`.
- fund-paid expense payer is `基金`.
- keyboard open/close preserves month URL and returns focus to the original record item.
- empty month state has no record detail buttons.
- 1194x834 tablet landscape keeps the desktop two-column dashboard arrangement.
- 1920x1080 fixed-height dashboard keeps the page from scrolling and keeps both chart SVGs inside their cards.
- monthly trend chart remains accessible through a region label while removing the visible title and outer card chrome.
- overview cards are limited to the three `SummaryMetric` elements; records, reimbursement, and category/trend chart areas are unframed panels.
- expense category summary uses a project-native list statistic UI instead of a pie chart.
- dashboard panels fill their assigned grid cells while keeping panel content top-aligned.
- reimbursement, category, and records sections share a `DashboardPanel` layout with `gap-3`; the records panel title is visible again and the right column has a desktop divider.

Updated `e2e/create-record.spec.ts` to cover changed labels and downstream behavior:

- create-record member/source field is labeled `支付者`.
- fund-paid create flow shows `基金` as the disabled payer.
- created fund-paid expense is verified through the new record detail modal instead of a removed table row.

## Implementation Changes

- Added record-detail dialog focus restoration in `src/app/record-list-detail.tsx` by storing the triggering record button and focusing it after modal close.
- Set `aria-describedby={undefined}` on the record detail `DialogContent` because the description was intentionally removed from this dialog.
- Fixed dashboard chart clipping in fixed-height layouts by letting measured chart SVG height follow the actual allocated container height instead of enforcing a larger minimum height inside an overflow-hidden card.
- Preserved the no-page-scroll dashboard layout by keeping the page content on the existing `h-full min-h-0` grid structure.
- Replaced the monthly trend card with an unframed chart region and removed the visible `收支趨勢` title.
- Removed remaining dashboard Card wrappers from the record list, reimbursement summary, and category chart while keeping SummaryMetric card frames.
- Replaced the expense category pie chart on the overview with category rows showing category name, proportional bar, formatted amount, and muted percentage text after the amount.
- Updated dashboard panel sizing so reimbursement and category panels fill available height and align content to the top.
- Extracted a local `DashboardPanel` wrapper for titled dashboard sections and applied it to reimbursement, category stats, and records, including the desktop left border for the records column.
- Kept the existing item/list component structure and did not reintroduce table or standalone footer behavior.

## Verification Evidence

- `corepack pnpm lint` passed.
- `corepack pnpm type-check` passed.
- `pnpm test:e2e e2e/dashboard.spec.ts` passed: 10 tests.
- `pnpm test:e2e e2e/create-record.spec.ts` passed: 7 tests.

## Review Gate

Decision: approve TDD Implementation for local development verification.

Recommended next gate: Verification.
