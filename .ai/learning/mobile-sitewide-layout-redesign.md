---
id: learning-mobile-sitewide-layout-redesign
stage: learning
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/mobile-sitewide-layout-redesign.md
  - .ai/spec/mobile-sitewide-layout-redesign.md
  - .ai/verification/mobile-sitewide-layout-redesign.md
  - .ai/release/mobile-sitewide-layout-redesign-local-dev-readiness.md
outputs:
  - learning_questions
  - local_review_signals
  - follow_up_decision_rules
trace_links:
  commits:
    - 8206221
    - b5dd682
    - 17cdfab
reviewed_at: 2026-06-24
---

# Mobile Sitewide Layout Redesign Learning Loop

## Decision

- decision: ready_for_local_dev_learning_review
- release_target: local_dev
- tracking_maturity: manual_review_only
- analytics_provider: none selected
- monitoring_provider: none selected
- next_gate_after_approval: Artifact Compression, unless local review finds mobile E2E or UI follow-up work that should return to Intent Intake / TDD Implementation.

## Learning Questions

1. Does the mobile bottom navigation order (`設定`, `首頁`, `搜尋`) feel faster for the user's actual daily flow than the prior sidebar-derived layout?
2. Does hiding labels in the bottom tab bar still leave navigation understandable through icon shape and accessible names?
3. Does `/search` feel like a focused task page without the bottom tab bar, and does the back button behavior match user expectation?
4. Do settings tabs (`帳號資訊`, `成員`, `分類`) make settings navigation clearer on mobile than the prior page-header/sidebar approach?
5. Do page-specific loading states avoid the confusing "wrong page skeleton" impression during refresh and route transitions?
6. Does the neutral fallback loading feel acceptable when route-specific skeletons are not available?
7. Are mobile dialogs usable without clipped selected category buttons, footer buttons, native selects, or accidental horizontal panning?
8. Is the up/down category ordering control acceptable as the mobile alternative to drag-and-drop for this slice?

## Local Review Signals

| Signal | How to collect | Decision threshold |
|---|---|---|
| Navigation clarity | Manual mobile review at `/`, `/search`, `/settings/account` | Reviewer can identify each tab and active route without reading hidden text. |
| Search focus | Manual route review for `/search` | Bottom tab bar stays hidden, back button returns to expected page or home fallback. |
| Settings flow | Manual route review for `/settings/account`, `/settings/members`, `/settings/categories` | Tabs remain visible and page-owned FABs are discoverable without showing global `新增紀錄`. |
| Loading trust | Hard refresh and route transition review | No route shows an unrelated page skeleton; neutral fallback is visually distinct from page skeletons. |
| Horizontal overflow | Browser devtools at `390x844` and `375x812` | Root document width does not exceed viewport width. |
| Dialog clipping | Manual create/edit/filter/month/settings dialog review | Selected category rings, footer buttons, and native selects are not clipped. |
| Category ordering | Manual mobile category list review | First up / last down controls are disabled and middle rows can be reordered predictably. |

## Guardrails

- Financial, reimbursement, category, member, auth, and permission rules should not change during mobile layout review.
- No new package should be introduced unless a follow-up decision explicitly reopens mobile drag-and-drop or select behavior.
- Do not treat local_dev acceptance as preview or production readiness.
- Do not proceed to production planning without mobile browser E2E or real-device smoke coverage.

## Follow-Up Decision Rules

- Return to TDD Implementation if local review finds root horizontal overflow, clipped dialog controls, broken back behavior, repeated toasts, or loading states that show the wrong page.
- Create a follow-up Intent Intake if the desired mobile IA changes beyond this slice, such as adding a fourth tab, changing the FAB default action, or replacing native selects.
- Add Playwright mobile E2E before preview/production readiness if this work moves beyond local_dev.
- Proceed to Artifact Compression if local review accepts the documented E2E gap and no UI blockers remain.

## Review Cadence

- Review once in local dev immediately after this gate.
- Re-review after any follow-up mobile E2E or visual polish commit.
- Reassess production tracking only when a preview or production target is selected.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - Confirm whether the local manual review signals are enough for this MVP mobile redesign.
  - Decide whether to accept the E2E gap and move to Artifact Compression, or return to TDD for mobile Playwright coverage.
- unresolved_blockers:
  - No analytics or monitoring provider is selected; acceptable for local_dev only.
  - Mobile E2E remains deferred unless requested before compression.
- recommended_next_gate:
  - artifact-compression if accepted
  - tdd-implementation if mobile E2E/browser hardening is requested first
