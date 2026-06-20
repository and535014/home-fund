---
id: archive-desktop-product-structure-layout-redesign-2026-06-20
stage: artifact-compression
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/desktop-product-structure-layout-redesign.md
  - .ai/prototype/desktop-product-structure-layout-redesign.md
  - .ai/spec/desktop-product-structure-layout-redesign.md
  - .ai/technical-design/desktop-product-structure-layout-redesign.md
  - .ai/implementation/desktop-product-structure-layout-redesign.md
  - .ai/verification/desktop-product-structure-layout-redesign.md
  - .ai/release/desktop-product-structure-layout-redesign-local-dev-readiness.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/desktop-product-structure-layout-redesign.md
    - .ai/prototype/desktop-product-structure-layout-redesign.md
    - .ai/spec/desktop-product-structure-layout-redesign.md
    - .ai/technical-design/desktop-product-structure-layout-redesign.md
    - .ai/implementation/desktop-product-structure-layout-redesign.md
    - .ai/verification/desktop-product-structure-layout-redesign.md
    - .ai/release/desktop-product-structure-layout-redesign-local-dev-readiness.md
  commits_or_prs:
    - 32db2e7 Add desktop layout redesign intent
    - 29b83ce Prototype desktop IA redesign
    - d8fb50a Refine desktop app layout prototype
    - 2e49955 Add desktop layout behavior spec
    - 1470e88 Add desktop layout technical design
    - d2e90e3 Add desktop layout implementation evidence
    - 49cada4 Update desktop layout E2E verification
    - 5730969 Add desktop layout local dev release readiness
reviewed_at: 2026-06-20
---

# Artifact Compression for Desktop Product Structure Layout Redesign

## Compression Decision

- scope: completed desktop authenticated IA/layout redesign slice.
- reason: The slice reached local_dev release readiness and has no active implementation blockers. Future work should read this archive first instead of re-reading every intermediate artifact.
- decision: compress
- next_lifecycle_entry: next product change should start at Intent Intake; production/preview/staging release should start at Target-Aware Release for the selected target.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Rework the desktop authenticated app structure around `總覽`, `搜尋`, permission-gated `退款`, and `設定`; nest account/member/category settings under `/settings/*`; remove visible recurring surface; keep mobile out of scope.
- final_behavior_or_spec: The app uses an icon-only primary sidebar with footer `新增紀錄`, full-height page layout with owned content scrolling, switchable-month overview dashboard, matching `搜尋`/`退款` placeholders, settings subnavigation, and a create-record dialog with `成員支出`, `收入`, and `基金支出`.
- domain_rules: Existing ledger creation, reimbursement permission, admin-only member/category management, and controlled-auth E2E boundaries remain intact. Reimbursement settlement and real search are deferred. Recurring app/module UI is removed, but recurring database schema/seed cleanup is not part of this slice.
- foundation_decisions: Reuse existing Next.js App Router, Prisma/PostgreSQL, Better Auth, Tailwind, local shadcn-style components, Vitest, and Playwright. Recharts is used for dashboard trend and expense category charts.
- technical_decisions: `/settings` redirects to `/settings/account`; `/settings/members` and `/settings/categories` keep server-side admin guards; `/reimbursements` keeps server-side reimbursement permission guard and renders placeholder content; chart components measure container size before rendering; create-record categories use an accessible custom radio grid.
- release_target_and_result: Ready for `local_dev` review only. Verification passed with lint, type-check, targeted Playwright 16/16, and full Playwright E2E 29/29.
- accepted_risks: No screenshot artifact was captured; recurring Prisma schema/seed remain; search is placeholder-only; reimbursement settlement is deferred; Next dev tools portal overlap means E2E uses keyboard activation for sidebar `新增紀錄`; Prisma generate commands should be run sequentially.
- learning_outcomes: No separate Learning Loop artifact was created. If this local_dev slice is reviewed with users, capture sidebar usability, dashboard density, chart readability, and create-record modal feedback in a future Learning Loop.
- commits_or_prs: `32db2e7`, `29b83ce`, `d8fb50a`, `2e49955`, `1470e88`, `d2e90e3`, `49cada4`, `5730969`.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level stack, constraints, and next-step guidance remain current source of truth. | keep | This archive references it but does not replace it. |
| `.ai/workflow.md` | maintained | Workflow inventory and current state must remain active. | keep | Updated to reference this archive. |
| `.ai/domain/home-family-fund.md` | maintained | Durable domain model remains authoritative. | keep | No domain replacement. |
| `.ai/intent/desktop-product-structure-layout-redesign.md` | prune_candidate | Intent is fully summarized here after local_dev release readiness. | mark_prune_candidate | This archive preserves the scope and decisions. |
| `.ai/prototype/desktop-product-structure-layout-redesign.md` | prune_candidate | Prototype decisions are implemented and summarized. | mark_prune_candidate | This archive plus commits preserve trace. |
| `.ai/spec/desktop-product-structure-layout-redesign.md` | prune_candidate | Acceptance criteria are implemented, verified, and summarized. | mark_prune_candidate | This archive preserves final behavior and risks. |
| `.ai/technical-design/desktop-product-structure-layout-redesign.md` | prune_candidate | Route/component/data decisions are implemented and summarized. | mark_prune_candidate | This archive preserves key technical decisions. |
| `.ai/implementation/desktop-product-structure-layout-redesign.md` | prune_candidate | Implementation evidence is summarized and committed. | mark_prune_candidate | This archive points to commits and verification. |
| `.ai/verification/desktop-product-structure-layout-redesign.md` | prune_candidate | Verification result is preserved here. | mark_prune_candidate | This archive records local_dev pass and accepted risks. |
| `.ai/release/desktop-product-structure-layout-redesign-local-dev-readiness.md` | prune_candidate | Release readiness is summarized here. | mark_prune_candidate | This archive records local_dev readiness and stricter-target gaps. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/desktop-product-structure-layout-redesign.md`
- `.ai/prototype/desktop-product-structure-layout-redesign.md`
- `.ai/spec/desktop-product-structure-layout-redesign.md`
- `.ai/technical-design/desktop-product-structure-layout-redesign.md`
- `.ai/implementation/desktop-product-structure-layout-redesign.md`
- `.ai/verification/desktop-product-structure-layout-redesign.md`
- `.ai/release/desktop-product-structure-layout-redesign-local-dev-readiness.md`

## Workflow Updates

- active_lifecycle_stage: completed and compressed desktop product structure layout redesign.
- artifact_inventory_changes: add this archive as the long-term summary for the completed desktop layout slice; mark intermediate desktop layout artifacts as prune candidates.
- archive_notes: Do not delete source artifacts unless the user explicitly requests `artifact-prune`; use this archive plus git history as the compact trace.

## Risks

- traceability_risks: Low. Source artifacts and commit hashes remain available until explicit prune; this archive preserves the key decisions and accepted risks.
- audit_or_compliance_risks: Low for local_dev. No schema migration, financial data migration, secrets change, production incident, or compliance decision was made.
- unresolved_work: Real search UX, reimbursement settlement redesign, optional recurring database cleanup, preview/staging/production readiness, and optional screenshot/visual regression review.

## Review Gate

- decision: approve
- reviewer_focus:
  - traceability preserved
  - active work not compressed
  - release outcome retained
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary.
  - Future work can resume from maintained files and this archive summary.
- unresolved_blockers:
  - None.
- next_step:
  - Optional manual `artifact-prune` only if explicitly requested.
  - Otherwise start the next product/release change with Intent Intake.
