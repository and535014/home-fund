---
id: archive-mobile-sitewide-layout-redesign-2026-06-24
stage: artifact-compression
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/mobile-sitewide-layout-redesign.md
  - .ai/prototype/mobile-sitewide-layout-redesign.md
  - .ai/spec/mobile-sitewide-layout-redesign.md
  - .ai/technical-design/mobile-sitewide-layout-redesign.md
  - .ai/implementation/mobile-sitewide-layout-redesign.md
  - .ai/verification/mobile-sitewide-layout-redesign.md
  - .ai/release/mobile-sitewide-layout-redesign-local-dev-readiness.md
  - .ai/learning/mobile-sitewide-layout-redesign.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/mobile-sitewide-layout-redesign.md
    - .ai/prototype/mobile-sitewide-layout-redesign.md
    - .ai/spec/mobile-sitewide-layout-redesign.md
    - .ai/technical-design/mobile-sitewide-layout-redesign.md
    - .ai/implementation/mobile-sitewide-layout-redesign.md
    - .ai/verification/mobile-sitewide-layout-redesign.md
    - .ai/release/mobile-sitewide-layout-redesign-local-dev-readiness.md
    - .ai/learning/mobile-sitewide-layout-redesign.md
  commits_or_prs:
    - 19e8c2e
    - 3404400
    - ccbe7a7
    - 8206221
    - b5dd682
    - 17cdfab
    - 7589aaf
reviewed_at: 2026-06-24
---

# Artifact Compression for Mobile Sitewide Layout Redesign

## Compression Decision

- scope: Completed mobile sitewide layout redesign lifecycle from intent through local_dev learning loop.
- reason: The slice has passed local_dev release readiness with accepted mobile E2E/manual-review gaps and has a learning plan. Future work should start from this archive summary plus maintained project/domain artifacts rather than reading every intermediate artifact.
- decision: compress
- next_lifecycle_entry: Optional mobile E2E/browser hardening Intent Intake if stricter confidence is required; otherwise next product/release intent.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Redesign authenticated mobile layout sitewide with bottom tab navigation and a mobile FAB while keeping desktop behavior stable.
- final_behavior_or_spec:
  - Mobile bottom tab bar is role-aware, ordered `設定`, `首頁`, `搜尋`, and icon-only with accessible labels.
  - `/search` hides the bottom tab bar and global `新增紀錄` FAB, and uses a back icon button beside the search field.
  - Settings mobile pages use segmented tabs for `帳號資訊`, `成員`, `分類`; inner page headers are hidden and settings-owned FABs are page-owned.
  - Mobile overview hides the visible `總覽` title, keeps `餘額`/`支出`/`收入` in one row, increases section spacing, and hides the trend chart.
  - Shared dialog footer behavior distributes mobile action buttons full-width and equally; desktop remains natural-width/end-aligned.
  - Create/edit record dialogs share category selector and payer/date layout rules; record detail pairs classification/status and payer/date.
  - Mobile category ordering uses up/down icon buttons with first/last boundary buttons disabled; desktop keeps drag handles.
  - Page-specific loading states exist for home/search/settings; root and app-group fallbacks use neutral centered loading instead of page-specific skeletons.
- domain_rules: No ledger, reimbursement, category, member, auth, permission, database, or server-action domain rules changed.
- foundation_decisions: Reused Next.js App Router, React, Tailwind, shadcn-style components, lucide icons, Vitest, and existing Playwright foundation. No new package was introduced.
- technical_decisions:
  - `AuthenticatedMobileNav` owns mobile bottom nav ordering, route-based hiding, and global FAB visibility.
  - Mobile nav ordering is extracted to `src/components/layout/mobile-navigation-order.ts` with pure tests.
  - `PageLoading` is a small container; route loading files select page-specific skeleton content.
  - `useActionStateEffect` handles `useActionState` success/error results once per state object to prevent repeated toasts after parent re-renders.
  - Category up/down boundary state is extracted to `src/app/(app)/settings/categories/category-ordering.ts`.
- release_target_and_result: `local_dev` ready for user review with accepted mobile E2E/manual browser gap; not preview or production ready.
- accepted_risks:
  - Mobile-specific Playwright coverage was not added in this lifecycle.
  - Root horizontal overflow, hidden scrollbars, safe-area footer clipping, native select appearance, and dialog category selector clipping still need browser/device verification before stricter targets.
  - Admin settings mobile E2E depends on a reliable admin-linked fixture.
- learning_outcomes:
  - Local review should answer whether the new tab order, icon-only bottom nav, search focus mode, settings segmented tabs, page-specific loading, and up/down category ordering feel correct.
  - Return to TDD if local review finds root horizontal overflow, clipped dialog controls, broken search back behavior, repeated toasts, or wrong loading skeletons.
  - Add mobile Playwright E2E before preview/production readiness.
- commits_or_prs:
  - `19e8c2e` Add mobile sitewide layout redesign intent
  - `3404400` Prototype mobile sitewide layout
  - `ccbe7a7` Document mobile layout behavior and technical design
  - `8206221` Refine mobile layout and loading states
  - `b5dd682` Document mobile layout verification
  - `17cdfab` Document mobile layout local dev readiness
  - `7589aaf` Document mobile layout learning loop

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/workflow.md` | maintained | Current workflow source of truth. | keep | This archive is linked from workflow. |
| `.ai/project-context.md` | maintained | Project-wide defaults and stack context. | keep | Not replaced. |
| `.ai/domain/home-family-fund.md` | maintained | Durable domain source of truth. | keep | Not replaced. |
| `.ai/intent/mobile-sitewide-layout-redesign.md` | prune_candidate | Completed change-level intent summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/prototype/mobile-sitewide-layout-redesign.md` | prune_candidate | Completed production-stack prototype summarized here. | mark_prune_candidate | This archive and commit `3404400`. |
| `.ai/spec/mobile-sitewide-layout-redesign.md` | prune_candidate | Completed behavior spec summarized here. | mark_prune_candidate | This archive and commit `ccbe7a7`. |
| `.ai/technical-design/mobile-sitewide-layout-redesign.md` | prune_candidate | Completed feature technical design summarized here. | mark_prune_candidate | This archive and commit `ccbe7a7`. |
| `.ai/implementation/mobile-sitewide-layout-redesign.md` | prune_candidate | Completed implementation evidence summarized here. | mark_prune_candidate | This archive and commit `8206221`. |
| `.ai/verification/mobile-sitewide-layout-redesign.md` | prune_candidate | Completed verification evidence summarized here. | mark_prune_candidate | This archive and commit `b5dd682`. |
| `.ai/release/mobile-sitewide-layout-redesign-local-dev-readiness.md` | prune_candidate | Completed local_dev readiness summarized here. | mark_prune_candidate | This archive and commit `17cdfab`. |
| `.ai/learning/mobile-sitewide-layout-redesign.md` | prune_candidate | Completed learning loop summarized here. | mark_prune_candidate | This archive and commit `7589aaf`. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/mobile-sitewide-layout-redesign.md`
- `.ai/prototype/mobile-sitewide-layout-redesign.md`
- `.ai/spec/mobile-sitewide-layout-redesign.md`
- `.ai/technical-design/mobile-sitewide-layout-redesign.md`
- `.ai/implementation/mobile-sitewide-layout-redesign.md`
- `.ai/verification/mobile-sitewide-layout-redesign.md`
- `.ai/release/mobile-sitewide-layout-redesign-local-dev-readiness.md`
- `.ai/learning/mobile-sitewide-layout-redesign.md`

## Workflow Updates

- active_lifecycle_stage: Completed mobile sitewide layout redesign compressed; no active implementation gate remains for this slice.
- artifact_inventory_changes: Add this archive as the long-term summary for mobile sitewide layout redesign; classify completed slice artifacts as prune candidates.
- archive_notes: Preserve local_dev release result and mobile E2E/browser gap in this summary for future release or hardening work.

## Risks

- traceability_risks: Low if this archive is kept. Full implementation details remain recoverable through git history and listed commits.
- audit_or_compliance_risks: Low. No schema, auth, permission, financial rule, production deployment, or security incident context was introduced.
- unresolved_work: Mobile Playwright/browser coverage remains deferred; preview/production readiness must revisit it.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - release and learning outcomes retained
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary
  - future work can resume from maintained files and archive summary
- unresolved_blockers:
  - None for compression; mobile E2E remains deferred follow-up work.
- next_step: Commit this archive and workflow update after review, then optionally request `artifact-prune` if the listed intermediate artifacts should be deleted.
