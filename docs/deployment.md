# 部署指南

這份文件說明 Home Family Fund 的 GitHub Actions、Vercel、Neon PostgreSQL、Google OAuth 部署設定。此專案目前**不使用 preview 環境**。

例行發版操作請看 [Release Runbook](release-runbook.md)；production database
backup 與事故復原請看 [Database Backup and Recovery Runbook](database-backup-and-recovery.md)。
本文件保留部署架構、首次設定、環境和 troubleshooting 說明。

部署策略：

- PR 只跑 CI，不部署。
- Production 只允許手動指定既有 immutable `vX.Y.Z` tag 部署。
- Google OAuth 只設定 production 的固定 Vercel 網址。
- Hosted database 只設定 production Neon database。

## 架構

- GitHub Actions 是 CI/CD 控制點。
- Vercel 負責 Next.js production 部署。
- Neon PostgreSQL 負責 production 資料庫。
- Prisma migration 由 GitHub Actions production workflow 執行。
- 含 migration 的 release 在手動啟動 production deploy 前，由獨立 GitHub Actions workflow
  建立加密 database backup 並完成 restore rehearsal。
- Bootstrap seed 是 production database 第一次初始化時的手動一次性步驟，
  用來建立第一個 admin 和預設基準資料；不會在每次 production deploy 自動執行。
- Google OAuth 只針對 production origin 設定 callback。

## GitHub Actions runtime 與 cache

- Actions 使用 `actions/checkout@v5`、`actions/setup-node@v6` 與
  `actions/upload-artifact@v6`，其 runtime 為 Node.js 24，最低 runner 版本為
  `v2.327.1`。目前所有 job 使用 GitHub-hosted `ubuntu-latest`。
- 應用程式的安裝、測試與建置仍使用 `node-version: 22`；這與 Action 自身的
  runtime 是兩個不同設定。
- CI 與 Create Release Tag 明確設定
  `package-manager-cache: false`。Production Preflight 與 Deploy Production
  保留既有 `cache: pnpm` 和 `cache-dependency-path: pnpm-lock.yaml`；
  DB backup 不使用 `setup-node`，也不新增 dependency cache。
- Checkout 保留原本的 ref、fetch depth、token 與 credentials persistence 行為。
  `checkout@v5` 的 fork checkout 限制針對 `pull_request_target`／`workflow_run`，
  目前 workflow 未使用這兩種 trigger。`setup-node@v6` 自動 cache 僅適用於 npm，
  且已移除 `always-auth`；本專案沒有使用該 input。
- Artifact 上傳保留原有名稱、路徑、壓縮與 3 天保存期限。`upload-artifact@v5`
  仍宣告 Node.js 20 runtime，因此直接使用 `v6`。

升級依據：[Checkout v5 release notes](https://github.com/actions/checkout/releases/tag/v5.0.0)、
[Setup Node v6 說明](https://github.com/actions/setup-node/tree/v6#breaking-changes-in-v6)、
[Upload Artifact v6 release notes](https://github.com/actions/upload-artifact/releases/tag/v6.0.0)。
Workflow 修改後執行 `actionlint .github/workflows/*.yml`，並在 PR 的 Quality Gate
檢查實際 runner log，確認沒有 Node.js 20 deprecation／forced Node.js 24 warning。

## 為什麼沒有 Preview

不使用 preview 環境可以降低 MVP 部署複雜度：

- 不需要 preview database。
- 不需要 preview secrets。
- 不需要處理 Vercel PR 臨時網址和 Google OAuth callback 不相容的問題。
- 不需要擔心 PR migration 污染 preview database。

接受的代價：

- PR 沒有線上預覽網址。
- UI review 需要在本機進行。
- Production 前沒有 hosted preflight 環境。
- Migration 第一次打到 hosted DB 會是在 production deploy，因此 migration 必須保守。

## 需要的帳號和權限

- GitHub repository admin 權限。
- Vercel project admin 權限。
- Neon project admin 權限。
- Google Cloud OAuth client 管理權限。

## 一次性 Vercel 設定

1. 在 Vercel 建立或匯入 project。
2. 確認 framework 偵測為 Next.js。
3. 確認 production 固定網址，例如：

```text
https://home-fund.vercel.app
```

4. 到 Vercel project settings 取得：
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
5. 建立 Vercel token，供 GitHub Actions 使用。
6. 在 Vercel Production environment variables 設定 runtime 變數：

```text
DATABASE_URL
BETTER_AUTH_URL
BETTER_AUTH_SECRET
CSV_IMPORT_PREVIEW_SECRET
MEMBER_BINDING_TOKEN_ENCRYPTION_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CRON_SECRET
```

`DATABASE_URL` 使用 Neon pooled connection string。`DATABASE_URL_UNPOOLED` 只給 GitHub Actions migration 用，預設不需要放到 Vercel runtime。
`CRON_SECRET` 用於保護 Vercel Cron 觸發的週期事件自動入帳 route。Vercel 會自動把它放進 cron request 的 `Authorization: Bearer ...` header。

`vercel.json` 會每天 16:15 UTC 呼叫 `/api/cron/recurring-posting`，也就是台灣時間 00:15。這個 route 只處理台灣時區當月且已到期的週期事件，並以 idempotent command 避免重複入帳。

GitHub Actions 是正式部署控制點。不要把 Vercel Git auto-deploy 當作主要 release 流程；production deploy 必須由 GitHub Actions 的 手動 workflow 控制。

## 一次性 Neon 設定

1. 建立 Neon project。
2. 建立 production branch/database。
3. 複製兩種 connection string：
   - pooled connection string：給 app runtime 的 `DATABASE_URL`
   - unpooled/direct connection string：給 Prisma migration 的 `DATABASE_URL_UNPOOLED`
4. 依 [Database Backup and Recovery Runbook](database-backup-and-recovery.md#一次性設定)
   建立 read-only backup role、GPG key 與 GitHub environment 設定。
5. 確認 Free plan 的 branch、storage、compute 與 restore window 限制；不要把
   provider restore 當作外部 backup。

## 一次性 Google OAuth 設定

在 Google Cloud Console 建立 Web application OAuth client。

production 需要加入：

```text
https://home-fund.vercel.app
https://home-fund.vercel.app/api/auth/callback/google
```

如果未來改用自訂網域，必須把新的 production origin 和 callback 加到 Google OAuth 設定，並同步更新 `BETTER_AUTH_URL`。

## GitHub secrets 和 environment

建立 GitHub Environment：

- `production`

目前 private repository 方案不支援 environment required reviewers。
保留 `production` environment 作為 secrets 的作用域；手動啟動 `Deploy Production`
就是明確的部署授權，必須先完成 migration 判定與 backup／restore gate。
不會有後續 reviewer 等待步驟。

Repository secrets：

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

`production` environment secrets：

```text
DATABASE_URL
DATABASE_URL_UNPOOLED
DATABASE_BACKUP_URL
BACKUP_GPG_PUBLIC_KEY
BETTER_AUTH_URL
BETTER_AUTH_SECRET
CSV_IMPORT_PREVIEW_SECRET
MEMBER_BINDING_TOKEN_ENCRYPTION_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CRON_SECRET
```

`production` environment variables：

```text
BACKUP_GPG_RECIPIENT_FINGERPRINT
PRODUCTION_POSTGRES_MAJOR
```

`DATABASE_URL` 使用 pooled connection string。`DATABASE_URL_UNPOOLED` 使用 unpooled/direct connection string。
`DATABASE_BACKUP_URL` 使用專用 read-only role 的 direct connection string，不得使用
pooled endpoint。`BACKUP_GPG_PUBLIC_KEY` 只放 public key；private key 不得上傳
GitHub。Fingerprint 與 PostgreSQL major 的設定、驗證步驟以
[Database Backup and Recovery Runbook](database-backup-and-recovery.md#設定-github-production-environment)
為準。
`CSV_IMPORT_PREVIEW_SECRET` 用來簽署 CSV 匯入預覽 token，production 必須設定，不能共用 `BETTER_AUTH_SECRET`。
`CRON_SECRET` 必須和 Vercel Production runtime 的同名變數一致；舊的 `RECURRING_POSTING_CRON_SECRET` 已不再使用。

## PR CI 流程

1. 開 PR。
2. GitHub Actions 執行 CI：
   - `corepack pnpm install --frozen-lockfile`
   - `corepack pnpm db:validate`
   - `corepack pnpm type-check`
   - `corepack pnpm lint`
   - `corepack pnpm test`
   - `corepack pnpm build`
3. PR 不會部署到 Vercel。
4. PR 不會執行 hosted database migration。

## Release 版號與手動部署

Git tag 是 production version 的唯一 authoritative source。`package.json.version`
保留作為 private package metadata，不參與 release gate，也不需要逐次同步。
不再使用 `Prepare Release Version`，不需要建立或保存 `RELEASE_BOT_TOKEN`。
若未來 UI／log 需要版本，由 build/deploy 從 tag 或 commit SHA 注入。

1. 功能 PR merge 後，確認最新 `main` CI 通過。
2. 手動執行 `Create Release Tag`，輸入嚴格 `vX.Y.Z`，例如 `v1.2.3`。
   版本不得含前導零、prerelease 或 build suffix，必須大於現有最高 release tag，
   且尚未存在。失敗 release 的 tag 也算已消耗，不得重用。
3. Workflow checkout 最新 `main`，先完成品質 preflight，建立前重新確認 `main`
   沒有前進，才建立 annotated tag。若 `main` 已前進，重新執行 preflight。
4. Tag push 不會觸發部署，也不依賴 workflow chaining。
5. 對目標 tag 完成 migration 判定；有 migration 時，先執行獨立的
   `Backup Production DB`，完成 restore rehearsal、encrypted artifact 外部保存，
   並把 evidence 記錄在功能 PR 或 release tracking issue。
6. 完成上述 gate 後，手動執行 `Deploy Production`，輸入既有 tag、migration
   判定與 evidence。這次 dispatch 就是 production 部署授權。
7. Deploy preflight 驗證 tag 格式、tag commit 屬於 `main`，並跑 install、
   Prisma validate、type-check、lint、unit tests 與 production build。
8. Production job 使用 preflight 已驗證的 tag commit SHA，重新確認 tag 未移動，
   然後執行 Vercel artifact build、migration、deploy 與 automated smoke。
9. 於 workflow summary、功能 PR 或 release tracking issue 記錄 tag、commit、run URL、
   Vercel deployment 與 post-deploy smoke evidence。

完整輸入、backup gate、失敗處理與非 production rehearsal 見
[Release Runbook](release-runbook.md)。禁止移動或重打已 push 的 tag。

## Migration 政策

Production migration 只能在 production workflow 裡執行。

不要從本機切 production `DATABASE_URL` 跑 migration。

每個含 migration 的 production tag 都必須在手動啟動 deployment 前完成
`Backup Production DB`、restore rehearsal、encrypted artifact 外部保存與 release
evidence。Destructive migration 還必須先明確審查資料損失風險與 recovery plan。

優先使用 backward-compatible migration：

1. 先新增 nullable 欄位或新表。
2. 部署相容的新 app。
3. 必要時 backfill。
4. 下一個版本再移除舊欄位。

## Bootstrap seed 政策

Production bootstrap seed 是一次性初始化步驟，不屬於每次 production deploy。
在 production database 第一次 migration 完成後，手動執行
`corepack pnpm db:seed`，由當次命令提供的 `SEED_GOOGLE_ACCOUNT_EMAIL`
指定第一個 admin Google email。它不是 Vercel runtime 變數，也不是每次
production deploy 所需的 GitHub secret。

範例：

```sh
DATABASE_URL="postgresql://..." \
SEED_GOOGLE_ACCOUNT_EMAIL="admin@example.com" \
corepack pnpm db:seed
```

`prisma/seed.sql` 必須保持 production-safe：

- 可以建立或更新 household、第一個 admin 和 admin role。
- 不可以建立分類；production 分類應由使用者在 UI 建立或透過明確匯入流程建立。
- 不可以刪除 user、member、ledger、category、invitation、reimbursement、recurring 或 Better Auth data。
- 不可以塞入 E2E 或 demo-only fixture。

E2E fixture 只允許放在 `prisma/seed.e2e.sql`，並只在 E2E 專用 database
重建後由 `e2e/setup-db.sh` 載入。

## Rollback 和備份

- Production app 版本變更只允許透過 `Deploy Production` workflow 重新部署已有
  tag；完全不使用 Vercel rollback。
- App-only failure 且 database schema 仍向後相容時，可重新部署最後一個已驗證
  production tag，不還原 database。
- Database rollback 不得因 workflow failure 自動觸發；能安全 forward fix 時優先
  forward fix。
- 只有 schema／資料已損壞或舊 app 無法安全使用目前 DB 時，才依
  [Database Backup and Recovery Runbook](database-backup-and-recovery.md#database-recovery)
  由人工還原到獨立 recovery branch/database。
- 不得直接覆寫事故 production database，也不得把重新部署舊 tag 當作
  database rollback。

## Production smoke checklist

每次 production deploy 後檢查：

- `/login` 可以開啟。
- 可以從 production origin 啟動 Google 登入。
- admin member 登入後可以進入 dashboard。
- non-admin member 不能進入 admin-only route。
- logout 後回到 login。
- 主要記帳列表可讀取資料。
- `/api/cron/recurring-posting` 使用錯誤 Bearer token 會回 401；使用正確 cron secret 可回傳週期事件入帳 summary counts。
- Vercel runtime logs 沒有持續錯誤。

`Deploy Production` workflow 會自動檢查錯誤 Bearer token 回 `401`。
正確 cron secret smoke 仍維持手動，因為它可能觸發 production 週期事件入帳。

每次 production deploy 後，不再新增 `.ai/deployment/production-vX.Y.Z-YYYY-MM-DD.md`。
功能 PR／release tracking issue、GitHub Actions run、Vercel deployment 頁面和 PR comment 是 release
evidence 的主要紀錄來源。含 migration 的 release 還必須記錄 backup ID、backup
workflow run、source commit、restore rehearsal、encrypted SHA-256 與 restore comparison
SHA-256；recovery 時以這份 GitHub evidence 交叉驗證私人雲端 bundle。不得記錄備份位置
或 key material。

## Troubleshooting

### CI 失敗

先看失敗步驟：

- `db:validate`：檢查 Prisma schema 和 migration。
- `type-check`：檢查 TypeScript 型別。
- `lint`：檢查 ESLint。
- `test`：檢查 unit/domain tests。
- `build`：檢查 Next.js build 和 production env 假設。

### Production migration 失敗

- 不要重跑本機 migration 指向 production。
- 先確認失敗 migration 是否已部分套用。
- 查看 Neon database 狀態和 Prisma migration table。
- 若資料未損壞，優先安全的 forward fix。
- 只有人工確認需要 database recovery 後，才開始建立 recovery branch。

### Production backup 失敗

- 不要啟動 production deployment。
- 先檢查 read-only grants、`PRODUCTION_POSTGRES_MAJOR`、GPG fingerprint 與 runner logs。
- 只有新的 backup run 完成 restore rehearsal、artifact 下載與私人雲端保存後，
  才可繼續 deployment。

### Vercel deploy 失敗

- 確認 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`。
- 確認 Vercel Production environment variables 齊全。
- 確認 Vercel project 使用正確 framework 和 build command。

### Google OAuth callback mismatch

- 確認 `BETTER_AUTH_URL` 和 production origin 完全一致。
- 確認 Google OAuth Authorized JavaScript origins 有 production origin。
- 確認 Google OAuth Authorized redirect URIs 有 `<origin>/api/auth/callback/google`。
