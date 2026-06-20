---
id: prototype-edit-delete-ledger-records
stage: experience-prototype
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-delete-ledger-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/edit-delete-ledger-records.md
outputs:
  - production_stack_prototype
  - ux_acceptance_inputs
  - e2e_scenario_candidates
trace_links:
  intent:
    - .ai/intent/edit-delete-ledger-records.md
  domain_impact:
    - .ai/domain-impact/edit-delete-ledger-records.md
  component_paths:
    - src/app/record-list-detail.tsx
    - src/app/(app)/page.tsx
reviewed_at: 2026-06-21
---

# Experience Prototype for Edit and Delete Ledger Records

## Summary

- route: `/`
- prototype_host: existing dashboard record list/detail modal
- primary_component: `src/app/record-list-detail.tsx`
- integration_point: `src/app/(app)/page.tsx`
- frontend_stack: Next.js App Router, React client component, TypeScript, Tailwind, local shadcn-style Dialog/Button/Input/Textarea/Item components, Lucide icons
- run_command: `corepack pnpm dev`
- review_url: `http://localhost:3000/`
- fixture_strategy: existing local dashboard data; no new fixture seed was added in this gate

## Prototype Behavior

- Record details now receive the signed-in household profile so the UI can render action affordances based on owner/admin/finance-manager role.
- Eligible users see icon buttons for `編輯` and/or `刪除` in the existing detail dialog.
- Edit opens a dialog with fields for name, amount, date, category, payer/source display, and note.
- Delete opens a destructive confirmation dialog explaining that the record leaves monthly report, category summary, record list, and pending reimbursement calculations.
- Confirming delete closes the record modal flow immediately; cancellation returns to the record detail.
- Prototype edit success closes the modal flow and shows a `紀錄已更新` toast.
- Prototype delete success closes the modal flow and shows a `紀錄已刪除` toast.
- Already reimbursed member-paid expenses show a blocked state and do not expose edit/delete actions.
- Unauthorized users remain in a read-only detail state without inactive action buttons.

## UX Decisions

- Keep edit/delete inside the current detail modal flow instead of restoring standalone `/records` routes.
- Use `刪除` as user-facing copy, while domain and future technical design treat the action as soft delete / voiding.
- Block already reimbursed member-paid expenses for MVP because reimbursement reversal is not modeled yet.
- Prefer hidden unavailable actions over disabled buttons for unauthorized users to avoid implying an action can be requested.
- Use a visible explanation only for reimbursed records because the record owner/admin may expect the action to exist there.

## States Covered

- normal record detail
- owner/admin/finance-manager edit affordance
- owner/admin delete affordance
- finance-manager delete restriction for records they do not own
- edit dialog
- delete confirmation dialog
- reimbursed expense blocked state
- empty monthly record list remains unchanged
- focus returns to the original record trigger when the detail dialog closes

## Responsive and Accessibility Baseline

- Dialogs use existing Radix-backed local Dialog components with focus trapping and close behavior.
- Action buttons include Lucide icons plus Traditional Chinese labels.
- Edit fields keep stable two-column desktop and single-column mobile layout through `sm:grid-cols-2`.
- Destructive confirmation uses the existing destructive button variant and visible record summary.
- The existing record trigger focus-return behavior remains in `RecordListDetail`.

## UX Acceptance Inputs

- Authorized users can discover edit/delete from record detail after opening a record from the dashboard list.
- General members see edit/delete only for records they created.
- Admins see edit/delete for all non-reimbursed records.
- Finance managers see edit for all non-reimbursed records, and delete only for records they created.
- Already reimbursed member-paid expenses explain that edit/delete is unavailable until reversal exists.
- Delete confirmation clearly communicates the soft-delete effect without exposing implementation jargon.
- Delete confirmation closes all active record dialogs after confirmation.
- Edit and delete success both use toast feedback consistent with the existing create-record flow.

## E2E Scenario Candidates

- Owner opens a record detail, opens edit dialog, cancels, and focus remains recoverable.
- Owner saves an edit and sees a success toast.
- Owner opens delete confirmation for own active record and cancels.
- Owner confirms delete for an active record and the modal flow closes.
- Owner confirms delete for an active record and sees a success toast.
- Admin sees edit/delete on another member's active record.
- Finance manager sees edit but not delete on another member's active record.
- General member sees no edit/delete on another member's record.
- Already reimbursed member-paid expense shows blocked copy and no edit/delete actions.
- Mobile viewport opens detail, edit, and delete dialogs without clipped controls.

## Known Gaps

- Prototype actions are front-end review states only; they do not call server actions or persist changes.
- Edit form intentionally keeps category and payer/source as read-only display in this prototype; Behavior Spec and Technical Design must decide whether those are editable in the first implementation slice.
- No Playwright prototype screenshot was added in this gate.
- No schema migration exists yet for the active/voided lifecycle state.
- No behavior spec has been written yet for direct server-action authorization attempts.

## Verification

- `corepack pnpm type-check` passed after rerunning sequentially.
- `corepack pnpm lint` passed after rerunning sequentially.
- Initial parallel `type-check`/`lint` attempt failed due the known `prisma generate` output directory race; sequential reruns passed.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm record detail is the right surface for edit/delete.
  - Confirm reimbursed expenses should be blocked for MVP.
  - Confirm edit form fields are enough for the first behavior spec.
- must_check:
  - Prototype remains a real production-stack slice.
  - Prototype does not imply backend persistence exists yet.
  - Soft-delete / voided semantics remain clear enough for user-facing delete copy.
- acceptance_signals:
  - Behavior Spec can define role matrix, edit fields, delete confirmation, and reimbursed-blocked behavior.
  - Technical Design can decide schema, server actions, and active-only read filters.
- unresolved_blockers:
  - None for Behavior Spec if the reviewer accepts reimbursed records as blocked for MVP.
- next_step:
  - Behavior Spec / BDD / E2E for `edit-delete-ledger-records`.
