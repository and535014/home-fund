---
name: verification
description: Use at Verification after implementation to run tests, review code, verify BDD/E2E, close prototype gaps, check DDD trace and technical-design alignment, and state which release target the result supports.
---

# Verification

## Purpose

Prove the implemented foundation or behavior matches the lifecycle contracts before release or learning.

## Workflow

1. Read implementation logs, Behavior Spec, Feature Technical Design, prototype artifact, domain and domain-impact artifacts, intent, foundation artifacts, and release target.
2. Run tests and checks specified by the test plan where the repo supports them.
3. Review code for correctness, maintainability, boundary alignment, and traceability.
4. Check BDD/E2E status and prototype gap closure.
5. Check domain rules and ubiquitous language against implementation.
6. Produce `.ai/verification/<id>.md`.

## Verification Rules

- Treat missing tests as a finding unless the test plan marks them manual or not applicable.
- Verify prototype gaps are closed or explicitly accepted.
- Verify the prototype was implemented in the actual frontend stack with the selected component library and project components; standalone/static HTML prototypes are a finding unless explicitly accepted as non-gate evidence.
- Verify feature code follows Feature Technical Design and does not smuggle foundation decisions.
- Verify domain behavior against Domain Discovery artifacts when present.
- State which `release_target` the verification result supports. Passing local/dev verification does not imply production readiness.
- Recommend Target-Aware Release when the target, risk, or launch scope requires it.

## Handoff

Handoff to `target-aware-release` when verification passes or risks are explicitly accepted.
