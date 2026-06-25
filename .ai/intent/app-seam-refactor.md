---
id: app-seam-refactor
stage: intent-intake
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: existing_project
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/foundation-architecture/home-family-fund.md
  - .ai/code-understanding/home-family-fund.md
outputs:
  - intent_intake
trace_links:
  bounded_contexts:
    - Web App Shell
    - Identity and Access
    - Reporting
reviewed_at: 2026-06-26
---

# Intent Intake: App Seam Refactor

## Intent

Reduce inward dependencies on `src/app` so the Next.js App Router layer stays a route adapter instead of becoming a shared core module.

The current structure has at least two concrete seam leaks:

- `src/modules/reporting/record-search-query.ts` imports `RecordQueryState` from `src/app/record-query.ts`.
- `src/auth/app-access.ts` imports `buildHomeBlockedViewFromAccess` and `HomeBlockedView` from `src/app/home-access.ts`.

This refactor should move shared query/access view logic to domain-adjacent modules while preserving current behavior and tests.

## Classification

- project_type: existing_project
- affected_surfaces: source folder structure, imports, Reporting query model, Identity and Access route access helpers, app route adapters, unit tests, type-check/lint
- target_users: maintainers working on household fund features
- business_outcome: improve code locality and reduce coupling so future feature changes can happen without treating `src/app` as a shared dependency hub.

## Scope

In scope:

- Move record search query state and pure query helpers out of `src/app` if they are shared by Reporting and route/UI code.
- Move home blocked/access view shaping out of `src/app` if it is used by auth infrastructure.
- Keep Next route files and route-specific UI under `src/app`.
- Update imports and focused tests after the approved technical design.
- Preserve all existing user-facing behavior and Traditional Chinese copy.

Out of scope:

- Large route folder reorganization across all 56 top-level `src/app` files.
- UI redesign, copy changes, or new user-visible behavior.
- Database schema changes, Prisma migrations, seed changes, or production release changes.
- Introducing new framework conventions or replacing the existing Next.js App Router foundation.
- Pruning `.ai` artifacts.

## Current Context

- Existing architecture says Web App Shell owns route-level UX while domain modules own business rules and read models.
- `src/app` currently contains route files plus many shared helpers, actions, UI modules, and pure query utilities.
- `src/modules` already contains bounded-context modules for Identity and Access, Fund Ledger, Categorization, Reimbursement, and Reporting.
- The immediate risk is not file count alone; the stronger signal is modules outside `app` importing from `app`.

## Success Criteria

- No `src/modules/**` file imports from `@/app/*`.
- No `src/auth/**` infrastructure file imports route-specific helpers from `@/app/*`, unless the technical design explicitly accepts a route adapter reason.
- Record search query state has a stable module seam that both Reporting and UI can import.
- Home blocked/access view shaping lives at a seam that does not make auth depend on `src/app`.
- Existing unit tests, type-check, and lint pass after implementation.
- User-facing behavior remains unchanged.

## Constraints And Assumptions

- This is a structural refactor for maintainability, not a product behavior change.
- Release target remains `local_dev`.
- Existing stack, module names, and DDD bounded-context vocabulary should be reused.
- Because no UI behavior is intended to change, Experience Prototype and Behavior Spec are not useful unless later design uncovers behavior changes.

## Required Downstream Gates

- Domain Discovery / Domain Impact: not required; no domain policy or lifecycle change is intended.
- Project Foundation Architecture: not required; existing foundation already defines Web App Shell and module ownership.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: not required; no user-facing experience change is intended.
- Behavior Spec / BDD / E2E: not required for the intent as stated; regression coverage can rely on existing unit tests and type-check unless technical design finds a behavioral risk.
- Feature Technical Design: required, because module seams, file moves, import direction, and test surface should be explicit before implementation.
- TDD Implementation: required after approved technical design; enable or update focused tests first where behavior is protected by pure helpers.
- Verification: required after implementation.
- Target-Aware Release: not required beyond local verification, because there are no schema, config, deployment, auth provider, or operational changes.
- Learning Loop: not required.
- Artifact Compression: required after the refactor completes.

## Open Questions

- Should `RecordQueryState` belong under Reporting, Fund Ledger, or a small route-query module outside `src/app`?
- Should `HomeBlockedView` remain a view model, or should auth depend only on a smaller redirect reason mapper?
- Should this slice stop after removing inward imports, or also begin grouping the larger `src/app` top-level files by workflow?

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm the first implementation slice should target inward imports from `src/modules` and `src/auth` to `src/app`.
  - Confirm larger `src/app` folder grouping remains out of scope for this slice.
  - Confirm no user-facing behavior change is intended.
- must_check:
  - Do not start implementation before Feature Technical Design is approved or explicitly accepted as risk.
  - Preserve current Traditional Chinese copy and route behavior.
  - Avoid creating abstract seams that have only one caller unless they remove a real inward dependency.
- acceptance_signals:
  - Scope is small enough to complete as a structural refactor.
  - Success criteria are import-direction and regression-test based.
  - Required downstream gates are limited to technical design, TDD implementation, verification, and compression.
- unresolved_blockers:
  - The exact destination modules for query state and blocked access view need technical design.
- next_step:
  - Feature Technical Design for `app-seam-refactor`.
