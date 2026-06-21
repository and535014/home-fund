---
id: verification-record-search-sort-filter
stage: verification
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-search-sort-filter.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/record-search-sort-filter.md
  - .ai/prototype/record-search-sort-filter.md
  - .ai/spec/record-search-sort-filter.md
  - .ai/technical-design/record-search-sort-filter.md
  - .ai/implementation/record-search-sort-filter.md
outputs:
  - verification_result
  - test_evidence
  - release_target_support
trace_links:
  implementation_commits:
    - 05a7fe1
  verified_files:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-panel.tsx
    - src/app/record-list-detail.tsx
    - src/app/record-query.ts
    - src/app/home-dashboard-data-source.ts
  tests:
    - src/app/record-query.test.ts
    - src/app/home-dashboard-data-source.test.ts
    - e2e/record-search.spec.ts
reviewed_at: 2026-06-21
---

# Record Search Sort Filter Verification

## Result

- decision: pass_for_local_dev
- release_target_supported: local_dev
- recommended_next_gate: Target-Aware Release for local_dev readiness
- production_readiness: not assessed

## Verification Summary

The implementation matches the approved record search, sort, and filter scope for `local_dev`:

- `/search` owns the search experience through `RecordSearchPanel`; `RecordListDetail` is no longer coupled to search controls or query state.
- The search page has no page header and keeps only the keyword input plus icon-only filter button on the page surface.
- Initial `/search` results are empty until a keyword is entered or a filter/sort condition is applied.
- Keyword search matches record name and formatted amount only, per the latest approved behavior.
- Filters support type, active category, member/fund participation, reimbursement status, optional start/end dates, and one sort select.
- Filter modal draft state applies only when `套用` is activated; closing the modal leaves current results unchanged.
- Active filter button styling and accessible labels reflect applied filter/sort conditions.
- Search page data loads active records only, so voided records are not searchable.
- Category options exclude archived categories, while record details can still render category labels from the loaded category map.
- Dashboard recent-record behavior remains separate from search-page query behavior.

## Test Evidence

- `corepack pnpm type-check`
  - result: passed
- `corepack pnpm lint`
  - result: passed
- `corepack pnpm test`
  - result: passed, 30 files / 152 tests
- `corepack pnpm build`
  - result: passed
- `corepack pnpm test:e2e e2e/record-search.spec.ts`
  - result: passed, 5 tests
  - migrations and E2E seed completed successfully before the run

## Acceptance Criteria Coverage

- AC 1-4: covered by route implementation and E2E initial-state assertions.
- AC 5-8: covered by `record-query` unit tests and E2E keyword/clear flow.
- AC 9-16: covered by E2E filter modal open/apply/close behavior and active filter button assertion.
- AC 17-24: covered by unit tests for type-constrained options and E2E option assertions.
- AC 25-30: covered by unit tests for member/fund and reimbursement filtering; E2E covers fund and `未退款` representative paths.
- AC 31-34: covered by unit tests for open-ended and bounded occurrence-date filtering.
- AC 35: covered by implementation review; `/search` does not render `MonthSwitcher`.
- AC 36: covered by unit sort tests and E2E amount-sort representative path.
- AC 37-38: covered by data-source tests, unit active-only predicate tests, and E2E empty-result behavior.
- AC 39-40: covered by E2E detail-opening flow and implementation reuse of existing `RecordDetailDialog`.
- AC 41-42: covered by implementation review; query state is local and UI copy remains Traditional Chinese.

## Code Review Notes

- `RecordSearchPanel` cleanly owns query state, modal draft state, filtering, and search-specific empty states.
- `RecordListDetail` now accepts already-selected records and an empty message, preserving detail focus return and mutation refresh behavior without search coupling.
- `record-query.ts` is route-neutral and exposes the smallest query API: `applyRecordQuery(records, query)`.
- The data-source addition is read-only and filters `LedgerRecord.status` to `active`; no schema or migration change is involved.
- The implementation intentionally leaves production-scale search, pagination, and URL persistence out of scope.

## Risks And Follow-Up

- The E2E seed does not include an already-reimbursed member-paid expense; `已退款` is covered by unit tests, while browser E2E covers `未退款`.
- Full mobile modal visual review was not separately screenshotted in this gate; controls use the same responsive Dialog/Input/NativeSelect components and targeted browser flow passes.
- Intent/domain-impact artifacts still contain earlier broad keyword wording, but the approved behavior spec and technical design were updated after user feedback to name/amount-only keyword search.
- Production readiness is not implied. A target-aware release gate should still confirm local dev smoke, rollback expectations, and whether performance risk is acceptable for the selected target.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - confirm `/search` behavior in browser against the accepted UX
  - confirm name/amount-only keyword search is now correct
  - confirm `RecordSearchPanel` / `RecordListDetail` ownership split is acceptable
  - confirm moving to Target-Aware Release for local_dev readiness
- unresolved_blockers:
  - None for local_dev verification.
- recommended_next_gate:
  - target-aware-release
- stop_condition: Wait for explicit user approval before starting Target-Aware Release.
