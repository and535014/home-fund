# Repository Agent Notes

<!-- DDD-WEBSITE-WORKFLOW:START -->
## DDD Website Workflow

- workflow_version: ddd-website-lifecycle-v2
- delivery_profile: mvp
- release_target: local_dev
- workflow_source: `.ai/workflow.md`
- project_context: `.ai/project-context.md`
- migration_report: `.ai/workflow-migration/migration-v2-home-family-fund-2026-06-18.md`
- policy: Preserve legacy `.ai` artifacts in place; do not delete, rename, or bulk rewrite completed work solely for v2 naming.

### Current Resume Point

- latest_completed_slice: reimbursement settlement UI
- recommended_resume_gate: Experience Prototype
- recommended_next_skill: experience-design
- required_input: `.ai/stories/story-mvp-hardening-recurring-reminder-confirmation-ui.md`

### Local Quality Gates

Run these sequentially because project scripts each invoke `prisma generate`:

1. `pnpm type-check`
2. `pnpm lint`
3. `pnpm test`
4. Targeted E2E as needed, for example `pnpm test:e2e -- e2e/reimbursement-settlement.spec.ts`

<!-- DDD-WEBSITE-WORKFLOW:END -->
