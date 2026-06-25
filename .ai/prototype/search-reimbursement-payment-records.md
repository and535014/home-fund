---
id: prototype-search-reimbursement-payment-records
stage: experience-prototype
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
  - .ai/archive/archive-reimbursement-payment-flow-2026-06-25.md
outputs:
  - production_stack_prototype
  - ux_acceptance_criteria_draft
  - e2e_scenario_candidates
trace_links:
  route:
    - src/app/(app)/search/page.tsx
  components:
    - src/app/record-search-panel.tsx
    - src/app/record-search-controls.tsx
    - src/app/record-list-detail.tsx
    - src/app/record-query.ts
reviewed_at: 2026-06-25
---

# Experience Prototype: Search Refund Records

## Prototype Summary

- route: `/search`
- review_url: `http://localhost:3000/search`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React client components, TypeScript, Tailwind CSS, local shadcn-style components, Lucide icons
- component_library_usage: existing Button, Dialog, Input, NativeSelect, Item components
- fixture_or_mock_strategy: Uses the real `/search` page and current ledger search action for ordinary records. Refund record results and related-record readback are local fixtures in `record-search-panel.tsx`; backend search, database joins, pagination, and persistence are intentionally not implemented in this gate.
- release_target: `local_dev`

## UX Direction

- Search remains one primary page, but the search input is scoped by two tabs: `收支紀錄` and `退款紀錄`.
- `收支紀錄` keeps ordinary ledger-record search, filters, selection mode, pagination, and batch actions.
- `退款紀錄` has its own keyword search and filter dialog, currently scoped to 收款成員, payment date range, and sort order.
- Refund record evidence uses the same row structure and information density as ordinary ledger results; only the leading category visual is replaced by a refund record icon.
- Refund record evidence is read-only in this slice and does not participate in batch delete or batch refund.
- Already-refunded expense details can expose `查看退款紀錄` to open the related refund record modal.
- Refund record details expose `查看關聯紀錄` to open the related ledger record list.

## States Covered

- Initial `收支紀錄` empty search state remains unchanged.
- Search tabs: `收支紀錄`, `退款紀錄`.
- `收支紀錄` keyword and filters show ordinary ledger records only.
- `退款紀錄` with no keyword shows refund record evidence.
- `退款紀錄` with keyword filters refund record evidence.
- `退款紀錄` filters include 收款成員, payment start/end date, and sort.
- Refund record row shows the same visible information shape as an ordinary ledger row:
  - refund record icon in the leading visual slot
  - linked ledger record name
  - 收款成員
  - amount
  - paid date
- Refund record result uses read-only row treatment without selection control.
- Refund record row opens a read-only detail modal when clicked.
- Refunded expense detail shows a read-only `查看退款紀錄` action when related evidence is available.
- Refund record detail shows a read-only `查看關聯紀錄` action.
- Related ledger records are displayed with the same `RecordListItem` row component as ordinary search results.
- Ordinary ledger record rows keep selection behavior and detail dialog behavior.
- Selection mode appears only on the `收支紀錄` tab.

## Interaction Details

- User opens `/search`:
  - `收支紀錄` is selected by default.
  - ledger records continue to load from the existing server action only after a keyword or filter is active.
- User switches to `退款紀錄`:
  - the prototype does not call the existing ledger search action.
  - the list shows refund record fixture results and applies refund-record filters locally.
- User toggles selection mode:
  - selection mode is only available on `收支紀錄`.
  - refund records stay read-only and cannot be selected.
- User clicks an ordinary record:
  - existing record detail dialog behavior is preserved.
- User clicks an already-refunded expense that has related evidence:
  - the detail modal can open the related refund record modal through `查看退款紀錄`.
- User reviews a refund record row:
  - the row mirrors ordinary record rows; the leading refund record icon identifies the item type.
- User opens refund record detail:
  - the modal follows the ordinary record detail structure with title, amount card, two-column detail fields, and a note block.
  - the modal shows linked record name, amount, 收款成員, paid date, payment method, and note/reference.
  - the modal is read-only and does not show edit, delete, refund, or correction actions.
  - `查看關聯紀錄` opens a related ledger record list.

## Responsive Baseline

- Desktop: result rows keep the existing compact list density, with amount/date aligned right.
- Mobile/narrow: tabs sit above the search row, and refund record rows use the same three-column rhythm as record rows; long member names and linked record names truncate instead of overlapping.
- Mobile/narrow: the close control sits to the right of the tabs and uses a close icon rather than a back arrow.
- The search result area remains one scrollable list per active tab.
- Footer remains anchored by the existing search page layout.

## Accessibility And Focus

- Tabs expose `收支紀錄` and `退款紀錄` as the active search surface.
- Mobile close button uses accessible name `關閉搜尋頁`.
- Refund record filters use native inputs/selects.
- Refund record result has an `aria-label` identifying it as a refund record result while keeping ordinary row structure.
- Refund record rows are buttons that open read-only payment detail.
- Ordinary record row buttons and selection controls keep the existing keyboard behavior.
- Selection mode is not shown on the `退款紀錄` tab.
- Cross-modal buttons use ordinary buttons and keep focus within the active dialog.

## Draft UX Acceptance Criteria

- Users can switch between `收支紀錄` and `退款紀錄` tabs above the search input.
- `收支紀錄` search returns ordinary ledger records only.
- `退款紀錄` search returns refund record evidence only.
- Refund record result identity is carried by the refund record icon while the row keeps the same visible information structure as ordinary results.
- Refund record evidence does not affect ledger net total.
- Refund record evidence is not selectable for batch delete or batch refund.
- Refund record detail opens in a modal that follows the ordinary record detail layout pattern.
- Already-refunded expense detail can open the related refund record modal.
- Refund record detail can open a related ledger record list.
- Ordinary search result detail and selection flows remain available.
- Empty states remain understandable for no keyword/no filters and no matching payment evidence.

## E2E Scenario Candidates

- Open `/search`, switch to `退款紀錄`, and verify a refund record result appears with the same row structure as ordinary records.
- Search `退款紀錄` in the refund tab and verify refund records are filtered locally.
- Open refund-tab filters, choose 收款成員 or payment date range, apply, and verify only matching refund record evidence is visible.
- Verify selection mode is available on `收支紀錄` and hidden on `退款紀錄`.
- Click a refund record result and verify a read-only detail modal opens with amount, 收款成員, paid date, payment method, linked record, and note.
- From refund record detail, click `查看關聯紀錄` and verify a related ledger record list opens.
- From an already-refunded expense detail, click `查看退款紀錄` and verify the related refund record modal opens.

## Known Gaps

- Refund record search is fixture-only; there is no backend query, Prisma include, pagination, or permission enforcement yet.
- Sorting within `退款紀錄` is prototype-local and not final.
- Search matching fields are illustrative and must be finalized in Behavior Spec.
- Refund record detail and related-record readback are prototype-only and not database-backed yet.
- The real relationship shape must support one refund record related to one or many ledger records.
- Production performance, indexes, and database query plans are deferred to technical design and release readiness.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `收支紀錄` and `退款紀錄` tabs are the right separation for mobile and desktop.
  - Confirm refund record filters should be 收款成員, payment date range, and sort for this slice.
  - Confirm refund record evidence is read-only and excluded from batch actions in this slice.
  - Confirm the refund record item matches ordinary ledger item structure and information, with only the leading visual changed to the refund record icon.
  - Confirm the read-only refund record detail modal follows the ordinary record modal structure closely enough.
  - Confirm refunded expense detail should open related refund record, and refund record detail should open related ledger records.
- must_check:
  - Prototype remains frontend review work; backend query and persistence are deferred.
  - Behavior Spec must define exact search matching, totals, selection, permission, related-record readback, and empty-state behavior.
  - Technical Design must define data ownership, query/pagination, relationship loading, and no-double-count implementation.
- acceptance_signals:
  - User accepts the tabs and related-record readback direction.
  - User requests only concrete copy/layout adjustments before Behavior Spec.
  - Prototype gives enough evidence to write BDD/E2E scenarios.
- unresolved_blockers:
  - Backend result model, relationship loading, and sorting/pagination remain design work.
- next_step:
  - Behavior Spec / BDD / E2E for `search-reimbursement-payment-records`.
