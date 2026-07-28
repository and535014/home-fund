# Identity and Access Domain

## 核心概念

- `Member` 是 app-owned household participant；Google account 只是登入身份來源。
- System actor 不是 Member 或登入身份；它只代表受限的系統執行身分，必須透過明確授予的 system capability 執行特定背景工作。
- Admin 可以先建立 member，member 即可用於 ledger / reporting attribution，即使尚未綁定 Google。
- Google binding link 是 member-specific；一個 Google identity 最多綁定一個 active member。
- Display name 是 app-owned，可由 admin 管理；avatar 目前由 Google profile 提供。

## 角色

| Role | 核心能力 |
|---|---|
| Admin | 建立 member、產生 binding link、管理權限 / 顯示名稱、管理分類、處理任何 ledger record。 |
| Finance manager | 可建立 / 編輯他人財務紀錄並執行 reimbursement；MVP 不預設可刪除他人紀錄。 |
| General member | 可瀏覽 household records；通常只能建立 / 修改自己相關紀錄。 |

## Lifecycle

1. Admin creates member。
2. Admin generates member-specific binding link。
3. User signs in with Google and binds identity。
4. Bound member can access household data if active。
5. Disabled member cannot access household data。

## Invariants

- Google sign-in 不等於 household access；必須解析到 active app member。
- System actor 不得取得一般 Member 的隱含權限，也不能成為 ledger record 的財務歸屬對象。
- 每個 system capability 必須限定可執行的 command 與資料 scope；不能作為繞過 household scope 或 domain invariant 的萬用授權。
- Disabled member 只保留歷史可讀性，不可再成為新 ledger record、CSV import 或 recurring posting 的財務歸屬對象。
- Binding invitation / link state 不等於 member availability status。
- UI 隱藏不能取代 server authorization。
- App-owned display name 是 UI、records、reports 的主要顯示名稱。

## 開放問題

- Admin 與 finance manager 是否可同時存在於同一 member。
- Avatar 是每次 login sync，還是首次綁定後複製一次。
