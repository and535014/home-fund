---
id: technical-design-search-reimbursement-payment-records
stage: feature-technical-design
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
  - .ai/prototype/search-reimbursement-payment-records.md
  - .ai/spec/search-reimbursement-payment-records.md
  - .ai/archive/archive-batch-search-record-actions-2026-06-22.md
  - .ai/archive/archive-reimbursement-payment-flow-2026-06-25.md
outputs:
  - route_boundaries
  - server_action_contracts
  - read_model_design
  - pagination_design
  - authorization_design
  - test_mapping
trace_links:
  production_routes:
    - /search
  target_components:
    - src/app/(app)/search/page.tsx
    - src/app/record-search-panel.tsx
    - src/app/record-search-controls.tsx
    - src/app/record-list-detail.tsx
    - src/app/record-search-actions.ts
  domain_modules:
    - src/modules/reporting/record-search-query.ts
    - src/modules/reporting/refund-record-search-query.ts
    - src/modules/reimbursement/reimbursements.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/reimbursement/reimbursement-payment.ts
    - src/modules/identity-access/authorization.ts
  persistence:
    - prisma/schema.prisma
    - prisma/migrations/20260624172000_add_reimbursement_payments/migration.sql
reviewed_at: 2026-06-25
---

# Search Refund Records Technical Design

## Decision Summary

- decision: ready_for_tdd_implementation_after_review
- route_policy: `/search` owns both tabs; `收支紀錄` and `退款紀錄` remain separate query surfaces.
- contract_policy: use a separate refund-record search action and result type, not a mixed `LedgerRecord | RefundRecord` union.
- data_policy: `ReimbursementPayment` is the refund-record source of truth; linked expenses are loaded through `ReimbursementBatchItem`.
- filter_policy: refund filters are 收款成員, payment date range, and sort only; payment method is displayed and keyword-searchable but not a filter.
- pagination_policy: refund records use cursor pagination with page size 100, matching ordinary record search.
- auth_policy: authenticated household members can browse household refund evidence for this MVP, scoped by household; future stricter role policy can be added without changing UI contracts.
- legacy_policy: reimbursed expenses without payment evidence do not show `查看退款紀錄`.
- schema_policy: existing reimbursement payment schema is sufficient; add cursor-friendly indexes for refund-record search.
- next_gate: TDD Implementation

## Route And Component Boundaries

### `/search` Server Page

`src/app/(app)/search/page.tsx` remains a server component. It continues loading:

- authenticated member/session.
- category and member lookup data.
- `categoriesById` and `memberNames` for list rows and filter options.

It does not preload refund records. Refund records are loaded from a client-triggered server action in the same way ordinary search currently loads ledger pages.

### Search Panel State

`src/app/record-search-panel.tsx` owns tab and page state:

- `activeSurface: "records" | "reimbursements"`.
- existing ledger `query`, loaded ledger records, cursor, total count, and net total.
- refund `paymentQuery`, loaded refund records, cursor, and loading/error state.
- selected ledger record IDs and batch dialogs only for `收支紀錄`.
- selected ledger detail record.
- selected refund detail record.
- selected related-record modal.

Switching tabs:

- closes selected details/modals.
- clears selection mode and selected ledger IDs.
- preserves each tab's own query/filter state.
- does not reset already loaded pages unless the query for that tab changes.

### Search Controls

`src/app/record-search-controls.tsx` keeps one control component with tab-scoped props:

```ts
export type SearchSurface = "records" | "reimbursements";

export type ReimbursementRecordQueryState = {
  dateFrom: string;
  dateTo: string;
  paidToMemberId: string;
  search: string;
  sort: "newest" | "oldest" | "amount_desc" | "amount_asc";
};
```

Use member IDs for `paidToMemberId` in implementation. The prototype used display names only because its data was local. The filter UI still labels the field `收款成員` and renders member display names from `memberNames`.

Mobile close behavior stays in this component:

- tabs and close button share one row.
- close button uses `X` icon and accessible name `關閉搜尋頁`.
- search input row sits below tabs.

### Record List And Detail Components

`src/app/record-list-detail.tsx` keeps `RecordListItem` for ordinary ledger rows and related ledger rows.

`RecordDetailDialog` receives an optional `onOpenReimbursementPayment(record)` callback. It renders `查看退款紀錄` only when:

- the record is an active member-paid expense.
- reimbursement status is `reimbursed`.
- backend readback says payment evidence exists.

No callback means no readback action. Reimbursed legacy expenses without evidence should not fabricate the action.

Refund record rows should be a dedicated display component in `record-search-panel.tsx` or a new small route-local component because they are not `LedgerRecord`s. They should mirror `RecordListItem` information density, but use a refund icon instead of category visual.

## Read Model Design

Create `src/modules/reporting/refund-record-search-query.ts`.

### Query State

```ts
export type RefundRecordSortOrder =
  | "newest"
  | "oldest"
  | "amount_desc"
  | "amount_asc";

export type RefundRecordQueryState = {
  dateFrom: string;
  dateTo: string;
  paidToMemberId: string; // "all" or member id
  search: string;
  sort: RefundRecordSortOrder;
};

export type RefundRecordSearchCursor = {
  id: string;
  paidOn: string;
  amountCents?: number;
};
```

The UI type can either reuse this type directly or re-export it from `record-search-controls.tsx`. Prefer the domain/reporting type as source of truth and import it into the UI.

### Result Shape

```ts
export type RefundRecordSearchResult = {
  id: string;
  reimbursementBatchId: string;
  amountCents: number;
  paidOn: string; // YYYY-MM-DD
  paidToMemberId: string;
  paidToMemberName: string;
  method: "bank_transfer" | "cash" | "other";
  methodLabel: "銀行轉帳" | "現金" | "其他";
  note: string;
  linkedRecordNames: string[];
  primaryLinkedRecordName: string;
  linkedRecords: LedgerRecord[];
};
```

`primaryLinkedRecordName` is the first linked ledger record name by deterministic ordering. The row title uses this value. Detail and related modal can show all linked records.

### Prisma Query

Base `where`:

```ts
{
  householdId,
  ...(query.paidToMemberId !== "all"
    ? { paidToMemberId: query.paidToMemberId }
    : {}),
  ...(payment date range as paidOn gte/lte),
  ...(keyword OR predicates),
}
```

Keyword search includes:

- explicit labels `退款`, `退款紀錄` handled outside Prisma as always-match tokens when search equals those labels.
- paid-to member display name: `paidToMember.displayName contains`.
- payment method label: map Traditional Chinese search text to enum values.
- note/reference: `note contains`.
- linked record name: `reimbursementBatch.items.some.ledgerRecord.name contains`.
- amount: normalized cents exact match.
- paid date: exact `YYYY-MM-DD` or slash-formatted date match by normalizing input and comparing against `paidOn`.

Prisma `where` should avoid unbounded relation includes where possible. Use a select shaped for this read model:

```ts
const refundRecordSelect = {
  id: true,
  reimbursementBatchId: true,
  amountCents: true,
  paidOn: true,
  paidToMemberId: true,
  method: true,
  note: true,
  paidToMember: { select: { displayName: true } },
  reimbursementBatch: {
    select: {
      items: {
        select: {
          ledgerRecord: { select: ledgerRecordSelect },
        },
        orderBy: [
          { ledgerRecord: { occurredOn: "desc" } },
          { ledgerRecord: { id: "desc" } },
        ],
      },
    },
  },
} as const;
```

If Prisma nested `orderBy` cannot express the relation ordering cleanly, load linked records in a second query keyed by batch IDs. Prefer correctness/readability over forcing a complex include.

## Server Action Contracts

Add to `src/app/record-search-actions.ts` or a sibling `src/app/refund-record-search-actions.ts`. Prefer the existing `record-search-actions.ts` file for colocated `/search` server actions, but keep query builders in `src/modules/reporting/refund-record-search-query.ts`.

```ts
export const REFUND_RECORD_PAGE_SIZE = 100;

export type RefundRecordPageRequest = {
  query: RefundRecordQueryState;
  cursor?: RefundRecordSearchCursor | null;
};

export type RefundRecordPageResult =
  | {
      ok: true;
      records: RefundRecordSearchResult[];
      nextCursor: RefundRecordSearchCursor | null;
      totalCount: number;
    }
  | {
      ok: false;
      reason: "load_failed" | "unauthenticated" | "invalid_query";
      message: string;
    };
```

Action name:

```ts
export async function loadRefundRecordSearchPageAction(
  request: RefundRecordPageRequest,
): Promise<RefundRecordPageResult>
```

Implementation:

1. `requireAuthenticatedMember()`.
2. Resolve household ID from session context when available. Current app still uses `DEFAULT_HOUSEHOLD_ID`; do not expand scope in this slice.
3. Build page query and aggregate `where`.
4. Fetch `REFUND_RECORD_PAGE_SIZE + 1` payment rows.
5. Map rows to `RefundRecordSearchResult`.
6. Return cursor from the last returned row.

No mutation action accepts refund record IDs.

## Pagination And Sorting

Refund search uses 100 rows per page to match ledger search.

Sort mapping:

| UI sort | Prisma order |
|---|---|
| `newest` | `paidOn desc`, `id desc` |
| `oldest` | `paidOn asc`, `id asc` |
| `amount_desc` | `amountCents desc`, `paidOn desc`, `id desc` |
| `amount_asc` | `amountCents asc`, `paidOn desc`, `id desc` |

Cursor predicate mirrors the sort:

- newest: `paidOn < cursor.paidOn OR (paidOn = cursor.paidOn AND id < cursor.id)`
- oldest: `paidOn > cursor.paidOn OR (paidOn = cursor.paidOn AND id > cursor.id)`
- amount desc/asc: compare amount first, then `paidOn desc`, then `id desc`.

Use helper functions equivalent to `buildRecordSearchPageQuery`, `cursorFromRecord`, and `orderByForSort`.

## Schema And Indexes

Existing schema has the required `ReimbursementPayment`, `ReimbursementBatch`, and `ReimbursementBatchItem` relations. No new model is needed.

Add migration indexes for refund-record search:

```prisma
@@index([householdId, paidOn, id], map: "ReimbursementPayment_search_paid_on_cursor_idx")
@@index([householdId, paidToMemberId, paidOn, id], map: "ReimbursementPayment_search_member_paid_on_cursor_idx")
@@index([householdId, amountCents, paidOn, id], map: "ReimbursementPayment_search_amount_cursor_idx")
```

Existing `@@index([paidToMemberId, paidOn])` is not enough because all app queries are household-scoped and cursor-stable. Keep existing indexes; adding the above is acceptable for local_dev and future preview readiness.

No index is added for note or linked record name search in this slice. Full-text search remains out of scope. If performance becomes a problem, the learning/release gate can recommend a search document or trigram/full-text index later.

## Authorization And Permission Boundary

Loading `/search` already requires authentication.

Refund record search should call `authorize(actor, { type: "browse_household_records" })` before querying. Current authorization allows all linked household members to browse household records. That matches this MVP unless product later restricts refund payment evidence to finance-capable roles.

Security requirements:

- every refund query includes `householdId`.
- member filter values are treated as IDs, not display names.
- if `paidToMemberId` is not `all`, query only that member ID within the same household.
- cross-household payment rows are never returned.
- direct server-action calls cannot bypass household scoping.

If a stricter policy is later needed, add a new authorization command such as `{ type: "browse_reimbursement_payment_evidence" }`. Do not overload UI tab visibility as a permission check.

## Frontend Data Flow

`RecordSearchPanel` should keep two loading paths:

- `loadRecordSearchPageAction` for `收支紀錄`.
- `loadRefundRecordSearchPageAction` for `退款紀錄`.

When `paymentQuery` changes:

- clear loaded refund records.
- clear refund cursor.
- clear selected refund detail and related modal.
- load the first refund page.

Unlike ledger search, the refund tab may load with an initial empty query. This supports "browse refund records" behavior.

Footer:

- ledger footer remains only for `收支紀錄` with active ledger query.
- no ledger count/net amount footer for `退款紀錄`.

Rows:

- `RefundRecordSearchResultItem` renders refund row.
- `RecordListItem` renders related ledger records.
- related record rows are read-only in the related modal for this slice; clicking them can be a no-op or close/open ordinary detail only if implementation can do so without modal stacking risk. The current acceptance requires display, not nested detail navigation.

## Record Detail Readback

For `收支紀錄` search results, already-reimbursed expenses need to know whether payment evidence exists.

Implement a readback map for loaded ledger records:

```ts
export type LedgerRecordRefundEvidenceSummary = {
  recordId: string;
  refundRecordId: string;
};
```

Options:

1. Include evidence summary in ordinary ledger search results for reimbursed expenses.
2. Add a lazy action `loadRefundRecordByLedgerRecordAction(recordId)` when opening an already-reimbursed detail.

Choose option 2 for implementation simplicity and less payload overhead:

```ts
export async function loadRefundRecordByLedgerRecordAction(
  recordId: string,
): Promise<
  | { ok: true; record: RefundRecordSearchResult | null }
  | { ok: false; reason: "load_failed" | "unauthorized"; message: string }
>
```

`RecordDetailDialog` gets a callback only after the panel has confirmed evidence exists. If the action returns `null`, hide `查看退款紀錄` and keep the normal `已退款` status.

This lazy action must:

- require authentication.
- scope the ledger record and reimbursement payment by household.
- load only if the ledger record is related through `ReimbursementBatchItem`.

## Error, Loading, And Empty States

Refund tab:

- loading first page: reuse existing pending style where possible; if no explicit spinner exists, keep the list area stable.
- load failure: show `退款紀錄載入失敗，請稍後再試。`
- empty: `沒有符合條件的退款紀錄。`
- invalid query: normalize to empty/default filter server-side where possible; otherwise return `invalid_query`.

Related records:

- if a refund record exists but linked records cannot be loaded, show a clear read-only error in the related modal instead of hiding the modal.
- if legacy data violates the expected relation, show `目前找不到關聯紀錄。`

## Tracking And Learning Hooks

No analytics implementation is required in this local_dev slice.

If tracking is introduced later, hook points should be:

- tab switch to `退款紀錄`.
- refund record detail opened.
- related ledger records opened.
- reimbursed expense readback opened.
- empty refund result after search/filter.

Do not add tracking infrastructure in this feature technical design.

## Test Mapping

| Spec Coverage | Implementation Test |
|---|---|
| Refund query is household-scoped and authorized | `src/modules/reporting/refund-record-search-query.test.ts` plus server-action test for household scoping. |
| Keyword matching fields | Unit tests for query builder/search normalization: `退款`, linked record name, 收款成員, payment method label, note, date, amount. |
| 收款成員/date/sort filters | Unit tests for Prisma where/order/cursor builders and at least one integration test with seeded rows. |
| No double count | Existing monthly report tests remain unchanged; add assertion that `ReimbursementPayment` rows are not read by ledger totals. |
| Refund IDs cannot be mutated as ledger IDs | Server action tests for batch delete/refund with refund payment IDs return no eligible ledger records. |
| Tab separation UI | Component or E2E test in `e2e/record-search.spec.ts`. |
| Refund detail read-only modal | E2E test opens refund row and asserts fields/actions. |
| Related records use `RecordListItem` | Component/E2E assertion for related row accessible names and category visual. |
| Reimbursed expense readback | E2E or integration test for `loadRefundRecordByLedgerRecordAction`. |
| Mobile close/tabs layout | E2E mobile viewport checks accessible name `關閉搜尋頁` and no overlap. |

## TDD Implementation Order

1. Add failing unit tests for `refund-record-search-query` query builder, sort/cursor, keyword normalization, and filter mapping.
2. Add server-action tests for `loadRefundRecordSearchPageAction` and `loadRefundRecordByLedgerRecordAction`.
3. Add E2E fixture rows for reimbursement payments and linked expenses.
4. Add E2E tests for tab separation, refund filters, refund detail, related records, reimbursed expense readback, and mobile close layout.
5. Implement `refund-record-search-query`.
6. Implement server actions and result mappers.
7. Replace prototype refund fixture logic in `RecordSearchPanel` with server-loaded refund records.
8. Wire lazy reimbursed-expense readback.
9. Add Prisma migration indexes.
10. Run type-check, lint, unit/integration tests, and targeted E2E.

## Release Target Implications

Release target is `local_dev`.

Local_dev readiness must include:

- Prisma migration for refund search indexes.
- seed or test data containing at least one reimbursement payment.
- successful local type-check/lint/unit tests.
- targeted `/search` E2E evidence for desktop and mobile.

No production secrets, payment integrations, bank sync, external webhooks, or monitoring changes are introduced.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm separate refund search action/read model instead of mixed result union.
  - Confirm `paidToMemberId` is the implementation filter value for `收款成員`.
  - Confirm all household members may browse refund evidence under existing `browse_household_records` permission for MVP.
  - Confirm lazy `loadRefundRecordByLedgerRecordAction` for already-refunded expense readback.
  - Confirm added refund-search indexes are acceptable.
- must_check:
  - No implementation starts until this technical design is approved or explicitly accepted as risk.
  - TDD Implementation must replace prototype fixtures with server-backed refund records.
  - Tests must cover no-double-count and no batch mutation of refund record IDs.
- acceptance_signals:
  - Backend contracts are concrete enough for TDD.
  - Query ownership and permission boundaries are explicit.
  - Remaining risks are release/local_dev verification concerns, not design blockers.
- unresolved_blockers:
  - None for local_dev once reviewer accepts the permission policy.
- next_step:
  - TDD Implementation for `search-reimbursement-payment-records`.
