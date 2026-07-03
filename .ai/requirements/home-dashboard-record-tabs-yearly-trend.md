# Home Dashboard Record Tabs And Yearly Trend

- status: done
- date: 2026-06-27
- source: .ai/intent/home-dashboard-record-tabs-yearly-trend.md, .ai/verification/home-dashboard-record-tabs-yearly-trend.md

## 需求

首頁 `紀錄` 區塊要新增固定不跟著列表捲動的 tabs，並分成全部、支出、收入；`收支趨勢` 從當月資料改成當年資料。

## 執行方式

- 在首頁 record panel 加入 line tabs 與本地 tab state。
- `HomeDashboardData.records` 維持選定月份資料，`yearlyRecords` 提供選定年份資料。
- 新增 / 調整 dashboard data source tests 與 Playwright dashboard coverage。
- `prisma/seed.sh` 調整為支援 Prisma 7.8 的 `prisma db execute --stdin`。

## 最終結果

- tabs 預設顯示全部收支，並可切換支出紀錄與收入紀錄。
- tabs 位於 scrollable record list 上方，列表捲動時保持可見。
- `收支趨勢` 使用選定年度資料，月度 summary 與 record list 仍維持月度 scope。
- lint、type-check、data source unit test、dashboard E2E 通過。

## 特殊決策

- 不新增 URL state 或持久化使用者 tab 偏好。
- 不變更 domain rule、database schema 或 ledger 行為。
- 年度趨勢先使用 selected-year rows，MVP 先不做 aggregate query。

## Bug / 阻礙

- Recharts axis label 未在 E2E 中逐一斷言，避免測試過度脆弱。
- full selected-year rows 對目前 household-scale MVP 可接受，資料量成長後可能需要 aggregate query。
