---
id: story-mvp-hardening-permission-matrix-browser-checks
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
    - Member permissions changed
    - Income recorded
    - Expense recorded
  business_outcomes:
    - Members can browse shared records while being prevented from editing or creating records outside their permissions.
  bounded_contexts:
    - Identity and Access
    - Fund Ledger
    - Responsive Web Experience
  impact_analysis:
    - .ai/impact-analysis/home-family-fund-mvp-hardening.md
  affected_code_areas:
    - src/modules/identity-access/authorization.ts
    - src/auth/server-current-member.ts
    - src/app/ledger-record-actions.ts
    - e2e/home.spec.ts
reviewed_at:
---

# MVP Hardening: Permission Matrix Browser Checks

## Delivery Profile
This completion story targets `local_dev` under the MVP release gate. It verifies that role/capability rules hold beyond pure unit tests and hidden UI controls.

## User Story
As a household admin or member, I want browser-level checks to prove role restrictions for record creation and reimbursement actions, so that command-level authorization is not accidentally bypassed by direct submissions.

## Domain Trace
| Type | ID / Name | Why It Matters |
|---|---|---|
| Policy | Authorization is command-level | UI hiding is insufficient; server actions must enforce rules. |
| Policy | General members act only on self-owned records | Prevents cross-member ledger creation. |
| Policy | Finance managers can create for others but cannot delete others' records | Protects MVP permission boundary. |

## Impact Trace
| Impact Area | Source | Story Constraint / Note |
|---|---|---|
| Authorization module | `src/modules/identity-access/authorization.ts` | Unit rules exist; browser/direct-action checks should prove integration. |
| Server actions | `src/app/ledger-record-actions.ts` | Direct submissions must reject unauthorized targets. |
| Impact analysis | `.ai/impact-analysis/home-family-fund-mvp-hardening.md` | Permission matrix browser checks are recommended after DB/auth foundations. |

## Draft Acceptance Criteria
- A general member can browse records but cannot create an income or expense for another member through browser or direct submission.
- A finance manager can create an income or expense for another member through browser or direct submission.
- A non-finance manager cannot perform reimbursement through direct action once reimbursement UI/action exists.
- Permission-denied feedback is visible and does not create or mutate ledger records.
- Tests use deterministic role/member fixtures and do not depend on external Google OAuth.

## Experience Design Need
- experience_design_required: true
- reason: Permission-denied states and disabled/hidden controls are visible user-facing behavior.
- user_facing_surfaces: Existing create-record dialog, future reimbursement action, permission error feedback.
- UX_risks: The UI must explain restrictions without exposing sensitive implementation details.

## Visual Model

- type: story_trace
- title: Permission Matrix Browser Check Trace
- nodes:
  - id: policy_command_auth
    label: Command-level authorization
    kind: domain_event
  - id: story_permission_browser
    label: Permission matrix browser checks
    kind: story
  - id: outcome_safe_permissions
    label: Safe role-bound workflows
    kind: business_outcome
  - id: code_authorize
    label: authorize + server actions
    kind: code_impact
  - id: xd_permission
    label: Permission feedback states
    kind: experience_design
- edges:
  - from: policy_command_auth
    to: story_permission_browser
    label: verified by
  - from: story_permission_browser
    to: outcome_safe_permissions
    label: supports
  - from: story_permission_browser
    to: code_authorize
    label: exercises
  - from: story_permission_browser
    to: xd_permission
    label: needs copy/state review

## Priority
P2. Important for trust, but should follow DB-backed dashboard and controlled auth/session foundations.

## Dependencies
- `story-mvp-hardening-db-backed-dashboard-e2e`
- `story-mvp-hardening-controlled-auth-session-e2e`
- Browser create-record flow for create permission checks.
- Reimbursement UI/action for reimbursement permission checks.

## Open Questions
- Should permission tests be split by workflow once reimbursement and recurring actions exist?

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm command-level checks are tied to real workflows, not only UI visibility.
- must_check:
  - Unauthorized direct submissions do not mutate data.
  - Permission errors are visible and localized.
- acceptance_signals:
  - Browser or direct-action E2E proves at least one allowed and one rejected role path.
- unresolved_blockers:
  - Some checks depend on future reimbursement/recurring action implementation.
- next_step:
  - experience-design
