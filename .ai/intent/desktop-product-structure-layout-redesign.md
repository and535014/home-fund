---
id: desktop-product-structure-layout-redesign
stage: intent
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-20-desktop-product-structure-layout-redesign
  - /Users/and0514/Library/Application Support/CleanShot/media/media_KZGLw1cFqM/CleanShot 2026-06-20 at 14.16.33@2x.png
  - /Users/and0514/Library/Application Support/CleanShot/media/media_5HH3VuAPO6/CleanShot 2026-06-20 at 14.16.41@2x.png
  - /Users/and0514/Library/Application Support/CleanShot/media/media_z4JJGpjwAq/CleanShot 2026-06-20 at 14.21.26@2x.png
  - /Users/and0514/Library/Application Support/CleanShot/media/media_RTLLMZyepP/CleanShot 2026-06-20 at 14.25.26@2x.png
  - /Users/and0514/Library/Application Support/CleanShot/media/media_JBS20ixdjc/CleanShot 2026-06-20 at 15.10.58@2x.png
  - .ai/project-context.md
  - .ai/workflow.md
  - .ai/intent/home-family-fund.md
  - .ai/intent/remove-standalone-create-record-entry.md
outputs:
  - site_change_intake
  - lifecycle_routing_decision
trace_links:
  existing_intent:
    - .ai/intent/home-family-fund.md
    - .ai/intent/remove-standalone-create-record-entry.md
  current_code:
    - src/app/(app)/layout.tsx
    - src/app/(app)/page.tsx
    - src/app/(app)/reimbursements/page.tsx
    - src/app/(app)/recurring/page.tsx
    - src/app/(app)/(admin)/categories/page.tsx
    - src/app/(app)/(admin)/members/page.tsx
    - src/app/dashboard-navigation.ts
    - src/components/layout/authenticated-layout.tsx
    - src/components/layout/authenticated-sidebar-nav.tsx
    - src/components/layout/page-layout.tsx
reviewed_at: 2026-06-20
---

# Desktop Product Structure Layout Redesign

## Decision Summary

- decision: approved
- first_next_gate: Experience Prototype
- owning_skill: experience-prototype
- reason: The request changes the authenticated app information architecture, desktop layout shell, navigation grouping, dashboard composition, and settings structure. It is user-facing website work, so a production-stack desktop prototype should be reviewed before behavior spec, technical design, or implementation.

## User Request

重新規劃整個產品的頁面結構以及桌面版排版。手機版先不處理。新增紀錄 modal 排版已補充。

Requested pages:

- `總覽` as the home page.
- `搜尋`.
- `退款`.
- `設定`.
- `設定 > 帳號資訊`.
- `設定 > 成員`.
- `設定 > 分類`.
- `設定 > 登出`.

If any requested page is not implemented yet, create a blank placeholder page with `敬請期待` in the later implementation slice.

## Change Classification

- change_type: page_change
- secondary_types:
  - navigation_ia_change
  - layout_change
  - visual_structure_change
  - route_structure_change
  - component_change
- release_target: local_dev

## Affected Surfaces

| Surface | Impact |
|---|---|
| Routes | Add or expose authenticated routes for `搜尋`, `設定`, and `設定 > 帳號資訊`; keep existing implemented pages for `總覽`, `退款`, `分類`, and `成員` where possible. |
| Routes | Any requested route without completed behavior should render a blank `敬請期待` placeholder instead of being absent. |
| Routes | The current standalone `週期` page should be removed from the visible product structure and later implementation scope. |
| Navigation and IA | Sidebar should contain logo/app name, main navigation, and a bottom `新增紀錄` button area according to the provided sidebar wireframe. |
| Navigation and IA | `設定` becomes the entry point for account information, members, categories, and logout rather than exposing all admin pages as top-level sidebar items. |
| Layout shell | Desktop shell uses a persistent left sidebar plus a page header band above page content. |
| Dashboard page | Desktop `總覽` should follow the provided grid: month switcher header, summary metrics, income/expense trend, pending reimbursements, expense-category pie chart, and monthly records panel. |
| Settings page | Desktop `設定` should use a left settings subnavigation panel with avatar/display name, category management, member management, and logout, plus a large content area. |
| Create record modal | The `新增紀錄` modal should follow the provided layout: modal header; record type tabs for member expense, income, and fund expense; category selection grid; amount field; name field; member/date split row; notes area; cancel/add action row. |
| Responsive behavior | Mobile layout is out of scope for this intent and should not drive prototype acceptance. |
| Tests | Later BDD/E2E should cover desktop navigation, route availability/placeholders, dashboard structure, and settings subnavigation. |

## Current Code Signals

- `src/app/(app)/layout.tsx` wraps authenticated pages in `AuthenticatedLayout` with account data and visible navigation items.
- `src/components/layout/authenticated-layout.tsx` currently renders a shadcn-style sidebar with app brand, navigation, avatar/display name, and logout in the footer.
- `src/app/dashboard-navigation.ts` currently exposes `總覽`, `退款`, `週期`, `分類`, and `成員` based on access hints.
- Existing authenticated routes include `/`, `/reimbursements`, `/recurring`, `/categories`, and `/members`.
- No current authenticated `搜尋`, `設定`, or `帳號資訊` pages were observed in `src/app`.
- `src/components/layout/page-layout.tsx` owns page header/content scaffolding for existing pages.

## Scope

- Rework authenticated desktop IA to the requested page structure.
- Add missing requested routes as implementation placeholders where behavior is not yet designed.
- Use `/settings`, `/settings/account`, `/settings/members`, and `/settings/categories` for the settings route structure unless a later approved design changes it.
- Update sidebar structure to include brand, navigation, and bottom `新增紀錄` entry area.
- Rework desktop `總覽` layout to match the provided dashboard composition at a structural level.
- Rework desktop `設定` layout to include settings subnavigation and content region.
- Keep Traditional Chinese UI copy.
- Preserve existing dark-first visual direction.
- Preserve existing auth and role-aware visibility rules unless a later approved spec changes them.

## Non-Goals

- Do not implement or redesign mobile layout in this slice.
- Do not change新增紀錄 domain behavior beyond the approved modal layout structure.
- Do not change ledger, reimbursement, category, recurring, member, or auth domain rules.
- Do not change database schema, OAuth behavior, or production deployment configuration.
- Do not add analytics, monitoring, or production release work.
- Do not solve search behavior beyond route/page availability unless explicitly approved in a later gate.
- Do not keep the existing `週期` page as a visible product surface.

## Success Criteria

- Desktop authenticated shell has a persistent sidebar and page header/content layout matching the supplied structure.
- Sidebar exposes the requested top-level IA: `總覽`, `搜尋`, `退款`, and `設定`.
- Settings exposes `帳號資訊`, `成員`, `分類`, and `登出` as settings-level actions or destinations.
- Missing requested pages render a minimal `敬請期待` placeholder until their behavior is specified.
- Desktop `總覽` uses the requested dashboard layout regions: month switcher, monthly balance, monthly expenses, monthly income, trend chart, pending reimbursements, category pie chart, and monthly records.
- Desktop `設定` uses the requested three-column structure: global sidebar, settings subnavigation, and page content.
- `新增紀錄` modal follows the supplied structure with type tabs, category grid, amount, name, member/date, notes, cancel, and add regions.
- Existing role-aware access remains respected for member/category management and logout.
- Mobile behavior is not treated as acceptance-blocking for this slice.

## Domain Discovery Need

- required: false
- reason: The request reorganizes product IA and desktop layout. It does not introduce new financial events, policies, permissions, reimbursement states, category rules, or member lifecycle behavior.

## Foundation Architecture Need

- required: false
- reason: The existing Next.js App Router, authenticated layout shell, Tailwind/shadcn-style component foundation, and Playwright/Vitest test foundation are sufficient. The work should reuse the observed stack rather than selecting new foundation.

## Foundation Implementation Need

- required: false
- reason: No scaffold, framework, component library, lint/test setup, or routing baseline replacement is required.

## Experience Prototype Need

- required: true
- timing: next
- reason: This is a broad user-facing desktop layout and IA redesign. A production-stack prototype should prove route structure, sidebar grouping, dashboard composition, settings subnavigation, and placeholder behavior before specs or implementation.
- prototype_scope:
  - desktop authenticated shell
  - top-level sidebar IA
  - `總覽` dashboard structure
  - `搜尋` placeholder
  - `退款` page placement in new shell
  - `設定` shell and settings subnavigation
  - `帳號資訊` placeholder or profile summary
  - `成員` placement under settings
  - `分類` placement under settings
  - `登出` placement under settings
  - `新增紀錄` modal structure from the supplied wireframe

## Behavior Spec / BDD / E2E Need

- required: true
- timing: after Experience Prototype
- reason: Route availability, navigation visibility, settings grouping, placeholders, dashboard regions, and role-aware admin links should be locked before implementation.
- scenarios_to_cover:
  - Authenticated desktop user sees `總覽`, `搜尋`, `退款`, and `設定` in the primary sidebar.
  - Authenticated desktop user can open requested pages and sees `敬請期待` on unimplemented pages.
  - Settings exposes account information, members, categories, and logout in the settings area.
  - Users without admin rights do not gain unauthorized member/category management access.
  - Dashboard renders all approved desktop regions for the selected month.
  - The `新增紀錄` sidebar button opens a modal structure matching the supplied wireframe.

## Feature Technical Design Need

- required: true
- timing: after Behavior Spec / BDD / E2E
- reason: The slice needs explicit route/module boundaries for settings nesting, placeholder route ownership, sidebar data/access hints, and the treatment of the existing recurring page that is no longer listed in primary IA.

## Release And Learning Need

- target_aware_release_required: true
- release_scope: local_dev readiness refresh after verification
- reason: This changes authenticated navigation and route availability, so local_dev verification evidence should be refreshed.
- learning_loop_required: false
- learning_reason: This is an internal MVP IA/layout adjustment without production analytics, experiment, or launch feedback channel selected.

## Open Questions

- Resolved: the existing `週期` page should be removed from the new product structure.
- Resolved: settings should use `/settings`, `/settings/account`, `/settings/members`, and `/settings/categories`.
- Should `搜尋` be a blank placeholder only for now, or should the prototype include visible search inputs without real behavior?
- Should `設定 > 帳號資訊` show existing avatar/display name data now, or remain `敬請期待` until account-edit behavior is specified?
- Resolved: `新增紀錄` should use the supplied modal layout structure in prototype and later implementation planning.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm this intent captures the requested desktop-only IA and layout scope.
  - Confirmed: remove the existing `週期` surface from the new page structure.
  - Confirmed: settings URL nesting should follow `/settings/*`.
  - Confirm that missing pages should ship as `敬請期待` placeholders in the implementation slice.
- acceptance_signals:
  - Experience Prototype can start from this artifact without changing domain behavior.
  - Behavior Spec can later define route/navigation scenarios without inventing additional product intent.
  - Technical Design can decide route boundaries and access handling from approved IA.
- unresolved_blockers:
  - None for moving to Experience Prototype.
- next_step:
  - Experience Prototype
