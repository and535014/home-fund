---
id: learning-category-archive-visibility-toggle
stage: learning
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/category-archive-visibility-toggle.md
  - .ai/domain-impact/category-archive-visibility-toggle.md
  - .ai/prototype/category-archive-visibility-toggle.md
  - .ai/spec/category-archive-visibility-toggle.md
  - .ai/technical-design/category-archive-visibility-toggle.md
  - .ai/implementation/category-archive-visibility-toggle.md
  - .ai/verification/category-archive-visibility-toggle.md
  - .ai/release/category-archive-visibility-toggle-local-dev-readiness.md
outputs:
  - learning_questions
  - manual_feedback_signals
  - guardrails
  - follow_up_decision_criteria
trace_links:
  release:
    - .ai/release/category-archive-visibility-toggle-local-dev-readiness.md
  verification:
    - .ai/verification/category-archive-visibility-toggle.md
reviewed_at: 2026-06-26
---

# Category Archive Visibility Toggle Learning Loop

## Learning Summary

- release_target: local_dev
- tracking_maturity: manual_feedback_and_smoke
- analytics_provider: not selected
- monitoring_provider: not selected
- decision: learning_signals_defined

This slice adds a recoverable category archive path. For `local_dev`, the learning goal is to confirm that admins can review and restore archived categories only when needed, while normal category management and new-record category choices stay focused on active categories.

## Learning Questions

| Question | Why it matters | Signal |
|---|---|---|
| Do admins notice `顯示封存分類` when they need to recover a category? | The switch is intentionally page-level and not persisted. | Reviewer can find archived categories without looking for a separate tab or database workaround. |
| Does hiding archived categories by default keep the page focused? | Archived categories should not add noise to routine category management. | Reviewer reports the default page still feels like active category management, not an archive browser. |
| Are archived rows visually clear without disrupting row alignment? | The archived icon replaced a text badge to align with active drag handles. | Reviewer confirms the archived icon is understandable and rows look aligned on desktop/mobile. |
| Is direct `取消封存` with toast enough, or does it need confirmation? | Direct restore is faster but could be clicked accidentally. | Reviewer can restore intentionally and does not expect a confirmation dialog. |
| Does append-to-bottom active ordering feel predictable after restore? | Restored categories re-enter active choices at the bottom by design. | Reviewer sees the restored category where expected and can reorder later if needed. |
| Is duplicate-name blocking understandable? | Restore can fail when an active category already has the same name. | Reviewer understands the duplicate-name message and knows to rename the active category first. |
| Do new-record category choices stay trustworthy? | Archived categories must not appear before restore. | Reviewer confirms archived categories are absent before restore and present after restore. |

## Manual Feedback Plan

- Reviewer profile: local admin reviewer using seeded data.
- Review routes:
  - `/settings/categories`
  - `/?month=2026-06`
- Review tasks:
  - Open `/settings/categories` and confirm archived categories are hidden by default.
  - Turn on `顯示封存分類` and inspect `舊餐飲` plus `舊收入`.
  - Confirm archived rows show only the archived icon and `取消封存` icon button.
  - Restore `舊餐飲` and confirm toast `分類已取消封存`.
  - Open the new-record dialog and confirm `舊餐飲` appears in the expense category choices.
  - Revisit category management as a non-admin member and confirm category management remains unavailable.
  - Review desktop and mobile screenshots from Verification if alignment needs another visual pass.

## Guardrails

- Category management remains admin-only.
- Unarchive remains server-authorized and domain-validated.
- Archived categories stay hidden by default.
- Showing archived categories does not make them available for new records.
- Archived rows do not expose edit, archive, or reorder controls.
- Restored categories append to active order and can be reordered afterward.
- Duplicate active names block unarchive instead of silently renaming or creating ambiguous active choices.
- Local development still requires Docker/Postgres for E2E and seed-backed smoke checks.

## Operational Signals

Automated local guardrails:

- `corepack pnpm lint`
- `corepack pnpm type-check`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm db:validate`
- `corepack pnpm test:e2e e2e/admin-category-management.spec.ts`

Manual signals:

- Reviewer notes on switch discoverability.
- Reviewer notes on archived icon clarity and alignment.
- Reviewer notes on whether direct restore needs confirmation.
- Reviewer notes on append-to-bottom ordering after restore.
- Reviewer notes on duplicate-name failure copy.

## Follow-Up Decision Criteria

- If admins cannot find archived categories, start a new Intent Intake for stronger archive discovery.
- If the archived icon is unclear, start a small UI copy/accessibility slice for status affordance.
- If direct restore feels risky, start a new Intent Intake for restore confirmation or undo.
- If append-to-bottom ordering surprises users, start a new Intent Intake for restore placement or post-restore reorder guidance.
- If duplicate-name failure is confusing, start a small copy or conflict-resolution slice.
- If no local review issues are found, proceed to Artifact Compression for this completed slice.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - confirm manual learning questions match the local review you want
  - confirm no analytics or monitoring tooling is needed for this local_dev-only slice
  - confirm Artifact Compression should be next if no follow-up slice is needed
- unresolved_blockers:
  - none for Artifact Compression after approval
- recommended_next_gate:
  - artifact-compression
- stop_condition: Wait for explicit user approval before starting Artifact Compression.
