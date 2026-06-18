---
id: td-recurring-reminder-confirmation-ui
stage: technical-design
status: accepted
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - spec-recurring-reminder-confirmation-ui
  - proto-recurring-reminder-confirmation-ui
  - ddd-home-family-fund
outputs:
  - architecture_decisions
  - implementation_plan
  - data_contracts
  - server_action_contract
  - test_mapping
trace_links:
  spec:
    - .ai/spec/recurring-reminder-confirmation-ui.md
  prototype:
    - .ai/prototype/recurring-reminder-confirmation-ui.md
  bounded_contexts:
    - Recurring Schedule
    - Fund Ledger
    - Identity and Access
    - Reporting
  domain_events:
    - Recurring reminder confirmed
    - Income recorded
    - Expense recorded
    - Monthly report generated
reviewed_at: 2026-06-18
---

# Technical Design for Recurring Reminder Confirmation UI

## Delivery Profile
This design targets `local_dev` under the MVP profile. It implements the missing dashboard confirmation workflow for already-created reminder-mode recurring occurrences. It does not add recurring-rule management screens, production OAuth changes, reminder notifications, analytics, or a dedicated recurring route.

## Context and Forces
- Domain logic already has `confirmRecurringOccurrence(actor, occurrence, rule, context)`.
- The homepage currently renders `待確認週期項目`, but pending occurrence rows only include occurrence fields and have no action.
- The dashboard pattern already uses app-local server actions, controlled auth, Prisma persistence wrappers, redirect feedback, and DB-backed E2E.
- Confirmation must create a ledger record and mark the occurrence posted atomically.
- Confirmation authorization follows ledger-record creation permission, not recurring-rule management permission.
- The seed has `rule-living-kai` and `occurrence-living-kai`, but also has an existing `income-living-june` record. Tests must prove the occurrence linkage or a uniquely created record, not merely any living-fee row.

## Boundaries
| Boundary | Owns | Collaborates With | Reason |
|---|---|---|---|
| Recurring Schedule Domain | Validates occurrence/rule match, pending status, and rule shape | Fund Ledger domain through `createLedgerRecord` | Existing domain owner for reminder confirmation. |
| Recurring Persistence Wrapper | Loads occurrence/rule/categories and persists ledger + occurrence status in one transaction | Prisma, Recurring Schedule, Fund Ledger | Keeps DB mutation atomic and testable outside UI. |
| Server Action Boundary | Parses form data, resolves current member, maps result to redirect feedback | Dashboard UI, current-member data source | Existing browser mutation contract. |
| Dashboard Pending Reminder UI | Displays pending rule details, action visibility, dialog, local loading/error state | Server action, dashboard read model | Existing MVP user surface. |
| Reporting Read Model | Removes posted occurrence from pending list and includes created record in totals | Dashboard data source | User-visible proof of success. |

## Data Model and Read Contract

### Pending Reminder View Model
Add an app-facing type instead of pushing raw Prisma relation shape into the page:

```ts
export type PendingRecurringReminder = {
  id: string;
  recurringRuleId: string;
  month: string;
  status: "pending";
  type: "income" | "expense";
  name: string;
  amountCents: number;
  expectedOn: string;
  categoryId: string;
  categoryName: string;
  targetMemberId: string;
  targetMemberName: string;
  canConfirm: boolean;
};
```

The existing `RecurringOccurrence` can remain the domain input. The dashboard should receive richer pending reminder UI data either by:
- extending `HomeDashboardData.pendingOccurrences` to a richer `pendingReminders` field, preferred for clarity; or
- adding a derived `pendingReminderItems` field on `HomeDashboardView`, acceptable if it keeps domain and UI types separate.

Preferred design: extend `createHomeDashboardDataSource` to load pending occurrences with `recurringRule` and `category` relation data, then map to `PendingRecurringReminder` after current-member access is known in `home-access.ts`.

### Prisma Query Delta
Update the `recurringOccurrence.findMany` select to include enough rule details:

```ts
select: {
  id: true,
  recurringRuleId: true,
  month: true,
  status: true,
  ledgerRecordId: true,
  recurringRule: {
    select: {
      id: true,
      type: true,
      amountCents: true,
      categoryId: true,
      sourceMemberId: true,
      paymentSource: true,
      payerMemberId: true,
      dayOfMonth: true,
      note: true,
      active: true,
      category: { select: { name: true } },
    },
  },
}
```

The mapper should compute:
- `name`: trimmed rule note, falling back to `週期收入` or `週期支出`.
- `expectedOn`: `${month}-${dayOfMonth padded to 2 digits}`.
- `targetMemberId`: income `sourceMemberId`; member-paid expense `payerMemberId`; fund-paid expense current actor for authorization preview only if needed.
- `canConfirm`: derived with `authorize(currentMember, create_income_record/create_expense_record)` using the same target rules as fund ledger creation.

## Server Action Contract
Add an app-local server action:

```ts
// src/app/recurring-reminder-actions.ts
export async function confirmRecurringReminderAction(formData: FormData): Promise<void>
```

Form fields:
- `month`: selected dashboard month, parsed through `readDashboardMonth`.
- `occurrenceId`: required string.

Redirect contract:
- success: `/?month=2026-06&recurring=confirmed`
- permission or domain failure: `/?month=2026-06&recurring=<reason>`

Initial feedback reason set:
- `confirmed`
- `permission_denied`
- `missing_occurrence`
- `occurrence_already_posted`
- `occurrence_rule_mismatch`
- `ledger_record_creation_failed`
- `invalid_amount`
- `invalid_day_of_month`
- `missing_category`
- `archived_category`
- `category_type_mismatch`
- `missing_income_source_member`
- `missing_member_payer`
- `stale_confirmation`

The page should read `recurring` query feedback and pass it to the pending reminder panel. Success feedback is optional because the removed pending item and created ledger row are the primary proof.

## Persistence Command Contract
Add a persistence wrapper near the recurring schedule module:

```ts
// src/modules/recurring-schedule/recurring-confirmation-command.ts
export async function confirmRecurringOccurrenceInDatabase(
  actor: AuthenticatedMember,
  command: { occurrenceId: string },
  context: {
    prisma: PrismaClient;
    householdId?: string;
    generateLedgerRecordId?: () => string;
  },
): Promise<RecurringOccurrenceResult>
```

Responsibilities:
1. Resolve `householdId`, defaulting to `household-demo` like existing command wrappers.
2. Generate the ledger record id before calling the domain function so tests can assert deterministic ids.
3. In a Prisma transaction:
   - load the pending occurrence by `id` and `householdId`, including its recurring rule.
   - load active/archived category validation data for the household.
   - map Prisma rows to `RecurringOccurrence` and `RecurringRule`.
   - call `confirmRecurringOccurrence(actor, occurrence, rule, { categories, generateLedgerRecordId })`.
   - if the result is not ok, return it without writing.
   - create the ledger record from `result.ledgerRecord`.
   - conditionally update `RecurringOccurrence` with `where: { id, householdId, status: "pending", ledgerRecordId: null }` via `updateMany`.
   - if the conditional update count is not `1`, rollback and return `occurrence_already_posted` or `stale_confirmation`.

Concurrency note: because `LedgerRecord` is created before the occurrence can reference it, a failed conditional update must rollback the transaction. Implement with a small internal rollback error class caught outside the transaction and mapped to a typed failure. Do not leave an unlinked ledger record.

The persistence wrapper should not call the existing `createLedgerRecordInDatabase`, because confirmation needs one transaction across both `LedgerRecord` and `RecurringOccurrence`. Reuse or extract the ledger create-data mapping if needed.

## UI Component Design
Add a client component for pending reminders:

```ts
// src/app/recurring-reminder-confirmation-panel.tsx
export function RecurringReminderConfirmationPanel(props: {
  feedback?: RecurringReminderFeedback;
  month: string;
  pendingReminders: PendingRecurringReminder[];
  confirmRecurringReminderAction: (formData: FormData) => void;
})
```

Placement:
- Replace the current static `待確認週期項目` section in `src/app/page.tsx`.
- Keep the section inside the existing dashboard aside column.
- Reuse `Card`, `Item`, `Button`, `Dialog`, `Alert`, and `Badge`.

State:
- Client component owns selected reminder id and confirmation dialog open state.
- Submit uses a form action with hidden `month` and `occurrenceId`.
- Button is hidden or disabled when `canConfirm` is false.
- Error feedback renders within the section with `role=alert`.

Accessible names:
- Section heading: `待確認週期項目`.
- Per-row action: `確認 Kai 每月生活費提醒 入帳` or equivalent.
- Dialog title: `確認週期提醒`.
- Submit button: `確認建立紀錄`.

Empty state:
- `沒有待確認週期項目`
- Secondary copy should explain that confirmed records appear in `本月紀錄`.

## Routing and Page Integration
- `src/app/page.tsx` imports `confirmRecurringReminderAction`.
- `HomePage` reads `recurring` feedback from query params.
- `buildHomeAccessViewFromAccess` returns pending reminder view data in addition to existing `report.pendingRecurringItems` or replaces the static pending rendering path.
- `buildMonthlyReport` can continue consuming domain `pendingOccurrences` for count/pending semantics; UI can consume the richer pending reminder list.

## Authorization Strategy
- UI preview uses the same authorization target as `createLedgerRecord`:
  - income target is `sourceMemberId`.
  - expense target is `payerMemberId` for member-paid expenses.
  - fund-paid expense target falls back to actor id.
- Server action is authoritative. It resolves the current member from request headers and calls the persistence wrapper.
- Do not add real Google OAuth steps.
- Do not hand-write Better Auth cookies.
- Keep controlled auth headers for E2E.

## Error and Feedback Strategy
| Failure | User Feedback | Mutation |
|---|---|---|
| `permission_denied` | `你沒有確認這筆週期提醒的權限。` | No mutation |
| `missing_occurrence` | `找不到這筆週期提醒，請重新整理後再試。` | No mutation |
| `occurrence_already_posted` / `stale_confirmation` | `這筆週期提醒已確認入帳，請重新整理。` | No duplicate ledger record |
| validation failures | `這筆週期提醒的規則目前無法建立紀錄，請檢查分類或規則設定。` | No mutation |
| success | `已確認週期提醒。` optional | Ledger created, occurrence posted |

## ADRs
### ADR-1: Use a Server Action Instead of a New API Route
- Status: accepted
- Decision: Implement `confirmRecurringReminderAction(FormData)` beside existing dashboard actions.
- Rationale: Existing create-record and reimbursement browser mutations already use server actions and redirect feedback.
- Consequence: E2E verifies the real browser form/action path and dashboard reload.

### ADR-2: Add a Recurring Persistence Wrapper with a Single Transaction
- Status: accepted
- Decision: Implement confirmation persistence in `src/modules/recurring-schedule`, not directly in the app action.
- Rationale: The domain function is pure, but persistence must coordinate `LedgerRecord` creation and `RecurringOccurrence` status update atomically.
- Consequence: Integration tests can cover stale and duplicate submissions without rendering the browser.

### ADR-3: Keep Pending Confirmation Inline on the Dashboard
- Status: accepted
- Decision: Replace the existing static pending section with an interactive dashboard panel.
- Rationale: The dashboard is where users see monthly records and totals; confirmation should immediately prove its accounting effect.
- Consequence: No new route or navigation change for MVP.

### ADR-4: Use Ledger Creation Permission for Confirmation
- Status: accepted
- Decision: Confirmation authorization follows the target ledger record's create permission.
- Rationale: Confirmation creates an income/expense record; it does not manage or edit the recurring rule.
- Consequence: General members can confirm only their own resulting records; finance managers/admins can confirm for others.

## Test Mapping
| Level | File / Area | Coverage |
|---|---|---|
| Unit | `src/modules/recurring-schedule/recurring-rules.test.ts` | Other-member denial through ledger authorization, note/name preservation, already-posted rejection. |
| Unit | `src/app/home-access.test.ts` or access-hint mapper test | `canConfirm` derivation for finance manager vs general member. |
| Integration | new `src/modules/recurring-schedule/recurring-confirmation-command.test.ts` | Transaction creates ledger + updates occurrence, stale update rolls back ledger creation, missing occurrence maps cleanly. |
| Contract | `src/app/recurring-reminder-actions` test if action testing pattern exists; otherwise DB E2E | Form data + current member + redirect feedback mapping. |
| E2E DB | `e2e/recurring-reminder-confirmation.spec.ts` | Finance manager confirms seeded reminder and dashboard updates from DB. |
| E2E DB | same spec | General member cannot confirm Kai reminder; action/UI denial leaves occurrence pending. |
| E2E/mobile | same or smoke spec | Pending/empty state fits mobile width and dialog is accessible. |

## Implementation Sequence
1. Add failing domain/unit coverage for permission and record naming gaps if not already covered.
2. Add `PendingRecurringReminder` data shape and extend dashboard data source/query mapping.
3. Add `confirmRecurringOccurrenceInDatabase` with transaction, deterministic id injection, and rollback-on-stale handling.
4. Add `confirmRecurringReminderAction` with `month`/`occurrenceId` parsing and redirect feedback.
5. Replace static pending section with `RecurringReminderConfirmationPanel`.
6. Add DB-backed Playwright coverage for finance manager success and general member denial.
7. Run unit/type/lint and targeted E2E/DB E2E commands.

## Implementation Preconditions
- Keep `.ai/spec/recurring-reminder-confirmation-ui.md` accepted for local_dev before coding.
- Decide whether to extract the ledger record Prisma create-data mapper from `ledger-record-command.ts`; duplication is acceptable only if kept small and covered by tests.
- Use deterministic `generateLedgerRecordId` in integration tests.
- Ensure E2E reset/seed runs before each mutation scenario because confirmation changes `occurrence-living-kai` from pending to posted.
- When asserting dashboard success, use occurrence linkage, unique created record id/name, or count/totals delta. Do not rely on the pre-existing `income-living-june` row.

## Review Gate
- decision: approve_for_implementation
- owner: implementation-cycle
- rationale: Route placement, server action contract, transaction boundary, authorization policy, data shape, and test obligations are explicit.
- must_check:
  - Confirmation writes ledger record and occurrence update atomically.
  - Duplicate/stale confirmation cannot leave orphan ledger records.
  - UI permission preview matches server authorization but does not replace it.
  - DB-backed E2E uses controlled auth and real persistence.
- unresolved_blockers:
  - None for local_dev.
- next_step: TDD implementation for recurring reminder confirmation UI.
