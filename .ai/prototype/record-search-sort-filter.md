---
id: prototype-record-search-sort-filter
stage: experience-prototype
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-search-sort-filter.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/record-search-sort-filter.md
outputs:
  - production_stack_prototype
  - ux_acceptance_inputs
  - e2e_scenario_candidates
trace_links:
  intent:
    - .ai/intent/record-search-sort-filter.md
  domain_impact:
    - .ai/domain-impact/record-search-sort-filter.md
  component_paths:
    - src/app/record-list-detail.tsx
    - src/app/(app)/search/page.tsx
reviewed_at: 2026-06-21
---

# Experience Prototype: Record Search, Sort, and Filter

## Summary

- route: `/search`
- prototype_host: existing search page, backed by the shared record list/detail component
- primary_component: `src/app/record-list-detail.tsx`
- integration_point: `src/app/(app)/search/page.tsx`
- frontend_stack: Next.js App Router, React client component, TypeScript, Tailwind, local shadcn-style Input/NativeSelect/Button/Item/Dialog components, Lucide icons
- run_command: `corepack pnpm dev`
- review_url: `http://localhost:3000/`
- fixture_strategy: existing local household data; dashboard remains a recent-record summary while `/search` loads active records for query review

## Prototype Behavior

- The `/search` page replaces the placeholder with a record query experience.
- The search page does not use a page header; the first visible controls are the search input and icon-only filter button.
- The dashboard `紀錄` panel remains a recent-record summary and does not show the query controls.
- The search page surface keeps only the keyword input and an icon-only filter button above the record list.
- The icon-only filter button uses a highlighted active style when filter/sort criteria are applied.
- The initial search page shows an empty-result prompt until the user enters a keyword or changes search/filter/sort criteria.
- All filters and sort options open in a `篩選與排序` modal from the filter button.
- Filter and sort changes in the modal stay as draft settings until the user presses `套用`.
- Keyword search uses visible record data: record name, note, active category name, member/fund label, type/payment label, date, amount, and reimbursement status.
- When keyword text is present, the search input shows an icon-only `X` clear button that clears the keyword and resets keyword-matched results.
- Record type filter supports `全部`, `收入`, and `支出`.
- Category filter lists active categories only; archived categories are intentionally not shown and archived category names are not included in keyword matching. When a type is selected, category options are limited to that type.
- The member/fund participation filter is labeled `收支對象` for review. It includes `基金` plus household members by default, but when `收入` is selected it only shows household members.
- Reimbursement status filter supports `全部`, `已退款`, and `未退款`.
- Date range supports start-only, end-only, and start/end filtering by record occurrence date without using the dashboard month switcher.
- Sort order uses one select with `新到舊`, `舊到新`, `金額高到低`, and `金額低到高`.
- The filter modal does not show result counts. `清除` appears only when modal filter/sort settings differ from the default, and it resets the modal draft until `套用`.
- Empty query results show `沒有符合條件的紀錄。`
- Opening a filtered result still uses the existing record detail dialog, edit/delete actions, and reimbursement affordances.

## UX Decisions

- Keep query controls on the existing `搜尋` navigation page instead of reintroducing a standalone `/records` route or crowding the dashboard summary.
- Use a simple search bar on the page and keep dense filter/sort controls inside a modal, because this page should prioritize quick keyword entry while still supporting advanced query criteria.
- Use `收支對象` as the prototype label for the broader person/fund filter; this remains reviewable copy, not a final behavior-spec decision.
- Treat `已退款` / `未退款` as member-paid reimbursement states in the prototype. Income and fund-paid expenses are excluded when either reimbursement-status filter is active.
- Do not use the dashboard month switcher on the search page. Date range controls are the search page's time filter.

## States Covered

- search page default empty-result prompt with no active query
- keyword search with matching records
- filter modal open/close
- type filter in modal
- active category filter in modal
- member/fund participation filter in modal
- reimbursement-status filter in modal
- start-only date range in modal
- end-only date range in modal
- bounded date range in modal
- sort by date or amount in modal
- combined filters
- empty result state
- reset/clear state
- detail dialog opened from a filtered result

## Responsive and Accessibility Baseline

- Keyword search and the icon-only filter button are keyboard reachable from the page surface; the filter button keeps an accessible label for screen readers.
- The active filter button state is visually distinct and still exposes the applied-condition count through its accessible label.
- Modal query controls are keyboard reachable native inputs/selects with explicit accessible labels.
- The search field has a Lucide search icon as visual support and a visible placeholder.
- Filter controls use compact native selects and date inputs so mobile browsers get platform date pickers where available.
- The filter modal uses a two-column grid from small breakpoints and a single column on narrower screens.
- Clear and apply actions live in the modal footer.
- Existing record detail modal focus and close behavior is unchanged.

## UX Acceptance Inputs

- Users can find a record by typing text from visible record fields.
- Users can clear keyword search from the input with an `X` button; if no filter/sort criteria remain, the initial empty-result prompt returns.
- Users see an initial empty-result prompt instead of a record list before searching or setting criteria.
- Users can open `篩選`, narrow records by type, active category, person/fund, refund state, and optional date boundaries, then close the modal without losing query state.
- Users can tell from the filter button style when filter/sort criteria are currently applied.
- Users who select a type only see categories for that type in the category filter.
- Users who select `收入` do not see `基金` in the `收支對象` filter.
- Users can choose one sort order in the filter modal and press `套用`.
- Users can change filter/sort controls in the modal without affecting results until `套用`.
- Users can clear modal filter/sort draft state, then press `套用` to update results.
- Users can open details from filtered results and still see valid actions.
- Archived categories are not offered as filter options and are not matched by keyword search.

## E2E Scenario Candidates

- Search for a category/member/note term and see only matching active records.
- Clear the keyword with the input `X` button and verify keyword matching is removed from the result set.
- Open `/search` with no query and verify the initial empty-result prompt appears without records.
- Open the filter modal from the search page and close it without changing the keyword search.
- Filter by `支出`, an active category, a member, and `未退款`, verify results do not change before `套用`, then apply and verify only active matching records remain.
- Select `收入` and verify the category filter only shows active income categories; select `支出` and verify it only shows active expense categories.
- Select `收入` and verify the `收支對象` filter excludes `基金`; switch back to `支出` or `全部` and verify `基金` is available again.
- Select `基金` and verify fund-paid expense records appear while member-paid expenses do not.
- Select `已退款` and verify reimbursed member-paid expenses appear while income and fund-paid expenses do not.
- Use start-only and end-only date filters from the modal, press `套用`, and verify boundary dates are included.
- Change sort from the modal, press `套用`, and verify visible order.
- Clear query state and verify the full active record list returns.
- Open a filtered record detail and verify existing edit/delete/refund affordance behavior remains intact.

## Known Gaps

- Query state is local component state only; URL persistence/bookmarking is not decided.
- The prototype loads active records for `/search`; final technical design must set performance limits and server query behavior.
- Keyword matching is client-side prototype behavior and does not define final Prisma query or performance strategy.
- `收支對象` is a prototype label that needs user review.
- Reimbursement-status handling for non-applicable records is provisionally chosen for review and must be confirmed in Behavior Spec.
- No new seeded fixtures were added in this gate.

## Verification

- `corepack pnpm type-check` passed.
- First parallel `corepack pnpm lint` attempt failed because concurrent Prisma generation raced on `src/generated/prisma/internal`.
- Re-running `corepack pnpm lint` by itself passed.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm query controls belong on the existing `/search` page.
  - Confirm the page surface should keep only keyword search plus an icon-only filter button.
  - Confirm `收支對象` is understandable for person/fund filtering.
  - Confirm reimbursement-status filters should exclude income and fund-paid expenses.
  - Confirm date range should replace month switching on the search page.
- must_check:
  - Prototype remains a real production-stack slice.
  - Prototype does not imply final server query, URL state, or Prisma filter design is decided.
  - Archived categories are excluded from category options and keyword matching.
- acceptance_signals:
  - Behavior Spec can define final query semantics and E2E scenarios from this prototype.
  - Technical Design can choose state persistence and data-access boundaries without changing UX intent.
- unresolved_blockers:
  - Final date range defaults and server query limits.
  - Final Traditional Chinese label for member/fund participation.
  - Final behavior for non-reimbursement-applicable records under refund-status filters.
- next_step:
  - Behavior Spec / BDD / E2E for `record-search-sort-filter` after explicit prototype approval.
