# GitHub Actions Vercel / Neon Deployment

- status: done
- date: 2026-06-26
- source: .ai/intent/github-actions-vercel-neon-deployment.md, .ai/verification/github-actions-vercel-neon-deployment.md

## 需求

建立可稽核的 GitHub Actions CI/CD 流程，讓 PR 只跑 CI、不部署 preview；production 透過 immutable semver tag 或手動輸入 `vX.X.X` tag 部署到 Vercel，資料庫使用 Neon PostgreSQL。

## 執行方式

- 設計 PR CI、production tag deployment 與 manual workflow_dispatch。
- production deploy workflow 使用 GitHub Environment `production`，並在 deploy 前跑 Prisma migration。
- 文件補上 GitHub secrets、Vercel、Neon、Google OAuth callback、migration、rollback 與 smoke checks。
- PR workflow 使用 placeholder CI env，避免 PR 接觸 production secrets。

## 最終結果

- workflow YAML static review 通過。
- `db:validate`、type-check、lint、unit tests、production build 通過。
- repository merge 與 service configuration 已具備條件，但 live production execution 仍需外部服務設定與 smoke。

## 特殊決策

- GitHub Actions 是唯一 CI/CD control plane。
- PR 不跑 hosted preview deployment。
- production 部署走 tag，manual deploy 只能部署既有 immutable tag。
- preview environment 在 MVP 明確跳過。

## Bug / 阻礙

- live deployment 不能在 local workspace 完整驗證。
- production execution 仍被 GitHub Environment、Vercel project、Neon database、Google OAuth callback 與 secrets 設定阻擋。
