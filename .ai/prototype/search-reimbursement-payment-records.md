---
id: prototype-search-reimbursement-payment-records
stage: experience-prototype
status: approved
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

# Experience Prototype: Search Reimbursement Payment Records

## Prototype Summary

- route: `/search`
- review_url: `http://localhost:3000/search`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React client components, TypeScript, Tailwind CSS, local shadcn-style components, Lucide icons
- component_library_usage: existing Button, Dialog, Input, NativeSelect, Item components
- fixture_or_mock_strategy: Uses the real `/search` page and current ledger search action for ordinary records. Reimbursement payment results are a local fixture in `record-search-panel.tsx`; backend search, database joins, pagination, and persistence are intentionally not implemented in this gate.
- release_target: `local_dev`

## UX Direction

- Search remains one primary surface.
- When type is `全部`, a keyword search can return both ordinary ledger records and reimbursement payment evidence in the same result stream.
- The type filter adds `退款金流`.
- Selecting `退款金流` filters the result stream to reimbursement payment evidence only.
- Reimbursement payment evidence uses the same row structure and information density as ordinary ledger results; only the leading category visual is replaced by a reimbursement payment icon.
- Reimbursement payment evidence is read-only in this slice and does not participate in batch delete or batch refund.
- Search result count can include reimbursement payment evidence, while net amount remains based on ledger records only so payment evidence is not double-counted.

## States Covered

- Initial empty search state remains unchanged.
- Type filter options: `全部`, `收入`, `支出`, `退款金流`.
- `全部` plus `退款金流紀錄` keyword can show ordinary records and reimbursement payment evidence together when both match.
- `退款金流` type with no keyword shows reimbursement payment evidence only.
- `退款金流` type with keyword filters reimbursement payment evidence.
- Payment evidence row shows the same visible information shape as an ordinary ledger row:
  - reimbursement payment icon in the leading visual slot
  - linked ledger record name
  - paid-to member
  - amount
  - paid date
- Payment evidence result uses read-only row treatment without selection control.
- Payment evidence row opens a read-only detail modal when clicked.
- Ordinary ledger record rows keep selection behavior and detail dialog behavior.
- Selection mode applies only to ordinary ledger records.

## Interaction Details

- User searches from `/search` with no type filter:
  - ledger records continue to load from the existing server action.
  - matching reimbursement payment fixture results are appended to the same result stream.
- User opens filter dialog and chooses `退款金流`:
  - the prototype does not call the existing ledger search action, because `退款金流` is not a `LedgerRecord.type`.
  - the result stream shows only reimbursement payment evidence fixture results.
- User toggles selection mode:
  - ordinary records show selection controls as before.
  - reimbursement payment rows stay read-only and cannot be selected.
- User clicks an ordinary record:
  - existing record detail dialog behavior is preserved.
- User reviews a reimbursement payment row:
  - the row mirrors ordinary record rows; the leading reimbursement payment icon identifies the item type.
- User opens reimbursement payment detail:
  - the modal follows the ordinary record detail structure with title, amount card, two-column detail fields, and a note block.
  - the modal shows linked record name, amount, paid-to member, paid date, payment method, and note/reference.
  - the modal is read-only and does not show edit, delete, refund, or correction actions.

## Responsive Baseline

- Desktop: result rows keep the existing compact list density, with amount/date aligned right.
- Mobile/narrow: payment evidence row uses the same three-column rhythm as record rows; long member names and linked record names truncate instead of overlapping.
- The search result area remains one scrollable list.
- Footer remains anchored by the existing search page layout.

## Accessibility And Focus

- Type filter is a native select and includes a clear `退款金流` option.
- Payment evidence result has an `aria-label` identifying it as a reimbursement payment result while keeping ordinary row structure.
- Payment evidence rows are buttons that open read-only payment detail.
- Ordinary record row buttons and selection controls keep the existing keyboard behavior.
- Selection mode must not make payment evidence focusable as a selected record candidate.

## Draft UX Acceptance Criteria

- Users can search without a type filter and see both matching ordinary records and matching `退款金流紀錄`.
- Users can choose type `退款金流` and see only reimbursement payment evidence.
- Payment evidence result identity is carried by the reimbursement payment icon while the row keeps the same visible information structure as ordinary results.
- Payment evidence does not affect ledger net total.
- Payment evidence is not selectable for batch delete or batch refund.
- Payment evidence detail opens in a modal that follows the ordinary record detail layout pattern.
- Ordinary search result detail and selection flows remain available.
- Empty states remain understandable for no keyword/no filters and no matching payment evidence.

## E2E Scenario Candidates

- Open `/search`, type `退款金流紀錄`, and verify a reimbursement payment result appears with the same row structure as ordinary records.
- Search a term that matches an ordinary record and a reimbursement payment fixture, and verify both result types are visible.
- Open filter dialog, choose `退款金流`, apply, and verify only reimbursement payment evidence is visible.
- Toggle selection mode while payment evidence is visible and verify payment evidence has no selection control.
- Click a reimbursement payment result and verify a read-only detail modal opens with amount, paid-to member, paid date, payment method, linked record, and note.
- Verify the footer count includes visible payment evidence while ledger net total does not add reimbursement payment amount.
- Click an ordinary record in mixed results and verify the existing detail dialog still opens.

## Known Gaps

- Reimbursement payment search is fixture-only; there is no backend query, result union, Prisma include, pagination, or permission enforcement yet.
- Sorting across `LedgerRecord.occurredOn` and `ReimbursementPayment.paidOn` is not final.
- Search matching fields are illustrative and must be finalized in Behavior Spec.
- Payment evidence detail is prototype-only and not database-backed yet.
- Result count and net total behavior need Behavior Spec confirmation.
- Production performance, indexes, and database query plans are deferred to technical design and release readiness.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm `全部` should search ordinary records and reimbursement payment evidence together.
  - Confirm type filter should include `退款金流`.
  - Confirm payment evidence is read-only and excluded from batch actions in this slice.
  - Confirm the reimbursement payment item matches ordinary ledger item structure and information, with only the leading visual changed to the reimbursement payment icon.
  - Confirm the read-only payment detail modal follows the ordinary record modal structure closely enough.
- must_check:
  - Prototype remains frontend review work; backend query and persistence are deferred.
  - Behavior Spec must define exact search matching, result count, totals, selection, permission, and empty-state behavior.
  - Technical Design must define the result union, data ownership, query/pagination, and no-double-count implementation.
- acceptance_signals:
  - User accepts the mixed-result and `退款金流` filter direction.
  - User requests only concrete copy/layout adjustments before Behavior Spec.
  - Prototype gives enough evidence to write BDD/E2E scenarios.
- unresolved_blockers:
  - Backend result model and sorting/pagination remain design work.
- next_step:
  - Behavior Spec / BDD / E2E for `search-reimbursement-payment-records`.
