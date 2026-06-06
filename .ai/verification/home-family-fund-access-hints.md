---
id: ver-home-family-fund-access-hints
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-access-hints
  - story-authenticated-household-access
  - exp-authenticated-household-access
outputs:
  - verification_result
  - test_results
  - findings
trace_links:
  implementation:
    - .ai/implementation/home-family-fund-access-hints.md
  code:
    - src/modules/identity-access/access-hints.ts
    - src/modules/identity-access/access-hints.test.ts
    - src/modules/identity-access/authorization.ts
  acceptance_criteria:
    - AC3
    - AC5
    - AC6
    - AC19
reviewed_at:
---

# Verification Report for Access Hints

## Scope
This verification result supports `local_dev` for the role-aware access hints slice only. It verifies UI-facing navigation/action hints derived from command authorization rules before app shell navigation, route guards, or permission-denied UI are implemented.

## Commands Run
| Command | Result |
|---|---|
| `corepack pnpm test` | Pass: 11 files, 58 tests |
| `corepack pnpm lint` | Pass |
| `corepack pnpm type-check` | Pass |
| `corepack pnpm build` | Pass |

## Findings
| Severity | Finding | Evidence | Disposition |
|---|---|---|---|
| Low | Access hints are advisory and not enforcement. | `buildAccessHints` returns booleans for UI use. | Accepted; all command handlers must still call `authorize`. |
| Low | Navigation model may need refinement once UI routes exist. | Route names are currently conceptual hints. | Accepted until app shell implementation. |

## Domain Rule Check
| Rule | Source | Result |
|---|---|---|
| UI visibility must not replace command authorization | AC3, ADR-2 | Pass: hints are derived from `authorize`, not separate policy logic. |
| General members can browse and create/edit/delete own records | AC6 | Pass: general member hints include browse/self actions only. |
| Finance managers can edit/create for others and reimburse but not delete others | AC5 | Pass: finance manager hints reflect the MVP delete restriction. |
| Admins can manage members/categories/recurring and delete others | AC4, AC5 | Pass: admin hints include management and delete-other actions. |
| Explicit capabilities affect future UI affordances | Category/recurring decisions | Pass: `manage_categories` and `manage_recurring` capabilities are reflected. |

## Code Review
- Boundary alignment: Pass. Access hints live in Identity and Access and call the same authorization boundary as command handlers.
- Maintainability: Pass. Hints are separated into navigation and action groups for future app shell use.
- Correctness: Pass with accepted risks. Tests cover main role/capability combinations and unlinked Google account behavior.
- UX alignment: Partial. The shape supports role-aware UI, but no screen state or focus behavior is implemented.
- Code map freshness: Potentially stale because Identity and Access gained access-hints projection. Refresh code understanding before broad architecture/deploy review if needed.

## Traceability
| Implementation Item | Test Plan Item | BDD Scenario | AC | Story |
|---|---|---|---|---|
| General member hints | Contract auth/session boundary | Permission denied state | AC6, AC19 partial | Authenticated Household Access |
| Finance manager hints | Unit authorization decisions independent of UI | Admin can manage member permissions | AC5 | Authenticated Household Access |
| Admin/capability hints | Contract auth/session boundary | Admin can manage member permissions | AC4, AC5 | Authenticated Household Access |

## Result
Pass with accepted risks. This slice is ready for the next implementation cycle. Remaining work includes actual app shell navigation, route guards, permission-denied UI, and E2E coverage.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm reimbursement route visibility versus settlement action separation.
  - Confirm hints shape is sufficient before app shell UI work.
- must_check:
  - The report does not claim authorization enforcement is replaced by hints.
  - Hints remain derived from authorization.
  - Future UI still handles direct permission denial states.
- acceptance_signals:
  - Full local quality gate passes.
  - Verification trace maps hints to AC3, AC5, AC6, and AC19 partial.
- unresolved_blockers:
  - None for continuing implementation.
- next_step:
  - implementation-cycle
