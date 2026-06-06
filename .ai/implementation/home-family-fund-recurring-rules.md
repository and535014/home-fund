---
id: impl-home-family-fund-recurring-rules
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-recurring-rules-and-confirmation
  - exp-recurring-rules-and-confirmation
  - impl-home-family-fund-ledger-entry-creation
  - impl-home-family-fund-category-management
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC3
    - AC13
    - AC14
    - AC15
  bdd_scenarios:
    - Immediate recurring expense posts to ledger
    - Reminder-based contribution waits for confirmation
  test_plan_items:
    - Unit recurring occurrence rules
    - Unit authorization decisions independent of UI
reviewed_at:
---

# Implementation Log for Recurring Rules

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds pure recurring schedule rules for monthly immediate posting and reminder confirmation before persistence, scheduler jobs, UI, or report integration are implemented.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `recurring-rules.test.ts` for recurring rule creation, permission denial, immediate posting, reminder creation, reminder confirmation, and duplicate month prevention | Failed on missing module, then passed | Added `src/modules/recurring-schedule/recurring-rules.ts` | Covers AC13-AC15. |
| 2 | Authorization test for `manage_recurring` | Passed after authorization extension | Added `manage_recurring` command and capability | Keeps recurring management flexible while admins remain allowed by default. |

## Coding Summary
- Added Recurring Schedule domain types for recurring rules and occurrences.
- Added recurring rule creation with amount, category, posting mode, day-of-month, and type-specific validation.
- Added immediate occurrence processing that creates a confirmed ledger record through the existing Fund Ledger command.
- Added reminder occurrence processing that creates a pending occurrence without a ledger record.
- Added reminder confirmation that creates a ledger record and marks the occurrence posted.
- Prevented duplicate occurrences for the same recurring rule and month.
- Extended Identity and Access with `manage_recurring`, default admin access, and explicit `manage_recurring` capability.

## Refactor Summary
- No broad refactor was performed. Recurring Schedule consumes Fund Ledger and Identity and Access through their existing module boundaries.

## Deviations
- No scheduler, background job, or database persistence is implemented in this slice.
- Recurring rule manager product role remains flexible through capability assignment instead of hard-coding finance-manager access.
- Skipped months and edited-rule historical behavior remain deferred.

## Remaining Risks
- Day-of-month handling is validated as 1-31, but months that do not contain the selected day need a later product rule.
- Confirmation currently creates records through the acting member's authorization; command handlers must preserve this behavior when persisted.
- Duplicate prevention is in-memory for this slice; Prisma already has a unique `[recurringRuleId, month]` guard for persistence.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm immediate versus reminder semantics match household expectations.
  - Confirm `manage_recurring` capability is acceptable for future flexible permission management.
- must_check:
  - Reminder occurrences do not create ledger records until confirmed.
  - Immediate occurrences create ledger records.
  - Duplicate rule/month occurrences are rejected.
- acceptance_signals:
  - Recurring unit tests pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
