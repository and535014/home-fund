---
name: tdd-implementation
description: Use at TDD Implementation after Behavior Spec / BDD / E2E and Feature Technical Design; writes or enables tests first, evolves the real frontend slice into production behavior, and records implementation evidence without expanding scope.
---

# TDD Implementation

## Purpose

Deliver one behavior slice by writing or enabling tests first, then implementing only the traced behavior.

## Workflow

1. Read `.ai/spec/<id>.md`, `.ai/technical-design/<id>.md`, `.ai/prototype/<id>.md`, domain/domain-impact artifacts, and foundation artifacts.
2. Select the smallest behavior slice with traceable AC, BDD scenario, or test plan item.
3. Write or enable the required test first.
4. Implement the minimum code needed.
5. Run the relevant commands.
6. Refactor only after checks pass.
7. Produce `.ai/implementation/<id>.md`.

## Rules

- Requires Behavior Spec / BDD / E2E and Feature Technical Design unless explicitly accepted as risk.
- Write or enable tests first.
- Evolve the production-stack prototype into production UI and behavior; close or record accepted prototype gaps.
- Do not add behavior without a traceable AC, BDD scenario, or test plan item.
- If implementation reveals a domain, prototype, behavior spec, foundation, or architecture gap, stop and update the owning upstream artifact.

## Handoff

Handoff to `verification`.
