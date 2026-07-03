---
name: feature-technical-design
description: Use at Feature Technical Design after Experience Prototype and Behavior Spec / BDD / E2E; decides route/module boundaries, contracts, state/data/validation ownership, API shape, and test mapping for one behavior slice.
---

# Feature Technical Design

## Purpose

Decide feature-level implementation boundaries after the prototype and behavior contract are known. This gate must not make site-wide foundation choices unless it explicitly routes back to Project Foundation Architecture.

## Workflow

1. Read `.ai/intent/`, `.ai/domain/`, `.ai/domain-impact/`, `.ai/prototype/`, `.ai/spec/`, foundation architecture/implementation artifacts, code-understanding/impact artifacts, repo structure, manifests, tests, deployment docs, and existing architecture docs as applicable.
2. Confirm Experience Prototype and Behavior Spec / BDD / E2E are approved or explicitly accepted as risk.
3. Decide route/module boundaries, frontend/backend contract, data ownership, state ownership, validation ownership, API shape, error/loading/empty strategy, auth/permission boundary, tracking hook placement, and unit/integration/contract test mapping.
4. Produce `.ai/technical-design/<id>.md`.
5. Record TDD Implementation preconditions and release-target implications.

## Rules

- Runs after Experience Prototype and Behavior Spec / BDD / E2E.
- Must respond to final AC, BDD scenarios, E2E test design, prototype component boundaries, prototype states, accepted prototype gaps, and domain rules.
- Decide route/module boundaries, frontend/backend contract, data ownership, state ownership, validation ownership, API shape, error/loading/empty strategy, auth/permission boundary, tracking hook placement, and unit/integration/contract test mapping.
- If feature design reveals missing foundation, return to Project Foundation Architecture/Implementation instead of hiding foundation choices in feature code.
- Architecture created before prototype/BDD in a migrated project must be reviewed and updated before implementation.

## Handoff

Handoff to `tdd-implementation` for TDD Implementation.
