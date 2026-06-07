# Home Family Fund

家庭共用金管理工具。主要語言為繁體中文，介面以 dark theme 為主。

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

本機 seed 會用這個 email 建立一個 active member，讓 Google 登入後可以對應到家庭成員。

請填入你實際會拿來登入的 Google email：

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

匯入開發 seed data：

```sh
corepack pnpm db:seed
```

開啟 Prisma Studio：

```sh
corepack pnpm db:studio
```

目前專案狀態：

- 已有 `prisma/schema.prisma`。
- 已有 initial migration：`prisma/migrations/0001_init/migration.sql`。
- 已有開發用 seed SQL：`prisma/seed.sql`。
- `dev`、`build`、`test`、`lint`、`type-check` 都已經會先執行 Prisma client generation。

`prisma/seed.sql` 會建立：

- 一個 household
- 三個 active members
- member role assignments
- categories
- sample ledger records

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
