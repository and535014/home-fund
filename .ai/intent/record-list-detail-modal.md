---
id: record-list-detail-modal
stage: intent
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-20-record-list-detail-modal
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md
  - .ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md
  - .ai/spec/story-monthly-records-and-reports.md
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  existing_archive:
    - .ai/archive/archive-desktop-product-structure-layout-redesign-2026-06-20.md
    - .ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md
  existing_story:
    - .ai/spec/story-monthly-records-and-reports.md
  current_code:
    - src/app/(app)/page.tsx
    - src/app/dashboard-widgets.tsx
    - src/app/home-dashboard-data-source.ts
    - src/modules/fund-ledger/ledger-records.ts
reviewed_at: 2026-06-20
---

# Record List Detail Modal

## Decision Summary

- decision: awaiting_approval
- first_next_gate: Experience Prototype
- owning_skill: experience-prototype
- reason: The request changes the primary monthly records UI from a table into an interactive item list with a detail modal. It is user-facing website work, so the next gate should confirm layout, interaction, responsive behavior, and detail content before behavior spec, technical design, or implementation.

## User Request

我想要修改現在的紀錄列表，把原本的 table 改成 item list，並且點擊後可以出現 modal 顯示記錄詳細資訊。

## Change Classification

- change_type: feature_change
- secondary_types:
  - component_change
  - visual_structure_change
  - interaction_change
  - accessibility_change
- release_target: local_dev

## Affected Surfaces

| Surface | Impact |
|---|---|
| Homepage / `總覽` | Replace the current recent-records table in the `紀錄` panel with a scannable item list. |
| Record list component | The previous `RecordsTable` wrapper should be replaced by direct `RecordListDetail` usage because the UI is no longer table-based. |
| Record detail interaction | Each record item should be clickable or keyboard-activatable and open a modal/dialog with full record details. |
| Detail content | Modal should show the selected record's name, type, amount, date, category, status, payment/source member where available, and note where available. |
| Accessibility | List items need clear button semantics, focus states, keyboard activation, dialog title, close behavior, and focus return. |
| Responsive behavior | The item list should work in the existing desktop dashboard column and remain usable on narrower viewports supported by the current shell. |
| Tests | Later BDD/E2E should cover list rendering, empty state, opening a detail modal, content visibility, close behavior, and keyboard access. |

## Current Code Signals

- `src/app/(app)/page.tsx` computes `recentRecords` from the selected month and should render `RecordListDetail` inside the dashboard records area.
- `src/app/dashboard-widgets.tsx` previously rendered table markup through `RecordsTable`, but that wrapper should not remain once the list/detail component exists.
- `RecordListDetail` owns list rendering, selected record state, and the read-only detail modal.
- `LedgerRecord` already contains the likely modal data fields: `id`, `type`, `name`, `amountCents`, `occurredOn`, `categoryId`, source/payment member fields, `reimbursementStatus`, and optional `note`.
- Existing desktop layout redesign keeps `紀錄` as a dashboard panel rather than a standalone `/records` route.
- Existing create-record modal work uses client-side dialog patterns; this slice should reuse local dialog primitives instead of adding a new modal library.

## Scope

- Replace the current table presentation of dashboard records with an item-list presentation.
- Preserve the current data source and selected-month filtering.
- Preserve the current "recent records" quantity unless Experience Prototype or Behavior Spec explicitly changes it.
- Add click/tap and keyboard interaction for each rendered record item.
- Add a modal/dialog that shows readable details for the selected record.
- Keep Traditional Chinese UI copy and dark-theme styling.
- Preserve existing record creation, reimbursement, category, member, auth, and permission domain behavior.

## Non-Goals

- Do not add record editing, deletion, duplication, or correction behavior.
- Do not restore a standalone `/records` page.
- Do not change database schema, Prisma queries, ledger domain rules, reimbursement rules, category policy, or permissions.
- Do not add search, pagination, infinite scroll, or full monthly history browsing in this slice unless explicitly approved later.
- Do not change the create-record modal or create-record action flow.
- Do not add preview/staging/production release readiness.

## Success Criteria

- The `總覽` page no longer presents monthly records as a table.
- Records appear as a compact item list that is easy to scan in the existing dashboard panel.
- Empty state remains clear when the selected month has no records.
- Activating a record item opens a modal showing the correct selected record details.
- The modal can be closed and returns the user to the record list without changing route or month state.
- Keyboard users can tab to record items, open a detail modal, close it, and continue from a predictable focus position.
- Existing financial signs and tones remain clear for income and expense records.
- No domain behavior, authorization rule, or persistence model changes are introduced.

## Domain Discovery Need

- required: false
- reason: This request changes presentation and interaction only. It does not introduce new ledger events, financial policies, reimbursement states, role permissions, approvals, lifecycle states, or cross-role workflows.

## Foundation Architecture Need

- required: false
- reason: Existing Next.js App Router, React client components, Tailwind, shadcn-style dialog/card/button primitives, and Playwright/Vitest foundation are sufficient.

## Foundation Implementation Need

- required: false
- reason: No project scaffold, framework, component library, routing baseline, lint, test, or E2E foundation change is required.

## Experience Prototype Need

- required: true
- timing: next
- reason: This is a user-facing interaction change in a dense financial dashboard. The list density, detail hierarchy, modal content, focus behavior, and responsive fit should be reviewed before locking behavior specs.
- prototype_scope:
  - `總覽` records panel item-list layout
  - record item visual hierarchy for income, fund expense, and member-paid expense
  - empty state
  - selected-record detail modal
  - close/focus behavior
  - desktop and narrow viewport fit inside the existing dashboard layout

## Behavior Spec / BDD / E2E Need

- required: true
- timing: after Experience Prototype
- reason: The implementation should be driven by explicit acceptance criteria and tests for list rendering, modal opening, selected data correctness, close behavior, empty state, and keyboard accessibility.
- scenarios_to_cover:
  - Authenticated user sees recent monthly records as a list, not a table.
  - Authenticated user opens a record detail modal from a list item.
  - The detail modal shows the selected record's amount, date, category, status, and note when present.
  - Closing the modal returns to the overview without changing month selection.
  - Keyboard activation opens and closes the detail modal.
  - Empty month still shows a clear no-records state.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: The slice needs a small design decision on client/server component boundaries, record detail data shape, dialog ownership, and test selectors. The table wrapper decision is resolved: render `RecordListDetail` directly.

## Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: This changes a primary dashboard review interaction and should refresh local_dev verification evidence.
- learning_loop_required: false
- learning_reason: This is a local MVP dashboard UX improvement without production analytics, experiment, or launch feedback channel selected.

## Open Questions

- Should the list continue to show only the current recent five records, or should this slice expand the panel to all records for the selected month?
- Which detail fields are mandatory in the first modal version if related member display names are not currently available in the component data?
- Should the item list use full-row buttons or a separate details icon/button for opening the modal?

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm the scope is limited to replacing the dashboard records table with an item list and read-only detail modal.
  - Confirm no edit/delete/correction behavior should be included in this slice.
  - Confirm whether the current recent-record limit should stay unchanged for prototype/spec.
- acceptance_signals:
  - Experience Prototype can start from this artifact without changing ledger domain behavior.
  - Behavior Spec can later define accessibility and modal scenarios without inventing additional product scope.
  - Technical Design can decide component boundaries from the approved interaction shape.
- unresolved_blockers:
  - Need reviewer approval before moving to Experience Prototype under the repository workflow.
- next_step:
  - Experience Prototype
