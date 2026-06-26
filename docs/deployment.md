# 部署指南

這份文件說明 Home Family Fund 的 GitHub Actions、Vercel、Neon PostgreSQL、Google OAuth 部署設定。此專案目前**不使用 preview 環境**。

部署策略：

- PR 只跑 CI，不部署。
- Production 只允許 `vX.X.X` tag 或手動指定既有 tag 部署。
- Google OAuth 只設定 production 的固定 Vercel 網址。
- Hosted database 只設定 production Neon database。

## 架構

- GitHub Actions 是 CI/CD 控制點。
- Vercel 負責 Next.js production 部署。
- Neon PostgreSQL 負責 production 資料庫。
- Prisma migration 由 GitHub Actions production workflow 執行。
- Bootstrap seed 是 production database 第一次初始化時的手動一次性步驟，
  用來建立第一個 admin 和預設基準資料；不會在每次 production deploy 自動執行。
- Google OAuth 只針對 production origin 設定 callback。

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
```

`DATABASE_URL` 使用 Neon pooled connection string。`DATABASE_URL_UNPOOLED` 只給 GitHub Actions migration 用，預設不需要放到 Vercel runtime。

GitHub Actions 是正式部署控制點。不要把 Vercel Git auto-deploy 當作主要 release 流程；production deploy 必須由 GitHub Actions 的 tag/manual workflow 控制。

## 一次性 Neon 設定

1. 建立 Neon project。
2. 建立 production branch/database。
3. 複製兩種 connection string：
   - pooled connection string：給 app runtime 的 `DATABASE_URL`
   - unpooled/direct connection string：給 Prisma migration 的 `DATABASE_URL_UNPOOLED`
4. 確認 production database 有備份或 point-in-time recovery 策略。

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

`production` environment 必須設定 required reviewers，避免 tag 或手動部署直接上線。

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
BETTER_AUTH_URL
BETTER_AUTH_SECRET
CSV_IMPORT_PREVIEW_SECRET
MEMBER_BINDING_TOKEN_ENCRYPTION_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

`DATABASE_URL` 使用 pooled connection string。`DATABASE_URL_UNPOOLED` 使用 unpooled/direct connection string。
`CSV_IMPORT_PREVIEW_SECRET` 用來簽署 CSV 匯入預覽 token，production 必須設定，不能共用 `BETTER_AUTH_SECRET`。

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

## Production tag 部署流程

1. 確認 main branch 已包含要發布的 commit。
2. 建立 semver tag，例如：

```sh
git tag v1.2.3
git push origin v1.2.3
```

3. GitHub Actions 觸發 `deploy-production.yml`。
4. GitHub Environment `production` 等待 reviewer 核准。
5. 核准後 workflow 會：
   - checkout `v1.2.3`
   - 跑完整 CI
   - 對 production database 跑 `corepack pnpm db:deploy`
   - 建置 Vercel production artifact
   - 部署到 Vercel production
6. 到 workflow summary 查看 production URL 和 smoke checklist。

## 手動部署指定 Production 版本

1. 到 GitHub Actions。
2. 選擇 `Deploy Production` workflow。
3. 按 `Run workflow`。
4. 輸入版本號，例如：

```text
v1.2.3
```

5. workflow 只接受 `vX.X.X` 格式。
6. workflow 會 checkout `refs/tags/v1.2.3`，不是 branch。
7. 等待 `production` environment reviewer 核准。

手動部署是重新部署既有 tag，不是從目前 branch 部署。

## Migration 政策

Production migration 只能在 production workflow 裡執行。

不要從本機切 production `DATABASE_URL` 跑 migration。

Destructive migration 前必須先確認 Neon backup/restore 或 point-in-time recovery。

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

Vercel rollback 只會回復 app code，不會回復資料庫。

Production rollback：

- app code：使用 Vercel rollback 或重新部署舊 tag。
- database：使用 Neon backup/restore、point-in-time recovery，或 forward migration。
- 不要把重新部署舊 tag 當作 database rollback。

## Production smoke checklist

每次 production deploy 後檢查：

- `/login` 可以開啟。
- 可以從 production origin 啟動 Google 登入。
- admin member 登入後可以進入 dashboard。
- non-admin member 不能進入 admin-only route。
- logout 後回到 login。
- 主要記帳列表可讀取資料。
- Vercel runtime logs 沒有持續錯誤。

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
- 若是 destructive migration，先確認備份和復原策略。

### Vercel deploy 失敗

- 確認 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`。
- 確認 Vercel Production environment variables 齊全。
- 確認 Vercel project 使用正確 framework 和 build command。

### Google OAuth callback mismatch

- 確認 `BETTER_AUTH_URL` 和 production origin 完全一致。
- 確認 Google OAuth Authorized JavaScript origins 有 production origin。
- 確認 Google OAuth Authorized redirect URIs 有 `<origin>/api/auth/callback/google`。
