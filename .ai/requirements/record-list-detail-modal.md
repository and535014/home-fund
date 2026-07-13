# Record List Detail Modal

- status: done
- date: 2026-06-20
- source: .ai/archive/archive-record-list-detail-modal-2026-06-20.md

## 需求

Replace the overview records table with an item list and read-only detail modal, while preserving existing selected-month data, recent-record limit, ledger domain behavior, auth, permissions, and Traditional Chinese dark-theme UI.

## 執行方式

Reuse existing Next.js App Router, server-loaded dashboard context, client-side `RecordListDetail`, Tailwind, local shadcn-style `Dialog`/`Item`, and Playwright E2E. No foundation or package change was required.

`RecordListDetail` owns selected-record client state and focus return; `HomePage` owns dashboard layout and serializable category/member lookup objects. A local `DashboardPanel` wrapper standardizes `待退款`, `支出分類`, and `紀錄` sections with `gap-3`, full cell sizing, top alignment, and a desktop divider before the records column. Overview keeps only `SummaryMetric` card frames; `收支趨勢` is unframed with top spacing; `支出分類` uses row statistics rather than a pie chart.

## 最終結果

Dashboard records render as titled `紀錄` item buttons with category/name/payer/amount/date, absolute amount display, `YYYY/MM/DD` dates, and detail dialogs showing selected record amount/date/category/status/payer/note. Income detail status is `---`; fund-paid payer is `基金`; create-record actor copy is `支付者`.

Ready for `local_dev` review only. Verification passed lint, type-check, build, dashboard E2E 10/10, and create-record E2E 7/7. Local-dev readiness requires no migrations, secrets, OAuth callback changes, route changes, or deployment config changes.

## 特殊決策

No schema, persistence, ledger, reimbursement, category, auth, permission, or route behavior changed. The dashboard still shows recent five selected-month records.

Learning Loop was explicitly skipped by user request. If this local-dev slice is reviewed with users, capture record-list scanability, detail modal usefulness, dashboard panel density, category stats readability, and trend chart spacing feedback in a future Learning Loop.

## Bug / 阻礙

No visual screenshot baseline was added; Playwright role/bounding-box assertions cover responsive and clipping behavior. Full monthly record browsing remains deferred. `src/app/dashboard-charts.tsx` still contains an unused expense pie chart export, which is a cleanup candidate but not a release blocker. Production readiness was not assessed.
