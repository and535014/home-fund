---
id: impl-recurring-reminder-confirmation-ui
stage: implementation
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - spec-recurring-reminder-confirmation-ui
  - td-recurring-reminder-confirmation-ui
  - proto-recurring-reminder-confirmation-ui
outputs:
  - tests
  - code_changes
  - architecture_alignment
  - verification_notes
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
    - AC10
  bdd_scenarios:
    - Finance manager confirms Kai's pending living-fee reminder
    - General member cannot confirm another member's reminder
    - Already posted reminder cannot be confirmed again
    - Dashboard has no pending reminders after successful confirmation
reviewed_at: 2026-06-18
---

# Implementation Log for Recurring Reminder Confirmation UI

## Delivery Profile
This implementation supports `local_dev` under the MVP profile. It completes the dashboard workflow for confirming existing reminder-mode recurring occurrences through controlled auth, server actions, Prisma persistence, and the DB-backed dashboard read model.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `recurring-rules.test.ts` permission and note/name cases | Failed until domain failure mapping was explicit | `confirmRecurringOccurrence` now returns `permission_denied` with authorization reason when ledger creation authorization fails | Covers AC8 and the chosen permission policy. |
| 2 | `recurring-confirmation-command.test.ts` transaction success/missing/permission/stale cases | Failed until persistence command existed | Added `confirmRecurringOccurrenceInDatabase` with one transaction and rollback-on-stale behavior | Covers AC5, AC7, and architecture transaction requirement. |
| 3 | `home-dashboard-data-source.test.ts` pending reminder detail mapping | Failed until dashboard query included rule/category relation data | Added `pendingRecurringReminders` data shape with name, amount, date, category, and target member id | Covers AC1-AC2. |
| 4 | `home-access.test.ts` finance-manager/general-member confirmation hints | Failed until access view derived `canConfirm` from ledger creation permission | Added pending reminder view mapping with target member name and `canConfirm` | Covers AC3 and AC8 UI visibility. |
| 5 | `e2e/recurring-reminder-confirmation.spec.ts` browser success/denial scenarios | Failed until E2E used a dedicated port and isolated Next dev dir | Added `confirmRecurringReminderAction`, `RecurringReminderConfirmationPanel`, and E2E port isolation | Covers finance-manager success and general-member denial through the browser. |

## Coding Summary
- Added `confirmRecurringOccurrenceInDatabase` to load occurrence/rule/category data, call the recurring domain function, create the ledger record, and mark the occurrence posted in one Prisma transaction.
- Updated recurring domain confirmation to preserve ledger authorization failures as `permission_denied` instead of hiding them behind `ledger_record_creation_failed`.
- Extended dashboard data loading with `pendingRecurringReminders` so UI can show rule note/name, amount, expected date, category, and target member.
- Extended `home-access` to compute `canConfirm` with the same ledger creation authorization used server-side.
- Added `confirmRecurringReminderAction` with controlled current-member resolution, redirect feedback, and dashboard revalidation.
- Replaced the static `待確認週期項目` card with `RecurringReminderConfirmationPanel`, including confirmation dialog, empty state, disabled hydration state, and localized inline feedback.
- Added DB-backed Playwright coverage for finance-manager confirmation and general-member no-control behavior.
- Updated Playwright config to run the DB-backed E2E suite on dedicated port `3100` and `.next-e2e`, so it no longer conflicts with an existing port 3000 dev server.
- Added E2E fixtures and script wrappers so each browser test gets a clean seed while Next-managed type files are restored after the E2E dev server stops.

## Web Architecture Alignment
- architecture_artifact: `.ai/technical-design/recurring-reminder-confirmation-ui.md`
- route_or_layout_changes: Existing homepage dashboard remains the entry point; no new route was added.
- page_or_feature_module_changes: Added app-local pending reminder panel and server action.
- shared_component_changes: Reused existing Button, Card, Dialog, Alert, Badge, and Item primitives.
- state_or_data_boundary_changes: Client owns dialog state; server action owns authorization and mutation; dashboard reload proves persistence.
- validation_boundary_changes: UI uses `canConfirm` for visibility; server action and domain remain authoritative.
- provider_or_cross_cutting_changes: No auth provider or global provider changes.
- metadata_or_navigation_changes: No navigation or metadata changes.
- error_loading_empty_state_changes: Added localized confirmation, permission, stale, missing, and validation feedback.
- accepted_duplication: Ledger record Prisma create-data mapping is duplicated locally in the recurring command to preserve the single transaction boundary.

## Verification Evidence
| Command | Result | Notes |
|---|---|---|
| `corepack pnpm vitest run src/modules/recurring-schedule/recurring-rules.test.ts src/modules/recurring-schedule/recurring-confirmation-command.test.ts` | passed | 12 tests. |
| `corepack pnpm vitest run src/modules/recurring-schedule/recurring-rules.test.ts src/modules/recurring-schedule/recurring-confirmation-command.test.ts src/app/home-dashboard-data-source.test.ts src/app/home-access.test.ts` | passed | 22 tests. |
| `corepack pnpm type-check` | passed | Prisma generate + `tsc --noEmit`. |
| `corepack pnpm test` | passed | 25 files, 113 tests. |
| `corepack pnpm lint` | passed | Prisma generate + ESLint. |
| `sh e2e/setup-db.sh` | passed with escalation | Sandbox could not access Docker; rerun outside sandbox succeeded. |
| `corepack pnpm test:e2e -- e2e/recurring-reminder-confirmation.spec.ts` | passed | 2 DB-backed browser tests passed on dedicated E2E port `3100`. |
| `corepack pnpm test:e2e` | passed | 19 DB-backed browser tests passed with per-test DB reset. |

## Deviations
- General-member self-confirmation is covered by the domain/authorization model; the seeded browser scenario covers general-member denial for Kai's reminder.

## Remaining Risks
- The current persistence command rolls back stale confirmation through an internal error; verification runner should still inspect behavior against a real database transaction.
- Existing seed already contains `income-living-june`, so browser assertions must distinguish the newly confirmed `Kai 每月生活費提醒` row.
- Full DB E2E is stable but slower because each test resets the database to avoid cross-test mutation pollution.

## Review Gate
- decision: ready_for_verification
- owner: verification-runner
- reviewer_focus:
  - Confirm the dashboard interaction matches the accepted prototype.
  - Re-run DB-backed recurring confirmation E2E on the dedicated E2E port if needed.
  - Inspect the transaction behavior against real Prisma/Postgres.
- must_check:
  - Finance manager can confirm `occurrence-living-kai`.
  - General member cannot confirm Kai's reminder.
  - Confirmed occurrence links to exactly one ledger record.
  - Pending reminder disappears and dashboard totals include the created record.
- unresolved_blockers:
  - None for verification runner.
- next_step:
  - verification-runner
