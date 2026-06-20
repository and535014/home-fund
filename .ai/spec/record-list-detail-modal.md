---
id: record-list-detail-modal
stage: behavior-spec
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-list-detail-modal.md
  - .ai/prototype/record-list-detail-modal.md
  - .ai/domain/home-family-fund.md
  - .ai/foundation-architecture/home-family-fund.md
  - e2e/dashboard.spec.ts
  - e2e/create-record.spec.ts
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/record-list-detail-modal.md
  prototype:
    - .ai/prototype/record-list-detail-modal.md
  domain:
    - .ai/domain/home-family-fund.md
  code_candidates:
    - src/app/(app)/page.tsx
    - src/app/record-list-detail.tsx
    - src/app/record-category-label.tsx
    - src/app/record-entry-panel.tsx
    - src/app/create-record-dialog.tsx
  e2e_candidates:
    - e2e/dashboard.spec.ts
reviewed_at: 2026-06-20
---

# Record List Detail Modal Behavior Spec

## Decision Summary

- decision: awaiting_approval
- next_gate: Feature Technical Design
- reason: The prototype has been accepted through iterative review. This spec locks observable behavior, E2E coverage, accessibility expectations, responsive checks, and non-goals before technical design and TDD implementation.

## Scope

- Replace the `總覽` monthly records table presentation with a compact item list.
- Keep the records surface on `/`; do not restore `/records`.
- Render the item list inside the parent records `Card` owned by the homepage.
- Open a read-only detail dialog from a record item.
- Preserve the current selected-month data source and recent-five-record limit.
- Preserve existing ledger, reimbursement, category, auth, permission, and persistence behavior.
- Use Traditional Chinese UI copy and existing dark-theme item/dialog primitives.
- Keep create-record terminology aligned with the detail view: the member/source field is labeled `支付者`.

## Non-Goals

- No edit, delete, duplicate, correction, settlement, or create behavior in the detail dialog.
- No full monthly history browsing, pagination, search, sorting, filtering, or infinite scroll.
- No database schema or query contract change.
- No route, auth, permission, category, reimbursement, or reporting domain rule change.
- No production release readiness claim.

## Acceptance Criteria

| ID | Criteria |
|---|---|
| AC1 | On `/` for an authenticated member and selected month, the records area renders an item list, not a table with date/category/status/amount headers. |
| AC2 | The homepage records section owns a full-height `Card`; `RecordListDetail` renders list/empty/dialog content inside it without owning the card frame. |
| AC3 | Each record item is a native full-row button with an accessible name `查看<record name>詳情`. |
| AC4 | Each item uses the existing `Item` primitives: category appears in `ItemMedia`, name/payer appear in one `ItemContent`, and amount/date appear in a second right-aligned `ItemContent`. |
| AC5 | Category uses the extracted circular icon plus category label component and is not given a fixed item-column width. |
| AC6 | Record item title and description typography use shared `ItemTitle` and `ItemDescription`; descriptions use caption styling. |
| AC7 | List item amount is displayed as an absolute currency value; income and expense are distinguished by semantic color only. |
| AC8 | List item date is displayed as `YYYY/MM/DD`. |
| AC9 | List item payer label displays only the actor: member-paid and income records show the member display name, fund-paid records show `基金`, and unknown members fall back to `成員`. |
| AC10 | Activating a record item opens a read-only dialog for that exact selected record without changing the route or selected month. |
| AC11 | The detail dialog has a title equal to the record name and no `DialogDescription` or footer action row. |
| AC12 | The detail dialog shows absolute amount, formatted date, category, status, payer, and note or `沒有備註。`. |
| AC13 | Income record detail status displays `---`; expense detail status maps existing reimbursement status labels. |
| AC14 | The detail dialog can be closed through the built-in dialog close behavior and returns focus predictably to the activated record item. |
| AC15 | Keyboard users can tab to a record item, press Enter or Space, open the detail dialog, and close it. |
| AC16 | For a month with no records, the records card shows `這個月份尚無紀錄。` and exposes no record detail buttons. |
| AC17 | The large dashboard arrangement uses Tailwind default `lg` breakpoint and wider `xl` ratio so 11-inch iPad landscape and MacBook 1280 x 832 keep the desktop layout. |
| AC18 | The create-record dialog copy and member/source select label use `支付者`, not `成員`, for that actor field. |

## BDD Scenarios

### Scenario: Monthly records are listed as detail-capable items

Given an authenticated household member opens `/` for `2026-06`  
When the dashboard renders the records area  
Then the records are shown as item buttons rather than a table  
And each item shows category, name, absolute amount, payer, and `YYYY/MM/DD` date  
And the existing `/records` navigation remains absent.

### Scenario: Member opens a selected record detail dialog

Given an authenticated household member is viewing June 2026 records  
When they activate the item for `補充用品代墊`  
Then a dialog opens with title `補充用品代墊`  
And the dialog shows the selected record amount, date, category, status, payer, and note state  
And the URL still includes the selected month and no detail route/query is added.

### Scenario: Income record detail has no reimbursement status

Given an authenticated household member opens an income record detail  
When they inspect the status field  
Then the status value is `---`  
And the amount is an absolute currency value styled with the income tone.

### Scenario: Fund-paid expense shows fund as payer

Given an authenticated household member opens a fund-paid expense record detail  
When they inspect the payer field  
Then the payer value is `基金`  
And the status value is the appropriate non-refundable expense label.

### Scenario: Empty selected month has no record actions

Given an authenticated household member opens `/` for a month without records  
When the records section renders  
Then it shows `這個月份尚無紀錄。`  
And no `查看...詳情` record button is available.

### Scenario: Keyboard interaction opens and closes detail

Given an authenticated household member is on the overview  
When they tab to a record item and press Enter or Space  
Then the detail dialog opens  
When they close the dialog  
Then focus returns to the activated item or another predictable record-list focus target.

### Scenario: Dashboard keeps desktop layout on tablet landscape

Given the viewport is an 11-inch iPad landscape equivalent  
When an authenticated household member opens `/`  
Then the overview keeps the large two-column dashboard arrangement  
And records remain in the right-side full-height card.

## E2E Design

| Coverage | Design |
|---|---|
| Route | `/ ?month=2026-06` with `x-e2e-auth-user-id: user-e2e-linked`; no new route. |
| Primary file | Add focused tests to `e2e/dashboard.spec.ts` or a small `e2e/record-list-detail.spec.ts` if dashboard spec becomes too broad. |
| Fixture strategy | Reuse seeded June 2026 data already used by dashboard/create-record E2E. Use seeded records such as `六月生活費` and `補充用品代墊`; add a seeded no-record month check if one already exists, otherwise pick a month outside the seed range. |
| Selectors | Use `page.getByRole("button", { name: /查看.*詳情/u })`, `page.getByRole("dialog")`, dialog headings, and visible text for amount/date/category/payer/status. Avoid brittle class selectors. |
| Table removal | Assert table column headers such as `日期`, `分類`, `狀態`, `金額` are not present as table headers in the records area; prefer role-based absence if table role is available. |
| Detail open | Activate a known record button and assert dialog title equals that record name. |
| Detail fields | Assert there is no `DialogDescription` or footer action row; formatted date uses slash format; amount has no explicit plus/minus sign; payer uses member display name or `基金`; income status uses `---`. |
| Close behavior | Use built-in close button or Escape and assert dialog hidden, URL remains `/` with `month=2026-06`. |
| Keyboard | Focus first record detail button, press Enter, close; repeat with Space if practical in one test or cover one key per scenario. |
| Empty state | Visit a no-record month and assert empty copy plus no record detail buttons. |
| Responsive | Use Playwright viewport for 11-inch iPad landscape and MacBook 1280 x 832. Assert dashboard still shows record card beside main dashboard content by checking bounding boxes: records section x-position is to the right of trend/summary area, not below it. |
| Accessibility | Record item buttons have accessible names; dialog has title; built-in close control remains available. Focus return should be asserted when reliable in Playwright. |
| Tracking | No analytics or monitoring events required for local_dev. |

## Test Plan

- Unit/component:
  - Add a focused React component test only if project test foundation supports rendering client components cheaply; otherwise cover via E2E.
  - Candidate helpers to unit-test if extracted during technical design: `formatDate`, `recordActorLabel`, `ledgerRecordStatusLabel`.
- E2E:
  - Add dashboard record-list/detail coverage for normal list, selected detail, income status, fund payer, keyboard open/close, and empty month.
  - Update create-record E2E assertions only where copy changed from `成員` to `支付者`.
- Manual:
  - Inspect `/ ?month=2026-06` at desktop, 1280 x 832, and 11-inch iPad landscape viewport.
  - Verify long names/categories truncate without overlap.
- Regression:
  - Run `corepack pnpm lint`, `corepack pnpm type-check`, `corepack pnpm build`, and targeted Playwright E2E.

## Accepted Risks

- The current recent-five-record limit remains unchanged; full monthly history browsing is deferred.
- No visual snapshot baseline is required in this gate, but responsive bounding-box E2E is recommended.
- Focus-return behavior depends on existing Dialog primitives; E2E should assert the practical result.
- Unknown member ids fall back to `成員`; this is acceptable for local_dev but should be rare with current data source.

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm recent-five-record limit stays in scope.
  - Confirm E2E should use seeded records rather than adding new fixtures.
  - Confirm `支付者` is the accepted label for both income source and expense payer.
  - Confirm responsive checks should include 11-inch iPad landscape and 1280 x 832 desktop.
- acceptance_signals:
  - Feature Technical Design can decide component boundaries, prop shapes, and test selectors from this spec.
  - TDD implementation can start with failing E2E or component tests without inventing behavior.
  - No domain or persistence change is needed.
- unresolved_blockers:
  - None if this behavior contract is approved.
- next_step:
  - Feature Technical Design
