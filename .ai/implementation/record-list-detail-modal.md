---
id: record-list-detail-modal
stage: tdd-implementation
status: complete
delivery_profile: mvp
release_target: local_dev
created_at: 2026-06-20
updated_at: 2026-06-20
inputs:
  - .ai/intent/record-list-detail-modal.md
  - .ai/prototype/record-list-detail-modal.md
  - .ai/spec/record-list-detail-modal.md
  - .ai/technical-design/record-list-detail-modal.md
outputs:
  - src/app/record-list-detail.tsx
  - e2e/dashboard.spec.ts
  - e2e/create-record.spec.ts
review_gate: ready_for_verification
---

# Record List Detail Modal TDD Implementation

## Scope

This implementation completes the dashboard record list/detail modal behavior described by the approved prototype, behavior spec, and technical design.

The production UI implementation was already introduced during the prototype pass. This TDD pass focused on aligning executable coverage with the final UI behavior, then closing the implementation gap found by the tests.

## Tests First

Updated `e2e/dashboard.spec.ts` before final implementation fixes to cover:

- dashboard records render as clickable item-list buttons instead of table column headers.
- detail modal opens from a record item and shows absolute amount, `YYYY/MM/DD` date, category, status, payer, and note.
- income detail status is `---`.
- fund-paid expense payer is `基金`.
- keyboard open/close preserves month URL and returns focus to the original record item.
- empty month state has no record detail buttons.
- 1194x834 tablet landscape keeps the desktop two-column dashboard arrangement.

Updated `e2e/create-record.spec.ts` to cover changed labels and downstream behavior:

- create-record member/source field is labeled `支付者`.
- fund-paid create flow shows `基金` as the disabled payer.
- created fund-paid expense is verified through the new record detail modal instead of a removed table row.

## Implementation Changes

- Added record-detail dialog focus restoration in `src/app/record-list-detail.tsx` by storing the triggering record button and focusing it after modal close.
- Set `aria-describedby={undefined}` on the record detail `DialogContent` because the description was intentionally removed from this dialog.
- Kept the existing item/list component structure and did not reintroduce table or standalone footer behavior.

## Verification Evidence

- `corepack pnpm lint` passed.
- `corepack pnpm type-check` passed.
- `pnpm test:e2e e2e/dashboard.spec.ts` passed: 9 tests.
- `pnpm test:e2e e2e/create-record.spec.ts` passed: 7 tests.

## Review Gate

Decision: approve TDD Implementation for local development verification.

Recommended next gate: Verification.
