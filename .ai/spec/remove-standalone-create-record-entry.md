---
id: remove-standalone-create-record-entry
stage: behavior-spec
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/remove-standalone-create-record-entry.md
  - .ai/prototype/remove-standalone-create-record-entry.md
  - .ai/prototype/web-foundation.md
  - .ai/spec/story-ledger-entry-creation.md
  - e2e/create-record.spec.ts
  - e2e/permission-matrix.spec.ts
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  intent:
    - .ai/intent/remove-standalone-create-record-entry.md
  prototype:
    - .ai/prototype/remove-standalone-create-record-entry.md
  current_tests:
    - e2e/create-record.spec.ts
    - e2e/permission-matrix.spec.ts
  target_components:
    - src/app/dashboard-navigation.ts
    - src/app/record-create-actions.tsx
    - src/app/create-record-dialog.tsx
    - src/app/record-entry-panel.tsx
    - src/app/ledger-record-actions.ts
reviewed_at: 2026-06-20
---

# Remove Standalone Create Record Entry Behavior Spec

## Decision Summary

- decision: proceed_to_feature_technical_design
- reason: Intent and prototype are accepted for the observable behavior. This spec locks route, sidebar, modal, URL, refresh, action-state, and success-close expectations before technical design and TDD implementation.

## Final Acceptance Criteria

1. The authenticated sidebar never shows a `新增` or `紀錄` navigation item for any role or permission set.
2. Members who can create records still see page-local `新增收入` and `新增支出` controls on the homepage.
3. Reimbursements and recurring pages do not show `新增收入` or `新增支出`.
4. Clicking a homepage create control opens the matching create-record modal without changing the browser URL.
5. The create modal open state is not encoded in search params; refreshing the page closes the modal.
6. Direct visits to `/records` and `/records/new` use the default app not-found behavior because both routes are removed.
7. Create-record form submission uses action state, not redirect/query feedback, for pending, validation, permission, and success results.
8. Validation and permission errors keep the modal open, preserve the attempted form context where practical, and render an inline alert inside the modal.
9. Successful record creation closes the modal, refreshes affected page data, shows success feedback, and leaves the URL without `create`, `result`, or `create=success`.
10. Record creation domain authorization does not change: general members cannot create records for others; finance managers/admins retain existing allowed cross-member creation behavior.
11. Desktop and mobile homepage create controls use the same behavior: no URL mutation on open, modal closes on refresh, success closes modal.

## BDD Scenarios

### Scenario 1: Sidebar Has No Standalone Records Or Create Entry

Given an authenticated member can create records  
When the member opens the app shell  
Then the sidebar navigation does not contain `新增`  
And the sidebar navigation does not contain `紀錄`  
And the rest of the visible navigation follows existing role permissions

### Scenario 2: Open Income Modal From Page Action

Given an authenticated member can create records  
And the member opens `/` with `month=2026-06`  
When the member activates `新增收入` in the page action area  
Then the `新增收入` dialog opens  
And the current URL does not contain `create` or `result`

### Scenario 3: Open Expense Modal From Homepage

Given an authenticated member can create records  
And the member opens `/` with `month=2026-06`  
When the member activates `新增支出`  
Then the `新增支出` dialog opens  
And the current URL does not contain `create` or `result`

### Scenario 3a: Reimbursements And Recurring Do Not Create Records

Given an authenticated member can create records  
When the member opens `/reimbursements` or `/recurring` with `month=2026-06`  
Then `新增收入` is not visible  
And `新增支出` is not visible  
And the page-specific reimbursement or recurring workflow remains visible

### Scenario 4: Refresh Closes Open Modal

Given an authenticated member has opened the create-record dialog from a page action  
When the browser page reloads  
Then the dialog is closed  
And the member remains on the same route and month context

### Scenario 5: Missing Category Error Stays In Modal

Given an authenticated member opens the income dialog from a page action  
When the member submits required fields without selecting a category  
Then the `新增收入` dialog remains open  
And an inline alert says `請選擇分類。`  
And the URL does not contain `create` or `result`

### Scenario 6: Successful Income Creation Closes Modal

Given an authenticated member opens the income dialog from a page action  
When the member submits a valid income record  
Then the dialog closes  
And the new record appears in the current page data  
And success feedback is visible  
And the URL does not contain `create`, `result`, or `create=success`

### Scenario 7: Direct Standalone Records Routes Are Gone

Given any visitor opens `/records` or `/records/new`  
When the app resolves the route  
Then the app shows the default not-found page  
And no create-record dialog is opened

### Scenario 8: Unauthorized Cross-Member Create Still Fails

Given a general member opens the income dialog from a page action  
When the member attempts to create income for another member through manipulated form state  
Then the dialog remains open  
And an inline alert says `目前帳號沒有新增這筆紀錄的權限。`  
And the unauthorized record does not appear in the page data  
And the URL does not contain `create` or `result`

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Sidebar removed | `/` | `x-e2e-auth-user-id: user-e2e-linked` | desktop | `getByRole("navigation")` or sidebar region has no link/button named `新增` or `紀錄`; retained homepage link is named `總覽`. |
| Open income modal | `/?month=2026-06` | linked finance manager | desktop | Click page action `新增收入`; assert dialog heading `新增收入`; assert URL lacks `create` and `result`. |
| Open expense modal | `/?month=2026-06` | linked finance manager | desktop | Click `新增支出`; assert dialog heading `新增支出`; assert URL lacks `create` and `result`. |
| Reimbursements no create | `/reimbursements?month=2026-06` | linked finance manager | desktop | Assert no `新增收入` or `新增支出`; reimbursement controls remain visible. |
| Recurring no create | `/recurring?month=2026-06` | linked finance manager | desktop | Assert no `新增收入` or `新增支出`; recurring confirmation controls remain visible. |
| Refresh closes modal | `/?month=2026-06` | linked finance manager | desktop | Open dialog, reload, assert `getByRole("dialog")` count is 0; URL still includes month only. |
| Validation error | `/?month=2026-06` | linked finance manager | desktop | Open income dialog, fill fields except category, submit, assert alert text and URL lacks `create`/`result`. |
| Success closes modal | `/?month=2026-06` | linked finance manager | desktop | Open income dialog, fill valid data, submit, assert dialog hidden, record visible, success toast or status visible, URL lacks `create`/`result`. |
| Routes removed | `/records`, `/records/new` | any controlled auth or unauthenticated state | desktop | Assert default not-found heading/text; assert no create dialog. |
| Mobile open modal | `/?month=2026-06` | linked finance manager | mobile | Use mobile viewport, click footer income or expense action, assert dialog opens and URL remains unchanged. |
| Permission denied | `/?month=2026-06` | `user-e2e-general` | desktop | Manipulate hidden/select state as current permission-matrix test does; submit; assert permission alert, record absent, URL lacks `create`/`result`. |

## Test Plan

### Unit / Component

- Update navigation unit coverage around `getVisibleDashboardNavigationItems` so `新增` and `紀錄` are not returned for admin, finance manager, general member, or create-disabled access hints.
- Add or update component tests for the shared record-create action component to prove trigger buttons call client open state without rendering anchor hrefs containing `create=`.
- Add action-state unit coverage for the create-record action result shape after Technical Design finalizes the contract.

### E2E

- Update `e2e/create-record.spec.ts` to open dialogs by clicking page-local controls instead of visiting URLs with `create=income` or `create=expense`.
- Update create-record E2E so it no longer uses `/records` as the primary review route.
- Update validation assertions to expect no query-param feedback.
- Update success assertions to expect the modal closed and URL clean.
- Update `e2e/permission-matrix.spec.ts` to open dialogs through page-local controls before manipulating form fields.
- Add `/records` and `/records/new` not-found coverage.
- Add reimbursement and recurring page coverage that create-record actions are absent.
- Add one mobile viewport check for the footer action bar opening the modal without URL mutation.

### Manual / Visual

- Manually scan desktop sidebar for admin, finance manager, general member, and non-admin admin-page-restricted states.
- Manually verify dialog focus moves into the modal and returns to the trigger on close.
- Manually verify reload closes an open modal on desktop and mobile.

## Accessibility And Responsive Requirements

- Create trigger accessible names remain `新增收入` and `新增支出`.
- Dialog heading identifies the mode: `新增收入` or `新增支出`.
- Pending submit disables the submit button and exposes a readable status label.
- Inline errors use `role="alert"` or field-associated error text.
- Success feedback uses the existing toast/status pattern and must not be the only way to know the record was added; the new row must be visible after data refresh.
- Mobile footer controls remain reachable and do not overlap content.

## Technical Design Inputs

- Decide the exact `useActionState` server action result type.
- Decide how success closes the modal while still showing feedback and refreshing server-rendered data.
- Decide how to share one modal state owner across desktop header actions, page toolbar actions, and mobile action bar.
- Decide whether query parsing for `create`/`result` is removed entirely or kept temporarily for backward compatibility without opening the modal.
- Decide the route deletion mechanics for `src/app/(app)/records/page.tsx` and `src/app/(app)/records/new/page.tsx`, plus expected not-found behavior under the authenticated route group.

## Accepted Risks

- Existing tests that deep-link into the create modal will fail until implementation rewrites them to click page-local triggers.
- Existing URLs with `?create=income` or `?create=expense` will no longer open the modal. This is intentional because the requested behavior says create is not URL state.
- Removing `/records` and `/records/new` may show the global not-found UI rather than an authenticated-frame not-found. This is acceptable for this slice unless Technical Design identifies a Next.js route-group issue.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm successful create closes the modal and shows success feedback.
  - Confirm query-based modal opening is intentionally removed, not preserved as a compatibility path.
  - Confirm current create-enabled pages should keep their page-local create controls unless Technical Design narrows the surface.
- acceptance_signals:
  - Feature Technical Design can define component boundaries and server action contracts without unresolved UX behavior.
  - TDD can update failing tests first around sidebar removal, modal open state, no URL mutation, success close, validation errors, and route not-found.
- unresolved_blockers:
  - None for Feature Technical Design.
- next_step:
  - Feature Technical Design
