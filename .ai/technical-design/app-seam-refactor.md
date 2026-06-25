---
id: technical-design-app-seam-refactor
stage: feature-technical-design
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/app-seam-refactor.md
  - .ai/project-context.md
  - .ai/foundation-architecture/home-family-fund.md
  - .ai/code-understanding/home-family-fund.md
outputs:
  - module_seam_design
  - import_direction_policy
  - test_mapping
trace_links:
  target_files:
    - src/app/record-query.ts
    - src/app/record-query.test.ts
    - src/modules/reporting/record-search-query.ts
    - src/modules/reporting/record-search-query.test.ts
    - src/app/home-access.ts
    - src/app/home-access.test.ts
    - src/auth/app-access.ts
  target_modules:
    - src/modules/reporting
    - src/modules/identity-access
    - src/app
    - src/auth
reviewed_at: 2026-06-26
---

# App Seam Refactor Technical Design

## Decision Summary

- decision: ready_for_tdd_implementation_after_review
- prototype_policy: accepted risk; no Experience Prototype is needed because this slice has no intended UI or copy change.
- behavior_spec_policy: accepted risk; no Behavior Spec / BDD / E2E is needed because behavior must remain unchanged and is already covered by focused unit tests.
- record_query_policy: move `RecordQueryState` and pure record query helpers from `src/app/record-query.ts` to `src/modules/reporting/record-query.ts`.
- search_query_policy: make `src/modules/reporting/record-search-query.ts` import `RecordQueryState` from the Reporting module seam, not from `src/app`.
- home_access_policy: split blocked access view shaping from dashboard composition.
- blocked_view_policy: move `HomeBlockedView`, `buildHomeBlockedViewFromAccess`, and supporting blocked-view copy to `src/modules/identity-access/home-blocked-view.ts`.
- app_adapter_policy: keep `buildHomeAccessView` and `buildHomeAccessViewFromAccess` in `src/app/home-access.ts` because they compose route/dashboard view models from Reporting and Reimbursement read models.
- import_direction_policy: after implementation, `src/modules/**` must not import from `@/app/*`; `src/auth/app-access.ts` must not import from `@/app/*`.
- next_gate: TDD Implementation

## Current Seam Leak

The strongest issue is import direction, not folder size alone.

- `src/modules/reporting/record-search-query.ts` imports `RecordQueryState` from `@/app/record-query`.
- `src/modules/reporting/record-search-query.test.ts` imports `initialRecordQueryState` from `@/app/record-query`.
- `src/auth/app-access.ts` imports blocked access view shaping from `@/app/home-access`.

This makes `src/app` act like a shared core module. That contradicts the foundation architecture: Web App Shell should own route UX and adapt domain/read models, while Reporting and Identity and Access should expose stable module seams.

`src/components/layout/*` also imports `@/app/record-create-context`, but that is intentionally out of scope. Layout depends on an app-level create-record provider today; changing it would begin a wider Web App Shell refactor.

## Module Boundaries

### Reporting Record Query Module

Create `src/modules/reporting/record-query.ts` by moving the existing pure query state and in-memory filtering helpers out of `src/app/record-query.ts`.

The module owns:

- `RecordSortOrder`
- `RecordQueryState`
- `RecordQueryOptions`
- `initialRecordQueryState`
- `buildRecordQueryOptions`
- `nextDraftQueryForType`
- `nextDraftQueryForParticipant`
- `nextDraftQueryForReimbursementStatus`
- `applyRecordQuery`
- `isInitialRecordQuery`
- `recordFilterCount`

Rationale:

- Reporting already owns record search query construction through `record-search-query.ts`.
- The UI and server query builder should use one query-state interface.
- Fund Ledger owns confirmed records, but search/filter query state is a Reporting concern because it describes a derived read surface, not ledger command behavior.

Keep the file name `record-query.ts` under Reporting rather than inventing a generic `src/shared` seam. There is no second domain that justifies a broader shared module.

### App Record Query Adapter

Delete `src/app/record-query.ts` if all imports can be updated cleanly.

Do not keep a re-export adapter unless needed for incremental compatibility. A re-export would hide the leak rather than remove it because future callers might continue importing from `@/app/record-query`.

Route/UI files that currently import `@/app/record-query` should import from `@/modules/reporting/record-query`.

### Identity Access Blocked View Module

Create `src/modules/identity-access/home-blocked-view.ts`.

The module owns:

- `HomeBlockedView`
- `buildHomeBlockedViewFromAccess`
- blocked-view copy for unauthenticated, unlinked Google account, inactive member, and callback error messages.

Rationale:

- `src/auth/app-access.ts` needs redirect reason and query mapping for failed access.
- The blocked-view language is tied to Identity and Access outcomes, not dashboard composition.
- Moving only the blocked access view keeps the module deep enough: one interface maps access failure into view/redirect data used by both route and auth flows.

This module may import only from `src/modules/identity-access/session-access` types. It must not import from `src/app`.

### App Home Access Adapter

Keep `src/app/home-access.ts`.

It should import `HomeBlockedView` and `buildHomeBlockedViewFromAccess` from `@/modules/identity-access/home-blocked-view`, then continue owning:

- `HomeAccessInput`
- `ResolvedHomeAccessInput`
- `HomeDashboardView`
- `HomeAccessView`
- `buildHomeAccessView`
- `buildHomeAccessViewFromAccess`

Rationale:

- Dashboard composition combines Identity and Access with Reporting and Reimbursement read models for a route-level view.
- That is still a Web App Shell adapter responsibility.
- Moving the entire file into Identity and Access would make Identity and Access depend conceptually on Reporting/Reimbursement dashboard concerns.

## Frontend And Backend Contracts

No user-facing route contract changes.

- URLs remain unchanged.
- Search query behavior remains unchanged.
- Blocked access copy remains unchanged.
- Redirect destinations remain unchanged:
  - unauthenticated -> `/login`
  - non-active/unlinked failures -> `/unauthenticated/logout?reason=...`

No server action, database, Prisma schema, or migration contract changes.

## State, Data, And Validation Ownership

- Record query UI state remains owned by route/client UI.
- Record query state type and pure filter rules move to Reporting.
- Prisma search query construction remains in `src/modules/reporting/record-search-query.ts`.
- Dashboard access composition remains in `src/app/home-access.ts`.
- Access failure view shaping moves to Identity and Access.
- Authorization enforcement remains in `src/auth/app-access.ts` plus `src/modules/identity-access/authorization.ts`.

## Error, Loading, And Empty Strategy

No runtime strategy changes.

The only error-sensitive path is `redirectToUnauthenticatedLogout` in `src/auth/app-access.ts`. It should continue receiving a `HomeBlockedView` with `kind` and optional `errorCode`, then generate the same query string.

## Auth And Permission Boundary

`src/auth/app-access.ts` remains the server-only auth adapter for route/action access.

After implementation it should import:

```ts
import {
  buildHomeBlockedViewFromAccess,
  type HomeBlockedView,
} from "@/modules/identity-access/home-blocked-view";
```

This keeps auth infrastructure dependent on Identity and Access, not Web App Shell.

## Test Mapping

Move or update tests with the module seam:

- Move `src/app/record-query.test.ts` to `src/modules/reporting/record-query.test.ts`.
- Update `src/modules/reporting/record-search-query.test.ts` to import `initialRecordQueryState` from `@/modules/reporting/record-query`.
- Keep `src/app/home-access.test.ts` for dashboard composition behavior.
- Add or move focused tests for `buildHomeBlockedViewFromAccess` into `src/modules/identity-access/home-blocked-view.test.ts`.
- Update `src/app/home-access.test.ts` imports if needed so it still verifies full home access composition.

Minimum TDD order:

1. Add `src/modules/reporting/record-query.test.ts` by moving the current test imports to the planned module path; confirm it fails before moving implementation.
2. Move `record-query.ts` implementation and update imports.
3. Add `src/modules/identity-access/home-blocked-view.test.ts` covering existing blocked-copy cases; confirm it fails before moving implementation.
4. Move blocked-view implementation and update imports.
5. Run focused tests, then full local checks.

Recommended checks:

```bash
corepack pnpm test src/modules/reporting/record-query.test.ts src/modules/reporting/record-search-query.test.ts src/modules/identity-access/home-blocked-view.test.ts src/app/home-access.test.ts src/auth/server-current-member.test.ts
corepack pnpm type-check
corepack pnpm lint
```

## Import Direction Verification

After implementation, run:

```bash
rg -n "from ['\"]@/app|from ['\"]\\.\\./app" src/modules src/auth --glob '!src/generated/**'
```

Expected result:

- no matches in `src/modules`
- no matches in `src/auth`

Run a wider check separately:

```bash
rg -n "from ['\"]@/app|from ['\"]\\.\\./app" src/modules src/auth src/components --glob '!src/generated/**'
```

Expected result may still include `src/components/layout/* -> @/app/record-create-context`; that is out of scope and should be captured as a future Web App Shell cleanup candidate, not fixed in this slice.

## Release Target Implications

- release_target: `local_dev`
- no database migration.
- no seed data change.
- no deployment config change.
- no production OAuth or secret change.
- Target-Aware Release is not required beyond verification evidence.

## Open Risks

- Moving tests and files can produce noisy diffs. Keep the implementation mechanical and avoid opportunistic cleanup.
- If `src/app/record-query.ts` has hidden imports from route-specific UI after implementation starts, prefer moving only pure helpers and leaving route-specific UI state in `src/app`; do not broaden scope.
- If blocked-view copy is later considered Web App Shell copy rather than Identity and Access language, the deeper design would be to make auth depend on a smaller access failure reason mapper. That is not necessary for this slice because both current callers need the same blocked view shape.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `RecordQueryState` and pure record query helpers should move to `src/modules/reporting/record-query.ts`.
  - Confirm blocked access view shaping should move to `src/modules/identity-access/home-blocked-view.ts`.
  - Confirm `src/components/layout` imports from `@/app/record-create-context` remain out of scope.
- must_check:
  - Implementation must not change UI behavior or Traditional Chinese copy.
  - Implementation must not introduce a generic shared folder for one real seam.
  - Import direction verification must pass for `src/modules` and `src/auth`.
- acceptance_signals:
  - Technical design removes the observed inward imports.
  - Test mapping protects both pure query behavior and blocked access behavior.
  - Release impact remains local verification only.
- unresolved_blockers:
  - None if the reviewer accepts the two destination modules.
- next_step:
  - TDD Implementation for `app-seam-refactor`.
