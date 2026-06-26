---
id: refund-page
stage: intent-intake
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: feature_change
inputs:
  - user_prompt:2026-06-27-refund-page
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/domain/home-family-fund.md
  - .ai/intent/reimbursement-payment-flow.md
  - .ai/intent/search-reimbursement-payment-records.md
  - .ai/intent/desktop-product-structure-layout-redesign.md
  - .ai/intent/mobile-sitewide-layout-redesign.md
outputs:
  - intent_intake
trace_links:
  bounded_contexts:
    - Reimbursement
    - Fund Ledger
    - Reporting
    - Identity and Access
    - Responsive Web Experience
  related_slices:
    - reimbursement-payment-flow
    - search-reimbursement-payment-records
    - batch-search-record-actions
    - record-detail-reimbursement
    - desktop-product-structure-layout-redesign
    - mobile-sitewide-layout-redesign
reviewed_at: 2026-06-27
---

# Intent Intake: Refund Page

## Intent

Reintroduce a dedicated `退款` page so household members can review month-scoped refund status, inspect unpaid member-paid expenses and completed refund records, and let finance-capable users select unpaid expenses for batch refund from a refund-oriented workspace.

The current product has reimbursement capabilities in record detail and `/search`, and the durable domain model records refund payment evidence separately from ordinary ledger records. However, recent artifacts also state that the standalone refund page was retired and that mobile bottom navigation currently should not expose `退款`. This slice intentionally changes the product direction: refund work should again have a dedicated page, but only desktop primary navigation gets a refund entry for this request.

## User Request

新增退款頁面，在首頁的退款區塊有一個按鈕可以點擊前往退款頁。

桌面版 sidebar 新增一個退款入口在搜尋的下面，但是手機版 bottom tab bar 不新增退款頁的入口。

退款頁的結構要有：

- 標題
- month switcher
- `全部` + `成員` tabs
- 對應 tab 顯示的內容

對應 tab 顯示的內容包含：

- 摘要：未退款筆數、未退款金額、已退款金額
- 所有未退款支出紀錄
- 所有退款紀錄

未退款支出紀錄要可以切換選取模式，選取後可以進行批次退款；選取時要顯示已選取數量跟總額。

每筆未退款支出紀錄、退款紀錄都要可以點擊打開查看。

## Classification

- project_type: feature_change
- secondary_types:
  - page_change
  - navigation_ia_change
  - reporting_read_model_change
  - reimbursement_workflow_change
  - batch_action_flow
- affected_surfaces:
  - route: new authenticated refund route, likely `/refunds` or `/reimbursements` to be decided downstream
  - home page: `待退款` block gains a button/link to the refund page
  - desktop sidebar: add `退款` below `搜尋`
  - mobile bottom tab bar: must not add `退款`
  - authenticated layout/navigation data ownership
  - reimbursement read models for unpaid expenses and completed refund records
  - record detail and refund record detail dialogs/readback
  - batch refund selection and confirmation flow
  - authorization and household scoping
  - tests and local_dev release readiness
- target_users: household members reviewing refund status, and finance-capable/admin users responsible for marking member-paid expenses as refunded
- business_outcome: provide a focused refund workspace that makes pending reimbursements, completed refund evidence, and batch refund actions easier to find than using general search alone.

## Scope

In scope:

- Add a dedicated authenticated refund page.
- Add a button/link from the home page refund summary block to the refund page.
- Add a desktop sidebar `退款` entry positioned below `搜尋`.
- Keep the mobile bottom tab bar unchanged; do not add a `退款` tab on mobile for this slice.
- Page header includes `退款` title and the existing month switcher pattern.
- Page provides tabs for `全部` and member-specific views.
- Each tab shows a summary of unpaid refund count, unpaid amount, and refunded amount for the selected month and tab scope.
- Each tab shows all unpaid member-paid expense records in that scope.
- Each tab shows all completed refund records in that scope.
- Unpaid expense records can enter selection mode.
- Selection mode shows selected count and selected total.
- Finance-capable users can submit batch refund for selected eligible unpaid expenses.
- Each unpaid expense row can be opened for record detail.
- Each refund record row can be opened for refund record detail.
- Preserve existing reimbursement payment evidence semantics: refund records are audit evidence, not ordinary income or expense records.
- Preserve existing server-side authorization, household scoping, reimbursement eligibility, and same-paid-to-member batch constraint unless a downstream approved spec changes them.

Out of scope:

- Adding `退款` to the mobile bottom tab bar.
- Executing real bank transfer or external payment integration.
- Reimbursement reversal, correction, deletion, partial refund, split payment, or multiple payment methods.
- Treating refund payment evidence as a normal ledger income or expense.
- Changing monthly income/expense accounting totals.
- Redesigning the full home page, search page, or settings IA beyond the stated entry points.
- Production deployment, analytics, monitoring, or external search indexing.

## Current Context

- `src/app/dashboard-navigation.ts` currently exposes `總覽`, `搜尋`, and `設定`; there is no `退款` navigation item.
- `src/components/layout/authenticated-mobile-nav.tsx` currently derives mobile tab items from the same navigation list as desktop. This request requires a device-specific navigation distinction so desktop can show `退款` while mobile tab bar omits it.
- `src/app/(app)/(home)/page.tsx` already has a `待退款` panel showing pending refund amount and count, but it does not expose a direct refund-page button.
- `/search` already has reimbursement status filtering, selection mode, batch refund, and refund payment record search/readback behavior.
- Existing domain language distinguishes refundable member-paid expenses, reimbursed expenses, reimbursement payment evidence, and refund records.
- Existing artifacts also say the standalone reimbursement page was retired. This intent supersedes that product direction only after review approval.

## Success Criteria

- A desktop authenticated user can reach the refund page from the sidebar entry placed below `搜尋`.
- A user can reach the refund page from the home page refund summary block.
- A mobile authenticated user does not see `退款` in the bottom tab bar.
- The refund page is month-scoped through a month switcher.
- The refund page can switch between `全部` and member-specific tabs.
- The active tab shows unpaid refund count, unpaid amount, and refunded amount for the selected scope.
- The active tab lists all unpaid member-paid expense records for the selected scope.
- The active tab lists all completed refund records for the selected scope.
- Clicking an unpaid expense opens that expense's detail view.
- Clicking a refund record opens that refund record's detail view.
- Selection mode can be enabled for unpaid expenses.
- Selection mode shows selected count and selected amount.
- Batch refund from the refund page reuses existing reimbursement rules and rejects unauthorized, already refunded, fund-paid, income, voided, or cross-member invalid selections.
- Completed refund evidence remains excluded from ordinary income/expense totals.
- Desktop and mobile layouts remain usable without overlapping controls.

## Constraints And Assumptions

- UI copy uses Traditional Chinese and Taiwan usage.
- Existing Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Lucide icons, Vitest, and Playwright foundation should be reused.
- `local_dev` is the release target for this slice.
- The route name is not finalized. `/refunds` is clearer English, while old artifacts and route history mention `/reimbursements`; downstream design should choose one and record redirect/404 implications.
- The `成員` tabs likely mean one tab per member plus `全部`, but downstream prototype/spec must confirm label density and overflow behavior.
- Batch refund should likely continue to require selected unpaid expenses to belong to the same paid-to member so one payment evidence record is unambiguous.
- General members may read refund status where current reporting permissions allow, but only finance-capable/admin users can perform refund mutations.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required, because this reverses a prior standalone-page retirement decision and centralizes refund review plus batch refund workflow on a dedicated page.
- Project Foundation Architecture: not required; the existing app foundation is sufficient.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: required, because this is user-facing page, navigation, tab, list, selection, and detail-readback work.
- Behavior Spec / BDD / E2E: required before technical design.
- Feature Technical Design: required, because route choice, device-specific navigation, read-model ownership, tab scoping, selection state, batch refund command reuse, detail modal wiring, and authorization boundaries need explicit decisions.
- TDD Implementation: required after approved spec and technical design.
- Verification: required after implementation.
- Target-Aware Release: required for `local_dev` readiness because authenticated navigation and core reimbursement workflows change.
- Learning Loop: optional for local_dev; recommended if review needs to validate whether users understand the distinction between unpaid expenses and refund records.
- Artifact Compression: required after the slice completes.

## Open Questions

- Should the route be `/refunds`, `/reimbursements`, or another product URL?
- Does `成員` tabs mean every household member appears as a tab, or should member filtering use a dropdown on narrow screens?
- Should all household members see completed refund records, or should refund record visibility differ by role?
- Should the refund page list completed refund records by payment evidence date, original expense date, or selected report month policy?
- Should selecting unpaid expenses across different members be blocked immediately in the UI or only when opening the batch refund dialog?
- Should the home page button text be `前往退款`, `查看退款`, or another label?
- Should the refund page reuse the existing search-page batch footer/dialog components, or have refund-page-specific components with shared command code?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm the product should reintroduce a dedicated refund page despite prior artifacts retiring the standalone refund route.
  - Confirm desktop sidebar gets `退款` below `搜尋`.
  - Confirm mobile bottom tab bar must not add `退款`.
  - Confirm the page requires `全部` plus member-scoped tabs, summary, unpaid expense list, refund record list, detail open actions, selection mode, and batch refund.
- must_check:
  - No implementation starts before Domain Discovery / Domain Impact, Experience Prototype, Behavior Spec, and Feature Technical Design are approved or explicitly accepted as risk.
  - Device-specific navigation must be intentional because current desktop and mobile navigation share one item list.
  - Refund payment evidence must remain separate from ordinary ledger records and monthly income/expense totals.
  - Batch refund must keep existing authorization and reimbursement eligibility invariants.
- acceptance_signals:
  - The slice is framed as a refund workspace and discovery/action surface, not external payment execution.
  - Scope is narrow enough to reuse existing reimbursement/payment/search behavior.
  - The route and member-tab policies are explicit downstream decisions, not hidden assumptions.
- unresolved_blockers:
  - Route choice and member-tab overflow policy require downstream review.
  - Prior standalone refund page retirement must be explicitly superseded before implementation.
- next_step:
  - Domain Discovery / Domain Impact for `refund-page`.
