# GitHub Actions Release And Vercel / Neon Deployment

- status: done
- date: 2026-07-03

## 需求

建立可稽核的 GitHub Actions CI/CD 與 release 流程。PR 只跑 CI、不部署 preview；maintainer 以明確的 `vX.Y.Z` 準備 version PR，merge 後再從 `main` 建立 immutable tag，production 只部署已存在且與 package version、`main` commit 一致的 tag。Vercel 負責應用程式部署，Neon PostgreSQL 負責 production database。

## 執行方式

- PR CI 使用 placeholder environment，執行 Prisma validate、type-check、lint、unit tests 與 production build，不接觸 production secrets。
- `release-version.yml` 驗證輸入的 `vX.Y.Z` 高於目前版本，只更新 `package.json`，建立 release branch 與 PR；缺少 `RELEASE_BOT_TOKEN` 時明確失敗。
- `create-release-tag.yml` 從 `main` 的 `package.json.version` 建立 immutable annotated tag，不接受另一份人工 version input。
- `deploy-production.yml` 先在 production approval 之前驗證 tag 格式、package version 與 `origin/main` containment，再以 GitHub Environment `production` 保護 migration 與 deploy job。
- Vercel CLI 固定為 project devDependency，deployment 使用 lockfile 內的版本。
- production artifact build 成功後才執行 Prisma migration，接著部署 prebuilt artifact。
- 自動 smoke 驗證公開頁面與 cron invalid-token `401`；正確 secret 的 cron smoke 保留人工執行，避免意外建立 recurring ledger records。
- `docs/deployment.md` 保存完整設定與故障排除，`docs/release-runbook.md` 保存日常 release checklist。

## 最終結果

- release PR preparation、tag creation 與 production deploy 各自有獨立 workflow 與權限邊界。
- production deploy 維持 tag-based，並拒絕 package version 不符或不在 `main` 上的 tag。
- workflow YAML parse、dependency install、Prisma validate、type-check、lint、unit tests 與 production build 在實作時通過。
- routine release evidence 留在 release PR、GitHub Actions run 與 Vercel deployment，不另外建立 deployment artifact。

## 特殊決策

- GitHub Actions 是唯一 CI/CD control plane，PR 不跑 hosted preview deployment。
- version bump 必須經過 PR；production deploy 不修改 version，也不建立 tag。
- production tag 不可移動或覆寫；失敗後以新的 patch version 修正。
- `patch` 用於 bug fix、文件與非破壞性維運調整；`minor` 用於使用者可見功能或有意義的 schema／workflow capability；`major` 留待正式宣告穩定 `1.0.0` contract。
- production secrets 只提供給 approval 後的 deploy job，不提供給 release、tag 或 preflight jobs。

## Bug / 阻礙

- 完整 workflow 行為只能在 merge 後透過 GitHub Actions 驗證，包括 release PR 建立、tag push、production approval、Vercel deploy 與 smoke checks。
- live production 仍依賴 GitHub Environment、Vercel project、Neon database、Google OAuth callback 與正確 secrets 設定。
