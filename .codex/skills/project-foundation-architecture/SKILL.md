---
name: project-foundation-architecture
description: Use at Project Foundation Architecture before prototype on new projects, migrations, rewrites, unknown stacks, or missing frontend/test foundations; decides the site-wide framework, tooling, lint, tests, routing, styling, component strategy, prototype host, commands, and CI baseline.
---

# Project Foundation Architecture

## Purpose

Decide the site-wide foundation before scaffold/init and before Experience Prototype. This gate is for project-level architecture, not feature-level design.

## Workflow

1. Read `.ai/intent/`, `.ai/domain/`, `.ai/domain-impact/`, code-understanding/impact artifacts, repo structure, manifests, tests, deployment docs, and existing architecture docs as applicable.
2. Decide or confirm framework/library, TypeScript policy, package manager, routing model, rendering model, styling/design-token strategy, component library, component strategy, lint, formatter, unit/component/integration/E2E frameworks, production-stack prototype host, app shell baseline, folder/module baseline, dev/build/test/e2e commands, and CI baseline.
3. Produce `.ai/foundation-architecture/<id>.md`.
4. Add ADR-style decisions only for meaningful choices.
5. Record Project Foundation Implementation / Init preconditions and release-target implications.

## Rules

- Required for new projects, migrations, rewrites, unknown stack, or missing frontend/test foundation.
- Decide framework/library, TypeScript policy, package manager, routing model, rendering model, styling/design-token strategy, component library, component strategy, lint, formatter, unit/component/integration/E2E frameworks, production-stack prototype host, app shell baseline, folder/module baseline, dev/build/test/e2e commands, and CI baseline.
- Do not proceed to Experience Prototype until Project Foundation Implementation / Init verifies the scaffold and commands.
- For existing projects, observe and record the current foundation instead of reselecting stack unless migration/rewrite is in scope.
- Do not hide feature-specific behavior decisions in foundation architecture; route those to Feature Technical Design.

## Handoff

Handoff to `project-foundation-implementation` for Project Foundation Implementation / Init.
