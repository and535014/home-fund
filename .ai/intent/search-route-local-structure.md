---
id: search-route-local-structure
stage: intent-intake
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: existing_project
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/archive/archive-app-seam-refactor-2026-06-26.md
  - .ai/archive/archive-search-reimbursement-payment-records-2026-06-26.md
outputs:
  - intent_intake
trace_links:
  bounded_contexts:
    - Web App Shell
    - Reporting
    - Reimbursement
    - Fund Ledger
reviewed_at: 2026-06-26
---

# Intent Intake: Search Route Local Structure

## Intent

Reduce `src/app` top-level clutter by moving `/search`-specific route implementation closer to the `/search` route, without changing search behavior or user-facing UI.

The current `src/app` top level still contains many files that are primarily owned by `/search`, including search panel UI, search controls, search results, batch action dialogs, reimbursement payment dialogs, reimbursement payment loader helpers, and search server actions. This makes `src/app` act as a route-local shared package and makes unrelated app work scan through search-specific implementation.

This slice should organize the search workflow so `/search` dependencies are easier to find, while keeping domain/read-model ownership in `src/modules`.

## Classification

- project_type: existing_project
- affected_surfaces: `/search` route structure, route-local UI modules, search server actions, import paths, test file locations, Web App Shell organization, unit tests, lint, type-check
- target_users: maintainers working on search, reimbursement payment search, batch search actions, and future `src/app` structure cleanup
- business_outcome: improve code locality and reduce `src/app` top-level scanning cost so future changes can target the search workflow without touching unrelated route code.

## Scope

In scope:

- Decide and apply a route-local folder convention for `/search`, such as `src/app/(app)/search/_components`, `_actions`, or `_modules`.
- Move `/search`-specific files out of `src/app` top level where the technical design confirms they are not shared by other routes.
- Update imports from `/search/page.tsx` and route-local search modules.
- Keep Reporting query builders in `src/modules/reporting`.
- Keep Fund Ledger, Reimbursement, and Identity and Access domain behavior in `src/modules`.
- Preserve current `/search` behavior, including `收支紀錄` and `退款紀錄` tabs, search filters, batch delete/refund actions, refund detail dialogs, and related-record readback.
- Preserve current Traditional Chinese UI copy.
- Keep tests focused on import-safe refactor and existing behavior.

Out of scope:

- Moving create-record files, dashboard files, settings files, category management files, member management files, or app-wide helpers that are not search-owned.
- Large full-`src/app` folder reorganization.
- Changing route URLs, navigation, UI layout, visual design, or copy.
- Changing search behavior, pagination, filters, reimbursement payment read model, batch action semantics, authorization, database schema, migrations, or seed data.
- Moving shared record detail/list modules if they are still used by both dashboard and `/search`, unless technical design identifies a low-risk shared app module location.
- Pruning `.ai` artifacts.

## Current Context

- Completed `app-seam-refactor` removed `src/modules` and `src/auth` inward imports from `src/app`.
- Remaining `src/app` top-level pressure is now mostly route-local organization:
  - `record-search-panel.tsx`, `record-search-controls.tsx`, `record-search-results.tsx`, `record-search-actions.ts`, and `record-search-actions.test.ts`.
  - `batch-delete-dialog.tsx`, `batch-refund-dialog.tsx`, `batch-search-footer.tsx`, and `record-search-batch-utils.ts`.
  - `reimbursement-payment-dialogs.tsx`, `reimbursement-payment-loader.ts`, `reimbursement-payment-ui.ts`, and `reimbursement-payment-fields.tsx`.
- `record-list-detail.tsx`, `record-list-item.tsx`, `record-detail-ui.tsx`, and `record-display-utils.ts` need technical-design review because at least `RecordListDetail` is used by both `/search` and the home dashboard.
- `src/app/(app)/search/page.tsx` currently imports `RecordSearchPanel` from `@/app/record-search-panel`.

## Success Criteria

- Search-owned route implementation no longer sits broadly at `src/app` top level unless the technical design records a shared-use reason.
- `/search/page.tsx` imports search UI through a route-local seam.
- Existing search behavior remains unchanged.
- Existing home dashboard record detail/list behavior remains unchanged.
- No domain module imports from route-local search folders.
- No new generic shared folder is introduced without a real multi-route seam.
- Focused search tests, lint, type-check, and full unit tests pass after implementation.

## Constraints And Assumptions

- This is a structural refactor for maintainability, not a product behavior change.
- Release target remains `local_dev`.
- Existing Next.js App Router route grouping under `src/app/(app)/search` should be reused.
- Route-local private folders such as `_components`, `_actions`, or `_modules` are acceptable if confirmed in technical design.
- File moves may be noisy; implementation should avoid opportunistic UI cleanup.

## Required Downstream Gates

- Domain Discovery / Domain Impact: not required; no domain policy or lifecycle change is intended.
- Project Foundation Architecture: not required if technical design can reuse the existing Next.js App Router foundation; return to foundation architecture only if a site-wide app folder convention must be redesigned.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: not required; no user-facing experience change is intended.
- Behavior Spec / BDD / E2E: not required for the intent as stated; behavior must remain unchanged and existing tests should protect regressions.
- Feature Technical Design: required, because route-local folder convention, shared record detail ownership, import direction, and test mapping need explicit decisions before moving files.
- TDD Implementation: required after approved technical design; enable or update focused tests first where imports or route-owned modules move.
- Verification: required after implementation.
- Target-Aware Release: not required beyond local verification, because there are no schema, config, deployment, auth provider, or operational changes.
- Learning Loop: not required.
- Artifact Compression: required after the refactor completes.

## Open Questions

- Should search route-local code use `_components`, `_actions`, `_modules`, or a flatter `_search` folder under `src/app/(app)/search`?
- Which files are truly search-owned versus shared with the home dashboard record list/detail experience?
- Should `record-list-detail.tsx` stay in `src/app` for now, move to an app-level shared route module, or be split into shared record detail pieces and search-specific wrappers?
- Should search server actions live beside `/search/page.tsx`, or remain at app top level because home/dashboard detail readback also uses them?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm the first implementation slice should target `/search` route-local structure rather than all of `src/app`.
  - Confirm no user-facing behavior or copy change is intended.
  - Confirm shared record detail/list ownership should be decided in Feature Technical Design before moving files.
- must_check:
  - Do not start implementation before Feature Technical Design is approved or explicitly accepted as risk.
  - Preserve existing `/search` and home dashboard behavior.
  - Avoid broad file moves that only make imports longer without improving locality.
- acceptance_signals:
  - Scope is small enough to complete as a structural refactor.
  - Success criteria are based on route locality, import safety, and regression tests.
  - Required downstream gates are limited to technical design, TDD implementation, verification, and compression.
- unresolved_blockers:
  - Exact route-local folder convention and shared record detail ownership need technical design.
- next_step:
  - Feature Technical Design for `search-route-local-structure`.
