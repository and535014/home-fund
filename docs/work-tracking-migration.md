# Issue 65 Work-Tracking Migration Evidence

一次性來源去向，對應 [issue #65](https://github.com/and535014/home-fund/issues/65)。
此文件不是 backlog，不持續複製 issue 狀態；未完工作、依賴、驗收與結案以 GitHub 為準。

## 基準與原文恢復

盤點基準為 main `97c95319fdc6e873a99dd3f7e6194d46ecfcd964`（2026-11-04）。
下列 4 份 plan 的完整原文與行號可由固定 commit 連結讀取，或以
`git show <source-commit>:<source-path>` 恢復。完成的逐步指令不再放在 active
plans 目錄，避免舊 `- [ ]` 被當成現行待辦。未採納的領域問題保留於 `.ai/domain/`，
並明示未排程、非批准實作；不逐句創造新 issue。

## 原文去向與獨有規則核對

| 原文                                                                                                                                                                                                                   | 現行 owner／歷史去向                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [2026-07-13-edit-ledger-record-type.md:1–1430](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-13-edit-ledger-record-type.md#L1-L1430)             | 已完成的類型轉換計畫；需求結果由下方固定版本的歷史摘要保存，現行規則在 `.ai/domain/fund-ledger.md` Record Lifecycle。保留同一 record ID、共用欄位、清除不相容欄位、重選分類／歸屬、已退款阻擋與 recurring/import trace，不重新開功能票。實作與驗證歷史由 Git/PR 保存。                                                                                                                                          |
| [2026-07-17-deepen-ledger-record-creation.md:1–1064](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-17-deepen-ledger-record-creation.md#L1-L1064) | Candidate 1 已由 PR #29 合併。現行 Fund Ledger 保留三個 intent-specific creation entry points、共同 validation／authorization／projection、CSV 每列 transaction／穩定 identity／fingerprint 僅警告、disabled attribution 阻擋。Recurring 與 Identity domain 保留受限 system actor、creator attribution、原子 source trace、blocked 與 transient failure 區分、事件先建立與入帳獨立 transaction 的邊界。舊執行指令與測試歷史回 Git。 |
| [2026-07-28-ledger-version-persistence.md:1–359](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-ledger-version-persistence.md#L1-L359)         | C2.1 已由 PR #31 合併。`.ai/domain/fund-ledger.md` 保留 version 從 1 起、成功 mutation 原子遞增、rollback 不改值、migration-first 舊 app 相容與全部 writer 升級前不得啟用 version guard。C2.2 以後仍是獨立 issue，不把 version persistence 當作 expectedVersion 已完成。                                                                                                                                                            |
| [2026-07-28-candidate-delivery-slices.md:1–142](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L1-L142)           | Candidate 2–4 的 scope／excluded／verification／依賴原文固定於此連結；有效未完切片逐項映射 #35–#46（下表）。不繼續維護本機切片進度。保留每一票原有邊界，這次整理不批准或實作後續功能。                                                                                                                                                                                                                                              |

其餘來源保留：

- 7 份 `.ai/domain/`：現行領域規則，沒有整批移除。此次只補充既有實作已回答的問題、
  creation 邊界與未採納問題標示，不改 financial behavior。
- 27 份歷史需求摘要：本次依使用者後續指示退場，完整原文固定於下方來源表。
  原稿誤記為 26 份，此處更正；舊 status 與驗證結果不升格為現行進度或 production 驗收。
- `docs/deployment.md`、`docs/release-runbook.md`、`docs/database-backup-and-recovery.md`：
  保留 main 既有操作規則，本 patch 不搬回舊 checkout 的 release-version 流程。
- `AGENTS.md`／README：補 issue → 實作／文件／驗證 → draft PR 入口，保留安全與授權邊界。

## 既有 issue 映射

來源切片行號均指上方固定版本 `candidate-delivery-slices.md`。
狀態與實際進度請讀 issue；下表不作第二份 open/closed 清單。

| 來源                                                                                                                                                                                                            | 既有工作入口                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [C2.2 versioned single correction，L27–L33](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L27-L33)        | [issue #35](https://github.com/and535014/home-fund/issues/35) |
| [C2.3 versioned single void，L35–L41](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L35-L41)              | [issue #36](https://github.com/and535014/home-fund/issues/36) |
| [C2.4 atomic batch void，L43–L49](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L43-L49)                  | [issue #37](https://github.com/and535014/home-fund/issues/37) |
| [C2.5 versioned reimbursement settlement，L51–L57](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L51-L57) | [issue #38](https://github.com/and535014/home-fund/issues/38) |
| [C2.6 legacy concurrency cleanup，L59–L65](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L59-L65)         | [issue #39](https://github.com/and535014/home-fund/issues/39) |
| [C3.1 Reporting search interface，L69–L75](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L69-L75)         | [issue #40](https://github.com/and535014/home-fund/issues/40) |
| [C3.2 pending recurring result kind，L77–L83](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L77-L83)      | [issue #41](https://github.com/and535014/home-fund/issues/41) |
| [C3.3 reimbursement payment result kind，L85–L91](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L85-L91)  | [issue #42](https://github.com/and535014/home-fund/issues/42) |
| [C3.4 dedicated reimbursement detail，L93–L99](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L93-L99)     | [issue #43](https://github.com/and535014/home-fund/issues/43) |
| [C4.1 reimbursement payment version，L103–L109](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L103-L109)  | [issue #44](https://github.com/and535014/home-fund/issues/44) |
| [C4.2 conditional payment correction，L111–L117](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L111-L117) | [issue #45](https://github.com/and535014/home-fund/issues/45) |
| [C4.3 conflict recovery UX，L119–L125](https://github.com/and535014/home-fund/blob/97c95319fdc6e873a99dd3f7e6194d46ecfcd964/docs/superpowers/plans/2026-07-28-candidate-delivery-slices.md#L119-L125)           | [issue #46](https://github.com/and535014/home-fund/issues/46) |

C2.1 不在這張未完映射表：它已有 schema、adapter exposure 與 write increments。
現行 correction／void／reimbursement 仍以讀到的 `updatedAt` guard 寫入，這不等於
caller 提供 `expectedVersion` 已交付。ordinary search query 仍在 Fund Ledger；已有
refund search／payment edit 不等於 C3 ownership redesign 或 C4 versioned UX 完成。

## 驗收與維運歷史的界線

- [手機驗收 issue #47](https://github.com/and535014/home-fund/issues/47)：本輪收到的最新摘要為
  17 passed／2 failed／1 skipped，page gate 1/6，仍未完整驗收。候選 fixture 已退出 patch，
  只保留報告；失敗不能直接定性為產品缺陷。本 patch 未操作另一個工作者的副本或重跑驗收。
- [OAuth／Better Auth issue #58](https://github.com/and535014/home-fund/issues/58)：
  已包含真實 Google OAuth 未完成時明列缺口的要求；不因舊 local OAuth draft 重開票。
- [Backup/recovery issue #49 的成功演練留言](https://github.com/and535014/home-fund/issues/49#issuecomment-5915917826)
  有操作者確認的真實解密、隔離 Neon restore/comparison 證據。這是歷史演練，不是本 patch
  重跑，不代表 production restore。此次不關閉 #49，也不重開演練票。
- Release pipeline #48、backup script #52，以及安全事項 #56–#59、runtime observation #64
  沿用既有票；文件整理不重做已交付流程或順便變更依賴。

## 已有答案的舊問題

| 原 domain 問題                                           | 現行答案與程式核對                                                                                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 同一 member 能否有 admin 與 finance manager              | `member-management.ts:updateMemberPermissions` 接受多個 roles，保護最後一位 admin；Prisma `Member.roles` 為關聯集合。規則集中於 Identity and Access，Home Family Fund 不再重複問。          |
| Avatar 每次登入同步或首次複製                            | `member-invitation-command.ts` binding 僅在 member 沒有 avatar 時補 Google avatar；現行描述不宣告額外同步機制。                                                                             |
| income／fund-paid expense 的 reimbursement status filter | `fund-ledger/search/record-search-query.ts:buildRecordSearchWhere` 限定 type=expense、paymentSource=member；已補 Reporting invariant。                                                      |
| Delete event 如何處理 pending occurrences                | `recurring/recurring-event-command.ts:deleteRecurringEventInDatabase` 在 transaction 內 soft-delete rule 並把 pending 標記 skipped；已補 lifecycle。                                        |
| 所有 batch 是否同一 partial-success 規則                 | CSV 是每列 transaction；batch void／reimbursement 可回報 preflight skipped，實際寫入組以 transaction 完成，競爭衝突 rollback。問題改為未來是否變更現行政策，不把不同 intents 合成未知選擇。 |

完整 correction／void history、partial/split/reversal、reconciliation import、annual
aggregate、mobile summary 優先順序、category 權限／archived editing、missed occurrences、
cron retry/alert 等仍是未採納背景。舊 requirement 中 search placeholder、refund deferred、
client-only search 等是早期快照；現行程式已有搜尋／退款及 server-side cursor pagination。
不因那些歷史文字開重複功能票。

## 歷史需求摘要退場

使用者於 2026-11-04 明確要求讓 `.ai/requirements/` 退場。下表固定於 PR 原 head
`219a2a3771508a5716441d79cd59cb05dd71edb9`，包含先前修正的 status 說明與 #47／#58 入口。
所有 27 份原文均可用 `git show <上述 SHA>:.ai/requirements/<檔名>` 恢復；
不另建 archive 資料夾，不再要求新工作更新歷史摘要。

新需求／依賴／驗收以 Issues 為準，交付理由／驗證以 PR 為準；現行長期規則放 domain，
操作流程放 README 與既有 runbooks。表中的 owner 只承接仍有效的契約，
不把舊 UI、檔案位置、測試次數、local-dev 狀態或未採納想法複製成新規格。
完整原文保留被否決方案與證據限制；沒有新開功能票或關閉既有驗收票。

| 固定版本原文 | 現行 owner／退場判斷 |
| --- | --- |
| [admin-created-member-google-binding.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/admin-created-member-google-binding.md) | Identity and Access：預建 member、member-specific binding、app-owned membership；設定與 secrets 依 README／deployment。 |
| [admin-google-oauth-member-invitations.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/admin-google-oauth-member-invitations.md) | Identity and Access 承接身份／權限；舊 account-agnostic invitation 已被 member binding 取代，舊 OAuth smoke 不代替 #58 驗收。 |
| [admin-only-category-management.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/admin-only-category-management.md) | Categorization：admin-only、active 同類名稱唯一、封存歷史可讀。 |
| [app-seam-refactor.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/app-seam-refactor.md) | AGENTS 架構邊界：modules／auth 不依賴 app；舊檔名與測試次數只留 Git。 |
| [batch-search-record-actions.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/batch-search-record-actions.md) | Reporting selection 不授權；Fund Ledger void／Reimbursement transaction 承接；舊 partial-success 與 retired route 描述不當現況。 |
| [category-archive-visibility-toggle.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/category-archive-visibility-toggle.md) | Categorization：取消封存、同類 active name conflict、append order；UI 與測試歷史保留原文。 |
| [category-visual-identity.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/category-visual-identity.md) | Categorization：visual identity／ordering／admin-only；補明 category-owned，不複製到 ledger。 |
| [csv-import-financial-records.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/csv-import-financial-records.md) | Fund Ledger：preview 無財務效果、逐列 transaction／冪等／fingerprint 警告；補 audit 不存原始 CSV、不直接匯入付款證據。 |
| [desktop-product-structure-layout-redesign.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/desktop-product-structure-layout-redesign.md) | AGENTS app-layer 分工；舊 placeholder／移除 recurring 的時點描述僅留歷史，不重開功能票。 |
| [edit-delete-ledger-records.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/edit-delete-ledger-records.md) | Fund Ledger：correction／void、權限、已退款阻擋；補明現行刪除不是 hard delete。 |
| [edit-ledger-record-type.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/edit-ledger-record-type.md) | Fund Ledger：同一 record ID、類型切換與來源追溯；補切回不恢復專屬欄位及支出互轉保留分類。設計替代方案與完整 UX／驗收原文固定於此。 |
| [edit-reimbursement-payment-records.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/edit-reimbursement-payment-records.md) | Reimbursement：只更正付款日期／方式／備註、immutable facts、不反轉狀態；補空備註正規化。 |
| [github-actions-vercel-neon-deployment.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/github-actions-vercel-neon-deployment.md) | 現行 deployment／release／backup runbooks；舊 package version PR 流程已被 tag SSOT 取代，不搬回操作文件。 |
| [home-dashboard-record-tabs-yearly-trend.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/home-dashboard-record-tabs-yearly-trend.md) | Reporting monthly／yearly read models；tab state 與 selected-year rows 是實作歷史，aggregate 提案未採納。 |
| [home-family-fund.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/home-family-fund.md) | 六個 domain 承接家庭資金、身份、款項、週期與 reporting；初期 scope／release target 保留歷史。 |
| [local-dev-mvp-hardening.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/local-dev-mvp-hardening.md) | Identity／Fund Ledger／Recurring 與 README 的 E2E 邊界；舊 production blockers 不當成現在待辦。 |
| [local-google-oauth-login.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/local-google-oauth-login.md) | 真實 OAuth 驗收沿用 #58；controlled E2E／placeholder 不當成功證據，原 smoke plan 保留歷史。 |
| [mobile-sitewide-layout-redesign.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/mobile-sitewide-layout-redesign.md) | 後續驗收沿用 #47；原 UX、safe-area／loading／fixture 限制保留此固定原文，未重跑或宣稱通過。 |
| [record-detail-reimbursement.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/record-detail-reimbursement.md) | Reimbursement：單次結算、finance 授權與資格；補明記錄付款不執行轉帳，舊 placeholder 不當現況。 |
| [record-list-detail-modal.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/record-list-detail-modal.md) | Reporting monthly scope 與 AGENTS app-layer 分工；舊 recent-five 限制與視覺驗證只留歷史。 |
| [record-search-sort-filter.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/record-search-sort-filter.md) | Reporting：查詢不授權、reimbursement filter；舊 client-side search 與 draft 為歷史，後續 server pagination 不回退。 |
| [recurring-income-expense-records.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/recurring-income-expense-records.md) | Recurring：fixed day／月底、pending 不入 totals、入帳來源與冪等；protected cron 依 deployment。 |
| [refund-page-production-v0.1.6.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/refund-page-production-v0.1.6.md) | Reporting／Reimbursement 與現行 runbooks；v0.1.6 tag／run 為歷史發布證據，不當本次 production 驗證。維運事項沿用 #49／#64。 |
| [reimbursement-payment-flow.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/reimbursement-payment-flow.md) | Reimbursement：一 batch 一收款人、衍生金額／來源、原子 evidence；舊「不可編輯」已由 metadata correction 取代。 |
| [remove-standalone-create-record-entry.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/remove-standalone-create-record-entry.md) | Fund Ledger 權限與 AGENTS app-layer 分工；舊 homepage-only 入口與 URL 決策是時點快照。 |
| [search-reimbursement-payment-records.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/search-reimbursement-payment-records.md) | Reporting／Reimbursement：付款證據不是 ledger、排除 totals／ordinary selection；補 legacy 無 evidence 不虛構紀錄。 |
| [search-route-local-structure.md](https://github.com/and535014/home-fund/blob/219a2a3771508a5716441d79cd59cb05dd71edb9/.ai/requirements/search-route-local-structure.md) | AGENTS：route-local private folders 與多路由 app-private shared seams；不延續額外 cleanup backlog。 |

## 交付邊界

必要新 issue 候選：無。可驗收的未完工作已有上述 issue；其他想法未批准／未排程。
未使用新 label 體系、ADR 階層、排程監控或額外治理框架。
使用者明確要求本次 AGENTS 與文件整理一起 commit 並在 draft PR 審閱；這是本次特定授權，不放寬未來確認與安全規則。
此整理不授權 merge、tag、deploy 或 production 操作。原 4 份 plans 的退場沿用先前隔離副本；後續 27 份 requirements 在本次工作樹 `fa82/home-fund` 透過 `/usr/bin/trash` 移至 macOS 垃圾桶。未修改其他工作者的副本。
