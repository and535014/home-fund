---
name: ai-domain-curation
description: Use when retiring a project-local DDD workflow and consolidating .ai/domain, event storming, or domain-impact artifacts into durable bounded-context domain files.
---

# AI Domain Curation

## 定位

這個 skill 只用於收尾曾套用 DDD workflow 的專案。目標是把舊 `.ai/domain/`、event storming、`.ai/domain-impact/` 裡真正長期有效的 domain 知識留下來，整理成少量穩定檔案。

這不是日常需求流程，也不是新的 DDD lifecycle。完成後，後續一般工作應回到使用者層級的 superpowers skills。

## 產出內容契約

產出的 domain markdown 內容不得包含任何 `.ai/` 檔案路徑、舊 artifact 檔名、source 參照或「整理自某某 `.ai` 檔」的文字。輸出檔只能保留產品長期語言與規則；來源追蹤留在 git diff、commit、PR 說明或工作回報，不寫進 domain 檔內容。

## 輸出結構

建議輸出為一個總覽檔加多個 bounded context 檔：

```text
.ai/domain/
  <product>.md
  identity-access.md
  fund-ledger.md
  categorization.md
  recurring-schedule.md
  reimbursement.md
  reporting.md
```

實際檔名依產品語言調整。只有當語言、ownership、lifecycle、policy 或 invariants 明顯不同時，才拆成新的 bounded context。

## 總覽檔格式

```markdown
# <Product> Domain

## 用途

## Bounded Contexts

## 跨 Context 核心規則

## 重要詞彙

## 開放問題
```

## Context 檔格式

```markdown
# <Context> Domain

## 核心概念

## Lifecycle

## Invariants

## 開放問題
```

沒有 lifecycle 的 context 可以省略 `Lifecycle`。

## 保留

- Ubiquitous language 與未來 UI copy、測試、程式命名仍會使用的詞彙。
- Role、permission、authorization boundary。
- Lifecycle、狀態轉移、eligibility、audit policy。
- 跨 context ownership，例如 Reporting 只能讀取，Ledger 才是財務事實來源。
- 財務、權限、no-double-count、idempotency 等 invariants。
- 仍影響未來產品或實作的開放問題。

## 移除

- 舊 workflow frontmatter：`workflow_version`、`release_target`、`stage`、`trace_links`。
- Delivery profile、review gate、acceptance signals、next step。
- Event timeline 原稿；只保留抽出的規則與語言。
- Per-requirement domain delta；歷史需求放 `.ai/requirements/`。
- Implementation log、verification log、release evidence、commit notes。

## 分工

- `.ai/domain/`：長期 domain model。
- `.ai/requirements/`：已完成或曾執行需求的歷史紀錄。
- `.ai/workflow.md`、`.ai/project-context.md`、`.ai/current-task.*`：DDD workflow 退場後不再作為入口。

## 驗證

- Run `find .ai/domain -maxdepth 1 -type f | sort`。
- Run `rg -n "\\.ai/" .ai/domain`，預期沒有任何輸出內容參照 `.ai` 檔案。
- Run `rg -n "workflow_version|release_target|Review Gate|Event Timeline|Visual Model|current-task|project-context|workflow\\.md" .ai/domain`，預期沒有舊 workflow 殘留。
- Run `git diff --check`。
- 回報保留了哪些長期 domain 規則，以及哪些 workflow / delivery history 已移出或刪除。
