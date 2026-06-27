---
id: learning-refund-page-production-v0.1.6
stage: learning-loop
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
created_at: 2026-06-27
updated_at: 2026-06-27
inputs:
  - .ai/intent/refund-page.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/refund-page.md
  - .ai/prototype/refund-page.md
  - .ai/spec/refund-page.md
  - .ai/technical-design/refund-page.md
  - .ai/implementation/refund-page.md
  - .ai/verification/refund-page.md
  - .ai/release/refund-page-production-readiness.md
  - .ai/deployment/production-v0.1.6-2026-06-27.md
outputs:
  - production_learning_questions
  - production_signals
  - fallback_tracking_plan
  - follow_up_decision_criteria
trace_links:
  deployment:
    - .ai/deployment/production-v0.1.6-2026-06-27.md
  release:
    - .ai/release/refund-page-production-readiness.md
  verification:
    - .ai/verification/refund-page.md
  behavior:
    - .ai/spec/refund-page.md
  domain_impact:
    - .ai/domain-impact/refund-page.md
  production:
    tag: v0.1.6
    commit: b0a5d72f0474da4c3cc4efe23004bdd2fc0b7597
    url: https://home-fund-yt.vercel.app
reviewed_at:
---

# Refund Page Production v0.1.6 Learning Loop

## Decision Summary

- decision: production_learning_signals_defined
- release_target: production
- deployed_version: `v0.1.6`
- production_url: `https://home-fund-yt.vercel.app`
- delivery_profile: mvp
- product_analytics_provider: not_configured
- error_monitoring_provider: not_configured
- logging_provider: Vercel runtime logs expected, but not reviewed for this smoke pass
- feedback_channels: maintainer/household feedback in this workflow thread or follow-up intent notes
- tracking_maturity: manual_smoke_and_workflow_evidence
- next_gate: Artifact Compression after review, unless a follow-up is selected as active work.

This learning loop starts from the questions and risks left by production deployment `v0.1.6`: the refund page shipped and core smoke passed, but observability remains MVP-manual and incomplete.

## Production Learning Questions

| Question | Linked Outcome / Risk | Signal |
|---|---|---|
| Can household users find the dedicated refund workspace from the home `待退款` block and desktop sidebar? | Intent success criteria: home `前往退款`, desktop `退款` below `搜尋`. | Manual production smoke passed; collect any user report that they still look for refund work in `/search` only. |
| Does hiding `退款` from the mobile bottom tab keep mobile navigation focused without making refund work undiscoverable? | AC 11-12 and domain decision: device-specific navigation is presentation policy, not authorization. | Manual mobile smoke passed; track any feedback asking for a mobile refund entry. |
| Do users understand `未退款支出紀錄` versus `退款紀錄` as unpaid expenses versus reimbursement payment evidence? | Domain rule: refund records are payment evidence, not ordinary ledger records. | User can explain the difference during support/review; no feedback that refund records changed income/expense totals. |
| Do finance-capable users trust the batch refund selection summary and cross-member warning? | AC 47-61; ReimbursementBatch invariant: same paid-to member per MVP payment evidence. | Manual smoke confirmed warning/disabled cross-member confirm; safe same-member production mutation remains optional when test data exists. |
| Does `/refunds` remain operational after production traffic and real data shape? | Release risks: broad read-model/detail-flow changes; no production monitoring provider. | Vercel logs reviewed for `/refunds`, Prisma, auth, and server-action errors; currently not reviewed. |
| Is the production deployment recoverable if data or app behavior regresses? | Release risk: no attached backup/restore or PITR evidence. | Neon backup/restore or PITR path is confirmed; currently not tested. |
| Is the current manual-only observability posture acceptable for the household MVP? | Deployment gap: monitoring/error reporting provider not configured. | Maintainer explicitly accepts manual Vercel-log review cadence, or opens a monitoring setup intent. |

## Production Signals

| Signal | Source | Linked Requirement / Risk | Current State | Follow-Up Trigger |
|---|---|---|---|---|
| Production deployment workflow success | GitHub Actions run `28284994733` | Release execution and tag-based deploy policy | Passed | Any failed deploy blocks compression until recorded. |
| Production URL opens app | Maintainer smoke at `https://home-fund-yt.vercel.app` | Release evidence | Passed | URL mismatch or Vercel auth page requires release-execution amendment. |
| Google sign-in starts and admin reaches dashboard | Maintainer smoke | Auth and production OAuth readiness | Passed | Any sign-in failure becomes incident/fix intent. |
| Non-admin is blocked from admin-only routes | Maintainer smoke | Identity and Access guardrail | Passed | Any role leak becomes immediate fix intent. |
| Home-to-refund and desktop refund navigation | Maintainer smoke | Intent and AC 7-12 | Passed | Users cannot find refund page. |
| Mobile bottom tab omits `退款` | Maintainer smoke | AC 11 and mobile IA decision | Passed | Mobile users need direct refund entry. |
| `/refunds` tabs, lists, detail dialogs, selection summary | Maintainer smoke | AC 13-52 | Passed | Broken readback, missing list data, or confusing labels. |
| Cross-member batch refund warning/disabled confirm | Maintainer smoke | AC 55, same-member policy | Passed | Cross-member selection can be submitted or users cannot understand warning. |
| Main dashboard/search production data read | Maintainer smoke | Regression guardrail for core ledger/reporting | Passed | Prisma/read-model errors or missing production records. |
| Same-member production batch refund mutation | Optional safe production smoke | AC 56-61 and no-double-count policy | Not run unless safe data exists | Required before broader household rollout if finance users will immediately settle real expenses. |
| Vercel runtime logs after deploy | Vercel logs | Operational health and server error detection | Not reviewed | Any `/refunds`, auth, Prisma, or server-action errors need fix or rollback decision. |
| Neon backup/restore or PITR path | Neon console/runbook | Rollback and data recovery | Not tested | Must be confirmed before destructive migrations or broader use. |
| Error monitoring provider | Product/ops decision | Production observability maturity | Not configured | Add monitoring intent if manual log review becomes too weak. |

## Fallback Tracking Plan

Until product analytics and error monitoring are configured, use lightweight/manual tracking:

- Review Vercel runtime logs after each production deploy and again after the first real household refund-page use.
- Record any production smoke or support notes in this workflow thread or a follow-up `.ai/intent/` artifact.
- Use GitHub Actions run evidence as the authoritative deploy/build/migration trail.
- Use manual household feedback for findability, copy clarity, refund-record understanding, and mobile discoverability.
- Use Neon console evidence or runbook notes for backup/restore/PITR confirmation.

Do not collect sensitive financial details in analytics or notes. If lightweight events are added later, use coarse event names and buckets only; do not log record names, notes, member emails, exact transaction descriptions, or household-private details.

## Guardrails

| Guardrail | Why It Matters | Escalation |
|---|---|---|
| Refund records never change ordinary income/expense totals | Protects reimbursement evidence from double-counting. | Immediate fix intent if totals change after refund evidence appears. |
| Batch refund mutation remains finance/admin-only | Protects household financial state. | Immediate fix intent if a general member can mutate reimbursement status. |
| Cross-member batch selection cannot confirm as one payment | Maintains MVP payment evidence invariant. | Immediate fix intent if one payment records multiple paid-to members. |
| `/refunds` remains authenticated and household-scoped | Protects private financial data. | Incident/fix intent if unauthenticated or cross-household data is exposed. |
| Production migrations stay tag/workflow-controlled | Keeps release audit and rollback coherent. | Stop release execution if migrations are run manually against production. |
| Backup/restore or PITR is known before destructive migrations | Prevents data loss during future schema changes. | Block future destructive production release until evidence exists. |

## Review Cadence

- Immediate: review Vercel runtime logs for `v0.1.6` deployment once, focusing on `/refunds`, auth callback, Prisma, and reimbursement server actions.
- First-use: after the first real household user uses `/refunds`, collect whether they found the page, understood unpaid versus refunded sections, and trusted selection totals.
- First finance action: if safe real data exists, observe one same-member batch refund and confirm no double-counting; otherwise keep this as deferred evidence.
- Pre-next-production-release: confirm Neon backup/restore or PITR path, and decide whether manual Vercel logs are still acceptable.
- Monthly during MVP: revisit whether monitoring/error reporting should be added before broader household use.

## Follow-Up Decision Criteria

- Create a new Intent Intake for monitoring/error reporting if Vercel logs are hard to review, any production error is missed, or usage grows beyond maintainer-operated MVP.
- Create a new Intent Intake for backup/restore readiness if the next production release includes destructive migrations, data model risk, or broader household adoption.
- Create a new Intent Intake for mobile refund navigation if users cannot discover `/refunds` without a bottom-tab entry.
- Create a new Intent Intake for refund-record correction/reversal if users need to fix or undo payment evidence after production use.
- Create a new Intent Intake for split/cross-member batch reimbursement if finance users repeatedly select multiple paid-to members together.
- Return to TDD Implementation if production feedback shows incorrect totals, broken detail dialogs, failed read models, or authorization leaks.
- Proceed to Artifact Compression if the reviewer accepts manual/log-based MVP tracking and no active follow-up is selected now.

## Review Gate

- status: review
- recommended_decision: approve_for_artifact_compression_with_open_operational_followups
- reviewer_focus:
  - Confirm manual/log-based tracking is acceptable for the MVP.
  - Confirm monitoring and backup/PITR are tracked as follow-up criteria, not silently considered complete.
  - Confirm no immediate fix intent is required before compression.
- must_check:
  - Production smoke evidence in `.ai/deployment/production-v0.1.6-2026-06-27.md` remains accurate.
  - Any selected follow-up becomes a new Intent Intake before compression.
  - Archive compression must preserve open operational gaps and not imply monitoring or backup readiness.
- next_step:
  - Artifact Compression after review approval, or Intent Intake if monitoring/backup/mobile/refund-correction follow-up is selected as active work.
