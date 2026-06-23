---
id: mobile-sitewide-layout-redesign
stage: intent-intake
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-23-mobile-layout-tabbar-fab-redesign
  - user_prompt:2026-06-23-mobile-layout-all-pages-redesign
  - user_prompt:2026-06-23-mobile-sitewide-layout-redesign
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/intent/home-family-fund.md
  - .ai/intent/desktop-product-structure-layout-redesign.md
  - .ai/intent/remove-standalone-create-record-entry.md
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  existing_intent:
    - .ai/intent/home-family-fund.md
    - .ai/intent/desktop-product-structure-layout-redesign.md
    - .ai/intent/remove-standalone-create-record-entry.md
  existing_foundation:
    - .ai/foundation-architecture/home-family-fund.md
    - .ai/prototype/web-foundation.md
  current_code:
    - src/app/(app)/layout.tsx
    - src/app/dashboard-navigation.ts
    - src/app/record-create.tsx
    - src/app/record-create-context.tsx
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-sidebar-nav.tsx
    - src/components/layout/record-create-sidebar-button.tsx
reviewed_at: 2026-06-23
---

# Sitewide Mobile Layout Redesign

## Decision Summary

- decision: awaiting_approval
- first_next_gate: Experience Prototype
- owning_skill: experience-prototype
- reason: The request restarts sitewide mobile layout design for the authenticated app and changes primary navigation and create-record action placement. This is user-facing website work, so it needs a production-stack mobile prototype before behavior spec, technical design, or implementation.

## User Request

重新重頭開始設計手機排版，主要 nav 改成 tab bar，新增按鈕改成 FAB。

Follow-up clarification: 每個頁面也要重新設計手機排版。

Scope clarification: 可以說是全站手機排版重新設計。

## Change Classification

- project_type: existing_project
- change_type: page_change
- secondary_types:
  - sitewide_mobile_redesign
  - mobile_layout_redesign
  - navigation_ia_change
  - component_change
  - visual_structure_change
  - responsive_behavior_change
- release_target: local_dev

## Affected Surfaces

| Surface | Impact |
|---|---|
| Layout shell | The sitewide mobile authenticated shell should be redesigned from first principles instead of inheriting the desktop sidebar shape. |
| Navigation and IA | Primary mobile navigation should become a bottom tab bar for the main routes allowed by access hints. |
| Create record action | The `新增紀錄` entry should become a floating action button on mobile, not a sidebar/footer button. |
| Page layouts | Every visible authenticated page should receive a sitewide mobile layout redesign, not only the app shell. |
| Shared components | Existing authenticated layout, navigation icon mapping, and record-create trigger components may need mobile-specific variants or responsive branching. |
| Page layouts | Primary and settings pages need mobile-safe spacing, scroll behavior, bottom safe-area handling, and no overlap between content, tab bar, and FAB. |
| Accessibility | Tab bar items and FAB need semantic labels, active state, focus order, and reachable touch targets. |
| Tests | Later BDD/E2E should cover mobile viewport navigation, FAB create flow, route active state, and content not being hidden behind fixed controls. |

## Current Code Signals

- `src/app/(app)/layout.tsx` mounts `RecordCreateScope` around a shared `AuthenticatedLayout`.
- `src/components/layout/authenticated-layout.tsx` currently renders a collapsible icon sidebar plus a sidebar footer create button.
- `src/components/layout/authenticated-sidebar-nav.tsx` owns icon-only navigation, active route matching, labels, and tooltips.
- `src/components/layout/record-create-sidebar-button.tsx` opens `openExpense()` from `useRecordCreate()` and is currently sidebar-shaped.
- `src/app/dashboard-navigation.ts` currently exposes `總覽`, `搜尋`, and `設定` from role-aware access hints.
- Previous desktop layout work explicitly left mobile layout out of scope.

## Scope

- Redesign the authenticated mobile app shell as part of a sitewide mobile layout reset.
- Redesign mobile layout for every visible authenticated page and page state in the current product structure.
- Replace mobile primary navigation with a bottom tab bar.
- Replace the mobile create-record entry with a FAB that opens the existing create-record flow.
- Preserve role-aware navigation visibility from the existing access hints.
- Preserve the current top-level product IA unless the next prototype reveals a mobile-specific reason to adjust labels or ordering.
- Ensure mobile content areas account for the tab bar, FAB, and device safe areas.
- Cover `總覽`, `搜尋`, `設定`, `帳號資訊`, `成員`, `分類`, and any other visible authenticated surface that exists by the time prototype starts.
- Keep Traditional Chinese UI copy and dark-theme-first direction.
- Keep desktop layout behavior stable unless a later approved prototype/spec explicitly requires shared component changes.

## Non-Goals

- Do not redesign desktop layout in this slice.
- Do not change ledger, reimbursement, category, member, auth, or permission domain rules.
- Do not change database schema, server actions, OAuth behavior, or production deployment configuration.
- Do not introduce a native mobile app.
- Do not add search, reporting, reimbursement, category, or member behavior beyond what is needed to make existing pages usable on mobile.
- Do not add new product pages solely to fill the tab bar.
- Do not add analytics, monitoring, or production release work.

## Success Criteria

- Mobile authenticated users see primary navigation as a bottom tab bar rather than a sidebar.
- Mobile tab bar exposes the approved main destinations that the user is allowed to access.
- Mobile active route state is visually clear and programmatically available.
- Mobile users who can create records see a FAB for `新增紀錄`.
- FAB opens the existing create-record dialog/sheet flow without changing ledger creation rules.
- Every visible authenticated page and major page state has an intentional mobile layout rather than a desktop layout squeezed into a mobile viewport.
- `總覽`, `搜尋`, and settings-related pages have mobile review states that show the intended arrangement of headers, filters, lists, forms, dialogs, and empty/placeholder content.
- Content remains scrollable and is not obscured by the tab bar or FAB at common mobile widths.
- Touch targets, focus order, labels, and safe-area spacing are acceptable for mobile use.
- Desktop sidebar navigation and desktop create button behavior remain unchanged.

## Domain Discovery Need

- required: false
- reason: The request changes mobile navigation and action placement only. It does not introduce new financial events, policies, permissions, reimbursement states, category rules, member lifecycle behavior, or cross-role workflow rules.

## Foundation Architecture Need

- required: false
- reason: The existing Next.js App Router, authenticated layout shell, Tailwind/shadcn-style component foundation, icon set, and Playwright/Vitest setup are sufficient. The work should reuse the observed stack and layout conventions.

## Foundation Implementation Need

- required: false
- reason: No scaffold, framework, component library, routing baseline, lint, test, or E2E foundation change is required.

## Experience Prototype Need

- required: true
- timing: next
- reason: This is a sitewide mobile UI/IA redesign across the authenticated shell and all visible pages. A production-stack prototype should make the mobile tab bar, FAB, page spacing, active state, and page-level route behavior reviewable before specs or implementation.
- prototype_scope:
  - mobile authenticated shell
  - bottom tab bar navigation
  - role-aware tab visibility
  - FAB create-record trigger
  - interaction between FAB, tab bar, and existing create-record dialog/sheet
  - mobile `總覽` layout
  - mobile `搜尋` layout
  - mobile `設定` entry layout
  - mobile `帳號資訊` layout
  - mobile `成員` management layout
  - mobile `分類` management layout
  - any additional visible authenticated page that exists before prototype work starts
  - mobile empty/placeholder states where existing behavior is not yet implemented
  - desktop unchanged baseline check

## Behavior Spec / BDD / E2E Need

- required: true
- timing: after Experience Prototype
- reason: Route navigation, active state, role-aware visibility, FAB behavior, page-specific mobile arrangements, and no-overlap mobile layout expectations should be locked before implementation.
- scenarios_to_cover:
  - Authenticated mobile user sees a bottom tab bar instead of a sidebar.
  - Authenticated mobile user can switch between visible tabs.
  - Mobile tab active state follows the current route, including nested settings routes.
  - Mobile user with create permission sees and can activate the `新增紀錄` FAB.
  - Mobile user without create permission does not see the FAB.
  - FAB opens the existing create-record flow without URL navigation.
  - Each visible authenticated page and major page state has a mobile-specific layout that keeps primary content and actions reachable.
  - Mobile settings pages keep account, members, categories, and logout flows discoverable without desktop sidebar dependence.
  - Page content remains reachable and is not hidden behind fixed bottom controls.
  - Desktop viewport still uses the existing sidebar and sidebar create button.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: The slice needs explicit component boundaries for responsive app chrome, bottom tab bar, FAB placement, sitewide page-level mobile layouts, safe-area spacing, route active matching, and create-record trigger reuse.

## Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: This changes authenticated navigation and primary action placement on mobile, so local_dev verification evidence should be refreshed.
- learning_loop_required: false
- learning_reason: This is an internal MVP mobile UX redesign without production analytics, experiment, or launch feedback channel selected.

## Open Questions

- Should the mobile tab bar include exactly the current visible top-level routes (`總覽`, `搜尋`, `設定`) or should a fourth tab be reserved for another high-frequency workflow?
- Should the FAB open the existing expense-first create flow, or should it open a record-type chooser first?
- Should `設定` nested pages keep a visible mobile subnavigation, or should settings use a stacked/detail navigation pattern on mobile?
- Should page redesign start from the currently implemented content only, or should prototype-only placeholders be allowed to show intended mobile structure for unfinished behavior?
- What minimum mobile viewport width should be treated as acceptance-blocking for this slice?

## Review Gate

- decision: awaiting_approval
- reviewer_focus:
  - Confirm the mobile redesign starts from a bottom tab bar plus FAB, while preserving desktop behavior.
  - Confirm this is a sitewide mobile layout redesign covering every visible authenticated page, not only the global shell.
  - Confirm whether the first prototype should keep the current top-level destinations or explore a different mobile tab set.
  - Confirm whether FAB default action should remain expense-first or become a create-type chooser.
- acceptance_signals:
  - Experience Prototype can start from this artifact without changing domain behavior.
  - Behavior Spec can later define mobile navigation and FAB scenarios without inventing additional product intent.
  - Technical Design can decide responsive layout/component boundaries from approved mobile IA.
- unresolved_blockers:
  - Mobile tab set and FAB default behavior need confirmation during or before Experience Prototype review.
- next_step:
  - Experience Prototype
