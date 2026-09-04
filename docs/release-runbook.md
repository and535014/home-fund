# Release Runbook

這份 runbook 用於既有 production 環境的例行發版操作。

不包含：

- 第一次部署設定。
- GitHub、Vercel、Neon、Google Cloud 帳號或權限設定。
- Secret、OAuth callback、database connection string、production environment variable 設定。
- Bootstrap seed。
- Production database backup 與 recovery 的一次性設定。

上述設定請維持在部署指南、
[Database Backup and Recovery Runbook](database-backup-and-recovery.md) 或服務後台
操作紀錄中；這份文件只描述每次發版怎麼跑。

## 發版原則

- Production 只部署 immutable `vX.Y.Z` tag。
- `package.json.version` 必須等於 tag 去掉 `v` 後的版本。
- Release PR merge 不代表 production 已部署。
- 建立 tag 才會觸發 production deploy。
- 已 push 的 production tag 不要移動或重打。
- 需要改 code 時，用下一個版本修正；不要修改已發布的 tag。
- Production app rollback 只透過 GitHub Actions 重新部署已有 tag；不使用
  Vercel rollback。

## 發版前檢查

1. 確認要發布的功能、修正和 migration 都已 merge 到 `main`。
2. 確認 `main` 的 CI 是綠燈。
3. 確認是否有 migration：
   - 任何 migration 都必須在 production approval 前完成 pre-deploy backup 與
     restore rehearsal。
   - destructive migration 還必須先有明確的資料損失審查和 recovery 計畫。
4. 決定目標版號：
   - `patch` 等級，例如 `v0.1.9` 到 `v0.1.10`：bug fix、部署流程強化、文件修正、小型 UI 調整、cron 修正。
   - `minor` 等級，例如 `v0.1.10` 到 `v0.2.0`：新的使用者功能、重要流程能力、支援新行為的 schema 擴充。
   - `major` 等級，例如 `v0.9.0` 到 `v1.0.0`：保留到專案準備宣告穩定 `1.0.0` 操作契約時使用。

## 建立 Release PR

1. 到 GitHub Actions。
2. 執行 `Prepare Release Version` workflow。
3. 輸入目標版號，例如：

```text
v0.1.10
```

4. 等 workflow 建立 `release/vX.Y.Z` 分支和 release PR。
5. 檢查 release PR：
   - 只應修改 `package.json`。
   - 目標版號正確。
   - PR 說明中的 previous version、next version、expected tag 正確。
6. 等 release PR CI 通過。
7. Merge release PR。

## 建立 Production Tag

1. 確認 release PR 已 merge 到 `main`。
2. 到 GitHub Actions。
3. 執行 `Create Release Tag` workflow。
4. workflow 會從 `main` 讀取 `package.json.version`，建立對應 `vX.Y.Z` tag。
5. tag push 後會自動觸發 `Deploy Production` workflow。

`Create Release Tag` 不需要輸入版號；版本來源只看 `main` 的 `package.json.version`。

## Database Backup Gate

只有目標 tag 含 migration 時需要這個 gate：

1. 等 `Deploy Production` preflight 通過，並保持 deployment 在 `production`
   environment approval 前等待。
2. 通知家庭成員暫停寫入，並避開台灣時間 00:15 recurring posting cron。
3. 執行 `Backup Production DB` workflow，輸入同一個 production tag。
4. 核准 backup run，不要誤核准另一個等待中的 deploy run。Backup job 會 checkout
   preflight 驗證過的 commit SHA，並重新確認 tag 仍指向同一 commit；不一致時停止。
5. 確認 workflow summary 顯示 restore rehearsal、核心 table counts 與指定
   `updatedAt` high-water timestamps comparison、comparison SHA-256，以及 GPG
   encryption 全部成功。
6. 下載 encrypted artifact，在本機驗證 SHA-256，再把 `.dump.gpg`、
   `.sha256`、`.metadata.json` 存入私人雲端。
7. 在 release PR comment 記錄 backup ID、workflow run URL、rehearsal 結果、
   checksum 與操作者。

Backup 任一步驟失敗、artifact 尚未外部保存，或 evidence 未補齊時，
不得核准 production deployment。完整命名、retention 與失敗處理見
[Database Backup and Recovery Runbook](database-backup-and-recovery.md#建立-pre-deploy-backup)。

## Production Deploy

`Deploy Production` workflow 會先跑 preflight，再要求 production approval。

Preflight 會檢查：

- tag 格式是 `vX.Y.Z`。
- tag 版本和 `package.json.version` 一致。
- tag commit 包含在 `main`。
- install、Prisma validate、type-check、lint、unit tests、production build 都通過。

Preflight 通過後：

1. 到 `Deploy Production` workflow run。
2. 確認 preflight 結果。
3. 若 tag 含 migration，確認 Database Backup Gate 已完整通過。
4. 核准 `production` environment。
5. 等 workflow 完成：
   - Vercel production artifact build。
   - production database migration。
   - Vercel production deploy。
   - automated smoke。

Automated smoke 包含：

- `/login` 可開啟。
- `/favicon.ico` 可開啟。
- `/api/cron/recurring-posting` 使用錯誤 Bearer token 回 `401`。

## 發版後檢查

每次 production deploy 後，至少確認：

- 可以從 production URL 開啟 `/login`。
- 可以從 production origin 啟動 Google 登入。
- admin member 登入後可以進入 dashboard。
- non-admin member 不能進入 admin-only route。
- logout 後回到 login。
- 主要記帳列表可讀取資料。
- Vercel runtime logs 沒有持續錯誤。
- 若本次涉及 recurring cron，手動用正確 cron secret 驗證 summary response，並確認不會暴露家庭財務明細。

## Release Evidence

每次 production deploy 後，不再新增 `.ai/deployment/production-vX.Y.Z-YYYY-MM-DD.md`。
發版證據集中在 release PR 和平台紀錄。

PR 或 PR comment 至少應保留：

- deployed version。
- tag commit。
- GitHub Actions run URL。
- Vercel deployment URL 和 production alias。
- migration 結果。
- 若含 migration：backup ID、backup workflow run URL、restore rehearsal 與
  encrypted SHA-256。
- automated smoke 結果。
- 手動 smoke 結果。
- rollback path。
- unresolved risks。

## 失敗處理

如果 preflight 失敗：

- 不會進入 production approval；不要手動繞過 preflight。
- 若是暫時性 CI 或服務問題，且 tag/package/main 檢查無誤，可以重新執行同一個 tag 的 deploy workflow。
- 若需要修改 code、migration、文件或版號，因為 tag 已建立，不要移動或重打既有 tag；修正後用下一個 patch 版本重新走 release PR 流程。
- 若失敗原因是 tag/package/main 不一致，停止發版並檢查 tag 建立來源；不要用手動 deploy 去部署不一致的 tag。

如果 production deploy 失敗但 tag 已建立：

- 不要移動或重打既有 tag。
- 若是暫時性服務問題，且 code 和 migration 不需變更，可以重新執行同一個 tag 的 deploy workflow。
- 若需要修改 code、migration、文件或設定假設，用下一個 patch 版本修正。

如果 migration 已套用但 app deploy 失敗：

- 不使用 Vercel rollback。
- Schema 向後相容且資料未損壞時，可用 `Deploy Production` 重新部署
  最後一個已驗證 tag，或用下一個 patch tag forward fix。
- 只有 schema／資料已損壞時，才由人工決定進入
  [Database Recovery](database-backup-and-recovery.md#database-recovery)。
- Database recovery 不得自動觸發，不得直接覆寫事故 DB。

## 完成條件

一次 release 完成需要同時滿足：

- `Deploy Production` workflow 成功。
- 若 tag 含 migration，verified encrypted backup 已存入私人雲端並完成
  release evidence。
- 必要的 post-deploy smoke 已完成。
- release PR 或 PR comment 已補齊 release evidence。
- 已知風險有明確 owner 或下一步。
