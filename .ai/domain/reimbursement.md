# Reimbursement Domain

## 核心概念

- Member-paid expense 是由 member 先代墊的支出。
- Refundable expense 是尚未 reimbursement 的 member-paid expense。
- Reimbursed expense 是已完成 reimbursement 結算的 member-paid expense；現行結算會建立 payment evidence，早期資料可能只有結算狀態。
- Reimbursement payment evidence / `退款紀錄` 是真實世界付款的記錄，不執行銀行轉帳，也不是普通 ledger record。
- Payment source for reimbursement 在 MVP 固定為 household fund。
- Payment method 目前限制為 bank transfer、cash、other。

## Settlement Lifecycle

1. Member-paid expense recorded。
2. Expense becomes refundable。
3. Authorized actor selects one or more eligible expenses。
4. Payment evidence recorded。
5. Expenses become reimbursed。
6. Refund record correction may update payment date、method、note only。

## Invariants

- 只有 authorized finance actor 可執行 reimbursement。
- 同一 member-paid expense 不能 reimbursement 兩次。
- Reimbursement payment amount 必須對應 reimbursed expenses total。
- `退款紀錄` 不能影響 ordinary income / expense totals。
- Refund record correction 不能改 amount、paid-to member、paid-from source、batch、linked ledger records 或 reimbursed state。
- 每一 reimbursement batch 只對應一個 paid-to member；收款成員、金額與 household-fund payment source 由符合資格的支出衍生，不信任 client 傳入的付款歸屬或總額。
- Batch、payment evidence 與 ledger reimbursement transition 在同一 transaction 完成，競爭衝突時全部 rollback。
- 既有已退款支出可能沒有 payment evidence；不得為了 readback 虛構退款紀錄。
- Payment correction 只更正證據，不是 reversal／void／delete；空白備註正規化為 `null`。

## 開放問題

以下保留未採納、未排程的討論背景，不代表已批准的實作；未來形成具體工作時才以 GitHub issue 定義範圍與授權。

- 未來是否變更 batch reimbursement 政策：現行 preflight 可回報 skipped records，通過的寫入組與 payment evidence 在同一 transaction 完成，競爭衝突會 rollback。
- Refund record correction 是否需要完整 history rows。
- Partial reimbursement、split payment、reversal 何時納入。
- Payment reconciliation import 是否需要獨立流程。
