---
id: impl-home-family-fund-category-management
stage: implementation
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - vd-home-family-fund-mvp
  - story-category-management
  - exp-category-management
outputs:
  - tests
  - code_changes
  - refactor_notes
trace_links:
  acceptance_criteria:
    - AC3
    - AC7
  bdd_scenarios:
    - General member cannot create a record for another member
  test_plan_items:
    - Integration Category + Ledger + Reporting
    - Unit authorization decisions independent of UI
reviewed_at:
---

# Implementation Log for Category Management

## Delivery Profile
This implementation supports `local_dev` under the `mvp` profile. The slice adds pure category catalog rules and category-management authorization before Prisma persistence, settings UI, or category picker integration are implemented.

## TDD Cycles
| Cycle | Test Added First | Result | Code Change | Notes |
|---:|---|---|---|---|
| 1 | `category-catalog.test.ts` for create, duplicate active names, rename, archive, available category listing, and unauthorized management | Failed on missing module, then passed | Added `src/modules/categorization/category-catalog.ts` | Covers category lifecycle and AC7 create-time category availability. |
| 2 | Authorization test for `manage_categories` | Passed after authorization extension | Added `manage_categories` command and `manage_categories` capability | Keeps category management flexible while admins remain allowed by default. |

## Coding Summary
- Added a Categorization module with `createCategory`, `renameCategory`, `archiveCategory`, and `listAvailableCategories`.
- Added category type, name, status, and duplicate active-name validation.
- Modeled archiving as status change instead of deletion so historical records can retain category ids and labels.
- Extended Identity and Access with a `manage_categories` command.
- Allowed admins to manage categories by default and allowed explicit `manage_categories` capability for future admin-configured permissions.

## Refactor Summary
- No broad refactor was performed. The new capability field is optional on `AuthenticatedMember`, so existing authorization callers remain compatible.

## Deviations
- The product has not finalized whether finance managers can manage categories. This slice does not hard-code finance-manager category rights; admins can grant an explicit category capability later.
- Category persistence and UI are not implemented in this slice.
- Historical record display is supported by preserving archived category data, but report/category label rendering remains deferred.

## Remaining Risks
- Duplicate comparison is exact after trimming; case/locale folding can be revisited if household category naming needs it.
- Prisma schema must preserve category id references on historical records and avoid hard deletion.
- Category management UI still needs role/capability state and Traditional Chinese copy.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm explicit `manage_categories` capability is the right flexible model.
  - Confirm duplicate names are scoped to active categories of the same type.
- must_check:
  - Archived categories remain readable.
  - Active category listing excludes archived categories.
  - Unauthorized category management is rejected by command authorization.
- acceptance_signals:
  - Category unit tests pass.
  - Full local quality gate passes.
- unresolved_blockers:
  - None for moving to Verification Runner for this slice.
- next_step:
  - verification-runner
