# Recurring Income Expense Records

- status: done
- date: 2026-06-30
- source: .ai/intent/recurring-income-expense-records.md, .ai/implementation/recurring-income-expense-records.md, .ai/verification/recurring-income-expense-records.md

## 需求

新增週期性收入與支出，支援 `馬上入帳` 與 `提醒入帳`。固定月租、生活費或網路費等可設定一次，之後由系統建立當月 occurrence；提醒入帳需使用者確認後才影響 ledger。

## 執行方式

- 新增 recurring event domain、authorization、access hints、settings route 與 recurring form / server actions。
- 支援 fixed day 1-28 與 explicit month-end schedule。
- `馬上入帳` 可在 create time 或 cron 時建立普通 ledger record；`提醒入帳` 先以 pending occurrence 呈現。
- 新增 Prisma schema / migration、protected cron route、Vercel schedule 與 deployment docs。

## 最終結果

- Admin 與 finance manager 可管理週期事件，general member 被阻擋。
- Home / Search 顯示 pending recurring items，且不計入 ledger / report totals，也不可 batch-select。
- Confirm pending occurrence 後會建立正確 ledger record，並保留 recurring trace。
- 驗證通過 `db:validate`、lint、type-check、unit tests、build 與 `e2e/recurring-events.spec.ts`。

## 特殊決策

- UI-facing domain language 使用 `週期事件`，Prisma table name 保持 `RecurringRule` / `RecurringOccurrence`。
- fixed-day 限制 1-28，月底使用 explicit schedule anchor。
- production immediate posting 需要 protected cron，不只依賴使用者開頁觸發。

## Bug / 阻礙

- broad multi-month search backfill 明確不在 MVP 範圍。
- production release 仍需 migration deployment、cron secret、Vercel cron authorization、cron dry run、runtime logs、rollback 與 smoke testing。
