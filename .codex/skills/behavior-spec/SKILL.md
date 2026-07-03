---
name: behavior-spec
description: Use at Behavior Spec / BDD / E2E before Feature Technical Design; reconciles intent, domain discovery, interactive prototype, and UX drafts into final acceptance criteria, BDD scenarios, E2E design, fixtures, selectors, accessibility/responsive checks, and a test plan.
---

# Behavior Spec / BDD / E2E

## Purpose

Define observable behavior before technical design and implementation start. This gate converts intent, domain model, and prototype into the contract that architecture and TDD must satisfy.

## Workflow

1. Read `.ai/intent/`, `.ai/domain/`, `.ai/domain-impact/`, `.ai/prototype/`, foundation artifacts, legacy stories/experience-design/verification-design where present.
2. Confirm prototype is accepted, skipped with accepted risk, or explicitly blocked with a documented decision.
3. Finalize acceptance criteria as observable pass/fail statements.
4. Convert final AC into BDD scenarios in domain language.
5. Design E2E coverage including route, viewport, fixture/mock strategy, accessible selectors/names, expected states, responsive checks, accessibility checks, and tracking expectations.
6. Select unit, integration, contract, E2E, and manual checks.
7. Produce `.ai/spec/<spec-id>.md`. Legacy `.ai/verification-design/<id>.md` may be referenced only for compatibility.

## Rules

- Behavior Spec runs before Feature Technical Design.
- Do not drop UX acceptance criteria from prototype unless they are explicitly out of scope, superseded, or accepted as risk.
- BDD uses domain language; UI details appear only when UI behavior is the behavior under test.
- E2E design must reference prototype path, component paths, production route candidate, viewport, fixture/mocks, selectors, toast/notification expectations, accessibility, responsive, and tracking needs where relevant.
- Missing domain, prototype, or foundation details should block implementation unless the risk is explicitly accepted.

## Handoff

Handoff to `feature-technical-design` for Feature Technical Design when final AC, BDD, E2E design, and test plan are complete.
