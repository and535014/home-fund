---
id: project
stage: init
status: active
delivery_profile: mvp
release_target: local_dev
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
reviewed_at: 2026-06-07
---

# Project Context

## Project Snapshot

- name: Home Family Fund
- classification: existing_with_ai
- primary users: household members managing shared family fund income, expenses, reimbursements, categories, recurring items, and reports.
- business outcome: provide a Traditional Chinese dark-theme household fund dashboard with role-aware access and traceable financial workflows.
- repository state: Next.js app with Prisma/PostgreSQL schema, Better Auth Google sign-in integration, domain modules, UI components, unit tests, and Playwright E2E foundation.
- selected stack: Next.js, React, TypeScript, Prisma, PostgreSQL, Better Auth, Vitest, Playwright, Tailwind CSS, shadcn-style UI components.
- deployment signals: Docker Compose for local PostgreSQL, README references Vercel/Neon as future deployment targets, no deploy readiness artifact yet.

## Harness Defaults

- delivery_profile: mvp
- release_target: local_dev
- artifact id convention: kebab-case product/change ids, usually prefixed with `home-family-fund`.
- source of truth: `.ai/workflow.md` for workflow governance, `.ai/project-context.md` for project-level assumptions, stage artifacts for scoped decisions and evidence.

## Artifact Governance Defaults

- required_artifacts:
  - .ai/project-context.md
  - .ai/workflow.md
  - story
  - verification-design
  - implementation
  - verification
- conditional_artifacts:
  - idea
  - ddd
  - code-understanding
  - impact-analysis
  - experience-design
  - architecture
  - deploy
  - post-release
- optional_artifacts:
  - workflow-review
  - static-html-review
  - visual-model
  - graphify-refresh
- size_budget:
  - reviewer_brief: 1 page
  - standard_artifact: 1-3 pages
  - html_review: review surface only

## Existing System Signals

- entry points: `src/app/page.tsx`, `src/app/api/auth/[...all]/route.ts`, `src/app/auth/google/route.ts`, `src/app/records/new/page.tsx`, `e2e/home.spec.ts`.
- modules or bounded context candidates: `identity-access`, `fund-ledger`, `categorization`, `recurring-schedule`, `reimbursement`, `reporting`.
- data stores: PostgreSQL through Prisma; local Docker Compose database is documented for development.
- integrations: Google OAuth through Better Auth, Prisma PostgreSQL adapter, local Playwright browser automation.
- test commands: `corepack pnpm test`, `corepack pnpm type-check`, `corepack pnpm lint`, `pnpm test:e2e`.
- build commands: `corepack pnpm build`.
- deploy commands: `corepack pnpm db:deploy` exists; production deployment workflow is not yet documented in `.ai/deploy/`.

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
- logging_provider: unknown
- feedback_channels: unknown
- notes: define during deploy-readiness or post-release tracking before production release.

## Constraints

- hard constraints: UI copy is Traditional Chinese; interface is dark-theme first; Google sign-in is required before household access; local MVP target is `local_dev`.
- non-goals: production OAuth smoke, production monitoring, backup/restore, and release rollback are not covered by init.
- compliance or security notes: E2E current-member override is guarded by `NODE_ENV !== "production"` and an explicit test header; production Google OAuth and Better Auth secrets remain required before deployment.
- operational assumptions: local development uses pnpm, Prisma generation before checks, and Docker/Neon-compatible PostgreSQL connection strings.

## Next Step

- recommended_next_skill: implementation-cycle
- required input: `.ai/verification-design/home-family-fund-db-backed-dashboard-e2e.md`.
- reason: verification design now defines AC, BDD scenarios, test plan, and implementation preconditions for DB-backed dashboard E2E.
