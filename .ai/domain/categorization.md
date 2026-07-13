# Categorization Domain

## 核心概念

- Category 是收入 / 支出的分類語言，由 admin 管理。
- Category 有 type：income 或 expense。
- Active category 可用於新 records。
- Archived category 不可用於新 records，但歷史 records / reports 仍可讀。
- Category visual identity 包含 color、icon、sort order。

## Lifecycle

1. Category created。
2. Category renamed。
3. Category visual identity changed。
4. Category order changed。
5. Category archived。
6. Category unarchived if no active name conflict。

## Invariants

- 只有 admin 可 create / rename / archive / unarchive / reorder / change visual identity。
- 同一 household、同一 category type 內，active category name 不可重複。
- Archived category 必須保留歷史可讀性與 visual identity。
- Unarchive 後 append 到 active order 底部，除非未來另有排序政策。

## 開放問題

- Archived category 是否允許在 restore 前修改名稱或 visual identity。
- 未來是否授權 finance manager 管理 category。
