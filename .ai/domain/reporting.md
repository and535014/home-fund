# Reporting Domain

## 核心概念

- Reporting 是 read model，不是財務真相來源。
- Monthly report 從 Ledger、Categorization、Recurring Schedule、Reimbursement 讀取資料。
- Record query 是查詢 / 篩選條件，不授權 mutation。
- Search result selection 是暫時 UI state，server command 必須重新驗證 selected IDs。
- `退款紀錄` tab 顯示 reimbursement payment evidence，和 `收支紀錄` 分開。

## Read Models

- Dashboard：月度 records、summary、category totals、yearly trend、pending recurring items。
- Search：ordinary ledger records、pending recurring occurrences 與 refund records 使用明確區分的 result kind；pending occurrence 不是財務事實。
- Reimbursement payment detail：退款紀錄、linked ledger records、可編輯欄位、version 與稽核資訊；不直接借用 Search result read model。
- Refund page / reimbursement workspace：unpaid member-paid expenses、completed refund records、member scope summary。
- Category summary：使用 category visual identity。

## Invariants

- Reporting 不能改變 ledger / reimbursement state。
- Refund records 不可被 ordinary batch delete / refund actions 選取。
- Pending recurring occurrence 不可被 ordinary batch delete / reimbursement actions 選取，也不得計入任何 financial totals。
- Archived categories 可在歷史 records 顯示，但不一定能作為 active filter。
- Selection 不授權；所有 batch commands 都要 server-side revalidate。
- Pending recurring items 可顯示，但不能算進 financial totals。

## 開放問題

- Reimbursement status filter 遇到 income / fund-paid expenses 時如何呈現。
- Mobile report summaries 的 MVP 優先順序。
- 年度趨勢未來是否需要 aggregate query。
