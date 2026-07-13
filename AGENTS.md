# Repository Agent Notes

## 專案定位

Home Family Fund 是家庭共用金管理工具，主要介面語言為繁體中文。

技術棧與本機開發方式以 `README.md` 為準；部署、migration、rollback 與 production smoke 流程以 `docs/deployment.md` 為準。不要在此文件複製那些操作步驟。

## 修改原則

- 修改前先閱讀相關程式碼、測試與領域文件，不要只根據檔名推測行為。
- 保持變更範圍聚焦；不要順便重構、重新命名或移動不相關檔案。
- 工作樹若有既存變更，視為使用者所有；不要覆蓋、還原或混入目前任務。

## 架構邊界

- `src/app/` 是 Next.js App Router 與畫面組合層，負責 route、server action、UI orchestration 與 framework adapter。
- 長期業務規則、commands、queries 與 read models 放在對應的 `src/modules/<bounded-context>/`。
- `src/modules/` 與 `src/auth/` 不得依賴 `src/app/` 的 route-local helper。
- 只被單一路由使用的 UI、action 或 helper，放在該 route 的 `_components`、`_actions` 或 `_lib`。
- 多個路由共用的 app-layer 功能，可以放在 `src/app/_*` 私有共享目錄；真正的業務邏輯仍應下沉至 `src/modules/`。
- 優先延續現有 bounded contexts：Identity and Access、Fund Ledger、Categorization、Recurring Schedule、Reimbursement、Reporting。
- 不要手動修改 `src/generated/prisma/`；它由 Prisma generate 產生。

## 領域與權限

- `.ai/domain/` 保存目前仍有效的長期領域語言、規則與 invariants。
- 涉及角色、權限、款項流動、狀態轉換或跨 bounded context 行為時，先閱讀並同步更新相關領域文件。
- `.ai/requirements/` 保存已完成或曾規劃需求的歷史摘要；它可以提供背景，但現行行為仍以程式碼、測試與 `.ai/domain/` 為準。
- mutation 必須在 server boundary 重新驗證登入狀態、household scope、角色／capability 與目標資料狀態；不要信任 client 傳入的 IDs 或 UI state。
- Reporting 與 search 是 read models，不得成為財務事實或 mutation 授權來源。
- Ledger、reimbursement 與 recurring posting 的狀態更新若需一致完成，應維持 transaction 邊界。

## 資料庫與環境安全

- Prisma schema 變更必須附 migration；不要只修改 `schema.prisma`。
- 不得對 production 執行 `prisma migrate reset`、清空資料、重建資料庫或 destructive seed。
- `db:seed` 只負責 production-safe bootstrap baseline；E2E fixtures 使用獨立的 E2E database 與 seed。
- 不提交 `.env`、OAuth credentials、database URLs、tokens 或其他 secrets。
- 不把本機測試結果描述成 production 驗證；production 狀態必須有 `main`、release tag 與 deployment evidence。

## 驗證

依變更風險執行最相關的檢查：

- 純 domain／utility 變更：相關 Vitest tests。
- TypeScript 或跨模組變更：相關 tests 加上 `corepack pnpm type-check`。
- UI 或 route flow 變更：相關 component tests；涉及主要使用流程時補跑對應 Playwright spec。
- Prisma 變更：`corepack pnpm db:validate`、相關 tests，並確認 migration。
- 交付前的完整檢查依 `README.md` 執行。

不要平行執行多個會呼叫 `prisma generate` 的命令，避免同時寫入 `src/generated/prisma/`。

## 文件同步

- 開發與環境設定改變時更新 `README.md`。
- CI/CD、production、migration、seed、rollback 或 smoke 流程改變時更新 `docs/deployment.md`。
- 長期領域語言或 invariant 改變時更新 `.ai/domain/`。
