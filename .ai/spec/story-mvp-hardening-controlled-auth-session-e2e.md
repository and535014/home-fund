---
id: story-mvp-hardening-controlled-auth-session-e2e
stage: story
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ddd-home-family-fund
  - cu-home-family-fund
  - ia-home-family-fund-mvp-hardening
outputs:
  - user_story
  - acceptance_criteria_draft
  - experience_design_need
trace_links:
  domain_events:
    - Member invited
    - Member account updated
    - Monthly records viewed
  business_outcomes:
    - Members can browse shared records while unauthorized accounts are blocked.
  bounded_contexts:
    - Identity and Access
    - Responsive Web Experience
  impact_analysis:
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
  affected_code_areas:
    - src/auth/server-current-member.ts
    - src/auth/current-member.ts
    - src/auth/current-member-data-source.ts
    - prisma/schema.prisma
    - e2e/home.spec.ts
reviewed_at:
---

# MVP Hardening: Controlled Auth Session E2E

## Delivery Profile
This completion story targets `local_dev` under the MVP release gate. It proves the app-owned member mapping boundary in browser flows without requiring external Google OAuth.

## User Story
As a household member or unrecognized Google user, I want browser tests to exercise linked, unlinked, and inactive account states through the current-member boundary, so that household data is protected by app authorization and not only by UI fixtures.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Policy | Google sign-in is required before app access | Functional pages must remain inaccessible before identity is resolved. |
| Policy | Google identity must map to an app member | A signed-in but unlinked account cannot view household data. |
| Context | Identity and Access | Owns session-to-member mapping and authorization state. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Auth/session boundary | `src/auth/server-current-member.ts` | Existing E2E header bypass is narrow and fixed; completion needs states closer to real current-member mapping. |
| Better Auth tables | `prisma/schema.prisma` | Controlled sessions may require deterministic User, Account, and Session rows. |
| E2E coverage | `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | Linked, unlinked, and inactive states are high-risk if only fixture tests exist. |

## Draft Acceptance Criteria
- A controlled E2E auth setup can represent a linked active member and show the dashboard.
- A controlled E2E auth setup can represent an unlinked Google account and show the account-not-recognized state.
- A controlled E2E auth setup can represent an inactive member and show the inactive account state.
- Unauthenticated users still see the Google sign-in gate and no household data.
- The controlled auth setup is disabled in production.
- The test documents whether it uses Better Auth-compatible rows, a test-only route, or a request header contract.

## Experience Design Need
- experience_design_required: false
- reason: This story verifies existing access states; it does not design new screens.
- user_facing_surfaces: Existing sign-in gate, account-not-linked state, inactive-member state, dashboard.
- UX_risks: Error copy must remain clear and not expose sensitive household data.

## Visual Model

- type: story_trace
- title: Controlled Auth Session E2E Trace
- nodes:
  - id: policy_sign_in
    label: Google sign-in required
    kind: domain_event
  - id: policy_member_mapping
    label: Google identity maps to member
    kind: domain_event
  - id: story_auth_e2e
    label: Controlled auth session E2E
    kind: story
  - id: code_current_member
    label: current-member boundary
    kind: code_impact
  - id: xd_access_states
    label: Existing access states
    kind: experience_design
- edges:
  - from: policy_sign_in
    to: story_auth_e2e
    label: verified by
  - from: policy_member_mapping
    to: story_auth_e2e
    label: verified by
  - from: story_auth_e2e
    to: code_current_member
    label: exercises
  - from: story_auth_e2e
    to: xd_access_states
    label: observes

## Priority
P1. This is high-risk but should follow DB-backed dashboard E2E unless dashboard access cannot be made reliable without it.

## Dependencies
- `story-mvp-hardening-db-backed-dashboard-e2e`
- Decision on Better Auth-compatible session rows versus a narrow test-only auth helper.

## Open Questions
- Should controlled auth insert Better Auth-compatible rows/cookies or keep a minimal test-only request/header contract?
- How much of external Google OAuth should remain manual for local_dev?

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm this story verifies member mapping without requiring real external OAuth.
- must_check:
  - Production cannot use the controlled auth bypass.
  - Unlinked and inactive states remain covered.
- acceptance_signals:
  - Browser tests prove access states through the same current-member boundary or a documented equivalent.
- unresolved_blockers:
  - Auth fixture strategy must be chosen before implementation.
- next_step:
  - architecture-planner
