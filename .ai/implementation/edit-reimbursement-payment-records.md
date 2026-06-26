---
id: implementation-edit-reimbursement-payment-records
stage: tdd-implementation
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/spec/edit-reimbursement-payment-records.md
  - .ai/technical-design/edit-reimbursement-payment-records.md
  - .ai/prototype/edit-reimbursement-payment-records.md
outputs:
  - implementation_evidence
  - test_evidence
  - verification_handoff
trace_links:
  production_routes:
    - /
    - /search
  changed_components:
    - src/app/_record-detail/reimbursement-payment-dialogs.tsx
    - src/app/_record-detail/reimbursement-payment-edit-actions.ts
    - src/app/_record-detail/record-list-detail.tsx
    - src/app/(app)/search/page.tsx
    - src/app/(app)/search/_components/record-search-panel.tsx
  changed_domain_modules:
    - src/modules/reimbursement/reimbursement-payment-corrections.ts
    - src/modules/identity-access/authorization.ts
  changed_persistence:
    - prisma/schema.prisma
    - prisma/migrations/20260627090000_add_reimbursement_payment_edit_metadata/migration.sql
reviewed_at: 2026-06-27
---

# TDD Implementation: Edit Reimbursement Payment Records

## Implementation Summary

- Added pure reimbursement payment correction validation for payment date, payment method, and note.
- Added explicit `edit_reimbursement_payment` authorization command.
- Added server action `editReimbursementPaymentAction` for authenticated, household-scoped refund evidence correction.
- Added nullable correction metadata fields: `editedAt` and `editedByMemberId`.
- Connected the extracted edit dialog to the real server action.
- Aligned the edit dialog with the project form pattern: `useActionState`, `useActionStateEffect`, and `FormSubmitButton`.
- Disabled edit inputs, cancel, close, and submit while the action is pending.
- Kept the edit dialog separate from the refund-record detail dialog.
- Kept editable controls limited to `付款日期`, `付款方式`, and `備註`.
- Kept non-editable settlement facts as read-only display.
- Removed the edit dialog note placeholder so the dialog has labels and controls only.
- Kept success toast text as `退款紀錄已更新`.
- Kept the note placeholder aligned with the reimbursement capture form.

## Test-First Evidence

- Added `src/modules/reimbursement/reimbursement-payment-corrections.test.ts` before the correction module behavior.
- Extended `src/modules/identity-access/authorization.test.ts` before adding the authorization command.
- Extended `src/app/(app)/search/_actions/record-search-actions.test.ts` before the edit action implementation.

## Verification Run

- `corepack pnpm type-check`: passed.
- `corepack pnpm lint`: passed.
- `corepack pnpm test src/modules/reimbursement/reimbursement-payment-corrections.test.ts src/modules/identity-access/authorization.test.ts 'src/app/(app)/search/_actions/record-search-actions.test.ts'`: passed, 3 files / 22 tests.
- `corepack pnpm db:validate`: passed.
- `corepack pnpm test`: passed, 52 files / 248 tests.

## Known Gaps For Verification

- Playwright E2E for `/search` refund edit was not run in this gate.
- Local database migration deployment was not run in this gate.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm the metadata migration is acceptable for local_dev.
  - Confirm E2E should be added or enabled during Verification rather than broadening this implementation turn.
  - Confirm the edit dialog behavior matches the accepted prototype.
- must_check:
  - Verification should run full test coverage appropriate for local_dev.
  - Verification should apply/check the Prisma migration against the local database.
  - Verification should include browser coverage for successful save, cancel, and unauthorized UI if the E2E database is available.
- next_step:
  - Verification for `edit-reimbursement-payment-records`.
