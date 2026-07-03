# Refund Page Production v0.1.6

- status: done
- date: 2026-06-27
- source: .ai/archive/archive-refund-page-production-v0.1.6-2026-06-27.md

## 需求

Reintroduce a dedicated `退款` workspace so household members can review month-scoped unpaid member-paid expenses, completed refund records, summaries, detail readback, and finance-capable batch refund actions from a refund-oriented page instead of relying only on `/search`.

## 執行方式

Existing Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Better Auth Google OAuth, Tailwind/local UI components, Vitest, Playwright, GitHub Actions, Vercel, and Neon production workflow were reused. No new project foundation was introduced.

Route owner is `src/app/(app)/refunds/page.tsx`; panel owner is `src/app/(app)/refunds/_components/refund-page-panel.tsx`. Month switcher became route-aware. Detail behavior was centralized through shared record/refund/linked-record flow. Batch reimbursement helpers were shared with search. Final read-model locality moved refund-page and reimbursement payment reads under reimbursement modules rather than leaving all read models in reporting.

## 最終結果

Production route is `/refunds`. Home `待退款` links to `/refunds?month=<month>`. Desktop sidebar shows `退款` below `搜尋`; mobile bottom tabs omit it. The page has a `退款` title, route-aware month switcher, `全部` plus member tabs, unpaid and refunded sections, independent list scrolling, shared row/detail dialogs, selection mode, selected count/amount, batch refund dialog, cross-member warning, and existing authorization/eligibility checks.

Target is production. Version `v0.1.6` was deployed from immutable tag `v0.1.6` at `b0a5d72f0474da4c3cc4efe23004bdd2fc0b7597`. GitHub Actions run `28284994733` passed install, Prisma validation, type-check, lint, tests, build, `db:deploy`, Vercel build/deploy, and `/login` plus `/favicon.ico` smoke. Production URL is `https://home-fund-yt.vercel.app`.

## 特殊決策

Refund page is a reporting/workflow surface, not a new financial truth. Refund records are reimbursement payment evidence, not ordinary ledger records, and must not affect income/expense totals. Batch refund remains owned by Reimbursement, requires finance/admin authority, active member-paid refundable expenses, one paid-to member per MVP batch, payment evidence, household scoping, and server-side revalidation.

Use manual smoke, GitHub Actions evidence, Vercel logs, household feedback, and Neon console/runbook evidence until analytics/error monitoring exist. Track findability, mobile discoverability, unpaid versus refunded understanding, batch selection trust, operational errors, and recovery posture. Escalate to new Intent Intake for monitoring, backup readiness, mobile nav, refund correction/reversal, or split/cross-member batch reimbursement if evidence shows need.

## Bug / 阻礙

No preview/staging release target was used. Same-member production refund mutation smoke was skipped unless safe production data exists. Vercel runtime log review, Neon backup/restore or PITR evidence, and monitoring/error reporting provider setup remain open operational follow-ups rather than completed checks.
