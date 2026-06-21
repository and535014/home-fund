---
id: prototype-record-detail-reimbursement
stage: experience-prototype
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-detail-reimbursement.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/record-detail-reimbursement.md
outputs:
  - production_stack_prototype
  - ux_acceptance_inputs
  - e2e_scenario_candidates
trace_links:
  intent:
    - .ai/intent/record-detail-reimbursement.md
  domain_impact:
    - .ai/domain-impact/record-detail-reimbursement.md
  component_paths:
    - src/app/record-list-detail.tsx
    - src/app/(app)/page.tsx
reviewed_at: 2026-06-21
---

# Experience Prototype for Record Detail Reimbursement

## Summary

- route: `/`
- prototype_host: existing dashboard `紀錄` list and record detail modal
- primary_component: `src/app/record-list-detail.tsx`
- integration_point: `src/app/(app)/page.tsx`
- frontend_stack: Next.js App Router, React client component, TypeScript, Tailwind, local shadcn-style Dialog/Button/Item/Alert components, Lucide icons
- run_command: `corepack pnpm dev`
- review_url: `http://localhost:3000/`
- fixture_strategy: existing local dashboard data; no new seed fixture was added in this gate

## Prototype Behavior

- Eligible active member-paid refundable expenses show a `退款` action in the existing record detail footer.
- Admins and finance managers are treated as reimbursement-capable for prototype affordance visibility, matching current authorization behavior.
- Pressing `退款` opens a `確認退款` dialog before any state change.
- Confirmation copy is concise and user-facing: `將此紀錄標記為已退款。`
- Confirming returns to the detail dialog, updates the visible record status to `已退款` for review, and shows an `已完成退款` toast.
- Cancelling the confirmation returns to the unchanged record detail.
- Income records, fund-paid expenses, already reimbursed expenses, voided records, and unauthorized actors do not expose the `退款` action.
- Already reimbursed member-paid expenses show `這筆代墊支出已退款，無法編輯或刪除。`
- Refund confirmation uses the shared record summary layout and `Alert variant="warning"` for the cannot-edit/delete warning.

## UX Decisions

- Keep the action inside the current detail modal rather than sending users to `/reimbursements`.
- Use `退款` as the compact action label per user confirmation.
- Require a confirmation dialog because this is a one-time financial settlement state.
- After prototype confirmation, keep the user in the detail dialog with the updated `已退款` status so the result is immediately visible.
- Use hidden unavailable actions for unauthorized and non-eligible records; only already reimbursed records need visible explanatory copy because users may expect edit/delete there.

## States Covered

- normal record detail
- eligible refundable member-paid expense with `退款`
- refund confirmation dialog
- refund cancellation
- prototype refund success with toast and updated `已退款` detail status
- already reimbursed blocked state
- ineligible records without `退款`
- existing edit/delete actions remain available for non-reimbursed records according to current role rules

## Responsive and Accessibility Baseline

- The prototype uses the existing Radix-backed Dialog component for focus trap, escape handling, and accessible dialog structure.
- The `退款` and `確認退款` buttons include Lucide icons plus visible Traditional Chinese labels.
- Confirmation dialog keeps the same compact modal sizing as delete confirmation and uses stable footer spacing.
- Record summary content is shared with the dashboard record list so category mark, payer, amount, and date layout stay consistent.
- Cancelling returns to the record detail mode without closing the parent dialog.
- Closing the detail dialog keeps the existing focus-return behavior to the triggering record item.

## UX Acceptance Inputs

- Authorized finance users can discover `退款` from an eligible record detail.
- Users must confirm before a record is marked已退款.
- Confirmation copy states the action without technical or unimplemented behavior.
- Successful confirmation leaves a clear visual result and feedback.
- Non-eligible and unauthorized states do not offer a misleading action.
- Already reimbursed records clearly say they cannot be edited or deleted.

## E2E Scenario Candidates

- Finance manager opens a refundable member-paid expense detail, sees `退款`, opens confirmation, cancels, and the status remains `待退款`.
- Finance manager confirms `退款` and sees `已完成退款` plus `已退款` in the detail state.
- General member opening another member's refundable expense detail does not see `退款`.
- Already reimbursed member-paid expense shows `這筆代墊支出已退款，無法編輯或刪除。` and no `退款`, edit, or delete action.
- Fund-paid expense and income record details do not show `退款`.
- Mobile viewport can open detail and confirmation dialogs without clipped footer controls.

## Known Gaps

- Prototype reimbursement success is local client state only; it does not call a server action or persist changes.
- The pending reimbursement dashboard total and `/reimbursements` table do not update in this prototype-only success state.
- No new seeded fixture guarantees a refundable member-paid expense appears in every local database.
- No screenshot baseline was added in this gate.
- Behavior Spec must still define direct-action rejection, duplicate reimbursement rejection, and final success refresh behavior.

## Verification

- `corepack pnpm type-check` passed.
- `corepack pnpm lint` passed.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm `退款` placement in the detail footer.
  - Confirm confirmation copy is concise and user-facing.
  - Confirm success should stay in the detail modal with updated status.
- must_check:
  - Prototype remains a real production-stack slice.
  - Prototype does not imply backend persistence exists yet.
  - Ineligible states do not expose invalid actions.
- acceptance_signals:
  - Behavior Spec can define role, eligibility, confirmation, cancellation, success, direct-action, duplicate-settlement, and read-model scenarios.
  - Technical Design can decide server action, transaction, ReimbursementBatch reuse, and revalidation behavior.
- unresolved_blockers:
  - None for Behavior Spec.
- next_step:
  - Behavior Spec / BDD / E2E for `record-detail-reimbursement`.
