# Local Dev MVP Hardening

- status: done
- date: 2026-06-18
- source: .ai/archive/archive-local-dev-mvp-hardening-2026-06-18.md

## 需求

Home Family Fund is a Traditional Chinese, dark-theme, single-household MVP for tracking shared family fund income, expenses, reimbursements, categories, recurring items, monthly reports, and role-aware access.

## 執行方式

The project uses Next.js, React, TypeScript, Prisma/PostgreSQL, Better Auth, Vitest, Playwright, Tailwind CSS, and shadcn-style UI primitives. DDD workflow artifacts now live in v2 directories. New workflow artifacts must be written only to v2 directories and agents must stop after each lifecycle gate for user approval.

Recurring confirmation uses a dashboard-local panel and server action, a Prisma transaction wrapper around recurring occurrence confirmation and ledger record creation, DB-backed dashboard reload as proof of persistence, and controlled auth headers only outside production. DB-backed E2E uses dedicated port `3100`, `.next-e2e`, and per-test DB reset.

## 最終結果

The local_dev MVP now supports authenticated household access, dashboard read models, ledger record creation, permission matrix checks, reimbursement settlement UI, DB-backed E2E foundation, and recurring reminder confirmation. Reminder-mode recurring occurrences remain pending until an authorized user confirms them; confirmation creates a matching ledger record, links `ledgerRecordId`, removes the pending item, and updates monthly totals.

`local_dev` is ready for user review. Production readiness is not assessed and remains blocked on hosting/database target, production Google OAuth callback, secrets, migration/rollback, backup/restore, smoke test, monitoring/logging, analytics, and feedback channels.

## 特殊決策

Functional pages require sign-in and app-owned member authorization. General members can create their own records only; admins and finance managers can create records for any member. Reminder confirmation uses the resulting ledger-record creation permission, not recurring-rule management permission. Posted recurring occurrences cannot be confirmed again. Member-paid expenses remain reimbursable until marked reimbursed once by a finance manager.

No production Learning Loop artifact exists yet because production release is not selected. Define analytics, monitoring, logging, and feedback during production release intake.

## Bug / 阻礙

Full DB-backed E2E is slower because each browser test resets the database. Controlled auth headers are local/E2E-only. Quality gates that invoke `prisma generate` should run sequentially. General-member self-confirmation is covered below browser level because the current seed lacks a linked Kai user.
