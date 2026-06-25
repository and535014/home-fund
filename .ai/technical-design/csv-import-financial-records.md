---
id: technical-design-csv-import-financial-records
stage: feature-technical-design
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/csv-import-financial-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/csv-import-financial-records.md
  - .ai/prototype/csv-import-financial-records.md
  - .ai/spec/csv-import-financial-records.md
  - .ai/foundation-architecture/home-family-fund.md
  - .ai/code-understanding/home-family-fund.md
outputs:
  - route_boundaries
  - server_action_contracts
  - domain_command_design
  - persistence_design
  - validation_and_duplicate_policy
  - test_mapping
trace_links:
  production_route:
    - /settings/import
  target_components:
    - src/app/(app)/settings/import/page.tsx
    - src/app/(app)/settings/import/csv-import-panel.tsx
    - src/app/csv-import-actions.ts
    - src/app/csv-import-template.ts
  domain_modules:
    - src/modules/fund-ledger/ledger-import.ts
    - src/modules/fund-ledger/ledger-import-command.ts
    - src/modules/fund-ledger/ledger-records.ts
    - src/modules/identity-access/authorization.ts
    - src/modules/identity-access/access-hints.ts
  persistence:
    - prisma/schema.prisma
reviewed_at: 2026-06-25
---

# CSV Import Financial Records Technical Design

## Decision Summary

- decision: approved_for_tdd_implementation
- route_policy: `/settings/import` is a real settings route guarded by a dedicated ledger-import authorization hint.
- authorization_policy: add `import_ledger_records`; admins and finance managers are allowed, general members are denied.
- ui_policy: replace the prototype component with a production client panel using the same approved layout; file selection happens directly from the central button.
- csv_contract: UTF-8 CSV with header `type,date,name,amount,member,category,note`.
- parser_policy: parse on the server with a small CSV parser dependency already added in implementation only if needed; avoid ad hoc string splitting.
- validation_policy: server validation owns row shape, member/category matching, duplicate detection, and ledger command validation.
- matching_policy: exact normalized display name/category name match; ambiguous and missing matches become row-level `需處理`.
- duplicate_policy: no silent deduplication; same-file and existing-ledger duplicate candidates are counted in preview summary without blocking import.
- transaction_policy: confirmation revalidates the latest submitted preview rows and atomically creates all remaining valid ledger records.
- persistence_policy: add import batch and row audit tables; do not store raw CSV bytes after preview.
- reimbursement_policy: CSV import never writes `ReimbursementBatch` or `ReimbursementPayment`.
- next_gate: TDD Implementation

## Route And Component Boundaries

### `/settings/import`

`src/app/(app)/settings/import/page.tsx` remains a server component. It must:

- require an authenticated member.
- check `session.accessHints.actions.canImportLedgerRecords`.
- redirect or deny access consistently with existing settings route patterns when unauthorized.
- load active members and active categories needed for preview correction controls.
- render `PageHeader` title `CSV 匯入`.
- render `CsvImportPanel`.

`src/app/(app)/settings/layout.tsx` should show the `CSV 匯入` settings nav entry only when `canImportLedgerRecords` is true. Stop using `canPerformReimbursement` as the proxy.

### Client Panel

Create `src/app/(app)/settings/import/csv-import-panel.tsx`.

It owns browser-only state:

- selected file metadata and file object.
- latest preview result.
- removed row IDs or row numbers.
- user-overridden member/category mapping values.
- pending state for preview and confirmation.

It does not own validation truth. Any preview shown to the user is returned from server actions.

The panel keeps the approved prototype layout:

- initial centered `匯入收支紀錄` file-picker button and `下載範本`.
- no modal.
- no template download after a file is selected.
- selected file shown as outline `Item`, content-width on desktop and full-width on narrow screens.
- flat preview area, no Card wrapper, no section titles, no extra section background/border.
- row actions icon-only with accessible names.
- summary counts in `TableFooter`.
- mapping select columns with enough mobile minimum width.

### Template Download

Create `src/app/csv-import-template.ts` or colocate a small helper under the import route.

The browser can generate the template client-side because the template is static, but the header and sample rows must be exported from one shared constant used by tests:

```ts
export const LEDGER_IMPORT_TEMPLATE_HEADER = [
  "type",
  "date",
  "name",
  "amount",
  "member",
  "category",
  "note",
] as const;
```

## Authorization Design

Extend `src/modules/identity-access/authorization.ts`:

```ts
export type AuthorizationCommand =
  | ...
  | { type: "import_ledger_records" };
```

Rules:

- linked admin: allowed.
- linked finance manager: allowed.
- linked general member: denied with `finance_manager_required` or a new `ledger_import_required`.
- unlinked member: denied with `google_account_not_linked`.

Prefer a new denial reason `ledger_import_required` only if UI copy needs to distinguish import from reimbursement. Otherwise reuse `finance_manager_required` to avoid broad error-surface churn.

Extend `src/modules/identity-access/access-hints.ts`:

```ts
type AccessActionHints = {
  ...
  canImportLedgerRecords: boolean;
};
```

Settings import nav and page guard must use this hint.

## Persistence Design

Add import audit tables to `prisma/schema.prisma`.

```prisma
enum LedgerImportBatchStatus {
  imported
  failed
}

enum LedgerImportRowStatus {
  imported
  skipped
}

model LedgerImportBatch {
  id                 String                  @id @default(cuid())
  householdId         String
  fileName            String
  fileFingerprint     String
  status              LedgerImportBatchStatus
  importedRowCount    Int
  skippedRowCount     Int
  createdByMemberId   String
  createdAt           DateTime                @default(now())

  household           Household               @relation(fields: [householdId], references: [id], onDelete: Restrict)
  createdByMember     Member                  @relation("LedgerImportBatchCreator", fields: [createdByMemberId], references: [id], onDelete: Restrict)
  rows                LedgerImportRow[]

  @@index([householdId, createdAt])
  @@index([householdId, fileFingerprint])
}

model LedgerImportRow {
  id                 String                 @id @default(cuid())
  batchId             String
  csvRowNumber        Int
  rowFingerprint      String
  status              LedgerImportRowStatus
  ledgerRecordId      String?
  createdAt           DateTime               @default(now())

  batch              LedgerImportBatch       @relation(fields: [batchId], references: [id], onDelete: Cascade)
  ledgerRecord        LedgerRecord?          @relation("LedgerImportCreatedRecord", fields: [ledgerRecordId], references: [id], onDelete: SetNull)

  @@index([batchId, csvRowNumber])
  @@index([rowFingerprint])
  @@index([ledgerRecordId])
}
```

Also add opposite relations:

- `Household.ledgerImportBatches`
- `Member.createdLedgerImportBatches`
- `LedgerRecord.importRow`

Raw uploaded CSV is not stored. The app stores fingerprints, row numbers, created record links, counts, actor, and file name for audit and duplicate support.

## CSV Contract

### Header

Required exact header:

```csv
type,date,name,amount,member,category,note
```

Reject unknown, missing, duplicate, or reordered header columns in MVP. This keeps parsing and user support straightforward.

### Types

| CSV `type` | Ledger command | Category type | Member meaning |
|---|---|---|---|
| `income` | `CreateIncomeRecordCommand` | `income` | source member display name |
| `fund_expense` | `CreateExpenseRecordCommand` with `paymentSource: "fund"` | `expense` | must be blank or `家庭基金` |
| `member_expense` | `CreateExpenseRecordCommand` with `paymentSource: "member"` | `expense` | payer member display name |

`payment_source` is intentionally unsupported because it duplicates `type`.

### Field Normalization

- Trim UTF-8 BOM from the header.
- Trim leading/trailing whitespace for all cells.
- Empty `note` becomes `undefined`.
- Member/category matching uses exact normalized names after trim only.
- Do not case-fold Traditional Chinese; English type values remain lowercase exact values.
- Amount accepts integer or decimal Taiwan-dollar strings without currency symbols or thousands separators in MVP. Technical implementation can accept commas only if tests document it.
- Date must be `YYYY-MM-DD` and pass real calendar validation.

## Domain Module Design

Create `src/modules/fund-ledger/ledger-import.ts` for pure parsing/validation types and rules that do not know Prisma or React.

Core types:

```ts
export type LedgerImportRowType = "income" | "fund_expense" | "member_expense";

export type LedgerImportParsedRow = {
  csvRowNumber: number;
  type: LedgerImportRowType;
  date: string;
  name: string;
  amountCents: number;
  memberName: string;
  categoryName: string;
  note?: string;
  rowFingerprint: string;
};

export type LedgerImportPreviewRow = {
  clientRowId: string;
  csvRowNumber: number;
  raw: Record<string, string>;
  parsed?: LedgerImportParsedRow;
  mappedMemberId?: string;
  mappedCategoryId?: string;
  status: "valid" | "needs_attention" | "removed";
  issues: LedgerImportIssue[];
  duplicateCandidates: LedgerImportDuplicateCandidate[];
};
```

`clientRowId` is deterministic from CSV row number and row fingerprint. It lets the client submit overrides without trusting hidden financial fields.

Validation steps:

1. Parse CSV and header.
2. Convert rows to parsed ledger import rows.
3. Match member/category references.
4. Convert each row to `CreateLedgerRecordCommand`.
5. Run existing `createLedgerRecord` pure domain validation using the actor and active categories.
6. Detect duplicate candidates.
7. Return preview rows with row-level issues.

Create `src/modules/fund-ledger/ledger-import-command.ts` for Prisma-backed preview and confirmation.

Server-backed operations:

```ts
export async function previewLedgerImport(
  actor: AuthenticatedMember,
  input: PreviewLedgerImportInput,
  context: LedgerImportCommandContext,
): Promise<LedgerImportPreviewResult>;

export async function confirmLedgerImport(
  actor: AuthenticatedMember,
  input: ConfirmLedgerImportInput,
  context: LedgerImportCommandContext,
): Promise<LedgerImportConfirmResult>;
```

## Server Action Contracts

Create `src/app/csv-import-actions.ts`.

### Preview

```ts
export type PreviewCsvImportActionResult =
  | {
      ok: true;
      fileName: string;
      fileFingerprint: string;
      rows: LedgerImportPreviewRow[];
      summary: {
        duplicateCount: number;
        importableCount: number;
        removedCount: number;
        needsAttentionCount: number;
      };
      members: { id: string; displayName: string }[];
      categories: { id: string; name: string; type: "income" | "expense" }[];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "invalid_file_type"
        | "file_too_large"
        | "invalid_header"
        | "empty_file"
        | "parse_failed";
      message: string;
    };
```

The action accepts `FormData` with `file`. File constraints for MVP:

- `.csv` filename or `text/csv` MIME when available.
- max 500 rows.
- max 1 MB.

Technical Design chooses conservative limits for local_dev; adjust later only with performance evidence.

### Confirm

```ts
export type ConfirmCsvImportActionInput = {
  fileName: string;
  fileFingerprint: string;
  rows: {
    clientRowId: string;
    csvRowNumber: number;
    rowFingerprint: string;
    removed: boolean;
    memberId?: string;
    categoryId?: string;
  }[];
};
```

The confirm action must not trust client-supplied parsed amounts, names, dates, or types. It must re-read the file content or receive a signed preview token.

For MVP implementation, prefer a signed short-lived preview payload over storing raw CSV server-side:

- preview action returns an opaque `previewToken`.
- token contains file fingerprint and canonical parsed raw rows, signed with an app secret.
- confirm sends `previewToken` plus row removals and mapping overrides.
- server verifies token before revalidation and persistence.

If no suitable signing helper exists, Technical Design permits using a hidden serialized payload only for local_dev if paired with HMAC signing before merge. Do not persist raw CSV.

Confirm result:

```ts
export type ConfirmCsvImportActionResult =
  | {
      ok: true;
      batchId: string;
      importedCount: number;
      skippedCount: number;
      message: "匯入完成";
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "preview_expired"
        | "no_importable_rows"
        | "validation_changed"
        | "commit_failed";
      rows?: LedgerImportPreviewRow[];
      message: string;
    };
```

After success, revalidate:

- `/`
- `/search`
- `/settings/import`

Do not revalidate `/reimbursements`.

## Duplicate Detection

Canonical row fingerprint:

```txt
householdId|type|occurredOn|name-normalized|amountCents|member-or-fund|categoryId|note-normalized
```

Use SHA-256 hex for storage. This is not a security secret; it is a deterministic duplicate key.

Same-file duplicates:

- rows with the same canonical fingerprint in the current preview are counted as duplicate candidates.

Existing-ledger duplicates:

- query active `LedgerRecord` candidates by household, date, amount, type, category, and relevant member/fund fields.
- compare normalized name and note in application code.
- imported rows matching existing active records are counted as duplicate candidates.
- previously imported rows can also be flagged by `LedgerImportRow.rowFingerprint`.

No duplicate row is automatically removed, skipped, or blocked. User can still remove it manually before import.

## Transaction Design

`confirmLedgerImport` runs one Prisma `$transaction`:

1. Authorize actor for `import_ledger_records`.
2. Verify preview token and file fingerprint.
3. Reload active members, active categories, and duplicate candidates.
4. Rebuild commands for all non-removed rows using current overrides.
5. If any remaining row has issues, return `validation_changed` and do not write.
6. Create `LedgerImportBatch`.
7. Create each `LedgerRecord` using the same data shape as `createLedgerRecordInDatabase`.
8. Create `LedgerImportRow` for imported and skipped removed rows.

Removed rows are stored as `skipped` with row fingerprint and CSV row number but no `ledgerRecordId`.

If any create fails, the transaction rolls back. This implements the spec's atomic commit policy for all remaining valid rows.

## UI State And Error Strategy

- Preview action errors appear as an alert above the initial controls or preview area.
- Row-level issues appear inside the row content/status area using Taiwan Traditional Chinese messages.
- `匯入` is disabled when `needsAttentionCount > 0` or `importableCount === 0`; duplicate-only rows remain importable.
- If confirmation returns `validation_changed`, keep the selected file and replace the preview rows with server-returned rows.
- Success shows toast `匯入完成` with imported count, resets local state, and refreshes router state.
- Icon-only buttons keep accessible names from the prototype.

## Test Mapping

### Unit Tests

Add `src/modules/fund-ledger/ledger-import.test.ts`:

- accepts exact header and rejects missing/unknown/reordered headers.
- parses valid income, fund expense, and member expense rows.
- rejects unsupported reimbursement payment rows.
- rejects malformed date, zero/negative amount, missing member/category/name.
- matches members/categories by exact normalized display name/name.
- reports ambiguous member/category names.
- computes stable row fingerprints.
- detects same-file duplicates without removing them.

Add authorization/access-hint tests:

- admin and finance manager can `import_ledger_records`.
- general member cannot.
- `canImportLedgerRecords` is exposed correctly.

### Integration Tests

Add `src/modules/fund-ledger/ledger-import-command.test.ts`:

- preview creates no `LedgerRecord`.
- confirm creates income, fund-paid expense, and member-paid expense records.
- member-paid imported expense has `reimbursementStatus: "refundable"`.
- fund-paid imported expense has `reimbursementStatus: "not_refundable"`.
- reimbursement payment tables remain unchanged.
- duplicate existing ledger rows are summarized without blocking confirmation.
- removed duplicate rows are excluded from duplicate summary and import counts.
- server-side validation changes roll back all rows.
- import batch and row audit records are created.

### E2E Tests

Add `e2e/csv-import.spec.ts`:

- authorized user opens settings `CSV 匯入`, downloads template, selects CSV, sees preview, changes mapping, removes/adds row, imports, sees toast and reset.
- duplicate fixture shows `疑似重複` in the footer summary and keeps import enabled when no blocking validation errors exist.
- general member cannot see settings nav entry and cannot access `/settings/import`.
- mobile viewport keeps file item, icon buttons, table scrolling, and select labels usable.

Use deterministic CSV fixture files under `e2e/fixtures/` or generate temporary files inside the test.

## Migration And Release Implications

- Add Prisma migration for `LedgerImportBatch`, `LedgerImportRow`, and enums.
- Existing data is compatible; no backfill required.
- Local_dev release must run `corepack pnpm db:deploy` against the local database before E2E.
- Production readiness later must decide retention policy and whether import audit rows need export/delete tooling.

## TDD Implementation Plan

1. Add failing unit tests for CSV header, row parsing, matching, duplicate detection, and authorization hint.
2. Add pure `ledger-import.ts`.
3. Add Prisma schema migration and failing integration tests for preview/confirm.
4. Add `ledger-import-command.ts` transaction behavior.
5. Replace prototype panel with production `CsvImportPanel` and server actions.
6. Add Playwright CSV import happy path, duplicate blocker, unauthorized, and mobile layout tests.
7. Run lint, type-check, unit tests, targeted E2E, and update implementation evidence.

## Open Questions For Implementation

- Which signing helper should protect `previewToken`; should we add a tiny HMAC utility or reuse existing auth/session signing?
- Should amount parsing accept comma thousands separators in MVP, or keep template strict and reject them?
- Should `fund_expense` member cell allow only blank and `家庭基金`, or should the template always use `家庭基金` for readability?
- Should duplicate detection include `note`, or should same financial fields with different notes still be warned as possible duplicates?

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm adding import audit tables is worth the migration for duplicate detection and traceability.
  - Confirm preview token signing is preferred over raw CSV persistence.
  - Confirm strict header/order and conservative file limits are acceptable for MVP.
  - Confirm dedicated `import_ledger_records` authorization should replace the reimbursement permission proxy.
- must_check:
  - TDD Implementation must write tests before replacing the prototype.
  - Import confirmation must revalidate server-side and not trust client preview state.
  - Reimbursement payment import remains impossible through this slice.
- acceptance_signals:
  - Boundaries are clear enough to implement without inventing new architecture during TDD.
  - Parser, validation, duplicate, transaction, audit, and UI responsibilities are assigned.
  - Test mapping covers the Behavior Spec acceptance criteria.
- unresolved_blockers:
  - Preview token signing helper and final amount comma policy need implementation-level decision.
- next_step:
  - TDD Implementation for `csv-import-financial-records`.
