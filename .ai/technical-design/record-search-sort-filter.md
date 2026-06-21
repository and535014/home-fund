---
id: technical-design-record-search-sort-filter
stage: feature-technical-design
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-search-sort-filter.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/record-search-sort-filter.md
  - .ai/prototype/record-search-sort-filter.md
  - .ai/spec/record-search-sort-filter.md
  - .ai/foundation-architecture/home-family-fund.md
  - src/app/(app)/search/page.tsx
  - src/app/record-list-detail.tsx
  - src/app/home-dashboard-data-source.ts
  - src/modules/fund-ledger/ledger-records.ts
  - src/modules/categorization/category-catalog.ts
outputs:
  - technical_design
  - contracts
  - tdd_preconditions
trace_links:
  spec:
    - .ai/spec/record-search-sort-filter.md
  prototype:
    - .ai/prototype/record-search-sort-filter.md
  domain_impact:
    - .ai/domain-impact/record-search-sort-filter.md
  target_components:
    - src/app/(app)/search/page.tsx
    - src/app/record-list-detail.tsx
    - src/app/home-dashboard-data-source.ts
  domain_modules:
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/categorization/category-catalog.ts
    - src/modules/reimbursement/reimbursement-table.ts
  data_model:
    - prisma/schema.prisma
reviewed_at: 2026-06-21
---

# Technical Design for Record Search, Sort, and Filter

## Decision Summary

- decision: proceed_to_tdd_implementation_after_review
- implementation_strategy: preserve the accepted `/search` prototype shape, extract query semantics into testable helpers, then cover with unit/component/E2E before hardening UI.
- route_boundary: `/search`
- dashboard_boundary: dashboard `/` remains a recent-record summary and does not own search/filter/sort.
- query_state: local client state for this slice; no URL persistence.
- data_source: server loads active records, categories, and members for `/search`; client applies MVP query criteria.
- data_model_change: none expected.
- release_target: `local_dev`

## Boundaries

| Area | Decision |
|---|---|
| Route | `src/app/(app)/search/page.tsx` owns the search page. It renders no `PageHeader`, loads search data server-side, and passes it into the shared record list/detail client component. |
| Dashboard | `src/app/(app)/page.tsx` keeps recent-month record summary behavior and does not enable query controls. |
| Client component | `src/app/record-list-detail.tsx` remains the shared record list/detail shell. Its query UI is enabled only when `enableQuery` is true. |
| Query logic | Move prototype query state types, option builders, filtering, keyword text building, and sorting into a route-neutral helper module before implementation tests, preferably `src/app/record-query.ts`. |
| Data source | Extend or refine `src/app/home-dashboard-data-source.ts` with a search-specific loader that returns active records only. Keep monthly dashboard reads unchanged. |
| Auth | `/search` uses `requireAuthenticatedMember()` like other app routes. No role-specific browse restriction beyond authenticated household access. |
| Record detail | Search results open the existing `RecordDetailDialog`; edit/delete/reimbursement permissions remain unchanged and server actions stay authoritative. |

## Data And Query Contracts

### Search Page Data

Search page data must include:

- active `LedgerRecord[]`
- all categories needed to render historical record labels
- household member display names
- authenticated actor profile for record detail action visibility

Records must be active-only at the data source:

```ts
where: {
  status: "active",
}
```

The data source may still return archived categories so historical record details remain readable. Query option builders must exclude archived categories from searchable/filterable category options.

### Query State

Keep a serializable local state shape:

```ts
type RecordQueryState = {
  categoryId: "all" | string;
  dateFrom: string;
  dateTo: string;
  participant: "all" | "fund" | `member:${string}`;
  reimbursementStatus: "all" | "refunded" | "unrefunded";
  search: string;
  sort: "newest" | "oldest" | "amount_desc" | "amount_asc";
  type: "all" | "income" | "expense";
};
```

Defaults:

- `categoryId: "all"`
- `dateFrom: ""`
- `dateTo: ""`
- `participant: "all"`
- `reimbursementStatus: "all"`
- `search: ""`
- `sort: "newest"`
- `type: "all"`

The UI should treat default state as no active query and show the initial prompt instead of records.

### Query Options

Build options from server-loaded categories and members:

- `activeCategories`: categories where `status === "active"`, ordered by `type`, `sortOrder`, then `name`.
- `participants`: `基金` plus members, ordered by member display name.

Draft modal behavior:

- Type `收入` filters category options to active income categories.
- Type `支出` filters category options to active expense categories.
- Type `收入` removes `基金` from `收支對象`.
- Switching to a type that invalidates current `categoryId` or `participant` resets that draft field to `all`.
- Draft changes are committed to applied query state only by `套用`.
- Modal `清除` resets draft filter/sort state while preserving current keyword; it does not affect results until `套用`.

## Query Semantics

Filtering order is not user-visible but should be deterministic and testable:

1. active-only guard
2. type
3. active category id
4. member/fund participation
5. reimbursement status
6. date range
7. keyword
8. sort

### Keyword Search

Keyword search matches normalized visible text from:

- record name
- note
- active category name only
- income/expense label
- fund-paid label
- member/fund actor label
- reimbursement status label
- display date
- formatted amount

Archived category names must not be included in keyword text.

### Member/Fund Participation

- `member:<id>` matches income records where `sourceMemberId` is the member.
- `member:<id>` matches member-paid expense records where `payerMemberId` is the member.
- `fund` matches fund-paid expenses only.
- `fund` is not valid when type is `income`.

### Reimbursement Status

- `refunded` matches member-paid expenses with `reimbursementStatus === "reimbursed"`.
- `unrefunded` matches member-paid expenses with `reimbursementStatus === "refundable"`.
- Income and fund-paid expenses are excluded when reimbursement status is `refunded` or `unrefunded`.

### Date Range

- Compare against `occurredOn` in `YYYY-MM-DD`.
- Start-only includes `record.occurredOn >= dateFrom`.
- End-only includes `record.occurredOn <= dateTo`.
- Bounded range includes both boundaries.
- Invalid start/end ordering should be handled as an empty result in this slice unless Behavior Spec is revised to require validation copy.

### Sort

- `newest`: `occurredOn` descending, then name ascending.
- `oldest`: `occurredOn` ascending, then name ascending.
- `amount_desc`: amount descending, then `occurredOn` descending.
- `amount_asc`: amount ascending, then `occurredOn` descending.

## UI State Ownership

`RecordListDetail` owns:

- selected record id
- detail focus return
- applied query state when `enableQuery`
- filter modal open state
- filter modal draft query state

Search input:

- Updates applied `search` immediately.
- Shows icon-only `清除搜尋` button only when `query.search` is non-empty.
- Clearing search sets `search: ""`; if all other applied criteria are default, initial prompt returns.

Filter button:

- Icon-only button with accessible label:
  - `開啟篩選`
  - `開啟篩選，已設定 N 個條件`
- Active style when any filter or non-default sort is applied.
- Active count excludes keyword search because keyword has its own clear affordance.

Filter modal:

- Title `篩選與排序`.
- No result counts.
- Controls: `類型`, `分類`, `收支對象`, `退款狀態`, `開始日期`, `結束日期`, `排序`.
- Footer actions: optional `清除`, primary `套用`.
- Closing without `套用` discards draft changes.

Empty states:

- No records loaded: `尚無紀錄。`
- No active query: `請輸入關鍵字或設定篩選條件。`
- Active query with no matches: `沒有符合條件的紀錄。`

## Auth And Permission Boundary

- `/search` requires an authenticated household member.
- Any authenticated household member may browse active household records.
- Search does not grant mutation permission.
- Detail edit/delete/reimbursement visibility stays with the existing `recordActionAccess` mirror and server action authorization.
- Direct mutation actions remain guarded by existing server actions and domain commands.

## Error, Loading, And Performance Strategy

- MVP local_dev can load active records server-side and apply client query because current dataset is small.
- Technical debt marker: production-scale search may need server query parameters, pagination, and indexed full-text/search strategy.
- No dedicated loading state is needed beyond route loading behavior for this slice.
- No inline validation errors are needed for date range in MVP; impossible ranges produce no matches.

## Test Mapping

| Spec Requirement | Test |
|---|---|
| `/search` no header and initial prompt | E2E `record-search.spec.ts`; component smoke if added. |
| Keyword matches visible fields and can clear | Unit tests for query text; E2E for input and `清除搜尋`. |
| Modal draft changes apply only on `套用` | Component or E2E interaction test. |
| Closing modal preserves applied query | Component or E2E interaction test. |
| Active filter button style and accessible label | Component/E2E assertion for button class or accessible label after apply. |
| Category active-only and type-constrained | Unit tests for option builder; E2E select assertions. |
| `收入` excludes `基金` | Unit tests for option builder/draft adjustment; E2E select assertions. |
| Member/fund participation | Unit tests for query predicate; E2E for member and fund result sets. |
| Reimbursement status excludes income/fund-paid | Unit tests for query predicate; E2E for `已退款`/`未退款`. |
| Date boundaries | Unit tests for predicate; E2E targeted boundary case if seed data supports it. |
| Sort orders | Unit tests for comparator; one E2E representative if stable seed data exists. |
| Detail continuity | E2E opens detail from search result and checks existing actions. |

## TDD Implementation Order

1. Extract query state, defaults, option builders, predicate, keyword text, and comparator into `src/app/record-query.ts`.
2. Add unit tests for `record-query.ts` covering active-only filtering, keyword fields, archived category exclusion, type/category constraints, participant constraints, reimbursement filters, date boundaries, sorting, and active filter count.
3. Add data-source tests for `getSearchPageData()` active-only records and required select shape.
4. Add component-level tests if existing test setup can render `RecordListDetail`; otherwise cover UI through E2E.
5. Add `e2e/record-search.spec.ts` for initial state, keyword clear, modal draft/apply, constrained options, combined filters, reimbursement status, sort, detail continuity, and mobile modal.
6. Refactor `src/app/record-list-detail.tsx` to consume extracted helpers while preserving accepted prototype behavior.
7. Run type-check, lint, unit tests, build, and targeted E2E.

## Release Implications

- No Prisma migration expected.
- No secret/config/OAuth changes expected.
- No production readiness claim.
- Local dev release readiness should include:
  - `corepack pnpm test`
  - `corepack pnpm type-check`
  - `corepack pnpm lint`
  - `corepack pnpm build`
  - targeted `pnpm test:e2e e2e/record-search.spec.ts`

## Open Questions

- Should `收支對象` remain the final label, or should Behavior Spec be revised before implementation?
- What active-record volume is acceptable for client-side query before server-side filtering/pagination is required?
- Should URL persistence become a future slice for shareable searches?

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm client-side MVP query is acceptable for local_dev.
  - Confirm query helper extraction before tests/implementation.
  - Confirm active records are loaded for `/search` while dashboard remains month/recent focused.
  - Confirm no URL persistence in this slice.
- must_check:
  - Design maps every accepted Behavior Spec area to tests.
  - No implementation starts before this design is approved.
  - Performance risk is explicit.
- acceptance_signals:
  - TDD can begin with query helper and E2E failures.
  - Boundaries between search page, shared record detail, data source, and domain modules are clear.
- unresolved_blockers:
  - None for local_dev TDD implementation.
- next_step:
  - TDD Implementation for `record-search-sort-filter`.
