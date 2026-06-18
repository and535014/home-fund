---
id: impl-home-family-fund-permission-matrix-browser-checks
stage: implementation
status: implemented
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-permission-matrix-browser-checks
outputs:
  - tests
  - code_changes
  - architecture_alignment
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC1
    - AC2
    - AC3
    - AC4
    - AC5
    - AC6
    - AC7
    - AC8
    - AC9
    - AC10
  bdd_scenarios:
    - General member is blocked from creating income for another member
    - General member is blocked from creating member-paid expense for another member
    - Finance manager can create for another member
  test_plan_items:
    - DB-backed E2E permission matrix
    - Controlled auth seeded role fixture
    - Full local quality gate
reviewed_at: 2026-06-18
---

# Implementation Log for Permission Matrix Browser Checks

## Naming Trace

- story_id: story-mvp-hardening-permission-matrix-browser-checks
- implementation_id: impl-home-family-fund-permission-matrix-browser-checks
- verification_design_id: vd-home-family-fund-permission-matrix-browser-checks
- change_id: home-family-fund-mvp-hardening
- route_slug: `/`
- test_files: `e2e-db/permission-matrix.spec.ts`
- code_component_names: `prisma/seed.sql`, controlled auth current-member data source
- analytics_event_names: none

## Delivery Profile
This implementation supports `local_dev` for the MVP profile. It uses controlled auth and deterministic seed data; it does not cover production Google OAuth or reimbursement mutation authorization.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `e2e-db/permission-matrix.spec.ts` for general-member browse and denied cross-member create | Initial DB E2E could not run until Docker was started; after seed change targeted spec passed | Added `user-e2e-general` account and linked `member-mei` to `google-e2e-general` in `prisma/seed.sql` | Exercises current-member data source, not legacy `x-e2e-current-member-email` fixture |
| 2 | Denied income and denied member-paid expense scenarios | Passed | E2E mutates hidden member inputs in the browser before submitting real server action form | Proves UI hiding cannot bypass command-level authorization |
| 3 | Finance-manager create-for-other scenario | Passed | Reused existing `user-e2e-linked` finance-manager fixture | Confirms positive role path still works |
| 4 | Full DB-backed suite | Passed 14 tests | No extra app code needed | Existing server action/domain command already enforced permission correctly |

## Coding Summary
- Added `e2e-db/permission-matrix.spec.ts` with four DB-backed Playwright scenarios:
  - linked active general member can browse dashboard;
  - general member cannot create income for another member;
  - general member cannot create member-paid expense for another member;
  - finance manager can create income for another member.
- Updated `prisma/seed.sql` so `member-mei` has `googleSubject='google-e2e-general'`, with matching Better Auth `User` and `Account` rows for `user-e2e-general`.
- No production code change was needed: existing `createLedgerRecordAction`, `createLedgerRecord`, and `authorize` already reject unauthorized target members and surface `permission_denied`.

## Web Architecture Alignment

- architecture_artifact: `.ai/architecture/home-family-fund-permission-matrix-browser-checks.md`
- route_or_layout_changes: none
- page_or_feature_module_changes: none
- shared_component_changes: none
- state_or_data_boundary_changes: added deterministic seed identity for controlled auth
- validation_boundary_changes: none; tests submit valid form shapes so failures isolate authorization
- provider_or_cross_cutting_changes: none
- metadata_or_navigation_changes: none
- error_loading_empty_state_changes: existing inline alert handles `permission_denied`
- accepted_duplication: E2E-local helper for direct hidden-input mutation
- extraction_trigger_followed: no extraction needed until more permission E2E specs reuse direct submission helpers

## Refactor Summary
No behavior refactor was needed after tests passed. `next-env.d.ts` test-generated churn was reverted.

## Deviations
None. Reimbursement permission browser checks remain explicitly deferred because no reimbursement mutation UI/action exists.

## Remaining Risks
- Direct form mutation is an intentional E2E bypass test, not a normal user path.
- Production OAuth and deployment readiness remain outside this `local_dev` story.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm denied scenarios prove no DB-visible mutation.
  - Confirm general-member fixture uses controlled auth and seeded Better Auth account rows.
  - Confirm reimbursement authorization remains deferred.
- must_check:
  - `corepack pnpm test:e2e:db` passes with permission spec included.
  - Alert copy remains localized and accessible through `role=alert`.
  - Finance-manager positive path remains green.
- acceptance_signals:
  - Full unit, type, lint, non-DB E2E, and DB-backed E2E gates pass.
- unresolved_blockers:
  - None for local_dev create-record permission matrix.
- next_step:
  - verification-runner
