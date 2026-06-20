---
id: remove-standalone-create-record-entry
stage: learning
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/remove-standalone-create-record-entry.md
  - .ai/prototype/remove-standalone-create-record-entry.md
  - .ai/spec/remove-standalone-create-record-entry.md
  - .ai/technical-design/remove-standalone-create-record-entry.md
  - .ai/implementation/remove-standalone-create-record-entry.md
  - .ai/verification/remove-standalone-create-record-entry.md
  - .ai/release/remove-standalone-create-record-entry-local-dev-readiness.md
outputs:
  - learning_questions
  - feedback_signals
  - review_cadence
  - follow_up_decision_criteria
trace_links:
  release:
    - .ai/release/remove-standalone-create-record-entry-local-dev-readiness.md
  verification:
    - .ai/verification/remove-standalone-create-record-entry.md
reviewed_at: 2026-06-20
---

# Remove Standalone Create Record Entry Learning Loop

## Learning Summary

- release_target: local_dev
- tracking_maturity: manual_feedback_and_smoke
- analytics_provider: not selected
- monitoring_provider: not selected
- decision: learning_signals_defined

This slice changes information architecture and modal state, not ledger domain rules. The learning goal is to confirm that removing standalone `/records` and create URLs makes the product clearer without making record creation harder to find.

## Learning Questions

| Question | Why it matters | Signal |
|---|---|---|
| Can users still find `新增收入` and `新增支出` from the homepage after sidebar `新增` is removed? | The homepage is now the only create-record entry surface. | Local reviewer can create one income and one expense without asking where to start. |
| Does removing `紀錄` / `/records` reduce duplication without creating confusion? | `/records` duplicated the overview page. | Reviewer does not look for a separate records page after seeing `總覽` and recent records. |
| Is the mobile footer action discoverable enough? | Mobile creation now depends on the homepage footer actions. | Reviewer can open the create dialog on a mobile-sized viewport from the footer within one attempt. |
| Does URL-free modal state feel predictable? | The modal no longer survives reload or deep-link query state. | Reviewer understands that reload closes the modal and does not expect `?create=...` links to open it. |
| Do reimbursement and recurring pages still feel complete without create buttons? | Create entry was intentionally removed from those pages. | Reviewer can complete or inspect reimbursement/recurring workflows without missing create-record actions there. |

## Manual Feedback Plan

- Reviewer profile: local app reviewer using existing seed or controlled-auth accounts.
- Review routes:
  - `/`
  - `/reimbursements?month=2026-06`
  - `/recurring?month=2026-06`
  - `/records`
  - `/records/new`
- Review tasks:
  - Create one income from desktop homepage.
  - Create one expense from desktop homepage.
  - Open create expense from mobile footer.
  - Reload while modal is open and confirm modal closes.
  - Visit reimbursement and recurring pages and confirm their workflows remain clear.
  - Visit removed routes and confirm default not-found is acceptable.

## Guardrails

- No report of needing a sidebar `新增` item to create records.
- No report of needing a separate `紀錄` page after the homepage was renamed to `總覽`.
- No unexpected create modal opening from query params.
- No permission regression: general members still cannot create records for others.
- No increase in local create-record validation confusion; missing-category errors remain visible in the modal.

## Operational Signals

- Automated checks remain the main local guardrail:
  - `corepack pnpm type-check`
  - `corepack pnpm lint`
  - `corepack pnpm build`
  - `pnpm test:e2e e2e/create-record.spec.ts`
- If local reviewers report UI confusion, add or update E2E only when the behavior can be stated as a stable acceptance criterion.
- No production telemetry or error monitoring is required for this local_dev slice.

## Follow-Up Decision Criteria

- If users cannot find create actions on the homepage, start a new Intent Intake for homepage action placement or wording.
- If users still expect `/records`, start a new Intent Intake for overview information architecture or route-level not-found handling.
- If mobile footer actions are hard to discover, start a new Intent Intake for mobile create affordance design.
- If the URL-free modal behavior causes workflow issues, start a new Intent Intake before reintroducing any route/query state.
- If no confusion is reported after local review, proceed to Artifact Compression for this completed slice.

## Review Gate

- decision: complete
- acceptance_signals:
  - Learning questions are tied to the accepted IA and modal-state changes.
  - Local feedback can be collected without adding analytics infrastructure.
  - Follow-up thresholds are explicit enough to route future work through Intent Intake.
- unresolved_blockers:
  - None for Artifact Compression.
- next_step:
  - Artifact Compression when the user is ready to close this slice.
