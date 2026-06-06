---
id: impl-home-family-fund-session-access
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-authenticated-household-access
  - exp-authenticated-household-access
  - impl-home-family-fund-member-management
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC3
    - AC4
  bdd_scenarios:
    - Unlinked Google account cannot access household data
  test_plan_items:
    - Integration Identity + command handlers
    - Contract auth/session boundary
reviewed_at:
---

# Implementation Log for Session Access

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds pure Google-identity-to-app-member access resolution before Better Auth, Google OAuth provider configuration, cookies/sessions, route guards, or UI login screens are implemented.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `session-access.test.ts` for Google subject mapping, email fallback, unauthenticated state, unlinked account, invited account, and disabled account | Failed on missing module, then passed | Added `src/modules/identity-access/session-access.ts` and extended `HouseholdMemberAccount` with `googleSubject` | Covers AC1 and AC2 at the domain/session contract level. |

## Coding Summary
- Added `resolveHouseholdAccess` to map a Google identity to an active app member.
- Preferred stable Google subject mapping and fell back to normalized email when subject has not been linked yet.
- Returned an `AuthenticatedMember` shape compatible with existing authorization rules.
- Returned a lightweight member profile for future app shell role/status display.
- Rejected unauthenticated, unlinked, invited, and disabled account states with explicit reasons.

## Refactor Summary
- Added optional `googleSubject` to `HouseholdMemberAccount`; existing member-management tests remain compatible.

## Deviations
- Google OAuth and Better Auth are not wired in this slice.
- Route guarding is not implemented in this slice.
- Email fallback is a local-dev/MVP bridge for member linking; production may require explicit subject linking after first successful sign-in.

## Remaining Risks
- Provider-specific email verification semantics must be reviewed during Google OAuth implementation.
- App routes still need server-side auth guards.
- Session/profile refresh after permission changes remains a future integration concern.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm email fallback is acceptable before explicit Google subject linking exists.
  - Confirm invited members should remain blocked until activated/linked.
- must_check:
  - Unlinked Google accounts cannot access household data.
  - Returned member shape works with existing authorization.
  - This slice does not claim OAuth/session wiring is complete.
- acceptance_signals:
  - Session access unit tests pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
