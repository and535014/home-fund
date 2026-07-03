---
name: project-foundation-implementation
description: Use at Project Foundation Implementation / Init after Project Foundation Architecture; scaffolds or updates the runnable site foundation, component library setup, app shell, routing baseline, lint/test/e2e baseline, and baseline commands.
---

# Project Foundation Implementation / Init

## Purpose

Establish the runnable site foundation immediately after Project Foundation Architecture. This gate scaffolds or updates the app baseline; it does not implement behavior slices.

## Workflow

1. Read `.ai/foundation-architecture/<id>.md`, `.ai/workflow.md`, `.ai/project-context.md`, and repo manifests/config.
2. Select the smallest foundation baseline item needed to make the next Experience Prototype possible.
3. Scaffold or update the app shell, routing baseline, layout baseline, component library setup, foundation components/tokens, lint/format config, unit/component/integration/E2E config, and baseline commands.
4. Run the relevant foundation checks.
5. Produce `.ai/foundation-implementation/<id>.md`.

## Rules

- Required after Project Foundation Architecture for new projects, migrations, rewrites, or missing foundations.
- Scaffold the app and establish app shell, routing baseline, layout baseline, lint/format config, unit/component/integration/E2E config, prototype host, selected component library setup, foundation components/tokens, and baseline commands.
- Verify dev/build/lint/test/e2e baseline where supported by the selected stack.
- Do not proceed to Experience Prototype until the production-stack prototype host, component library setup, foundation component path, styling/token path, and baseline commands are usable, or until blockers/accepted risks are recorded.
- Do not implement feature behavior beyond what is required for the foundation baseline.

## Handoff

Handoff to `experience-prototype`.
