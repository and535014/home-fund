# Ledger Version Persistence Implementation Plan

**Goal:** 完成 Candidate 2 的 C2.1，讓每筆已持久化 Ledger record 具有可讀取、會在每次成功狀態變更時單調遞增的整數 `version`，作為後續 conditional write 的穩定 token。

**Architecture:** 在 `LedgerRecord` Prisma model 新增具有 database default 的 `version Int @default(1)`，讓 migration-first deploy 期間的舊 app 仍可以省略欄位進行 insert。Fund Ledger Prisma adapter 將 `version` 映射到已持久化的 Ledger read model；目前 correction、void、batch void 與 reimbursement settlement 的成功 write 都同時使用 Prisma atomic increment 遞增 `version`。本切片不改外部 mutation command，也不把 conditional predicate 從 `updatedAt` 切換為 `expectedVersion`；現有 concurrency path 保留到 C2.2–C2.6 逐步取代。

**Tech Stack:** Next.js App Router、TypeScript、Prisma 7、PostgreSQL、Vitest、Docker Compose、pnpm。

## Scope And Constraints

- 本計畫只實作 C2.1 Ledger Version Persistence。
- 不在 command 或 server action 新增 `expectedVersion`，不新增 `version_conflict`，不改 correction、void、batch 或 reimbursement 的使用者流程。
- 不改動現有 `updatedAt` conditional predicates 與 `record_changed` 結果；這些是 C2.2–C2.6 完成前的相容路徑。
- `version` 從 `1` 開始，只在已持久化 Ledger record 的成功狀態變更時增加 `1`；validation failure、permission denial、not found、conflict 或 transaction rollback 不得消耗版本。
- `version` 不是時間戳，不用 `updatedAt` 派生，也不將 `updatedAt` 重命名為 `version`。
- 不為 `version` 單獨建立 index；後續 conditional write 會先以 Ledger record primary key 縮小範圍。
- Pending recurring occurrence 不是已持久化的 Ledger financial fact，不為它製造假 `version`。C3.2 才會將它收旂為獨立 Search result kind。
- Reimbursement payment 有自己的 version lifecycle，不共用 Ledger `version`；那是 C4.1 的範圍。
- Prisma schema 變更必須附 migration，不手動修改 `src/generated/prisma/`。
- 開發採 TDD；每一步先讓行為測試因缺少新 contract 而失敗，再實作最小變更。
- 不平行執行會呼叫 `prisma generate` 的命令。

## Verified Current State

- `prisma/schema.prisma` 的 `LedgerRecord` 目前只有 `updatedAt DateTime @updatedAt`，沒有獨立 `version`。
- `src/modules/fund-ledger/ledger-record-prisma-adapter.ts` 的 ordinary select 不讀 `updatedAt`；另有命名為 `versionedPrismaLedgerRecordSelect` 的相容 helper，但實際只多讀 `updatedAt`。
- `src/modules/fund-ledger/ledger-record-command.ts` 的單筆 correction 與 void 以 `updatedAt` 做 `updateMany` predicate。
- `src/app/(app)/search/_actions/record-search-actions.ts` 的 batch void 以每筆 `{ id, updatedAt }` 做 pre-write check。
- `src/modules/reimbursement/reimbursement-command.ts` 的 settlement 以每筆 `{ id, updatedAt }` 轉態，之後才建立 reimbursement batch 與 payment evidence。
- 上述 4 個 write sites 是目前所有對既有 `LedgerRecord` row 的 production update path；manual、CSV 與 recurring 只建立新 row。
- `src/modules/recurring/recurring-occurrence-query.ts` 目前將 pending occurrence 投影為 `LedgerRecord`，但它並非 `LedgerRecord` table row，不應擁有持久化 version。
- 專案已有 `e2e/verify-ledger-creation-migration.sh` 的 isolated PostgreSQL migration-contract pattern，可以沿用為本切片的 backfill 與 old-app compatibility 驗證。

## Target Contract

Prisma persistence contract：

```prisma
model LedgerRecord {
  // existing fields...
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Read-model contract：

```ts
export type PersistedLedgerRecordVersion = {
  version: number;
};

export type PersistedLedgerRecord = LedgerRecord &
  PersistedLedgerRecordVersion;
```

`mapPrismaLedgerRecordToLedgerRecord` 與 `mapPrismaExpenseLedgerRecordToExpenseLedgerRecord` 回傳已持久化 subtype，ordinary Ledger queries 的成功結果保留這個 subtype。通用 domain functions 可繼續接受不帶 persistence metadata 的 `LedgerRecord`，避免將 version 變成 reporting calculation 或 pending recurring projection 的必要輸入。

現有 mutation 在本切片的 persistence shape：

```ts
await tx.ledgerRecord.updateMany({
  where: {
    // keep the current household / status / updatedAt guards
  },
  data: {
    // existing state change
    version: { increment: 1 },
  },
});
```

## Task 1: Lock The Read-model Contract With Failing Tests

**Files:**

- Modify: `src/modules/fund-ledger/ledger-record-prisma-adapter.test.ts`
- Modify: `src/modules/fund-ledger/search/record-search-query.test.ts`
- Modify: `src/app/home-dashboard-data-source.test.ts`
- Modify: `src/modules/reimbursement/refund-page/refund-page-query.test.ts`
- Modify: `src/modules/reimbursement/reimbursement-payment-search-query.test.ts`

- [ ] **Step 1: Add adapter expectations for persisted versions**

在 income、expense 與 recurring-trace row fixtures 加入 `version`，並斷言 mapper 原樣回傳整數 token。至少用 `version: 1` 與 `version: 4` 證明 mapper 沒有寫死初始值。

- [ ] **Step 2: Add query-level version exposure assertions**

讓 Search page、dashboard monthly/yearly records、refund unpaid records，reimbursement linked records 的 fake Prisma rows 帶有不同 `version`，並在對外 result 斷言它被保留。不替 pending recurring fixture 新增 version。

- [ ] **Step 3: Run the focused tests and confirm RED**

Run:

```bash
corepack pnpm exec vitest run \
  src/modules/fund-ledger/ledger-record-prisma-adapter.test.ts \
  src/modules/fund-ledger/search/record-search-query.test.ts \
  src/app/home-dashboard-data-source.test.ts \
  src/modules/reimbursement/refund-page/refund-page-query.test.ts \
  src/modules/reimbursement/reimbursement-payment-search-query.test.ts
```

Expected: FAIL，因為 Prisma select，row type 與 mapper 尚未提供 `version`。

## Task 2: Add Migration And Old-app Compatibility Contract

**Files:**

- Create: `prisma/migrations/<timestamp>_add_ledger_record_version/migration.sql`
- Modify: `prisma/schema.prisma`
- Create: `e2e/verify-ledger-version-migration.sh`

- [ ] **Step 1: Create a migration-contract script from the existing isolated pattern**

Script 使用獨立 `home_fund_ledger_version_contract` database，並完成：

1. 只 deploy 新 migration 之前的所有 migrations。
2. 用舊 schema shape 建立 household、member、category 與一筆 legacy Ledger record。
3. deploy 新 migration。
4. 斷言 legacy row 被回填為 `version = 1` 且欄位是 `NOT NULL`。
5. 模擬舊 app，以不含 `version` 的 SQL `INSERT` 建立第二筆 Ledger record，斷言寫入成功且 `version = 1`。
6. 模擬舊 app，以不觸及 `version` 的 SQL `UPDATE` 修改 legacy row，斷言寫入成功且 version 不被清空。
7. cleanup 只刪除這個獨立 contract database 與 `mktemp` 目錄。

- [ ] **Step 2: Run the contract script and confirm RED**

Run:

```bash
sh e2e/verify-ledger-version-migration.sh
```

Expected: FAIL，因為 migration 與 `version` 欄位尚不存在。

- [ ] **Step 3: Add the Prisma field and migration**

在 `LedgerRecord` 新增 `version Int @default(1)`。Migration 使用具有 database default 的 non-null column，例如：

```sql
ALTER TABLE "LedgerRecord"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
```

不在這個 migration 移除 default；舊 app 在 migration-first deploy 期間必須能繼續建立 Ledger rows。

- [ ] **Step 4: Validate migration GREEN**

Run:

```bash
corepack pnpm db:validate
sh e2e/verify-ledger-version-migration.sh
```

Expected: PASS。

## Task 3: Expose Version From Persisted Ledger Read Models

**Files:**

- Modify: `src/modules/fund-ledger/ledger-records.ts`
- Modify: `src/modules/fund-ledger/ledger-record-prisma-adapter.ts`
- Modify: `src/modules/fund-ledger/search/record-search-query.ts`
- Modify: `src/app/home-dashboard-data-source.ts`
- Modify: `src/modules/reimbursement/refund-page/refund-page-query.ts`
- Modify: `src/modules/reimbursement/reimbursement-payment-search-query.ts`
- Modify: tests listed in Task 1

- [ ] **Step 1: Introduce an explicit persisted subtype**

在 Fund Ledger 定義 `PersistedLedgerRecord` 與 `PersistedExpenseLedgerRecord`，其 `version` 為 required positive integer。保留 `LedgerRecord` 作為不帶 persistence metadata 的 business shape，以免 pending recurring 被迫使用假 token。

- [ ] **Step 2: Extend Prisma selects and row types**

將 `version: true` 加入 `prismaLedgerRecordSelect` 與 `prismaExpenseLedgerRecordSelect`，並讓 row types 需要 `version: number`。現有 `versionedPrisma*` helper 仍額外讀取 `updatedAt`，但必須改成不會把 `updatedAt` 誤稱為 domain version 的名稱，例如 `concurrencyPrismaLedgerRecordSelect`。

這個 rename 只是移除誤導語意，不改 conditional-write 行為；同步更新所有 caller 與 fake client types。

- [ ] **Step 3: Preserve version in mappers and query result types**

`baseLedgerRecordFields` 將 `version` 原樣投影。所有只回傳 persisted rows 的 query result 使用 persisted subtype；同時有 pending recurring 的 app orchestration 可回傳 `LedgerRecord | PersistedLedgerRecord` 的 union，但不在本切片新增 Search `kind` discriminator。

- [ ] **Step 4: Run focused read-model tests GREEN**

Run Task 1 的 Vitest command。

Expected: PASS，且 pending recurring assertions 不含 `version`。

## Task 4: Increment Version On Single-record Correction And Void

**Files:**

- Modify: `src/modules/fund-ledger/ledger-record-command.test.ts`
- Modify: `src/modules/fund-ledger/ledger-record-command.ts`

- [ ] **Step 1: Add failing atomic-increment expectations**

斷言 correction 與 void 成功的 `updateMany.data` 都含：

```ts
version: { increment: 1 }
```

並保留現有 `updatedAt: record.updatedAt`、household scope 與 active-status predicates。在 conflict、validation failure 與 permission denial cases 斷言不會產生第二次 write。

- [ ] **Step 2: Run the command test and confirm RED**

Run:

```bash
corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-command.test.ts
```

Expected: FAIL，因為 write data 尚未遞增 `version`。

- [ ] **Step 3: Add the minimal persistence change**

`toLedgerRecordUpdateData` 與 void data 加入 Prisma atomic increment。不改 command input、failure reason 或 domain correction result。

- [ ] **Step 4: Run the command test GREEN**

Run Task 4 Step 2 的 command。

Expected: PASS。

## Task 5: Increment Version On Batch Void And Reimbursement Settlement

**Files:**

- Modify: `src/app/(app)/search/_actions/record-search-actions.test.ts`
- Modify: `src/app/(app)/search/_actions/record-search-actions.ts`
- Modify: `src/modules/reimbursement/reimbursement-command.test.ts`
- Modify: `src/modules/reimbursement/reimbursement-command.integration.test.ts`
- Modify: `src/modules/reimbursement/reimbursement-command.ts`

- [ ] **Step 1: Add failing batch-void expectations**

在 batch void action tests 斷言成功 write 的 data 同時含 `status: "voided"` 與 atomic version increment。現有 `{ id, updatedAt }` OR predicates、count equality check 與 rollback behavior 保持不變。

- [ ] **Step 2: Add failing reimbursement expectations**

在 unit test 與 PostgreSQL integration test 斷言：

- 成功 settlement 將每筆 target 從 version `N` 變為 `N + 1`。
- 任一 record transition 失敗時，整個 transaction rollback，所有 target version 與 reimbursement evidence 都保持原狀。
- amount equality、payer grouping 與 payment evidence ordering 斷言保持不變。

- [ ] **Step 3: Run focused tests and confirm RED**

Run:

```bash
corepack pnpm exec vitest run \
  'src/app/(app)/search/_actions/record-search-actions.test.ts' \
  src/modules/reimbursement/reimbursement-command.test.ts
```

Expected: FAIL，因為 batch writes 尚未遞增 `version`。Integration test 由現有 isolated PostgreSQL test workflow 執行，不以 fake client 取代 rollback evidence。

- [ ] **Step 4: Add atomic increments to both write sites**

Batch void 與 `writeReimbursementPaymentSettlement` 的 `updateMany.data` 加入 `version: { increment: 1 }`。不將 preflight 結果當成 mutation 授權，不改寫入順序或 transaction boundary。

- [ ] **Step 5: Run focused tests GREEN**

Run Task 5 Step 3 的 Vitest command，並透過專案現有 PostgreSQL integration workflow 執行 `src/modules/reimbursement/reimbursement-command.integration.test.ts`。

Expected: PASS。

## Task 6: Audit Creation Paths And Domain Documentation

**Files:**

- Modify: `.ai/domain/fund-ledger.md`
- Verify: `src/modules/fund-ledger/ledger-record-creation.ts`
- Verify: `src/modules/fund-ledger/ledger-record-creation.integration.test.ts`
- Verify: `prisma/seed.sql`
- Verify: `prisma/seed.e2e.sql`

- [ ] **Step 1: Verify all creation paths rely on the database default**

確認 manual、CSV、recurring、production-safe seed 與 E2E seed 都不必顯式指定 `version`，且新 row 建立後為 `version = 1`。若 Prisma create result 是 read model 的一部分，則加入對應 assertion；不為了測試而把 default 重複寫進每個 create payload。

- [ ] **Step 2: Re-run the write-site audit**

Run:

```bash
rg -n 'ledgerRecord\.(update|updateMany|upsert|delete|deleteMany)' \
  src --glob '*.{ts,tsx}' --glob '!src/generated/**'
```

所有 production `update` / `updateMany` 必須已在 Task 4 或 Task 5 被覆蓋並遞增 version。Test cleanup 的 `deleteMany` 不計入 mutation contract。

- [ ] **Step 3: Synchronize the implemented long-term invariant**

只在 migration、read model 與全部 write paths 都通過驗證後，於 `.ai/domain/fund-ledger.md` 補充：已持久化 Ledger record 的 version 從 `1` 開始，每次成功狀態變更在同一 transaction 中遞增；失敗或 rollback 不改變 version。不在 domain 文件宣告 C2.2 尚未上線的 `expectedVersion` command shape。

## Task 7: Full Verification And Delivery Gate

- [ ] **Step 1: Run Prisma and focused tests**

```bash
corepack pnpm db:validate
corepack pnpm exec vitest run \
  src/modules/fund-ledger/ledger-record-prisma-adapter.test.ts \
  src/modules/fund-ledger/search/record-search-query.test.ts \
  src/app/home-dashboard-data-source.test.ts \
  src/modules/fund-ledger/ledger-record-command.test.ts \
  'src/app/(app)/search/_actions/record-search-actions.test.ts' \
  src/modules/reimbursement/refund-page/refund-page-query.test.ts \
  src/modules/reimbursement/reimbursement-payment-search-query.test.ts \
  src/modules/reimbursement/reimbursement-command.test.ts
sh e2e/verify-ledger-version-migration.sh
```

- [ ] **Step 2: Run repository-wide static and unit checks**

```bash
corepack pnpm type-check
corepack pnpm test
```

- [ ] **Step 3: Run database-backed evidence**

使用 README 所定義的 isolated E2E database workflow，至少執行 reimbursement command integration test 與現有 record edit/delete、batch delete、refund 主要流程對應的 Playwright specs。不把本機結果描述為 production verification。

- [ ] **Step 4: Check the final diff and scope**

```bash
git diff --check
git status --short
```

確認 diff 沒有：

- `expectedVersion` command input、typed `version_conflict` 或 conflict UX。
- Search result `kind` redesign。
- Reimbursement payment 自身的 version。
- 手動修改 `src/generated/prisma/`。
- 不相關 refactor。

## Rollout And Rollback Notes

- 部署順序是 migration first，再部署 C2.1 app。Database default 保證 migration-first 視窗內的舊 app insert 不失敗。
- C2.1 app 可獨立 rollback：舊 app 會忽略額外欄位，database 保留 `version` 不影響現有 `updatedAt` concurrency path。
- 不在 rollback 時 drop `version` column；這會是不必要的 destructive schema rollback。
- C2.2 不得與 C2.1 同時 rollout。必須先確認所有寫入 instance 都已執行 C2.1 的 atomic increment，再將外部 correction command 切換到 `expectedVersion`。

## Definition Of Done

- 舊 Ledger rows 在 migration 後皆有 `version = 1`，且舊 app 省略欄位時仍可 insert 與 update。
- 所有 persisted Ledger read models 回傳 database `version`，pending recurring 不假裝擁有 version。
- Correction、void、batch void 與 reimbursement settlement 的成功 write 原子遞增 version。
- Failure 與 rollback 不改變 version，reimbursement evidence 仍與 Ledger state transition 同一 transaction。
- 現有 command input、`updatedAt` guard、error mapping 與 UI 行為保持不變。
- Prisma validation、migration contract、focused tests、type-check、full unit suite 與相關 database-backed checks 通過。
