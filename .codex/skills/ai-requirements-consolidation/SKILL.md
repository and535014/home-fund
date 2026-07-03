---
name: ai-requirements-consolidation
description: Use when retiring a project-local DDD workflow and consolidating old .ai lifecycle artifacts into .ai/requirements, with one concise record per completed requirement or feature slice.
---

# AI Requirements Consolidation

## 定位

這個 skill 只用於收尾曾套用 DDD workflow 的專案。目標是把舊 `.ai` lifecycle artifacts 退場前整理成 `.ai/requirements/`，一個需求一個 `.md`，保留「做過什麼、怎麼做、最後結果、特殊決策、已知阻礙」。

這不是新的需求管理流程，不負責產生 future AC，也不取代使用者層級的 superpowers skills。

## 產出內容契約

產出的 requirement markdown 內容不得包含任何 `.ai/` 檔案路徑、舊 artifact 檔名、source 參照或「整理自某某 `.ai` 檔」的文字。需求檔是給未來理解產品與交付歷史用的，不是舊 workflow 的索引。來源追蹤留在 git diff、commit、PR 說明或工作回報，不寫進 requirement 檔內容。

## 來源資料夾

從舊 DDD workflow artifacts 擷取內容：

- `.ai/archive/`
- `.ai/intent/`
- `.ai/prototype/`
- `.ai/spec/`
- `.ai/technical-design/`
- `.ai/implementation/`
- `.ai/verification/`
- `.ai/release/`
- `.ai/learning/`
- `.ai/domain-impact/`
- 其他同一套 lifecycle 產物

`.ai/workflow.md`、`.ai/project-context.md`、`.ai/current-task.*`、migration plan、template、空 `.gitkeep` 不是 requirement。

## 輸出結構

```text
.ai/requirements/
  admin-google-oauth-member-invitations.md
  batch-search-record-actions.md
  category-archive-visibility-toggle.md
```

檔名使用穩定 kebab-case。不要為了日期排序在檔名加日期；只有撞名時才加必要限定詞。

每個檔案使用這個格式：

```markdown
# Requirement Name

- status: done
- date: YYYY-MM-DD

## 需求

## 執行方式

## 最終結果

## 特殊決策

## Bug / 阻礙
```

可以省略沒有內容的段落，但不要改成 `Summary / Decisions / Evidence` 這類一般模板。

## 整理方式

1. 先用檔名、archive title、intent title、feature slug 分群。
2. 每個需求只產生一個 `.ai/requirements/<slug>.md`。
3. 優先讀 archive；archive 不足時，再補讀 intent、prototype、spec、technical design、implementation、verification、release、learning。
4. 摘要，不全文搬運。
5. 保留具體證據：測試指令、通過狀態、production / local_dev readiness、外部阻礙。
6. 保留特殊決策：權限、domain ownership、scope cut、release / deployment policy、accepted gap。
7. 把長期 domain 規則交給 `.ai/domain/`，不要塞進需求檔。
8. 只有在使用者同意退場 / cleanup 後，才刪除舊 `.ai` lifecycle artifacts。
9. 寫入 requirement 檔前，刪掉所有 `.ai/` 來源路徑與舊 artifact 檔名；不要用 `source:` 欄位。

## Section 寫法

- `需求`：使用者要解決的問題或功能範圍。
- `執行方式`：實作、設計或交付方式的高層摘要。
- `最終結果`：最後真的交付或驗證到的狀態。
- `特殊決策`：未來看回來仍需要知道的取捨。
- `Bug / 阻礙`：未解問題、accepted gaps、外部依賴或 production blockers。

## 驗證

- Run `find .ai/requirements -maxdepth 1 -type f | sort`。
- Run `rg -n "^## " .ai/requirements`，確認 section 名稱符合本 skill 的格式。
- Run `rg -n "\\.ai/" .ai/requirements`，預期沒有任何輸出內容參照 `.ai` 檔案。
- Run `git diff --check`。
- 確認每個被刪除的舊 `.ai` artifact：已併入某個 requirement、移入 `.ai/domain/`，或是明確屬於 workflow noise。
