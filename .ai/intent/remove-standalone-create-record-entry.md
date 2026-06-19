---
id: remove-standalone-create-record-entry
stage: intent
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-20-remove-standalone-create-record-entry
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/intent/home-family-fund.md
  - .ai/spec/story-ledger-entry-creation.md
  - .ai/prototype/web-foundation.md
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  existing_intent:
    - .ai/intent/home-family-fund.md
  existing_story:
    - .ai/spec/story-ledger-entry-creation.md
  existing_prototype:
    - .ai/prototype/web-foundation.md
  current_code:
    - src/app/dashboard-navigation.ts
    - src/app/record-create-actions.tsx
    - src/app/(app)/records/new/page.tsx
    - src/app/(app)/records/page.tsx
    - src/app/(app)/page.tsx
reviewed_at: 2026-06-20
---

# Remove Standalone Create Record Entry

## Decision Summary

- decision: proceed
- first_next_gate: Experience Prototype
- owning_skill: experience-prototype
- reason: The request changes the create-record information architecture and authenticated navigation. The domain behavior for creating income and expense records stays the same, but the user-facing entry points need review before implementation.

## User Request

新增紀錄不要有單獨的 URL，並從 sidebar 移除新增入口。Follow-up scope: `/records` should also be removed because it duplicates the homepage/monthly report surface too closely. Additional scope: homepage should be the only create-record entry point, so reimbursements and recurring pages should not show `新增收入` or `新增支出`.

## Change Classification

- change_type: page_change
- secondary_types:
  - navigation_ia_change
  - route_behavior_change
  - component_change
- release_target: local_dev

## Affected Surfaces

| Surface | Impact |
|---|---|
| Routes | `/records/new` currently exists as a redirect to `/?create=income`; this standalone create-record URL should be removed or made unavailable according to the approved behavior spec. |
| Routes | `/records` currently duplicates the homepage monthly records/report surface; this standalone records page should be removed. |
| Navigation and IA | Sidebar currently includes `紀錄` and previously included `新增`; standalone records/create entries should be removed. |
| Page UI | Existing page-level create actions on retained work surfaces should remain the create-record entry points unless a later prototype changes placement. |
| Page UI | Reimbursements and recurring pages keep their own functional workflows but no longer expose create-record buttons. |
| Dialog/query flow | Existing `?create=income` and `?create=expense` dialog links on eligible pages may remain as contextual in-page state rather than a standalone page. |
| Auth/permissions | Create-record visibility still follows existing `canCreateOwnRecords` and `canCreateRecordsForOthers` permissions. |
| Tests | Navigation and route tests should assert that the sidebar no longer exposes `新增`, while contextual create buttons still work. |

## Current Code Signals

- `src/app/dashboard-navigation.ts` defines a visible sidebar item labelled `新增` with href `/?create=income`.
- `src/app/dashboard-navigation.ts` also defines a visible sidebar item labelled `紀錄` with href `/records`.
- `src/app/(app)/records/new/page.tsx` is a standalone route that redirects to `/?create=income`.
- `src/app/(app)/records/page.tsx` is a standalone records route that duplicates much of the homepage monthly workspace.
- `src/app/record-create-actions.tsx` already owns contextual create-record links and dialog hosting through `buildCreateRecordHref`, `RecordCreateHeaderActions`, `RecordCreateMobileActionBar`, and `RecordCreateDialogHost`.
- `src/app/(app)/records/page.tsx` exposes contextual `新增收入` and `新增支出` actions in the records page header and records section.
- `src/app/(app)/page.tsx` exposes dashboard-level create-record actions through the shared record-create adapter.

## Scope

- Remove the standalone create-record route as a product surface.
- Remove the standalone records route as a product surface.
- Remove the `新增` item from authenticated sidebar navigation.
- Remove the `紀錄` item from authenticated sidebar navigation.
- Preserve contextual create-record actions only on the homepage/monthly report surface.
- Remove create-record actions from reimbursements and recurring pages.
- Preserve existing record creation permissions and server-side ledger creation behavior.
- Preserve Traditional Chinese UI copy.

## Non-Goals

- Do not redesign the ledger record form.
- Do not change income, expense, payer/source, reimbursement, category, or permission domain rules.
- Do not change category filtering or archived-category behavior.
- Do not add production release, analytics, or monitoring work for this local_dev slice.

## Success Criteria

- Authenticated sidebar no longer displays a standalone `新增` navigation item for members who can create records.
- Authenticated sidebar no longer displays a standalone `紀錄` navigation item.
- Users can still create income and expense records from contextual homepage actions.
- Reimbursements and recurring pages do not display `新增收入` or `新增支出`.
- Direct access to `/records/new` no longer behaves like a supported standalone create-record URL after the approved implementation path.
- Direct access to `/records` no longer behaves like a supported standalone records URL after the approved implementation path.
- Existing authorization rules still prevent users from creating records they are not allowed to create.
- Automated verification covers sidebar visibility and at least one contextual create-record path.

## Domain Discovery Need

- required: false
- reason: The request does not change ledger events, record ownership, category policy, reimbursement status, roles, or permissions. It only changes entry-point placement and route availability.

## Foundation Architecture Need

- required: false
- reason: The existing Next.js route foundation, authenticated layout, sidebar navigation, dialog pattern, and test setup are sufficient.

## Foundation Implementation Need

- required: false
- reason: No scaffold, framework, component library, or test foundation change is required.

## Experience Prototype Need

- required: true
- timing: next
- reason: User-facing navigation and create-entry placement are changing. A lightweight production-stack prototype/update should confirm that record creation remains discoverable without a sidebar item or standalone URL.
- user_facing_surfaces:
  - authenticated sidebar without `新增`
  - authenticated sidebar without `紀錄`
  - homepage contextual create-record actions
  - reimbursement and recurring pages without create-record actions
  - mobile create-record action placement
  - default not-found behavior for `/records` and `/records/new`

## Behavior Spec / BDD / E2E Need

- required: true
- timing: after Experience Prototype
- reason: The implementation should be covered by explicit navigation and route behavior scenarios before code changes.
- scenarios_to_cover:
  - Member who can create records does not see `新增` in the sidebar.
  - Member does not see `紀錄` in the sidebar.
  - Member can still open create-income and create-expense dialogs from contextual page actions.
  - Reimbursements and recurring pages do not expose create-income or create-expense actions.
  - `/records` is not a supported records page.
  - `/records/new` is not a supported create-record page.
  - Permissions for creating own records and creating records for others remain unchanged.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: The slice needs a small decision on whether `/records/new` should be deleted, redirected to a neutral records page, or return not-found, and which tests should lock the behavior.

## Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: Navigation and route availability changes should be represented in local verification evidence.
- learning_loop_required: false
- learning_reason: This is a local MVP IA cleanup with no production analytics or experiment selected.

## Open Questions

- Direct visits to `/records/new` should use the default not-found behavior because the route is removed.
- Direct visits to `/records` should use the default not-found behavior because the route is removed.
- `contextual create actions` means homepage page-local buttons such as `新增收入` / `新增支出`; these are retained as the replacement entry point.
- Query-based create dialog URLs like `/?create=income` should stop being the modal-opening mechanism. The modal should open through client state and close on browser refresh.
- The create form should use `useActionState` for pending/result/error state instead of redirecting to query parameters.

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm `/records` should be removed from route and sidebar because homepage is the retained monthly records/report surface.
  - Confirm success behavior after `useActionState` submit: close modal, keep modal open with reset form, or another behavior.
  - Confirm homepage is the only create-record entry point and reimbursements/recurring remove create-record actions.
- acceptance_signals:
  - Experience Prototype can update the production-stack UI without changing ledger domain behavior.
  - Behavior Spec can lock sidebar, contextual action, and direct-route expectations before implementation.
- unresolved_blockers:
  - Success modal behavior must be selected before technical design and implementation.
- next_step:
  - Experience Prototype
