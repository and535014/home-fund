---
id: prototype-edit-reimbursement-payment-records
stage: experience-prototype
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-reimbursement-payment-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/edit-reimbursement-payment-records.md
  - .ai/prototype/search-reimbursement-payment-records.md
  - .ai/prototype/reimbursement-payment-flow.md
outputs:
  - production_stack_prototype
  - ux_acceptance_criteria_draft
  - e2e_scenario_candidates
trace_links:
  routes:
    - src/app/(app)/search/page.tsx
    - src/app/(app)/(home)/page.tsx
  components:
    - src/app/_record-detail/reimbursement-payment-dialogs.tsx
    - src/app/_record-detail/reimbursement-payment-dialogs.tsx#ReimbursementPaymentEditDialog
    - src/app/_record-detail/reimbursement-payment-ui.ts
    - src/app/(app)/search/_components/record-search-panel.tsx
reviewed_at: 2026-06-27
---

# Experience Prototype: Edit Reimbursement Payment Records

## Prototype Summary

- route: `/search` refund-record detail modal, and reimbursed expense readback that opens the same modal
- review_url: `http://localhost:3000/search`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React client components, TypeScript, Tailwind CSS, local shadcn-style components, Lucide icons
- component_library_usage: existing Dialog, Button, Field, Input, NativeSelect, Item components
- fixture_or_mock_strategy: Uses the real refund-record detail component. The edit form updates local component state only, so reviewers can experience the flow without backend mutation, Prisma update logic, authorization, or cache refresh pretending to be finished.
- shared_option_source: Payment method options come from `REIMBURSEMENT_PAYMENT_METHOD_OPTIONS` in `src/modules/reimbursement/reimbursement-payment.ts`, shared by refund capture, refund-record editing, and payment method readback labels.
- release_target: `local_dev`

## UX Direction

- Use `編輯` as the refund-record detail action label for a shorter button.
- Clicking `編輯` opens a separate `編輯退款紀錄` dialog instead of replacing the original refund-record detail dialog.
- The edit dialog keeps only labels and controls; explanatory description text is intentionally omitted.
- Keep refund amount, 收款成員, and linked records visible as settlement facts, but do not make them editable.
- Let the actor change only:
  - 付款日期
  - 付款方式
  - 備註
- Keep the existing refund-record detail density and modal structure when in read mode.
- In the separate edit dialog, keep the form small and explicit so it does not feel like editing an ordinary ledger record.
- Saving in prototype mode updates the visible modal readback and shows a success toast; it does not persist to the database.

## States Covered

- Refund record detail read mode.
- `編輯` action from the refund record detail modal.
- A separate edit dialog title: `編輯退款紀錄`.
- Non-editable settlement summary:
  - amount remains in the top summary card
  - 收款成員 remains visible as a read-only field
- Editable fields:
  - date input for 付款日期
  - controlled select for 付款方式
  - optional text input for 備註
- Cancel returns to read mode and restores the previous draft.
- Save returns to read mode, updates the modal preview values, and shows prototype-only save feedback.
- `查看關聯紀錄` remains available only from read mode.

## Interaction Details

- User opens `/search`, switches to `退款紀錄`, and opens a refund record.
- User reviews existing refund details and selects `編輯`.
- A second dialog opens with title `編輯退款紀錄`; the original refund-record detail remains open behind it.
- User edits payment date, payment method, or note.
- User selects `取消` in the edit dialog:
  - draft changes are discarded
  - edit dialog closes
- User selects `儲存變更` in the edit dialog:
  - edit dialog closes
  - the original refund-record detail readback updates locally
  - success toast says `退款紀錄已更新`
  - no server action runs
- User returns to read mode and can still open related ledger records.

## Responsive Baseline

- Desktop: editable date and method fields sit in a two-column grid; note spans the modal width.
- Mobile/narrow: editable fields stack cleanly with labels above inputs.
- Footer buttons use the default Button size, matching the ledger record edit modal.
- The amount summary remains at the top to anchor the correction context on both desktop and mobile.

## Accessibility And Focus

- Edit controls use explicit labels and native input/select semantics.
- The separate edit dialog form uses normal submit behavior through `儲存變更`.
- `取消` is a button and does not submit the form.
- The correction affordance is a real button with a pencil icon and text label.
- The prototype keeps existing Dialog focus trapping.
- Non-editable settlement facts are displayed as text, not disabled inputs, to avoid false affordance.

## Draft UX Acceptance Criteria

- Authorized users can discover an `編輯` action from refund record detail.
- Clicking `編輯` opens a separate edit dialog instead of replacing the refund-record detail dialog.
- Correction form exposes exactly 付款日期, 付款方式, and 備註.
- Refund amount, 收款成員, linked records, and reimbursement state are not editable.
- Canceling an edit does not change the displayed refund record.
- Saving valid edits updates the displayed refund record fields after refresh or local preview.
- Saving valid edits shows a success toast.
- The wording does not imply reimbursement reversal, amount changes, or external payment execution.
- The correction path remains separate from ordinary ledger record edit/delete.
- Mobile layout keeps labels, fields, and footer actions readable without overlap.

## E2E Scenario Candidates

- Open a refund record from `/search`, click `編輯`, and verify only 付款日期, 付款方式, and 備註 are editable.
- Change payment date, payment method, and note, save, and verify the refund record detail shows updated values.
- Enter edit mode, change values, cancel, and verify the original readback remains.
- Verify amount, 收款成員, and related ledger records cannot be changed in the correction UI.
- Verify `查看關聯紀錄` remains available after returning to read mode.
- Verify unauthorized users do not see or cannot complete the correction action once authorization behavior is implemented.

## Known Gaps

- No backend update command exists yet.
- No authorization or household scoping is enforced in this prototype.
- No server-side validation for payment date or payment method is wired to the form yet.
- No persistence, cache refresh, or search result reordering after a changed payment date is implemented.
- No correction metadata such as edited-by, edited-at, or history rows exists yet.
- Permission policy is still open: finance managers, admins, original recorder, or a narrower combination.
- Prototype save behavior is intentionally local and must be replaced by real mutation feedback during implementation.

## Review Gate

- decision: review
- reviewer_focus:
- Confirm `編輯` is the right button wording and `編輯退款紀錄` is the right separate dialog title.
  - Confirm the form should expose only payment date, payment method, and note.
  - Confirm read-only settlement facts are clear enough without using disabled inputs.
  - Confirm the local preview behavior is adequate for prototype review.
  - Confirm whether correction metadata is required before implementation.
- must_check:
  - Prototype remains frontend review work; backend mutation and persistence are deferred.
  - Behavior Spec must define permission, validation, cancel/save, unchanged settlement facts, and total invariants.
  - Technical Design must decide server action shape, schema metadata, cache refresh, and sorting behavior after `paidOn` changes.
- acceptance_signals:
  - User accepts the modal state change and field layout.
  - User requests only concrete copy/layout adjustments before Behavior Spec.
  - Prototype gives enough evidence to write BDD/E2E scenarios.
- unresolved_blockers:
  - Exact edit permission policy.
  - Whether direct overwrite is acceptable or correction metadata/history is required.
- next_step:
  - Behavior Spec / BDD / E2E for `edit-reimbursement-payment-records`.
