---
id: learning-record-search-sort-filter
stage: learning
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-search-sort-filter.md
  - .ai/spec/record-search-sort-filter.md
  - .ai/technical-design/record-search-sort-filter.md
  - .ai/implementation/record-search-sort-filter.md
  - .ai/verification/record-search-sort-filter.md
  - .ai/release/record-search-sort-filter-local-dev-readiness.md
outputs:
  - learning_questions
  - manual_feedback_signals
  - guardrails
  - follow_up_decision_criteria
trace_links:
  release:
    - .ai/release/record-search-sort-filter-local-dev-readiness.md
  verification:
    - .ai/verification/record-search-sort-filter.md
  route:
    - /search
reviewed_at: 2026-06-21
---

# Record Search Sort Filter Learning Loop

## Learning Summary

- release_target: local_dev
- tracking_maturity: manual_feedback_and_smoke
- analytics_provider: not selected
- monitoring_provider: not selected
- decision: learning_signals_defined

This slice adds a dedicated `/search` record query experience. For `local_dev`, the learning goal is to confirm that household members can find historical records faster with name/amount search and modal filters, without confusing the dashboard's recent-record summary or the existing record detail actions.

## Learning Questions

| Question | Why it matters | Signal |
|---|---|---|
| Does starting with an empty result list make the search page feel intentional? | The accepted UX avoids showing all records before search/filter input. | Reviewer understands that they need to type a keyword or apply filters and does not interpret the page as broken. |
| Is name/amount-only keyword search enough? | User explicitly narrowed keyword scope after implementation review. | Reviewer can find expected records by name and amount, and does not expect note/category/member/date terms to match keyword search. |
| Is the icon-only filter button discoverable and visually clear when active? | The page keeps only search input plus an icon button. | Reviewer can open filters quickly and can tell when filter/sort criteria are applied. |
| Does apply-only modal behavior feel predictable? | Draft changes do not affect results until `套用`. | Reviewer can change controls, close without applying, and understands why results are unchanged. |
| Are `類型`, `分類`, `收支對象`, and `退款狀態` labels understandable? | The filter combines income source, expense payer, and fund-paid records under one query model. | Reviewer can find a person or fund's records without asking whether income/expense fields differ. |
| Does excluding `基金` for income match user expectations? | Income cannot be sourced by the household fund in this model. | Reviewer agrees that income filter options only show members. |
| Are date range controls enough without the dashboard month switcher? | `/search` intentionally avoids the month switcher. | Reviewer can find records with start-only, end-only, and bounded dates. |
| Does opening record detail from search results preserve confidence? | Search must not break edit/delete/reimbursement workflows. | Reviewer can open a result detail and sees familiar detail/action behavior. |

## Manual Feedback Plan

- Reviewer profile: local app reviewer using seeded household data.
- Review routes:
  - `/search`
  - `/?month=2026-06`
- Review tasks:
  - Open `/search` and confirm the initial empty prompt is clear.
  - Search by record name.
  - Search by amount.
  - Try note/category/member/date terms and confirm the narrowed keyword behavior feels correct.
  - Clear keyword search with the input `X`.
  - Open `篩選與排序`, change filters, close without applying, and confirm results stay unchanged.
  - Apply type/category/member/fund/refund/date filters.
  - Switch type to `收入` and confirm `基金` disappears from `收支對象`.
  - Sort by date and amount.
  - Open a result detail and confirm existing actions are intact.
  - Return to dashboard and confirm its `紀錄` panel remains a recent-record summary.

## Guardrails

- Search page continues to load active records only.
- Voided records remain hidden from ordinary search.
- Archived categories remain unavailable as filter options and are not keyword-searchable.
- Keyword search remains name/amount only unless a new intent changes the scope.
- Dashboard remains separate from the search experience.
- Existing record detail permissions and server-side mutation guards remain authoritative.
- Local development still requires Docker/Postgres for E2E and deterministic seeded smoke checks.

## Operational Signals

Automated local guardrails:

- `corepack pnpm type-check`
- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm test:e2e e2e/record-search.spec.ts`

Manual signals:

- Reviewer notes on whether empty initial state is clear.
- Reviewer notes on whether name/amount-only keyword search is sufficient.
- Reviewer notes on filter button discoverability and active styling.
- Reviewer notes on whether modal apply-only behavior is understandable.
- Reviewer notes on `收支對象` wording.
- Reviewer notes on date range usability without month switching.
- Reviewer notes on result detail continuity.

## Follow-Up Decision Criteria

- If users expect note/category/member/date keyword matching, start a new Intent Intake for expanded keyword search scope.
- If users need shareable searches or refresh persistence, start a new Intent Intake for URL-backed query state.
- If active-record volume makes `/search` slow, start a new Intent Intake for server-side filtering, pagination, or indexed search.
- If `收支對象` wording confuses users, start a new Intent Intake for filter copy and information architecture polish.
- If the icon-only filter button is not discoverable, start a small UX polish slice for filter affordance alternatives.
- If mobile reviewers report modal clipping or hard-to-reach controls, start a responsive modal hardening slice.
- If no local review issues are found, proceed to Artifact Compression for this completed slice.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - confirm these learning questions reflect the local review you want
  - confirm no analytics/monitoring tooling is needed for this local_dev slice
  - confirm Artifact Compression should be next if no follow-up slice is needed
- unresolved_blockers:
  - None for Artifact Compression after approval.
- recommended_next_gate:
  - artifact-compression
- stop_condition: Wait for explicit user approval before starting Artifact Compression.
