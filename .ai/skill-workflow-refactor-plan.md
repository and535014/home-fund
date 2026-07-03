# Skills 流程重構修改計畫

- 更新時間：2026-07-04 01:20 Asia/Taipei
- 狀態：草稿
- 範圍：repo 內的 `.codex/skills` 與 workflow 指引

## 目標

把 repo 內的 skills 簡化成一套實用的網頁開發與維運流程。這套流程要能支援新功能開發、bug 修正、UI 調整、文案調整、CI/CD 調整與維運工作，也要適用新專案和既有專案。

## 原則

- skill 文件要短，重點放在執行步驟。
- 產出的 artifact 要短，只記錄決策、證據、風險、下一步。
- `.ai` 歷史文件最後要收斂成一個需求一個檔案。
- DDD 只在真的有業務規則複雜度時使用。
- 發布走 repo 既有 CI/CD 流程，不設計 release skill。
- 任務中斷後接續，不透過任何 skill。
- 開新對話、詢問進度、接續工作時，agent 應直接讀 `.ai/current-task.md`、最近 artifact 與 `git status`。
- 只有高風險節點才停下來給人工審查。

## 人工審查節點

- 需求確認後。
- prototype 與切版都完成後。
- 技術方案決定後。
- 實作與驗證完成後。
- 發布前，但這是 CI/CD 操作規則，不是 skill gate。

## Current Task 檔案

`.ai/current-task.md` 只作為任務續接用的極簡標記。

固定格式：

```md
# Current Task

- task: <任務簡稱>
- status: todo | in_progress | blocked | done
- step: <目前步驟>
- next: <下一個具體動作>
- updated_at: YYYY-MM-DD HH:mm Asia/Taipei
```

規則：

- 不加入 `waiting_for`。
- 不放完整背景、檔案清單、測試紀錄或長篇備註。
- 詳細決策與證據放在對應 artifact 或 git diff。

## Skills 職責規劃

### task-intake

日常任務入口，用來開始新任務。

- 釐清需求。
- 分類任務類型。
- 對新功能、流程調整或會影響使用者行為的變更，先納入成效追蹤設計。
- 判斷需要哪些後續 skills。
- 建立或更新 `.ai/current-task.md`。
- 在需求確認節點停下來。

### code-understanding

通用輔助 skill。任何步驟只要需要理解既有程式碼、架構、測試、資料流或部署線索，都可以呼叫它。

- 閱讀既有程式碼、文件、測試、路由、元件、資料流與部署線索。
- 分開記錄觀察事實與推論。
- 回答目前步驟需要的程式碼脈絡，不主動擴大範圍。
- 不作為固定流程步驟。
- 不作為人工審查節點。

### domain-understanding

通用輔助 skill。任何步驟只要碰到明確業務規則、領域語言、狀態轉換、權限或跨角色流程，都可以呼叫它。

適用例子：

- 角色與權限。
- 狀態轉換。
- 審核流程。
- 金流或款項流動。
- 週期性生命週期。
- 跨角色工作流程。
- 回答目前步驟需要的領域脈絡，不主動擴大成完整 DDD 流程。
- 不作為固定流程步驟。
- 不作為人工審查節點。

### ui-prototype

用於需要視覺審查的使用者介面、UX、layout、flow、互動或文案調整。

- 使用實際專案技術棧與預期的元件或路由位置。
- prototype 用來確認 flow、資訊架構、狀態、文案與互動方向。
- 切版用來把確認後的方向落到實際專案 UI、元件與路由。
- 這個節點的產物必須同時完成 prototype 判斷與實際切版成果。
- 在 prototype 與切版審查節點停下來。

### technical-plan

用於技術方案與測試策略。

- 決定邊界、資料所有權、API 形狀、狀態處理、驗證、錯誤處理與測試範圍。
- 將 AC 拆成測試清單。
- 標記每個 AC 的測試層級：unit、integration、E2E、manual 或 accepted risk。
- 決定 TDD 實作時要先寫或先啟用的 failing test。
- 只放必要的 acceptance criteria 或行為說明。
- 在技術方案節點停下來。

### implementation

用於實作。

- 依 `technical-plan` 的測試清單先寫或啟用測試。
- 先看到必要的 failing test，再做最小實作讓測試通過。
- 涉及行為、風險、資料、權限、整合或回歸風險時，採用 test-first。
- 純文案或小型視覺調整可以用較輕量的驗證，不強迫 TDD。
- 範圍必須對齊已確認需求與技術方案。

### verification

用於實作後驗證。

- 執行相關檢查。
- Review 正確性、回歸風險、UI 行為與已接受的缺口。
- 更新 `.ai/current-task.md`。
- 在實作完成節點停下來。

## 發布規則

發布不建立獨立 skill。一般開發、修復、UI、文案與維運任務完成後，若要發布，應走 repo 既有 CI/CD。

- 發布前先確認版本、commit、tag、CI 狀態與部署目標。
- 發布前先檢查 migration、env、auth、權限、rollback、smoke checks 與監控風險。
- agent 不透過 release skill 直接發布。
- 使用者明確要求發布時，agent 只檢查條件、回報風險，並依 repo 既有 CI/CD 觸發或指引操作。
- 如果要修改 CI/CD 本身，該工作視為一般開發任務，走 `task-intake` 到 `verification`。

### outcome-review

按需呼叫的成效追蹤分析 skill。使用者想檢查新功能、bug 修正、UI 調整或流程改版的實際成效時才使用。

- 讀取需求階段定義的成效追蹤設計。
- 收集可用的 logs、analytics、錯誤監控、使用者回饋或人工觀察。
- 判斷是否達到預期成效。
- 產出短結論、證據、風險與建議下一步。
- 不作為一般開發流程的固定步驟。

### work-summary

用於摘要已完成工作。

- 讓活躍 `.ai` 文件保持可讀。
- 保留決策與 traceability。
- 不刪檔。

### artifact-prune

只有使用者明確要求時才使用。

- 經過安全檢查後，才刪除或移動已完成 artifacts。

### foundation-plan

只在新專案、rewrite、migration、技術棧不明或 foundation 缺失時使用。

### foundation-setup

只在 foundation 決策完成後，用來建立可執行的基礎命令與專案 foundation。

## `.ai` 文件整理目標

目前 `.ai` 內同一個需求會分散在 intent、prototype、spec、technical-design、implementation、verification、release、learning、archive 等多個檔案。重構完成後要把歷史需求整理成「一個需求一個檔案」的精華紀錄。

保留內容：

- 曾經有什麼需求。
- 大致執行方式。
- 最終執行結果。
- 特殊決策。
- 開發中發生的 bug 或阻礙。

不保留內容：

- 重複的中間過程描述。
- 長篇驗證細節。
- 已被最終結果取代的草稿。
- 同一需求在多個 lifecycle artifact 裡的重複資訊。

建議格式：

```md
# <需求名稱>

- status: done | superseded | abandoned | active
- date: YYYY-MM-DD

## 需求

用 1 到 3 段說明當時要解決什麼。

## 執行方式

條列主要實作方向、涉及的頁面、元件、API、資料或 workflow。

## 最終結果

條列最後交付了什麼、是否已驗證、是否已發布或交付到哪個環境。

## 特殊決策

- 沒有就寫 `none`。

## Bug / 阻礙

- 沒有就寫 `none`。
```

整理規則：

- 一個需求只保留一個檔案。
- 檔名使用需求 id 或 kebab-case 需求名稱。
- 舊的多階段 artifacts 在精華檔建立且人工 review 後，才可以列為刪除或封存候選。
- 整理 `.ai` 歷史文件屬於高風險清理，刪除前必須先給使用者 review。

## 修改批次

每個 batch 都不是單純縮短文件。處理每個 skill 時要先 review 是否有優化空間，再決定保留、合併、改名、拆分、退役或刪除。

Review 準則：

- 觸發條件是否清楚，會不會誤觸發。
- 職責是否和其他 skill 重疊。
- 是否真的需要獨立 skill。
- 是否應該改成通用輔助 skill、固定流程 skill 或按需 skill。
- 是否有多餘 artifact、長文件或不必要 gate。
- 是否能降低 agent 執行時的上下文成本。
- 是否能更好支援新功能、bug、UI、文案、CI/CD 調整與維運。

### Batch 1：workflow 規則與任務標記

- 更新 `AGENTS.md` workflow 區塊。
- 加入極簡 `.ai/current-task.md` 規則。
- 移除 DDD 作為預設強制流程。
- 明確寫下：任務接續是直接檢查 repo，不透過 skill。

Batch 1 完成後停下來 review。

### Batch 2：任務入口

- Review 並重寫 `task-intake`。
- `workflow-init` 已移除，不再作為 skill 維護。
- 清掉 skill descriptions 與 routing 文字中對已移除 workflow init 流程的引用。

Batch 2 完成後停下來 review。

### Batch 3：核心交付 skills

- Review 並優化 `ui-prototype`。
- Review 並優化 `technical-plan`。
- Review 並優化 `implementation`。
- Review 並優化 `verification`。

Batch 3 完成後停下來 review。

### Batch 4：CI/CD 發布規則與維護 skills

- 移除或退役 `target-aware-release`。
- 移除或退役 `release-execution`。
- 在 `AGENTS.md` 或 workflow 指引中補上：發布走既有 CI/CD，不透過 release skill。
- Review 並優化 `outcome-review`。
- Review 並優化 `work-summary`。
- Review 並優化 `artifact-prune`。

Batch 4 完成後停下來 review。

### Batch 5：條件式與 foundation skills

- Review 並優化 `code-understanding`。
- Review 並優化 `domain-understanding`。
- Review 並優化 `foundation-plan`。
- Review 並優化 `foundation-setup`。

Batch 5 完成後停下來 review。

### Batch 6：references 與 skill 驗證

- Review 並縮短 `.codex/skills/**/references` templates。
- 若安全，移除 `.codex/skills/**/__pycache__` 這類產生檔。
- 檢查是否殘留 DDD-first 語言。
- 執行 `git diff --check`。

Batch 6 完成後停下來 review。

### Batch 7：`.ai` 歷史文件收斂

- 盤點 `.ai` 內所有需求與對應 artifacts。
- 以「一個需求一個檔案」建立精華紀錄。
- 每個檔案只保留需求、執行方式、最終結果、特殊決策、bug / 阻礙。
- 標記可刪除或封存的舊 artifacts，但不直接刪除。
- 給使用者 review 精華檔與刪除候選清單。

Batch 7 完成後做最終 review。

## 驗證清單

- 每個保留的 skill 都有經過「保留 / 合併 / 改名 / 拆分 / 退役 / 刪除」判斷。
- 每個保留的 skill 都有明確定位：固定流程、通用輔助、按需分析或維護工具。
- skill descriptions 使用通用網頁開發語言。
- DDD 是條件式，不是預設主流程。
- 沒有獨立 release skill；發布走 repo 既有 CI/CD。
- `code-understanding` 是通用輔助 skill，不是固定 gate。
- `domain-understanding` 是通用輔助 skill，不是固定 gate。
- 成效追蹤設計在 `task-intake` 就要納入。
- `outcome-review` 是按需呼叫的成效追蹤分析 skill，不是固定 gate。
- `workflow-init` 已移除。
- `task-intake` 負責開始任務、分類與路由。
- 任務接續被定義為直接檢查 repo。
- `.ai/current-task.md` 只有 5 個欄位。
- templates 不再鼓勵長文件。
- `.ai` 歷史文件整理後是一個需求一個檔案。
- 每個需求精華檔只保留需求、執行方式、最終結果、特殊決策、bug / 阻礙。
- 高風險節點都會停下來等待人工審查。
