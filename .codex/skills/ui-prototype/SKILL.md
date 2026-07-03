---
name: ui-prototype
description: Use at UI Prototype for user-facing website work; designs UI/UX, IA, task flows, states, copy, accessibility, and creates or updates a real production-stack frontend slice on the intended route/page/component path using the actual project framework, component library, and project components, with path, run command, review URL, fixtures, responsive baseline, focus behavior, and known gaps.
---

# UI Prototype

## Purpose

Turn intent and domain behavior into a reviewable, interactive website experience before Behavior Spec, Technical Plan, and Implementation. This prototype is real frontend slicing work using the selected project stack, component library, and actual project components on the intended route/page/component path; standalone HTML, throwaway static mockups, and isolated prototype folders do not satisfy this gate.

## Workflow

1. Read `.ai/intent/`, `.ai/domain/`, `.ai/domain-impact/`, foundation artifacts, existing UI docs, routes, components, and legacy experience artifacts.
2. Confirm Foundation Setup is complete for new projects or that an existing prototype host is available.
3. Identify primary user goals, task flow, IA, screen/route candidates, states, content constraints, accessibility, and UX risks.
4. Create or update a repo-based interactive prototype as a real page/component slice on the intended app route, route group, page, layout, or shared component path.
5. Record prototype evidence in `.ai/prototype/<prototype-id>.md`.
6. Draft UX acceptance criteria and E2E scenario candidates as inputs to Behavior Spec.
7. Stop for user review before committing prototype code or artifacts.
8. Record accepted gaps and unresolved blockers after review.

## Prototype Rules

- User-facing website work requires a production-stack prototype unless explicitly skipped with accepted risk.
- Prototype must be implemented with the selected frontend framework, routing/rendering model, styling/design tokens, component library, and actual project components or foundation components.
- Prototype code should live where the real UI is expected to live: the intended route/page/layout path, route-local components, shared feature components, or selected design-system/component-library paths.
- Do not default to `src/app/prototypes`, `/prototypes`, a generic sandbox route, Storybook-only stories, or a component playground as the primary prototype output.
- Sandbox routes, Storybook, and component playgrounds are allowed only as secondary review surfaces or when the user explicitly accepts that the current gate is exploratory and not yet real slicing.
- Prototype must include path, component paths, component library usage, run command, review URL or local route, fixture/mock strategy, states covered, responsive baseline, basic keyboard/focus behavior, accessibility notes, and known gaps.
- Prototype should cover the main user flow, normal/loading/empty/error/validation/permission/success states where relevant, and the key responsive breakpoint.
- Prototype may use fixture/mock data. It must not pretend API/backend integration exists when it does not.
- Standalone HTML files, static mockups, screenshots, Figma-only designs, throwaway pages, or isolated prototype-only folders that do not represent the intended production route/component structure do not satisfy this gate. They may be linked only as inspiration or legacy evidence.
- Components created for the prototype should be named and structured as production candidates from the start, even if data is mocked and behavior is incomplete.
- For new projects, do not create prototype until foundation init has runnable dev/lint/test/e2e baseline.
- After the prototype is complete, do not commit prototype code or `.ai/prototype/` artifacts until the user has reviewed and explicitly approved the prototype.

## Handoff

Handoff to `behavior-spec` for Behavior Spec / BDD / E2E when prototype is accepted, skipped with risk, or blocked with a clear decision.
