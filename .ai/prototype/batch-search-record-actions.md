---
id: prototype-batch-search-record-actions
stage: experience-prototype
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/batch-search-record-actions.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/batch-search-record-actions.md
  - .ai/archive/archive-record-search-sort-filter-2026-06-21.md
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
  - .ai/archive/archive-edit-delete-ledger-records-2026-06-21.md
outputs:
  - production_stack_prototype
  - ux_acceptance_criteria_draft
  - e2e_scenario_candidates
trace_links:
  route:
    - src/app/(app)/search/page.tsx
    - src/app/(app)/reimbursements/page.tsx
  components:
    - src/components/layout/page-layout.tsx
    - src/app/record-search-panel.tsx
    - src/app/record-list-detail.tsx
    - src/app/dashboard-navigation.ts
  tests:
    - src/app/dashboard-navigation.test.ts
reviewed_at: 2026-06-22
---

# Experience Prototype: Batch Search Record Actions

## Prototype Summary

- route: `/search`
- removed_route: `/reimbursements`
- review_url: `http://localhost:3000/search`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React client components, TypeScript, Tailwind CSS, local shadcn-style components, Lucide icons, Sonner toast
- fixture_or_mock_strategy: Uses real search page data loaded by `getSearchPageData()`. Batch delete/refund outcomes are client-local prototype state only and do not call server actions or persist changes.
- release_target: `local_dev`

## UX Direction

- Search results are now the primary record-oriented surface for multi-record actions.
- Search has an icon-only selection-mode button next to the filter button.
- Search results remain normal record-detail rows until selection mode is enabled.
- Search results render progressively; the prototype loads the next 100-result batch when the user scrolls near the bottom.
- Selection mode exposes compact selection controls before the existing record summaries.
- Page footer appears only after the user has entered a search or applied filters, and does not scroll with the record list.
- In normal search mode, the footer shows search result count and total amount as an absolute value, with color indicating positive income net or negative expense net.
- In selection mode, the footer shows only selected count, selected total amount as an absolute value, `全選目前顯示`, `清除選取`, `批次刪除`, and `批次退款`.
- The footer uses only a top border, without card styling, badges, or action icons.
- Footer styling is provided by the shared `PageFooter` layout component.
- Batch confirmations summarize how many selected records will be processed and how many will be skipped.
- Batch refund confirmation also shows `退款總金額` for the eligible records that will be processed.
- Ineligible records are skipped in the prototype so reviewers can evaluate mixed-selection feedback before Behavior Spec decides final partial-success semantics.
- The standalone `退款` navigation item is removed.
- `/reimbursements` route file is removed so direct visits fall through to the framework default 404.

## States Covered

- empty search state remains unchanged.
- active search results with no selected records.
- selection mode off, where clicking a result opens detail as before.
- no page footer before a search/filter query is active.
- normal search footer with result count and visible result total amount, using absolute amount plus positive/negative color.
- progressive result loading with `載入更多紀錄...` sentinel near the bottom of the list.
- selection mode on, where each result has a selection control.
- one or more selected records.
- select all currently displayed rows.
- selection-mode footer with selected count and selected total amount only, using absolute amount plus positive/negative color.
- clear selection.
- batch delete enabled/disabled based on eligible selected records.
- batch refund enabled/disabled based on eligible selected records.
- batch delete confirmation with processed/skipped counts.
- batch refund confirmation with processed/skipped counts and refund total amount.
- local batch delete success removes eligible records from current results.
- local batch refund success changes eligible expenses to `已退款` behavior for current client state.
- removed refund navigation.
- direct removed-route behavior via default 404.

## Interaction Details

- Selection:
  - The icon-only `開啟選取模式` button toggles selection mode.
  - Turning selection mode off clears selected records.
  - The selection control is keyboard-focusable and announces selected/unselected state with `aria-pressed`.
  - Opening a record detail remains available from the record row body.
  - Changing search or filter query clears selected records.
- Batch action bar:
  - Lives at the page footer below the independently scrolling result list.
  - Uses the shared `PageFooter` component from `src/components/layout/page-layout.tsx`.
  - Appears only when the user has entered a search or applied filters.
  - Uses only a top border; no card wrapper, rounded container, badge treatment, or icons inside the footer.
  - Shows search result count and total amount as an absolute value in normal mode, with color for positive/negative net.
  - Shows selected count and selected total amount as an absolute value in selection mode, with color for positive/negative net.
  - Provides `全選目前顯示` for the currently displayed rows, then shows disabled `已全選目前顯示` once every currently displayed row is selected.
  - Uses `清除選取` as the only cancellation/reset control for selected records.
  - Disables batch actions when no selected records are eligible.
- Progressive loading:
  - The prototype uses 100-row client-side chunks over already-loaded records.
  - Initial render loads the first 100-result batch, then appends 100 more as the list scrolls near the bottom.
  - The footer still summarizes the full matched result set available to the current prototype data source.
  - Behavior Spec and Technical Design must replace this with server pagination/cursor loading at 100 records per page for large datasets.
- Confirmation:
  - `確認批次刪除` explains eligible records leave active views.
  - `確認批次退款` explains eligible member-paid expenses are marked `已退款` and shows the eligible refund total amount.
  - Mixed selections show a warning that ineligible records remain unchanged.
- Feedback:
  - Success uses existing Sonner toast patterns.
  - Prototype state updates are local only; backend persistence is intentionally deferred.

## Responsive Baseline

- Desktop: footer lays out count/status on the left and actions on the right.
- Mobile/narrow: footer stacks vertically and buttons wrap without overlapping text.
- The result list remains the only scrolling region; the footer stays available while reviewing selected records.
- Record selection control uses fixed dimensions so row layout does not shift when selected.
- Confirmation dialogs reuse existing responsive Dialog behavior.

## Accessibility And Focus

- Selection buttons have per-record `aria-label` values and `aria-pressed`.
- Batch action buttons are standard buttons with disabled states.
- Confirmation dialogs reuse existing Dialog focus trapping and close behavior.
- The record detail button remains keyboard reachable next to the selection control.
- The removed `/reimbursements` route intentionally uses framework default 404 behavior rather than a custom redirect.

## Draft UX Acceptance Criteria

- Users can select and unselect multiple visible search results.
- Users enter selection mode through an icon-only button before seeing selection controls.
- Turning selection mode off returns the list to normal detail-opening behavior and clears selection.
- Initial empty search state does not show the page footer.
- Normal search footer shows visible result count and visible result total amount as an absolute value with positive/negative color.
- Selection mode footer shows selected count and selected total amount as an absolute value with positive/negative color, without icons.
- Search results progressively load more records as the user scrolls.
- Users can clear all selected records.
- Users can select all currently displayed rows from the footer with explicit copy.
- Users clear selection with `清除選取`; there is no separate `取消全選` control.
- Search/filter changes clear selection to avoid hidden selected records.
- Batch delete and batch refund are unavailable when no selected records are eligible.
- Confirmation copy makes processed/skipped counts clear before action.
- Mixed selections do not silently mutate ineligible records.
- `退款` is no longer present in primary navigation.
- `/reimbursements` has no standalone page.

## E2E Scenario Candidates

- Open `/search`, search for records, verify normal result click opens detail before selection mode is enabled.
- Toggle selection mode, select two results, clear selection, and verify selected count resets.
- Select records with mixed eligibility, open batch delete, and verify processed/skipped counts.
- Confirm batch delete in prototype and verify eligible records disappear from current results.
- Select refundable member-paid expenses, open batch refund, confirm, and verify selected state clears with success feedback.
- Assert finance/admin navigation contains `搜尋` but not standalone `退款`.
- Visit `/reimbursements` and assert the default 404 page.

## Known Gaps

- Batch server actions, persistence, transactions, and cache revalidation are not implemented in this prototype.
- Infinite loading is client-side prototype behavior over already-fetched records; real server pagination, cursors, 100-record page size, result totals, and aggregate total strategy remain design work.
- Partial-success versus all-or-nothing remains a Behavior Spec decision; this prototype demonstrates partial with skipped records for review.
- Selection does not cross unloaded server pages; all-select is intentionally scoped to currently displayed rows.
- Prototype eligibility mirrors existing role/status rules client-side, but server-side authorization remains required in technical design.
- Batch result history/audit display is not designed.
- This prototype does not add E2E coverage yet; test candidates are recorded for the Behavior Spec gate.

## Review Gate

- decision: approved
- reviewer_focus:
  - Check whether selection in search results is discoverable and not confused with opening record details.
  - Check whether batch action bar density works on desktop and mobile.
  - Check whether processed/skipped copy is understandable for mixed selections.
  - Confirm removal of standalone refund navigation and default 404 behavior.
- must_check:
  - Prototype remains a frontend review slice, not final backend behavior.
  - Behavior Spec must settle partial-success versus all-or-nothing semantics.
  - Technical Design must define server actions, transactions, per-record outcomes, and revalidation.
- acceptance_signals:
  - User approves `/search` as the batch operation surface.
  - User accepts the selection/action/confirmation pattern or requests concrete changes.
  - User confirms no standalone refund page should return.
- unresolved_blockers:
  - None for Behavior Spec.
- next_step:
  - Behavior Spec / BDD / E2E for `batch-search-record-actions`.
