# Home Family Fund Domain

## 用途

這裡只保留長期 domain 知識：核心語言、bounded context、跨 context 規則、不能破壞的 invariants。新需求與驗收放在 GitHub Issues，交付理由與驗證證據放在 PR；舊需求摘要由 [PR #66 的來源紀錄](https://github.com/and535014/home-fund/pull/66#issuecomment-6624235586) 的固定 Git commit 追溯。

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
- `提醒入帳` 的 recurring occurrence 在確認前不能進 ledger totals、category totals 或 reimbursement totals；Search 與 dashboard 可將它投影為可辨識的 ledger-compatible display record，但不得讓它進入 ordinary batch mutation。
- 權限必須在 server / domain command 層重新驗證；UI visibility 只是提示。
- 歷史需求與交付證據由 Git／PR 保存，未完工作由 Issues 管理；release 細節由既有 runbooks 與實際 release evidence 保存，不放回 domain 檔。

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

以下保留未採納、未排程的討論背景，不代表已批准的實作；未來形成具體工作時才以 GitHub issue 定義範圍與授權。

- 未來是否要變更現行 batch 政策。現行 CSV 為每列 transaction／partial success；batch void 與 reimbursement 會回報 preflight skipped records，實際寫入組在 transaction 中完成，競爭衝突時 rollback。
- Production 等級 audit 是否需要更完整的 correction history / voiding policy。
