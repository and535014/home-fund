---
id: project
stage: learning-loop
status: active
delivery_profile: mvp
release_target: production
inputs: []
outputs:
  - .ai/workflow.md
trace_links:
  - README.md
  - package.json
  - prisma/schema.prisma
  - playwright.config.ts
  - vitest.config.ts
  - docker-compose.yml
reviewed_at: 2026-06-27
---

# Project Context

## Project Snapshot

- name: Home Family Fund
- classification: existing_with_ai
- primary users: household members managing shared family fund income, expenses, reimbursements, categories, recurring items, and reports.
- business outcome: provide a Traditional Chinese dark-theme household fund dashboard with role-aware access and traceable financial workflows.
- repository state: Next.js app with Prisma/PostgreSQL schema, Better Auth Google sign-in integration, domain modules, UI components, unit tests, and Playwright E2E foundation.
- selected stack: Next.js, React, TypeScript, Prisma, PostgreSQL, Better Auth, Vitest, Playwright, Tailwind CSS, shadcn-style UI components.
- deployment signals: Production deployment is now recorded through `.ai/deployment/production-v0.1.6-2026-06-27.md`; the current production source is tag `v0.1.6` at commit `b0a5d72f0474da4c3cc4efe23004bdd2fc0b7597`, with GitHub Actions, Vercel deployment, and maintainer-confirmed authenticated/manual smoke evidence attached. Runtime log review, backup/restore evidence, and monitoring setup remain open.

## Harness Defaults

- delivery_profile: mvp
- release_target: production
- workflow_version: ddd-website-lifecycle-v2
- migration_report: `.ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md`
- artifact id convention: kebab-case product/change ids, usually prefixed with `home-family-fund`.
- source of truth: `.ai/workflow.md` for workflow governance, `.ai/project-context.md` for project-level assumptions, stage artifacts for scoped decisions and evidence.

## Artifact Governance Defaults

- required_artifacts:
  - .ai/project-context.md
  - .ai/workflow.md
  - spec
  - implementation
  - verification
- conditional_artifacts:
  - intent
  - domain
  - code-understanding
  - impact-analysis
  - prototype
  - foundation-architecture
  - technical-design
  - release
  - deployment
  - learning
- optional_artifacts:
  - workflow-review
  - static-html-review
  - visual-model
  - graphify-refresh
- v2_artifact_dirs:
  - .ai/intent
  - .ai/domain
  - .ai/domain-impact
  - .ai/foundation-architecture
  - .ai/foundation-implementation
  - .ai/prototype
  - .ai/spec
  - .ai/technical-design
  - .ai/implementation
  - .ai/verification
  - .ai/release
  - .ai/deployment
  - .ai/learning
  - .ai/workflow-migration
  - .ai/archive
- size_budget:
  - reviewer_brief: 1 page
  - standard_artifact: 1-3 pages
  - html_review: review surface only

## Existing System Signals

- entry points: `src/app/(app)/page.tsx`, `src/app/api/auth/[...all]/route.ts`, `src/app/auth/google/route.ts`, `src/app/record-create.tsx`, `src/app/create-record-dialog.tsx`, `e2e/create-record.spec.ts`, `e2e/dashboard.spec.ts`, `e2e/recurring-reminder-confirmation.spec.ts`.
- modules or bounded context candidates: `identity-access`, `fund-ledger`, `categorization`, `recurring-schedule`, `reimbursement`, `reporting`.
- data stores: PostgreSQL through Prisma; local Docker Compose database is documented for development.
- integrations: Google OAuth through Better Auth, Prisma PostgreSQL adapter, local Playwright browser automation.
- test commands: `corepack pnpm test`, `corepack pnpm type-check`, `corepack pnpm lint`, `pnpm test:e2e`.
- build commands: `corepack pnpm build`.
- deploy commands: production deployment is documented in `docs/deployment.md` and implemented by `.github/workflows/deploy-production.yml`; `corepack pnpm db:deploy` runs inside the production workflow before Vercel deploy.

## Code Understanding Tools

- graphify:
  - status: cli_installed_no_output_detected
  - output_path: graphify-out/
  - report_path: graphify-out/GRAPH_REPORT.md
  - graph_path: graphify-out/graph.json
  - usage: optional
  - notes: `/Users/and0514/.local/bin/graphify` is available, but no `graphify-out/` directory was found during init.

## Tracking Providers

- product_analytics_provider: unknown
- error_monitoring_provider: unknown
- logging_provider: Vercel runtime logs expected, ownership/evidence pending
- feedback_channels: unknown
- notes: production deployment `v0.1.6` has GitHub Actions run, Vercel deployment URL, and maintainer-confirmed authenticated/manual smoke evidence in `.ai/deployment/production-v0.1.6-2026-06-27.md`; production learning signals are recorded in `.ai/learning/refund-page-production-v0.1.6.md`; monitoring provider setup, Vercel runtime log review, and backup/restore evidence remain open operational follow-ups.

## Constraints

- hard constraints: UI copy is Traditional Chinese; interface is dark-theme first; Google sign-in is required before household access; production deployment must remain tag-based and auditable.
- non-goals: automatic production OAuth E2E, full monitoring instrumentation, automated database rollback, and hosted preview remain out of scope unless a new intent selects them.
- compliance or security notes: E2E current-member override is guarded by `NODE_ENV !== "production"` and an explicit test header; production Google OAuth and Better Auth secrets remain required for safe operation.
- operational assumptions: local development uses pnpm, Prisma generation before checks, and Docker/Neon-compatible PostgreSQL connection strings.

## Next Step

- latest_completed_slice: production learning loop for `v0.1.6` refund page release recorded in `.ai/learning/refund-page-production-v0.1.6.md`.
- active_change: production release summary and optional compression
- recommended_resume_gate: Artifact Compression after review approval, unless monitoring/backup/mobile/refund-correction follow-up is selected as active work.
- recommended_next_skill: artifact-compression for compact release summary; learning-loop only if production learning signals need amendment.
- required input: `.ai/learning/refund-page-production-v0.1.6.md`, `.ai/deployment/production-v0.1.6-2026-06-27.md`, `.ai/release/refund-page-production-readiness.md`, `.ai/verification/refund-page.md`, `.ai/implementation/refund-page.md`, `.ai/domain/home-family-fund.md`, `README.md`, `docs/deployment.md`, `.github/workflows/ci.yml`, `.github/workflows/deploy-production.yml`, `package.json`, `prisma.config.ts`, `prisma/schema.prisma`, and `.ai/workflow.md`.
- reason: Production deployment and learning signals are recorded for tag `v0.1.6`; artifact compression can summarize the completed release while preserving monitoring, backup/PITR, and runtime-log gaps as open operational follow-ups.
