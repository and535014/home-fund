---
id: desktop-product-structure-layout-redesign
stage: verification
status: accepted
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/desktop-product-structure-layout-redesign.md
  - .ai/prototype/desktop-product-structure-layout-redesign.md
  - .ai/spec/desktop-product-structure-layout-redesign.md
  - .ai/technical-design/desktop-product-structure-layout-redesign.md
  - .ai/implementation/desktop-product-structure-layout-redesign.md
  - commit:d8fb50a
  - commit:d2e90e3
outputs:
  - verification_result
  - residual_risks
trace_links:
  implementation_commit:
    - d8fb50a
  evidence_commit:
    - d2e90e3
reviewed_at: 2026-06-20
---

# Desktop Product Structure Layout Redesign Verification

## Verification Result

- result: passed
- supported_release_target: local_dev
- production_readiness: not_assessed
- reason: Static checks, type checks, focused browser checks, and the full Playwright E2E suite pass after updating stale E2E coverage for the new desktop IA/layout.

## Commands And Evidence

Commands run during verification:

```sh
corepack pnpm lint
corepack pnpm type-check
corepack pnpm exec playwright test e2e/admin-category-management.spec.ts e2e/create-record.spec.ts e2e/permission-matrix.spec.ts --reporter=line
corepack pnpm test:e2e
```

Results:

- `corepack pnpm lint`: passed.
- `corepack pnpm type-check`: passed.
- targeted Playwright run for updated admin category, create-record, and permission specs: 16 passed.
- `corepack pnpm test:e2e`: 29 passed.

## Spec Alignment

| Area | Status | Evidence |
|---|---:|---|
| Top-level IA and icon-only sidebar | Pass | `dashboard-navigation.ts`, `authenticated-layout.tsx`, `authenticated-sidebar-nav.tsx`, dashboard E2E |
| Sidebar create-record entry | Pass | `record-create-sidebar-button.tsx`, `record-create.tsx`, create-record E2E |
| Page shell scroll ownership | Pass for browser behavior covered by page structure; manual visual review still useful | `PageLayout`, `AuthenticatedLayout`, settings layout |
| `/settings` redirect and settings nesting | Pass | settings route files, admin member/category E2E |
| Search/reimbursement placeholders | Pass | `/search/page.tsx`, `/reimbursements/page.tsx`, dashboard E2E |
| Reimbursement permission boundary | Pass | reimbursement placeholder E2E and direct-access redirect E2E |
| Overview dashboard regions | Pass | dashboard E2E, Recharts measurement fix |
| Month switcher dialog portal/backdrop | Pass by component structure; no screenshot artifact captured | `month-switcher.tsx`, `month-picker-dialog.tsx` |
| Expense category empty state | Pass | `ExpenseCategoryPieChart` and page-level empty state |
| Create-record modal fields and record types | Pass | create-record E2E covers income, fund expense, member expense, validation, reload |
| Recurring removal | Pass | recurring E2E removed, old recurring app/module tests removed |

## BDD / E2E Status

- E2E coverage has been updated for the approved desktop IA:
  - admin member/category management now targets `/settings/members` and `/settings/categories`;
  - create-record tests use the sidebar `新增紀錄` entry, line tabs, and custom category selector;
  - permission matrix tests preserve role constraints for general members and finance managers;
  - dashboard tests assert the new overview, placeholders, and removed recurring route.
- Removed stale E2E specs for recurring reminders and reimbursement settlement because those UI flows were intentionally removed/deferred in this slice.
- The full E2E suite now runs 29 tests and passes.

## Domain And Boundary Review

- Ledger creation rules remain owned by `ledger-record-form.ts` and `ledger-record-actions.ts`.
- Permission decisions remain owned by identity/access modules and server-side page loaders.
- Reimbursement settlement behavior is deferred; `/reimbursements` exposes only the permission-gated placeholder.
- Recurring schedule app/module behavior is removed from this slice. Database schema and seed cleanup remain out of scope and require a separate migration design if recurring is permanently dropped.
- No new foundation decisions, auth providers, or persistence models were introduced.

## Residual Risks

- Visual screenshot artifacts were not captured in this verification pass; desktop visual review is still recommended before preview/staging.
- Prisma recurring tables/enums/seeds remain present, which is acceptable for this UI/app cleanup but should be tracked if the product permanently drops recurring support.
- Search is placeholder-only by design.
- E2E uses keyboard activation for the sidebar `新增紀錄` button because the Next dev tools portal can overlap the icon-only sidebar footer in development mode; production UI is unaffected.

## Recommendation

- Proceed to Target-Aware Release only for `local_dev` readiness review.
- Do not treat this as preview/staging/production readiness until visual review, deployment config, and release risks are assessed.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirmed: the 29/29 E2E result is sufficient for local_dev verification.
  - Confirmed: screenshot visual verification and recurring DB cleanup are accepted as non-blocking local_dev risks.
- unresolved_blockers:
  - None for local_dev verification.
- recommended_next_gate:
  - Target-Aware Release
- approval_evidence:
  - User approved proceeding to Target-Aware Release after discussing residual visual and recurring-schema risks.
