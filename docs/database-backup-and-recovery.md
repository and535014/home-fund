# Production Database Backup and Recovery Runbook

這份 runbook 定義 Home Family Fund production Neon PostgreSQL 的人工 backup 與
database recovery 流程。例行發版順序請看 [Release Runbook](release-runbook.md)；
部署架構與一次性設定請看 [部署指南](deployment.md)。

## 範圍與邊界

- 只有含 Prisma migration 的 production release 必須建立 pre-deploy backup。
- Backup 由 `Backup Production DB` GitHub Actions workflow 手動啟動，不從本機
  直接讀取 production。
- GitHub-hosted runner 只在 dump、restore rehearsal 與加密期間短暫持有 plaintext
  backup；workflow 不得輸出 connection string、SQL row data 或 plaintext artifact。
- GPG public key 只負責加密；private key 不得放進 GitHub、repository 或 workflow。
- Neon instant restore／time travel 可協助調查，但不是這套流程的正式外部 backup。
- Database rollback 不得自動觸發。能安全 forward fix 時優先 forward fix。
- App rollback 與 database recovery 後的部署都只使用 `Deploy Production` workflow；
  不使用 Vercel rollback。
- 本流程不承諾 recovery point objective（RPO）或 recovery time objective（RTO）。
  Backup 後的 writes 若未另行搬回，可能在整庫還原時遺失。

## 一次性設定

### 建立 read-only backup role

1. 在 Neon production branch 建立專用 login role，例如 `home_fund_backup`，產生獨立
   強密碼。不要沿用 app runtime 或 migration owner credential。
2. 使用 migration owner 連線到 production database，將下列 placeholder 換成實際
   database 與 owner role 後執行：

```sql
GRANT CONNECT ON DATABASE "<production_database>" TO home_fund_backup;
GRANT USAGE ON SCHEMA public TO home_fund_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO home_fund_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO home_fund_backup;

ALTER DEFAULT PRIVILEGES FOR ROLE "<migration_owner>" IN SCHEMA public
GRANT SELECT ON TABLES TO home_fund_backup;

ALTER DEFAULT PRIVILEGES FOR ROLE "<migration_owner>" IN SCHEMA public
GRANT SELECT ON SEQUENCES TO home_fund_backup;
```

`<migration_owner>` 必須是 GitHub Actions 使用 `DATABASE_URL_UNPOOLED` 執行 Prisma
migration 時的 database role。Default privileges 只影響該 owner 日後建立的 objects，
因此不能省略或填入不同 role。

3. 驗證現有 tables 都可讀，而且 backup role 沒有 mutation privileges：

```sql
SELECT count(*) AS tables_missing_select
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT has_table_privilege(
    'home_fund_backup',
    format('%I.%I', schemaname, tablename),
    'SELECT'
  );

SELECT count(*) AS tables_with_unexpected_write
FROM pg_tables
WHERE schemaname = 'public'
  AND (
    has_table_privilege('home_fund_backup', format('%I.%I', schemaname, tablename), 'INSERT')
    OR has_table_privilege('home_fund_backup', format('%I.%I', schemaname, tablename), 'UPDATE')
    OR has_table_privilege('home_fund_backup', format('%I.%I', schemaname, tablename), 'DELETE')
    OR has_table_privilege('home_fund_backup', format('%I.%I', schemaname, tablename), 'TRUNCATE')
  );
```

兩個結果都必須是 `0`。每次新增 migration 後，backup workflow 的 `pg_dump` 也會驗證
backup role 是否仍能讀取完整 schema 與資料。

### 建立專用 GPG encryption key

使用操作者信任的電腦建立一把 production backup 專用 GPG key，並設定強 passphrase。
可以使用 `gpg --full-generate-key` 的互動流程；key identity 不要使用家庭成員資料。

完成後：

1. 用 `gpg --fingerprint <key-id>` 取得 40 字元 primary key fingerprint。
2. 用 `gpg --armor --export <key-id>` 匯出 public key。
3. 用 `gpg --armor --export-secret-keys <key-id>` 匯出 private key backup。
4. Private key backup 與 passphrase 分別保存在 password manager／受控的復原位置。
5. 實際匯入 private key 並解密一個測試檔後，才可把這把 key 用於 production backup。

遺失 private key 或 passphrase 就無法解密 backup。Private key 不得加入 GitHub secret。

### 設定 GitHub `production` environment

新增 environment secrets：

```text
DATABASE_BACKUP_URL
BACKUP_GPG_PUBLIC_KEY
```

- `DATABASE_BACKUP_URL`：`home_fund_backup` 的 Neon direct／unpooled connection string；
  hostname 不得包含 `-pooler`。
- `BACKUP_GPG_PUBLIC_KEY`：ASCII-armored public key 全文。

新增 environment variables：

```text
BACKUP_GPG_RECIPIENT_FINGERPRINT
PRODUCTION_POSTGRES_MAJOR
```

- `BACKUP_GPG_RECIPIENT_FINGERPRINT`：對應 public key 的 40 字元 primary fingerprint。
- `PRODUCTION_POSTGRES_MAJOR`：Neon production 的 PostgreSQL major version，例如 `17`。
  可以在 Neon SQL Editor 執行 `SHOW server_version;` 核對。

`production` environment 應維持 required reviewers。Workflow 在 environment approval
之前不能取得上述 secrets；若 repository 方案不支援 private repository 的 required
reviewers，必須把這項限制列為未解風險，不得宣稱已有人工作業核准閘門。

## 建立 Pre-deploy Backup

以下流程只在目標 tag 含 migration 時執行：

1. 安排人工維護時段，通知家庭成員從 backup 開始到 post-deploy smoke 完成前暫停
   寫入，並避開台灣時間 00:15 recurring posting cron。
2. 建立 production tag，等 `Deploy Production` 完成 preflight 並停在 `production`
   environment approval；此時 migration 尚未執行。
3. 到 GitHub Actions 執行 `Backup Production DB`，輸入同一個 `vX.Y.Z` tag。
4. 確認 backup preflight 驗證 tag、`package.json.version`、`main` ancestry 都通過。
5. 核准這次 backup run 的 `production` environment job。不要誤核准仍在等待的 deploy
   run。
6. Workflow 必須全部成功：
   - 使用 matching PostgreSQL major 的 `pg_dump --format=custom --no-owner --no-acl`。
   - 將 dump 還原到一次性 PostgreSQL container。
   - 檢查核心 tables、Prisma migration 狀態、核心 row counts 與 high-water timestamps。
   - 用設定的 GPG public key 加密。
   - 產生 encrypted SHA-256、metadata 與 3 天期 GitHub artifact。
7. 下載 artifact，在信任的電腦執行：

```sh
shasum -a 256 -c home-fund-production-pre-vX.Y.Z-YYYYMMDDTHHMMSSZ.dump.gpg.sha256
```

8. 將 `.dump.gpg`、`.sha256` 與 `.metadata.json` 一起保存到核准的私人雲端位置。
   GitHub artifact 只是 3 天期交付管道，不是正式保存位置。
9. 在 release PR comment 記錄 backup ID、backup workflow run URL、restore rehearsal
   結果、操作者與 checksum。不要記錄私人雲端路徑、connection string 或 key material。
10. 確認 artifact 已保存且 release evidence 完整後，才核准等待中的 production deploy。

Backup workflow 任一步驟失敗時，不得核准 deployment。先修正 read privileges、
PostgreSQL version、GPG key 或 runner 問題，再重新建立一份完整 backup。

## Backup Retention

- 私人雲端永遠保留最近 3 份通過 restore rehearsal 的 encrypted backup。
- 新 release 完成 deployment 與 production smoke 後，才可以刪除更舊的第 4 份。
- Deployment 失敗、事故調查或 recovery 期間，不得刪除任何相關 backup。
- GitHub artifact 固定 3 天後到期；artifact 到期不影響私人雲端的正式 backup。

## 判斷是否需要 Database Recovery

Workflow failure 本身不是 database rollback trigger：

- Migration 尚未開始：不動 DB，修正 deployment 或用下一個 tag。
- Migration 失敗但未損壞資料：檢查 `_prisma_migrations`，優先安全的 forward fix。
- App deploy／smoke 失敗，但 schema 仍與上一個 app 相容：用 `Deploy Production`
  重新部署最後一個已驗證 tag，不還原 DB。
- Destructive migration、錯誤 backfill 或 incompatible writes 已破壞 schema／資料：
  由操作者明確宣布進入 database recovery。

不確定資料是否受損時，維持停止寫入並繼續調查；不得為了縮短維護時間直接還原。

## Database Recovery

### 1. 固定事故範圍

記錄：

- 事故中的 production tag 與 commit。
- 最後一個已驗證成功的 production tag。
- 要使用的 backup ID、checksum 與 workflow run。
- Migration 是否開始、完成或部分執行。
- Backup 完成後是否可能存在新的 writes。

保持 production 停止人工寫入，並避免手動觸發 recurring posting。這裡的停止寫入仍是
人工約定，不是系統級 maintenance mode。

### 2. 檢查 Neon Free quota

在 Neon Console 確認同一 project 仍有足夠的 branch、storage 與 compute 額度。
額度不足就停止；這份 runbook 不把新 project、付費升級或直接覆寫 production 視為
已核准 fallback。

### 3. 建立隔離的 recovery target

1. 在同一 Neon project 從事故 production branch 建立新的 recovery branch，例如
   `recovery-20260817-incident`。
2. 不要替可能成為新 production 的 recovery branch 設定自動到期時間。
3. 在 recovery branch 建立空白 database，例如
   `home_fund_recovery_20260817`；不要把 dump restore 到事故 database。
4. 取得這個空白 database 的 pooled URL 與 direct／unpooled URL。
5. 原 production branch/database 保持不變，供差異比對與事故調查。

### 4. 驗證並解密 backup

在有 GPG private key、磁碟加密且受信任的操作者電腦執行：

```sh
shasum -a 256 -c home-fund-production-pre-vX.Y.Z-YYYYMMDDTHHMMSSZ.dump.gpg.sha256
gpg \
  --output home-fund-production-pre-vX.Y.Z-YYYYMMDDTHHMMSSZ.dump \
  --decrypt home-fund-production-pre-vX.Y.Z-YYYYMMDDTHHMMSSZ.dump.gpg
```

Checksum、GPG fingerprint 或解密任一步驟不符就停止。Plaintext dump 只能短暫存在於
受信任的加密磁碟，recovery 結束後必須移除。

### 5. Restore 至 recovery database

使用與 metadata `postgresMajor` 相同 major version 的 `pg_restore`。將 recovery direct
URL 以不回顯方式讀入目前 shell，避免放進 shell history：

```sh
read -r -s RECOVERY_DATABASE_URL
echo
PGDATABASE="$RECOVERY_DATABASE_URL" pg_restore \
  --exit-on-error \
  --no-owner \
  --no-acl \
  home-fund-production-pre-vX.Y.Z-YYYYMMDDTHHMMSSZ.dump
unset RECOVERY_DATABASE_URL
```

若本機沒有 matching `pg_restore`，先安裝對應 PostgreSQL client；不要改用較舊版本，
也不要在事故期間臨時改成直接覆寫 production。

### 6. 切換前驗證

在 recovery database 確認：

- `_prisma_migrations` 不存在 `finished_at IS NULL AND rolled_back_at IS NULL` 的紀錄。
- `Household`、`Member`、`Category`、`LedgerRecord`、`RecurringRule`、
  `RecurringOccurrence`、`ReimbursementPayment` 等核心 tables 存在。
- 核心 table counts 與 `updatedAt` high-water timestamps 符合 backup 時點。
- Accident database 與 recovery database 之間沒有未處理的 post-backup writes。

只要發現 backup 後有新增或修改，立即停止切換。先設計並驗證資料差異搬移，或由操作者
明確接受資料損失並留下 release／incident evidence；runbook 不會自動捨棄差異資料。

### 7. 切換 Connection Strings

依序更新：

1. Vercel Production `DATABASE_URL`：recovery database 的 pooled URL。
2. GitHub `production` environment `DATABASE_URL`：同一 pooled URL。
3. GitHub `production` environment `DATABASE_URL_UNPOOLED`：recovery direct URL。

在 recovery database 重新設定 `home_fund_backup` 的 read-only grants，確認後再把
`DATABASE_BACKUP_URL` 更新為 recovery database 的 direct URL。其他 application secrets
不得更動。

### 8. 透過 GitHub Actions 部署舊 Tag

1. 手動執行 `Deploy Production`。
2. 輸入最後一個已驗證、且與 backup schema 相容的 production tag。
3. 確認 workflow checkout `refs/tags/vX.Y.Z` 並通過完整 preflight。
4. 核准 `production` environment。
5. 等舊 tag 對 recovery DB 執行其既有 migrations、部署 Vercel artifact 與 automated
   smoke。

不要使用 Vercel rollback，也不要移動或重打任何 production tag。

### 9. Post-cutover Smoke

完成 [Release Runbook](release-runbook.md#發版後檢查) 的全部檢查，至少確認：

- Google 登入、admin dashboard、non-admin denial 與 logout。
- 主要記帳列表資料正確。
- Automated cron invalid-token smoke 成功。
- Vercel runtime logs 沒有持續 database／migration 錯誤。

全部通過後才通知家庭成員恢復寫入。

### 10. 收尾

- 在 release PR 或 incident 紀錄補上 recovery branch、backup ID、舊 tag deploy run、
  smoke 結果、資料差異處理與 remaining risks。
- 不要在同一次事故中立即刪除原事故 branch/database；先保留調查證據並另訂 cleanup
  時點。
- Recovery branch 若已成為 production，不得設定 expiration 或視為暫存資源。
- 確認新的 production backup role 與下一次 backup workflow 可用。
- 移除操作者電腦上的 plaintext dump。
