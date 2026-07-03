---
name: intent-intake
description: Use at Intent Intake when a new product/site idea, ambiguous feature intent, concrete existing-site change, content/page request, migration, rewrite, or release intent must become a lifecycle-ready intent artifact with project type, affected surfaces, scope, non-goals, success criteria, domain-discovery need, foundation need, prototype need, behavior-spec need, release target, and next gate.
---

# Intent Intake

## Purpose

Convert an early product idea or concrete website change into a concise Intent Intake artifact that can route into the redesigned DDD website lifecycle without creating a second intake skill name.

## Workflow

1. Inspect existing `.ai/intent/`, legacy `.ai/idea/`, `.ai/change/`, project docs, tickets, and repo context before asking questions.
2. Classify `project_type`: `new_project`, `existing_project`, `migration`, `rewrite`, `feature_change`, `page_change`, `content_change`, `visual_polish`, or `release_change`.
3. For existing-site changes, classify affected surfaces: routes, pages, layouts, navigation, IA, shared components, design tokens, forms, content, SEO, analytics, backend/API, data, auth, release, and learning.
4. Capture target users, problem, business outcome, success criteria, constraints, scope, non-goals, release target, and delivery profile.
5. Decide whether Domain Discovery is required.
6. Decide whether Project Foundation Architecture and Project Foundation Implementation / Init are required.
7. Decide whether Experience Prototype is required, skipped, or blocked.
8. Decide whether Behavior Spec / BDD / E2E, Feature Technical Design, Target-Aware Release, Learning Loop, or Artifact Compression are required.
9. Produce or update `.ai/intent/<intent-id>.md`. Legacy `.ai/idea/<idea-id>.md` and `.ai/change/<change-id>.md` may be used only as aliases/inputs.
10. Record unresolved assumptions explicitly instead of inventing product intent.

## Routing Rules

- Require Domain Discovery for domain behavior, policy, workflow, state transition, role/permission, payment, approval, quota, lifecycle, or cross-role collaboration.
- Require Project Foundation Architecture for new projects, migrations, rewrites, unknown stack, or missing frontend/test foundation.
- Require Project Foundation Implementation / Init immediately after required foundation architecture.
- Require Experience Prototype for user-facing website work unless explicitly skipped with accepted risk.
- Require Behavior Spec / BDD / E2E before Feature Technical Design for behavior-bearing changes.
- Require Target-Aware Release for preview/staging/production, launch changes, config/secrets, migrations, redirects, SEO/indexing, auth/permission, integrations, analytics/monitoring, rollback, or operational risk.
- Require Learning Loop when product decisions, conversion, analytics, experiments, accepted release risks, or post-launch feedback matter.
- Release target must be one of `local_dev`, `internal_demo`, `preview`, `staging`, `production`, or `unknown`.

## Output Rules

- Use Markdown with YAML frontmatter.
- Include `workflow_version: ddd-website-lifecycle-v2`, `delivery_profile`, and `release_target`.
- Include a concise `Review Gate`.
- Do not create domain, prototype, architecture, tests, or implementation decisions in this skill.

## Handoff

Handoff to the next required lifecycle gate: Domain Discovery, Project Foundation Architecture, Experience Prototype, Behavior Spec, Release, or Learning Loop depending on the routing decision.
