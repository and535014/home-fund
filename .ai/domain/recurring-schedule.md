# Recurring Schedule Domain

## 核心概念

- Recurring event 是每月預期收入或支出的定義。
- Recurring occurrence 是某 event 在某 target year / month 的 expected item。
- Recurring posting system actor 是受限的系統執行身分，只能依既有 recurring event 處理指定 occurrence。
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
- Recurring posting system actor 不能任意建立 ledger record；它只能依 recurring event 的既有定義建立該 occurrence 對應的財務事實。
- Ledger record、occurrence 入帳狀態與 recurring source trace 必須在同一個 transaction 原子完成。
- Recurring posting 的執行者是 system actor；ledger record 的收入來源或代墊歸屬仍由 recurring event 決定，`createdByMemberId` 則保留 recurring event 的原建立者作為稽核來源。
- Recurring event 建立者後來停用或失去相關能力，不應單獨阻止 system actor 處理仍有效的 recurring event；後續人工 mutation 仍依當下 actor 權限重新授權。
- Recurring event 使用的 category 若在入帳前已封存，system actor 不得建立 ledger record；occurrence 必須保留 `blocked` 狀態與原因，不得靜默略過或標記為已入帳。
- Blocked occurrence 不得自動改用其他 category。舊 occurrence 保留稽核狀態；未來月份依 MVP 的 delete-and-recreate 規則由修正後的新 recurring event 處理。
- Recurring event 的收入來源或代墊成員若在入帳前已 disabled，system actor 不得建立 ledger record；occurrence 必須保留 `blocked` 狀態與原因。
- `blocked` 是需要使用者處理的 domain 狀態；資料庫 timeout、暫時性連線問題等 Implementation failure 不得把 occurrence 改為 `blocked` 或其他完成狀態，應留下 operational failure evidence 並允許安全重試。
- Pending occurrence 不影響 ledger totals、category totals 或 reimbursement totals。
- Search 與 dashboard 可為共用呈現及篩選，將 pending occurrence 投影為 ledger-compatible display record；該投影不是財務事實，必須保留可辨識的 recurring occurrence identity，且不得進入 ordinary batch delete、ledger totals 或 reimbursement selection。
- Confirmed occurrence 會建立普通 ledger record，並保留 recurring trace。
- Member-paid recurring expense 只有在變成 ledger record 後才 reimbursement-eligible。
- Rule changes 在 MVP 以 delete-and-recreate 表達，不原地編輯 event definition。

## 開放問題

- Missed occurrences 是否要補登。
- Deleting event 是否取消 pending unposted occurrences。
- General member 是否能確認只影響自己的 pending item。
- Production scheduled posting 失敗時的 retry / alert policy。
