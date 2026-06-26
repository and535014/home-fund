---
id: technical-design-edit-reimbursement-payment-records
stage: feature-technical-design
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-reimbursement-payment-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/edit-reimbursement-payment-records.md
  - .ai/prototype/edit-reimbursement-payment-records.md
  - .ai/spec/edit-reimbursement-payment-records.md
  - .ai/technical-design/reimbursement-payment-flow.md
  - .ai/technical-design/search-reimbursement-payment-records.md
outputs:
  - route_boundaries
  - server_action_contracts
  - domain_command_design
  - persistence_design
  - authorization_design
  - test_mapping
trace_links:
  production_routes:
    - /
    - /search
  target_components:
    - src/app/_record-detail/reimbursement-payment-dialogs.tsx
    - src/app/_record-detail/reimbursement-payment-fields.tsx
    - src/app/_record-detail/reimbursement-payment-readback-actions.ts
    - src/app/(app)/search/_components/record-search-panel.tsx
    - src/app/(app)/search/_actions/record-search-actions.ts
  domain_modules:
    - src/modules/reimbursement/reimbursement-payment.ts
    - src/modules/reimbursement/reimbursement-payment-corrections.ts
    - src/modules/reporting/reimbursement-payment-search-query.ts
    - src/modules/identity-access/authorization.ts
  persistence:
    - prisma/schema.prisma
reviewed_at: 2026-06-27
---

# Edit Reimbursement Payment Records Technical Design

## Decision Summary

- decision: ready_for_tdd_implementation_after_review
- mutation_owner: Reimbursement owns refund evidence correction.
- readback_owner: Reporting read models continue to map `ReimbursementPayment` for `/search` and reimbursed expense detail.
- editable_fields: `paidOn`, `method`, `note`.
- immutable_fields: amount, paid-to member, paid-from source, reimbursement batch, linked ledger records, recorded-by actor, created time, reimbursed status.
- permission_policy: add explicit `edit_reimbursement_payment` authorization command; same rule as reimbursement execution, admins and finance managers only.
- validation_policy: reuse `validateReimbursementPaymentEvidence` for method/date/note shape.
- persistence_policy: update the existing `ReimbursementPayment` row and add minimum correction metadata, not a full history table.
- metadata_policy: add nullable `editedAt` and `editedByMemberId`; no UI readback in this slice.
- cache_policy: revalidate `/` and `/search` after successful correction.
- next_gate: TDD Implementation.

## Route And Component Boundaries

### Refund Record Detail Dialog

`src/app/_record-detail/reimbursement-payment-dialogs.tsx` remains the shared detail UI for:

- `/search` refund-record rows.
- already reimbursed ordinary record detail readback.

Change the prototype-only local save into a real mutation path:

```ts
onUpdate?: (input: EditReimbursementPaymentInput) =>
  Promise<EditReimbursementPaymentActionResult>;
canEdit?: boolean;
```

`canEdit` controls the visible `編輯` button. The component must not decide authorization from role strings by itself. The server page or loader/action boundary passes the allowed state.

The existing extracted `ReimbursementPaymentEditDialog` stays as a local component or moves to a sibling file only if the implementation becomes large. It owns draft state, submit pending state, and field error display. The detail dialog owns the selected payment result and readback update after success.

### Search Page

`src/app/(app)/search/_components/record-search-panel.tsx` already owns selected refund payment state and refresh behavior. It should pass:

- `canEditReimbursementPayments` from the route/session boundary.
- an `onUpdate` handler that calls the server action.
- a success callback that replaces the selected payment result and updates loaded refund results with the returned read model.

After an edit:

- If the edited row is still in the loaded `/search` result set, replace it in place.
- If changed `paidOn` would move it outside the current date filter or order, trigger a reload of the current refund query instead of trying to locally reorder every pagination edge case.
- Reimbursed expense readback cache (`reimbursementPaymentByRecordId`) should update any linked ledger record IDs returned by the updated read model.

### Dashboard / Home Readback

The shared dialog can be opened from reimbursed expense detail in dashboard flows. The update server action should not be tied to `/search`; the UI may call the same action from both entry points. Revalidation still includes both `/` and `/search`.

## Server Action Contract

Add a reimbursement-payment correction action near the existing readback actions:

- preferred file: `src/app/_record-detail/reimbursement-payment-edit-actions.ts`
- acceptable fallback: `src/app/_record-detail/reimbursement-payment-readback-actions.ts` if keeping all payment evidence actions together remains simpler.

```ts
export type EditReimbursementPaymentInput = {
  paymentId: string;
  paidOn?: string | null;
  method?: string | null;
  note?: string | null;
};

export type EditReimbursementPaymentActionResult =
  | {
      ok: true;
      record: ReimbursementPaymentSearchResult;
      message: "退款紀錄已更新";
    }
  | {
      ok: false;
      reason:
        | "missing_payment_date"
        | "invalid_payment_date"
        | "missing_payment_method"
        | "invalid_payment_method"
        | "unauthorized"
        | "not_found"
        | "mutation_failed";
      message: string;
      fieldErrors?: {
        paidOn?: string;
        method?: string;
        note?: string;
      };
    };
```

The action must:

1. Require an authenticated household member.
2. Authorize with `edit_reimbursement_payment`.
3. Validate `paidOn`, `method`, and `note`.
4. Load the target `ReimbursementPayment` by `id` and current household.
5. Update only `paidOn`, `method`, `note`, `editedAt`, and `editedByMemberId`.
6. Re-read the updated row with `reimbursementPaymentSelect`.
7. Revalidate `/` and `/search`.
8. Return the mapped `ReimbursementPaymentSearchResult`.

Do not accept or spread arbitrary form fields into Prisma update data.

## Domain Command Design

Create `src/modules/reimbursement/reimbursement-payment-corrections.ts`.

The module should be pure enough to test without Prisma:

```ts
export type CorrectReimbursementPaymentEvidenceInput = {
  method?: string | null;
  paidOn?: string | null;
  note?: string | null;
};

export type CorrectReimbursementPaymentEvidenceResult =
  | {
      ok: true;
      payment: {
        method: ReimbursementPaymentMethod;
        paidOn: string;
        note: string | null;
      };
    }
  | {
      ok: false;
      reason: ReimbursementPaymentEvidenceRejectionReason;
    };
```

Implementation can delegate to `validateReimbursementPaymentEvidence`, but it should normalize empty note to `null` for persistence. Existing read models already map `null` back to `""` and UI readback displays `沒有備註。`.

No domain command should accept amount, paid-to member, paid-from source, batch ID, linked record IDs, recorded-by member, or reimbursed status.

## Authorization Design

Extend `src/modules/identity-access/authorization.ts`:

```ts
| { type: "edit_reimbursement_payment" }
```

Rules:

- admin: allowed
- finance_manager: allowed
- general_member: rejected with `finance_manager_required`
- unlinked Google account: rejected before role checks

Using a separate command is intentionally more explicit than reusing `perform_reimbursement`. It keeps future policy changes possible, such as allowing original recorder corrections but not new reimbursements.

UI authorization should come from the same session-derived rule:

- server loaders or route components derive `canEditReimbursementPayments`.
- client components only hide/show the button based on the boolean.
- server action remains authoritative.

## Persistence Design

Add minimum correction metadata to `ReimbursementPayment`:

```prisma
model ReimbursementPayment {
  // existing fields
  editedAt         DateTime?
  editedByMemberId String?

  editedByMember Member? @relation("ReimbursementPaymentEditor", fields: [editedByMemberId], references: [id], onDelete: Restrict)
}
```

Also add the opposite relation on `Member` if Prisma requires it:

```prisma
reimbursementPaymentsEdited ReimbursementPayment[] @relation("ReimbursementPaymentEditor")
```

Migration policy:

- nullable fields, no backfill required.
- no full history table in this MVP.
- no `updatedAt` auto-update field because only evidence corrections should set this metadata.

Update statement:

```ts
await tx.reimbursementPayment.update({
  where: {
    id: input.paymentId,
    householdId: actor.householdId,
  },
  data: {
    method: validated.payment.method,
    paidOn: dateOnly(validated.payment.paidOn),
    note: normalizedNote,
    editedAt: now,
    editedByMemberId: actor.id,
  },
});
```

If the generated Prisma client does not support compound `where` for non-unique `id + householdId`, use `updateMany` for household-scoped mutation followed by a `findFirst`, or `findFirst` by `id + householdId` before `update({ where: { id } })` inside the same transaction. Prefer transaction-wrapped `findFirst` plus `update` for clearer not-found handling.

## Read Model And Cache Design

`src/modules/reporting/reimbursement-payment-search-query.ts` remains the read model mapper. It does not need to expose `editedAt` or `editedByMemberId` in this slice.

The mutation action should reuse:

- `reimbursementPaymentSelect`
- `mapReimbursementPaymentSearchResult`

This keeps row, detail, and reimbursed expense readback formats consistent after save.

Cache/reload responsibilities:

- server action calls `revalidatePath("/")` and `revalidatePath("/search")`.
- client receives the updated mapped record for immediate detail readback.
- `/search` loaded results are updated locally when possible.
- if `paidOn` changes, reload the current refund search query when the current sort/filter could be invalidated.

## Validation And Error Strategy

Server-side validation is authoritative.

Use existing messages where possible:

| Reason | Field | Message |
|---|---|---|
| `missing_payment_date` | `paidOn` | `請填寫付款日期。` |
| `invalid_payment_date` | `paidOn` | `付款日期格式不正確。` |
| `missing_payment_method` | `method` | `請選擇付款方式。` |
| `invalid_payment_method` | `method` | `付款方式不支援。` |
| `unauthorized` | none | `目前帳號沒有編輯退款紀錄權限。` |
| `not_found` | none | `找不到這筆退款紀錄。` |
| `mutation_failed` | none | `退款紀錄儲存失敗，請稍後再試。` |

Client behavior:

- pending save disables `儲存變更`.
- field errors render under their fields using existing `FieldError` style if available.
- success shows toast `退款紀錄已更新`.
- non-field failures show toast with returned message and keep the edit dialog open.

## Test Mapping

### Unit Tests

- `src/modules/reimbursement/reimbursement-payment-corrections.test.ts`
  - accepts valid `paidOn`, `method`, and empty/non-empty note.
  - rejects missing/invalid date.
  - rejects missing/invalid method.
  - normalizes blank note to `null`.
- `src/modules/identity-access/authorization.test.ts`
  - admin and finance manager can `edit_reimbursement_payment`.
  - general member cannot.

### Server Action Tests

- Add tests beside existing readback/search action tests.
- Mock Prisma transaction or use the existing action-test style.
- Cover:
  - successful update writes only `paidOn`, `method`, `note`, `editedAt`, `editedByMemberId`.
  - not-found when payment belongs to another household.
  - unauthorized actor rejection before mutation.
  - invalid fields return field errors and do not update.
  - returned record is mapped through `mapReimbursementPaymentSearchResult`.

### Component Tests

- `ReimbursementPaymentDetailDialog` hides `編輯` when `canEdit` is false.
- edit dialog renders only date, method, and note as editable controls.
- cancel discards draft changes.
- successful action result updates visible readback and shows success toast.

### E2E Tests

Extend `e2e/record-search.spec.ts`:

- finance manager opens `/search` `退款紀錄`, edits date/method/note, sees toast, and sees updated detail readback.
- cancel leaves the original readback unchanged.
- general member can read a refund detail but does not see `編輯`.

If E2E database reset makes repeated mutation assertions brittle, seed a dedicated reimbursement payment row for this spec and use a unique note value per run.

## Release Target Implications

For `local_dev`:

- Prisma migration required for nullable correction metadata.
- Regenerate Prisma client after schema change.
- Seed data may need one stable refund evidence row for edit E2E.
- Run `corepack pnpm type-check`.
- Run `corepack pnpm lint`.
- Run focused tests for reimbursement payment correction, authorization, action tests, and `e2e/record-search.spec.ts` if the dev database is available.

No production readiness claim is made by this design.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm minimum correction metadata (`editedAt`, `editedByMemberId`) is acceptable instead of direct overwrite or full history.
  - Confirm a new explicit `edit_reimbursement_payment` authorization command is preferred.
  - Confirm client reload behavior after changed `paidOn` can reload the current refund search instead of locally reordering all pages.
  - Confirm TDD should start with domain/authorization/action tests before UI wiring.
- must_check:
  - TDD Implementation must write or enable tests before production behavior.
  - Server action must never trust hidden UI controls for immutable settlement facts.
  - Migration must be included in local_dev verification if metadata fields are implemented.
- acceptance_signals:
  - Design maps directly to current modules and avoids a broad refund-record rewrite.
  - Persistence keeps settlement facts immutable.
  - Reporting readback remains consistent after save.
- unresolved_blockers:
  - None for TDD Implementation if metadata decision is accepted.
- next_step:
  - TDD Implementation for `edit-reimbursement-payment-records`.
