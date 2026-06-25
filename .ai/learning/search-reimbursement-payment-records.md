---
id: learning-search-reimbursement-payment-records
stage: learning-loop
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
created_at: 2026-06-26
updated_at: 2026-06-26
inputs:
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
  - .ai/prototype/search-reimbursement-payment-records.md
  - .ai/spec/search-reimbursement-payment-records.md
  - .ai/technical-design/search-reimbursement-payment-records.md
  - .ai/implementation/search-reimbursement-payment-records.md
  - .ai/verification/search-reimbursement-payment-records.md
  - .ai/release/search-reimbursement-payment-records-local-dev-readiness.md
outputs:
  - learning_questions
  - local_dev_signals
  - guardrails
  - follow_up_decision_criteria
trace_links:
  release:
    - .ai/release/search-reimbursement-payment-records-local-dev-readiness.md
  verification:
    - .ai/verification/search-reimbursement-payment-records.md
  behavior:
    - .ai/spec/search-reimbursement-payment-records.md
  domain_impact:
    - .ai/domain-impact/search-reimbursement-payment-records.md
reviewed_at:
---

# Search Reimbursement Payment Records Learning Loop

## Decision Summary

- decision: learning_signals_defined_for_local_dev
- tracking_maturity: manual_and_test_evidence
- analytics_provider: not_selected
- monitoring_provider: not_selected
- next_gate: Artifact Compression after user review, unless learning exposes a new intent.

## Learning Questions

1. Do users understand that `退款紀錄` is reimbursement payment evidence, not an ordinary income or expense?
2. Does separating `收支紀錄` and `退款紀錄` into tabs feel clearer than mixed search results?
3. Does the default blank state in `退款紀錄` reduce noise, or do users expect recent refund records to appear immediately?
4. Are `收款成員`, payment date range, and sort enough filters for MVP refund-record search?
5. Do users still ask for `付款方式` as a filter after seeing it in keyword search and detail?
6. Is the row copy `付給 <收款成員>` plus payment method enough to identify a refund record without showing the linked expense as the title?
7. Can users move confidently from an already-refunded expense to `查看退款紀錄`, then to `查看關聯紀錄`?
8. Do users understand why refund records are read-only and excluded from batch delete/refund actions?
9. Do users expect to edit, reverse, correct, partially refund, or split reimbursement payment evidence from the search page?

## Local Dev Signals

| Signal | How To Collect | Linked Outcome |
|---|---|---|
| Reviewer can find a known refund payment from the `退款紀錄` tab using `退款紀錄`, 收款成員, amount, or note | Manual `/search` review notes | Refund payment evidence is discoverable. |
| Reviewer does not expect refund records to appear in `收支紀錄` results | Manual review of overlapping keyword search | Tab separation protects domain meaning. |
| Reviewer can explain why `退款紀錄` totals are separate from ordinary ledger net totals | Manual review of footer totals | No-double-count policy is understandable. |
| Reviewer can open an already-refunded expense and find `查看退款紀錄` without guidance | Manual smoke path from `收支紀錄` | Bidirectional readback is discoverable. |
| Reviewer can open `查看關聯紀錄` and recognize the related ledger row/category | Manual refund detail review | Related-record navigation is clear. |
| Reviewer does not attempt to select refund rows for batch actions | Manual observation of `退款紀錄` tab | Read-only result policy is clear. |
| Reviewer can use mobile tabs and close control without overlap or confusion | Manual mobile viewport review | Responsive search layout is understandable. |
| Reviewer asks for edit/reversal/correction only as a separate workflow, not as missing search behavior | Manual feedback notes | Search remains an audit/readback surface. |

## Guardrails

| Guardrail | Current Evidence | Follow-Up Trigger |
|---|---|---|
| Refund records are not ordinary ledger records | E2E tab separation and server action read model | Refund evidence appears in ordinary ledger results or batch footer totals. |
| Refund records do not double-count reports/totals | Domain impact, release scope, query tests, E2E footer assertions | Ledger net total changes because refund evidence exists. |
| Refund records are household-scoped and permission-scoped | Server action authorization and household filters | Cross-household payment evidence appears in search. |
| Refund tab is read-only | E2E confirms no selection mode and no edit/delete/refund actions in detail | User can submit a refund payment id to ledger mutation actions. |
| Already-refunded legacy expenses without payment evidence remain compatible | Release risk and readback loader behavior | Legacy `已退款` records break detail or fabricate payment evidence. |
| Mobile tab/close layout remains usable | E2E bounding-box check | Close button overlaps tabs or search input on mobile. |

## Future Production Signals

If this slice moves beyond local_dev, add privacy-conscious tracking for:

- `退款紀錄` tab opened.
- refund search submitted, with only coarse query category such as keyword/filter/date, not raw text.
- refund detail opened from search.
- refund detail opened from an already-refunded expense.
- related ledger records opened from refund detail.
- refund search returned zero results.
- server-side refund search rejection reason.
- user feedback requesting payment method filter, edit, correction, reversal, partial refund, or split payment.

Do not log record names, transaction notes, exact amounts, household names, member emails, or sensitive family details in analytics.

## Review Cadence

- local_dev review: during the next hands-on review after applying migrations and seed data.
- first follow-up check: after the reviewer searches at least one ordinary record and one refund record, then follows both readback directions.
- decision owner: product/developer pair in this thread.

## Follow-Up Decision Criteria

- Create a new intent for refund-record correction/reversal if users need to fix recorded payment evidence.
- Create a new intent for payment-method filtering if manual review shows keyword search is not enough.
- Create a new intent for default recent refund records if reviewers consistently expect the `退款紀錄` tab to show recent evidence before searching.
- Create a new intent for permission policy refinement if general members should not see all household reimbursement payment evidence.
- Return to TDD Implementation if local review exposes incorrect totals, wrong linked records, broken mobile layout, or misleading copy.
- Proceed to Artifact Compression if local_dev review accepts the tab separation, read-only refund records, row copy, and bidirectional readback.

## Review Gate

- status: review
- recommended_decision: approve_for_artifact_compression
- recommended_next_gate: Artifact Compression
- stop_condition: Wait for explicit user approval before compression.
