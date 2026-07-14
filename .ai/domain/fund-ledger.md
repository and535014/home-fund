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
- 尚未退款且原本可編輯的 active ledger record，可在 correction 時雙向切換 income / expense；切換後必須重新設定目標類型的分類與專屬欄位。
- 類型切換保留 name、amount、occurred date、note 等共用資料，並清除原類型的 category 與專屬欄位；使用者必須重新設定目標類型的 category 與專屬欄位。
- 由 recurring occurrence 產生的 ledger record 切換類型時，只修正該筆財務事實並保留來源追溯；不連動修改 recurring rule 或未來 occurrences。
- 由 CSV import 產生的 ledger record 切換類型時，保留 import batch / row 來源追溯；不回寫原始 CSV，也不重算既有匯入結果。
- 類型切換會依目標類型與付款來源重新決定 reimbursement eligibility：income 不具退款資格；fund-paid expense 不可退款；member-paid expense 成為 refundable。已退款支出維持不可修正。
- 編輯表單切換類型不需二次確認；介面應立即清除不相容欄位並提示重新設定，直到使用者儲存成功才改變 ledger state，取消則不產生任何變更。
- Voided ledger record 應排除於 active views / totals / refundable calculation，但保留 audit trace。
- Hard delete 是否可用，需視 production audit policy 決定。

## Invariants

- 所有 record mutation 都要檢查 household scope 和 actor permission。
- Correction、void 與 reimbursement 等互斥狀態轉換必須使用讀取版本做 conditional write；過期 mutation 應整筆失敗，batch 的部分版本衝突必須 rollback，且 reimbursement evidence 只能在所有目標 records 原子轉態成功後建立。
- General member 只能修改自己有權限的紀錄。
- Admin 可處理任何 household ledger record。
- Finance manager 可做財務修正，但 MVP 不預設可刪除他人紀錄。
- Imported ledger records 必須遵守和手動建立相同的 validation 與 permission rules。
- CSV upload / preview 本身不能產生財務效果；只有 confirm 後才會建立 records。

## 開放問題

- Batch delete / CSV import 是 all-or-nothing 還是 partial success。
- Production 是否需要完整 correction / void history。
- CSV duplicate policy、member / category matching ambiguity 如何處理。
