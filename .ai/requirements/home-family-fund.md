# Home Family Fund

- status: done
- date: 2026-06-07
- source: .ai/intent/home-family-fund.md, .ai/impact-analysis/home-family-fund-mvp-hardening.md

## 需求

建立一個給家庭共同資金使用的網頁系統，能管理每月收入、支出、週期性收支、分類、成員權限與代墊 reimbursement，讓家庭不用再靠試算表人工對帳。

## 執行方式

- 定義 admin、finance manager、general member 與 reimbursement payer 的角色邊界。
- MVP 聚焦單一 household、Google 登入、月度 ledger、分類、週期規則、reimbursement table 與 responsive web experience。
- 後續 hardening 從 fixture smoke 轉向 DB-backed browser flow、controlled auth/session、create-record、permission matrix、reimbursement 與 recurring confirmation。

## 最終結果

- 專案形成 Next.js / Prisma / PostgreSQL / Better Auth / Playwright / Vitest 的 MVP foundation。
- 後續多個功能 slice 都沿用此初始需求與角色規則擴充。
- local_dev 是初始 release target，production hosting、backup、monitoring 與外部整合後續另外處理。

## 特殊決策

- 所有功能頁都需要登入。
- Google identity 負責身份證明，但 app-owned membership 決定 household access。
- recurring item 分成 immediate posting 與 reminder-based posting。
- reimbursement 以 expense-level one-time settlement 為核心。

## Bug / 阻礙

- 初期未處理 bank sync、payment execution、tax export、multi-household、native app 與完整 audit/compliance。
- production deployment 與 OAuth smoke 在初始 MVP 之外。
