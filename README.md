# Home Family Fund

家庭共用金管理工具。主要語言為繁體中文，介面以 dark theme 為主。

## 部署

部署採 GitHub Actions、Vercel、Neon PostgreSQL。PR 只跑 CI；`vX.X.X` tag 或手動指定版本可以部署 production。完整設定步驟請看 [部署指南](docs/deployment.md)。

## 本機開發

### 前置需求

- Node.js，並啟用 Corepack
- pnpm，透過 `corepack` 管理
- Docker Desktop，用於啟動本機 PostgreSQL
- Google Cloud OAuth client，用於本機測試 Google 登入

安裝依賴：

```sh
corepack pnpm install
```

### 環境變數

先複製範例檔：

```sh
cp .env.example .env
```

`.env` 已被 git ignore，不會被提交。請填入以下值：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
MEMBER_BINDING_TOKEN_ENCRYPTION_KEY="replace-with-32-random-bytes-base64"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
SEED_GOOGLE_ACCOUNT_EMAIL="your-google-account@example.com"
```

#### `DATABASE_URL`

請使用 PostgreSQL 連線字串。

本機 Docker Postgres 預設使用：

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/home_fund"
```

如果使用 Neon：

1. 建立 Neon project。
2. 建立或選擇一個開發用 branch/database。
3. 複製 Postgres connection string。
4. 貼到 `DATABASE_URL`。

Neon URL 通常會長得像這樣：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require"
```

如果使用本機 Postgres，請改用本機資料庫 URL。例如：

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/home_fund"
```

#### `BETTER_AUTH_URL`

本機開發請使用：

```env
BETTER_AUTH_URL="http://localhost:3000"
```

部署後請改成正式環境的 app origin，例如：

```env
BETTER_AUTH_URL="https://your-app.vercel.app"
```

#### `BETTER_AUTH_SECRET`

產生一組夠長的隨機 secret：

```sh
openssl rand -base64 32
```

把輸出填入：

```env
BETTER_AUTH_SECRET="generated-secret"
```

不同環境請使用不同 secret。

#### `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`

成員綁定 Google 帳號連結會把可重新複製的 token 以 AES-256-GCM 加密後儲存。
這個值必須是 32 bytes 的 base64 字串，不能共用 `BETTER_AUTH_SECRET`。

產生方式：

```sh
openssl rand -base64 32
```

把輸出填入：

```env
MEMBER_BINDING_TOKEN_ENCRYPTION_KEY="generated-base64-key"
```

本機、production 請各自使用不同 key。正式環境若更換 key，尚未失效的既有綁定連結將無法再由管理者重新複製，需要等連結失效後重新產生。

#### `CSV_IMPORT_PREVIEW_SECRET`

CSV 匯入預覽 token 的 HMAC 簽章 secret。production 必須設定，不能共用
`BETTER_AUTH_SECRET`。

產生方式：

```sh
openssl rand -base64 32
```

```env
CSV_IMPORT_PREVIEW_SECRET="generated-base64-secret"
```

#### `RECURRING_POSTING_CRON_SECRET`

週期事件自動入帳 cron route 的 Bearer token secret。production 必須設定，不能共用
`BETTER_AUTH_SECRET`。

產生方式：

```sh
openssl rand -base64 32
```

```env
RECURRING_POSTING_CRON_SECRET="generated-base64-secret"
```

Vercel Cron 若使用平台自動 Authorization header，請在 Vercel Production runtime
額外設定同值的 `CRON_SECRET`。

#### `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`

建立 Google OAuth client：

1. 開啟 Google Cloud Console。
2. 建立或選擇一個 project。
3. 設定 OAuth consent screen。
4. 建立 OAuth Client ID。
5. Application type 選擇 `Web application`。
6. 在 Authorized JavaScript origins 加入本機開發 origin：

```text
http://localhost:3000
```

7. 在 Authorized redirect URIs 加入本機開發 redirect URI：

```text
http://localhost:3000/api/auth/callback/google
```

8. 複製產生出的 client ID 和 client secret，填入：

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

正式環境也需要加入正式網址的 origin 和 redirect URI：

```text
https://your-app.vercel.app
https://your-app.vercel.app/api/auth/callback/google
```

#### `SEED_GOOGLE_ACCOUNT_EMAIL`

Bootstrap seed 會用這個 email 建立第一個 admin member，讓 Google 登入後可以對應到管理者權限。

請填入你實際會拿來登入並管理服務的 Google email：

```env
SEED_GOOGLE_ACCOUNT_EMAIL="you@example.com"
```

## 資料庫設定

啟動本機 PostgreSQL：

```sh
docker compose up -d
```

確認資料庫容器狀態：

```sh
docker compose ps
```

產生 Prisma client：

```sh
corepack pnpm db:generate
```

驗證 schema：

```sh
corepack pnpm db:validate
```

套用 migration：

```sh
corepack pnpm db:migrate
```

匯入 bootstrap seed。這會建立或更新系統啟動所需的最小基準資料，
包含 household、第一個 admin member 和 admin role；不會建立分類，也不會清空既有資料：

```sh
corepack pnpm db:seed
```

重設本機 dev DB。清空資料庫的是 `prisma migrate reset`；
`db:seed` 只會在重跑 migrations 後補上 bootstrap baseline：

```sh
corepack pnpm db:up
corepack pnpm exec prisma migrate reset
corepack pnpm db:seed
```

若要跳過 Prisma 的互動確認，可加上 `--force`：

```sh
corepack pnpm exec prisma migrate reset --force
corepack pnpm db:seed
```

若本機 Docker Postgres volume 也要整個重建，使用這個比較重的流程：

```sh
docker compose down -v
corepack pnpm db:up
corepack pnpm db:migrate
corepack pnpm db:seed
```

開啟 Prisma Studio：

```sh
corepack pnpm db:studio
```

目前專案狀態：

- 已有 `prisma/schema.prisma`。
- 已有 initial migration：`prisma/migrations/0001_init/migration.sql`。
- 已有 production-safe bootstrap seed SQL：`prisma/seed.sql`。
- `dev`、`build`、`test`、`lint`、`type-check` 都已經會先執行 Prisma client generation。

`prisma/seed.sql` 會建立或更新：

- 一個 household
- 第一個 active admin member，email 來自 `SEED_GOOGLE_ACCOUNT_EMAIL`
- admin role assignment

`prisma/seed.sql` 不應建立分類，也不應刪除 user、member、ledger、category、
invitation、reimbursement、recurring 或 Better Auth data。E2E fixture 資料由
`prisma/seed.e2e.sql` 負責，而且只在 E2E 專用 database 重建後載入。

在測試 Google OAuth 前，請先確認 `.env.local` 或 `.env` 的 `SEED_GOOGLE_ACCOUNT_EMAIL` 是你實際會登入的 Google email，然後重跑：

```sh
corepack pnpm db:seed
```

## 啟動 App

啟動 dev server：

```sh
corepack pnpm dev
```

開啟：

```text
http://localhost:3000
```

## 測試

執行 unit/integration tests：

```sh
corepack pnpm test
```

執行不依賴資料庫的 Playwright smoke tests：

```sh
corepack pnpm test:e2e
```

執行 DB-backed dashboard E2E。這會重建本機 Docker Postgres 內的
`home_fund_e2e` database、套用 migration、匯入 deterministic seed，並用
production-disabled controlled auth header 驗證 current-member mapping，
dashboard 資料會從 Prisma 讀取：

E2E 專用 DB/env 放在 `e2e/.env`，不要放進一般 `.env.local`。可從
`e2e/.env.example` 複製；Playwright server 會用 `E2E_DATABASE_URL`
連到 E2E DB，不會使用本機 app 的 `DATABASE_URL`。

```sh
docker compose up -d
corepack pnpm test:e2e
```

首頁會從 request headers 讀取 Better Auth session。未登入時，主要按鈕會 POST 到 `/auth/google`，並透過 Better Auth 開始 Google OAuth flow。

本機第一次測試建議順序：

```sh
cp .env.example .env
docker compose up -d
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

## 品質檢查

提交實作前建議跑：

```sh
corepack pnpm test
corepack pnpm type-check
corepack pnpm lint
corepack pnpm build
```

避免同時執行多個會呼叫 `prisma generate` 的指令，因為它們可能同時寫入 `src/generated/prisma` 而互相衝突。
