# Candidate 2–4 Delivery Slices

## 目的

將架構 review 的 Candidate 2–4 視為 Epic，再拆成可獨立 review、驗證與 rollback 的小型 PR。這份文件只描述後續交付順序，不宣告尚未實作的 domain invariant。

## 切片原則

- 一個 Candidate 是一個 Epic，不是一個 PR。
- 每個 PR 只解決一個主要 outcome 與一個主要 risk。
- 先建立 bounded-context Interface 與可觀察行為，再交付 UI orchestration。
- 每個切片都要列出明確不處理的範圍，避免「順便」修正其他 Candidate。
- 測試以外部行為、transaction boundary 與 read-model contract 命名，不綁定 private helper。
- Cleanup 只能在新 seam 已有等價 coverage 後進行，並單獨成為最後一個切片。
- 未來決策留在 plan；只有程式已實作且驗證的長期規則才同步到 `.ai/domain/`。

## Candidate 2：Versioned Ledger Mutation

### C2.1 Ledger Version Persistence

- Outcome：Ledger record 具有可用於 conditional write 的持久化 version。
- External Interface：read model 返回 `version`；本切片不改 mutation command。
- Primary risk：migration-first deploy 期間新舊 app 同時寫入。
- Explicitly excluded：correction、void、batch mutation、reimbursement transition、conflict UI。
- Verification：migration/backfill test、old-app write compatibility、Prisma validation、read-model tests。

### C2.2 Versioned Single Correction

- Outcome：單筆 correction 以 `recordId + expectedVersion` 執行 conditional write，成功後 version 遞增。
- External Interface：Fund Ledger 暴露 intent-specific correction command 與 typed `version_conflict`。
- Primary risk：舊 command 覆蓋他人已完成的修正。
- Explicitly excluded：void、batch、reimbursement payment correction、自動重試。
- Verification：correction integration tests 覆蓋 success、stale version、household scope、permission 與 rollback。

### C2.3 Versioned Single Void

- Outcome：單筆 void 使用相同 version contract，並維持 reimbursement 互斥狀態。
- External Interface：Fund Ledger 暴露 intent-specific void command 與 typed conflict/status results。
- Primary risk：void 與 reimbursement transition 競爭造成狀態不一致。
- Explicitly excluded：batch void、UI multi-select、refund record correction。
- Verification：database integration tests 覆蓋 stale version、already void、reimbursed record 與 concurrent transition。

### C2.4 Atomic Batch Void

- Outcome：通過 preflight 的 records 在同一 transaction 中原子 void，任一 version conflict 使整批 rollback。
- External Interface：batch command 接收 `[{ recordId, expectedVersion }]`，回傳 preflight exclusions 與 transaction outcome。
- Primary risk：preflight 被誤當 mutation 授權或產生 partial success。
- Explicitly excluded：reimbursement batch settlement、混合 correction，以及自動重試 conflict。
- Verification：integration tests 覆蓋部分無權限、部分 stale version、全組 rollback 與重新驗證 scope/status。

### C2.5 Versioned Reimbursement Settlement

- Outcome：reimbursement settlement 以每筆 Ledger expected version 建立 payment evidence，並與 records 狀態原子轉換。
- External Interface：Reimbursement command 接收 versioned record targets，回傳 typed eligibility/conflict result。
- Primary risk：payment evidence 已建立，但部分 records 未成功轉態。
- Explicitly excluded：refund payment edit UI、Search detail read model、跨 paid-to member batch。
- Verification：integration tests 覆蓋 amount equality、member grouping、stale target 與 evidence/record 雙向 rollback。

### C2.6 Legacy Concurrency Cleanup

- Outcome：所有 caller 已經移到 versioned commands，移除 shallow mutation path 與舊測試替身。
- External Interface：不新增 Interface；只縮小既有暴露面。
- Primary risk：過早刪除導致 caller 遺漏或 coverage 缺口。
- Explicitly excluded：任何新功能、UI 改版、Reporting 變更。
- Verification：CodeGraph caller audit、等價 tests、type-check、相關 E2E。

## Candidate 3：Reporting-owned Search Results

### C3.1 Reporting Search Interface

- Outcome：Reporting 擁有 ordinary Ledger search contract，app route 只負責轉換 query parameters 與呈現。
- External Interface：Reporting query 回傳 ordinary result read model 與 pagination metadata。
- Primary risk：Reporting 意外成為 mutation 授權或財務事實來源。
- Explicitly excluded：pending recurring、refund result kind、reimbursement detail、UI 視覺重設。
- Verification：query contract tests、household scope、pagination stability、route adapter tests。

### C3.2 Pending Recurring Result Kind

- Outcome：Search 可明確辨識 pending recurring result，而不把它當成 ordinary financial fact。
- External Interface：Search result union 新增 pending recurring variant 與專屬 detail reference。
- Primary risk：pending item 被納入 totals 或 ordinary batch mutation。
- Explicitly excluded：refund results、posting command 重構、dashboard rewrite。
- Verification：query tests 覆蓋 classification、totals exclusion、batch selection exclusion 與 Search detail flow。

### C3.3 Reimbursement Payment Result Kind

- Outcome：refund payment evidence 以獨立 result kind 出現在 Search，不偽裝成 income/expense。
- External Interface：Search result union 新增 refund variant，只含列表所需欄位與 detail reference。
- Primary risk：refund amount 被重複計入 ordinary totals。
- Explicitly excluded：full reimbursement detail、payment correction、version conflict UX。
- Verification：query tests 覆蓋 classification、totals exclusion、pagination ordering 與 household scope。

### C3.4 Dedicated Reimbursement Detail Read Model

- Outcome：refund detail 由 Reimbursement/Reporting 專屬 query 組合 payment、linked records 與 audit fields。
- External Interface：獨立 reimbursement detail query，不重用 Search list result。
- Primary risk：read model 成為 correction 授權來源，或對 stale state 做決策。
- Explicitly excluded：edit command、conflict recovery UI、Candidate 4 的 version persistence。
- Verification：detail query tests 覆蓋 linked records、audit metadata、not found 與 household isolation。

## Candidate 4：Reimbursement Payment Correction

### C4.1 Reimbursement Payment Version

- Outcome：payment evidence 取得獨立 version 與 read-model exposure，不改變現有 correction behavior。
- External Interface：reimbursement detail 回傳 payment `version`。
- Primary risk：migration/backfill 或舊 app write 產生無法修正的 rows。
- Explicitly excluded：conditional correction、UI editing、Ledger record version reuse。
- Verification：migration compatibility、Prisma validation、detail read-model tests。

### C4.2 Conditional Payment Correction

- Outcome：只允許規格允許的 payment metadata correction，並以 `expectedVersion` conditional write。
- External Interface：Reimbursement 暴露 intent-specific correction command，回傳 success、validation、permission 與 `version_conflict`。
- Primary risk：correction 改動 amount、paid-to/source、batch 或 linked Ledger facts。
- Explicitly excluded：conflict recovery UI、自動重試、Search query 重構。
- Verification：integration tests 覆蓋 allowlist fields、immutable fields、stale version、audit fields 與 rollback。

### C4.3 Conflict Recovery UX

- Outcome：使用者遇到 stale payment 時看到可理解的 conflict，並可重新載入後再編輯。
- External Interface：app action 將 typed `version_conflict` 轉成重載提示，不改寫 domain result。
- Primary risk：UI 偷偷自動重試舊 command，覆蓋他人變更。
- Explicitly excluded：新的 correction fields、bulk correction、通用 conflict framework。
- Verification：action/component tests 與 Playwright conflict flow，確認不自動重送與重載後 version 更新。

## 依賴與建議順序

1. 先完成 C2.1–C2.3，證明單筆 Ledger version contract。
2. 再完成 C2.4–C2.5，擴展到 batch 與跨 bounded-context transaction。
3. 最後執行 C2.6，移除舊 concurrency path。
4. Candidate 3 可在 C2 之後獨立進行；C3.4 是 Candidate 4 UI 的 read-model 前置。
5. Candidate 4 依序完成 C4.1、C4.2、C4.3；不將 persistence、command 與 UX 合併成一個 PR。

## 每個切片的 Ready Checklist

- 只有一個主要 outcome，且 title 能直接描述。
- 有明確 External Interface 與 Explicitly excluded。
- 先有會失敗的行為測試，再實作最小變更。
- 有相關 transaction、scope、permission 或 read-model contract 驗證。
- `.ai/domain/` 只同步本切片已實作的長期規則。
- PR 可獨立 rollback，不依賴尚未合併的後續切片才能正常運作。
