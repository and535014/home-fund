# 編輯收支記錄類型

- status: proposed
- date: 2026-07-13

## 需求

讓原本有權編輯單筆收支記錄的使用者，可以在既有編輯流程中將收入改為支出，或將支出改為收入，同時維持帳務欄位、退款資格與來源追溯的一致性。

## 已確認規則

- 所有原本可編輯、狀態為 active 且尚未退款的 ledger record，都可雙向切換 income / expense。
- 類型切換沿用既有編輯權限；不新增批次修改類型，也不開放已退款支出的編輯。
- 首頁記錄明細與搜尋結果明細共用相同行為。
- 保留名稱、金額、日期與備註；清除原類型的分類與專屬欄位。
- 改為收入時，必須重新選擇收入分類與收支對象。
- 改為支出時，必須重新選擇支出分類與付款來源；若為成員代墊，還必須選擇付款成員。
- 切換時不顯示第二層確認視窗；表單立即清除不相容欄位並提示使用者重新設定。只有儲存成功才改變 ledger state，取消編輯不產生變更。
- 退款資格依儲存後的類型與付款來源重算：收入不具退款資格、家庭基金付款的支出不可退款、成員代墊支出成為待退款。
- 週期事件產生的記錄保留 recurring occurrence 來源關聯，但單筆修正不連動 recurring rule 或未來月份。
- CSV 匯入產生的記錄保留 import batch / row 來源關聯，但不回寫原始 CSV，也不重算匯入結果。
- 本需求不新增逐次 correction history；沿用現有最新狀態與 updatedAt 政策。完整帳務稽核歷史另案設計。

## 設計方案

採用「小範圍共用抽取」：新增與編輯流程共用 record entry kind 定義及「成員支出／收入／基金支出」切換器，但各自管理完整表單。這能維持操作與語意一致，又不會把包含週期事件的新增流程，與包含既有值、更新權限及錯誤狀態的編輯流程合併成過度複雜的抽象。

不採用以下方案：

- 不建立完整共用 form controller，避免讓新增與編輯的不同生命週期互相耦合。
- 不在編輯 Dialog 內複製整套 entry kind 對應與切換 UI，避免新增與編輯日後產生行為差異。

## 架構與責任

- 共用 record entry kind 負責 3 個使用者選項及其 `type / paymentSource` 映射，不負責提交、權限或週期事件。
- 新增表單保留既有週期事件處理；編輯表單自行管理既有值、切換重設及 update error。
- `UpdateLedgerRecordCommand` 以目標類型形成 discriminated union：income command 必須帶 `sourceMemberId`；expense command 必須帶 `paymentSource`，member-paid expense 還必須帶 `payerMemberId`。
- Fund Ledger correction 先依原 record 檢查權限、active 狀態及已退款阻擋，再依目標類型建立合法的 `IncomeLedgerRecord` 或 `ExpenseLedgerRecord`。
- Persistence 在既有 transaction 內更新同一個 record ID。Prisma schema 不變，不新增 migration；recurring occurrence 與 CSV import row 關聯自然保留。

## 編輯表單互動

- 開啟編輯時，income 初始化為「收入」，member-paid expense 初始化為「成員支出」，fund-paid expense 初始化為「基金支出」。
- 名稱、金額、日期與備註在任何切換中都保留。
- 「成員支出 ↔ 基金支出」保留目前的支出分類；切到基金支出時清除付款成員，切回成員支出時要求重新選擇付款成員。
- 「收入 ↔ 任一支出」會清空分類、來源成員及付款成員，並顯示目標 entry kind 的必填欄位。
- 一旦跨過 income / expense 邊界，即使在儲存前切回原類型，也不恢復原分類或專屬欄位。
- 切換不顯示第二層確認視窗；介面顯示簡短提示，說明必須重新選擇分類與付款資訊。
- Server 驗證失敗時，Dialog 保持開啟並保留目前 entry kind 與已填內容；只有更新成功才關閉、顯示成功訊息並 refresh。

## Domain 轉換

- 轉為 income：清除 `paymentSource / payerMemberId`，設定 `sourceMemberId`，並將 reimbursement status 設為 `not_applicable`。
- 轉為 fund-paid expense：清除 `sourceMemberId / payerMemberId`，設定 `paymentSource = fund`，並將 reimbursement status 設為 `not_refundable`。
- 轉為 member-paid expense：清除 `sourceMemberId`，設定 `paymentSource = member` 及 `payerMemberId`，並將 reimbursement status 設為 `refundable`。
- 目標分類必須存在、為 active，並與目標類型一致；前端選項不能取代 server-side validation。
- 更新是 all-or-nothing。缺少目標類型欄位、分類不符、record 已 voided、record 已退款或 actor 無權限時，不得寫入任何部分變更。

## 驗收重點

- 收入切換為家庭基金支出後，使用新支出分類，收入專屬欄位被清除，且不出現在待退款資料中。
- 收入切換為成員代墊支出後，使用新支出分類與付款成員，並出現在待退款資料中。
- 尚未退款的支出切換為收入後，使用新收入分類與收支對象，支出付款資訊及退款資格被清除。
- 儲存後，月度總額、分類統計、搜尋類型與退款資料皆反映新類型；不可同時殘留於舊類型結果中。
- 缺少目標類型的必填欄位、分類類型不符，或嘗試修改已退款支出時，伺服器端拒絕更新且不產生部分寫入。
- 週期與 CSV 來源關聯在類型切換後仍可追溯。

## 測試設計

- Entry kind 單元測試覆蓋 3 個選項對 `type / paymentSource` 的映射，並保護既有新增流程行為。
- Form parser 測試覆蓋 income、fund-paid expense、member-paid expense update commands，以及缺少類型專屬欄位的錯誤。
- Domain 測試覆蓋收入轉兩種支出、未退款支出轉收入、兩種支出互轉、衍生 reimbursement status、不相容欄位清除與所有阻擋條件。
- Persistence 測試確認同一 transaction 會更新類型與所有衍生欄位，且不操作 recurring occurrence 或 import row 關聯。
- UI component 測試覆蓋初始選項、支出互轉保留分類、跨類型清空欄位、切回不恢復，以及 Server error 後保留輸入。
- E2E 至少覆蓋 income → member-paid expense 與 refundable expense → income；驗證正確的類型結果、月度摘要與待退款資料，並確認已退款支出仍沒有編輯入口。

## 不在範圍

- 批次修改收支類型。
- 修改已退款支出的類型或 reimbursement reversal。
- 連動修改週期事件規則或未來月份。
- 回寫原始 CSV 或匯入批次結果。
- 新增完整 correction / audit history。
