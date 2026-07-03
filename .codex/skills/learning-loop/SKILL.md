---
name: learning-loop
description: Use at Learning Loop after release readiness or production release execution to define post-release metrics, feedback, analytics/monitoring maturity, review cadence, and follow-up decisions tied to intent, domain outcomes, BDD, verification, and release risks.
---

# Learning Loop

## Purpose

Close the loop after target-aware release readiness or production release execution by defining how the team will learn whether the shipped website behavior produced the intended user and business outcome.

## Workflow

1. Read release readiness, production deployment record if present, verification, implementation, Behavior Spec, prototype, intent, domain and domain-impact artifacts, project context, and existing analytics or observability docs.
2. Identify release target, delivery profile, intended outcome, accepted risks, tracking maturity, and existing providers.
3. Define post-release metrics and signals: reach, activation/completion, funnel/drop-off, domain events, UX state exposure, operational health, web performance, SEO/acquisition, retention/repeat use, and guardrails where relevant.
4. Define fallback tracking when no tool exists: manual feedback, logs, smoke checks, or lightweight events.
5. Produce `.ai/learning/<id>.md`. Legacy `.ai/post-release/<id>.md` may be referenced for compatibility.

## Rules

- Start from learning questions and release risks, not from a preferred analytics tool.
- MVP may use manual, log-based, or lightweight tracking with explicit risks.
- Production should identify product analytics or approved alternative, error monitoring, logging, feedback channels, review cadence, and follow-up decision criteria.
- Link every signal to intent, domain event, BDD outcome, acceptance criterion, or release risk.

## Handoff

Handoff to `artifact-compression` after learning signals are recorded and the release/iteration is ready to be summarized. If active follow-up work is identified before compression, route to Intent Intake instead.
