---
id: review-ver-home-family-fund-reimbursement-settlement-ui
stage: workflow-review
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - ver-home-family-fund-reimbursement-settlement-ui
outputs:
  - review_decision
trace_links:
  target_artifact:
    - .ai/verification/home-family-fund-reimbursement-settlement-ui.md
  upstream_artifacts:
    - .ai/implementation/home-family-fund-reimbursement-settlement-ui.md
    - .ai/verification-design/home-family-fund-reimbursement-settlement-ui.md
    - .ai/stories/story-mvp-hardening-reimbursement-settlement-ui.md
    - .ai/experience-design/story-mvp-hardening-reimbursement-settlement-ui.md
    - .ai/architecture/home-family-fund-reimbursement-settlement-ui.md
    - .ai/ddd/home-family-fund.md
reviewed_at: 2026-06-18
---

# Reviewer Brief for Verification: Reimbursement Settlement UI

## Decision

- decision: approve
- recommended_next_step: close this local_dev story slice, then choose the next MVP hardening slice
- responsible_skill: story-slicing
- html_review_path: not_needed

## What Changed

- Reviewed `.ai/verification/home-family-fund-reimbursement-settlement-ui.md` against the verification checklist, project context, implementation log, verification design, story, experience design, architecture, and DDD rules.
- Confirmed the verification report supports `delivery_profile: mvp` and `release_target: local_dev`.
- Confirmed the report records test evidence, domain alignment, UX/access checks, deploy-readiness recommendation, accepted risks, and a complete Review Gate.

## Decisions Needed

- None blocking this story for `local_dev`.
- Before production or broader release, decide whether reimbursement batch history must be visible to users.
- Before production or concurrent-use testing, decide how to handle DB-level race/conflict feedback for simultaneous settlement.

## Must Check

- Finance manager can settle selected refundable member-paid expenses through the browser.
- Empty selection cannot submit.
- General member cannot access settlement controls, while server/domain authorization remains authoritative.
- Settled expenses leave reimbursement table totals.
- Verification does not claim production readiness.

## Acceptance Signals

- `pnpm type-check` passed.
- `pnpm lint` passed.
- `pnpm test` passed.
- `pnpm test:e2e:db e2e-db/reimbursement-settlement.spec.ts` passed.
- Source artifact Review Gate decision is `approve` with no unresolved blockers for `local_dev`.

## Findings

| Severity | Finding | Evidence | Suggested Action |
|---|---|---|---|
| none | Verification report is coherent enough to close this `local_dev` story slice. | `.ai/verification/home-family-fund-reimbursement-settlement-ui.md` includes frontmatter, test results, review findings, domain rule check, traceability, deploy-readiness recommendation, and Review Gate. | Approve. |
| accepted risk | Non-finance direct forged server-action submission is not browser-tested. | Verification report records this as accepted because Next server action ids are not stable public API; domain command enforces permission. | Keep accepted for MVP; add action/integration coverage if a stable mutation boundary is introduced. |
| accepted risk | Invalid/stale DB-level conflict coverage remains domain-level, not persistence-level. | Verification report cites domain tests and transaction code review but no DB integration race/conflict test. | Slice a future hardening item before production readiness or batch-history work. |
| low | Quality commands that each run `prisma generate` cannot be parallelized safely. | Verification run observed `EEXIST` on concurrent generated Prisma directories; sequential reruns passed. | Run quality gates sequentially or change scripts before parallel CI optimization. |

## Risks / Unknowns

- Batch history is persisted but not surfaced in UI.
- Mobile viewport behavior for dense reimbursement selection is not separately covered.
- Production readiness remains out of scope for `local_dev`.
- Future reimbursement/batch-history slicing should refresh code understanding because this implementation added a new app-local server action and persistence wrapper.

## Review Gate

- source_artifact_gate_present: yes
- reviewer_decision: approve
- unresolved_blockers: none for `local_dev`
- next_step: story-slicing
