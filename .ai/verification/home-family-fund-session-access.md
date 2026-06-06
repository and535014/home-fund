---
id: ver-home-family-fund-session-access
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - impl-home-family-fund-session-access
  - story-authenticated-household-access
  - exp-authenticated-household-access
outputs:
  - verification_result
  - test_results
  - findings
trace_links:
  implementation:
    - .ai/implementation/home-family-fund-session-access.md
  code:
    - src/modules/identity-access/session-access.ts
    - src/modules/identity-access/session-access.test.ts
    - src/modules/identity-access/member-management.ts
  acceptance_criteria:
    - AC1
    - AC2
    - AC3
    - AC4
reviewed_at:
---

# Verification Report for Session Access

## Scope
This verification result supports `local_dev` for the session access domain-contract slice only. It verifies mapping Google identity data to an active app member and rejecting unauthenticated, unlinked, invited, or disabled users before Better Auth, Google OAuth provider configuration, cookies/sessions, route guards, or login UI are implemented.

## Commands Run
| Command | Result |
|---|---|
| `corepack pnpm test` | Pass: 10 files, 53 tests |
| `corepack pnpm lint` | Pass |
| `corepack pnpm type-check` | Pass |
| `corepack pnpm build` | Pass |

## Findings
| Severity | Finding | Evidence | Disposition |
|---|---|---|---|
| Medium | OAuth/session runtime is not implemented. | `resolveHouseholdAccess` accepts already-verified Google identity input. | Accepted for domain slice; Better Auth/Google OAuth needs a dedicated implementation slice. |
| Low | Email fallback is less strict than subject linking. | Access can resolve by normalized email if subject is not linked. | Accepted for MVP linking bridge; production should explicitly persist Google subject after first verified sign-in. |

## Domain Rule Check
| Rule | Source | Result |
|---|---|---|
| Unauthenticated users cannot access functional pages | AC1 | Pass at contract level: null Google identity returns `unauthenticated`. |
| Google-authenticated account must map to app member | AC2, ADR-10 | Pass: unlinked identity returns `google_account_not_linked`. |
| Disabled or invited members cannot access household data | Identity and Access policy | Pass: non-active statuses return `member_not_active`. |
| Authorization receives current member roles/capabilities | AC3, AC4 | Pass: success result returns `AuthenticatedMember` shape for existing authorization rules. |
| Member role/status can be shown in app shell | Experience design | Pass: success result includes lightweight profile data. |

## Code Review
- Boundary alignment: Pass. Session access lives in Identity and Access and does not depend on UI or persistence.
- Maintainability: Pass. Explicit result reasons map cleanly to login/account-not-recognized UI states.
- Correctness: Pass with accepted risks. Tests cover subject mapping, email fallback, and denied account states.
- UX alignment: Partial. Domain errors support future login/access-denied screens, but no UI exists.
- Code map freshness: Potentially stale because Identity and Access gained session access resolution. Refresh code understanding before broad architecture/deploy review if needed.

## Traceability
| Implementation Item | Test Plan Item | BDD Scenario | AC | Story |
|---|---|---|---|---|
| `resolveHouseholdAccess` null identity rejection | Auth/session boundary | Unlinked Google account cannot access household data | AC1 | Authenticated Household Access |
| Google subject/email member lookup | Identity + command handlers | Unlinked Google account cannot access household data | AC2 | Authenticated Household Access |
| Active member projection to `AuthenticatedMember` | Auth/session boundary | Admin can manage member permissions; later actions reflect permissions | AC3, AC4 | Authenticated Household Access |

## Result
Pass with accepted risks. This slice is ready for the next implementation cycle. Remaining work includes Better Auth configuration, Google OAuth provider setup, route guards, member subject-link persistence, login UI, and E2E auth flows.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm invited/disabled account handling before OAuth UI work.
  - Confirm email fallback is acceptable only as an MVP bridge.
- must_check:
  - The report does not claim OAuth or route guarding is complete.
  - Unlinked Google accounts remain blocked.
  - Returned member shape remains compatible with authorization tests.
- acceptance_signals:
  - Full local quality gate passes.
  - Verification trace maps session access behavior to AC1-AC4.
- unresolved_blockers:
  - None for continuing implementation.
- next_step:
  - implementation-cycle
