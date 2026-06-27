---
id: spec-refund-page
stage: behavior-spec
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/refund-page.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/refund-page.md
  - .ai/prototype/refund-page.md
  - .ai/spec/batch-search-record-actions.md
  - .ai/spec/reimbursement-payment-flow.md
  - .ai/spec/search-reimbursement-payment-records.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/refund-page.md
  domain_impact:
    - .ai/domain-impact/refund-page.md
  prototype:
    - .ai/prototype/refund-page.md
  production_routes:
    - /refunds
  prototype_commit:
    - cf117433 Add refund page prototype
  target_components:
    - src/app/(app)/refunds/page.tsx
    - src/app/(app)/refunds/_components/refund-page-prototype.tsx
    - src/app/(app)/(home)/page.tsx
    - src/app/dashboard-navigation.ts
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-mobile-nav.tsx
    - src/app/(app)/search/_components/record-search-results.tsx
    - src/app/(app)/search/_components/batch-refund-dialog.tsx
    - src/app/_record-detail/record-list-detail.tsx
    - src/app/_record-detail/reimbursement-payment-dialogs.tsx
  domain_modules:
    - src/modules/reporting/monthly-report.ts
    - src/modules/reporting/reimbursement-payment-search-query.ts
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/reimbursement/reimbursement-command.ts
    - src/modules/reimbursement/reimbursement-batch-actions.ts
    - src/modules/identity-access/authorization.ts
  existing_e2e:
    - e2e/dashboard.spec.ts
    - e2e/record-search.spec.ts
reviewed_at: 2026-06-27
---

# Refund Page Behavior Spec

## Decision Summary

- decision: review_for_feature_technical_design
- prototype_status: accepted after review comments and committed as `cf117433`
- primary_route: `/refunds`
- old_route_policy: `/reimbursements` remains out of scope unless Technical Design chooses an explicit redirect or 404 policy
- desktop_navigation: show `退款` immediately below `搜尋`
- mobile_navigation: do not show `退款` in the bottom tab bar
- page_scope: authenticated, household-scoped, month-scoped, and member-scoped
- member_scope_ui: tabs start with `全部`, followed by member names
- completed_refund_month_policy: use reimbursement payment date for the selected month
- unpaid_expense_month_policy: use ledger record occurrence date for the selected month
- batch_refund_policy: reuse existing batch refund dialog, payment evidence fields, same-paid-to-member constraint, and server-side eligibility
- detail_policy: reuse existing record detail, refund record detail, and linked-record dialogs
- no_double_count_policy: refund records are payment evidence and do not affect ordinary income/expense totals
- next_gate: Feature Technical Design

## Final Acceptance Criteria

1. `/refunds` is an authenticated route using the existing app shell.
2. `/refunds` page header shows title `退款`.
3. `/refunds` page header includes the existing month switcher pattern.
4. Month switcher links stay on `/refunds?month=YYYY-MM`.
5. The refund page uses the selected month from the `month` search param.
6. If no month is provided, the route uses the same default-month policy as adjacent monthly views decided in Technical Design.
7. The home `待退款` block shows a `前往退款` action.
8. The home `前往退款` action links to `/refunds?month=<current month>`.
9. The home refund action uses the reviewed ghost button treatment with a right arrow icon.
10. Desktop sidebar navigation shows `退款` directly below `搜尋`.
11. Mobile bottom tab navigation does not show `退款`.
12. Hiding `退款` from mobile bottom tabs is not authorization; direct `/refunds` route access still follows authenticated household access rules.
13. The refund page shows scope tabs starting with `全部`.
14. The refund page shows one tab for each active household member included in refund-page reporting.
15. Selecting `全部` shows all matching unpaid expenses and refund records for the month.
16. Selecting a member tab filters unpaid expenses, refund records, and summary values to that member.
17. Changing tabs clears unpaid-expense selection mode and selected records.
18. The tab list is horizontally scrollable when member labels exceed the available width.
19. The active tab displays a `未退款支出紀錄` section.
20. The active tab displays a `退款紀錄` section.
21. The two sections are side by side on desktop when space allows.
22. The two sections stack without overlap on narrow viewports.
23. Each section fills the remaining page height on desktop.
24. Each section's list scrolls within its own list area rather than forcing the whole page to scroll first.
25. The page does not include a separate full-width summary card row above the lists.
26. `未退款支出紀錄` summary uses the same `SearchSummaryContent` style as the search page summary.
27. `未退款支出紀錄` summary is not full width; it fits its content.
28. In normal mode, unpaid summary text is `未退款 <n> 筆` and `總額 <amount>`.
29. In selection mode, unpaid summary switches to `已選取 <n> 筆` and `總額 <amount>`.
30. The selected amount is the sum of selected unpaid expense amounts only.
31. `退款紀錄` summary uses the same `SearchSummaryContent` style as the search page summary.
32. `退款紀錄` summary is not full width; it fits its content.
33. `退款紀錄` summary text is `已退款 <n> 筆` and `總額 <amount>`.
34. Unpaid amount uses expense/refund-out color treatment consistent with search summary conventions.
35. Refunded amount uses the existing primary summary amount treatment unless Technical Design chooses a more specific token.
36. Unpaid expense rows reuse the same list row structure as search ledger records.
37. Refund record rows reuse the same row structure as search refund records.
38. Unpaid expense rows show ledger category visual, title, date, member, amount, and accessible detail trigger.
39. Refund record rows show refund-record visual, paid-to member/title, payment method/date context, amount, and accessible detail trigger.
40. Activating an unpaid expense row opens the existing `RecordDetailDialog`.
41. The unpaid expense detail dialog shows the existing edit, delete, and refund actions according to the actor's existing permissions and record eligibility.
42. Activating a refund record row opens the existing `ReimbursementPaymentDetailDialog`.
43. Refund record detail is read-only and does not show edit, delete, refund, correction, or reversal actions.
44. Refund record detail shows the existing `查看關聯紀錄` action.
45. Activating `查看關聯紀錄` opens the existing `LinkedRecordsDialog`.
46. Activating a related ledger row opens the existing `RecordDetailDialog`.
47. Unpaid expense selection controls are hidden until selection mode is enabled.
48. Activating `選取` enters selection mode.
49. Activating `取消選取` exits selection mode and clears selected unpaid expenses.
50. In selection mode, unpaid rows can be selected and unselected with accessible selected state.
51. Batch refund is disabled or unavailable when no selected unpaid expenses are eligible.
52. Activating `批次退款` opens the existing `確認批次退款` dialog.
53. Batch refund dialog shows `將處理`, `略過`, and `退款總金額`.
54. Batch refund dialog shows payment evidence fields only when eligible records belong to one paid-to member.
55. Cross-member eligible selections cannot be confirmed as one batch and show the existing cross-member warning copy.
56. Confirming batch refund requires existing payment evidence fields: `付款方式`, `付款日期`, and `交易備註`.
57. Batch refund from `/refunds` uses the same server command semantics as `/search`.
58. Server-side authorization, household scoping, active-record status, member-paid status, refundable status, and same-paid-to-member validation are authoritative.
59. Already refunded, voided, fund-paid, income, non-refundable, unauthorized, and cross-household records are not reimbursed.
60. Successful batch refund records payment evidence and marks eligible expenses `已退款`.
61. Successful batch refund refreshes unpaid expense list, refund record list, and summary values for the active month/scope.
62. Completed refund records shown on `/refunds` are reimbursement payment evidence, not ordinary ledger income or expense records.
63. Refund records do not affect monthly income totals, monthly expense totals, category summaries, ordinary ledger record count, or ordinary ledger net total.
64. General readable access to `/refunds` follows the same household reporting permissions as related monthly/search views.
65. Mutation actions from `/refunds` remain limited to finance-capable or admin actors under existing authorization rules.
66. Empty unpaid list shows a Traditional Chinese empty state.
67. Empty refund record list shows a Traditional Chinese empty state.
68. UI copy uses Traditional Chinese and Taiwan usage and does not imply the app executes an external money transfer.

## BDD Scenarios

### Scenario: Desktop User Opens Refund Page From Sidebar

Given an authenticated household member is using a desktop viewport  
When the app navigation is rendered  
Then `退款` appears directly below `搜尋` in the sidebar  
When the member activates `退款`  
Then `/refunds` opens  
And the page title is `退款`  
And the month switcher is visible

### Scenario: Mobile User Does Not See Refund Bottom Tab

Given an authenticated household member is using a mobile viewport  
When the bottom tab bar is rendered  
Then `退款` is not present  
And the existing mobile tab entries remain available  
When the member directly opens `/refunds`  
Then authenticated route access still applies

### Scenario: User Opens Refund Page From Home Refund Summary

Given the home page shows the `待退款` block for month `2026-06`  
When the member activates `前往退款`  
Then the browser opens `/refunds?month=2026-06`  
And the refund page shows the month switcher for `2026-06`

### Scenario: User Changes Month

Given a member is on `/refunds?month=2026-06`  
When they move to the previous or next month through the month switcher  
Then the URL remains under `/refunds`  
And the selected month changes in the URL  
And unpaid expenses, refund records, and summary totals are recalculated for that month

### Scenario: User Switches Member Scope

Given the `全部` scope shows unpaid expenses and refund records for multiple members  
When the member activates a specific member tab  
Then unpaid expenses are filtered to that member  
And refund records are filtered to that paid-to member  
And both section summaries update  
And any previous selected unpaid expenses are cleared

### Scenario: Refund Page Shows Section Summaries

Given the active tab has four unpaid expenses totaling `$3,310`  
And three refund records totaling `$4,240`  
Then the unpaid section summary shows `未退款 4 筆` and `總額 $3,310`  
And the refund record section summary shows `已退款 3 筆` and `總額 $4,240`  
And neither summary stretches across the full section width

### Scenario: User Selects Unpaid Expenses

Given the unpaid section has visible unpaid expenses  
When the member activates `選取`  
Then selection controls appear on unpaid expense rows  
And the unpaid summary switches to `已選取 0 筆` and `總額 $0`  
When the member selects two unpaid expenses  
Then the unpaid summary shows `已選取 2 筆`  
And the total equals the sum of those selected expenses  
When the member activates `取消選取`  
Then selection controls disappear  
And selected expenses are cleared

### Scenario: Finance-Capable User Batch Refunds Same-Member Expenses

Given a finance-capable member selected two active unpaid member-paid expenses for the same payer member on `/refunds`  
When they activate `批次退款`  
Then `確認批次退款` opens  
And it shows `將處理`, `略過`, `退款總金額`, `付款方式`, `付款日期`, and `交易備註`  
When they provide valid payment evidence and confirm  
Then one reimbursement batch and one payment evidence record are created  
And the eligible selected expenses become `已退款`  
And `/refunds` refreshes its unpaid list, refund record list, and summaries

### Scenario: Cross-Member Batch Refund Cannot Be Confirmed

Given a finance-capable member selected refundable expenses for more than one payer member on `/refunds`  
When they open `確認批次退款`  
Then the dialog warns `批次退款一次只能選擇同一位代墊成員的紀錄。`  
And `確認退款` is disabled  
When a direct submission attempts the same cross-member selection  
Then the server rejects it  
And no selected expense is marked reimbursed

### Scenario: Unauthorized Or Ineligible Records Are Not Reimbursed

Given a selected set contains already refunded, voided, fund-paid, income, non-refundable, unauthorized, or cross-household records  
When batch refund eligibility is evaluated  
Then those records do not contribute to the processable count or refund amount  
When direct mutation is attempted  
Then the server preserves the ineligible records unchanged

### Scenario: User Opens Unpaid Expense Detail

Given an unpaid expense row is visible on `/refunds`  
When the member activates the row detail trigger  
Then the existing record detail dialog opens  
And existing edit, delete, and refund actions appear or are withheld according to the same permission and eligibility rules used elsewhere

### Scenario: User Opens Refund Record Detail And Related Records

Given a refund record row is visible on `/refunds`  
When the member activates the row detail trigger  
Then the existing read-only refund record detail dialog opens  
And it shows amount, paid-to member, payment date, payment method, and note  
And it does not show edit, delete, refund, correction, or reversal actions  
When the member activates `查看關聯紀錄`  
Then the existing related ledger records dialog opens  
And activating a related record opens the existing record detail dialog

### Scenario: Refund Records Do Not Affect Ordinary Ledger Totals

Given refund payment evidence exists for reimbursed expenses in the selected month  
When monthly report totals, ordinary search totals, and category summaries are calculated  
Then refund record amounts are not counted as ordinary income or expense  
And unpaid reimbursement totals exclude the reimbursed expenses

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Desktop sidebar entry | `/` then `/refunds` | authenticated member | desktop | Sidebar links include `搜尋` followed by `退款`; activating `退款` opens `/refunds`; page heading `退款`. |
| Home refund entry | `/` | month with pending reimbursements | desktop | Panel heading `待退款`; button/link `前往退款`; arrow icon present; href `/refunds?month=2026-06`. |
| Mobile bottom nav omission | `/` and `/refunds` | authenticated member | mobile | Bottom tab bar does not include `退款`; direct `/refunds` renders page without nav overlap. |
| Month switcher route | `/refunds?month=2026-06` | seeded month data | desktop | Month switcher current `2026-06`; previous/next controls link to `/refunds?month=<month>`. |
| Member scope filtering | `/refunds?month=2026-06` | unpaid and paid records for at least two members | desktop | Tabs `全部`, member names; selecting `Lin` changes unpaid rows, refund rows, `未退款 <n> 筆`, and `已退款 <n> 筆`. |
| Section scroll regions | `/refunds?month=2026-06` | enough unpaid and refund rows to overflow | desktop | `未退款支出紀錄` list scrolls inside section; `退款紀錄` list scrolls inside section; headers remain visible. |
| Selection summary | `/refunds?month=2026-06` | at least two unpaid rows | desktop | Button `選取`; after click summary `已選取 0 筆` and `總額 $0`; select rows; summary updates; `取消選取` clears selection. |
| Batch refund dialog | `/refunds?month=2026-06` | finance-capable actor, same-member unpaid rows | desktop | Select two; button `批次退款`; dialog `確認批次退款`; texts `將處理`, `略過`, `退款總金額`; fields `付款方式`, `付款日期`, `交易備註`. |
| Cross-member warning | `/refunds?month=2026-06` | finance-capable actor, unpaid rows for two members | desktop | Select cross-member records; dialog warning `批次退款一次只能選擇同一位代墊成員的紀錄。`; `確認退款` disabled. |
| Unpaid detail dialog | `/refunds?month=2026-06` | admin or finance-capable actor, unpaid row | desktop | Row trigger `查看<record name>詳情`; record detail opens; actions `編輯`, `刪除`, `退款` appear where eligible. |
| Refund record detail | `/refunds?month=2026-06` | refund payment evidence linked to records | desktop | Row trigger `查看付給 <member> 退款紀錄詳情`; modal `退款紀錄`; button `查看關聯紀錄`; modal `關聯紀錄`; related row opens record detail. |
| Mobile layout | `/refunds?month=2026-06` | mixed records and members | mobile | Tabs scroll horizontally; sections stack; summaries fit content; no text/control overlap; dialogs are usable. |

## Fixture And Data Strategy

- Reuse or extend the existing `2026-06` E2E seed.
- Required fixtures:
  - at least three active household members.
  - at least four active member-paid refundable expenses in `2026-06` across at least two members.
  - at least three reimbursement payment records in `2026-06` across at least two paid-to members.
  - one refund payment linked to multiple ledger records.
  - enough rows to verify independent section scrolling.
  - one already reimbursed expense with payment evidence.
  - one legacy reimbursed expense without payment evidence if readback behavior is covered in this slice.
  - ineligible records: income, fund-paid expense, voided expense, already reimbursed expense, and cross-household IDs for server-action tests.
- Use existing controlled auth/test member strategy:
  - admin for detail actions showing edit/delete/refund where eligible.
  - finance manager for successful batch refund.
  - general member for mutation rejection.
- Technical Design must decide whether refund records are seeded directly or created through reimbursement server actions before E2E assertions.

## Accessible Selectors

- Page heading: `退款`.
- Month switcher controls: existing month switcher accessible names.
- Desktop nav links: `搜尋`, `退款`.
- Home action: `前往退款`.
- Scope tabs: `全部`, member display names.
- Section headings: `未退款支出紀錄`, `退款紀錄`.
- Summary labels: `未退款 <n> 筆`, `已選取 <n> 筆`, `已退款 <n> 筆`, `總額`.
- Selection controls: row-level `選取<record name>`, `取消選取<record name>`, with `aria-pressed`.
- Selection mode buttons: `選取`, `取消選取`.
- Batch action: `批次退款`.
- Batch dialog: `確認批次退款`, `將處理`, `略過`, `退款總金額`, `付款方式`, `付款日期`, `交易備註`, `確認退款`.
- Record detail trigger: `查看<record name>詳情`.
- Refund record trigger: `查看付給 <member> 退款紀錄詳情`.
- Refund detail: `退款紀錄`, `金額`, `收款成員`, `付款日期`, `付款方式`, `備註`, `查看關聯紀錄`.
- Related records modal: `關聯紀錄`.

## Responsive And Accessibility Requirements

- Desktop sidebar order must remain keyboard-reachable and preserve active-route state.
- Mobile bottom tabs must fit without adding `退款`.
- Member tabs must support horizontal overflow without clipping labels.
- Section headers, action buttons, and summaries must not overlap at desktop, tablet, or mobile widths.
- `SearchSummaryContent` usage in section headers must remain fit-content, not full-width.
- Both list areas must support keyboard scrolling and pointer scrolling independently on desktop.
- Row detail actions and row selection controls must retain visible focus states.
- Dialog focus trap, escape behavior, close behavior, and focus return follow existing Dialog behavior.
- Batch refund disabled states must be programmatic, not only visual.
- Amount colors must meet dark-theme contrast expectations.

## Test Plan

| Level | Coverage |
|---|---|
| Domain/read-model | Refund page summary calculates unpaid count, unpaid amount, and refunded amount by month and member scope. |
| Domain/read-model | Unpaid list includes only active member-paid refundable expenses by occurrence date and scope. |
| Domain/read-model | Refund record list includes reimbursement payment evidence by payment date and paid-to member scope. |
| Domain/read-model | Refund records do not affect ordinary ledger totals, category summaries, or ordinary search totals. |
| Authorization/unit | General members can read according to reporting permissions but cannot submit refund mutations. |
| Authorization/unit | Admin/finance manager can submit eligible refund mutations under existing reimbursement policies. |
| Reimbursement/unit | Refund-page batch command rejects unauthorized, cross-household, voided, fund-paid, income, already reimbursed, non-refundable, and cross-member invalid selections. |
| Integration/server action | Successful refund-page batch refund creates reimbursement batch, payment evidence, updates expense statuses, and returns processed/skipped outcome. |
| Integration/readback | Refund page can open unpaid expense detail, refund record detail, and related ledger records through existing readback contracts. |
| Component | Navigation metadata renders desktop `退款` and omits mobile bottom-tab `退款`. |
| Component | Refund section summaries use shared search summary style with fit-content width. |
| Component | Unpaid selection mode switches summary text and total without layout jump. |
| Component | Lists fill remaining height and scroll internally on desktop. |
| E2E | Desktop sidebar, home entry, mobile bottom-tab omission, month switcher, member tabs, section scroll, selection, batch refund dialog, detail dialogs, mobile layout. |
| Existing regression | Existing `/search` record search, refund record search, batch refund dialog, and record detail behavior continue to pass. |
| Manual | Review Traditional Chinese copy, user distinction between `未退款支出紀錄` and `退款紀錄`, and whether hiding mobile nav entry hurts discovery. |

## Technical Design Inputs

- Decide the production read model for `/refunds`: whether to compose existing monthly report and reimbursement payment search queries or add a dedicated refund-page reporting query.
- Define exact route ownership for `/refunds` and whether `/reimbursements` should redirect, 404, or remain absent.
- Define default-month behavior for `/refunds` when no `month` param exists.
- Define pagination/loading if unpaid expenses or refund records exceed one screen; prototype uses all fixtures.
- Define member tab ordering and whether disabled/historical members appear.
- Define authorization for reading all refund records versus member-relevant refund records.
- Reuse existing `RecordSearchResults`, `RecordDetailDialog`, `ReimbursementPaymentDetailDialog`, `LinkedRecordsDialog`, and `BatchRefundDialog` where feasible.
- Ensure existing detail dialog actions do not unexpectedly mutate prototype-only/read-only data before real server integration.
- Define server-action input/output shape for refund-page batch refund and post-success revalidation paths.
- Add or update navigation tests so desktop and mobile route visibility are intentionally separated.

## Accepted Risks

- The prototype uses fixture data; persistence and read models are deferred to Feature Technical Design and TDD Implementation.
- Completed refund record month attribution is decided here as payment date; if changed, update this spec before technical design.
- Query-wide selection and cross-page selection are out of scope.
- Reimbursement reversal, correction, deletion, split payment, partial refund, and external payment execution remain out of scope.
- Production release readiness is not assessed in this gate; target remains `local_dev`.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `/refunds` is final for this slice.
  - Confirm completed refund records are month-scoped by payment date.
  - Confirm general readable visibility versus role-specific mutation authority.
  - Confirm member tabs are acceptable for MVP.
  - Confirm the E2E coverage is sufficient before Feature Technical Design.
- must_check:
  - Feature Technical Design must not start until this spec is approved or risks are explicitly accepted.
  - Technical Design must preserve existing reimbursement invariants and avoid creating a second financial truth.
  - TDD Implementation must write or enable tests before replacing prototype fixture behavior.
- acceptance_signals:
  - Acceptance criteria are observable and map to route, navigation, read model, selection, batch action, and detail readback.
  - BDD scenarios cover desktop, mobile, month/member scope, batch refund, detail dialogs, and no-double-count policy.
  - E2E selectors use stable Traditional Chinese accessible names.
- unresolved_blockers:
  - Read-model shape, pagination, route fallback, and exact permission scope remain technical-design decisions.
- next_step:
  - Feature Technical Design for `refund-page`.
