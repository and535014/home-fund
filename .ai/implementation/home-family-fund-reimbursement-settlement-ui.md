---
id: impl-home-family-fund-reimbursement-settlement-ui
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-reimbursement-settlement-ui
  - story-mvp-hardening-reimbursement-settlement-ui
  - exp-story-mvp-hardening-reimbursement-settlement-ui
  - arch-home-family-fund-reimbursement-settlement-ui
outputs:
  - tests
  - code_changes
  - architecture_alignment
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC3
    - AC4
    - AC5
    - AC6
    - AC7
    - AC8
    - AC9
  bdd_scenarios:
    - Finance manager settles a selected refundable expense
    - General member cannot settle reimbursements
    - Stale or invalid reimbursement selection is rejected
  test_plan_items:
    - Finance manager settles one expense
    - General member denied settlement
    - Empty selection guarded
    - Domain invalid selection checks
reviewed_at: 2026-06-18
---

# Implementation Log for Reimbursement Settlement UI

## Naming Trace

- story_id: story-mvp-hardening-reimbursement-settlement-ui
- implementation_id: impl-home-family-fund-reimbursement-settlement-ui
- verification_design_id: vd-home-family-fund-reimbursement-settlement-ui
- change_id: reimbursement-settlement-ui
- route_slug: /
- test_files:
  - e2e-db/reimbursement-settlement.spec.ts
  - src/modules/reimbursement/reimbursements.test.ts
- code_component_names:
  - ReimbursementSettlementPanel
  - markExpensesReimbursedAction
  - markExpensesReimbursedInDatabase
- analytics_event_names: none

## Delivery Profile
This implementation supports `local_dev` under the MVP profile. It proves the browser settlement workflow against controlled auth headers, deterministic E2E seed data, and the local Postgres-backed dashboard read model.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `e2e-db/reimbursement-settlement.spec.ts` finance-manager flow | Failed on missing selectable rows/action | Added DB command, server action, and interactive dashboard panel | Covers AC1-AC5 and the finance-manager BDD scenario. |
| 2 | Empty-selection browser assertion | Failed while `執行退款` was only a static icon button | Disabled settlement action until at least one expense is selected | Covers AC6 client guard; domain command still revalidates empty selection. |
| 3 | General-member browser assertion | Failed until controls were permission-gated in the panel | Rendered selection controls only when `canPerformReimbursement` is true | Covers AC7 UI behavior; domain command still enforces permission. |
| 4 | Targeted DB E2E after implementation | Initially exposed client hydration and selector issues, then passed | Added `allowedDevOrigins` for local E2E and a hydration readiness hook | Keeps client-only selection/dialog behavior deterministic under Next dev server. |

## Coding Summary
- Replaced the static dashboard reimbursement card with `ReimbursementSettlementPanel`.
- Added selectable expense rows grouped by payer, selected count/total, and a confirmation dialog.
- Added `markExpensesReimbursedAction` as the browser mutation boundary.
- Added `markExpensesReimbursedInDatabase`, which runs the existing reimbursement domain command and persists the batch/items/status update in one Prisma transaction.
- Added localized inline feedback for success, permission denial, empty selection, missing expense, non-refundable, and already-reimbursed results.
- Updated `next.config.ts` with `allowedDevOrigins: ["127.0.0.1"]` so local Playwright runs hydrate client components reliably against the configured base URL.

## Web Architecture Alignment

- architecture_artifact: .ai/technical-design/home-family-fund-reimbursement-settlement-ui.md
- route_or_layout_changes: Existing homepage dashboard remains the settlement entry point; no new route was added.
- page_or_feature_module_changes: Added app-local panel/action files for the dashboard reimbursement workflow.
- shared_component_changes: Reused existing Button, Card, Dialog, Alert, and Item primitives; no new shared UI layer was added.
- state_or_data_boundary_changes: Client owns selection/dialog state; server action owns mutation; dashboard read model refreshes after redirect.
- validation_boundary_changes: UI disables empty submission; domain command revalidates permission, empty selection, not-refundable, already-reimbursed, and missing ids.
- provider_or_cross_cutting_changes: No provider changes.
- metadata_or_navigation_changes: No navigation or metadata changes.
- error_loading_empty_state_changes: Added empty-state copy and localized inline feedback in the reimbursement section.
- accepted_duplication: Local currency formatting remains duplicated with the page until another reimbursement surface needs it.
- extraction_trigger_followed: No extraction yet; the architecture keeps dashboard-local UI acceptable for MVP.

## Refactor Summary
After the E2E was green, the hydration readiness implementation was refactored from an effect/setState pair to `useSyncExternalStore` so lint stays clean while preserving the same server/client readiness behavior.

## Deviations
- Direct server-action submission by a non-finance member is enforced by the domain/persistence command but not separately exercised through a forged browser form, because Next server action ids are not stable public API. The browser E2E verifies hidden controls for non-finance members, while existing domain tests cover permission denial.
- Invalid/stale selection remains covered by the existing reimbursement domain tests rather than a new DB E2E, keeping this slice focused on the browser settlement flow.

## Remaining Risks
- Reimbursement batch history is persisted but not yet visible in UI.
- Race-condition conflict feedback relies on domain revalidation before the transaction write; a simultaneous second settlement may surface as a Prisma uniqueness failure rather than a localized `already_reimbursed` result.
- Mobile viewport settlement interaction is not separately covered in this slice.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm the inline dashboard settlement workflow matches the MVP scope.
  - Confirm persisted `ReimbursementBatch` and `ReimbursementBatchItem` records are sufficient before adding batch history UI.
  - Confirm the accepted test split for non-finance direct action and invalid/stale selections.
- must_check:
  - Finance manager can select and confirm exactly one refundable expense.
  - Settled expense leaves the reimbursement table and pending totals.
  - Non-finance members do not see settlement controls.
  - Empty selection cannot be submitted from UI.
- acceptance_signals:
  - `pnpm type-check` passes.
  - `pnpm lint` passes.
  - `pnpm test` passes.
  - `pnpm test:e2e:db e2e-db/reimbursement-settlement.spec.ts` passes.
- unresolved_blockers:
  - None for verification runner.
- next_step:
  - verification-runner
