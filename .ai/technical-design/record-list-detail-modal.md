---
id: record-list-detail-modal
stage: feature-technical-design
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-list-detail-modal.md
  - .ai/prototype/record-list-detail-modal.md
  - .ai/spec/record-list-detail-modal.md
  - .ai/domain/home-family-fund.md
  - .ai/foundation-architecture/home-family-fund.md
  - src/app/(app)/page.tsx
  - src/app/record-list-detail.tsx
  - src/app/record-category-label.tsx
  - e2e/dashboard.spec.ts
outputs:
  - route_boundaries
  - component_contracts
  - state_data_ownership
  - test_mapping
trace_links:
  intent:
    - .ai/intent/record-list-detail-modal.md
  prototype:
    - .ai/prototype/record-list-detail-modal.md
  spec:
    - .ai/spec/record-list-detail-modal.md
  implementation_candidates:
    - src/app/(app)/page.tsx
    - src/app/record-list-detail.tsx
    - src/app/record-category-label.tsx
    - src/app/record-entry-panel.tsx
    - src/app/create-record-dialog.tsx
  e2e_candidates:
    - e2e/dashboard.spec.ts
reviewed_at: 2026-06-20
---

# Record List Detail Modal Technical Design

## Decision Summary

- decision: awaiting_approval
- next_gate: TDD Implementation
- reason: Behavior is specified and prototype code exists. This design locks component ownership, prop contracts, helper ownership, E2E locations, and verification commands before implementation/test hardening.

## Route And Layout Boundary

- route: `/`
- route owner: `src/app/(app)/page.tsx`
- selected month: still resolved by `loadMonthlyWorkspaceContext({ searchParams })`.
- records surface:
  - homepage filters `dashboardData.records` by selected month.
  - homepage keeps `recentRecords = monthRecords.slice(-5).reverse()`.
  - homepage owns the records section `aria-label="紀錄"` and the full-height `Card`.
  - `RecordListDetail` must not render or own the outer `Card`.
- responsive layout:
  - homepage keeps large dashboard arrangement at Tailwind default `lg`.
  - `xl` keeps the wider desktop ratio.
  - no custom media query or arbitrary breakpoint is needed.

## Component Boundary

| Component | File | Owner Responsibilities | Non-Responsibilities |
|---|---|---|---|
| `HomePage` | `src/app/(app)/page.tsx` | Load data, derive selected-month records, build plain serializable category/member lookup objects, own dashboard/card layout. | Dialog state, record item markup, record detail rendering. |
| `RecordListDetail` | `src/app/record-list-detail.tsx` | Client state for selected record id, item list, empty state, read-only detail dialog, formatting helpers unless extracted. | Data loading, outer card, route state, mutation commands. |
| `RecordListItem` | `src/app/record-list-detail.tsx` | Native full-row button with accessible name and `Item` primitive structure. | Dialog content, data fetching, table semantics. |
| `RecordCategoryLabel` | `src/app/record-category-label.tsx` | Circular icon plus category label, rendered inside `ItemMedia`. | Fixed column sizing, record type logic, click behavior. |
| `RecordDetailDialog` | `src/app/record-list-detail.tsx` | Read-only selected-record details, no `DialogDescription`, no footer action row. | Editing, deleting, correcting, settlement, create actions. |
| `RecordEntryPanel` / `CreateRecordDialog` | `src/app/record-entry-panel.tsx`, `src/app/create-record-dialog.tsx` | Keep create copy aligned by labeling the member/source field as `支付者`. | Record-list detail state or display logic. |

## Data Contract

`RecordListDetail` props:

```ts
type RecordListDetailProps = {
  categoryNames: Record<string, string>;
  memberNames: Record<string, string>;
  records: LedgerRecord[];
};
```

- `categoryNames` and `memberNames` are plain objects, not `Map`, because `RecordListDetail` is a client component.
- `records` uses the existing `LedgerRecord` union from `src/modules/fund-ledger/ledger-records.ts`.
- Missing category names fall back to `record.categoryId`.
- Missing member names fall back to `成員`.
- No new API, Prisma select, schema migration, server action, or route contract is required.

## State Ownership

- selected record id is local React state in `RecordListDetail`.
- opening a record detail sets `selectedRecordId`.
- closing the dialog clears `selectedRecordId`.
- URL/search params are not changed by detail open/close.
- selected month remains owned by route/search param handling in the homepage context.

## Helper Ownership

Keep helpers local to `src/app/record-list-detail.tsx` for TDD unless tests or reuse prove extraction is needed:

- `formatAmount(amountCents)`: absolute TWD currency value with no explicit plus/minus sign.
- `formatDate(date)`: string-only `YYYY-MM-DD` to `YYYY/MM/DD` replacement, avoiding timezone parsing.
- `recordActorLabel(record, memberNames)`: income/member-paid returns member display name or `成員`; fund-paid returns `基金`.
- `ledgerRecordStatusLabel(record)`: income returns `---`; expense maps reimbursement status labels.

Extraction trigger:
- If unit tests are chosen for helper behavior, extract helpers to a small module such as `src/app/record-list-detail-formatters.ts`.
- Otherwise, cover helpers through E2E and keep code colocated.

## UI Semantics

- Use `Item` with `asChild` around a native `button`.
- Use `ItemMedia` for `RecordCategoryLabel`.
- Use first `ItemContent` for name and payer.
- Use second right-aligned `ItemContent` for amount and date.
- Do not use `ItemActions` for amount/date.
- Do not render `ChevronRight`.
- Do not render table elements for the records list.
- Dialog:
  - title is record name.
  - no `DialogDescription`.
  - no footer action row.
  - built-in close control remains from shared dialog primitive.

## Error, Empty, And Loading Strategy

- empty selected month: parent card remains visible and `RecordListDetail` renders centered `這個月份尚無紀錄。`.
- loading: no new client loading state; homepage remains server-rendered through existing app route behavior.
- error: no new error boundary; existing route/app error behavior applies.
- missing lookup data: use defined fallbacks instead of throwing.

## Auth And Permission Boundary

- no new auth or permission checks.
- homepage data remains available only after existing authenticated app layout/current-member guards.
- UI remains read-only; server-side ledger authorization remains unchanged.

## E2E Mapping

Primary E2E target: update `e2e/dashboard.spec.ts`.

Recommended tests:

1. `renders record list items and opens detail dialog`
   - auth header: `x-e2e-auth-user-id: user-e2e-linked`
   - route: `/?month=2026-06`
   - assert record buttons such as `查看補充用品代墊詳情`.
   - assert no record table headers/row role dependency.
   - click item, assert dialog title and fields.

2. `shows income detail status as no status`
   - open a seeded income record such as `六月生活費`.
   - assert status value `---`.
   - assert amount has no leading `+` or `-`.

3. `shows fund payer for fund-paid expense`
   - use a seeded fund-paid expense if present; otherwise create via existing create-record flow in serial E2E only if fixture cannot cover it.
   - assert payer `基金`.

4. `supports keyboard activation and close`
   - focus a record detail button.
   - press Enter or Space.
   - close via Escape or built-in close button.
   - assert dialog hidden and URL unchanged.

5. `keeps desktop arrangement on tablet landscape`
   - set viewport to an 11-inch iPad landscape equivalent, for example `{ width: 1194, height: 834 }`.
   - assert records card bounding box is to the right of main dashboard content.
   - add optional 1280 x 832 viewport check if the same test can remain stable.

6. `shows empty state for no-record month`
   - use a seed-empty month, or choose a month outside seeded records if report data can render.
   - assert `這個月份尚無紀錄。`.
   - assert no `查看.*詳情` button.

Create-record E2E updates:
- If existing tests assert dialog description or field label copy, update from `成員` to `支付者`.
- Existing create flows that locate fields by `name` should not require behavior changes.

Selector guidance:
- prefer accessible roles and names:
  - `page.getByRole("button", { name: "查看補充用品代墊詳情" })`
  - `page.getByRole("dialog")`
  - `dialog.getByRole("heading", { name: "補充用品代墊" })`
- use text assertions for field values where accessible field grouping is not currently labeled.
- avoid class selectors except responsive bounding boxes; for layout, use semantic sections and locator bounding boxes.

## Unit / Integration Mapping

- Unit tests are optional for this slice.
- If helper extraction happens:
  - `formatDate`: `2026-06-11` -> `2026/06/11`.
  - `recordActorLabel`: income member, member-paid payer, fund-paid fund, missing member fallback.
  - `ledgerRecordStatusLabel`: income `---`; expense statuses.
- Integration/server tests are not required because there is no data query or action change.

## Verification Commands

Required during TDD Implementation:

- `corepack pnpm lint`
- `corepack pnpm type-check`
- `corepack pnpm build`
- targeted Playwright:
  - `pnpm test:e2e e2e/dashboard.spec.ts`
  - or specific new record-list spec if created.

Run `lint`, `type-check`, and `build` sequentially because `prisma generate` can race when commands run concurrently.

## Release Implications

- release_target: `local_dev`
- no database migration.
- no environment variables.
- no auth callback or secret changes.
- no preview/staging/production readiness claim.
- local_dev release readiness must be refreshed after verification because this touches the primary dashboard and create-record copy.

## TDD Implementation Preconditions

- Behavior Spec approval.
- This Technical Design approval.
- Decide whether helper functions remain covered by E2E only or are extracted for unit tests.
- Confirm E2E can rely on current seed data for income, member-paid expense, and fund-paid expense; if not, TDD implementation may add minimal fixture setup or use create-record flow in serial tests.

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm component boundaries: parent card in `HomePage`, list/dialog in `RecordListDetail`, category UI in `RecordCategoryLabel`.
  - Confirm no `ItemActions`, no chevron, no table wrapper, and no detail dialog footer/description.
  - Confirm E2E should land in `e2e/dashboard.spec.ts` unless it becomes too broad.
  - Confirm helper extraction is optional and should be driven by test needs.
- acceptance_signals:
  - TDD Implementation can write/update failing E2E first without changing behavior intent.
  - Production code changes needed by prototype are already bounded and can be hardened.
  - Verification scope is concrete for local_dev.
- unresolved_blockers:
  - None.
- next_step:
  - TDD Implementation
