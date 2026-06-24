---
id: prototype-reimbursement-payment-flow
stage: experience-prototype
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
outputs:
  - production_stack_prototype
  - ux_acceptance_criteria_draft
  - e2e_scenario_candidates
trace_links:
  routes:
    - src/app/(app)/(home)/page.tsx
    - src/app/(app)/search/page.tsx
  components:
    - src/app/record-list-detail.tsx
    - src/app/batch-action-dialog.tsx
    - src/app/record-search-panel.tsx
    - src/app/reimbursement-payment-fields.tsx
reviewed_at: 2026-06-24
---

# Experience Prototype: Reimbursement Payment Flow

## Prototype Summary

- routes: `/` record detail dialog, `/search` batch refund dialog
- review_url: `http://localhost:3000/` and `http://localhost:3000/search`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React client components, TypeScript, Tailwind CSS, local shadcn-style components, Lucide icons, Sonner toast
- component_library_usage: existing Dialog, Alert, Button, Field, Input, NativeSelect, Item components
- fixture_or_mock_strategy: Uses existing local dashboard/search data and existing refund actions. Payment fields are interactive prototype fields only; backend persistence and schema are intentionally not implemented in this gate.
- release_target: `local_dev`

## UX Direction

- `退款` now asks the finance-capable user to record payment evidence before completing settlement.
- Single-record refund keeps the current detail-dialog entry point, and the refund form does not show its own title.
- Batch refund keeps the current search-selection entry point, but the confirmation dialog now requires one paid-to member before showing payment fields.
- The top record card already provides settlement facts such as payer, amount, and record context, so the refund form does not repeat them.
- The shared payment block only shows editable payment evidence fields:
  - 付款方式
  - 付款日期
  - 交易備註
- Copy explicitly says the app records payment evidence, does not execute transfer, and does not create another household expense.
- Cross-member batch reimbursement is blocked in the prototype by disabling confirmation.

## States Covered

- Single refundable member-paid expense opens `確認退款`.
- Payment field block appears inside the single-record refund confirmation.
- Payment method uses a controlled select input.
- Payment date defaults to the current local date and remains editable.
- Optional transaction note uses a single-line text input.
- Batch refund with one paid-to member shows the same payment field block.
- Batch refund with multiple paid-to members disables `確認退款`.
- Batch refund dialog shows `將處理` and `略過` side by side, with `退款總金額` on its own row.
- Existing ineligible-record warning still appears for mixed eligibility.

## Interaction Details

- Single-record flow:
  - User opens an eligible member-paid expense detail.
  - User selects `退款`.
  - Dialog title is `確認退款`.
  - User reviews the existing record summary card and enters only editable payment evidence.
  - `確認退款` currently submits the existing action; payment fields are not persisted until technical design/implementation.
- Batch flow:
  - User searches records, enters selection mode, selects refundable expenses, and chooses `批次退款`.
  - Batch refund summary shows processed count and skipped count side by side, then refund total on the next row.
  - If eligible records belong to one paid-to member, the dialog shows a single payment evidence block.
  - If eligible records belong to multiple paid-to members, confirmation is disabled.
- Field behavior:
  - `付款方式` options are `銀行轉帳`, `現金`, `其他`.
  - `付款日期` is editable so the user can record a payment that happened earlier.
  - `交易備註` is an optional single-line input for transfer digits, receipt details, or notes.

## Responsive Baseline

- Desktop: editable fields use the existing form layout without repeating record summary information.
- Mobile/narrow: payment fields stack into one column without clipped labels or buttons.
- Dialog width remains constrained by existing Dialog behavior; the payment field block avoids nested cards.
- Dialog content wraps without overlapping footer buttons.

## Accessibility And Focus

- Payment field section uses `aria-labelledby`.
- Editable inputs and selects have explicit text labels without field-level icons.
- Static settlement facts are not focusable form controls, reducing false affordance.
- Existing Dialog focus trapping and close behavior remain in place.
- Disabled cross-member confirmation does not show additional explanatory text in this prototype.

## Draft UX Acceptance Criteria

- Eligible single-record refund requires visible payment evidence fields before final confirmation.
- Refund form shows only payment method, payment date, and optional note.
- Users can understand that the app records payment evidence but does not initiate transfer.
- Users can understand that refund payment evidence will not create another household expense.
- Batch refund is reviewable only when eligible records belong to one paid-to member.
- Cross-member batch selections keep confirmation unavailable.
- Existing skipped/ineligible selected-record copy remains visible when relevant.
- Existing refunded success feedback is updated to mention refund payment information.

## E2E Scenario Candidates

- Open a refundable member-paid expense from dashboard detail, click `退款`, and verify payment evidence fields are visible.
- Change payment method, payment date, and note in the single-record refund dialog.
- Submit single-record refund and verify success feedback mentions refund payment information.
- Search/select refundable expenses for the same payer member, open batch refund, and verify one payment evidence block with matching paid-to member and total amount.
- Select refundable expenses for different payer members, open batch refund, and verify confirmation is disabled with split-by-member guidance.
- Verify monthly income/expense totals do not change because payment evidence is not an ordinary ledger expense.

## Known Gaps

- Payment fields are not parsed, validated, stored, or read back from the database yet.
- No Prisma schema or migration exists for reimbursement payment evidence in this prototype.
- Existing server actions still mark reimbursement status without requiring payment details.
- Existing historical `已退款` records may have no payment evidence; legacy display behavior remains unresolved.
- Exact enum/reference-table design for payment method is deferred to Feature Technical Design.
- Readback UI for already reimbursed records is only implied by the prototype and must be finalized in Behavior Spec.
- Partial reimbursement, split payment methods, post-settlement edits, correction, and reversal remain out of scope.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm the payment fields are the right minimum evidence for MVP.
  - Confirm cross-member batch refund should be blocked instead of auto-split in this slice.
  - Confirm wording clearly separates recording payment evidence from executing transfer.
  - Confirm the refund form is terse enough and does not repeat the record card.
- must_check:
  - Prototype remains frontend review work; persistence and schema are deferred.
  - Behavior Spec must define required field validation, same-member batch behavior, no-double-count assertions, and legacy missing-payment states.
  - Technical Design must define schema, transaction boundary, enums/reference data, and reporting read models.
- acceptance_signals:
  - User approves the payment evidence field set and same-member batch constraint.
  - User accepts the confirmation flow copy or requests concrete wording changes.
  - Prototype gives enough evidence to write BDD/E2E scenarios.
- unresolved_blockers:
  - None.
- next_step:
  - Behavior Spec / BDD / E2E for `reimbursement-payment-flow`.
