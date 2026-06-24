---
id: technical-design-reimbursement-payment-flow
stage: feature-technical-design
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/prototype/reimbursement-payment-flow.md
  - .ai/spec/reimbursement-payment-flow.md
outputs:
  - route_boundaries
  - server_action_contracts
  - domain_command_design
  - persistence_design
  - test_mapping
trace_links:
  production_routes:
    - /
    - /search
  target_components:
    - src/app/record-list-detail.tsx
    - src/app/batch-action-dialog.tsx
    - src/app/record-search-panel.tsx
    - src/app/reimbursement-payment-fields.tsx
    - src/app/ledger-record-actions.ts
    - src/app/record-search-actions.ts
  domain_modules:
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/reimbursement/reimbursement-batch-actions.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/reporting/monthly-report.ts
    - src/modules/identity-access/authorization.ts
  persistence:
    - prisma/schema.prisma
    - src/app/home-dashboard-data-source.ts
    - src/modules/reporting/record-search-query.ts
reviewed_at: 2026-06-24
---

# Reimbursement Payment Flow Technical Design

## Decision Summary

- decision: ready_for_tdd_implementation_after_review
- schema_policy: add `ReimbursementPayment` plus payment method enum; keep `LedgerRecord` as the source of ordinary income/expense truth.
- paid_from_policy: fixed `household_fund` value stored as evidence, not exposed as an editable form field.
- payment_method_policy: controlled enum values `bank_transfer`, `cash`, `other`.
- payment_date_policy: date-only field, defaulted by UI to the current local date and validated server-side.
- transaction_policy: create reimbursement batch, create payment evidence, and mark ledger records reimbursed in one transaction.
- batch_policy: one payment evidence record per batch; reject cross-member eligible selections for this slice.
- legacy_policy: already-reimbursed batches without payment evidence remain readable with a missing-evidence state.
- next_gate: TDD Implementation

## Route And Component Boundaries

### Dashboard Record Detail

`src/app/record-list-detail.tsx` keeps the existing record-detail refund entry point. `RefundRecordDialog` should continue rendering:

- existing record summary card.
- `ReimbursementPaymentFields`.
- existing cancel and confirm buttons.

It must not render separate form title text, helper descriptions, paid-to member, amount, or payment-source controls. Those facts are derived from the selected record.

`src/app/reimbursement-payment-fields.tsx` remains a small shared client component. It renders only:

- `付款方式` select.
- `付款日期` date input.
- `交易備註` single-line input.

This component does not own validation rules beyond browser input shape; server actions are authoritative.

### Search Batch Refund

`src/app/batch-action-dialog.tsx` remains the shared delete/refund confirmation dialog. For refund:

- top summary shows `將處理` and `略過` side by side.
- `退款總金額` is on a separate row.
- payment fields render only when eligible selected records have exactly one payer member.
- confirm is disabled when there are no eligible records or when eligible records contain multiple payer members.
- no cross-member explanatory warning is shown in this prototype-approved slice.

`src/app/record-search-panel.tsx` must pass payment form data to the batch refund action instead of only passing record IDs.

## Persistence Design

Add enums and model to `prisma/schema.prisma`:

```prisma
enum ReimbursementPaymentSource {
  household_fund
}

enum ReimbursementPaymentMethod {
  bank_transfer
  cash
  other
}

model ReimbursementPayment {
  id                   String                      @id @default(cuid())
  householdId           String
  reimbursementBatchId  String                      @unique
  paidToMemberId        String
  paidFromSource        ReimbursementPaymentSource  @default(household_fund)
  method                ReimbursementPaymentMethod
  amountCents           Int
  paidOn                DateTime                    @db.Date
  note                  String?
  recordedByMemberId    String
  createdAt             DateTime                    @default(now())

  household             Household            @relation(fields: [householdId], references: [id], onDelete: Restrict)
  reimbursementBatch    ReimbursementBatch   @relation(fields: [reimbursementBatchId], references: [id], onDelete: Restrict)
  paidToMember          Member               @relation("ReimbursementPaymentPaidTo", fields: [paidToMemberId], references: [id], onDelete: Restrict)
  recordedByMember      Member               @relation("ReimbursementPaymentRecorder", fields: [recordedByMemberId], references: [id], onDelete: Restrict)

  @@index([householdId, paidOn])
  @@index([paidToMemberId, paidOn])
}
```

Also add `payment ReimbursementPayment?` relation on `ReimbursementBatch`, and corresponding relation arrays on `Household` and `Member` if Prisma requires explicit opposite fields.

### Data Rules

- `amountCents` equals the sum of selected eligible reimbursed expense amounts.
- `paidToMemberId` equals the sole `payerMemberId` across all selected reimbursed expenses.
- `paidFromSource` is always `household_fund` in this slice.
- `reimbursementBatchId` is unique, enforcing one payment evidence row per batch.
- Existing batches can have no payment row for legacy compatibility.

No ordinary `LedgerRecord` is created for reimbursement payment evidence.

## Domain Command Design

Create a payment evidence value object in `src/modules/reimbursement/reimbursements.ts` or a new adjacent module:

```ts
export type ReimbursementPaymentEvidenceInput = {
  method: "bank_transfer" | "cash" | "other";
  paidOn: string; // YYYY-MM-DD
  note?: string;
};
```

Extend domain results with reasons:

```ts
type ReimbursementPaymentRejectionReason =
  | "missing_payment_method"
  | "invalid_payment_method"
  | "missing_payment_date"
  | "invalid_payment_date"
  | "cross_member_batch"
  | "payment_amount_mismatch";
```

Single-record reimbursement can keep the existing `markExpensesReimbursed` selection invariant, but persistence must require payment evidence before calling or before committing status changes.

For batch refund, update `batchMarkLedgerRecordsReimbursed` to reject cross-member eligible records for payment-flow mode, or add a wrapper command such as `batchMarkLedgerRecordsReimbursedWithPayment`. Prefer a wrapper if existing batch search tests depend on partial-success behavior without payment.

## Server Action Contracts

### Single Record

Update `parseReimburseLedgerRecordForm` in `src/app/ledger-record-form.ts` or current parser location to parse:

- `recordId`
- `reimbursementMethod`
- `reimbursementPaidOn`
- `reimbursementReference`

Result shape:

```ts
type ReimburseLedgerRecordCommand = {
  selectedExpenseIds: [string];
  payment: ReimbursementPaymentEvidenceInput;
};
```

`reimburseLedgerRecordAction` calls `markExpensesReimbursedInDatabase` with payment evidence. Error mapping adds:

- `missing_payment_method`
- `invalid_payment_method`
- `missing_payment_date`
- `invalid_payment_date`

Field errors map to `reimbursementMethod` and `reimbursementPaidOn`.

### Batch Search Refund

Change `batchRefundSearchRecordsAction` from:

```ts
batchRefundSearchRecordsAction(recordIds: string[])
```

to:

```ts
batchRefundSearchRecordsAction(input: {
  recordIds: string[];
  payment: ReimbursementPaymentEvidenceInput;
})
```

`RecordSearchPanel.completeBatchAction` must collect `FormData` from `BatchActionDialog` for refund actions. Delete actions stay ID-only.

Return existing `BatchSearchRecordActionResult`, adding validation failure reasons if needed:

- `invalid_payment`
- `cross_member_batch`

For cross-member direct submissions, server rejects the refund and does not create batch, payment, or status changes.

## Transaction Design

Update `markExpensesReimbursedInDatabase` to accept payment evidence:

```ts
type MarkExpensesReimbursedInDatabaseContext = {
  prisma: PrismaClient;
  householdId?: string;
  generateBatchId?: () => string;
  generatePaymentId?: () => string;
  reimbursedAt?: Date;
  payment: ReimbursementPaymentEvidenceInput;
};
```

Inside one transaction:

1. Deduplicate selected IDs.
2. Load active household expense records.
3. Run domain reimbursement eligibility.
4. Validate exactly one paid-to member from selected reimbursed expenses.
5. Validate payment method and paid date.
6. Create `ReimbursementBatch`.
7. Create `ReimbursementPayment` linked to the batch.
8. Update selected active ledger records to `reimbursed`.
9. Return existing result plus payment summary if useful.

Order can create batch before payment because payment references batch; all writes stay in the same transaction, so failure rolls back all.

Batch search refund should reuse this persistence helper if partial-success eligible records are already computed and same-member. If reuse is awkward, extract lower-level helper:

```ts
createReimbursementSettlementInTransaction(tx, actor, householdId, expenses, payment)
```

This avoids duplicating batch/payment/status writes across single and batch actions.

## Read Model Design

### Record Detail

Extend dashboard/search record data source only as needed to display payment evidence for reimbursed records after implementation. Suggested read model:

```ts
type ReimbursementPaymentView =
  | {
      status: "available";
      paidToMemberName: string;
      amountCents: number;
      paidFromSource: "household_fund";
      method: "bank_transfer" | "cash" | "other";
      paidOn: string;
      note?: string;
    }
  | { status: "missing_legacy_evidence" }
  | { status: "not_reimbursed" };
```

The prototype did not finalize readback UI, so implementation may keep readback minimal but must not fabricate evidence for legacy records.

### Reporting

`monthly-report.ts` remains based on ledger records and reimbursement table data. It must not include `ReimbursementPayment` as income or expense. Tests should assert this explicitly.

## Validation Ownership

- UI: renders approved fields and basic HTML input shape.
- Server action parser: required presence, enum membership, date-only shape.
- Domain/persistence command: same-member invariant, amount match, household scope, active/refundable eligibility.
- Database: relational integrity and one payment per batch.

Date validation:

- Accept only `YYYY-MM-DD`.
- Persist as `DateTime @db.Date`.
- Reject invalid calendar dates.

Note validation:

- Optional.
- Trim whitespace.
- Store `null` or omit when blank.
- Technical implementation may cap at a pragmatic length such as 200 characters; if added, tests must cover it.

## Authorization Boundary

Existing `perform_reimbursement` authorization remains authoritative for both single and batch reimbursement. Admins and finance managers continue to be allowed by existing policy.

Authorization runs before writes and inside server action flow. Client-side button visibility/disabled state is advisory only.

## Error And Feedback Strategy

Use existing action-state and toast patterns.

Single refund errors:

- missing/invalid method: field error on `reimbursementMethod`.
- missing/invalid date: field error on `reimbursementPaidOn`.
- ineligible record: existing reimbursement errors.

Batch refund errors:

- empty selection: existing message.
- no eligible records: existing message.
- cross-member batch direct submission: `確認退款` is disabled in UI; direct server result should return a clear mutation failure or specific `cross_member_batch` message if surfaced later.
- skipped records warning remains for ineligible records.

Success feedback:

- single: keep `已完成退款`, description mentions refund payment information was kept.
- batch: keep `已完成批次退款`, existing processed/skipped description is acceptable.

## Test Mapping

### Domain / Unit

- `reimbursements.test.ts`: payment evidence required, method enum, date-only validation, same-member invariant.
- `reimbursement-batch-actions.test.ts`: cross-member batch rejection for payment-flow mode; same-member batch succeeds.
- `monthly-report.test.ts`: reimbursement payment evidence does not affect ordinary income/expense totals.

### Server Action / Integration

- `ledger-record-form.test.ts`: parser accepts method/date/note and rejects missing/invalid method/date.
- `reimbursement-command` tests: single settlement creates batch, payment, item, and status update atomically.
- `record-search-actions` tests if present or added: batch same-member settlement creates one payment row; cross-member direct submission rejects without writes.

### Component / E2E

- `reimbursement-payment-fields` component test if component test coverage exists: renders only `付款方式`, `付款日期`, `交易備註`; no icons or extra title.
- `e2e/dashboard.spec.ts`: update single refund flow to fill payment evidence and assert success.
- `e2e/record-search.spec.ts`: update batch refund flow to fill payment evidence, assert total row, and assert cross-member disabled state if fixture supports it.

## Migration And Release Implications

- Requires Prisma migration for enums/model/relations.
- Existing local data with old reimbursement batches remains valid because payment relation is optional.
- Seeds may need payment evidence for already-reimbursed demo records, or tests must expect missing legacy state.
- `corepack pnpm db:deploy`, seed scripts, generated Prisma client, type-check, lint, unit tests, and relevant E2E must pass before local_dev release readiness.

## TDD Implementation Preconditions

Before writing persistence implementation:

1. Add failing parser tests for payment method/date/note.
2. Add failing domain tests for missing evidence and cross-member batch.
3. Add Prisma schema migration and regenerate client.
4. Add failing persistence test for payment row creation if test infrastructure allows database-backed tests.
5. Update UI/server action only after failing tests define the contract.

## Risks And Open Decisions

- Readback UI for reimbursed records is not finalized by prototype; implementation should keep it minimal and traceable.
- Batch partial-success plus cross-member rejection needs careful handling: skipped ineligible records are allowed, but eligible records spanning multiple payers are rejected as one payment.
- Payment evidence immutability is policy-only unless technical design adds DB-level update restrictions; app code should avoid edit actions.
- Production accounting, external transfer execution, reconciliation, correction, and reversal remain out of scope.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm schema shape and one-payment-per-batch relation.
  - Confirm server action contracts and transaction boundary.
  - Confirm cross-member batch direct submission rejects rather than auto-splitting.
  - Confirm readback can remain minimal for implementation.
- must_check:
  - Behavior Spec AC map to tests before implementation.
  - Migration and seed impacts are explicit.
  - Existing status-only reimbursement paths are upgraded or blocked from new settlements without payment evidence.
- acceptance_signals:
  - TDD Implementation can start from the listed failing tests.
  - No unresolved foundation work is required.
  - Schema and action contracts are concrete enough to implement.
- unresolved_blockers:
  - None.
- next_step:
  - TDD Implementation for `reimbursement-payment-flow`.
