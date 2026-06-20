---
id: technical-design-edit-delete-ledger-records
stage: feature-technical-design
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-delete-ledger-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/edit-delete-ledger-records.md
  - .ai/prototype/edit-delete-ledger-records.md
  - .ai/spec/edit-delete-ledger-records.md
  - .ai/foundation-architecture/home-family-fund.md
  - prisma/schema.prisma
  - src/app/record-list-detail.tsx
  - src/app/ledger-record-actions.ts
  - src/app/ledger-record-form.ts
  - src/modules/fund-ledger/ledger-record-corrections.ts
  - src/app/home-dashboard-data-source.ts
outputs:
  - technical_design
  - contracts
  - tdd_preconditions
trace_links:
  spec:
    - .ai/spec/edit-delete-ledger-records.md
  prototype:
    - .ai/prototype/edit-delete-ledger-records.md
  domain_impact:
    - .ai/domain-impact/edit-delete-ledger-records.md
  target_components:
    - src/app/record-list-detail.tsx
    - src/app/(app)/page.tsx
    - src/app/ledger-record-actions.ts
    - src/app/ledger-record-form.ts
  domain_modules:
    - src/modules/fund-ledger/ledger-record-corrections.ts
    - src/modules/fund-ledger/ledger-record-command.ts
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/reporting/monthly-report.ts
    - src/modules/reimbursement/reimbursement-table.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-21
---

# Technical Design for Edit and Delete Ledger Records

## Decision Summary

- decision: proceed_to_tdd_implementation
- implementation_strategy: schema-first TDD, domain command alignment, then server actions and UI integration
- route_boundary: existing dashboard `/`
- record_edit_surface: existing `RecordListDetail` detail modal
- delete_semantics: soft delete via `LedgerRecordStatus.voided`
- reimbursed_expense_policy: block edit and delete at UI and server/domain boundaries
- release_target: `local_dev`

## Boundaries

| Area | Decision |
|---|---|
| Route | Keep edit/delete on `/` through the dashboard record detail modal. Do not restore `/records`. |
| Client component | `src/app/record-list-detail.tsx` owns selected record state, mode switching, form interaction, success close behavior, and toast display. |
| Server actions | Extend `src/app/ledger-record-actions.ts` with `updateLedgerRecordAction` and `voidLedgerRecordAction`. |
| Form parsing | Add edit/delete parsing helpers in `src/app/ledger-record-form.ts` or a route-local sibling if the file becomes crowded. |
| Domain | `src/modules/fund-ledger/ledger-record-corrections.ts` owns correction and voiding policy. |
| Persistence | Add active/voided lifecycle to Prisma `LedgerRecord`; database command module persists update and void transitions. |
| Read models | Dashboard, monthly report, and reimbursement must receive active-only records from shared filtering/query boundaries. |
| Authorization | `src/modules/identity-access/authorization.ts` remains the role authority for edit/delete. Server actions must call authenticated session and domain commands. |

## Data Model

Add enum:

```prisma
enum LedgerRecordStatus {
  active
  voided
}
```

Add field to `LedgerRecord`:

```prisma
status LedgerRecordStatus @default(active)
```

Add indexes:

```prisma
@@index([householdId, status, occurredOn])
@@index([householdId, status, reimbursementStatus, occurredOn])
```

Existing local data defaults to `active` through the migration default. No physical deletion is used for this slice because `ReimbursementBatchItem.ledgerRecord` uses `onDelete: Restrict` and the domain requires audit trace.

## Domain Model Contracts

Update `LedgerRecord` TypeScript types to include:

```ts
status: "active" | "voided";
```

Creation commands return `status: "active"`.

Correction command:

- input: actor, active ledger record, update command, categories.
- rejects if record is `voided`.
- rejects if record is a reimbursed member-paid expense.
- authorizes through `edit_ledger_record`.
- validates amount/date/category/source-member/payment-source invariants.
- returns updated active record and event `Ledger record corrected`.

Void command:

- input: actor, active ledger record.
- rejects if record is `voided`.
- rejects if record is a reimbursed member-paid expense.
- authorizes through `delete_ledger_record`.
- returns voided record or voided record id with event `Ledger record voided`.
- never returns hard-delete semantics such as `deletedRecordId` as the primary domain language.

## Persistence Commands

Add a database command module or extend `ledger-record-command.ts` with:

- `updateLedgerRecordInDatabase(actor, command, context)`
- `voidLedgerRecordInDatabase(actor, command, context)`

Both run inside Prisma transactions because they must load the current record and categories consistently before mutation.

Read current record with household scoping:

- `householdId`
- `id`
- `status: "active"`

Select all fields needed to map to `LedgerRecord`, plus current category/payment/member fields. If not found, return a stable action error such as `record_not_found`.

Update persistence writes:

- editable fields: name, amountCents, occurredOn, categoryId, sourceMemberId, paymentSource, payerMemberId, reimbursementStatus, note
- never mutates `createdByMemberId`
- leaves `status: active`

Void persistence writes:

- `status: "voided"`
- keeps all other financial fields for audit trace
- does not delete reimbursement batch items

## Server Action Contracts

Use `ActionState` like create-record actions.

```ts
type UpdateLedgerRecordActionState = ActionState<
  { recordId: string },
  | "recordId"
  | "name"
  | "amountTwd"
  | "occurredOn"
  | "categoryId"
  | "sourceMemberId"
  | "paymentSource"
  | "payerMemberId"
  | "note",
  UpdateLedgerRecordActionCode
>;
```

Codes:

- `record_not_found`
- `permission_denied`
- `record_voided`
- `reimbursed_expense_blocked`
- `missing_name`
- `invalid_amount`
- `invalid_date`
- `missing_category`
- `archived_category`
- `category_type_mismatch`
- `missing_income_source_member`
- `missing_member_payer`
- `fund_paid_expense_cannot_have_member_payer`

`voidLedgerRecordAction` can use a smaller state:

```ts
type VoidLedgerRecordActionState = ActionState<
  { recordId: string },
  "recordId",
  "record_not_found" | "permission_denied" | "record_voided" | "reimbursed_expense_blocked"
>;
```

Both actions:

- call `requireAuthenticatedMember()`
- call database command with `getPrismaClient()`
- revalidate `/` and `/reimbursements`
- return success messages `紀錄已更新。` and `紀錄已刪除。`

## Client UI Design

`RecordListDetail` should evolve from prototype local-only callbacks to real action-state forms.

State owner:

- `RecordListDetail` keeps selected record id and focus-return ref.
- detail dialog can switch to edit/delete mode.
- success callback closes selected record, calls `router.refresh()` if needed after server action success, and shows toast.

Edit dialog:

- Use `useActionState(updateLedgerRecordAction, initialState)`.
- Include hidden `recordId` and `recordType`.
- Implement first implementation as full edit scope: name, amount, date, category, source/payer/payment source, note.
- Reuse create-record field patterns where practical, but keep edit-specific defaults from the selected record.
- Server validation errors render inline and keep dialog open.

Delete dialog:

- Use `useActionState(voidLedgerRecordAction, initialState)` or a form action with pending state.
- Include hidden `recordId`.
- Cancel returns to detail.
- Success closes all record dialogs and shows `紀錄已刪除`.

Action visibility:

- Client visibility mirrors domain authorization for usability:
  - owner: edit/delete active non-reimbursed records.
  - admin: edit/delete active non-reimbursed records.
  - finance manager: edit active non-reimbursed records; delete only own active records.
  - reimbursed member-paid expense: show blocked explanation, no edit/delete.
- Server actions remain authoritative.

## Read Model Filtering

Introduce a single helper such as:

```ts
export function isActiveLedgerRecord(record: LedgerRecord): boolean {
  return record.status === "active";
}
```

Use active-only filtering at data-source/query level first:

- `home-dashboard-data-source.ts`: query `status: "active"` for dashboard records.
- `reimbursement-command.ts`: reimbursement selection query must exclude voided records.
- Any future monthly record source should use the same predicate.

Keep domain read model builders resilient by also ignoring voided records if they receive them in unit tests. This prevents report/reimbursement divergence when tests or future callers pass raw records.

## Error and Empty States

- `record_not_found`: inline alert `找不到這筆紀錄，可能已被更新或刪除。`
- `record_voided`: inline alert `這筆紀錄已刪除，無法再次修改。`
- `reimbursed_expense_blocked`: inline/blocked copy `這筆代墊支出已退款，需先有退款沖銷流程才能編輯或刪除。`
- `permission_denied`: inline alert `目前帳號沒有修改這筆紀錄的權限。` or `目前帳號沒有刪除這筆紀錄的權限。`
- Success toasts remain `紀錄已更新` and `紀錄已刪除`.

## Test Mapping

| Spec Area | Test First |
|---|---|
| Schema lifecycle | migration/schema generated client compiles; data-source tests include status. |
| Domain correction | update `ledger-record-corrections.test.ts` to reject voided and reimbursed records. |
| Domain voiding | update tests from `Ledger record deleted` to `Ledger record voided`; assert returned record/status. |
| Active read models | monthly report and reimbursement table tests prove voided records are ignored. |
| Data source | `home-dashboard-data-source.test.ts` asserts Prisma query includes `status: "active"` and mapper returns status. |
| Server actions | action tests or command integration tests cover success, permission denial, not found, reimbursed blocked, revalidation targets. |
| Component | record detail action visibility for owner/admin/finance/general/reimbursed cases. |
| E2E | owner edit/delete with toast and close, general read-only, finance edit-only, admin mutation, reimbursed blocked, mobile dialog fit. |

## Migration and Release Implications

- Requires Prisma migration for `LedgerRecordStatus` and `LedgerRecord.status`.
- Local dev seed data should not need explicit status values because default is `active`, but E2E fixtures may include one `voided` record to prove exclusion.
- `corepack pnpm db:deploy` is required for local databases before running E2E after implementation.
- Production readiness remains out of scope; this design supports `local_dev` only.

## TDD Preconditions

1. Write or update domain tests for voided lifecycle and reimbursed blocking.
2. Add Prisma schema migration and update generated client.
3. Update TypeScript ledger record types and mappers.
4. Add active-record filtering tests before query changes.
5. Add failing server-action tests or integration tests before server actions.
6. Update E2E fixtures and write E2E expectations for toast/close/action visibility before wiring full UI persistence.

## Open Questions

- Whether edit UI should use one form with conditional income/expense fields or reuse `RecordEntryPanel` primitives. Design decision: prefer a dedicated `RecordEditDialog` using shared field helpers only if duplication becomes material.
- Whether recurring occurrence records linked to a voided ledger record need a visible state. Design decision for this slice: out of scope; preserve relation but active views exclude the voided ledger record.
- Whether voided records need an audit UI. Design decision for this slice: out of scope; persistence retains trace only.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `LedgerRecordStatus active|voided` is the right persistence shape.
  - Confirm full edit scope includes category and payer/source member in the first implementation.
  - Confirm reimbursed expenses remain blocked until reimbursement reversal exists.
- must_check:
  - Server authorization remains authoritative.
  - Read-model filtering is shared and cannot diverge.
  - TDD can start from domain/schema/read-model tests before UI wiring.
- acceptance_signals:
  - TDD Implementation can write failing tests from this design.
  - No foundation gate is needed.
- unresolved_blockers:
  - None for TDD Implementation.
- next_step:
  - TDD Implementation for `edit-delete-ledger-records`.
