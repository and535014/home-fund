---
id: archive-record-search-sort-filter-2026-06-21
stage: artifact-compression
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/intent/record-search-sort-filter.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/record-search-sort-filter.md
  - .ai/prototype/record-search-sort-filter.md
  - .ai/spec/record-search-sort-filter.md
  - .ai/technical-design/record-search-sort-filter.md
  - .ai/implementation/record-search-sort-filter.md
  - .ai/verification/record-search-sort-filter.md
  - .ai/release/record-search-sort-filter-local-dev-readiness.md
  - .ai/learning/record-search-sort-filter.md
outputs:
  - compressed_decision_record
  - artifact_classification
  - prune_candidates
trace_links:
  source_artifacts:
    - .ai/intent/record-search-sort-filter.md
    - .ai/domain-impact/record-search-sort-filter.md
    - .ai/prototype/record-search-sort-filter.md
    - .ai/spec/record-search-sort-filter.md
    - .ai/technical-design/record-search-sort-filter.md
    - .ai/implementation/record-search-sort-filter.md
    - .ai/verification/record-search-sort-filter.md
    - .ai/release/record-search-sort-filter-local-dev-readiness.md
    - .ai/learning/record-search-sort-filter.md
  maintained_artifacts:
    - .ai/domain/home-family-fund.md
  commits_or_prs:
    - 2fc4a89 Capture record search filter intent
    - 8274f00 Define record query domain impact
    - 580ce22 Prototype record search filters
    - 1152e15 Specify record search behavior
    - c3632bb Design record search implementation
    - 05a7fe1 Implement record search filters
    - 7df0fa0 Verify record search filters
    - e1b197b Assess record search local readiness
    - 22560c2 Define record search learning loop
reviewed_at: 2026-06-21
---

# Artifact Compression for Record Search Sort Filter

## Compression Decision

- scope: completed local_dev record search, sort, and filter feature slice.
- reason: Intent, domain impact, production-stack prototype, Behavior Spec, Feature Technical Design, TDD implementation, verification, local_dev release readiness, and learning loop are complete.
- decision: compress
- next_lifecycle_entry: next product change should start at Intent Intake; stricter preview/staging/production release should start at Target-Aware Release for the selected environment.
- optional_manual_prune_recommended: true

## Preserved Decision Summary

- intent: Let authenticated household members find active income and expense records faster through `/search`, using keyword search, sorting, and filters for type, category, member/fund participation, reimbursement status, and occurrence-date range.
- final_behavior_or_spec:
  - `/search` has no page header.
  - Page surface contains only a keyword input and an icon-only filter button.
  - Initial result state is empty with `請輸入關鍵字或設定篩選條件。`.
  - Keyword search matches record name and formatted amount only.
  - Search input has an icon-only `清除搜尋` button when keyword text exists.
  - Filter/sort controls live in a `篩選與排序` modal and apply only when `套用` is activated.
  - Filters include type, active category, `收支對象`, reimbursement status, optional start/end dates, and one sort select.
  - Type constrains category options; `收入` hides `基金` from `收支對象`.
  - `已退款` and `未退款` apply only to member-paid reimbursable expenses.
  - Empty matched results show `沒有符合條件的紀錄。`.
  - Query state is local only; URL persistence is out of scope.
  - Opening a result uses the existing record detail dialog and existing action permission behavior.
- domain_rules:
  - Record query is a Reporting/read-model behavior, not a LedgerRecord mutation.
  - Queries include active readable household records only; voided records are excluded.
  - Category filter options use active categories only.
  - Archived category names are not keyword-searchable or filterable.
  - Date filters use record occurrence date.
  - Search does not grant edit/delete/reimbursement permission; server actions and domain commands remain authoritative.
- foundation_decisions:
  - Existing Next.js App Router, React client components, TypeScript, Prisma/PostgreSQL, Tailwind, local shadcn-style UI components, Lucide icons, Vitest, and Playwright foundations were reused.
  - No new framework, component library, auth provider, analytics provider, monitoring provider, or schema migration was added.
- technical_decisions:
  - `src/app/(app)/search/page.tsx` loads authenticated user/session and active search data.
  - `src/app/record-search-panel.tsx` owns search-page query state, filter modal draft state, filtered results, and search empty-state selection.
  - `src/app/record-list-detail.tsx` owns only shared list rendering, detail selection, focus return, and detail actions; it no longer owns search controls or query state.
  - `src/app/record-query.ts` owns route-neutral query defaults, option builders, filter predicates, active filter counts, and sorting.
  - `getSearchPageData()` loads active `LedgerRecord` rows only.
  - Active filter count excludes keyword search because keyword has its own clear affordance.
  - Client-side query is accepted for local_dev MVP; production-scale server-side pagination/indexing is deferred.
- release_target_and_result:
  - `local_dev` readiness passed.
  - Evidence includes `corepack pnpm type-check`, `corepack pnpm lint`, `corepack pnpm test` (30 files / 152 tests), `corepack pnpm build`, and `corepack pnpm test:e2e e2e/record-search.spec.ts` (5 tests).
  - No Prisma schema migration, new secret, config, or OAuth change was introduced.
  - Production readiness is not claimed.
- accepted_risks:
  - Query state is local only and not shareable/bookmarkable.
  - Search runs client-side over loaded active records.
  - Browser E2E covers `未退款`; `已退款` is covered by unit tests because the E2E seed does not include an already-reimbursed member-paid expense.
  - Mobile-specific screenshots were not captured; responsive behavior uses existing Dialog/Input/NativeSelect components and targeted browser flows pass.
  - Quality scripts that run `prisma generate` should be run sequentially to avoid generated-client directory races.
- learning_outcomes:
  - Local_dev learning uses manual review and smoke checks rather than analytics tooling.
  - Watch whether the initial empty state is understood, whether name/amount-only keyword search is sufficient, whether the icon-only filter button is discoverable, whether apply-only modal behavior is predictable, whether `收支對象` wording is clear, whether date range without month switching works, and whether result detail continuity feels intact.
  - Route future issues through new Intent Intake.
- commits_or_prs:
  - 2fc4a89, 8274f00, 580ce22, 1152e15, c3632bb, 05a7fe1, 7df0fa0, e1b197b, 22560c2.

## Artifact Classification

| Artifact | Classification | Reason | Action | Replacement / Trace |
|---|---|---|---|---|
| `.ai/project-context.md` | maintained | Project-level stack and workflow defaults remain source of truth. | keep | This archive references project defaults. |
| `.ai/workflow.md` | maintained | Workflow inventory and current state remain active. | keep | Updated to reference this archive. |
| `.ai/domain/home-family-fund.md` | maintained | Durable domain rules remain source of truth. | keep | This archive summarizes only the completed change. |
| `.ai/release/home-family-fund-local-dev-readiness.md` | maintained | Broad local_dev readiness remains useful across slices. | keep | Slice readiness is summarized here. |
| `.ai/intent/record-search-sort-filter.md` | prune_candidate | Completed change intent is summarized here. | mark_prune_candidate | This archive and git history. |
| `.ai/domain-impact/record-search-sort-filter.md` | prune_candidate | Change-level domain delta is summarized here; durable rules remain in maintained domain artifact. | mark_prune_candidate | This archive and `.ai/domain/home-family-fund.md`. |
| `.ai/prototype/record-search-sort-filter.md` | prune_candidate | Prototype decisions were implemented and verified. | mark_prune_candidate | This archive and E2E evidence. |
| `.ai/spec/record-search-sort-filter.md` | prune_candidate | Acceptance criteria are implemented, verified, and summarized. | mark_prune_candidate | This archive and verification artifact. |
| `.ai/technical-design/record-search-sort-filter.md` | prune_candidate | Technical decisions are implemented and summarized. | mark_prune_candidate | This archive and commits. |
| `.ai/implementation/record-search-sort-filter.md` | prune_candidate | Implementation evidence is summarized here and in git history. | mark_prune_candidate | This archive and commits. |
| `.ai/verification/record-search-sort-filter.md` | prune_candidate | Verification result is summarized here. | mark_prune_candidate | This archive and release readiness. |
| `.ai/release/record-search-sort-filter-local-dev-readiness.md` | prune_candidate | Slice-specific local_dev readiness is summarized here. | mark_prune_candidate | This archive. |
| `.ai/learning/record-search-sort-filter.md` | prune_candidate | Learning signals are summarized here. | mark_prune_candidate | This archive. |

## Prune Candidates

Files that can be deleted later only by explicit manual `artifact-prune` request:

- `.ai/intent/record-search-sort-filter.md`
- `.ai/domain-impact/record-search-sort-filter.md`
- `.ai/prototype/record-search-sort-filter.md`
- `.ai/spec/record-search-sort-filter.md`
- `.ai/technical-design/record-search-sort-filter.md`
- `.ai/implementation/record-search-sort-filter.md`
- `.ai/verification/record-search-sort-filter.md`
- `.ai/release/record-search-sort-filter-local-dev-readiness.md`
- `.ai/learning/record-search-sort-filter.md`

## Workflow Updates

- active_lifecycle_stage: completed and compressed record search, sort, and filter slice.
- artifact_inventory_changes:
  - Added this archive as the compact long-term record for the completed record search work.
  - Marked completed intermediate slice artifacts as prune candidates.
  - Preserved maintained project, workflow, domain, foundation, broad local_dev release, migration, and archive summaries.
- archive_notes:
  - Use this archive first for future context on `/search`, name/amount-only keyword search, modal filter/sort behavior, and the `RecordSearchPanel` / `RecordListDetail` ownership split.
  - Use `.ai/domain/home-family-fund.md` for durable fund ledger/reporting/reimbursement rules.
  - Use git history for full intermediate details if prune is later requested.

## Risks

- traceability_risks:
  - Low if this archive, maintained workflow/project/domain artifacts, and git history are kept.
- audit_or_compliance_risks:
  - Low for local_dev. The slice introduced no schema migration, production incident, legal requirement, or security incident.
- unresolved_work:
  - Production readiness remains out of scope.
  - URL persistence/shareable search links remain a future product decision.
  - Production-scale server-side filtering, pagination, or indexing remains deferred.
  - `收支對象` wording should be revisited if local review shows confusion.
  - Mobile modal polish can be a future slice if local reviewers report clipping or reachability issues.

## Review Gate

- decision: needs_user_review
- reviewer_focus:
  - traceability preserved
  - active work is not compressed prematurely
  - release and learning outcomes retained
  - prune candidates are safe to consider later
- must_check:
  - summary is enough for future context
  - maintained artifacts remain clear
  - next lifecycle entry is clear
- acceptance_signals:
  - `.ai` has a clear completed-work summary.
  - Future work can resume from maintained files and this archive.
- unresolved_blockers:
  - None.
- next_step:
  - Optional explicit `artifact-prune`, stricter-target release readiness, production release intent, or next Intent Intake.
