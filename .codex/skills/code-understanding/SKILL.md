---
name: code-understanding
description: Use as a code reality input for existing projects or migrations; maps current foundation, routes, components, tests, architecture, data flow, deployment hints, and domain language before migration, prototype, behavior spec, or technical design.
---

# Code Understanding

## Purpose

Capture current system reality so the v2 lifecycle does not invent foundation, architecture, tests, routes, or domain language.

## Workflow

1. Read `.ai/intent/`, `.ai/domain/`, legacy artifacts, repo docs, manifests, source structure, tests, schemas, and configuration.
2. Identify whether the repo is empty, scaffolded, or an existing system.
3. Map frontend framework, routing, app shell, component system, styling, lint/format, unit/integration/E2E framework, prototype host, build/dev/test commands, modules, data ownership, integrations, deployment hints, and domain-language mismatches.
4. Produce `.ai/code-understanding/<repo-or-scope-id>.md` as a legacy-compatible code reality input.
5. Record whether Project Foundation Architecture or Foundation Init is needed.

## Rules

- Describe observed facts separately from inferences.
- Do not redesign architecture or implement code.
- For empty repos, state that foundation architecture/init is required before prototype.
- Treat Graphify as optional.

## Handoff

Handoff to `workflow-migration`, `project-foundation-architecture`, `impact-analysis`, or `experience-prototype` depending on the missing gate.
