---
id: technical-design-batch-search-record-actions
stage: feature-technical-design
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/batch-search-record-actions.md
  - .ai/domain-impact/batch-search-record-actions.md
  - .ai/prototype/batch-search-record-actions.md
  - .ai/spec/batch-search-record-actions.md
outputs:
  - route_boundaries
  - server_action_contracts
  - domain_command_design
  - pagination_design
  - test_mapping
trace_links:
  production_routes:
    - /search
    - /reimbursements
  target_components:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-actions.ts
    - src/app/record-search-panel.tsx
    - src/app/record-list-detail.tsx
    - src/components/layout/page-layout.tsx
    - src/app/dashboard-navigation.ts
    - src/app/ledger-record-actions.ts
  domain_modules:
    - src/modules/fund-ledger/ledger-record-batch-actions.ts
    - src/modules/fund-ledger/ledger-record-corrections.ts
    - src/modules/reimbursement/reimbursement-batch-actions.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/identity-access/authorization.ts
  persistence:
    - src/app/home-dashboard-data-source.ts
    - src/modules/reporting/record-search-query.ts
    - prisma/schema.prisma
reviewed_at: 2026-06-22
---

# Batch Search Record Actions Technical Design

## Decision Summary

- decision: ready_for_tdd_implementation_after_review
- route_policy: `/search` owns search, selection, batch delete, and batch refund; `/reimbursements` remains deleted and falls through to the framework default 404.
- pagination_policy: search records are fetched from the server in cursor pages of 100 records; client-side full-table filtering is replaced for `/search`.
- footer_total_policy: server returns current-query `totalCount` and signed net total; UI renders the absolute value with positive/negative color and the label `總額`.
- selection_scope: `全選目前顯示` selects only records already loaded and rendered in the result list, not records on unloaded pages.
- mutation_policy: batch delete and batch refund are partial-success operations with server-authoritative authorization and eligibility checks.
- schema_policy: no new domain tables are required; add search pagination indexes for stable cursor ordering.
- single_record_policy: existing single-record detail delete/refund behavior remains available and keeps current all-or-nothing semantics.

## Route And Component Boundaries

### `/search`

`src/app/(app)/search/page.tsx` stays a server component. It loads:

- authenticated household context.
- member/category lookup data for filters and row labels.
- the first search page only when the default query should render results after a user-applied query. Before any search keyword or non-default filter is active, the footer remains hidden.

`src/app/record-search-panel.tsx` owns browser interaction state:

- draft query and applied query.
- loaded pages, `nextCursor`, `totalCount`, and `totalNetAmountCents`.
- selection mode, selected record IDs, and batch confirmation dialogs.
- loading and mutation pending states.

It must no longer depend on all active records being preloaded. The existing prototype's local delete/refund state is replaced by server actions and reloads.

`src/app/record-list-detail.tsx` remains the shared record list/detail component. It keeps optional selection controls and the infinite-load sentinel, but it receives already-loaded records from the search panel. It does not own query state or batch mutation state.

`src/components/layout/page-layout.tsx` keeps `PageFooter` as the shared sticky page footer wrapper. The footer has a top border only, no card wrapper, no icons, and no badge treatment.

### Removed Reimbursement Page

`src/app/(app)/reimbursements/page.tsx` must stay deleted. Primary navigation must not expose a `退款` route. Stale references must be removed from:

- `src/app/dashboard-navigation.ts`
- `src/app/(app)/page.tsx` copy that currently mentions the refund page.
- `src/app/ledger-record-actions.ts` revalidation calls.
- E2E tests that currently visit or assert `/reimbursements`.

## Search Pagination Contract

Create `src/app/record-search-actions.ts` for server actions used by the client panel.

```ts
export const SEARCH_RECORD_PAGE_SIZE = 100;

export type SearchRecordPageRequest = {
  query: RecordQueryState;
  cursor?: SearchRecordCursor | null;
};

export type SearchRecordCursor = {
  id: string;
  occurredOn: string;
  amountCents?: number;
};

export type SearchRecordPageResult =
  | {
      ok: true;
      records: LedgerRecord[];
      nextCursor: SearchRecordCursor | null;
      totalCount: number;
      totalNetAmountCents: number;
    }
  | {
      ok: false;
      reason: "unauthenticated" | "invalid_query" | "load_failed";
      message: string;
    };
```

Server search uses `take: SEARCH_RECORD_PAGE_SIZE + 1` to detect the next cursor, then returns at most 100 records.

### Query Translation

Move database query building into `src/modules/reporting/record-search-query.ts` so server actions and tests can exercise it without React.

Responsibilities:

- translate `RecordQueryState` to Prisma `where`.
- translate `RecordSortOrder` to stable `orderBy`.
- apply cursor predicates that match the active sort order.
- compute aggregate count and signed net total with the same filters as the page query.

The base `where` always includes `householdId` and `status: "active"`.

Filter mapping:

- `type`: `income`, `expense`, or all.
- `categoryId`: exact category ID when not `all`.
- `participant`: income uses `sourceMemberId`; member-paid expenses use `payerMemberId`; fund expenses use `paymentSource: "fund"`.
- `reimbursementStatus`: applies only to member-paid expenses; `refunded` maps to `reimbursed`; `unrefunded` maps to `refundable`.
- date range: inclusive `occurredOn` date bounds.
- keyword: preserve current user-facing behavior by searching record name and formatted amount. Name uses case-insensitive `contains`; numeric/currency-like input is normalized to cents and matched against `amountCents`.

Aggregate total:

- income sum contributes positive cents.
- expense sum contributes negative cents.
- result is `incomeAmountCents - expenseAmountCents`.

Use a single Prisma transaction or concurrent reads against the same `where`:

- page query with cursor and sort.
- `count`.
- grouped sums by `type` or two aggregate queries.

### Stable Sorts And Cursors

Existing UI sort labels remain unchanged, but server sort needs deterministic tie-breakers.

| UI sort | Prisma order |
|---|---|
| `newest` | `occurredOn desc`, `id desc` |
| `oldest` | `occurredOn asc`, `id asc` |
| `amount_desc` | `amountCents desc`, `occurredOn desc`, `id desc` |
| `amount_asc` | `amountCents asc`, `occurredOn desc`, `id desc` |

The cursor predicate must mirror the sort. Example for `newest`: records after the cursor are those with an earlier `occurredOn`, or the same `occurredOn` and a smaller `id`.

### Indexes

Current indexes cover several household/status/date queries but do not include the `id` tie-breaker or amount sort. Add a Prisma migration with indexes shaped for cursor paging:

```prisma
@@index([householdId, status, occurredOn, id])
@@index([householdId, status, type, occurredOn, id])
@@index([householdId, status, reimbursementStatus, occurredOn, id])
@@index([householdId, status, categoryId, occurredOn, id])
@@index([householdId, status, amountCents, occurredOn, id])
```

Participant filters may still use existing relation-field indexes less directly. If query plans show member participant filters becoming hot, add follow-up indexes for `(householdId, status, sourceMemberId, occurredOn, id)` and `(householdId, status, payerMemberId, occurredOn, id)`.

## Selection Semantics

Selection state lives only in the client panel and stores record IDs currently selected by the user.

`全選目前顯示` means:

- select every record currently loaded and rendered by the result list.
- do not select records on unloaded pages.
- when the next page loads, newly loaded records are unselected until the user selects them or activates `全選目前顯示` again.

When all currently rendered records are selected, replace or disable the control with `已全選目前顯示`. Keep `清除選取` as the only clear operation.

Changing applied query or sort clears selection and restarts paging from page one.

## Batch Mutation Contracts

Use server actions in `src/app/record-search-actions.ts`:

```ts
export type BatchRecordActionResult =
  | {
      ok: true;
      processedRecordIds: string[];
      skippedRecords: BatchSkippedRecord[];
      processedCount: number;
      skippedCount: number;
      refundTotalCents?: number;
      message: string;
    }
  | {
      ok: false;
      reason: "empty_selection" | "no_eligible_records" | "unauthenticated" | "mutation_failed";
      skippedRecords?: BatchSkippedRecord[];
      message: string;
    };

export type BatchSkippedRecord = {
  recordId: string;
  reason:
    | "permission_denied"
    | "record_not_found"
    | "record_voided"
    | "reimbursed_expense_blocked"
    | "not_refundable"
    | "already_reimbursed"
    | "not_expense"
    | "fund_paid_expense";
};
```

The server must treat client eligibility counts as advisory. All selected IDs are reloaded by household and checked again in the domain layer.

After any successful mutation, revalidate `/` and `/search`. Do not revalidate `/reimbursements`.

### Batch Delete

Add `src/modules/fund-ledger/ledger-record-batch-actions.ts`.

It should reuse the same authorization and mutability rules as `deleteLedgerRecord`, but return partial results instead of failing on the first skipped record.

Rules:

- admin can delete any active non-reimbursed record.
- record owner can delete their own active non-reimbursed record.
- finance manager does not get extra delete rights unless existing authorization grants them.
- voided records are skipped.
- reimbursed expenses are skipped.
- IDs not found in the actor household are skipped as `record_not_found`.

Persistence updates only processed IDs to `status: "voided"` in one transaction. There is no hard delete.

### Batch Refund

Add `src/modules/reimbursement/reimbursement-batch-actions.ts`.

It should preserve `markExpensesReimbursed` for existing all-or-nothing single-record or table flows, and introduce a partial-success batch command for `/search`.

Rules:

- actor must be authorized for `perform_reimbursement`; otherwise the entire action fails with `permission_denied`.
- eligible records are active expenses, `paymentSource: "member"`, and `reimbursementStatus: "refundable"`.
- income, fund-paid expenses, voided records, and already reimbursed expenses are skipped.
- IDs not found in the actor household are skipped as `record_not_found`.

Persistence transaction:

1. Load selected ledger records by ID and household.
2. Build partial-success domain result.
3. If no records are processable, return `no_eligible_records` with skipped reasons and do not create a batch.
4. Create one `ReimbursementBatch` for processed records.
5. Create `ReimbursementBatchItem` rows for processed records.
6. Update processed ledger records to `reimbursementStatus: "reimbursed"`.

The returned `refundTotalCents` is the sum of processed record amounts and is the authoritative value used in success feedback. The confirmation dialog may preview the eligible selected total from loaded client data, but the server result wins after submission.

## Frontend Interaction Design

Normal query mode:

- footer hidden while query is initial.
- footer shows `搜尋結果 <totalCount> 筆`.
- footer shows `總額 <absolute formatted total>` colored by sign.
- result list loads additional server pages through `loadRecordSearchPageAction` when the sentinel intersects.

Selection mode:

- footer shows `已選取 <selectedCount> 筆`.
- footer shows selected signed net total as absolute value with sign color.
- no footer icons.
- `批次刪除 (<eligibleDeleteCount>)` and `批次退款 (<eligibleRefundCount>)` count only currently selected records that are eligible according to loaded client data.
- confirmations show process/skip counts computed from loaded client data, and refund confirmation shows `退款總金額`.
- after mutation, clear selection and reload the first page for the current query so totals and rows reflect server truth.

Error handling:

- if loading another page fails, keep already loaded rows and show a retryable Traditional Chinese status near the sentinel.
- if mutation returns partial success, show processed/skipped counts.
- if mutation returns no eligible records, keep selection mode active so the user can adjust selection.

## Test Mapping

Unit tests:

- `src/modules/reporting/record-search-query.test.ts`
  - translates all filters to Prisma-compatible conditions.
  - preserves amount keyword matching.
  - builds stable order/cursor predicates for all four sort modes.
  - computes signed net totals from income and expense sums.
- `src/modules/fund-ledger/ledger-record-batch-actions.test.ts`
  - partial delete success.
  - permission skipped records.
  - voided and reimbursed records skipped.
- `src/modules/reimbursement/reimbursement-batch-actions.test.ts`
  - authorized partial refund success.
  - no eligible records creates no batch.
  - already reimbursed, fund-paid, income, and voided records skipped.

App/server tests:

- extend `src/app/home-dashboard-data-source.test.ts` or add `src/app/record-search-actions.test.ts` for page size 100, `nextCursor`, `totalCount`, and `totalNetAmountCents`.
- verify server actions reject unauthenticated or empty submissions.
- verify successful batch actions revalidate `/` and `/search` only.

Component and E2E tests:

- update `e2e/record-search.spec.ts` for selection mode, footer, all-currently-displayed selection, progressive loading, and batch confirmation text.
- remove direct-visit E2E coverage for removed routes such as `/reimbursements`, `/recurring`, and `/records`; do not add navigation-absence tests for deleted pages.
- add or extend fixture data with more than 100 matching records to exercise cursor paging.
- run desktop and mobile footer assertions to guard against overlap.

## Implementation Order

1. Add failing unit tests for record search query translation, cursor paging, and signed total.
2. Implement server search query builder and page action.
3. Add Prisma index migration.
4. Replace `/search` full-record preload with server page loading.
5. Add failing domain tests for batch delete/refund partial success.
6. Implement batch domain commands and persistence/server actions.
7. Wire client confirmations to server mutations and refresh/reload behavior.
8. Remove stale `/reimbursements` copy, revalidation, and E2E expectations.
9. Run type-check, lint, unit tests, and targeted E2E.

## Risks And Follow-Ups

- `contains` keyword search is acceptable for local_dev MVP but can become slow on large production datasets; full-text search is a future production-readiness decision.
- Cursor pagination with mutable data can shift records between pages after mutations; the UI reloads from the first page after batch actions to avoid stale totals.
- Partial success can surprise users if client eligibility differs from server truth; confirmation copy must frame counts as "currently eligible" and result feedback must show authoritative processed/skipped counts.
- Index migration affects release readiness. Local_dev is acceptable after migration and smoke verification; stricter targets need migration rollback and query-plan evidence.

## Review Gate

- status: review
- recommended_decision: approve_for_tdd_implementation
- recommended_next_gate: TDD Implementation for `batch-search-record-actions`
- open_questions:
  - Should production later support cross-page "select all matching query" as a separate explicit feature? Current decision is no; only visible loaded rows are selected.
