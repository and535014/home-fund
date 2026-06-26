---
id: project
stage: release-execution
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
reviewed_at: 2026-06-26
---

# Project Context

## Project Snapshot

- name: Home Family Fund
- classification: existing_with_ai
- primary users: household members managing shared family fund income, expenses, reimbursements, categories, recurring items, and reports.
- business outcome: provide a Traditional Chinese dark-theme household fund dashboard with role-aware access and traceable financial workflows.
- repository state: Next.js app with Prisma/PostgreSQL schema, Better Auth Google sign-in integration, domain modules, UI components, unit tests, and Playwright E2E foundation.
- selected stack: Next.js, React, TypeScript, Prisma, PostgreSQL, Better Auth, Vitest, Playwright, Tailwind CSS, shadcn-style UI components.
- deployment signals: Production deployment is now recorded through `.ai/deployment/production-v0.1.2-2026-06-26.md`; the current assumed production source is tag `v0.1.2` at commit `9358ca8f6c44b292f9906f7d3c5602067075c66a`, pending production URL and smoke evidence confirmation.

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
- notes: production deployment is recorded, but post-release learning signals, monitoring provider, production URL, GitHub Actions run URL, Vercel deployment URL, and manual smoke results still need to be attached.

## Constraints

- hard constraints: UI copy is Traditional Chinese; interface is dark-theme first; Google sign-in is required before household access; production deployment must remain tag-based and auditable.
- non-goals: automatic production OAuth E2E, full monitoring instrumentation, automated database rollback, and hosted preview remain out of scope unless a new intent selects them.
- compliance or security notes: E2E current-member override is guarded by `NODE_ENV !== "production"` and an explicit test header; production Google OAuth and Better Auth secrets remain required for safe operation.
- operational assumptions: local development uses pnpm, Prisma generation before checks, and Docker/Neon-compatible PostgreSQL connection strings.

## Next Step

- latest_completed_slice: production deployment status recorded in `.ai/deployment/production-v0.1.2-2026-06-26.md`.
- active_change: production deployment evidence completion
- recommended_resume_gate: Learning Loop after production URL, GitHub Actions run, Vercel deployment URL, smoke results, backup/restore evidence, and monitoring/log review are attached.
- recommended_next_skill: learning-loop for production monitoring and feedback; release-execution only if deployment evidence needs to be amended or another production tag is deployed.
- required input: `.ai/deployment/production-v0.1.2-2026-06-26.md`, `.ai/intent/github-actions-vercel-neon-deployment.md`, `.ai/release/github-actions-vercel-neon-deployment-readiness.md`, `.ai/technical-design/github-actions-vercel-neon-deployment.md`, `.ai/implementation/github-actions-vercel-neon-deployment.md`, `.ai/verification/github-actions-vercel-neon-deployment.md`, `.ai/release/home-family-fund-local-dev-readiness.md`, `.ai/domain/home-family-fund.md`, `README.md`, `docs/deployment.md`, `.github/workflows/ci.yml`, `.github/workflows/deploy-production.yml`, `package.json`, `prisma.config.ts`, `prisma/schema.prisma`, and `.ai/workflow.md`.
- reason: Production deployment has been reported complete and is recorded as tag `v0.1.2` on `main`, but live evidence is still incomplete. The next project-management work should close evidence gaps rather than assume OAuth, role permissions, monitoring, and backup posture are fully proven.
