---
id: remove-standalone-create-record-entry
stage: experience-prototype
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/remove-standalone-create-record-entry.md
  - .ai/prototype/web-foundation.md
  - src/app/dashboard-navigation.ts
  - src/app/record-create-actions.tsx
  - src/app/create-record-dialog.tsx
  - src/app/record-entry-panel.tsx
  - src/app/(app)/records/new/page.tsx
outputs:
  - production_stack_prototype_plan
  - ux_acceptance_criteria_draft
  - behavior_spec_handoff
trace_links:
  intent:
    - .ai/intent/remove-standalone-create-record-entry.md
  components:
    - src/app/dashboard-navigation.ts
    - src/app/record-create-actions.tsx
    - src/app/create-record-dialog.tsx
    - src/app/record-entry-panel.tsx
  routes:
    - src/app/(app)/page.tsx
    - src/app/(app)/records/page.tsx
    - src/app/(app)/records/new/page.tsx
reviewed_at: 2026-06-20
---

# Remove Standalone Create Record Entry Prototype

## Prototype Decision

- decision: proceed_to_behavior_spec
- prototype_mode: production-stack component update plan
- reason: The requested experience is a narrow IA and modal-state change on existing production components. No separate sandbox route is needed; the intended prototype surface is the real authenticated app shell and record-create component suite.

## User-Confirmed Decisions

- Sidebar `新增` is removed for all roles.
- `/records/new` is directly removed. The app should use the framework's default not-found behavior for this path.
- Sidebar `紀錄` is removed for all roles.
- `/records` is directly removed because it duplicates the homepage/monthly report surface.
- Homepage is the only create-record entry point; reimbursements and recurring pages do not show `新增收入` or `新增支出`.
- Record creation is opened from page-local buttons, not from a standalone route or shareable create URL.
- The modal is client state. Opening the modal does not write `?create=...` into the URL.
- Browser refresh closes the modal because no URL state preserves it.
- Record creation form submission should use `useActionState` instead of redirect/query feedback.
- Successful record creation closes the modal, refreshes page data, and shows success feedback.

## Clarified Language

`contextual create actions` means create-record controls placed inside the current work surface, such as `新增收入` and `新增支出` buttons in the page header or mobile action bar. These are not sidebar navigation items and not standalone URLs.

## Intended Production Surface

| Surface | Prototype Behavior |
|---|---|
| Authenticated sidebar | Navigation includes monthly report, reimbursements, recurring, categories, and members according to existing permissions; it never includes `新增` or `紀錄`. |
| Dashboard page | Existing page-level `新增收入` / `新增支出` actions remain visible to users who can create records. Clicking one opens the modal through client state. This is the only create-record entry surface. |
| Records page | `/records` is removed rather than retained as a duplicate record list page. |
| Reimbursements page | Keeps reimbursement settlement functionality but removes create-record header/footer actions. |
| Recurring page | Keeps recurring reminder confirmation functionality but removes create-record header/footer actions. |
| Mobile footer action bar | Mobile income/expense actions remain available on the homepage only and open the same client-state modal. |
| `/records` | Route file is removed; direct visits fall through to default Next.js not-found. |
| `/records/new` | Route file is removed; direct visits fall through to default Next.js not-found. |
| Modal close/reload | Closing the modal returns to the same page without navigation. Refreshing the page leaves the modal closed. |
| Form feedback | Validation and permission errors render inside the modal from `useActionState`; success closes the modal, refreshes page data, and shows existing toast/page feedback without a `create` query parameter. |

## Component Shape

- `src/app/dashboard-navigation.ts`
  - Remove the `新增` and `紀錄` items from the item list entirely, not conditionally by role.
- `src/app/(app)/records/page.tsx`
  - Delete the route file so `/records` is no longer app-owned.
- `src/app/(app)/records/new/page.tsx`
  - Delete the route file so the path is no longer app-owned.
- `src/app/record-create-actions.tsx`
  - Replace link-based `buildCreateRecordHref(...)` usage for create actions with client buttons that call a local open handler.
  - Keep role visibility checks based on `context.homeView.accessHints.actions.canCreateOwnRecords`.
  - Provide a shared record-create trigger/modal host component so desktop header actions, page toolbar actions, and mobile footer actions use the same state model.
- `src/app/create-record-dialog.tsx`
  - Accept controlled `open`, `onOpenChange`, and mode props from the record-create state owner.
  - Do not infer initial open state from search params.
- `src/app/record-entry-panel.tsx`
  - Convert the form from `form action={createLedgerRecordAction}` redirect behavior to `useActionState`.
  - Keep the existing field layout and Traditional Chinese labels.
  - Render pending, success, validation, and permission feedback inline.
- `src/app/ledger-record-actions.ts`
  - Behavior Spec and Technical Design should decide the exact action result contract. Expected direction: return structured state for `useActionState`, revalidate affected paths on success, and avoid redirecting for normal form results.

## Flow

1. User opens the monthly dashboard where create actions are allowed.
2. Sidebar has no `新增` or `紀錄` item.
3. User activates `新增收入` or `新增支出` inside the page surface.
4. The current page opens `CreateRecordDialog` with the selected mode through client state.
5. User submits the form.
6. `useActionState` shows pending state, then inline success/error state.
7. On success, the app refreshes/revalidates the current page data, closes the modal, and shows success feedback.
8. If the user refreshes before or after submission, the modal is closed because open state is not encoded in the URL.

## States Covered

- Sidebar for create-capable admin, finance manager, and general member: no `新增` item.
- Sidebar for create-disabled member: no `新增` item.
- Sidebar for all roles: no `紀錄` item.
- Desktop homepage: page-local create buttons open modal.
- Reimbursements and recurring pages: no create-record buttons.
- Mobile homepage action bar: compact income/expense buttons open modal.
- Modal idle state for income and expense.
- Modal pending state during submit.
- Modal validation error state without route navigation.
- Modal permission error state without route navigation.
- Modal success state without `?create=success`.
- Browser refresh with previously open modal: modal closed.
- Direct `/records`: default not-found.
- Direct `/records/new`: default not-found.

## Accessibility And Focus

- Create trigger buttons need accessible names `新增收入` and `新增支出`.
- Opening the modal moves focus into the dialog using the existing shadcn dialog behavior.
- Closing the modal returns focus to the trigger where possible.
- Pending submit state disables the submit button and announces clear status text.
- Inline errors use `role="alert"` or field-level descriptions so validation is not toast-only.
- The mobile footer actions must remain reachable by keyboard and screen-reader navigation.

## Responsive Baseline

- Desktop: create actions stay in the page header/action area; sidebar remains navigation-only.
- Mobile: bottom action bar remains the primary create affordance on eligible pages.
- No route/query state should be required for either breakpoint.
- Text labels must remain stable and not resize layout when pending/error state appears.

## Fixture And Review Strategy

- Use existing local seed/controlled-auth data for admin, finance manager, general member, and disabled/create-restricted member scenarios.
- Use existing active income and expense categories so the modal can be reviewed in both modes.
- Use the dashboard page `/` as the primary review route.
- Use retained secondary work routes, such as `/reimbursements` or `/recurring`, to verify create actions are absent while page-specific functionality remains.
- Direct route review: `/records` should show the default not-found result after implementation removes the file.
- Direct route review: `/records/new` should show the default not-found result after implementation removes the file.

## UX Acceptance Criteria Draft

- The authenticated sidebar never contains a `新增` item.
- The authenticated sidebar never contains a `紀錄` item.
- A user who can create records can still find create actions on the relevant page surfaces.
- The only relevant create-record page surface is the homepage.
- Reimbursements and recurring pages do not expose create-record controls.
- Clicking a create action opens a modal without changing the URL.
- Reloading the page closes any previously open create modal.
- The create form submits through in-modal action state, not a redirect that reopens the modal through `?create=...`.
- Direct `/records/new` is not an app-owned create-record path.
- Direct `/records` is not an app-owned records path.

## E2E Scenario Candidates

- Given an admin opens `/`, then the sidebar has no `新增` navigation item, and `新增收入` opens the income dialog without changing the URL.
- Given an admin opens `/`, then `新增支出` opens the expense dialog without changing the URL.
- Given an admin opens `/reimbursements`, then `新增收入` and `新增支出` are not visible.
- Given an admin opens `/recurring`, then `新增收入` and `新增支出` are not visible.
- Given the create dialog is open, when the page reloads, then the dialog is closed.
- Given a validation error during record creation, then the error appears inside the dialog and the URL does not contain `create` or `result`.
- Given a successful record creation, then the record appears in the current page data and the URL does not contain `create=success`.
- Given a user opens `/records`, then the app shows the default not-found route.
- Given a user opens `/records/new`, then the app shows the default not-found route.

## Known Gaps

- No production code was changed in this gate; implementation waits for Behavior Spec and Feature Technical Design per workflow governance.
- The exact `useActionState` result type and success-close mechanics need Technical Design.
- Existing E2E tests currently depend on query-driven dialog opening and some `/records` coverage and must be updated during TDD Implementation.
- Existing server action currently redirects for success/error; that must change before the prototype behavior can be verified in browser tests.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm homepage is the retained monthly records/report surface and `/records` should be removed.
  - Confirm page-local create buttons are the intended replacement for sidebar, `/records`, and `/records/new`.
  - Confirm homepage is the only create-record entry point and reimbursements/recurring remove create-record actions.
- acceptance_signals:
  - Behavior Spec can write URL, reload, modal, route, and form-state scenarios without ambiguity.
  - Technical Design can replace redirect/query form results with `useActionState` safely.
- unresolved_blockers:
  - None for Behavior Spec.
- next_step:
  - Behavior Spec / BDD / E2E
