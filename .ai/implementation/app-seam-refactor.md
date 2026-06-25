---
id: implementation-app-seam-refactor
stage: tdd-implementation
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/app-seam-refactor.md
  - .ai/technical-design/app-seam-refactor.md
outputs:
  - src/modules/reporting/record-query.ts
  - src/modules/reporting/record-query.test.ts
  - src/modules/reporting/record-search-query.ts
  - src/modules/reporting/record-search-query.test.ts
  - src/modules/identity-access/home-blocked-view.ts
  - src/modules/identity-access/home-blocked-view.test.ts
  - src/app/home-access.ts
  - src/auth/app-access.ts
trace_links:
  technical_design:
    - .ai/technical-design/app-seam-refactor.md
  source_files:
    - src/modules/reporting/record-query.ts
    - src/modules/identity-access/home-blocked-view.ts
reviewed_at: 2026-06-26
---

# App Seam Refactor TDD Implementation

## Scope Implemented

- Moved record search query state and pure in-memory record filtering helpers from `src/app/record-query.ts` to `src/modules/reporting/record-query.ts`.
- Moved the corresponding tests from `src/app/record-query.test.ts` to `src/modules/reporting/record-query.test.ts`.
- Updated Reporting query builder and `/search` UI/action imports to use `@/modules/reporting/record-query`.
- Added `src/modules/identity-access/home-blocked-view.ts` for access-failure view shaping.
- Added focused tests for blocked access view copy and callback error mapping.
- Updated `src/app/home-access.ts` to import blocked access view shaping and keep only home dashboard/access composition.
- Updated `src/auth/app-access.ts` to import blocked access view shaping from Identity and Access instead of `src/app`.
- Left `src/components/layout/* -> @/app/record-create-context` imports unchanged because they are out of scope for this slice.

## TDD Evidence

Red steps:

- `corepack pnpm test src/modules/reporting/record-query.test.ts`
  - failed because `./record-query` did not exist after moving the test first.
- `corepack pnpm test src/modules/identity-access/home-blocked-view.test.ts`
  - failed because `./home-blocked-view` did not exist after adding the test first.

Green focused checks:

- `corepack pnpm test src/modules/reporting/record-query.test.ts src/modules/reporting/record-search-query.test.ts`
  - 2 files passed, 13 tests passed.
- `corepack pnpm test src/modules/reporting/record-query.test.ts src/modules/reporting/record-search-query.test.ts src/modules/identity-access/home-blocked-view.test.ts src/app/home-access.test.ts src/auth/server-current-member.test.ts`
  - 5 files passed, 31 tests passed.

Green full checks:

- `corepack pnpm lint`
- `corepack pnpm type-check`
- `corepack pnpm test`
  - 45 files passed, 214 tests passed.

## Import Direction Evidence

Command:

```bash
rg -n "from ['\"]@/app|from ['\"]\\.\\./app" src/modules src/auth --glob '!src/generated/**'
```

Result:

- no matches.

Wider check still finds the accepted out-of-scope Web App Shell imports:

- `src/components/layout/authenticated-mobile-nav.tsx -> @/app/record-create-context`
- `src/components/layout/record-create-sidebar-button.tsx -> @/app/record-create-context`
- `src/components/layout/shared-layout.test.tsx -> @/app/record-create-context`

## Notes

- No user-facing copy changed; blocked access copy was moved as-is.
- No route, server action, database schema, Prisma migration, seed, or deployment config changed.
- `corepack pnpm type-check` and `corepack pnpm test` initially failed when run in parallel with another command that also ran `prisma generate`; rerunning the commands sequentially passed. Avoid parallel Prisma generation in verification.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm `src/modules` and `src/auth` no longer depend on `src/app`.
  - Confirm Reporting is the right module seam for record query state.
  - Confirm Identity and Access is the right module seam for blocked access view shaping.
- must_check:
  - Verification should rerun import direction, lint, type-check, and unit tests sequentially.
  - Out-of-scope `src/components/layout` imports should remain a future Web App Shell cleanup candidate.
- next_step:
  - Verification for `app-seam-refactor`.
