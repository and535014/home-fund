---
name: domain-understanding
description: Use at Domain Understanding when intent includes non-trivial domain behavior, policies, workflows, state transitions, roles, permissions, payments, approvals, quotas, lifecycle, or cross-role collaboration; creates or updates long-lived project or bounded-context domain model artifacts, not one file per requirement.
---

# Domain Understanding

## Purpose

Maintain the project's domain model so it can shape user experience, BDD/E2E, technical design, implementation, verification, release learning, and product metrics. Domain Understanding is persistent project knowledge, not a per-requirement document factory.

## Workflow

1. Read `.ai/intent/`, existing `.ai/domain/` artifacts, legacy `.ai/ddd/` inputs, and related product/code context.
2. Select the maintained domain artifact to update:
   - use `.ai/domain/project.md` for a small or early product with one domain model.
   - use `.ai/domain/<bounded-context>.md` when a stable bounded context exists.
   - create a new bounded-context artifact only when the language, rules, ownership, or lifecycle clearly differs from existing contexts.
3. Identify new or changed domain events first using past-tense business language.
4. For each event, capture command, actor, policy, read model, external system, data/state change, and business rule.
5. Merge durable findings into the maintained domain artifact: update ubiquitous language, event catalog, commands, policies, aggregates, bounded contexts, invariants, and open questions.
6. Produce or update `.ai/domain-impact/<intent-id>.md` using `references/domain-impact-template.md` for the active intent's domain delta.
7. Record how the domain impact must influence prototype, BDD/E2E, technical design, tests, release signals, and learning metrics.
8. Record unresolved ambiguity as questions or risks.

## Domain Impact Rules

- Commands should influence user/system actions in prototypes and BDD scenarios.
- Events should influence expected outcomes, state labels, audit/analytics signals, and learning metrics.
- Policies should influence validation, permissions, eligibility, branching states, and test cases.
- Aggregates and bounded contexts should influence data ownership, module/service boundaries, and transaction/state-transition rules.
- Ubiquitous language should be used in artifacts, tests, UI copy where appropriate, and code naming.
- Do not create one domain model artifact per feature, request, or intent. Update the maintained project/context domain model unless a genuinely new bounded context is discovered.
- Per-intent domain deltas belong in `.ai/domain-impact/<intent-id>.md`, not in the maintained domain model.
- If a prior run created per-intent domain files, preserve durable domain knowledge in `.ai/domain/project.md` or `.ai/domain/<bounded-context>.md` and keep per-intent deltas in `.ai/domain-impact/<intent-id>.md`.

## Handoff

Handoff to Foundation Plan when foundation is required; otherwise to UI Prototype for user-facing work or Behavior Spec for non-UI behavior.
