# Reimbursement Domain

## 核心概念

- Member-paid expense 是由 member 先代墊的支出。
- Refundable expense 是尚未 reimbursement 的 member-paid expense。
- Reimbursed expense 是已記錄 reimbursement payment evidence 的 member-paid expense。
- Reimbursement payment evidence / `退款紀錄` 是付款證據，不是普通 ledger record。
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
- Batch reimbursement 初始政策應避免跨 paid-to member，否則一筆 payment evidence 會語意不清。

## 開放問題

- Batch reimbursement 是 all-or-nothing 還是 partial success。
- Refund record correction 是否需要 edited-by / edited-at / history rows。
- Partial reimbursement、split payment、reversal 何時納入。
- Payment reconciliation import 是否需要獨立流程。
