# Edit Reimbursement Payment Records

- status: done
- date: 2026-06-27
- source: .ai/intent/edit-reimbursement-payment-records.md, .ai/implementation/edit-reimbursement-payment-records.md, .ai/verification/edit-reimbursement-payment-records.md

## 需求

讓使用者可以更正既有 `退款紀錄` 的付款日期、付款方式與備註。這是修正退款證據的資料輸入錯誤，不是把退款紀錄變成一般收支紀錄，也不是反轉或重開已完成的 reimbursement。

## 執行方式

- 新增 reimbursement payment correction validation，只允許更新 payment date、payment method、note。
- 新增 `edit_reimbursement_payment` 權限與 household-scoped server action。
- 新增 `editedAt` 與 `editedByMemberId` metadata。
- 在退款紀錄 detail / search readback 中接上編輯 dialog，使用既有 `ActionState`、`useActionStateEffect` 與 `FormSubmitButton` pattern。

## 最終結果

- Admin 與 finance manager 可以編輯退款紀錄證據欄位，general member 會被拒絕。
- 成功編輯後，退款紀錄 detail 與 search readback 會反映更新。
- linked reimbursement batch、ledger records、refund amount、paid-to member、paid-from source 與 reimbursed 狀態不會被改動。
- 驗證通過 `db:validate`、lint、type-check、unit tests、build、local db deploy，並通過 focused reimbursement payment Playwright coverage。

## 特殊決策

- 編輯是「更正退款證據」，不是 reversal / void / delete。
- 空備註 normalize 成 `null`。
- Cross-household payment id 回傳 `not_found`，避免洩漏資料存在性。

## Bug / 阻礙

- full E2E 首次執行時遇到 Postgres connection termination，後續 focused reimbursement payment E2E 通過。
- production release 仍需 migration、OAuth、monitoring、rollback、smoke checks 等 release readiness。
