---
id: verification-search-route-local-structure
stage: verification
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/search-route-local-structure.md
  - .ai/technical-design/search-route-local-structure.md
  - .ai/implementation/search-route-local-structure.md
outputs:
  - verification_report
trace_links:
  implementation:
    - .ai/implementation/search-route-local-structure.md
  routes:
    - src/app/(app)/search/page.tsx
    - src/app/(app)/(home)/page.tsx
  source_files:
    - src/app/(app)/search/_components/record-search-panel.tsx
    - src/app/(app)/search/_actions/record-search-actions.ts
    - src/app/_record-detail/record-list-detail.tsx
    - src/app/_record-detail/reimbursement-payment-readback-actions.ts
reviewed_at: 2026-06-26
---

# Search Route Local Structure Verification

## Result

- decision: pass_for_local_dev_review
- release_target_supported: local_dev
- recommended_next_gate: Artifact Compression for `search-route-local-structure`.

## Scope Verified

- `/search` route-owned files now live under `src/app/(app)/search/_components`, `_actions`, and `_lib`.
- Shared record detail and reimbursement payment readback files now live under `src/app/_record-detail`.
- `src/app/(app)/search/page.tsx` imports `RecordSearchPanel` through a route-local seam.
- Home dashboard imports `RecordListDetail` through the shared `_record-detail` seam.
- Top-level `src/app` no longer contains search-owned or shared record-detail files from this slice.
- No domain or auth module imports route-local search folders or `_record-detail`.
- No user-facing behavior, route, UI layout, Traditional Chinese copy, domain rule, Prisma schema, migration, seed, auth provider, or deployment config changed.

## Commands Run

- `find src/app -maxdepth 1 -type f | sort`
  - Result: passed; search-owned and record-detail files are absent from top-level `src/app`.
- `rg -n "@/app/record-search|@/app/batch-|@/app/reimbursement-payment|@/app/record-list|@/app/record-detail|@/app/record-display" src/app --glob '!src/generated/**'; true`
  - Result: passed; no matches.
- `find 'src/app/(app)/search' src/app/_record-detail -maxdepth 3 -type f | sort`
  - Result: passed; moved files are present in the designed folders.
- `rg -n "\\(app\\)/search/_|_record-detail" src/modules src/auth --glob '!src/generated/**'; true`
  - Result: passed; no matches.
- `corepack pnpm lint`
  - Result: passed.
- `corepack pnpm type-check`
  - Result: passed.
- `corepack pnpm test`
  - Result: passed; 45 files, 214 tests.

Commands that invoke `prisma generate` were run sequentially to avoid generated-client write collisions.

## Code Review Notes

- The implementation follows the technical design: `/search` private folders own search route code, while `_record-detail` is a real two-route seam used by home and search.
- Splitting reimbursement payment readback actions out of search actions prevents home/dashboard record detail from depending on `/search` private modules.
- `category-visuals.tsx`, `action-state.ts`, `route-search-params.ts`, and `use-action-state-effect.ts` remain top-level app-wide helpers as designed.
- Existing auth checks remain in server actions; moving files did not remove `requireAuthenticatedMember` or authorization checks.
- The diff is mostly moves/renames, with minimal new implementation for `reimbursement-payment-readback-actions.ts`.

## Prototype, BDD, And Domain Alignment

- Experience Prototype: not applicable; accepted risk in technical design because this slice has no intended user-facing behavior change.
- Behavior Spec / BDD / E2E: not applicable; accepted risk in technical design because behavior must remain unchanged and existing unit coverage protects the moved server actions/readback behavior.
- Domain Discovery / Domain Impact: not required; no domain policy, lifecycle, role, permission, or financial rule changed.

## Residual Risk

- This verification did not run browser E2E because no UI behavior was intended to change. Full unit checks and structural/import checks passed.
- Remaining top-level app helpers still deserve future review, especially `category-visuals.tsx`, `action-state.ts`, and create-record/dashboard workflow files.
- This verification supports `local_dev` only. It does not imply production readiness, but no Target-Aware Release gate is required for this local structural refactor.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm route-local and shared record-detail seams are acceptable.
  - Confirm local_dev verification is sufficient for a behavior-preserving file-structure refactor.
  - Confirm remaining top-level app helpers stay future cleanup candidates, not scope gaps.
- must_check:
  - No implementation changes are needed before compression unless reviewer requests a different route-local folder convention.
- next_step:
  - Artifact Compression for `search-route-local-structure`.
