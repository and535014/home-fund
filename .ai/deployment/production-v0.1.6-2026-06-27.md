---
id: deployment-production-v0.1.6-2026-06-27
stage: release-execution
status: complete_with_open_operational_gaps
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: production
inputs:
  - user_report:2026-06-27-production-deployed-successfully
  - .ai/release/refund-page-production-readiness.md
  - .ai/verification/refund-page.md
  - .ai/implementation/refund-page.md
  - .github/workflows/deploy-production.yml
  - docs/deployment.md
  - package.json
outputs:
  - production_deployment_status
  - deployment_source_record
  - workflow_evidence
  - smoke_result_record
  - rollback_path
  - unresolved_production_risks
trace_links:
  - .ai/intent/refund-page.md
  - .ai/domain-impact/refund-page.md
  - .ai/spec/refund-page.md
  - .ai/technical-design/refund-page.md
  - .ai/implementation/refund-page.md
  - .ai/verification/refund-page.md
  - .ai/release/refund-page-production-readiness.md
  - .github/workflows/deploy-production.yml
  - docs/deployment.md
reviewed_at: 2026-06-27
---

# Production Deployment v0.1.6

## Deployment Status

- final_status: deployed_to_production_with_open_operational_gaps
- production_release_target: production
- deployment_record_type: github_actions_vercel_neon_release_execution_record
- deployment_date_recorded: 2026-06-27
- deployed_version: `v0.1.6`
- package_version: `0.1.6`
- deployment_source: immutable production tag
- production_workflow: `.github/workflows/deploy-production.yml`
- github_actions_run: `https://github.com/and535014/home-fund/actions/runs/28284994733`
- production_url: `https://home-fund-yt.vercel.app`
- vercel_deployment_url: `https://home-fund-5dct2idcq-ythsiao.vercel.app`
- vercel_inspect_url: `https://vercel.com/ythsiao/home-fund/9YVrirLBZkvxPbv4HJdfoZ4LuHrm`
- production_alias: `https://home-fund-yt.vercel.app`

The maintainer reported that production deployment succeeded. Codex verified GitHub Actions evidence for the production deployment run and recorded the remaining manual smoke and observability gaps below.

## Deployment Source

Repository evidence:

- release PR: `https://github.com/and535014/home-fund/pull/18`
- release PR status: merged at `2026-06-27T09:18:24Z`
- release PR merge commit: `b0a5d72f0474da4c3cc4efe23004bdd2fc0b7597`
- release tag: `v0.1.6`
- tag target: `b0a5d72f0474da4c3cc4efe23004bdd2fc0b7597`
- branch containing release: `main`
- versioning action: `package.json` bumped from `0.1.5` to `0.1.6`

Release scope represented by the approved production readiness artifact:

- Deploy the authenticated `/refunds` route.
- Add home `待退款` entry linking to `/refunds?month=<month>`.
- Add desktop `退款` navigation entry below `搜尋`.
- Keep mobile bottom tab navigation without `退款`.
- Ship month/member-scoped refund page read models, shared detail dialogs, selection summary, and shared batch refund validation.

Not represented as production-ready by this record:

- `.ai/release/home-dashboard-record-tabs-yearly-trend-production-readiness.md` remains `blocked`; this deployment record does not override that gate.

## Workflow Evidence

GitHub Actions run `28284994733`:

- workflow: `Deploy Production`
- event: `push`
- head branch/tag: `v0.1.6`
- head SHA: `b0a5d72f0474da4c3cc4efe23004bdd2fc0b7597`
- created at: `2026-06-27T09:19:11Z`
- completed at: `2026-06-27T09:21:30Z`
- conclusion: `success`

Successful jobs:

- `Resolve version`
- `Deploy Production`

Successful production steps:

- checkout `refs/tags/v0.1.6`
- install dependencies
- `corepack pnpm db:validate`
- `corepack pnpm type-check`
- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm db:deploy`
- pull Vercel production environment
- build Vercel production artifact
- deploy Vercel production artifact
- smoke production deployment

Build evidence:

- Vercel production artifact build completed successfully.
- Route table included dynamic `/refunds`.
- Vercel deployment completed with `Ready in 19s`.

Migration evidence:

- `corepack pnpm db:deploy` completed before Vercel deploy.
- The refund page production readiness artifact expected no new schema migration for this feature.

## Smoke Result

Automated workflow smoke passed:

- `curl --fail --location --max-time 30 "$DEPLOYMENT_URL/login"`
- `curl --fail --location --max-time 30 "$DEPLOYMENT_URL/favicon.ico"`

Manual smoke reported by maintainer:

- production deployment succeeded.
- production entry URL is `https://home-fund-yt.vercel.app`.
- Google sign-in starts from `https://home-fund-yt.vercel.app`.
- Admin member can sign in and reach the dashboard.
- Logout returns to login.
- Non-admin member cannot access admin-only routes.
- Home `待退款` block opens `/refunds?month=<current month>`.
- Desktop sidebar shows `退款` below `搜尋`.
- Mobile bottom tab bar does not show `退款`.
- Authenticated member can open `/refunds`.
- Member tabs, unpaid expense list, refund record list, shared detail dialogs, and selection summary behave as expected.
- Cross-member selection warns and disables confirmation.
- Main dashboard and search views can read production data.
- No obvious Prisma or server error was observed during manual production smoke.
- Vercel runtime log review was not tested in this smoke pass.
- Neon backup/restore or point-in-time recovery evidence was not tested in this smoke pass.
- Monitoring/error reporting provider is not configured.

Remaining evidence before treating this release as fully audited:

- If safe production data exists, a finance-capable actor completes one same-member batch refund and verifies no double-counting.
- Vercel runtime logs show no repeated production errors.
- Neon backup/restore or point-in-time recovery path is verified.
- Monitoring/error reporting decision is made.

## Rollback Path

App rollback:

- Use Vercel rollback to the previous known-good deployment, or redeploy a previous known-good immutable tag through `Deploy Production`.
- The immediate previous production tag is `v0.1.5`.

Database rollback:

- No refund-page schema migration was expected for this release.
- If a production database issue appears, use Neon backup/restore, point-in-time recovery, or forward migration.
- Do not treat redeploying an older app tag as database rollback.

Forward-fix path:

- If `/refunds` fails while existing record/search reimbursement flows remain healthy, ship a hotfix tag that hides the desktop `退款` navigation entry and home link while preserving existing settlement behavior.

## Unresolved Production Risks

- The production alias was redacted in GitHub logs; the maintainer confirmed `https://home-fund-yt.vercel.app` as the production entry URL.
- Codex did not independently perform browser-based authenticated production smoke; authenticated smoke evidence is recorded from maintainer report.
- Vercel runtime log review is not attached.
- Production backup/restore or point-in-time recovery evidence is not attached.
- Monitoring/error reporting provider is not configured.
- No preview/staging environment exists by accepted MVP policy, so this was the first hosted deployment of the refund page.

## Review Gate

- decision: record_successful_production_deployment_with_open_operational_gaps
- deployment_executed_by: GitHub Actions after tag push and production workflow approval path
- production_evidence_status: workflow_evidence_complete_maintainer_smoke_passed_operational_gaps_open
- accepted_risks:
  - No preview/staging release target was used before production.
  - Same-member production refund mutation smoke was skipped unless safe production data exists.
  - Runtime log review, backup/restore evidence, and monitoring provider setup remain open operational gaps rather than completed checks.
- recommended_next_gate: Artifact Compression after `.ai/learning/refund-page-production-v0.1.6.md` review, unless a follow-up is selected as active work.
