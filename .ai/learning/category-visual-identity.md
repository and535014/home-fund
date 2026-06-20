---
id: learning-category-visual-identity
stage: learning
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-visual-identity.md
  - .ai/spec/category-visual-identity.md
  - .ai/technical-design/category-visual-identity.md
  - .ai/implementation/category-visual-identity.md
  - .ai/verification/category-visual-identity.md
  - .ai/release/category-visual-identity-local-dev-readiness.md
outputs:
  - learning_questions
  - manual_feedback_signals
  - guardrails
  - follow_up_decision_criteria
trace_links:
  release:
    - .ai/release/category-visual-identity-local-dev-readiness.md
  verification:
    - .ai/verification/category-visual-identity.md
reviewed_at: 2026-06-20
---

# Category Visual Identity And Ordering Learning Loop

## Learning Summary

- release_target: local_dev
- tracking_maturity: manual_feedback_and_smoke
- analytics_provider: not selected
- monitoring_provider: not selected
- decision: learning_signals_defined

This slice changes category recognition, ordering, and cross-surface display. For `local_dev`, the learning goal is to confirm that admins can maintain category visual identity/order comfortably and that members can scan/select categories faster without losing clarity or accessibility.

## Learning Questions

| Question | Why it matters | Signal |
|---|---|---|
| Can admins understand color and icon choices without extra explanatory copy? | The create/edit UI intentionally removed descriptive text and previews. | Reviewer can create and edit a category visual identity without asking what the controls do. |
| Does two-column active category management feel clearer than tabs? | The page no longer exposes archived categories or active/archived tabs. | Reviewer can find active expense and income categories immediately and does not look for archived category management in this flow. |
| Does drag-handle-only sorting feel discoverable enough? | Sorting is restricted to the handle by design. | Reviewer can reorder categories after seeing the handle, and row/body/action dragging does not feel broken. |
| Does the configured order improve new-record category selection? | Category order exists primarily to affect record creation. | Reviewer confirms frequently used categories can be moved earlier and appear in that order in the create-record dialog. |
| Are icon-only record list category marks understandable enough? | Record rows intentionally hide the category name in the media area. | Reviewer can still understand records from visual context and detail dialog category text remains clear. |
| Does dashboard category summary color help scanning without becoming noisy? | Category colors now appear in summary labels and bars. | Reviewer finds the dashboard summary easier to scan and does not report visual overload. |
| Do fixed-header/footer dialogs feel better when content overflows? | Dialog content should scroll independently while header/footer stay stable. | Reviewer can scroll long dialog bodies without losing title or actions. |
| Is single-line note input sufficient for record creation? | Notes were changed from textarea to Input. | Reviewer can enter typical short notes; longer-note need becomes an explicit future request. |

## Manual Feedback Plan

- Reviewer profile: local app reviewer using seeded admin, finance manager, and general member accounts.
- Review routes:
  - `/settings/categories`
  - `/?month=2026-06`
- Review tasks:
  - Create a new expense category with a selected color and icon.
  - Edit an existing category name/color/icon.
  - Reorder categories with the pointer handle.
  - Reorder categories with keyboard focus on the handle and ArrowUp/ArrowDown.
  - Open the create-record dialog and confirm category order/visual marks.
  - Create a record with a one-line note and inspect the record detail dialog.
  - Archive a category and confirm it disappears from active panels and new-record category choices.
  - Review dashboard category summaries and record list category marks.

## Guardrails

- Category create/edit/reorder remains admin-only.
- Invalid color, icon, and reorder payloads remain rejected server-side.
- Archived categories do not appear in category management panels or new-record choices.
- Historical records and dashboard summaries remain readable after category edits.
- Dialog scrolling keeps header/footer stable.
- Create-record note input continues to submit `note` as normal form data.
- Local development still requires Docker/Postgres for E2E and migration smoke checks.

## Operational Signals

Automated local guardrails:

- `corepack pnpm lint`
- `corepack pnpm type-check`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm db:validate`
- `corepack pnpm test:e2e`
- Focused smoke when iterating on record dialogs: `sh e2e/setup-db.sh && sh e2e/run-playwright.sh e2e/create-record.spec.ts`

Manual signals:

- Reviewer notes on whether color/icon choices are enough.
- Reviewer notes on reorder discoverability.
- Reviewer notes on record list icon-only comprehension.
- Reviewer notes on whether single-line note input is too restrictive.
- Reviewer notes on dialog scroll behavior with small viewport height.

## Follow-Up Decision Criteria

- If users need more color/icon options, start a new Intent Intake for category visual palette/icon expansion.
- If drag sorting is confusing, start a new Intent Intake for reorder affordance or explicit ordering controls.
- If keyboard reorder is hard to discover, start a new Intent Intake for accessible reorder interaction polish.
- If record rows are less clear without visible category names, start a new Intent Intake for record list category display alternatives.
- If single-line notes are insufficient, start a new Intent Intake to restore multiline notes or add an expandable note field.
- If dialog description warnings need to be eliminated for accessibility review, start a small accessibility hardening slice for hidden descriptions or explicit `aria-describedby` policy.
- If no local review issues are found, proceed to Artifact Compression for this completed slice.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - confirm manual learning questions reflect what you want to review locally
  - confirm no analytics/monitoring tooling is needed for this local_dev slice
  - confirm Artifact Compression should be next if no follow-up slice is needed
- unresolved_blockers:
  - None for Artifact Compression after approval.
- recommended_next_gate:
  - artifact-compression
- stop_condition: Wait for explicit user approval before committing this learning artifact or starting Artifact Compression.
