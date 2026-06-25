---
id: learning-reimbursement-payment-flow
stage: learning-loop
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
created_at: 2026-06-25
updated_at: 2026-06-25
inputs:
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/prototype/reimbursement-payment-flow.md
  - .ai/spec/reimbursement-payment-flow.md
  - .ai/implementation/reimbursement-payment-flow.md
  - .ai/verification/reimbursement-payment-flow.md
  - .ai/release/reimbursement-payment-flow-local-dev-readiness.md
outputs:
  - learning_questions
  - local_dev_signals
  - guardrails
  - follow_up_decision_criteria
trace_links:
  release:
    - .ai/release/reimbursement-payment-flow-local-dev-readiness.md
  behavior:
    - .ai/spec/reimbursement-payment-flow.md
  domain_impact:
    - .ai/domain-impact/reimbursement-payment-flow.md
reviewed_at:
---

# Reimbursement Payment Flow Learning Loop

## Decision Summary

- decision: learning_signals_defined_for_local_dev
- tracking_maturity: manual_and_test_evidence
- analytics_provider: not_selected
- monitoring_provider: not_selected
- next_gate: Artifact Compression after user review, unless learning exposes a new intent.

## Learning Questions

1. Do finance-capable users understand that `退款` records payment evidence, but the app does not execute a transfer?
2. Are `付款方式`, `付款日期`, and `交易備註` enough evidence for MVP reimbursement audit?
3. Does hiding paid-to member, amount, and payment source from the form reduce confusion, or do users still expect to review those facts in the dialog?
4. Does the batch refund warning make the same-member limitation clear enough?
5. Does blocking cross-member batch refund create real workflow friction that should become a split-by-member batch intent?
6. Do users need to view payment evidence after a record is already `已退款`, especially for audit or monthly review?
7. Do users ask to edit, correct, reverse, partially refund, or split reimbursement payments after local review?

## Local Dev Signals

| Signal | How To Collect | Linked Outcome |
|---|---|---|
| User can complete a single-record refund without asking what payment fields mean | Manual smoke/review session notes | Payment evidence capture is understandable. |
| User can explain that the app records, not sends, the reimbursement payment | Manual interview during local review | External payment execution remains correctly out of scope. |
| User accepts that paid-to member, amount, and payment source are derived from the selected record | Manual observation in refund dialog | Form only shows editable fields without losing trust. |
| User can identify why cross-member batch refund is disabled | Manual review of `/search` mixed-member selection | Same-member batch policy is clear. |
| User confirms refund total before submitting a batch refund | Manual smoke or browser review note | Batch confirmation prevents accidental settlement. |
| User does not expect reimbursement payment to appear as another monthly expense | Manual review of dashboard/monthly totals after refund | No-double-count policy is understandable. |
| Error toast or server log reason is clear enough when refund fails | Local dev console and review notes | Failed refund paths are diagnosable. |

## Guardrails

| Guardrail | Current Evidence | Follow-Up Trigger |
|---|---|---|
| No payment evidence without reimbursement status change | Transaction tests and full E2E verification | Payment row exists while ledger record remains `待退款`. |
| No reimbursement status change without payment evidence for new settlements | Server-side validation and persistence tests | New `已退款` batch has no payment row. |
| Cross-member selection is not completed as one batch | Component warning, disabled confirm, server action rejection | Any cross-member direct submission writes a reimbursement batch. |
| Payment evidence is not counted as household income or expense | Domain/spec/release trace and reporting behavior | Monthly totals change only because payment evidence was recorded. |
| Legacy reimbursed records remain compatible | Persistence design accepts missing payment rows | Existing local data breaks record detail or report loading. |
| Refund dialog stays focused on editable fields | Component implementation and E2E selectors | Paid-to member, amount, or source becomes a misleading form control. |

## Future Production Signals

If this slice moves beyond local_dev, add privacy-conscious product and operational tracking for:

- refund dialog opened from record detail or search.
- refund confirmed with payment method category and amount bucket.
- batch refund blocked because of cross-member selection.
- server-side refund rejection reason code.
- reimbursement payment persistence failure.
- already reimbursed record opened with missing legacy payment evidence.
- user feedback requesting edit, reversal, partial refund, split payment, or split-by-member batch.

Do not log record names, transaction notes, exact amounts, household names, member emails, or sensitive family details in analytics.

## Review Cadence

- local_dev review: during the next hands-on review after applying migrations and seed data.
- first follow-up check: after the reviewer performs at least one single-record refund and one batch-refund attempt from `/search`.
- decision owner: product/developer pair in this thread.

## Follow-Up Decision Criteria

- Create a new intent for split-by-member batch refund if users often select records across multiple paid-to members and expect the app to split them.
- Create a new intent for reimbursement payment readback if users need to audit payment method/date/note after settlement from record detail or reports.
- Create a new intent for correction/reversal if users need to fix a recorded reimbursement payment.
- Create a new intent for partial or split-payment reimbursement only if real review data shows it is common enough to justify the added accounting rules.
- Return to TDD Implementation if local review exposes a missing server-side rejection, incorrect monthly total, or unclear failure behavior.
- Proceed to Artifact Compression if local_dev review accepts the MVP payment evidence shape and same-member batch limitation.

## Review Gate

- status: review
- recommended_decision: approve_for_artifact_compression
- recommended_next_gate: Artifact Compression
- stop_condition: Wait for explicit user approval before compression.
