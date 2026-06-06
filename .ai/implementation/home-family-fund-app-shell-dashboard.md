---
id: impl-home-family-fund-app-shell-dashboard
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - web-foundation
  - exp-monthly-records-and-reports
  - impl-home-family-fund-access-hints
  - impl-home-family-fund-monthly-report-read-model
  - impl-home-family-fund-reimbursement-table-read-model
outputs:
  - ui_changes
  - visual_verification
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC16
    - AC18
    - AC21
    - AC22
  test_plan_items:
    - E2E Responsive workflows
    - Manual RWD visual review
reviewed_at:
---

# Implementation Log for App Shell Dashboard

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice replaces the placeholder home page with a mock-data authenticated dashboard shell that demonstrates the monthly report, records, reimbursement, category summary, pending recurring items, dark theme tokens, and responsive navigation.

## Implementation Cycles
| Cycle | Check | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | Next build and type-check | Passed | Replaced `src/app/page.tsx` placeholder with a domain-backed mock dashboard using existing read models and access hints | Uses mock data only; no auth/database integration. |
| 2 | Desktop and mobile screenshots | Found mobile fixed nav overlapping content in dev screenshot | Replaced fixed bottom nav with in-content mobile quick navigation | Avoided text overlap and kept RWD layout stable. |
| 3 | Production mobile screenshot | Passed visual check | Verified production server screenshot without Next dev indicator | Confirmed no app-owned overlay collision. |
| 4 | Mobile reachability preference | Pending verification | Reintroduced a fixed mobile bottom action bar with safe-area padding and page bottom spacing | Keeps primary actions near the thumb while preserving scroll access to lower content. |

## Coding Summary
- Added a desktop app shell with left navigation and a mobile fixed bottom action bar.
- Rendered Traditional Chinese monthly report UI using dark-first design tokens.
- Used `--income` and `--expense` via Tailwind color utilities for financial amounts and category bars.
- Composed mock data through `buildMonthlyReport`, `buildMonthlyReimbursementTable`, and `buildAccessHints`.
- Displayed confirmed totals, monthly records, reimbursement groups, category summaries, and pending recurring items.
- Used lucide icons for navigation and primary actions.

## Refactor Summary
- Replaced the initial placeholder page entirely. No shared component extraction was performed yet because this is the first concrete screen.

## Deviations
- This slice uses mock current member, records, categories, and occurrences.
- Google login, route guards, Prisma queries, mutations, and real navigation are not implemented.
- Currency is displayed as TWD in the mock UI; product currency remains a configurable production concern.

## Remaining Risks
- App shell needs real auth/session data before functional access is complete.
- Dashboard sections should be extracted once a second route or form reuses them.
- Mobile report density will need another review with real data volume.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm dashboard information hierarchy and mobile action placement.
  - Confirm mock TWD display is acceptable until currency config is implemented.
- must_check:
  - UI remains dark theme and Traditional Chinese.
  - Fixed mobile action bar keeps enough bottom spacing for scrollable content.
  - Mock data is not mistaken for persistence/auth integration.
- acceptance_signals:
  - Full local quality gate passes.
  - Desktop and mobile screenshots render without obvious overlap.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
