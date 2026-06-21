---
id: technical-design-record-detail-reimbursement
stage: feature-technical-design
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-detail-reimbursement.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/record-detail-reimbursement.md
  - .ai/prototype/record-detail-reimbursement.md
  - .ai/spec/record-detail-reimbursement.md
  - .ai/foundation-architecture/home-family-fund.md
  - prisma/schema.prisma
  - src/app/record-list-detail.tsx
  - src/app/ledger-record-actions.ts
  - src/modules/reimbursement/reimbursements.ts
  - src/modules/reimbursement/reimbursement-command.ts
  - src/app/home-dashboard-data-source.ts
outputs:
  - technical_design
  - contracts
  - tdd_preconditions
trace_links:
  spec:
    - .ai/spec/record-detail-reimbursement.md
  prototype:
    - .ai/prototype/record-detail-reimbursement.md
  domain_impact:
    - .ai/domain-impact/record-detail-reimbursement.md
  target_components:
    - src/app/record-list-detail.tsx
    - src/app/ledger-record-actions.ts
  domain_modules:
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/reimbursement/reimbursement-table.ts
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/identity-access/authorization.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-21
---

# Technical Design for Record Detail Reimbursement

## Decision Summary

- decision: proceed_to_tdd_implementation_after_review
- implementation_strategy: reuse existing reimbursement domain/persistence command, add single-record server action, then wire the approved modal prototype to real action state.
- route_boundary: existing dashboard `/`
- reimbursement_surface: existing `RecordListDetail` detail modal
- action_label: `退款`
- confirmation_title: `確認退款`
- data_model_change: none expected
- release_target: `local_dev`

## Boundaries

| Area | Decision |
|---|---|
| Route | Keep the reimbursement action on `/` inside the dashboard record detail modal. Do not redesign `/reimbursements`. |
| Client component | `src/app/record-list-detail.tsx` owns detail/refund/delete/edit mode switching, confirmation UI, toast display, and refresh behavior. |
| Server action | Extend `src/app/ledger-record-actions.ts` with `reimburseLedgerRecordAction` to keep ledger-record detail actions together. |
| Form parsing | Add `parseReimburseLedgerRecordForm` to `src/app/ledger-record-form.ts` or a small sibling if that file becomes crowded. |
| Domain | Reuse `markExpensesReimbursed` in `src/modules/reimbursement/reimbursements.ts` for authorization and one-time reimbursement invariants. |
| Persistence | Reuse `markExpensesReimbursedInDatabase` in `src/modules/reimbursement/reimbursement-command.ts` with a one-element `selectedExpenseIds` array. |
| Read models | Existing dashboard/reimbursement read models consume `reimbursementStatus`; successful action revalidates `/` and `/reimbursements`. |
| Authorization | `authorize(actor, { type: "perform_reimbursement" })` remains authoritative through the existing domain command. |

## Data Model

No Prisma schema change is expected for this slice.

Existing schema already supports:

- `LedgerRecord.reimbursementStatus`
- `ReimbursementBatch`
- `ReimbursementBatchItem`
- `LedgerRecord.status`
- active-only dashboard reads

The single-record detail action should create the same reimbursement batch shape as the existing batch command. A one-record batch is acceptable and preserves traceability without adding a separate settlement model.

## Domain And Persistence Contracts

Use existing command:

```ts
markExpensesReimbursed(actor, expenses, {
  selectedExpenseIds: [recordId],
});
```

Use existing persistence boundary:

```ts
markExpensesReimbursedInDatabase(actor, {
  selectedExpenseIds: [recordId],
}, {
  prisma,
});
```

Persistence must load records with:

- household scope
- `id in selectedExpenseIds`
- `type: "expense"`
- active status requirement

Design adjustment required: `markExpensesReimbursedInDatabase` should include `status: "active"` in the query or reject voided mapped records before update. The behavior spec says voided records do not expose or accept refund.

The domain command already rejects:

- unauthorized actor: `permission_denied`
- empty selection: `empty_selection`
- unknown expense: `expense_not_found`
- fund-paid/not refundable expense: `not_refundable`
- already reimbursed expense: `already_reimbursed`

TDD should extend it to reject voided expenses explicitly as `not_refundable` or a new `record_voided` code. Prefer a server-action code `record_not_found` for voided records if persistence queries active-only records.

## Server Action Contract

Add action types:

```ts
export type ReimburseLedgerRecordActionCode =
  | "missing_record_id"
  | "record_not_found"
  | "permission_denied"
  | "not_refundable"
  | "already_reimbursed";

export type ReimburseLedgerRecordActionField = "recordId";

export type ReimburseLedgerRecordActionState = ActionState<
  { recordId: string },
  ReimburseLedgerRecordActionField,
  ReimburseLedgerRecordActionCode
>;
```

Action behavior:

1. Parse `recordId` from `FormData`.
2. Call `requireAuthenticatedMember()`.
3. Call `markExpensesReimbursedInDatabase(session.access.member, { selectedExpenseIds: [recordId] }, { prisma: getPrismaClient() })`.
4. Map result errors to user-facing Traditional Chinese messages.
5. On success, `revalidatePath("/")` and `revalidatePath("/reimbursements")`.
6. Return `actionSuccess("已完成退款。", { recordId })`.

Error messages:

| Code | Message |
|---|---|
| `missing_record_id` | `找不到要退款的紀錄。` |
| `record_not_found` | `找不到這筆紀錄，可能已被更新或刪除。` |
| `permission_denied` | `目前帳號沒有退款這筆紀錄的權限。` |
| `not_refundable` | `這筆紀錄無法退款。` |
| `already_reimbursed` | `這筆代墊支出已退款，無法編輯或刪除。` |

The `already_reimbursed` copy intentionally matches the blocked detail copy.

## Client UI Design

`RecordListDetail` should evolve from prototype local state to real action-state behavior.

Keep:

- `mode: "detail" | "edit" | "delete" | "refund"`
- `RefundRecordDialog`
- shared `RecordSummaryContent`
- `Alert variant="warning"`
- button label `退款`
- confirmation heading `確認退款`

Change:

- Replace prototype-only `isPrototypeReimbursed` success state with server action result handling.
- `RefundRecordDialog` submits a form with hidden `recordId`.
- On success, show toast `已完成退款`, call `router.refresh()`, and keep the detail flow open only if refreshed data can show `已退款`.
- If keeping refreshed detail open is awkward because the selected record object is stale during refresh, close the modal after success and rely on toast plus refreshed list. This is acceptable only if TDD/E2E proves the user can reopen and see `已退款`; otherwise keep a local success overlay until refresh completes.

Recommended first implementation:

- Keep the modal open and set a local `refundedRecordId` only after server success.
- Render `displayedRecord.reimbursementStatus = "reimbursed"` for that selected record until `router.refresh()` replaces data.
- Hide edit/delete/refund through existing access calculation.
- This preserves the behavior spec requirement that the user sees `已退款` immediately without pretending persistence succeeded before action success.

## Action Visibility

Client eligibility mirrors the server contract for usability:

- actor has admin or finance manager role.
- record type is `expense`.
- record status is `active`.
- record payment source is `member`.
- record reimbursement status is `refundable`.

Hidden UI is not the security boundary. The server action must reject direct submissions for unauthorized and ineligible records.

Already reimbursed records:

- show `這筆代墊支出已退款，無法編輯或刪除。`
- hide `編輯`, `刪除`, and `退款`

## Read Model And Revalidation

Successful reimbursement updates:

- selected ledger record `reimbursementStatus` to `reimbursed`
- creates a `ReimbursementBatch`
- creates one `ReimbursementBatchItem`
- dashboard pending reimbursement summary after `/` revalidation
- `/reimbursements` pending table after `/reimbursements` revalidation

No dashboard query change should be needed if it already selects `reimbursementStatus`.

## Test Mapping

| Spec Requirement | Test |
|---|---|
| Admin/finance can reimburse | domain/unit `markExpensesReimbursed`; server-action integration for action success. |
| General member blocked | domain/unit authorization and server-action integration. |
| Ineligible records hidden | component tests for `RecordListDetail` action visibility. |
| Ineligible direct submissions rejected | server-action/integration using fund-paid, income, voided, missing, already reimbursed IDs. |
| One-time reimbursement | domain/unit duplicate reimbursement and persistence duplicate prevention. |
| Batch trace | persistence integration asserts one `ReimbursementBatch` and one item are created. |
| UI confirmation/cancel | component or E2E asserts cancel does not call mutation and status remains `待退款`. |
| UI success | E2E asserts toast `已完成退款`, status `已退款`, and no edit/delete/refund actions. |
| Pending totals refresh | E2E verifies `/reimbursements` no longer lists the reimbursed expense. |
| Mobile fit | E2E mobile viewport opens detail and confirmation without clipped footer. |

## TDD Implementation Order

1. Add or extend domain tests for voided/ineligible single-record reimbursement rejection.
2. Add persistence tests for one-ID `markExpensesReimbursedInDatabase`, including active-only query behavior and batch item creation.
3. Add server-action parser/action tests for missing ID, unauthorized, not refundable, already reimbursed, and success.
4. Add component tests or focused E2E for action visibility and confirmation UI.
5. Wire `RefundRecordDialog` to `reimburseLedgerRecordAction`.
6. Add browser E2E for finance/admin success, cancel, blocked states, and mobile layout.

## Release Implications

- No migration expected.
- No secret/config/OAuth changes expected.
- Local dev requires PostgreSQL with existing reimbursement tables.
- Production readiness is not assessed in this gate.
- `local_dev` readiness must rerun type-check, unit tests, lint, build, and targeted E2E.

## Open Questions

- Should success keep the modal open with a temporary local `已退款` state, or close after toast and refresh? The spec prefers visible `已退款`; this design recommends keeping a local success state until refreshed data arrives.
- Should `/reimbursements` remain placeholder in this slice? The behavior only requires refreshed pending data if a reimbursement table exists; current page is placeholder, so E2E should assert dashboard state now and leave `/reimbursements` full table behavior to its own slice unless implementation already has a table.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm reusing `markExpensesReimbursedInDatabase` for a one-record batch.
  - Confirm no schema migration is needed.
  - Confirm success should keep visible `已退款` in the detail flow through local post-success state.
- must_check:
  - Server action remains authoritative.
  - Existing reimbursement batch trace is reused.
  - `/reimbursements` placeholder is not accidentally expanded beyond scope.
- acceptance_signals:
  - TDD can begin with domain/persistence/server-action tests.
  - Implementation has clear UI and server boundaries.
- unresolved_blockers:
  - None for TDD Implementation.
- next_step:
  - TDD Implementation for `record-detail-reimbursement`.
