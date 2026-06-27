---
id: technical-design-refund-page
stage: feature-technical-design
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/refund-page.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/refund-page.md
  - .ai/prototype/refund-page.md
  - .ai/spec/refund-page.md
  - src/modules/reporting/record-search-query.ts
  - src/modules/reporting/reimbursement-payment-search-query.ts
  - src/modules/reimbursement/reimbursement-command.ts
  - src/app/(app)/search/_actions/record-search-actions.ts
  - src/app/_record-detail/record-list-detail.tsx
  - src/app/_record-detail/record-detail-ui.tsx
  - src/app/_record-detail/reimbursement-payment-dialogs.tsx
  - src/app/_record-detail/reimbursement-payment-edit-actions.ts
outputs:
  - route_boundaries
  - shared_month_navigation_design
  - shared_detail_flow_design
  - shared_batch_reimbursement_design
  - read_model_contract
  - action_contract
  - test_mapping
trace_links:
  behavior_spec:
    - .ai/spec/refund-page.md
  prototype:
    - .ai/prototype/refund-page.md
  target_route:
    - /refunds
reviewed_at: 2026-06-27
---

# Refund Page Technical Design

## Decision Summary

- decision: review_for_tdd_implementation
- route: `/refunds`
- server_page_owner: `src/app/(app)/refunds/page.tsx`
- client_panel_owner: `src/app/(app)/refunds/_components/refund-page-panel.tsx`
- read_model_owner: new `src/modules/reporting/refund-page-query.ts`
- server_action_owner: new `src/app/(app)/refunds/_actions/refund-page-actions.ts`
- command_reuse: reuse `batchMarkLedgerRecordsReimbursedInDatabase`
- row/detail_reuse: reuse `RecordSearchResults`, `BatchRefundDialog`, and a cleaned shared record detail flow instead of duplicating dialog state per page
- detail_refactor: extract a deeper shared module for record detail, reimbursement payment detail, linked-record navigation, pending state, and refresh/mutation callbacks before wiring the real refund page
- batch_refactor: extract shared batch reimbursement UI/action helpers so search and refunds do not each own eligibility, payment-form parsing, and error-message mapping
- latest_main_rebase: latest `main` already includes refund-record evidence editing; the shared detail flow must preserve `canEditReimbursementPayments` and `onUpdated` behavior for `ReimbursementPaymentDetailDialog`
- navigation_reuse: keep `mobileVisible: false` metadata on `退款`
- month_navigation_refactor: make month switcher/picker route-aware instead of hard-coding the dashboard form action
- month_policy: unpaid expenses use `occurredOn`; refund records use reimbursement payment `paidOn`
- pagination_policy: initial implementation loads all month-scoped refund-page rows for the selected month; pagination can be introduced later if this becomes large
- next_gate: TDD Implementation

## Current Prototype To Replace

`src/app/(app)/refunds/_components/refund-page-prototype.tsx` is a production-stack prototype with fixture data. TDD Implementation should replace it with a real panel component and remove or retire the prototype fixture arrays.

Keep these prototype decisions:

- `/refunds` route and month switcher.
- `全部` plus member tabs.
- Desktop two-column sections and mobile stacked sections.
- Independent list scrolling.
- Shared search summary style with fit-content width.
- Reused search rows, batch refund dialog, record detail dialog, refund record detail dialog, and linked-record dialog.

Replace these prototype-only details:

- Hard-coded members, categories, unpaid expenses, and refund records.
- Prototype actors for detail/batch actions.
- Client-only batch refund completion that only clears state.

## Shared Record Detail Flow Refactor

The refund page must not add a third copy of the record-detail dialog orchestration. After rebasing to latest `main`, the same detail flow knowledge is spread across:

- `RecordListDetail` for the home dashboard list.
- `RecordSearchPanel` for search results and reimbursement payment search results.
- `RefundPagePrototype` for unpaid rows and refund record rows.

The repeated knowledge is not just markup. Each caller currently needs to know how to:

- track a selected ledger record and a related ledger record opened from a payment.
- track reimbursement payment detail and linked-record detail.
- avoid closing the dialog while a detail mutation is pending.
- refresh the current data source after edit/delete/refund.
- load a reimbursement payment for an already reimbursed ledger record.
- keep the same detail actions visible based on the authenticated actor.
- pass refund-record edit permission into `ReimbursementPaymentDetailDialog`.
- refresh route data and replace local payment detail state when a refund record is edited.

### Target module

Create or reorganize under `src/app/_record-detail/` so callers depend on one deeper module interface:

- `RecordDetailFlowDialogs` owns the dialog stack for ledger detail, reimbursement payment detail, and linked records.
- `useRecordDetailFlow` owns selected record/payment state and exposes a small interface:
  - `openRecord(recordOrId)`
  - `openRelatedRecord(record)`
  - `openPayment(result)`
  - `updatePayment(result)`
  - `dialogs`
  - optional focus-restore adapter for list rows that need it.
- `RecordDetailDialog` remains the public ledger detail dialog, but its edit/delete/refund modes should live in dedicated modules or internal functions instead of staying buried in `record-list-detail.tsx`.
- `RecordListDetail` becomes a list adapter plus the shared detail flow, not the owner of generic detail behavior.

This keeps the external interface small while concentrating the implementation. The deletion test should pass: if this module is deleted, dialog-flow complexity would reappear in home, search, and refunds.

### Responsibilities

Shared detail flow owns:

- opening and closing ledger record detail.
- opening reimbursement payment detail.
- opening linked records from a reimbursement payment.
- transitioning from linked record back to ledger record detail.
- pending-state protection while edit/delete/refund is submitting.
- refresh and mutation-success callbacks.
- actor/category/member wiring for existing detail actions.
- refund-record edit permission wiring.
- reimbursement payment `onUpdated` handling after payment date, method, or note changes.

Callers own:

- which rows are visible.
- route-specific read model and filters.
- route-specific refresh adapter:
  - home: `router.refresh`.
  - search: `reloadCurrentQuery`.
  - refunds: `router.refresh` or local `refreshRefundPageData` adapter.
- route-specific authorization adapter for editing reimbursement payment evidence:
  - search currently passes `authorize(session.access.member, { type: "edit_reimbursement_payment" }).allowed`.
  - home currently derives from actor role through `canEditReimbursementPayments(actor)`.
  - refunds should use the same authorization policy as search, not a route-local role shortcut.
- route-specific action dialogs outside record detail, such as batch delete or batch refund footers.

### Public behavior to preserve

- Existing record detail action buttons still appear where the actor is allowed:
  - 編輯
  - 刪除
  - 退款
  - 查看退款紀錄
- Existing blocked state for reimbursed expenses remains unchanged.
- Payment detail still opens linked records.
- Payment detail still supports editing payment date, method, and note when `canEditReimbursementPayments` is true.
- Editing a refund record updates the open payment detail state and refreshes the route data without changing amount, paid-to member, paid-from source, reimbursement batch, linked records, or ledger totals.
- Linked records still open the existing ledger record detail dialog.
- Search page and home dashboard behavior must not regress while refund page is implemented.

### Implementation shape

Recommended file organization:

- `src/app/_record-detail/record-detail-flow.tsx`
  - shared dialog-flow module and hook.
- `src/app/_record-detail/record-detail-dialog.tsx`
  - ledger detail public dialog entrypoint.
- `src/app/_record-detail/record-detail-actions.ts`
  - `recordActionAccess` and action visibility helpers.
- `src/app/_record-detail/record-edit-dialog.tsx`
  - edit mode.
- `src/app/_record-detail/record-delete-dialog.tsx`
  - delete mode.
- `src/app/_record-detail/record-reimbursement-dialog.tsx`
  - single-record reimbursement mode.
- `src/app/_record-detail/record-list-detail.tsx`
  - home list adapter that delegates detail flow.
- Keep `src/app/_record-detail/reimbursement-payment-dialogs.tsx` as the public payment detail/edit/linked-record UI module unless the implementation proves a smaller split is necessary.

This can be introduced incrementally. TDD Implementation may keep compatibility exports from `record-list-detail.tsx` during migration, but new refund-page code should import the shared detail-flow module directly.

### Refactor constraints

- Do not change server action semantics while extracting modules.
- Do not duplicate `RecordDetailDialog` for refund page.
- Do not add route-specific conditionals inside shared detail flow except through explicit adapters/callbacks.
- Do not hide edit/delete/refund buttons in refund page by using a weaker prototype actor or a read-only detail variant.
- Do not drop refund-record edit support introduced on latest `main`.
- Do not derive refund-record edit permission in the refund page from UI role checks if the route has access to the authorization policy.
- Keep Traditional Chinese labels unchanged unless a test or reviewed copy change requires it.

## Shared Refund Record Dialog Cleanup

`ReimbursementPaymentDetailDialog` now owns both readback and edit behavior for refund records. The refund page should use this same module through the shared detail flow, but the module should be reviewed while extracting the flow because it now carries several responsibilities:

- display payment evidence fields.
- open linked reimbursed ledger records.
- guard and render refund-record edit UI.
- submit `editReimbursementPaymentFormAction`.
- keep a local updated payment result after edit.
- notify callers through `onUpdated`.

Target cleanup:

- Keep the public dialog interface explicit:
  - `result`
  - `canEdit`
  - `onOpenLinkedRecords`
  - `onUpdated`
- Move any reusable permission decision out of route components:
  - route/server code should authorize `edit_reimbursement_payment`.
  - UI helpers may only adapt an already-authorized boolean.
- Keep edit evidence invariants in the existing command/action path, not in the dialog:
  - editable: `paidOn`, `method`, `note`.
  - immutable: amount, paid-to member, paid-from source, reimbursement batch, linked records, reimbursed state.
- Ensure local dialog state does not become the source of truth:
  - after edit success, update displayed dialog state for immediate feedback.
  - also call the route refresh adapter so list/search/refund-page summaries reload.
- If the dialog grows further, split internal edit form UI into a private module, but keep the external payment-detail interface stable.

Tests should prove:

- `編輯` is hidden when `canEdit` is false.
- edit success updates displayed date/method/note and calls `onUpdated`.
- edit failure keeps the dialog open and shows the returned Traditional Chinese error.
- `查看關聯紀錄` still works after an edit.

## Shared Batch Reimbursement Refactor

The refund page and search page need the same batch reimbursement behavior, but with route-specific refresh/revalidation. Current search code spreads this across:

- `BatchRefundDialog` for UI eligibility, selected/skipped counts, single-paid-to-member warning, and `FormData` extraction.
- `record-search-batch-utils.ts` for client-side eligibility helpers.
- `RecordSearchPanel` for transforming `FormData` into a payment input and handling toast/reset/reload.
- `batchRefundSearchRecordsAction` for server-side authentication, command call, payment error mapping, and `revalidatePath`.

The target module should be deeper: callers should provide selected records and a submit adapter, not reimplement payment parsing and eligibility rules.

### Target module shape

Recommended organization:

- `src/app/_reimbursement/batch-refund-dialog.tsx`
  - shared dialog UI currently owned by search.
- `src/app/_reimbursement/batch-refund-client.ts`
  - `getBatchRefundDialogState(actor, records)` for eligible records, skipped count, total, paid-to member consistency, and disabled reason.
  - `readBatchRefundPaymentFormData(formData)` for `method`, `paidOn`, and `note`.
- `src/app/_reimbursement/batch-refund-action-result.ts`
  - shared result type and message mapping helpers for payment evidence and batch reimbursement failures.
- `src/app/(app)/search/_actions/record-search-actions.ts`
  - keeps route-owned search action wrapper and revalidates `/` and `/search`.
- `src/app/(app)/refunds/_actions/refund-page-actions.ts`
  - route-owned refund action wrapper and revalidates `/`, `/search`, and `/refunds`.

This keeps the reimbursement command as the server source of truth while removing page-level duplication.

### Responsibilities

Shared batch reimbursement UI owns:

- count of eligible records.
- skipped count.
- refund total.
- same-paid-to-member warning.
- payment fields.
- disabled state for confirm.
- exact button/copy behavior.

Shared client helper owns:

- client-side eligibility preview for UI only.
- extracting payment form values with the field names used by `ReimbursementPaymentFields`.

Shared server helper owns:

- mapping `ReimbursementPaymentEvidenceRejectionReason` to user-facing messages.
- mapping batch reimbursement command errors to user-facing messages.
- returning a common result shape used by search and refund-page actions.

Route wrappers own:

- authentication.
- route-specific revalidation.
- route-specific success side effects in the panel.

### Refactor constraints

- Client-side eligibility remains preview only; the reimbursement command still revalidates household, actor, record status, reimbursement status, and same-paid-to-member policy.
- Do not import the search route action into the refund page.
- Do not fork `BatchRefundDialog` for the refund page.
- Do not silently change the existing cross-member selection behavior.
- Keep `requireSinglePayerMember: true` unless a later domain decision introduces split payments.

## Shared Month Navigation Refactor

`MonthSwitcher` is now used by both the home dashboard and `/refunds`. It already accepts `hrefPath` for the previous/next links, but `MonthPickerDialog` still submits its custom month form to `/`. That means the arrow buttons can stay on `/refunds`, while the custom month picker can accidentally navigate back to the dashboard.

This should be cleaned up before wiring the real refund page.

### Target module behavior

Keep one shared month navigation module under `src/app/`:

- `month-selection.ts`
  - month parsing, validation, formatting, and month arithmetic.
- `month-switcher.tsx`
  - previous/next links and picker trigger.
- `month-picker-dialog.tsx`
  - custom month picker form.

Required interface updates:

- `MonthSwitcher` should accept a route-aware target:
  - keep `hrefPath?: string` for the current code path, or replace it with a clearer `basePath`.
  - pass that target into `MonthPickerDialog`.
- `MonthPickerDialog` should accept the same route target and use it as the form action.
- Month query name remains `month`.
- Previous/next links and the custom picker must produce the same target route.

### Current bug to cover

- On `/refunds`, opening the custom month picker and applying a month must submit to `/refunds?month=YYYY-MM`, not `/?month=YYYY-MM`.

### Constraints

- Do not fork a refund-page-only month switcher.
- Do not hard-code `/refunds` inside `MonthPickerDialog`.
- Do not rename user-facing copy unless the design explicitly asks for it.
- The dialog description currently says `月報`; if reused on `/refunds`, either make the description generic (`目前查看 YYYY 年 M 月。`) or allow a context label prop. Prefer generic copy to keep the interface small.
- Preserve existing home dashboard URLs.

### Tests

Update or add tests for:

- `buildMonthHref` or equivalent helper preserves dashboard default route.
- previous/next links on `hrefPath="/refunds"` target `/refunds?month=...`.
- custom picker form action uses `/refunds` when called from refunds.
- invalid/missing month fallback remains unchanged.

## Route And Component Boundaries

### `src/app/(app)/refunds/page.tsx`

Responsibilities:

- Require authenticated household access through the same app-shell data path used by adjacent authenticated pages.
- Read `month` from search params.
- If missing, use a deterministic default month. Use the current local month in `Asia/Taipei` only if an existing app helper already supports that; otherwise use the same default policy used by the home dashboard.
- Load refund-page data from `loadRefundPageInDatabase`.
- Render:
  - `PageLayout` with `contentClassName="md:h-full md:min-h-0"`.
  - `PageHeader` title `退款`.
  - `MonthSwitcher currentMonth={month} hrefPath="/refunds"`.
  - `RefundPagePanel` with actor profile, members, categories, categoriesById, memberNames, month, initial active scope, summary/list payload.

Non-responsibilities:

- No route-local fixture data.
- No direct Prisma querying in the React component body except through the reporting data-source function.

### `RefundPagePanel`

Suggested path: `src/app/(app)/refunds/_components/refund-page-panel.tsx`

Responsibilities:

- Own client state:
  - active member scope tab.
  - selection mode.
  - selected unpaid ledger record IDs.
  - batch refund dialog open state.
- Use shared record detail flow for selected unpaid detail, refund payment detail, linked records, pending state, and refresh after detail mutations.
- Pass the same reimbursement-payment edit permission policy used by search into the shared detail flow.
- Derive active scope data from server-loaded payload, or receive already-grouped data and select by scope.
- Render tabs, summaries, unpaid list, refund record list, dialogs, and batch dialog.
- Call `batchRefundFromRefundPageAction` on batch confirm.
- On success:
  - show `已完成批次退款` toast using existing message style.
  - clear selection.
  - exit selection mode.
  - close dialog.
  - refresh route data.
- On failure:
  - show returned Traditional Chinese error message.

Non-responsibilities:

- Do not calculate persistence-backed eligibility as security.
- Do not mutate records client-side as source of truth.
- Do not implement custom detail or batch dialogs.

## Reporting Read Model Contract

Add `src/modules/reporting/refund-page-query.ts`.

### Types

```ts
export type RefundPageMemberScope = {
  id: "all" | string;
  name: string;
};

export type RefundPageScopeData = {
  scopeId: "all" | string;
  unpaidCount: number;
  unpaidAmountCents: number;
  refundedCount: number;
  refundedAmountCents: number;
  unpaidRecords: LedgerRecord[];
  refundRecords: ReimbursementPaymentSearchResult[];
};

export type RefundPageResult = {
  month: string;
  scopes: RefundPageMemberScope[];
  categories: Category[];
  categoriesById: Record<string, Category>;
  memberNames: Record<string, string>;
  scopeData: Record<string, RefundPageScopeData>;
};
```

### Database loader

```ts
export async function loadRefundPageInDatabase(input: {
  prisma: PrismaClient;
  householdId: string;
  month: string;
}): Promise<RefundPageResult>
```

Data sources:

- Active household members ordered by display name.
- Household categories ordered consistently with dashboard/search.
- Unpaid ledger records:
  - `householdId`.
  - `status: "active"`.
  - `type: "expense"`.
  - `paymentSource: "member"`.
  - `reimbursementStatus: "refundable"`.
  - `occurredOn` within selected month.
  - order newest first, then id descending unless UX decides oldest; match search row expectations where feasible.
- Refund records:
  - `householdId`.
  - `paidOn` within selected month.
  - include reimbursement batch items and linked ledger records using `reimbursementPaymentSelect`.
  - order newest payment first, then id descending.

Scope assembly:

- `all` scope includes all unpaid records and all refund records.
- Member scopes include:
  - unpaid records where expense `payerMemberId` equals member id.
  - refund records where `paidToMemberId` equals member id.
- Summary values are derived from the records in the scope.
- Refund records are reimbursement payment evidence only; do not include them in ordinary ledger totals.

Why not reuse search query directly:

- `record-search-query` can express the unpaid filter but is query/search oriented and paginated.
- `reimbursement-payment-search-query` can express paid date and paid-to member filtering but is query/search oriented and paginated.
- The refund page needs all scopes and both lists at once for a single selected month. A dedicated read model keeps the UI simple and makes unit tests direct.

Acceptable reuse:

- Reuse `prismaLedgerRecordSelect`, `mapPrismaLedgerRecordToLedgerRecord`, `reimbursementPaymentSelect`, and `mapReimbursementPaymentSearchResult`.
- Reuse category/member mapping helpers where already available; extract small shared mappers from `home-dashboard-data-source.ts` only if duplication becomes meaningful.

## Server Action Contract

Add `src/app/(app)/refunds/_actions/refund-page-actions.ts`.

```ts
export async function batchRefundFromRefundPageAction(input: {
  recordIds: string[];
  payment: {
    method?: string | null;
    paidOn?: string | null;
    note?: string | null;
  };
}): Promise<BatchSearchRecordActionResult>
```

Implementation:

- Reuse `requireAuthenticatedMember`.
- Deduplicate record IDs.
- Reject empty selection with `請先選取要退款的紀錄。`.
- Call `batchMarkLedgerRecordsReimbursedInDatabase` with:
  - authenticated actor.
  - `{ selectedRecordIds, requireSinglePayerMember: true }`.
  - `householdId` from session.
  - payment evidence from input.
- Reuse existing error message functions from search action by extracting shared helpers if necessary.
- On success, `revalidatePath("/")`, `revalidatePath("/search")`, and `revalidatePath("/refunds")`.
- Return the same result shape as `BatchSearchRecordActionResult` to keep `BatchRefundDialog` integration familiar.

Do not import the search route action directly into refund page UI if that keeps revalidation wrong. Share lower-level helpers instead.

## Authorization And Permissions

- Route read access uses `browse_household_records`.
- Desktop navigation visibility can continue to use `accessHints.navigation.canOpenReports`.
- Mobile bottom tab omission stays presentation metadata only.
- Batch mutation authority is enforced by `batchMarkLedgerRecordsReimbursedInDatabase` and `authorize(... perform_reimbursement)`.
- Detail dialog actions use the authenticated actor profile, not a prototype actor.
- The UI may hide/disable actions based on actor access, but server checks are authoritative.

## UI State And Data Flow

1. Server page loads `RefundPageResult`.
2. Client panel stores `scope` state; default is `all`.
3. Active scope data is read from `result.scopeData[scope]`.
4. Selection state stores unpaid ledger record IDs only.
5. Changing scope clears selection and closes selection mode.
6. `selectedLedgerRecords` is derived from active unpaid records and selected IDs.
7. `BatchRefundDialog` receives the authenticated actor and selected ledger records.
8. `onConfirm` calls `batchRefundFromRefundPageAction`.
9. Successful action clears client state and refreshes server data.

Empty states:

- Unpaid list: `沒有未退款支出紀錄。`
- Refund record list: `沒有退款紀錄。`
- If every list is empty, still show tabs and section summaries with zero totals.

Loading/error:

- Initial route loading can rely on app route suspense/loading conventions if present; no new loading skeleton is required for MVP.
- Server action errors surface through toast.
- Read model load errors should let the route error boundary handle unexpected failures; no custom fallback required for MVP.

## Route And Navigation Details

- Keep `/refunds`.
- Keep `MonthSwitcher hrefPath="/refunds"`.
- Make the custom month picker submit to the same route as the switcher arrows.
- `dashboard-navigation.ts` keeps `退款` after `搜尋` and before `設定`.
- `AppNavigationItem.mobileVisible?: boolean` remains the explicit per-surface metadata.
- `AuthenticatedMobileNav` continues to filter out `mobileVisible === false`.
- `/reimbursements` behavior is not changed in this slice unless implementation discovers an existing route conflict. If needed, prefer default 404 over redirect to avoid surprising old artifacts.

## Component Reuse Decisions

Use existing:

- `RecordSearchResults` for both unpaid ledger rows and refund payment rows.
- `SearchSummaryContent` for section summaries.
- Shared `MonthSwitcher` and `MonthPickerDialog` after route-aware cleanup.
- Shared `BatchRefundDialog` for batch confirmation and payment fields.
- Shared batch refund helpers for eligibility preview, payment form parsing, and action result messages.
- Shared record detail flow for unpaid and related ledger records.
- Shared reimbursement payment detail and linked-record dialogs through the detail flow.
- Existing reimbursement payment edit dialog and edit action through `ReimbursementPaymentDetailDialog`.

Allowed extension:

- `SearchSummaryContent` may keep the optional `className` added by the prototype to support fit-content summaries.
- If `RecordSearchResults` lacks a needed layout prop, add narrowly scoped className/slot props rather than forking row markup.
- If existing record-detail files are too coupled, split them into smaller internal modules while keeping compatibility exports for existing callers during migration.
- If `canEditReimbursementPayments` remains needed in multiple places, extract it to a shared authorization/view helper instead of duplicating a role check in each caller.
- If search-owned batch refund helpers are needed by refunds, move them to a neutral `_reimbursement` or `_record-actions` module instead of importing through the search route tree.

Do not create:

- Custom refund-page month switcher.
- Custom refund-page row components.
- Custom refund-page batch refund dialog.
- Custom refund-page record detail dialog.
- Custom refund-page refund record detail dialog.
- A second route-local copy of the record/payment/linked dialog state machine.
- A route-local copy of batch refund dialog or payment-form parsing.
- A route-local copy of batch reimbursement error-message mapping.

## Tests To Write First

### Characterization: shared record detail flow

Before replacing the prototype with real data, add regression coverage around the extracted detail flow.

Cases:

- actor with permission sees eligible edit/delete/refund buttons.
- reimbursed member-paid expense shows blocked state but still allows `查看退款紀錄`.
- opening payment detail can open linked records.
- opening a linked record transitions back to ledger record detail.
- payment detail shows `編輯` only when the caller passes reimbursement-payment edit permission.
- editing a refund record updates open payment detail state and calls the refresh adapter.
- close is ignored while the selected record detail is pending.
- mutation success calls the route refresh adapter exactly once.

### Characterization: refund record dialog

Cases:

- payment detail renders amount, paid-to member, paid date, method, and note.
- `查看關聯紀錄` opens linked records.
- `編輯` visibility follows `canEdit`.
- successful edit updates displayed payment evidence and calls `onUpdated`.
- failed edit keeps the edit dialog open and surfaces the server message.

### Characterization: batch reimbursement flow

Cases:

- eligible selected records show process count, skipped count, and refund total.
- ineligible selected records are skipped in the dialog preview.
- cross-member eligible selection disables confirmation and shows warning.
- missing payment date/method maps to existing Traditional Chinese messages.
- search action still revalidates `/` and `/search`.
- refund-page action revalidates `/`, `/search`, and `/refunds`.

### Characterization: month navigation

Cases:

- dashboard month switcher still links to `/?month=YYYY-MM`.
- refund page month switcher arrows link to `/refunds?month=YYYY-MM`.
- refund page custom month picker submits to `/refunds`.
- month picker accessible description no longer says `月報` when used as a generic month control.

### Unit: Reporting read model

File: `src/modules/reporting/refund-page-query.test.ts`

Cases:

- builds `all` and member scopes.
- unpaid records are active member-paid refundable expenses by `occurredOn` month.
- refund records are reimbursement payment evidence by `paidOn` month.
- unpaid count/amount and refunded count/amount are correct.
- fund-paid, income, voided, already reimbursed, and out-of-month records are excluded from unpaid list.
- refund record totals do not alter ordinary monthly report totals.

### Integration/server action

File: `src/app/(app)/refunds/_actions/refund-page-actions.test.ts`

Cases:

- empty selection returns `empty_selection`.
- missing payment method/date returns validation error.
- same-member eligible records call settlement and return processed/skipped counts.
- cross-member selection returns `cross_member_batch`.
- unauthorized actor cannot reimburse.
- successful action revalidates `/`, `/search`, and `/refunds`.

### Component tests

Use existing testing stack if component tests are already present; otherwise keep this as E2E coverage unless adding component test foundation is cheap.

Cases:

- summaries use `未退款`, `已選取`, `已退款`, `總額`.
- selection mode clears on tab change.
- `BatchRefundDialog` receives selected records only.
- refund page uses shared detail flow open handlers instead of route-local detail dialog state.
- refund page uses shared batch refund dialog/helpers instead of route-local payment parsing.

### Navigation tests

Update existing:

- `src/app/dashboard-navigation.test.ts`: desktop item order includes `搜尋` then `退款`.
- `src/components/layout/mobile-navigation-order.test.ts`: mobile ordered items omit `退款`.

### E2E

Add `e2e/refund-page.spec.ts` or extend existing dashboard/search specs only if cohesion is better.

Cover:

- desktop sidebar opens `/refunds`.
- home `前往退款` links to `/refunds?month=YYYY-MM`.
- mobile bottom tabs omit `退款`.
- month switcher route stays `/refunds`.
- custom month picker on `/refunds` stays on `/refunds`.
- member tab filters rows and summaries.
- selection mode summary and selected total.
- batch refund dialog same-member and cross-member warning.
- unpaid detail opens existing record detail with eligible actions.
- refund record detail opens linked records and related record detail.
- refund record detail preserves edit behavior from search when the actor can edit reimbursement payment evidence.

## Data And Fixture Plan

- Extend E2E seed data rather than hard-coding UI fixtures.
- Required seed rows:
  - active members Lin, Wu, Chen or equivalent stable display names.
  - active categories used by unpaid expenses.
  - active member-paid refundable expenses in `2026-06` across at least two members.
  - completed reimbursement batch/payment rows in `2026-06` across at least two paid-to members.
  - one refund payment linked to multiple ledger records.
  - at least one cross-member unpaid selection case.
- Prefer creating reimbursement payment rows through existing reimbursement command helpers in seed SQL/scripts if practical; direct seed SQL is acceptable for E2E fixtures when schema constraints are clear.

## Implementation Sequence For TDD

1. Add characterization tests for current month switcher/picker routing on home and refunds.
2. Fix shared month navigation so arrows and custom picker use the same route target.
3. Add characterization tests for current record detail actions, reimbursement-payment linked-record flow, and refund-record edit behavior from latest `main`.
4. Add characterization tests for current batch refund dialog/action behavior from search.
5. Extract shared record detail flow and split record-detail internals enough to remove duplicated page-level dialog orchestration.
6. Migrate search page detail/payment/linked dialogs to the shared flow under the characterization tests, preserving `canEditReimbursementPayments` and `onUpdated`.
7. Keep or update `RecordListDetail` as a home-dashboard adapter backed by the shared flow, preserving route refresh after reimbursement payment edits.
8. Move batch refund dialog/helpers out of the search route tree and keep search behavior unchanged under tests.
9. Add failing reporting read-model tests.
10. Implement `refund-page-query.ts` with Prisma loader and pure scope assembly helpers.
11. Add failing refund-page action tests using shared batch reimbursement result/message helpers.
12. Implement `batchRefundFromRefundPageAction` using existing reimbursement command and refund-page revalidation.
13. Replace prototype fixture component with `RefundPagePanel` consuming server data, shared month navigation, shared detail flow, and shared batch refund flow.
14. Wire `/refunds/page.tsx` to authenticated session and read model.
15. Preserve and update navigation/home/month switcher tests.
16. Add E2E coverage.
17. Remove prototype-only fixture arrays/types if no longer used.
18. Run `corepack pnpm type-check`, `corepack pnpm lint`, targeted unit tests, and targeted E2E.

## Release Target Implications

- Target remains `local_dev`.
- No Prisma schema migration is expected if existing reimbursement payment tables already support the read model.
- If implementation discovers missing indexes, add an explicit migration only after updating this design or recording accepted risk.
- Local_dev readiness must include desktop and mobile navigation smoke checks.
- Production deployment is out of scope for this slice.

## Open Questions For Review

- Should the default month on `/refunds` mirror home dashboard month exactly, or always use current `Asia/Taipei` month?
- Should disabled members with historical unpaid/refund records appear as member tabs? Recommended: active members only for MVP, with historical disabled-member handling deferred unless data demands it.
- Should `/refunds` load all month rows, or implement 100-row pagination immediately? Recommended: load all month-scoped rows for MVP and revisit if performance evidence appears.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm dedicated `refund-page-query.ts` is preferred over composing search actions in the UI.
  - Confirm `/refunds` owns its own batch refund action mainly to revalidate `/refunds`.
  - Confirm load-all-month rows is acceptable for MVP.
  - Confirm active-member tabs only are acceptable for TDD.
  - Confirm month switcher/picker should stay as one shared route-aware module.
  - Confirm shared record detail flow refactor is in scope before real refund-page wiring.
  - Confirm refund page should use the same `edit_reimbursement_payment` authorization policy as search for refund-record edit visibility.
  - Confirm shared batch reimbursement cleanup is in scope before real refund-page wiring.
- must_check:
  - TDD Implementation must fix the custom month picker form target before real refund-page wiring.
  - TDD Implementation must characterize current record detail behavior before extracting shared modules.
  - TDD Implementation must characterize current refund-record edit behavior before extracting shared payment detail flow.
  - TDD Implementation must characterize current batch refund behavior before moving it out of the search route tree.
  - TDD Implementation must start with failing tests for read model and server action.
  - Implementation must remove prototype fixture data, not layer real data beside it.
  - Existing search reimbursement and batch refund behavior must remain unchanged.
  - Existing refund-record edit behavior must remain unchanged after shared-flow extraction.
  - Existing search batch refund behavior must remain unchanged after shared batch helper extraction.
  - Detail action buttons must continue to show according to authenticated actor permissions.
- acceptance_signals:
  - The design maps every spec AC to a route, read model, action, UI state, or test.
  - Search, home, and refund page can open record/payment/linked details through the same shared detail flow.
  - Home and refund page use the same month navigation module without route-specific forks.
  - No schema migration is required for the first implementation pass.
  - The next gate can implement through tests without revisiting product behavior.
- unresolved_blockers:
  - None blocking TDD if review accepts default-month and load-all-month policies.
- next_step:
  - TDD Implementation for `refund-page`.
