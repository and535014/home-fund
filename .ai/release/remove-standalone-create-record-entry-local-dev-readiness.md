---
id: remove-standalone-create-record-entry-local-dev-readiness
stage: release
status: complete
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/remove-standalone-create-record-entry.md
  - .ai/prototype/remove-standalone-create-record-entry.md
  - .ai/spec/remove-standalone-create-record-entry.md
  - .ai/technical-design/remove-standalone-create-record-entry.md
  - .ai/implementation/remove-standalone-create-record-entry.md
  - .ai/verification/remove-standalone-create-record-entry.md
outputs:
  - local_dev_release_assessment
  - release_checks
  - accepted_risks
  - production_gap_list
trace_links:
  commits:
    - 7ff09c4 Refactor homepage record creation
    - 070baaa Verify homepage record creation refactor
    - e9303a3 Cover mobile record creation entry
  verification:
    - .ai/verification/remove-standalone-create-record-entry.md
reviewed_at: 2026-06-20
---

# Remove Standalone Create Record Entry Local Dev Release Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_ready
- rationale: The route, navigation, and create-record modal-state changes are verified by type-check, lint, build, and DB-backed browser E2E. The slice is suitable for local development review and demo on the existing local PostgreSQL and controlled-auth setup. No production release claim is made.

## Included Local Dev Capability Changes

| Capability | Status | Evidence |
|---|---|---|
| Sidebar no longer exposes standalone create/records navigation | ready for local_dev | `src/app/dashboard-navigation.test.ts`; verification artifact. |
| `/records` and `/records/new` are removed product routes | ready for local_dev | `e2e/create-record.spec.ts`; build route list has no `/records` routes. |
| Homepage is the only create-record entry surface | ready for local_dev | `e2e/create-record.spec.ts` homepage-only entry test. |
| Reimbursements and recurring pages keep their workflows without create buttons | ready for local_dev | `e2e/create-record.spec.ts` homepage-only entry test. |
| Create modal uses client state instead of URL state | ready for local_dev | `e2e/create-record.spec.ts` no `create` / `result` URL assertions. |
| Create form uses action state for validation/success | ready for local_dev | `src/app/record-entry-panel.tsx`, `src/app/ledger-record-actions.ts`, and browser validation coverage. |
| Mobile footer create entry opens the same modal | ready for local_dev | `e2e/create-record.spec.ts` mobile viewport test. |

## Release Checks

| Check | Command / Evidence | Status |
|---|---|---|
| Type checking | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass after sequential rerun; parallel Prisma generate can hit transient `EEXIST`. |
| Build | `corepack pnpm build` | pass; route list contains `/`, `/_not-found`, app auth/admin/workflow routes, and no `/records` or `/records/new`. |
| Targeted create-record E2E | `pnpm test:e2e e2e/create-record.spec.ts` | pass: 8 tests including income, fund expense, member expense, validation, reload close, not-found routes, homepage-only entry, and mobile footer entry. |
| Verification artifact | `.ai/verification/remove-standalone-create-record-entry.md` | pass for `local_dev`. |
| Worktree before release artifact | `git status --short` | clean before this release artifact was authored. |

## Runtime And Configuration

- No new environment variables are required.
- No Prisma migration is required.
- No seed data change is required beyond existing local/E2E fixtures.
- Existing local dev prerequisites remain unchanged: pnpm, Docker PostgreSQL or compatible local database, Prisma generated client, and controlled-auth E2E headers outside production.
- Automated Google OAuth smoke is not required for this slice because it does not change auth provider flow, callback routes, or session creation.

## Route And Smoke Checklist

Local reviewer smoke paths:

1. Open `/` as a create-capable controlled or local member.
2. Confirm sidebar shows `總覽` and no `新增` / `紀錄`.
3. Click `新增收入` and `新增支出`; each opens a modal without changing the URL.
4. Reload with a modal open; confirm the modal closes.
5. Submit a valid income or expense; confirm modal closes and the new record appears.
6. Open `/reimbursements?month=2026-06` and `/recurring?month=2026-06`; confirm no create-record buttons appear and page-specific workflows remain visible.
7. Open `/records` and `/records/new`; confirm default not-found behavior.
8. On a mobile-sized viewport, use the footer `新增支出` action and confirm the dialog opens without URL mutation.

## Rollback

- Code rollback for local_dev can revert these commits in reverse order:
  - `e9303a3 Cover mobile record creation entry`
  - `070baaa Verify homepage record creation refactor`
  - `7ff09c4 Refactor homepage record creation`
- No database rollback is needed because no schema or data migration was introduced.
- Reverting `7ff09c4` would restore the previous route/query-driven create-record entry behavior and standalone records/create surfaces.

## Accepted Local Dev Risks

- Quality commands that invoke `prisma generate` should be run sequentially; parallel runs can race on generated Prisma output directories.
- Manual focus-return verification and mobile visual scan were not performed in this release pass, though modal behavior is covered by browser tests and existing dialog primitives.
- Git reported local repository housekeeping warnings about unreachable loose objects during commit. This is repository maintenance, not an app release blocker.

## Not Production Ready

Production release remains out of scope and would require:

- Hosting target and environment separation.
- Production database target, migration/rollback runbook, and backup/restore expectations.
- Production Google OAuth origin and redirect URI smoke.
- Production secrets management for `DATABASE_URL`, Better Auth, and OAuth credentials.
- Monitoring/logging/error reporting and incident response expectations.
- Production smoke tests for auth, permissions, create-record, reimbursement, recurring, and removed route behavior.
- Analytics or feedback signals if product learning is required.

## Review Gate

- decision: ready_for_local_dev_review
- acceptance_signals:
  - Build, type-check, lint, and targeted DB-backed E2E pass.
  - Route list confirms removed `/records` surfaces.
  - Verification is complete and passes for `local_dev`.
- unresolved_blockers:
  - None for local_dev.
- next_step:
  - Learning Loop if this local_dev change will be reviewed with users or used to collect feedback.
  - Otherwise Artifact Compression can summarize the completed slice before pruning is considered.
