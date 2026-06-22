---
id: learning-batch-search-record-actions
stage: learning-loop
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/batch-search-record-actions.md
  - .ai/domain-impact/batch-search-record-actions.md
  - .ai/spec/batch-search-record-actions.md
  - .ai/implementation/batch-search-record-actions.md
  - .ai/verification/batch-search-record-actions.md
  - .ai/release/batch-search-record-actions-local-dev-readiness.md
outputs:
  - learning_questions
  - local_dev_signals
  - follow_up_decision_criteria
trace_links:
  release:
    - .ai/release/batch-search-record-actions-local-dev-readiness.md
  behavior:
    - .ai/spec/batch-search-record-actions.md
  domain_impact:
    - .ai/domain-impact/batch-search-record-actions.md
reviewed_at: 2026-06-22
---

# Batch Search Record Actions Learning Loop

## Decision Summary

- decision: learning_signals_defined_for_local_dev
- tracking_maturity: manual_and_test_evidence
- analytics_provider: not_selected
- monitoring_provider: not_selected
- next_gate: Artifact Compression after user review, unless learning exposes a new intent.

## Learning Questions

1. Do finance-capable users understand that batch refund is app settlement state, not external money movement?
2. Do users understand `全選目前顯示` as loaded/rendered rows only, especially after additional pages load?
3. Does partial success feel trustworthy when some selected records are skipped?
4. Does the footer summary make the difference between current-query total and selected total clear?
5. Does removing the standalone `/reimbursements` page reduce confusion, or do users still look for a dedicated refund surface?
6. Does 100-record pagination feel responsive enough for expected local/dev data volume?

## Local Dev Signals

| Signal | How To Collect | Linked Outcome |
|---|---|---|
| User can find batch refund from `/search` without prompting | Manual smoke/review session notes | Search becomes the record-oriented refund surface. |
| User can explain why `批次退款 (n)` differs from selected count | Manual observation of mixed eligible/ineligible selection | Skipped/ineligible records are understandable. |
| User can explain `全選目前顯示` after second page loads | Manual smoke using `搜尋分頁測試` fixture and E2E evidence | Visible-row selection semantics are clear. |
| User confirms `退款總金額` before submitting | Manual smoke or browser session note | Batch refund confirmation prevents accidental settlement. |
| User does not ask for `/reimbursements` during local review | Manual feedback | Standalone refund page removal is acceptable. |
| E2E second-page load stays stable | `corepack pnpm test:e2e e2e/record-search.spec.ts` | Pagination behavior remains safe after changes. |

## Guardrails

| Guardrail | Current Evidence | Follow-Up Trigger |
|---|---|---|
| No unauthorized mutation | Domain tests and server action boundaries | Any skipped permission case mutates a record. |
| No duplicate reimbursement | Reimbursement domain tests and persisted batch update | Already reimbursed selected records become reimbursed again or create duplicate items. |
| Search does not preload all active records | Implementation and verification trace | Search page data source starts loading all records again. |
| Deleted routes are not reintroduced as workflow surfaces | Code/revalidation review | `/reimbursements` returns as navigation or product workflow without new intent. |
| Pagination remains usable at >100 results | E2E 105-record fixture | Second page fails to load or all-select selects unloaded rows. |

## Future Production Signals

If this slice moves beyond local_dev, add product/operational tracking for:

- search query submitted with result count bucket.
- selection mode toggled.
- visible-row all-select clicked with loaded-count bucket.
- batch delete confirmed with processed/skipped counts.
- batch refund confirmed with processed/skipped counts and total amount bucket.
- server action failures by reason code.
- pagination page load latency and failed page loads.
- user feedback for missing standalone refund page.

These should be designed with privacy in mind: do not log record names, exact notes, or sensitive household details.

## Review Cadence

- local_dev review: during the next hands-on review session after applying migrations and seed data.
- first follow-up check: after the reviewer uses batch refund/delete on realistic local data.
- decision owner: product/developer pair in this thread.

## Follow-Up Decision Criteria

- Create a new intent if users request query-wide "select all matching results" instead of visible-row selection.
- Create a new intent if users need a replacement reimbursement dashboard/list after `/reimbursements` removal.
- Return to TDD Implementation if mobile footer overlap is observed or mobile usage becomes release-critical.
- Return to Technical Design if production-scale query plans show indexes are insufficient.
- Proceed to Artifact Compression if local_dev review accepts visible-row selection, partial success, and removed refund page behavior.

## Review Gate

- status: review
- recommended_decision: approve_for_artifact_compression
- recommended_next_gate: Artifact Compression
- stop_condition: Wait for explicit user approval before compression.
