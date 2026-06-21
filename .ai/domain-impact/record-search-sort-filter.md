---
id: domain-impact-record-search-sort-filter
stage: domain-impact
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-search-sort-filter.md
  - .ai/domain/home-family-fund.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/record-search-sort-filter.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-21
---

# Domain Impact for Record Search, Sort, and Filter

## Summary

- intent_id: record-search-sort-filter
- maintained_domain_artifacts_updated:
  - .ai/domain/home-family-fund.md
- bounded_contexts_touched:
  - Reporting
  - Fund Ledger
  - Categorization
  - Reimbursement
  - Responsive Web Experience
- impact_type: changed_rule, changed_policy, changed_language, new_behavior

This slice adds read-model query behavior for active household ledger records. It does not change ledger mutation rules, reimbursement settlement rules, category management permissions, or the financial source of truth.

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Record query, keyword search, active category filter, member/fund participation filter, reimbursement status filter, open-ended date range, record sort order. | Payer/member wording is broadened into member/fund participation for browsing. | None. | The user wants to find records by keyword, type, category, person/fund, refund state, date, and order. |
| events | `Record query applied`. | Monthly record browsing now includes narrowed result views in addition to default month views. | None. | Querying records is a business-visible read event, not a ledger mutation. |
| commands | `Search, sort, or filter records`. | `View monthly records` remains valid but can be refined by query criteria. | None. | Prototype and BDD need explicit user actions for search/filter/sort. |
| policies | Queries apply only to active readable household records; category filters use active categories only; archived categories are not searchable/filterable; date filters use occurrence dates and allow start-only, end-only, or bounded ranges; reimbursement filters apply to reimbursement-relevant records. | Reporting read model must preserve detail/edit/delete/reimbursement affordances for records that remain in results. | None. | Query behavior should make records easier to find without changing permissions or financial totals. |
| aggregates_or_invariants | MonthlyReport owns record query read-model behavior. | LedgerRecord remains the source of record facts; ReimbursementBatch remains the source of reimbursed state. | None. | Query state should not become a second financial source of truth. |
| bounded_contexts | Reporting gains record query language. | Fund Ledger, Categorization, and Reimbursement feed query criteria. | None. | The query combines data from several contexts but is still a reporting concern. |
| lifecycle_or_states | Query result states, empty result state, reset state, and reimbursement-status filtered states. | Voided records stay excluded from ordinary active record queries. | None. | Users need clear search/filter feedback while audit-only records remain outside normal browsing. |

## Downstream Impact

- prototype_states_or_flows:
  - Default record list without active query.
  - Keyword search with matching and empty results.
  - Type filter for income/expense.
  - Active category filter with no archived categories shown.
  - Member/fund participation filter that can find a selected person's or the household fund's income/expense records.
  - Reimbursement status filter for `已退款` and `未退款`.
  - Open-ended date range with start-only, end-only, and start/end values.
  - Sort order selection for newest, oldest, highest amount, and lowest amount.
  - Combined filters with reset/clear behavior.
  - Opening record detail from a filtered result while preserving existing edit/delete/reimbursement affordances.
- bdd_scenarios:
  - Search matches visible record fields including name, note, category, member display names, and visible type/payment labels.
  - Archived categories are absent from category filter options and cannot be used as a search/filter condition.
  - Combining type, category, member/fund participation, refund status, date range, and sort returns only active matching records.
  - Date start and end boundaries include records on the selected occurrence dates.
  - Reimbursement-status filtering has explicit expected behavior for income and fund-paid expenses after spec decision.
  - Unauthorized users still cannot mutate records exposed by a query result.
- technical_design_boundaries:
  - Decide whether query state lives in URL search params, client state, server actions, or a combination.
  - Define the data-access owner for composing Prisma filters across record fields, category, members, payment source, reimbursement status, and occurrence date.
  - Decide how the current month selector interacts with open-ended date ranges.
  - Ensure archived categories are excluded from filter options and search/filter criteria without making historical records unreadable when they appear by other criteria.
  - Define reset/default query behavior and cache/revalidation expectations after edit/delete/reimbursement actions.
- tdd_domain_tests:
  - Unit or integration coverage for query criteria mapping.
  - Tests for active-only record results and voided-record exclusion.
  - Tests for active-category-only filter options.
  - Tests for reimbursement-status edge cases.
  - E2E for combined filter/sort/search and detail-dialog continuity.
- release_or_learning_signals:
  - Local review should check whether users understand the member/fund participation label.
  - Local review should check whether optional start/end dates feel natural compared with the existing month selector.
  - Local review should check whether users expect archived categories or non-reimbursement-applicable records to appear under search/filter conditions.

## Open Questions and Risks

- product:
  - What is the final Traditional Chinese label for the member/fund participation filter?
  - Should query state be shareable/bookmarkable through the URL?
- domain:
  - When `已退款` or `未退款` is selected, should income and fund-paid expenses be excluded, shown as not applicable, or only visible when no reimbursement status filter is active?
- data_or_ownership:
  - Date range should use occurrence date. Technical design must decide whether it replaces, constrains, or coexists with the existing month selector.
  - Keyword search across all visible fields may span LedgerRecord, Category, Member, and display labels; the implementation should keep Reporting as query owner rather than spreading query semantics across mutation contexts.
- policy_or_permission:
  - Record queries must not expose voided records in ordinary browsing and must not grant edit/delete/reimbursement capabilities beyond existing authorization rules.
  - Archived categories are readable on historical records but not searchable/filterable.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm query behavior belongs to Reporting and does not change ledger/reimbursement mutation rules.
  - Confirm archived categories are excluded from search/filter criteria.
  - Confirm downstream prototype should resolve UI labels, date/month interaction, and reimbursement-not-applicable behavior.
- must_check:
  - Trace links point to maintained domain artifact.
  - Long-lived domain rules are also present in `.ai/domain/home-family-fund.md`.
  - Downstream impacts are actionable for prototype, BDD/E2E, and technical design.
- acceptance_signals:
  - Prototype can design the query controls and result states from this delta.
  - Behavior Spec can write scenarios for each filter, sort order, combined query, and edge case.
  - Technical Design can choose query ownership and state persistence without revisiting product intent.
- unresolved_blockers:
  - Final member/fund filter label.
  - Date range relationship to the existing month selector.
  - Reimbursement-status behavior for non-reimbursement-applicable records.
- next_step:
  - Experience Prototype for `record-search-sort-filter`.
