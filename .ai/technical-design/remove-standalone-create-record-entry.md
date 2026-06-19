---
id: remove-standalone-create-record-entry
stage: technical-design
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/remove-standalone-create-record-entry.md
  - .ai/prototype/remove-standalone-create-record-entry.md
  - .ai/spec/remove-standalone-create-record-entry.md
  - src/app/action-state.ts
  - src/app/dashboard-navigation.ts
  - src/app/record-create-actions.tsx
  - src/app/create-record-dialog.tsx
  - src/app/record-entry-panel.tsx
  - src/app/ledger-record-actions.ts
outputs:
  - route_boundaries
  - component_boundaries
  - action_state_contract
  - test_mapping
trace_links:
  behavior_spec:
    - .ai/spec/remove-standalone-create-record-entry.md
  target_files:
    - src/app/dashboard-navigation.ts
    - src/app/record-create-actions.tsx
    - src/app/create-record-dialog.tsx
    - src/app/record-entry-panel.tsx
    - src/app/ledger-record-actions.ts
    - src/app/(app)/records/new/page.tsx
reviewed_at: 2026-06-20
---

# Remove Standalone Create Record Entry Technical Design

## Decision Summary

- decision: proceed_to_tdd_implementation
- reason: Route, component, action-state, validation, authorization, feedback, and test boundaries are now explicit enough for test-first implementation.

## Route Boundary

- Delete `src/app/(app)/records/new/page.tsx`.
- Do not add a replacement redirect route.
- Direct `/records/new` should fall through to the framework default not-found behavior.
- Do not add compatibility behavior for `?create=income`, `?create=expense`, `?result=...`, or `?create=success`; these query params should no longer open create-record UI.
- Existing route search params for `month` remain supported.

## Navigation Boundary

- Update `src/app/dashboard-navigation.ts` to remove the `新增` navigation item from the item list entirely.
- Do not keep a hidden or role-filtered create navigation object.
- Existing access hints still control the other navigation entries.
- Unit coverage should assert no returned navigation item has label `新增` or href containing `create=`.

## Component Boundary

### Record Create State Owner

- Refactor `src/app/record-create-actions.tsx` into a client-owned record-create entry surface.
- Introduce a shared client component that owns:
  - `open: boolean`
  - `mode: "income" | "expense" | null`
  - trigger handlers for income and expense
  - modal close handling
  - success handling
- Use this owner to render desktop header buttons, mobile footer buttons, and the dialog host so they share the same modal state.
- Page-level records toolbar buttons should use the same owner or the same trigger component rather than constructing hrefs.

### Trigger Buttons

- Create triggers are `<button type="button">`, not anchor links.
- Accessible names remain `新增收入` and `新增支出`.
- Trigger clicks call `setMode(...)` and `setOpen(true)`.
- Trigger clicks must not call `router.push`, mutate `window.location`, or append search params.

### Dialog

- `src/app/create-record-dialog.tsx` becomes controlled:
  - accepts `open`
  - accepts `onOpenChange`
  - accepts `mode`
  - receives `onSuccess` from the state owner
- Remove `defaultOpen` as the way to infer URL-driven initial open state.
- When closed manually, the dialog simply closes; it does not navigate.
- Refresh naturally closes the dialog because state is client-local.

## Server Action Contract

Use the existing `src/app/action-state.ts` helpers.

```ts
export type CreateLedgerRecordActionCode =
  | "archived_category"
  | "category_type_mismatch"
  | "fund_paid_expense_cannot_have_member_payer"
  | "invalid_amount"
  | "invalid_date"
  | "invalid_record_type"
  | "missing_category"
  | "missing_name"
  | "missing_member_payer"
  | "missing_payer_member"
  | "missing_source_member"
  | "permission_denied";

export type CreateLedgerRecordActionField =
  | "recordType"
  | "name"
  | "amountTwd"
  | "occurredOn"
  | "categoryId"
  | "sourceMemberId"
  | "payerMemberId"
  | "paymentSource";

export type CreateLedgerRecordActionState = ActionState<
  { month: string; recordId: string },
  CreateLedgerRecordActionField,
  CreateLedgerRecordActionCode
>;
```

- Change `createLedgerRecordAction(previousState, formData)` to return `CreateLedgerRecordActionState`.
- On parse validation failure, return `actionError(...)` with the mapped message/code and field error.
- On domain authorization or command failure, return `actionError(...)` with the mapped message/code and relevant field error.
- On success, `revalidatePath("/")`, `revalidatePath("/records")`, `revalidatePath("/reimbursements")`, and `revalidatePath("/recurring")` because current create actions are available across these monthly work surfaces.
- Return `actionSuccess("紀錄已新增。", { month, recordId })`.
- Do not call `redirect(...)` from normal create-record action results.

## Client Form State

- `RecordEntryPanel` uses `useActionState(createLedgerRecordAction, initialActionState(...))`.
- Pending state comes from the `useActionState` pending tuple value.
- Disable the submit button while pending.
- Render `actionState.message` in an inline `Alert`.
- Keep the existing form fields and layout.
- On `actionState.status === "success"`:
  - call `onSuccess(actionState)`
  - the state owner closes the modal
  - call `router.refresh()`
  - show existing success toast/status feedback, preferably through `toast.success("紀錄已新增")`
- On `actionState.status === "error"`, keep the modal open.

## Validation Ownership

- Client form keeps HTML required/min/date controls for immediate feedback.
- `parseCreateLedgerRecordForm` remains the server-side parse/validation owner for trusted validation.
- Domain command remains the source of truth for ledger authorization and invariant failures.
- Error message mapping moves from query-result parsing to action-state code/message mapping.

## Authorization Boundary

- Do not change `requireAuthenticatedMember` / server action access semantics beyond replacing redirect output with action-state output.
- General-member cross-member create rejection remains enforced server-side.
- UI restrictions remain helpful but not trusted.

## Data Refresh And Feedback

- Server action revalidates affected paths.
- Client calls `router.refresh()` on success so current server-rendered data updates without URL navigation.
- Success closes the modal.
- Success feedback should be visible after close, using existing toast infrastructure.
- Errors stay inline inside the modal and do not use query params.

## Test Mapping

### TDD First Failing Tests

1. Navigation unit test: no `新增` item is returned by `getVisibleDashboardNavigationItems`.
2. E2E update: opening create income from `/` by clicking `新增收入` opens dialog and URL has no `create` or `result`.
3. E2E update: validation error stays in modal and URL stays clean.
4. E2E update: successful create closes modal, shows record, and URL stays clean.
5. E2E new: `/records/new` shows not-found and no dialog.

### Existing Tests To Rewrite

- `e2e/create-record.spec.ts`
  - stop visiting `/?month=2026-06&create=...`
  - open modals through page-local buttons
  - assert dialog closes on success
  - assert no `create` / `result` params after error or success
- `e2e/permission-matrix.spec.ts`
  - open modals through buttons before manipulating hidden/select fields
  - assert permission errors are inline and URL stays clean

### Unit / Integration

- Add or update `src/app/ledger-record-actions` tests if action tests exist; otherwise cover through E2E plus parser/domain unit tests already present.
- Existing `src/app/ledger-record-form.test.ts` remains parser coverage and should not need behavior changes unless field names change.

## Implementation Order

1. Update tests to express new behavior and observe failures.
2. Remove sidebar `新增` item.
3. Delete `src/app/(app)/records/new/page.tsx`.
4. Convert create-record server action to `ActionState`.
5. Convert record-entry form to `useActionState`.
6. Refactor record-create triggers/dialog host to client state.
7. Update pages that render create controls to use the new trigger surface.
8. Run targeted unit/type/lint/E2E checks.

## Release Target Implications

- Target remains `local_dev`.
- No schema migration, secrets, OAuth callback, or production release concern is introduced.
- Verification must record that this is an IA/form-state change only and that ledger domain behavior is unchanged.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm action-state contract and success close behavior.
  - Confirm no compatibility path for old `?create=...` modal URLs.
  - Confirm all current create-enabled pages may keep their page-local create controls.
- acceptance_signals:
  - TDD Implementation can start with failing tests before code changes.
  - Implementation scope is limited to navigation, route deletion, record-create UI state, action-state conversion, and tests.
- unresolved_blockers:
  - None for TDD Implementation.
- next_step:
  - TDD Implementation
