---
id: record-list-detail-modal
stage: experience-prototype
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/record-list-detail-modal.md
  - .ai/domain/home-family-fund.md
  - .ai/foundation-architecture/home-family-fund.md
  - /Users/and0514/Library/Application Support/CleanShot/media/media_PnPcywB8PB/CleanShot 2026-06-20 at 18.55.35@2x.png
  - /Users/and0514/Library/Application Support/CleanShot/media/media_27olyQoTao/CleanShot 2026-06-20 at 19.01.02@2x.png
  - src/app/(app)/page.tsx
  - src/app/dashboard-widgets.tsx
outputs:
  - production_stack_prototype
  - ux_acceptance_inputs
  - e2e_scenario_candidates
trace_links:
  intent:
    - .ai/intent/record-list-detail-modal.md
  prototype_code:
    - src/app/(app)/page.tsx
    - src/app/dashboard-widgets.tsx
    - src/app/record-category-label.tsx
    - src/app/record-list-detail.tsx
  verification_commands:
    - corepack pnpm type-check
    - corepack pnpm lint
reviewed_at: 2026-06-20
---

# Record List Detail Modal Prototype

## Decision Summary

- decision: awaiting_approval
- next_gate: Behavior Spec / BDD / E2E
- reason: A production-stack interactive prototype now exists on the intended `總覽` route and can be reviewed before formal acceptance criteria and implementation test mapping are locked.

## Prototype Surface

- route: `/`
- review_url: `http://localhost:3001`
- run_command: `npm run dev`
- component_paths:
  - `src/app/(app)/page.tsx`
  - `src/app/record-category-label.tsx`
  - `src/app/record-list-detail.tsx`
- stack: Next.js App Router, React client component for dialog state, Tailwind, local shadcn-style `Card`, `Dialog`, `Button`, `Badge`, and `Item` components, lucide icons.

## UX Shape

- The existing `紀錄` dashboard panel no longer renders a table.
- The homepage records section owns the full-height `Card`; `RecordListDetail` renders the list, empty state, and detail dialog inside that parent container.
- The overview dashboard uses Tailwind's default `lg` breakpoint for the large two-column layout and a wider `xl` ratio, so an 11-inch iPad in landscape and a MacBook-class 1280 x 832 viewport keep the desktop arrangement without custom media variants.
- Each item is a full-row `Item` button using the reviewed information arrangement, not the wireframe's border-heavy visual style:
  - category is rendered through `ItemMedia` with the reviewed circular icon plus category label style, and it sizes from its content instead of a fixed item column
  - name and payer/source appear in the first `ItemContent`
  - amount and date appear in a second right-aligned `ItemContent`
- List item amounts are displayed as absolute values while income/expense tone still carries semantic color.
- Dates display as `YYYY/MM/DD`.
- Item title and description typography are controlled by shared `ItemTitle` / `ItemDescription`; descriptions use the shared caption style.
- Activating an item opens a modal with:
  - record title
  - absolute amount block
  - date, category, status, and source/payment fields
  - note block with an explicit empty-note message
  - no footer action; close remains available through the dialog's built-in close control and keyboard behavior
- The empty state remains `這個月份尚無紀錄。`.

## Data And Fixture Strategy

- Uses the real homepage data source through `loadMonthlyWorkspaceContext`.
- Keeps the existing selected-month filter and `recentRecords = monthRecords.slice(-5).reverse()` behavior.
- Category names come from the existing dashboard categories read model.
- Member display names come from the existing household members read model.
- The homepage renders `RecordListDetail` directly; the obsolete `RecordsTable` wrapper was removed because the UI is no longer table-based.
- Payer/source labels show only the actor name: member-paid records show the member display name, fund-paid records show `基金`, and unknown members fall back to `成員`.
- No mock API, schema change, route change, or write behavior is introduced.

## States Covered

- normal state: list of recent income/expense records
- income item: green absolute amount and source member label when available
- expense item: red absolute amount and fund/member payment label
- detail modal: selected record details with category, status, actor/payment, and note
- no-note state: `沒有備註。`
- empty state: existing no-record copy

## Accessibility And Focus Baseline

- Each list item is a native `button`, so click and keyboard activation are available.
- Each item has an `aria-label` of `查看<record name>詳情`.
- The modal uses existing Radix/shadcn-style `Dialog` primitives with title, description, close button, escape/outside close behavior, and focus management.
- Closing the modal clears selected client state without changing the URL or selected month.
- Focus-return behavior is delegated to the dialog primitive and should be locked by Behavior Spec/E2E.

## Responsive Baseline

- The list fits the current desktop dashboard right column without horizontal scrolling.
- Item content uses truncation for long record names and metadata.
- Detail modal uses a single-column layout on narrow viewports and a two-column field grid at `sm`.
- Mobile-specific dashboard redesign remains out of scope; this prototype only avoids obvious overflow within the current shell.

## UX Acceptance Inputs

- Records must be presented as a list, not a table, using the reviewed category/name/amount/payer/date information grid.
- Full-row activation should open the read-only detail modal.
- The detail modal must display selected record data, not generic or stale data.
- Closing the modal must leave the user on the same overview month.
- Amount values must be absolute in both the list item and detail modal, while income/expense visual tone remains obvious.
- Empty state must remain understandable.
- Keyboard interaction and focus return must be testable before implementation is considered complete.

## E2E Scenario Candidates

- Authenticated user opens `/` and sees the `紀錄` panel as a list without table headers.
- Record item cells follow the reviewed layout: category, name, absolute amount, payer/source, and date.
- Authenticated user activates a record item and sees a detail modal for that exact record.
- Detail modal shows amount, date, category, status, payment/source label, and note or empty-note copy.
- Income record status displays `---` because income has no reimbursement status.
- Closing the modal hides details and keeps the user on `/`.
- Keyboard user tabs to a record item, presses Enter or Space, and opens the modal.
- Month with no records shows `這個月份尚無紀錄。` and no detail buttons.

## Known Gaps

- No Playwright visual screenshot was captured in this gate.
- No Behavior Spec or TDD test has been written yet.
- The prototype keeps the current five-record recent list limit; expanding to all records remains an open product decision.
- Member/source labels rely on existing member ids in the read model; unknown ids fall back to generic Traditional Chinese labels.
- Edit/delete/correction actions are intentionally absent.

## Verification

- `corepack pnpm type-check`: passed.
- `corepack pnpm lint`: passed.
- `npm run dev`: running on `http://localhost:3001` because port 3000 was already in use.

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Check list density and scanability in the existing dashboard panel.
  - Confirm full-row click is the preferred affordance over a separate details icon button.
  - Confirm the modal fields are sufficient for the first read-only detail version.
  - Confirm keeping the current recent five-record limit for the next spec.
- acceptance_signals:
  - The prototype can move to Behavior Spec / BDD / E2E without adding edit/delete scope.
  - The interaction is understandable with existing data and Traditional Chinese copy.
  - Accessibility requirements are concrete enough to test.
- unresolved_blockers:
  - None for Behavior Spec if the reviewer accepts the scope and recent-record limit.
- next_step:
  - Behavior Spec / BDD / E2E after explicit approval.
