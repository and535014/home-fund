# Local Google OAuth Login

- status: draft
- date: 2026-06-19
- source: .ai/intent/local-google-oauth-login.md, .ai/spec/local-google-oauth-login.md

## 需求

讓 local development 能用真實 Google OAuth 登入，而不只依賴 controlled E2E auth。目標是驗證 Better Auth Google sign-in、callback、session 與 seeded member mapping 可以在本機實際運作。

## 執行方式

- 定義 local OAuth 設定需求：`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、Google callback URI、`SEED_GOOGLE_ACCOUNT_EMAIL`。
- 保留 controlled E2E auth 作為非 production 自動化測試手段。
- 定義手動 smoke plan，記錄 env alignment、migration / seed state、callback result 與 dashboard result。

## 最終結果

- 產出 intent 與 behavior spec。
- AC 覆蓋 sign-in gate、Google redirect、callback session、seed email mapping、unlinked account blocked、inactive member blocked、placeholder credential diagnostics 與 secret 不落地。
- 沒有找到完整 implementation / verification artifact，應視為未完整交付或待後續確認的 local_dev enablement。

## 特殊決策

- 真實 Google OAuth smoke 很難可靠自動化，因此 manual smoke 與 controlled E2E auth 分開看待。
- placeholder credentials 不能被視為成功 OAuth 設定。

## Bug / 阻礙

- 需要真實 Google Cloud OAuth 設定與本機 `.env`。
- Google secret、Better Auth secret、session token、OAuth code / access token / refresh token 不得寫入 repo 或 `.ai` artifact。
