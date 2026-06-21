---
id: implementation-record-search-sort-filter
stage: tdd-implementation
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-search-sort-filter.md
  - .ai/domain-impact/record-search-sort-filter.md
  - .ai/prototype/record-search-sort-filter.md
  - .ai/spec/record-search-sort-filter.md
  - .ai/technical-design/record-search-sort-filter.md
outputs:
  - search_page_record_query
  - query_filter_sort_modal
  - active_record_search_read_model
  - focused_unit_and_e2e_evidence
trace_links:
  app:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-panel.tsx
    - src/app/record-list-detail.tsx
    - src/app/record-query.ts
    - src/app/home-dashboard-data-source.ts
  tests:
    - src/app/record-query.test.ts
    - src/app/home-dashboard-data-source.test.ts
    - e2e/record-search.spec.ts
  support:
    - src/app/member-management-members.ts
    - src/modules/reimbursement/reimbursement-command.ts
reviewed_at: 2026-06-21
---

# Record Search Sort Filter Implementation

## Summary

- Added a reusable `record-query` helper for search-page keyword search, active-only filtering, date range filtering, participant filtering, reimbursement filtering, and sort ordering.
- Kept `/search` as the owner of the query experience through `RecordSearchPanel`, while `RecordListDetail` remains the shared list/detail shell.
- Preserved the accepted UX: no page header, initial empty result prompt, search input plus icon-only filter button, modal-only filter/sort controls, apply-only modal changes, clear keyword button, and active filter button styling.
- Constrained category options by selected type and constrained participant options so income never offers `基金`.
- Limited keyword query matching to record names and formatted amounts.
- Moved query controls, query state, filtering, and search empty-state selection out of `RecordListDetail` and into `RecordSearchPanel`.
- Added active-record data-source coverage for `getSearchPageData()`.
- Added small TypeScript annotations at existing Prisma boundaries so full type-check stays clean under the generated Prisma client.
- Added an `sr-only` filter-dialog description to remove the Radix dialog accessibility warning without adding visible instructional copy.

## TDD Evidence

Tests were added before or alongside implementation:

- `src/app/record-query.test.ts`
  - active-only category options
  - type-constrained category and participant options
  - invalid draft reset when type changes
  - keyword matching for name and amount only
  - non-keyword field exclusion for notes, categories, members, statuses, and dates
  - archived/voided exclusion
  - member and fund participant filtering
  - refunded/unrefunded filters
  - open-ended date ranges
  - date and amount sorting
  - active filter count behavior
- `src/app/home-dashboard-data-source.test.ts`
  - `getSearchPageData()` loads active records for the search page.
- `e2e/record-search.spec.ts`
  - initial empty search page
  - keyword search and clear
  - modal draft changes do not affect results until apply
  - dynamic category and participant options
  - unrefunded filter and detail opening
  - amount sorting

Verification commands run in this implementation gate:

- `corepack pnpm test src/app/home-dashboard-data-source.test.ts src/app/record-query.test.ts`
  - result: passed, 2 files / 11 tests
- `corepack pnpm type-check`
  - result: passed
- `corepack pnpm test:e2e e2e/record-search.spec.ts`
  - result: passed, 5 tests
- `corepack pnpm lint`
  - result: passed
- `corepack pnpm test`
  - result: passed, 30 files / 152 tests

## Implemented Contracts

- `/search` shows no records until the user enters a keyword or applies at least one filter/sort condition.
- `RecordSearchPanel` owns search controls and filtered results; `RecordListDetail` owns only list rendering, detail selection, and detail actions.
- Keyword search checks record name and formatted amount only.
- Search and filters only include active records; notes, category names, member labels, status labels, dates, and voided records do not make records discoverable by keyword.
- Filter modal state is draft state; changes affect results only after `套用`.
- `清除` inside the modal resets only draft filter/sort state and still requires `套用`.
- Search input `清除搜尋` clears keyword results and returns to the initial empty prompt when no filters/sort are active.
- Reimbursement filters include only member-paid reimbursable expenses.
- Category options are active-only and type-constrained.
- Participant options are type-constrained; `基金` is available for expense queries but not income queries.
- The filter button stays icon-only and uses an active style when filter/sort conditions are applied.

## Known Gaps For Verification

- Manual visual review across desktop/mobile should confirm modal spacing, active filter styling, and empty-result copy.
- The E2E seed does not include an already-reimbursed expense; the `已退款` branch is covered by unit tests, while E2E covers `未退款`.
- Production readiness, analytics, and monitoring remain outside this local_dev implementation gate.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - inspect `/search` initial empty state, search clear button, and icon-only active filter button
  - inspect filter modal draft/apply behavior and dynamic category/participant options
  - inspect reimbursement, date, participant, category, and sort combinations against expected seeded data
- acceptance_signals:
  - focused unit tests, full unit suite, type-check, lint, and targeted E2E pass
  - implementation follows the approved prototype/spec/technical design
  - dashboard month switcher remains out of the search experience
- unresolved_blockers:
  - none for local_dev implementation review
- recommended_next_gate:
  - verification
- stop_condition: Wait for explicit user approval before moving to Verification.
