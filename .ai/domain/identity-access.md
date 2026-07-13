# Identity and Access Domain

## 核心概念

- `Member` 是 app-owned household participant；Google account 只是登入身份來源。
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
- Binding invitation / link state 不等於 member availability status。
- UI 隱藏不能取代 server authorization。
- App-owned display name 是 UI、records、reports 的主要顯示名稱。

## 開放問題

- Admin 與 finance manager 是否可同時存在於同一 member。
- Disabled member 是否可被新 records / imports 選用。
- Avatar 是每次 login sync，還是首次綁定後複製一次。
