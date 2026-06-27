---
id: prototype-refund-page
stage: experience-prototype
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/refund-page.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/refund-page.md
  - .ai/prototype/search-reimbursement-payment-records.md
  - .ai/prototype/reimbursement-payment-flow.md
outputs:
  - production_stack_prototype
  - ux_acceptance_criteria_draft
  - e2e_scenario_candidates
trace_links:
  route:
    - src/app/(app)/refunds/page.tsx
  components:
    - src/app/(app)/refunds/_components/refund-page-prototype.tsx
    - src/app/dashboard-navigation.ts
    - src/components/layout/authenticated-mobile-nav.tsx
    - src/app/month-switcher.tsx
reviewed_at: 2026-06-27
---

# Experience Prototype: Refund Page

## Prototype Summary

- route: `/refunds`
- review_url: `http://localhost:3000/refunds`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React client components, TypeScript, Tailwind CSS, local shadcn-style components, Lucide icons
- component_library_usage: existing PageLayout, PageHeader, MonthSwitcher, Tabs, Button, Badge, Dialog components
- fixture_or_mock_strategy: The refund page uses route-local fixture data in `refund-page-prototype.tsx`. It does not load refund summaries, unpaid expenses, refund records, or batch refund commands from the database yet.
- release_target: `local_dev`

## UX Direction

- `退款` becomes a dedicated month-scoped workspace at `/refunds`.
- The home refund summary links to `/refunds?month=目前月份` through a `前往退款` action.
- Desktop sidebar includes `退款` immediately after `搜尋`.
- Mobile bottom tab navigation omits `退款` through route metadata (`mobileVisible: false`).
- The page uses the same app shell and header pattern as existing authenticated pages.
- `MonthSwitcher` stays on the refund route by using a route-specific href builder.
- The main surface starts with `全部` and member tabs.
- Each tab shows three summary values: `未退款筆數`, `未退款金額`, `已退款金額`.
- Each tab shows two side-by-side desktop lists: `未退款支出紀錄` and `退款紀錄`.
- Unpaid expenses support selection mode with selected count, selected amount, and a `批次退款` confirmation dialog.
- Unpaid expense rows and refund record rows can open detail dialogs.

## States Covered

- Desktop sidebar contains `總覽`, `搜尋`, `退款`, and `設定`.
- Mobile bottom tab excludes `退款` while retaining the current mobile tab set.
- Refund page header shows title and month switcher.
- Home `待退款` area action opens the refund page for the current month.
- `全部` member scope aggregates all fixture records.
- Member scopes filter summary totals, unpaid expense records, and refund records.
- Unpaid expense list normal mode.
- Unpaid expense list selection mode.
- Selected count and selected amount.
- Disabled batch refund action with no selected records.
- Batch refund confirmation dialog with selected total.
- Unpaid expense detail dialog.
- Refund record detail dialog.
- Long row labels truncate inside fixed row structure.

## Interaction Details

- User opens `/refunds`:
  - `全部` is selected by default.
  - summary totals derive from current fixture rows.
- User changes the month:
  - month links stay under `/refunds?month=YYYY-MM`.
  - fixture rows do not vary by month in this prototype.
- User selects a member tab:
  - summary values and both lists filter to that member.
  - active selection state is cleared.
- User clicks `選取`:
  - unpaid expenses show a selection control.
  - selected count and selected amount appear under the list title.
- User selects rows:
  - selection amount updates immediately.
- User clicks `批次退款`:
  - confirmation dialog opens with total amount.
  - no server action is submitted in this prototype.
- User clicks an unpaid expense or refund record row:
  - a read-only detail dialog opens.

## Responsive Baseline

- Desktop: refund page uses a two-column list layout with summary tiles above.
- Tablet/mobile: summary tiles and lists stack in one column.
- Member tabs are horizontally scrollable to avoid label overlap.
- Mobile bottom tab bar keeps the current tab set and does not include `退款`.
- Page content keeps bottom padding from the existing PageLayout so fixed mobile controls do not obscure content.

## Accessibility And Focus

- Tabs expose `全部` and each member as keyboard-reachable triggers.
- Selection controls use `aria-pressed` and accessible labels.
- Row detail actions are buttons with visible focus rings.
- Dialogs use existing Dialog primitives, titles, descriptions, close controls, and focus containment.
- Summary and list sections have aria labels.
- `批次退款` is disabled when no unpaid expenses are selected.

## Draft UX Acceptance Criteria

- Desktop users can open `/refunds` from a `退款` sidebar item below `搜尋`.
- Mobile users do not see `退款` in the bottom tab bar.
- `/refunds` shows `退款` title and a month switcher that stays on the refund route.
- Users can switch between `全部` and member scopes.
- Scope changes update unpaid count, unpaid amount, refunded amount, unpaid expense list, and refund record list.
- Users can switch unpaid expenses into selection mode.
- Selection mode shows selected count and selected total.
- Batch refund opens a confirmation dialog when one or more unpaid expenses are selected.
- Clicking an unpaid expense opens its detail dialog.
- Clicking a refund record opens its detail dialog.
- Refund records remain payment evidence and are not presented as ordinary income/expense records.

## E2E Scenario Candidates

- Open `/refunds` on desktop and verify sidebar order includes `搜尋`, then `退款`.
- Open `/refunds` on mobile viewport and verify bottom tab bar excludes `退款`.
- Verify the month switcher on `/refunds` links to `/refunds?month=...`.
- Switch from `全部` to a member tab and verify summary/list values change.
- Enter selection mode, select two unpaid expenses, and verify selected count and amount.
- Open batch refund confirmation and verify the total amount.
- Open an unpaid expense detail dialog.
- Open a refund record detail dialog.

## Known Gaps

- The refund page data is fixture-only and does not call a server read model.
- Batch refund confirmation does not submit to a server action.
- Payment evidence form fields are not shown in the prototype confirmation yet; Behavior Spec should decide whether to embed the existing payment fields here.
- Completed refund record month attribution is not finalized.
- General-member visibility of other members' refund records is not finalized.
- Route choice remains reviewable: `/refunds` is used for prototype, while `/reimbursements` redirect/404 behavior is deferred to technical design.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `/refunds` is the right route for the dedicated refund page.
  - Confirm desktop sidebar placement below `搜尋`.
  - Confirm mobile bottom tabs should omit `退款`.
  - Confirm `全部` plus member tabs are acceptable for the first implementation.
  - Confirm the summary/list/selection/detail structure matches the intended refund workflow.
  - Confirm the home page `待退款` panel should use `前往退款` as the action label.
- must_check:
  - Prototype remains frontend review work; backend read models and mutation commands are deferred.
  - Behavior Spec must define authorization, month attribution, member scope, selection clearing, batch validation, and empty states.
  - Technical Design must define route ownership, navigation metadata, read-model ownership, and command reuse.
- acceptance_signals:
  - User accepts the route, page structure, and device-specific navigation direction.
  - User requests only concrete copy/layout adjustments before Behavior Spec.
  - Prototype gives enough evidence to write BDD/E2E scenarios.
- unresolved_blockers:
  - Completed-refund month attribution needs review.
  - Whether batch refund confirmation should collect payment fields on this page needs Behavior Spec.
- next_step:
  - Behavior Spec / BDD / E2E for `refund-page`.
