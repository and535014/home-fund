# Fund Ledger Domain

## 核心概念

- Ledger record 是已確認的收入或支出財務事實。
- Income record 表示家庭資金收到錢。
- Expense record 表示家庭支出，payment source 可是 household fund 或 member-paid。
- Member-paid expense 會讓 expense 進入 reimbursement eligibility。
- CSV import 是批次建立 ledger records 的 command path，不是新的財務紀錄類型。

## Record Lifecycle

- Active ledger record 會進 monthly totals、category summaries、search results。
- Corrected ledger record 代表可編輯欄位被授權修正。
- Voided ledger record 應排除於 active views / totals / refundable calculation，但保留 audit trace。
- Hard delete 是否可用，需視 production audit policy 決定。

## Invariants

- 所有 record mutation 都要檢查 household scope 和 actor permission。
- General member 只能修改自己有權限的紀錄。
- Admin 可處理任何 household ledger record。
- Finance manager 可做財務修正，但 MVP 不預設可刪除他人紀錄。
- Imported ledger records 必須遵守和手動建立相同的 validation 與 permission rules。
- CSV upload / preview 本身不能產生財務效果；只有 confirm 後才會建立 records。

## 開放問題

- Batch delete / CSV import 是 all-or-nothing 還是 partial success。
- Production 是否需要完整 correction / void history。
- CSV duplicate policy、member / category matching ambiguity 如何處理。
