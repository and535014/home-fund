---
id: release-mobile-sitewide-layout-redesign-local-dev-readiness
stage: release
status: ready_for_review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/mobile-sitewide-layout-redesign.md
  - .ai/prototype/mobile-sitewide-layout-redesign.md
  - .ai/spec/mobile-sitewide-layout-redesign.md
  - .ai/technical-design/mobile-sitewide-layout-redesign.md
  - .ai/implementation/mobile-sitewide-layout-redesign.md
  - .ai/verification/mobile-sitewide-layout-redesign.md
outputs:
  - local_dev_release_assessment
  - release_checks
  - accepted_risks
  - production_gap_list
trace_links:
  commits:
    - 8206221
    - b5dd682
  current_code:
    - package.json
    - src/app/(app)/layout.tsx
    - src/app/(app)/(home)/loading.tsx
    - src/app/(app)/loading.tsx
    - src/app/loading.tsx
    - src/components/layout/authenticated-mobile-nav.tsx
    - src/components/layout/page-loading.tsx
    - src/components/ui/dialog.tsx
reviewed_at: 2026-06-24
---

# Mobile Sitewide Layout Redesign Local Dev Readiness

## Decision

- decision: ready_for_local_dev_review_with_accepted_mobile_e2e_gap
- release_target_supported: local_dev
- production_readiness: not_ready
- rationale: The mobile layout redesign has passing type-check, lint, and focused component/unit tests, with no schema, auth, secret, integration, or server-action contract changes. It is ready for local development review, with the explicit caveat that mobile browser/E2E and real-device visual checks remain follow-up work before any stricter target.

## Included Local Dev Capabilities

| Capability | Status | Evidence |
|---|---|---|
| Mobile bottom navigation order and labels | ready for local_dev | `src/components/layout/mobile-navigation-order.ts`, focused tests |
| Search route mobile chrome exception | ready for local_dev | `AuthenticatedMobileNav` route hiding and implementation review |
| Settings global FAB hiding | ready for local_dev | `AuthenticatedMobileNav` route hiding and implementation review |
| Page-specific loading states | ready for local_dev | home/search/settings route `loading.tsx` files plus neutral root/app fallback loading |
| Repeated toast prevention for action-state forms | ready for local_dev | `useActionStateEffect` usage in member create/edit and record create flow |
| Mobile category reorder boundary state | ready for local_dev | `getCategoryMoveState` helper and focused tests |
| Shared dialog footer mobile distribution | ready for local_dev | existing `DialogFooter` behavior and focused boundary test |

## Release Checks

| Check | Command / Evidence | Status |
|---|---|---|
| Runtime scripts present | `package.json` has `dev`, `build`, `lint`, `type-check`, `test`, `test:e2e` | pass |
| Type checking | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass |
| Focused unit/component tests | `corepack pnpm test src/app/dashboard-navigation.test.ts src/components/layout/shared-layout.test.tsx src/components/layout/mobile-navigation-order.test.ts src/components/ui/dialog.test.tsx src/app/category-ordering.test.ts` | pass, 5 files / 13 tests |
| Database migration need | No Prisma schema or migration changes in this slice | not required |
| Secret/config change need | No OAuth, auth secret, database URL, or environment variable changes | not required |
| Browser E2E | Mobile-specific Playwright coverage not added in this pass | accepted local_dev gap |
| Production build | Not rerun for this release gate; no build-time routing/config changes after verification commit | deferred |

## Local Dev Release Notes

- Review URL remains the normal local dev server: `corepack pnpm dev`, then `http://localhost:3000`.
- The release target is local UI review, not hosted preview or production.
- The committed code preserves existing financial, reimbursement, category, member, auth, and permission domain contracts.
- No new dependency, drag-and-drop package, custom select package, Prisma migration, or server-side integration was introduced.
- `src/app/(app)/(home)/loading.tsx` keeps the homepage skeleton while `src/app/(app)/loading.tsx` and `src/app/loading.tsx` use neutral centered loading. This prevents route-level fallback loading from showing the wrong page skeleton.

## Accepted Local Dev Risks

- Mobile viewport behavior is verified by implementation review and focused tests, not by Playwright screenshots or real-device browser checks.
- Root horizontal overflow, hidden scrollbars, safe-area footer clipping, native select visual presentation, and dialog category-selector clipping need browser/device verification before stricter release targets.
- Admin settings mobile E2E still depends on a reliable admin-linked fixture for `/settings/members` and `/settings/categories`.
- Quality scripts that run `prisma generate` should continue to run sequentially to avoid generated-client races.

## Not Preview Or Production Ready

Preview or production readiness is blocked until these are handled:

- Mobile Playwright coverage for `/`, `/search`, `/settings/account`, and admin settings routes where fixture support exists.
- Real mobile browser smoke for iOS Safari and Android Chrome.
- Screenshot or DOM checks for no root horizontal overflow and no clipped fixed footers.
- Dialog checks for category selector selected-ring clipping and no content-level horizontal scroll.
- Native select readability check in the search filter dialog.
- Hosted target, environment variables, auth/OAuth callback settings, monitoring, logging, rollback, and smoke plan.

## Handoff

- decision: ready_for_user_local_dev_review
- recommended_next_skill: learning-loop if the mobile layout local_dev review is accepted; otherwise return to TDD Implementation for mobile E2E/browser hardening.
- next_step: User review of local_dev readiness and decide whether to accept the documented mobile E2E gap or request a follow-up E2E hardening slice.
