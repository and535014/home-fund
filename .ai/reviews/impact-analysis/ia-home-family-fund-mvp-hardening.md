---
id: review-ia-home-family-fund-mvp-hardening
stage: workflow-review
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ia-home-family-fund-mvp-hardening
outputs:
  - review_decision
  - optional_static_html
trace_links:
  target_artifact: .ai/impact-analysis/home-family-fund-mvp-hardening.md
  upstream_artifacts:
    - .ai/code-understanding/home-family-fund.md
    - .ai/ddd/home-family-fund.md
    - .ai/verification-design/home-family-fund-mvp.md
reviewed_at: 2026-06-07
---

# Reviewer Brief for MVP Hardening Impact Analysis

## Decision

- decision: approve
- recommended_next_step: story-slicing for a story completion backlog, starting with DB-backed dashboard E2E.
- responsible_skill: story-slicing
- html_review_path: .ai/reviews/html/ia-home-family-fund-mvp-hardening.html

## What Changed

- The impact analysis reframes the current state as MVP hardening, not a new domain feature.
- It identifies the gap between fixture-based E2E and real local-dev browser/database confidence.
- It recommends completion-oriented slices: DB-backed dashboard E2E, controlled auth/session E2E, browser create-record flow, permission matrix, reimbursement settlement UI, recurring confirmation UI, and deploy readiness.

## Decisions Needed

- Choose local test database lifecycle before slicing DB-backed E2E.
- Decide whether controlled auth/session E2E inserts Better Auth-compatible rows or keeps a narrow non-production test override.
- Keep production deploy readiness separate until the target environment is selected.

## Must Check

- Existing 9 stories should remain as capability boundaries.
- New slices should be completion slices that close missing UI, persistence, or E2E proof.
- Fixture E2E must not be counted as DB/OAuth coverage.

## Acceptance Signals

- Story slicing can produce a prioritized completion backlog without inventing new domain scope.
- First slice can be scoped to DB-backed dashboard E2E with explicit test database assumptions.
- Later slices can distinguish feature gaps from verification gaps.

## Findings

| Severity | Finding | Evidence | Suggested Action |
|---|---|---|---|
| P1 | Story slicing needs a completion-backlog framing, not a fresh rewrite of the original story set. | User concern: prior stories are sliced but partially incomplete; impact analysis lists candidate hardening slices. | In story-slicing, create completion slices linked back to the original 9 stories. |
| P1 | DB-backed E2E is the right first slice but needs a database lifecycle decision. | Impact analysis blocker: choose reset/seed, isolated DB/schema, or disposable Postgres. | Decide lifecycle in the first completion story's constraints. |
| P2 | Auth/session hardening remains high risk but should not block DB-backed dashboard read coverage if a narrow fixture is retained. | Impact analysis separates fixture smoke, controlled auth/session E2E, and DB-backed E2E. | Slice auth/session after DB-backed dashboard unless dashboard data cannot be accessed reliably. |
| P2 | Production deployment should not be merged into local MVP hardening. | Impact analysis marks production deploy slicing blocked by target environment. | Keep deploy-readiness as a later separate artifact once Vercel/Neon or another target is confirmed. |

## Risks / Unknowns

- Test DB lifecycle is still undecided.
- Better Auth-compatible browser session strategy is still undecided.
- Reimbursement and recurring confirmation UI interaction patterns need product confirmation before implementation.
- Completion status of each original story is not yet captured in a single audit table.

## Review Gate

- source_artifact_gate_present: yes
- reviewer_decision: approve
- unresolved_blockers:
  - Production deploy story slicing remains blocked pending target environment.
  - DB-backed E2E slicing needs a local test DB lifecycle choice, but this does not block story-slicing.
- next_step: story-slicing
