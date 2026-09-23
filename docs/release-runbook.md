# Release Runbook

這份 runbook 用於既有 production 環境的例行發版。首次設定、secrets、OAuth、
bootstrap seed 見 [部署指南](deployment.md)；備份與復原細節見
[Database Backup and Recovery Runbook](database-backup-and-recovery.md)。

## 發版原則

- Git tag 是 production version 的唯一 authoritative source。
- `package.json.version` 不參與 release gate，不需要版本 PR 或 `RELEASE_BOT_TOKEN`。
- 建立 tag 與部署是兩次獨立的手動動作；tag push 不會觸發部署。
- 目前 private repository 方案沒有 environment required reviewers。
  手動啟動 `Deploy Production` 就是部署授權，不會再等待核准。
- 已 push 的 `vX.Y.Z` tag 不得移動、重打或重用，即使該次部署失敗。
- App rollback 只透過 GitHub Actions 重新部署既有 tag，不使用 Vercel rollback；
  app rollback 不會還原 database。

## 發版前檢查

1. 確認功能、修正與 migration 已 merge 到 `main`，最新 commit 的 CI 綠燈。
2. 決定版本：小型修正用 patch、新功能用 minor，穩定契約或不相容變更才考慮 major。
   格式必須為 `vX.Y.Z`，不得有前導零、prerelease 或 build suffix。
3. 以最後一次成功 production deploy 的 tag／commit 為基準，檢查目標變更中的
   `prisma/migrations/` 與 schema。不要把「最高版本 tag」當作「已部署版本」。
4. 記錄 migration 判定、比較的兩個 commit 與結果。有 migration 時必須完成下方
   backup gate；destructive migration 另需明確的資料損失審查與 recovery 計畫。
5. 確認目前 production schema 與候選 app 相容；重新部署舊 tag 時也要檢查。

## 建立 Production Tag

1. 在 GitHub Actions 選擇 `Create Release Tag`，使用 `main` 的 workflow。
2. 輸入目標 `version`，例如 `v0.1.10`。
3. Workflow checkout 最新 `main`，驗證 tag 尚不存在且大於所有現有嚴格 semver
   release tags，再執行 install、Prisma validate、type-check、lint、unit tests 與 build。
4. 建立前重新 fetch `main` 與 tags；若 `main` 已前進或版本已被使用，停止且不建立 tag。
   重新執行 workflow，讓新 commit 通過完整 preflight。
5. 成功後記錄 annotated tag、commit SHA 與建立 tag 的 Actions run URL。

Tag creation 的成功只代表候選版本固定，接下來仍需 backup gate 與獨立 deploy dispatch。
不依賴 `GITHUB_TOKEN` push tag 觸發另一支 workflow。

## Database Backup Gate

對已固定的目標 tag 完成 migration 判定，將結果記錄在功能 PR 或 release tracking
issue 的 comment，保留可引用的 GitHub URL。

若沒有 migration，明確記錄「無 migration」、比較基準與目標 commit；部署時選
`no-migration`。若有 migration：

1. 安排維護時段，通知家庭成員暫停寫入，避開台灣時間 00:15 recurring posting cron。
2. 手動執行 `Backup Production DB`，輸入同一個目標 tag。此時尚未啟動 deploy。
3. 確認 backup preflight 的 tag／main ancestry 通過；backup job 使用驗證過的 SHA，
   並再次確認 tag 未移動。
4. 確認 backup、restore rehearsal、核心 table counts／指定 `updatedAt` high-water
   timestamps comparison、GPG encryption 全部成功。
5. 下載 encrypted artifact、驗證 SHA-256，將 `.dump.gpg`、`.sha256`、
   `.metadata.json` 存入私人雲端。GitHub artifact 只有 3 天期限。
6. 在 evidence comment 記錄 backup ID、backup run URL、目標 tag、source commit、
   restore rehearsal、encrypted SHA-256、restore comparison SHA-256、外部保存已完成
   與操作者。不得記錄私人雲端位置、connection string 或 key material。
7. 部署時選 `backup-complete`，提供上述 evidence comment URL。

任一步驟失敗、artifact 尚未保存或 evidence 未補齊，都不得啟動 production deploy。

## Production Deploy

1. 在 GitHub Actions 選擇 `Deploy Production`，使用 `main` 的 workflow。
2. 輸入既有 `version` tag、`migration_status`（`no-migration` 或 `backup-complete`）
   與 `release_evidence`（上述 GitHub evidence URL）。
3. 再次確認 tag、migration 判定與 evidence 對應相同 commit，才按 `Run workflow`。
   這是授權 production 變更的動作。
4. Workflow 驗證輸入與 main ancestry，checkout immutable tag，執行 install、Prisma
   validate、type-check、lint、unit tests、production build。
5. Production job checkout preflight 固定的 commit SHA，重新確認遠端 tag 未移動，
   才依序執行 Vercel artifact build、`corepack pnpm db:deploy`、Vercel deploy 與 smoke。

`migration_status` 和 evidence 是操作者的可稽核聲明；workflow 驗證必填輸入，
不會自動判讀 evidence comment 或證明私人雲端保存完成。操作者必須實際完成 gate。

Automated smoke 包含 `/login`、`/favicon.ico` 與 cron invalid-token `401`。

## 發版後檢查與 Evidence

確認 Google 登入、admin dashboard、non-admin 權限限制、logout、記帳列表與 Vercel
runtime logs。正確 cron secret 的 smoke 可能觸發入帳，僅在本次授權範圍內手動執行。

功能 PR／release tracking issue 至少保留：

- tag、commit、tag creation run、deploy run URL 與操作者。
- migration 判定與比較基準；若有 migration，完整 backup／restore evidence。
- Vercel deployment URL／production alias、migration 執行結果。
- automated smoke 與手動 smoke 結果。
- rollback path、未解風險與 owner。

不新增 `.ai/deployment/production-vX.Y.Z-YYYY-MM-DD.md`，也不需要額外的版本 PR。

## 失敗與 Rollback

- Tag creation preflight 失敗不應消耗版號；修正後重新執行。
- 已建立 tag 的 preflight 或 deploy 失敗：暫時性錯誤可重試同一 tag；需要 code、
  migration 或設定假設修正時，建立下一個版本，絕不移動原 tag。
- Tag 移動、消失或不屬於 `main` 時停止，不得繞過驗證。
- Migration 已套用而 app deploy 失敗：先判斷目前 schema 是否向後相容，再決定
  重新部署已驗證舊 tag 或用新版本 forward fix。使用同樣的手動部署授權與 evidence。
- Schema／資料損壞才由人工決定進入 [Database Recovery](database-backup-and-recovery.md#database-recovery)。
  不自動還原，不直接覆寫事故 DB，不把 Vercel rollback 當作 database rollback。

## 完成條件

Deploy workflow 成功、必要 backup 已保存、post-deploy smoke 完成，且 evidence 完整，
才代表一次 production release 完成。

## 非 Production Rehearsal

修改 release workflow 後執行：

```sh
actionlint .github/workflows/*.yml
node --test scripts/release-workflow.test.mjs
```

CI 也會執行此 rehearsal。它解析實際 workflow YAML、job dependencies、checkout refs、
環境變數、shell steps 與 outputs，使用隔離的本機 bare Git remote，實際建立 annotated
tag，驗證 backup preflight，再獨立模擬手動 deploy dispatch。涵蓋無 migration 與
backup-complete 兩條路徑，以及 preflight 失敗、main 前進、版本衝突、tag 被移動、
migration 失敗與 smoke 失敗的停止行為。暫存 fixtures 保留於系統 temporary directory。

這是 workflow shell 的動態 dry-run，不只是 YAML 靜態檢查。Git 和 release validator
實際執行；`corepack`（品質檢查、migration、Vercel）、HTTP 與 setup-node 使用測試替身。
Backup internals、GPG、restore rehearsal 與外部保存不在此 dry-run 執行，
`backup-complete` 使用合成 evidence；它不能取代真正 release 的 backup gate。
一般 Quality Gate 另外實際執行。此結果不代表 GitHub hosted runner、production secrets、
Neon 或 Vercel 已驗證；實際 release 仍須保留平台 run evidence。
