# Recurring Schedule Domain

## 核心概念

- Recurring event 是每月預期收入或支出的定義。
- Recurring occurrence 是某 event 在某 target year / month 的 expected item。
- `馬上入帳`：occurrence 可直接建立 ledger record。
- `提醒入帳`：occurrence 先 pending，確認後才建立 ledger record。
- MVP schedule 支援 fixed day 1-28 與 explicit `每月底`。

## Lifecycle

1. Recurring event created。
2. Occurrence generated for target month。
3. Immediate occurrence posted, or reminder occurrence stays pending。
4. Pending occurrence confirmed。
5. Recurring event deleted；future occurrences stop，已 posted ledger records 不回寫。

## Invariants

- Occurrence identity 是 recurring event + target year / month，不能重複入帳。
- Pending occurrence 不影響 ledger totals、category totals、reimbursement totals 或 ordinary search results。
- Confirmed occurrence 會建立普通 ledger record，並保留 recurring trace。
- Member-paid recurring expense 只有在變成 ledger record 後才 reimbursement-eligible。
- Rule changes 在 MVP 以 delete-and-recreate 表達，不原地編輯 event definition。

## 開放問題

- Missed occurrences 是否要補登。
- Deleting event 是否取消 pending unposted occurrences。
- General member 是否能確認只影響自己的 pending item。
- Production scheduled posting 失敗時的 retry / alert policy。
