---
name: impact-analysis
description: Use as an early feasibility and impact input for existing projects or migrations; compares intent/domain with current code reality and identifies affected foundation, prototype, behavior spec, technical design, tests, release, and learning risks.
---

# Impact Analysis

## Purpose

Identify what the desired website change affects before prototype, behavior spec, technical design, or implementation.

## Workflow

1. Read `.ai/intent/`, `.ai/domain/`, `.ai/domain-impact/`, code-understanding, legacy artifacts, and repo context.
2. Compare desired domain or website behavior with current implementation reality.
3. Identify affected routes, components, design tokens, forms, backend/API, data ownership, integrations, tests, prototype host, release target, and learning signals.
4. Produce `.ai/impact-analysis/<scope-id>.md` as a legacy-compatible feasibility/impact input.
5. Mark unclear or high-risk impacts as blockers for the next gate.

## Rules

- Do not replace Project Foundation Architecture or Feature Technical Design.
- Use impact analysis to surface early feasibility and backfill needs.
- For empty repos, impact is mainly foundation and delivery risk.

## Handoff

Handoff to the first missing gate: Project Foundation Architecture, Experience Prototype, Behavior Spec, or Feature Technical Design.
