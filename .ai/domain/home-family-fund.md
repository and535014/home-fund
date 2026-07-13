# Home Family Fund Domain

## 用途

這裡只保留長期 domain 知識：核心語言、bounded context、跨 context 規則、不能破壞的 invariants。歷史需求、交付紀錄、驗證證據與一次性決策放在 `.ai/requirements/`。

## Bounded Contexts

| Context | 檔案 | 負責內容 |
|---|---|---|
| Identity and Access | `.ai/domain/identity-access.md` | member、role、Google binding、app-owned membership、authorization |
| Fund Ledger | `.ai/domain/fund-ledger.md` | income / expense、ledger record、payment source、record correction、CSV import |
| Categorization | `.ai/domain/categorization.md` | category lifecycle、archive / unarchive、visual identity、sort order |
| Recurring Schedule | `.ai/domain/recurring-schedule.md` | recurring event、occurrence、immediate posting、reminder confirmation |
| Reimbursement | `.ai/domain/reimbursement.md` | member-paid expense、refund / reimbursement、payment evidence、refund record correction |
| Reporting | `.ai/domain/reporting.md` | dashboard、search、refund record read model、monthly read models |

## 跨 Context 核心規則

- Google identity 只證明使用者身份；app-owned `Member` 才決定 household access、角色、顯示名稱與財務歸屬。
- Ledger records 是財務事實來源；Reporting 只能讀取與投影，不擁有財務真相。
- `退款紀錄` / reimbursement payment evidence 不是一般 income / expense ledger record，不能影響 ordinary income / expense totals。
- `提醒入帳` 的 recurring occurrence 在確認前不能進 ledger totals、category totals、reimbursement totals 或 ordinary search results。
- 權限必須在 server / domain command 層重新驗證；UI visibility 只是提示。
- 歷史紀錄、已完成需求、驗證與 release 細節應保存在 `.ai/requirements/`，不要塞回 domain 檔。

## 重要詞彙

| Term | 說明 |
|---|---|
| Household fund | 家庭共同資金池。 |
| Member | App-owned household participant，可做財務歸屬；不等於 Google account。 |
| Admin | 可管理 member、權限、分類，並可處理任何 ledger record。 |
| Finance manager | 可處理財務操作與 reimbursement，但 MVP 不預設可刪除他人紀錄。 |
| General member | 可看所有 household records，通常只能建立 / 修改自己相關資料。 |
| Ledger record | 已確認的收入或支出財務事實。 |
| Reimbursement payment evidence / 退款紀錄 | 真實世界退款已付款的證據，不是普通收支。 |
| Recurring event | 每月預期收入或支出的定義。 |
| Pending recurring item | 尚未確認入帳的週期項目，不影響財務 totals。 |

## 開放問題

- 是否允許一個 member 同時具備 admin 和 finance manager 角色。
- Disabled member 是否仍可作為新財務紀錄的歸屬對象，或只保留歷史可讀。
- Batch action 是 all-or-nothing，還是允許 partial success。
- Production 等級 audit 是否需要更完整的 correction history / voiding policy。
