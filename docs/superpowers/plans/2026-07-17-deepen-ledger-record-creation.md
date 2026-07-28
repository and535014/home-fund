# Deep Ledger Record Creation And Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將手動新增、CSV 匯入確認與 recurring occurrence 入帳收斂到 3 個 intent-specific entry points，讓 validation、authorization、Ledger record construction、reimbursement-state derivation 與 Prisma projection 集中在同一個 private creation kernel。

**Architecture:** Fund Ledger 新增一個 deep creation Module，外部 Interface 只暴露 `createManualRecord`、`confirmCsvRows`、`postRecurringOccurrence`。3 條路徑各自保留 source-specific orchestration，Prisma transaction、ID／clock internal seams、共同驗證與 projection 留在 Module Implementation；CSV 每列獨立 transaction 並以 batch／row identity 冪等，Recurring posting 則以 member actor 或只具 `post_recurring_occurrence` capability 的 system actor 執行。

**Tech Stack:** Next.js App Router、TypeScript、Prisma 7、PostgreSQL、Vitest、Playwright、Docker-backed isolated E2E database、pnpm。

## Global Constraints

- 主要介面與錯誤訊息使用繁體中文；中文與英文／數字之間保留半形空格。
- 本計畫只處理 Candidate 1；不提前實作 versioned Ledger mutation、Reporting-owned Search 或 reimbursement payment correction。
- Manual、CSV 與 Recurring 必須共用 validation、authorization primitives、Ledger construction、reimbursement-state derivation 與 Prisma projection。
- External Interface 固定為 3 個 intent-specific entry points；不得暴露 generic `LedgerRecordRepository`，也不得建立 generic source union／registry。
- CSV parsing、preview、mapping override 與 duplicate warning 留在 Ledger import Module；fingerprint 只警告，不能作為冪等 identity 或阻擋合法相同內容。
- CSV confirm 每列獨立 transaction；每列結果為 `created`、`rejected` 或 `already_imported`，Ledger record 與 imported row trace 必須原子完成。
- Manual creation 不新增 operation identity；未知結果不得自動重送。
- Recurring posting 的 Ledger record、occurrence state 與 occurrence-to-record trace 必須在同一個 transaction；transient Implementation failure 不得寫成 `posted` 或 `blocked`。
- System actor 不是 Member，也不能成為 `createdByMemberId`、`sourceMemberId` 或 `payerMemberId`；system capability 只允許處理指定 household 的 recurring occurrence。
- Disabled Member 不得成為新 income source 或 expense payer；既有歷史資料仍可讀。`invited` 與 `active` Member 仍可作財務歸屬，延續現有 update command 規則。
- Prisma schema 變更必須附 migration；migration 必須讓 migration-first deploy 視窗中的舊 app 仍可寫入，不手動修改 `src/generated/prisma/`。
- 開發採 TDD；先建立會因缺少行為而失敗的測試，再加入最小實作。只有替代 coverage 通過後才能移除 shallow tests。
- Integration tests 必須透過 3 個 external entry points 操作 isolated PostgreSQL，不以 fake Prisma client 證明 transaction、unique constraint 或 rollback。
- 不平行執行會呼叫 `prisma generate` 的命令。

## Verified Current State

- `HEAD` 是 `f6259e8bb2bdbea1321df02b0ddff9c5c379c25f`，訊息為 `docs(domain): clarify architecture review decisions`；工作樹在規劃前為 clean，`main` 相對 `origin/main` ahead 2。
- CodeGraph index 在規劃時為 up to date：291 files、3,808 nodes、9,401 edges。
- Manual caller：`src/app/ledger-record-actions.ts:createLedgerRecordAction` → `createLedgerRecordInDatabase` → `createLedgerRecord` → `ledgerRecord.create`。
- CSV caller：`src/app/csv-import-actions.ts:confirmCsvImportAction` → `confirmLedgerImportInDatabase`；目前一個 batch transaction 內自行 projection，未呼叫 `createLedgerRecord`，也沒有 batch／row operation identity。
- Recurring callers：`createRecurringEventInDatabase`、`ensureRecurringOccurrencesForMonth`、`confirmRecurringOccurrenceInDatabase` 都呼叫 private `postRecurringEventLedgerRecord`；目前 cron 會找一位 active admin／finance manager 冒充 posting actor。
- Prisma 現況：`LedgerImportBatch` 只有 file fingerprint；`LedgerImportRow` 只有 row fingerprint；`RecurringOccurrenceStatus` 只有 `pending / posted / skipped`，沒有 blocked reason 或 system posting actor kind。
- Current fake-client tests 位於 `ledger-record-command.test.ts`、`ledger-import-command.test.ts`、`recurring-event-command.test.ts`；現有真實 PostgreSQL integration pattern 位於 `reimbursement-command.integration.test.ts`，由 `e2e/run-playwright.sh` 啟用。

## Target Interface

`src/modules/fund-ledger/ledger-record-creation.ts` 是唯一 external seam：

```ts
export type LedgerCreationMemberActor = {
  kind: "member";
  member: HouseholdScopedAuthenticatedMember;
};

export type RecurringPostingSystemActor = {
  kind: "system";
  capability: "post_recurring_occurrence";
  householdId: string;
};

export type LedgerRecordDraft =
  | {
      type: "income";
      name: string;
      amountCents: number;
      occurredOn: string;
      categoryId: string;
      sourceMemberId: string;
      note?: string;
    }
  | {
      type: "expense";
      name: string;
      amountCents: number;
      occurredOn: string;
      categoryId: string;
      paymentSource: "fund" | "member";
      payerMemberId?: string;
      note?: string;
    };

export type CreateManualRecordResult =
  | { ok: true; recordId: string }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "missing_name"
        | "invalid_amount"
        | "invalid_date"
        | "missing_category"
        | "archived_category"
        | "category_type_mismatch"
        | "missing_member_payer"
        | "fund_paid_expense_cannot_have_member_payer"
        | "member_outside_household"
        | "disabled_member";
    };

export function createManualRecord(
  actor: LedgerCreationMemberActor,
  draft: LedgerRecordDraft,
): Promise<CreateManualRecordResult>;

export function confirmCsvRows(
  actor: LedgerCreationMemberActor,
  input: ConfirmCsvRowsInput,
): Promise<ConfirmCsvRowsResult>;

export function postRecurringOccurrence(
  actor: LedgerCreationMemberActor | RecurringPostingSystemActor,
  input: { occurrenceId: string },
): Promise<PostRecurringOccurrenceResult>;

export type PostRecurringOccurrenceResult =
  | { status: "posted"; occurrenceId: string; recordId: string }
  | { status: "already_posted"; occurrenceId: string; recordId: string }
  | {
      status: "blocked";
      occurrenceId: string;
      reason: "archived_category" | "disabled_member";
    }
  | {
      status: "rejected";
      reason:
        | "occurrence_not_found"
        | "occurrence_not_due"
        | "permission_denied"
        | "invalid_schedule";
    }
  | { status: "unavailable"; occurrenceId: string };
```

為保留現有 CSV audit，handoff 的 `rows: [{ rowIdentity, csvRowNumber, draft }]` 不變，Interface 只增加同一 intent 所需的 audit metadata；不把 manual／CSV／recurring 合併成 source union：

```ts
export type ConfirmCsvRowsInput = {
  batchIdentity: string;
  fileName: string;
  fileFingerprint: string;
  rows: Array<{
    rowIdentity: string;
    csvRowNumber: number;
    rowFingerprint: string;
    draft: LedgerRecordDraft;
  }>;
  sourceRejectedRows: Array<{
    rowIdentity: string;
    csvRowNumber: number;
    rowFingerprint: string;
    reason: Exclude<
      LedgerImportIssueCode,
      "duplicate_in_file" | "duplicate_existing"
    >;
  }>;
  skippedRows: Array<{
    rowIdentity: string;
    csvRowNumber: number;
    rowFingerprint: string;
  }>;
};

export type CsvTerminalRejectionReason =
  | Exclude<
      LedgerImportIssueCode,
      "duplicate_in_file" | "duplicate_existing"
    >
  | Extract<CreateManualRecordResult, { ok: false }>["reason"]
  | "legacy_rejection";

export type ConfirmCsvRowResult = {
  rowIdentity: string;
  csvRowNumber: number;
} & (
  | { status: "created"; recordId: string }
  | { status: "already_imported"; recordId: string }
  | {
      status: "rejected";
      reason: CsvTerminalRejectionReason | "unavailable";
      retryable: boolean;
    }
);

export type ConfirmCsvSkippedRowResult = {
  rowIdentity: string;
  csvRowNumber: number;
  status: "skipped";
};

export type ConfirmCsvRowsResult =
  | {
      ok: true;
      batchId: string;
      rows: ConfirmCsvRowResult[];
      skippedRows: ConfirmCsvSkippedRowResult[];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "batch_identity_mismatch"
        | "no_confirmable_rows"
        | "unavailable";
    };
```

Identity semantics：

- `batchIdentity`：preview 時產生的 UUID，放進 signed preview token；同一 token 的 re-preview／confirm／重送保持不變，重新上傳同一內容會取得新 identity。
- `rowIdentity`：同一 batch 內由原始 `csvRowNumber` 決定的 `csv-row:<number>`；mapping override 不改 identity。
- `fileFingerprint`／`rowFingerprint`：只做 duplicate warning 與 audit，不參與 uniqueness。
- 資料庫以 `LedgerImportBatch @@unique([householdId, batchIdentity])` 加上 `LedgerImportRow @@unique([batchId, rowIdentity])` 等價落實 `(household, batchIdentity, rowIdentity)`。
- `result.rows` 必須包含 active draft rows 與 `sourceRejectedRows` 的結果，因此每個 confirm row 都只會是 `created / rejected / already_imported`；被使用者移除的 rows 不屬於 confirm rows，獨立放在 typed `result.skippedRows`。
- `no_confirmable_rows` 只在 `rows`、`sourceRejectedRows`、`skippedRows` 3 個輸入集合都為空時成立；全數 source-rejected 或 skipped 仍須建立 batch／row audit 並回傳 `ok: true`。

## File Map

- Create `src/modules/fund-ledger/ledger-record-creation.ts`：3 個 external entry points、private creation kernel、source-specific orchestration、transaction 與唯一 Prisma projection。
- Create `src/modules/fund-ledger/ledger-record-creation.integration.test.ts`：使用 isolated PostgreSQL 從 3 個 external entry points 驗證 transaction、idempotency、blocked state、attribution 與 rollback。
- Create `src/modules/identity-access/system-actor.ts`：只定義 scoped recurring posting system actor 與 capability constructor，不加入 Member roles/capabilities。
- Create `src/modules/identity-access/system-actor.test.ts`：system actor household scope 與 capability shape。
- Modify `prisma/schema.prisma`：batch／row identity、blocked occurrence reason、posting actor kind。
- Create `prisma/migrations/20260717141601_deepen_ledger_record_creation/migration.sql`：backfill 與 backward-compatible defaults／indexes／enums。
- Create `e2e/verify-ledger-creation-migration.sh`：以獨立 Prisma config 從前一版 migration 建立 legacy rows，再驗證 backfill 與 old-app write compatibility。
- Modify `src/modules/fund-ledger/ledger-records.ts`：保留 Ledger read/domain types；在替代 coverage 完成後移除 shallow create Interface。
- Modify `src/modules/fund-ledger/ledger-record-command.ts`：移除 manual create persistence 與重複 projection；保留 Candidate 2 尚未處理的 update／void Implementation。
- Modify `src/modules/fund-ledger/ledger-import.ts`：保留 parser／preview，加入 stable row identity 與 confirm preparation output。
- Modify `src/modules/fund-ledger/ledger-import-command.ts`：保留 Prisma-backed preview context；移除整批 confirm persistence 與重複 projection。
- Modify `src/modules/identity-access/household-member-query.ts`：新增只供新財務歸屬使用、明確排除 disabled Member 的 query；既有顯示用 query 不改語意。
- Modify `src/modules/recurring/recurring-event-command.ts`：occurrence generation 與 recurring event lifecycle 保留；posting 改呼叫 `postRecurringOccurrence`，移除 actor impersonation 與重複 projection。
- Modify `src/modules/recurring/recurring-occurrence-query.ts`：read model 接受 blocked status 時仍只把 pending reminder 放進 pending views。
- Modify `src/app/ledger-record-actions.ts`：manual action 改呼叫 `createManualRecord`，unknown outcome 只回報 unavailable，不重送。
- Modify `src/app/csv-import-actions.ts`：preview token 保存 batch identity；confirm 準備 row inputs 後呼叫 `confirmCsvRows`。
- Create `src/app/csv-import-actions.test.ts`：batch identity token stability、單次 confirm call 與 mixed result mapping。
- Modify `src/app/(app)/settings/import/csv-import-panel.tsx`：維持成功／失敗／略過摘要，補上 already imported 的可辨識訊息。
- Modify `src/app/recurring-event-actions.ts`：member confirmation 改呼叫 deep Module 並映射 blocked／unavailable。
- Modify `src/app/api/cron/recurring-posting/route.ts`：只驗證 cron、呼叫 job 並回傳 summary；不載入、冒充或建立 Member／system actor。
- Modify `src/app/api/cron/recurring-posting/route.test.ts`：驗證 route authentication 與 blocked／unavailable summary mapping；household-scoped system actor 由 job tests 驗證。
- Modify `e2e/run-playwright.sh`：在 Playwright 前執行新的 database integration test。
- Modify `e2e/csv-import.spec.ts`：保護 partial success、duplicate warning、重送不重複建立。
- Modify `e2e/recurring-events.spec.ts`：保護 member confirm、blocked occurrence 與 posted attribution。
- Remove `src/modules/fund-ledger/ledger-records.test.ts`：只在 external integration coverage 全綠後移除 shallow creation tests。
- Modify `src/modules/fund-ledger/ledger-record-command.test.ts`：移除已被 integration 取代的 create describe；保留 update／void tests。
- Modify `src/modules/fund-ledger/ledger-import-command.test.ts`：保留 preview context tests；移除整批 fake persistence tests。
- Modify `src/modules/recurring/recurring-event-command.test.ts`：保留 recurring event／occurrence generation tests；移除被 external database tests 取代的 posting persistence assertions。

---

## Phase 1 — Persistence Contract

### Task 1: Add Backward-Compatible Import Identity And Recurring Audit State

**Files:**
- Modify: `prisma/schema.prisma:75-100,257-343`
- Create: `prisma/migrations/20260717141601_deepen_ledger_record_creation/migration.sql`
- Create: `e2e/verify-ledger-creation-migration.sh`
- Create: `src/modules/fund-ledger/ledger-record-creation.integration.test.ts`

**Interfaces:**
- Produces: unique batch／row identity, nullable `failureReason` for persisted terminal CSV rejection, `blocked` occurrence status, `blockedReason`, `postingActorKind`.
- Consumes: existing `LedgerImportBatch`、`LedgerImportRow`、`RecurringOccurrence` rows without data loss.

- [ ] **Step 1: Add a database-contract test and confirm red**

Create the integration test harness with `RUN_DATABASE_INTEGRATION` gating and use `information_schema.columns`, `pg_indexes`, and `pg_enum` to assert:

```ts
expect(columnNames).toEqual(expect.arrayContaining([
  "batchIdentity",
  "rowIdentity",
  "failureReason",
  "blockedReason",
  "postingActorKind",
]));
expect(indexNames).toEqual(expect.arrayContaining([
  "LedgerImportBatch_householdId_batchIdentity_key",
  "LedgerImportRow_batchId_rowIdentity_key",
]));
expect(occurrenceStatuses).toContain("blocked");
```

Run:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
```

Expected: FAIL because the columns, indexes, and enum value do not exist.

- [ ] **Step 2: Extend Prisma schema**

Add these exact fields and enums:

```prisma
enum RecurringOccurrenceStatus {
  pending
  posted
  skipped
  blocked
}

enum RecurringOccurrenceBlockedReason {
  archived_category
  disabled_member
}

enum RecurringPostingActorKind {
  member
  system
}

model LedgerImportBatch {
  batchIdentity String @default(dbgenerated("(gen_random_uuid())::text"))

  @@unique([householdId, batchIdentity])
}

model LedgerImportRow {
  rowIdentity String @default(dbgenerated("(gen_random_uuid())::text"))
  failureReason String?

  @@unique([batchId, rowIdentity])
}

model RecurringOccurrence {
  blockedReason    RecurringOccurrenceBlockedReason?
  postingActorKind RecurringPostingActorKind?
}
```

Keep `postedByMemberId` nullable for member confirmations and legacy rows. System posting writes `postingActorKind = system` and leaves `postedByMemberId = null`.

- [ ] **Step 3: Write the migration with safe backfill and old-app defaults**

The migration must:

```sql
ALTER TYPE "RecurringOccurrenceStatus" ADD VALUE IF NOT EXISTS 'blocked';
CREATE TYPE "RecurringOccurrenceBlockedReason" AS ENUM ('archived_category', 'disabled_member');
CREATE TYPE "RecurringPostingActorKind" AS ENUM ('member', 'system');

ALTER TABLE "LedgerImportBatch"
  ADD COLUMN "batchIdentity" TEXT;
UPDATE "LedgerImportBatch"
SET "batchIdentity" = 'legacy-batch:' || "id"
WHERE "batchIdentity" IS NULL;
ALTER TABLE "LedgerImportBatch"
  ALTER COLUMN "batchIdentity" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "LedgerImportBatch" ALTER COLUMN "batchIdentity" SET NOT NULL;

ALTER TABLE "LedgerImportRow"
  ADD COLUMN "rowIdentity" TEXT,
  ADD COLUMN "failureReason" TEXT;
UPDATE "LedgerImportRow"
SET "rowIdentity" = 'legacy-row:' || "id"
WHERE "rowIdentity" IS NULL;
ALTER TABLE "LedgerImportRow"
  ALTER COLUMN "rowIdentity" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "LedgerImportRow" ALTER COLUMN "rowIdentity" SET NOT NULL;

ALTER TABLE "RecurringOccurrence"
  ADD COLUMN "blockedReason" "RecurringOccurrenceBlockedReason",
  ADD COLUMN "postingActorKind" "RecurringPostingActorKind";
UPDATE "RecurringOccurrence"
SET "postingActorKind" = 'member'
WHERE "postedByMemberId" IS NOT NULL;

CREATE UNIQUE INDEX "LedgerImportBatch_householdId_batchIdentity_key"
  ON "LedgerImportBatch"("householdId", "batchIdentity");
CREATE UNIQUE INDEX "LedgerImportRow_batchId_rowIdentity_key"
  ON "LedgerImportRow"("batchId", "rowIdentity");
```

The nullable-first order makes the legacy backfill deterministic. The database defaults are set before `NOT NULL` because production migration runs before the new app becomes active; the previous app can continue inserting audit rows without supplying the new fields during that deploy window.

- [ ] **Step 4: Add a legacy-upgrade migration contract script**

Create `e2e/verify-ledger-creation-migration.sh` with `set -eu` and a `trap` that always drops its dedicated `home_fund_migration_contract` database and temporary directory. The script must:

1. Copy `prisma/schema.prisma` and all migrations before `20260717141601_deepen_ledger_record_creation` to `mktemp -d`.
2. Generate a temporary `prisma.config.ts` whose absolute `schema` and `migrations.path` both point inside that directory and whose datasource reads only the dedicated contract database URL. Every migration command must pass `--config <temp>/prisma.config.ts`; do not rely on repository `prisma.config.ts` path resolution.
3. Create only the dedicated migration-contract database and deploy the copied pre-change migrations with `corepack pnpm exec prisma migrate deploy --config <temp>/prisma.config.ts`.
4. Insert one Household、Member、`LedgerImportBatch(id = 'legacy-batch')` and `LedgerImportRow(id = 'legacy-row')` with raw SQL that matches the old schema.
5. Copy the new migration into the temporary migrations directory and run the same config-pinned deploy again.
6. Assert the old rows contain `legacy-batch:legacy-batch` and `legacy-row:legacy-row`; legacy `failureReason` may remain null.
7. Simulate the old app by inserting a second batch／row without either identity or failure-reason column and assert both identity defaults are non-null and unique.

Use explicit database names and `docker compose exec -T postgres`; never read or alter the dev or production database. Any assertion failure must still clean up via `trap`.

- [ ] **Step 5: Validate and apply only to isolated databases**

Run:

```bash
corepack pnpm db:validate
sh e2e/verify-ledger-creation-migration.sh
sh e2e/setup-db.sh
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
```

Expected: schema validation passes; legacy backfill and old-app omission checks pass in the dedicated migration-contract database; migrations deploy to `home_fund_e2e`; the database-contract test passes.

- [ ] **Step 6: Commit the persistence contract**

```bash
git add prisma/schema.prisma prisma/migrations/20260717141601_deepen_ledger_record_creation/migration.sql e2e/verify-ledger-creation-migration.sh src/modules/fund-ledger/ledger-record-creation.integration.test.ts
git commit -m "feat(ledger): add creation identity persistence"
```

---

## Phase 2 — Deep Module And Manual Entry

### Task 2: Build The Private Creation Kernel Through `createManualRecord`

**Files:**
- Create: `src/modules/identity-access/system-actor.ts`
- Create: `src/modules/identity-access/system-actor.test.ts`
- Create: `src/modules/fund-ledger/ledger-record-creation.ts`
- Modify: `src/modules/identity-access/household-member-query.ts`
- Modify: `src/app/ledger-record-actions.ts:118-146,250-272`
- Modify: `src/app/ledger-record-actions.test.ts`
- Modify: `src/modules/fund-ledger/ledger-record-creation.integration.test.ts`

**Interfaces:**
- Produces: `LedgerCreationMemberActor`, `RecurringPostingSystemActor`, `LedgerRecordDraft`, `createManualRecord` and the private kernel.
- Consumes: real `Prisma.TransactionClient`, existing `HouseholdScopedAuthenticatedMember`, current category and Member states.

- [ ] **Step 1: Write failing external-entry integration tests**

Add fixtures for 2 households, active／invited／disabled members and active／archived categories. Test only `createManualRecord`:

```ts
const result = await createManualRecord(
  {
    kind: "member",
    member: financeMember,
  },
  {
    type: "expense",
    name: "代墊晚餐",
    amountCents: 12800,
    occurredOn: "2026-07-17",
    categoryId: expenseCategory.id,
    paymentSource: "member",
    payerMemberId: invitedMember.id,
  },
);

expect(result).toMatchObject({ ok: true });
await expect(prisma.ledgerRecord.findUnique({
  where: { id: result.ok ? result.recordId : "missing" },
})).resolves.toMatchObject({
  createdByMemberId: financeMember.id,
  payerMemberId: invitedMember.id,
  reimbursementStatus: "refundable",
  status: "active",
});
```

Also assert `disabled_member` and `member_outside_household` reject without a write, a household A scoped actor cannot use household B category／source／payer IDs, general members cannot create for another Member, archived category rejects, and fund-paid expense becomes `not_refundable`. Because member scope comes only from `actor.member.householdId`, the Interface cannot forge a different `householdId` beside the authenticated Member.

Before adapting the action, add failing cases to `ledger-record-actions.test.ts` proving the action passes the existing scoped session member, maps a known rejection, and invokes `createManualRecord` exactly once when the Module throws an unknown-outcome error.

Run both red checks before implementing the Module or adapting the action:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
corepack pnpm exec vitest run src/app/ledger-record-actions.test.ts
```

Expected: both commands fail for the new external seam／delegation expectations; record the expected assertion or missing-module failure before proceeding green.

- [ ] **Step 2: Add the explicit system actor type without changing Member capabilities**

```ts
export type RecurringPostingSystemActor = {
  kind: "system";
  capability: "post_recurring_occurrence";
  householdId: string;
};

export function recurringPostingSystemActor(
  householdId: string,
): RecurringPostingSystemActor {
  return {
    kind: "system",
    capability: "post_recurring_occurrence",
    householdId,
  };
}
```

The test asserts exact shape and that no Member ID／role is synthesized.

- [ ] **Step 3: Implement the private kernel and sole Prisma projection**

The Module imports `getPrismaClient` and `Prisma.TransactionClient` directly. For a member actor, `householdId` is always derived from `actor.member.householdId`; for a system actor it is derived from `actor.householdId`. The private kernel performs these operations in order inside the caller's transaction:

1. Load category by `{ id, householdId }`.
2. Resolve `sourceMemberId` or member-paid `payerMemberId` by `{ id, householdId, status: { in: [active, invited] } }`.
3. Validate trimmed name, positive integer amount, real ISO date, category existence／active／type, payment-source shape and attribution Member availability.
4. Apply intent-specific authorization supplied by the public entry point.
5. Construct the Ledger record with one ID, `active` state and derived reimbursement status.
6. Call one private `toPrismaLedgerRecordCreateData` and write with `tx.ledgerRecord.create`.

Use a private request shape, not a public source registry:

```ts
type KernelRequest = {
  actor: LedgerCreationMemberActor | RecurringPostingSystemActor;
  createdByMemberId: string;
  draft: LedgerRecordDraft;
  authorize: (input: {
    attributionMemberId: string;
    createdByMemberId: string;
  }) => { allowed: true } | { allowed: false; reason: string };
};

type KernelResult =
  | { ok: true; recordId: string }
  | {
      ok: false;
      reason: Extract<CreateManualRecordResult, { ok: false }>["reason"];
    };

async function createLedgerRecordWithinTransaction(
  tx: Prisma.TransactionClient,
  request: KernelRequest,
): Promise<KernelResult>;
```

`createManualRecord` wraps the kernel in `getPrismaClient().$transaction`, sets `createdByMemberId` to the member actor, and uses the existing create-income／create-expense authorization semantics. It does not catch and retry unknown Prisma errors.

- [ ] **Step 4: Adapt the manual App Adapter**

Replace `createLedgerRecordInDatabase` with:

```ts
const result = await createManualRecord(
  {
    kind: "member",
    member: session.access.member,
  },
  parsed.command,
);
```

Map known rejection codes to current field errors. Wrap only for presentation of `unavailable`; do not invoke `createManualRecord` a second time after an exception or unknown response.

- [ ] **Step 5: Run manual integration and action tests**

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
corepack pnpm exec vitest run src/app/ledger-record-actions.test.ts src/app/ledger-record-form.test.ts
corepack pnpm type-check
```

Expected: manual external-entry cases pass; action tests prove one invocation and typed errors; type-check passes.

- [ ] **Step 6: Commit the manual entry slice**

```bash
git add src/modules/identity-access/system-actor.ts src/modules/identity-access/system-actor.test.ts src/modules/identity-access/household-member-query.ts src/modules/fund-ledger/ledger-record-creation.ts src/modules/fund-ledger/ledger-record-creation.integration.test.ts src/app/ledger-record-actions.ts src/app/ledger-record-actions.test.ts
git commit -m "refactor(ledger): deepen manual record creation"
```

---

## Phase 3 — CSV Partial Success And Idempotency

### Task 3: Route CSV Confirm Through `confirmCsvRows`

**Files:**
- Modify: `src/modules/fund-ledger/ledger-record-creation.ts`
- Modify: `src/modules/fund-ledger/ledger-record-creation.integration.test.ts`
- Modify: `src/modules/fund-ledger/ledger-import.ts`
- Modify: `src/modules/fund-ledger/ledger-import.test.ts`
- Modify: `src/modules/fund-ledger/ledger-import-command.ts`
- Modify: `src/modules/fund-ledger/ledger-import-command.test.ts`
- Modify: `src/app/csv-import-actions.ts`
- Create: `src/app/csv-import-actions.test.ts`
- Modify: `src/app/(app)/settings/import/csv-import-panel.tsx`
- Modify: `e2e/csv-import.spec.ts`

**Interfaces:**
- Produces: `confirmCsvRows(actor, input)` and per-row `created / rejected / already_imported` results.
- Consumes: signed preview batch identity, parser-produced drafts, source rejection／skipped audit metadata, private kernel.

- [ ] **Step 1: Write failing real-database CSV tests**

Add these cases through `confirmCsvRows`:

- one valid row and one disabled-Member row yield `created` + `rejected`; exactly one Ledger record exists and both row traces are stored;
- the same `(household, batchIdentity, rowIdentity)` retried returns `already_imported` and record count remains 1;
- two concurrent confirms of the same row yield one `created`, one `already_imported`, and one Ledger record;
- two concurrent confirms of different rows under the same new batch both succeed and leave exact imported／failed／skipped counters;
- identical fingerprints under different batch／row identities both create records;
- a forced PostgreSQL failure for one row rolls back that row's Ledger record and trace without rolling back a different row transaction;
- source-rejected and skipped rows preserve existing `failed`／`skipped` audit and counts.
- retrying a terminal failed row after changing its mapping still returns the originally persisted rejection reason and does not change counters.

Concurrency assertion:

```ts
const results = await Promise.all([
  confirmCsvRows(actor, input),
  confirmCsvRows(actor, input),
]);
expect(results.every((result) => result.ok)).toBe(true);
expect(results.flatMap((result) =>
  result.ok ? result.rows.map((row) => row.status) : [],
).sort())
  .toEqual(["already_imported", "created"]);
expect(await prisma.ledgerRecord.count({ where: { name: "冪等列" } })).toBe(1);
```

Create `src/app/csv-import-actions.test.ts` before changing the action. Its failing cases must prove the signed token keeps the same `batchIdentity` across re-preview／confirm, confirm invokes `confirmCsvRows` once, mixed created／source-rejected／skipped outcomes map to exact counts, and an all-invalid or all-skipped input still returns an audited success.

Run both red checks before implementing the Module or adapting the action:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
corepack pnpm exec vitest run src/app/csv-import-actions.test.ts
```

Expected: the integration command fails because `confirmCsvRows` is not implemented, and the action command fails on the new token identity／single-delegation／result-mapping expectations.

- [ ] **Step 2: Make preview identity stable but content-independent**

In `ledger-import.ts`, add:

```ts
export function ledgerImportRowIdentity(csvRowNumber: number): string {
  return `csv-row:${csvRowNumber}`;
}
```

Keep `rowFingerprint` unchanged for warnings. In `csv-import-actions.ts`, create the preview token with `{ csv, createdAt, batchIdentity: crypto.randomUUID() }`; re-preview returns the same identity from the verified token.

- [ ] **Step 3: Implement batch acquisition and one transaction per row**

`confirmCsvRows` first verifies `import_ledger_records`, then calls a private `acquireCsvBatch` keyed by `{ householdId_batchIdentity }`. It tries to create the batch; on the expected composite unique conflict it reloads the committed batch and continues only when its immutable `fileFingerprint` matches. A different fingerprint returns `batch_identity_mismatch`. Any other Prisma error returns `{ ok: false, reason: "unavailable" }`; it does not throw across the external Interface. This batch race handling occurs before row race handling, so concurrent first confirms cannot fail early at batch creation.

For each active row, execute `prisma.$transaction` independently:

```ts
const existing = await tx.ledgerImportRow.findUnique({
  where: {
    batchId_rowIdentity: {
      batchId: batch.id,
      rowIdentity: row.rowIdentity,
    },
  },
});

if (existing?.ledgerRecordId) {
  return {
    rowIdentity: row.rowIdentity,
    csvRowNumber: row.csvRowNumber,
    status: "already_imported" as const,
    recordId: existing.ledgerRecordId,
  };
}
```

If the kernel rejects, atomically create a `failed` trace with the typed `CsvTerminalRejectionReason` in `failureReason` and update `failedRowCount` with Prisma `{ increment: 1 }`. If it succeeds, create the Ledger record and `imported` trace in the same transaction, then update `importedRowCount` with `{ increment: 1 }`. Existing failed identities reload their persisted `failureReason` and return the same terminal `rejected` result with `retryable: false`; a legacy failed row whose reason is null maps to `legacy_rejection`. Existing skipped identities return the same skip audit. Neither path increments counters. Process `sourceRejectedRows` and `skippedRows` with the same one-row-per-transaction rule; source rejection persists its reason, skipped rows keep `failureReason = null`, and both use atomic counter increments on first insertion only. Imported rows also keep `failureReason = null`. Never read a counter and write `current + 1`.

An unexpected database failure returns `status: rejected` with `retryable: true` after its transaction rolls back, so neither Ledger record nor import trace remains. Domain／source rejection returns `retryable: false` and has a terminal `failed` trace.

Handle a row unique-constraint race by letting the losing transaction roll back, then loading the committed row and returning `already_imported`; never keep the losing Ledger record. Tests cover both same-row contention and different-row counter updates under the same batch.

- [ ] **Step 4: Preserve parser and preview locality**

`previewLedgerImportCsv` and `previewLedgerImportInDatabase` stay in their current Modules. Replace `confirmLedgerImportInDatabase` with a preparation function that returns:

```ts
type PreparedCsvConfirmation = {
  rows: ConfirmCsvRowsInput["rows"];
  sourceRejectedRows: ConfirmCsvRowsInput["sourceRejectedRows"];
  skippedRows: ConfirmCsvRowsInput["skippedRows"];
};
```

It may read current mapping candidates but performs no financial write. Remove its duplicated `toLedgerRecordCreateData`.

- [ ] **Step 5: Adapt action and UI result mapping**

The action verifies the signed token, prepares rows, and calls `confirmCsvRows` once. Map results as:

```ts
const importedCount = result.rows.filter((row) =>
  row.status === "created" || row.status === "already_imported",
).length;
const alreadyImportedCount = result.rows.filter(
  (row) => row.status === "already_imported",
).length;
const failedCount = result.rows.filter((row) => row.status === "rejected").length;
const skippedCount = result.skippedRows.length;
```

Keep `成功 / 失敗 / 略過` order and add a small `已匯入` explanation when `alreadyImportedCount > 0`.

- [ ] **Step 6: Run CSV tests**

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
corepack pnpm exec vitest run src/modules/fund-ledger/ledger-import.test.ts src/modules/fund-ledger/ledger-import-command.test.ts src/app/csv-import-actions.test.ts
corepack pnpm type-check
corepack pnpm test:e2e e2e/csv-import.spec.ts
```

Expected: real database partial-success／idempotency cases pass, parser tests remain separate, and all 5 existing CSV flows plus retry coverage pass.

- [ ] **Step 7: Commit the CSV slice**

```bash
git add src/modules/fund-ledger/ledger-record-creation.ts src/modules/fund-ledger/ledger-record-creation.integration.test.ts src/modules/fund-ledger/ledger-import.ts src/modules/fund-ledger/ledger-import.test.ts src/modules/fund-ledger/ledger-import-command.ts src/modules/fund-ledger/ledger-import-command.test.ts src/app/csv-import-actions.ts src/app/csv-import-actions.test.ts 'src/app/(app)/settings/import/csv-import-panel.tsx' e2e/csv-import.spec.ts
git commit -m "refactor(ledger): deepen csv row confirmation"
```

---

## Phase 4 — Recurring Posting And System Actor

### Task 4: Route Every Occurrence Through `postRecurringOccurrence`

**Files:**
- Modify: `src/modules/fund-ledger/ledger-record-creation.ts`
- Modify: `src/modules/fund-ledger/ledger-record-creation.integration.test.ts`
- Modify: `src/modules/recurring/recurring-event-command.ts`
- Modify: `src/modules/recurring/recurring-event-command.test.ts`
- Modify: `src/modules/recurring/recurring-occurrence-query.ts`
- Modify: `src/app/recurring-event-actions.ts`
- Modify: `src/app/recurring-event-actions.test.ts`
- Modify: `src/app/api/cron/recurring-posting/route.ts`
- Modify: `src/app/api/cron/recurring-posting/route.test.ts`
- Modify: `e2e/recurring-events.spec.ts`

**Interfaces:**
- Produces: `postRecurringOccurrence(actor, { occurrenceId })` with `posted / already_posted / blocked / rejected / unavailable` outcomes, plus command-specific `CreateRecurringEventInDatabaseResult` in `recurring-event-command.ts`.
- Consumes: member actor or scoped `post_recurring_occurrence` system actor, persisted recurring rule／occurrence, private kernel.

- [ ] **Step 1: Write failing recurring integration tests**

Cover:

- system actor posts without loading an active admin／finance manager;
- Ledger `createdByMemberId` is the recurring event creator, not the system or confirming Member;
- source／payer attribution comes from the recurring event;
- disabling only the event creator does not block posting when source／payer remains eligible;
- archived category writes occurrence `blocked + archived_category` and no Ledger record;
- disabled source／payer writes occurrence `blocked + disabled_member` and no Ledger record;
- a concurrent second post returns `already_posted` and cannot leave an orphan Ledger record;
- concurrent blocked calls and a posted-vs-blocked race converge to the single committed occurrence state without an orphan Ledger record;
- a database trigger that raises a transient SQL error causes `unavailable`, leaves occurrence `pending`, and leaves no Ledger record／trace;
- member confirmation still checks household scope and capability.
- a future reminder occurrence remains manually confirmable, while a future immediate occurrence remains `occurrence_not_due`, preserving current product behavior.

Use a transaction rollback assertion after the forced failure:

```ts
expect(await prisma.recurringOccurrence.findUnique({
  where: { id: occurrence.id },
})).toMatchObject({
  status: "pending",
  blockedReason: null,
  ledgerRecordId: null,
});
```

Before changing adapters, add failing cases to `recurring-event-actions.test.ts` for blocked／unavailable messages and one-call behavior, and to `route.test.ts` for the extended summary. The cron route test must not expect the route to construct a system actor; that responsibility belongs to `runRecurringPostingJob`.

The failure-injection test uses a dedicated fixture name predicate on the Ledger trigger, creates／drops both trigger and function inside `try/finally`, and performs cleanup before any assertion that may fail. All other fixtures use dedicated IDs／household data.

Run the red checks before implementing posting or adapting either entry point:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
corepack pnpm exec vitest run src/app/recurring-event-actions.test.ts src/app/api/cron/recurring-posting/route.test.ts
```

Expected: the integration command fails for the missing recurring external seam／transition behavior, and the adapter command fails on blocked／unavailable／one-call／summary expectations.

- [ ] **Step 2: Implement idempotent occurrence transition**

Inside one Prisma transaction:

1. Load occurrence and rule with `householdId` from the actor scope.
2. Return `already_posted` if `status = posted` and a trace exists.
3. Return the stored blocked reason if already blocked.
4. Build the draft from the recurring rule. Preserve current due-date semantics exactly: reminder occurrences may be manually confirmed before target date; immediate occurrences require `occurredOn <= today` in Asia/Taipei.
5. Call the private kernel with `createdByMemberId = recurringRule.createdByMemberId`.
6. For archived category／disabled attribution, conditionally update `pending → blocked` with a reason.
7. After Ledger creation, use `updateMany` constrained by `id + householdId + status = pending`; set `ledgerRecordId`、`postedAt`、`postingActorKind` and member poster when applicable.
8. If either the blocked transition or posted transition count is not 1, throw a private typed `RecurringOccurrenceTransitionRace` inside the transaction so every write in that attempt rolls back.

Posting data:

```ts
const postingAudit = actor.kind === "system"
  ? { postingActorKind: "system" as const, postedByMemberId: null }
  : { postingActorKind: "member" as const, postedByMemberId: actor.member.id };
```

Outside the transaction, catch `RecurringOccurrenceTransitionRace` separately, reload the scoped occurrence, and map `posted + ledgerRecordId → already_posted`、`blocked + reason → blocked`、still `pending → unavailable`. Catch genuine transient Prisma errors as `unavailable` without a state write. Never map the typed race sentinel through the generic Prisma error branch. Log at the cron／App Adapter, not in the domain result constructor.

`postingActorKind` means the actor that successfully posted, not an attempted blocker. Enforce this state matrix in integration tests:

| Occurrence state | `ledgerRecordId` | `blockedReason` | `postingActorKind` | `postedByMemberId` | `postedAt` |
|---|---|---|---|---|---|
| pending／skipped | null | null | null | null | null |
| blocked | null | required | null | null | null |
| posted by Member | required | null | member | required | required |
| posted by system | required | null | system | null | required |
| legacy posted | existing value | null | member or null | existing value or null | existing value or null |

- [ ] **Step 3: Separate occurrence generation from posting transactions**

Refactor `ensureRecurringOccurrencesForMonth` so it creates／finds occurrences first, then calls `postRecurringOccurrence` once per due immediate occurrence. Do not keep all household occurrences in one transaction.

`createRecurringEventInDatabase` creates the event and occurrence atomically, then calls `postRecurringOccurrence` after commit when immediate and due today. Do not change the pure `CreateRecurringEventResult` in `recurring-event.ts`; define this command-specific result in `recurring-event-command.ts` so an unavailable post reports「週期事件已建立，本月入帳將重試」without retrying event creation:

```ts
export type CreateRecurringEventInDatabaseResult =
  | Extract<CreateRecurringEventResult, { ok: false }>
  | (Extract<CreateRecurringEventResult, { ok: true }> & {
      currentOccurrenceStatus:
        | "not_created"
        | "pending"
        | "posted"
        | "blocked"
        | "unavailable";
    });
```

Remove `postRecurringEventLedgerRecord`、its local `toLedgerRecordCreateData` and `loadRecurringPostingActor`.

- [ ] **Step 4: Use the scoped system actor in cron**

`runRecurringPostingJob`, not the route, constructs one actor per household:

```ts
const actor = recurringPostingSystemActor(household.id);
```

It no longer queries a Member. Extend the summary with `blockedCount` and `unavailableCount`; keep `skippedCount` for invalid schedule／not-due semantics. The protected route authentication remains unchanged.

- [ ] **Step 5: Adapt member confirmation and read behavior**

`confirmRecurringOccurrenceAction` wraps the already scoped session member as `{ kind: "member", member: session.access.member }` and maps:

- `blocked` → reason-specific Chinese message;
- `already_posted` → existing record ID without another write;
- `unavailable` → retryable presentation error;
- known validation／permission failures → existing typed fields.

`recurring-occurrence-query.ts` continues selecting only `status: pending` for pending views; blocked occurrences do not masquerade as Ledger records or enter financial totals.

- [ ] **Step 6: Run recurring tests**

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
corepack pnpm exec vitest run src/modules/recurring/recurring-event.test.ts src/modules/recurring/recurring-event-command.test.ts src/modules/recurring/recurring-occurrence-query.test.ts src/app/recurring-event-actions.test.ts src/app/api/cron/recurring-posting/route.test.ts
corepack pnpm type-check
corepack pnpm test:e2e e2e/recurring-events.spec.ts
```

Expected: system actor, blocked, concurrency and rollback cases pass; existing recurring date／form behavior remains green.

- [ ] **Step 7: Commit the recurring slice**

```bash
git add src/modules/fund-ledger/ledger-record-creation.ts src/modules/fund-ledger/ledger-record-creation.integration.test.ts src/modules/recurring/recurring-event-command.ts src/modules/recurring/recurring-event-command.test.ts src/modules/recurring/recurring-occurrence-query.ts src/app/recurring-event-actions.ts src/app/recurring-event-actions.test.ts src/app/api/cron/recurring-posting/route.ts src/app/api/cron/recurring-posting/route.test.ts e2e/recurring-events.spec.ts
git commit -m "refactor(recurring): post through ledger creation module"
```

---

## Phase 5 — Remove Shallow Creation Surfaces

### Task 5: Delete Replaced Paths Only After Coverage Exists

**Files:**
- Modify: `src/modules/fund-ledger/ledger-records.ts`
- Remove: `src/modules/fund-ledger/ledger-records.test.ts`
- Modify: `src/modules/fund-ledger/ledger-record-command.ts`
- Modify: `src/modules/fund-ledger/ledger-record-command.test.ts`
- Modify: `src/modules/fund-ledger/ledger-import-command.ts`
- Modify: `src/modules/fund-ledger/ledger-import-command.test.ts`
- Modify: `src/modules/recurring/recurring-event-command.ts`
- Modify: `src/modules/recurring/recurring-event-command.test.ts`
- Modify: `e2e/run-playwright.sh`

**Interfaces:**
- Produces: one deep creation Interface and one private projection.
- Consumes: green integration coverage from Tasks 2–4.

- [ ] **Step 1: Prove replacement coverage before deletion**

Run the integration file alone and confirm every external entry point has success, authorization, validation, attribution, idempotency and rollback coverage:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
```

Expected: all external-entry integration cases pass before any shallow test is removed.

- [ ] **Step 2: Remove obsolete external and duplicate Implementation surfaces**

Delete exports and code for:

- `createLedgerRecord`、`CreateLedgerRecordContext`、`CreateLedgerRecordResult` from `ledger-records.ts`;
- `createLedgerRecordInDatabase`、`CreateLedgerRecordInDatabaseContext` and its create projection from `ledger-record-command.ts`;
- `confirmLedgerImportInDatabase` and its create projection from `ledger-import-command.ts`;
- private recurring posting／projection code already replaced in Task 4.

Keep `LedgerRecord` read/domain types and all update／void code untouched for Candidate 2.

- [ ] **Step 3: Trim tests after the deletion test**

Remove `ledger-records.test.ts`, the create describe in `ledger-record-command.test.ts`, fake batch persistence cases in `ledger-import-command.test.ts`, and fake posting persistence cases in `recurring-event-command.test.ts`. Preserve:

- form parsing tests;
- CSV parser／preview／mapping／duplicate-warning tests;
- recurring date／event-definition／occurrence-generation tests;
- update／void tests.

- [ ] **Step 4: Wire the real database suite into E2E setup**

Update `e2e/run-playwright.sh` so the integration files run in 2 serial Vitest commands. This prevents a failure-injection trigger or fixture cleanup problem in the Ledger suite from running concurrently with reimbursement fixtures:

```sh
DATABASE_URL="${E2E_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e}" \
RUN_DATABASE_INTEGRATION=1 \
corepack pnpm exec vitest run \
  src/modules/fund-ledger/ledger-record-creation.integration.test.ts

DATABASE_URL="${E2E_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e}" \
RUN_DATABASE_INTEGRATION=1 \
corepack pnpm exec vitest run \
  src/modules/reimbursement/reimbursement-command.integration.test.ts
```

- [ ] **Step 5: Check locality and blast radius**

Run:

```bash
codegraph explore "createManualRecord confirmCsvRows postRecurringOccurrence callers tests"
rg -n "createLedgerRecordInDatabase|confirmLedgerImportInDatabase|postRecurringEventLedgerRecord|toLedgerRecordCreateData" src --glob '!src/generated/**'
```

Expected: CodeGraph shows only the 3 intended external entry points and their App／Recurring callers; `rg` finds no obsolete creation functions or duplicate projection.

- [ ] **Step 6: Run targeted regression and commit cleanup**

```bash
corepack pnpm exec vitest run src/modules/fund-ledger src/modules/recurring src/app/ledger-record-actions.test.ts src/app/recurring-event-actions.test.ts src/app/api/cron/recurring-posting/route.test.ts
corepack pnpm type-check
git add src/modules/fund-ledger/ledger-records.ts src/modules/fund-ledger/ledger-records.test.ts src/modules/fund-ledger/ledger-record-command.ts src/modules/fund-ledger/ledger-record-command.test.ts src/modules/fund-ledger/ledger-import-command.ts src/modules/fund-ledger/ledger-import-command.test.ts src/modules/recurring/recurring-event-command.ts src/modules/recurring/recurring-event-command.test.ts e2e/run-playwright.sh
git commit -m "refactor(ledger): remove shallow creation paths"
```

---

## Phase 6 — Full Verification And Documentation Check

### Task 6: Verify Candidate 1 As A Complete Slice

**Files:**
- Review: `.ai/domain/fund-ledger.md`
- Review: `.ai/domain/identity-access.md`
- Review: `.ai/domain/recurring-schedule.md`
- Review: `.ai/requirements/csv-import-financial-records.md`
- Review: `.ai/requirements/recurring-income-expense-records.md`
- Modify only if runtime／deployment instructions actually changed: `README.md`, `docs/deployment.md`

**Interfaces:**
- Produces: verified Candidate 1 implementation with no unrecorded domain drift.
- Consumes: all previous tasks.

- [ ] **Step 1: Rebuild the isolated database from migrations**

```bash
sh e2e/setup-db.sh
```

Expected: clean `home_fund_e2e` creation, all migrations deploy, production-safe seed and E2E seed complete.

- [ ] **Step 2: Run database, unit, type and static checks serially**

```bash
corepack pnpm db:validate
sh e2e/verify-ledger-creation-migration.sh
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-creation.integration.test.ts
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e E2E_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e RUN_DATABASE_INTEGRATION=1 corepack pnpm exec vitest run src/modules/reimbursement/reimbursement-command.integration.test.ts
corepack pnpm test
corepack pnpm type-check
corepack pnpm lint
corepack pnpm build
```

Expected: each command exits 0. Record exact test counts from fresh output instead of copying historical counts.

- [ ] **Step 3: Run the two affected E2E flows, then the full suite**

```bash
corepack pnpm test:e2e e2e/csv-import.spec.ts e2e/recurring-events.spec.ts
corepack pnpm test:e2e
```

Expected: targeted and full Playwright suites pass against the isolated E2E database.

- [ ] **Step 4: Re-read domain decisions and inspect final diff**

```bash
git diff --check
git diff --stat f6259e8b..HEAD
git status --short
```

Check every invariant from the 3 domain files against a code path and a test. Update `README.md` or `docs/deployment.md` only if commands, environment variables, migration procedure, cron operation or rollback guidance changed; schema-only changes do not justify copying deployment instructions.

- [ ] **Step 5: Commit any necessary documentation-only adjustment**

If Step 4 found a real current-state documentation change:

```bash
git add README.md docs/deployment.md
git commit -m "docs: update ledger creation operations"
```

If no runtime／deployment instruction changed, leave both files untouched and record that conclusion in the delivery summary.

## Coverage Matrix

| Invariant | External test surface |
|---|---|
| Same construction／projection across sources | Query persisted rows created by all 3 entry points and compare normalized fields |
| Member actor scope cannot be forged | Cross-household category／source／payer tests use `HouseholdScopedAuthenticatedMember` and prove no write |
| Manual unknown outcome not retried | App action test asserts one call; no operation identity in schema |
| Legacy migration compatibility | Migration contract upgrades pre-change rows, checks deterministic backfill, and proves old-app inserts may omit new defaulted columns |
| CSV partial success | Mixed valid／disabled／source-invalid integration case |
| CSV row atomicity | PostgreSQL failure injection proves no orphan record／trace |
| CSV batch／row idempotency | sequential same-row, concurrent same-row, and concurrent different-row tests cover batch acquisition before row acquisition |
| CSV counters are race-safe | concurrent different-row test asserts persisted counters equal terminal row states; implementation uses atomic `increment` |
| CSV terminal rejection is replayable | failed trace persists typed `failureReason`; remapped retry returns the original reason without counter changes; legacy null maps explicitly |
| CSV result partitions are total | App action tests cover active、source-rejected、skipped、all-invalid and all-skipped inputs with typed outcomes |
| Fingerprint warning only | same content under different identities creates 2 records; parser warning stays non-blocking |
| Disabled Member exclusion | manual、CSV、Recurring integration cases |
| Restricted system actor | system actor unit shape + cron integration without Member lookup |
| Recurring creator attribution | persisted `createdByMemberId` equals recurring rule creator |
| Recurring source trace atomicity | occurrence `ledgerRecordId` and Ledger row commit／rollback together |
| Archived category／disabled attribution blocked | blocked reason tests, no Ledger row |
| Posting audit means successful poster | state-matrix tests keep blocked posting fields null and require valid member／system attribution for posted rows |
| Existing due-date behavior is preserved | future reminder is manually confirmable; future immediate occurrence is rejected as not due |
| Transient failure remains pending | PostgreSQL trigger rollback test |
| Failure injection is isolated | dedicated fixture predicate and `try/finally` cleanup; ledger and reimbursement integration files run in separate serial commands |
| Concurrent recurring transition | typed race sentinel reloads posted／blocked／pending states; posted-vs-posted、blocked-vs-blocked and posted-vs-blocked cases leave 1 terminal trace |
| App Adapter delegation stays thin | manual、CSV and recurring action／route tests assert actor mapping, one module call, and exact result mapping |

## Approval Notes

本計畫有 3 個明確設計細化，核准本 plan 即視為一併核准：

1. CSV signed preview token 的 UUID 是 `batchIdentity`；`rowIdentity` 是 batch 內穩定的 `csv-row:<csvRowNumber>`。重新上傳同一檔案是新 batch，fingerprint 仍只警告。
2. 為保留目前已交付的 failed／skipped audit，`confirmCsvRows` 除 handoff 指定的 `rows` 外，接受同一 CSV intent 的 audit metadata、`sourceRejectedRows` 與 `skippedRows`；這些欄位不會進入 manual／recurring Interface，也不形成 generic source registry。
3. 建立 recurring event 時，event 與 occurrence 先原子提交，再由 `postRecurringOccurrence` 使用自己的 transaction 入帳；transient failure 留下 `pending` occurrence 並回傳警示狀態，不回滾已建立的 event，也不誘發盲目重建 event。

不在本計畫內：Candidate 2 的 Ledger `version`、Candidate 3 Search result 重塑、Candidate 4 reimbursement version，以及 production deploy／migration 執行。Production 證據必須在後續 release workflow 取得，不能以本機或 E2E 結果代替。
