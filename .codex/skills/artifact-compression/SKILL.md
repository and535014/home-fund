---
name: artifact-compression
description: Use after Learning Loop or at the end of a release/iteration to write a compact decision summary, preserve traceability, update workflow inventory, and keep active source-of-truth guidance clear without deleting files. This is the formal lifecycle gate before optional manual pruning.
---

# Artifact Compression

## Purpose

Convert completed lifecycle work into a compact long-term decision record. This skill is part of the formal workflow after Learning Loop. It writes the summary that future work should read first, marks what is maintained versus historical, and updates workflow inventory without deleting files.

## Workflow

1. Read `.ai/workflow.md`, `.ai/project-context.md`, active intent/domain/foundation/prototype/spec/technical-design/implementation/verification/release/learning artifacts, legacy artifacts, and git status when available.
2. Identify lifecycle scope being compressed: release, iteration, feature, migration, or abandoned work.
3. Classify artifacts as `maintained`, `active`, `summarized`, `superseded`, or `prune_candidate`.
4. Produce `.ai/archive/<archive-id>.md` using `references/archive-summary-template.md`.
5. Preserve required trace in that summary: intent, final behavior/spec, domain rules, foundation decisions, technical decisions, release target/result, accepted risks, learning outcomes, prune candidates, and commit/PR links where available.
6. Update `.ai/workflow.md` artifact inventory, active lifecycle stage, archive notes, and next lifecycle entry when allowed.
7. Recommend whether optional manual `artifact-prune` is useful. Do not run it automatically.

## Compression Rules

- Compression keeps decisions and traceability, not every intermediate detail.
- Do not delete, move, or rename files in this skill.
- Keep `.ai/` readable by making `.ai/archive/<archive-id>.md` the summary for completed work.
- Mark completed intermediate artifacts as `prune_candidate` when they can be safely removed later by manual `artifact-prune`.
- Do not compress active work, unresolved release risks, unreviewed learning outcomes, or artifacts needed for immediate implementation/verification.
- Maintained project/domain artifacts such as `.ai/domain/project.md` or `.ai/domain/<bounded-context>.md` should not become prune candidates merely because a feature is complete.
- Completed `.ai/domain-impact/<intent-id>.md` files are change-level artifacts and may become prune candidates after their decisions are summarized.
- If legal/compliance, audit, migration, security, or production incident context requires full evidence, classify those files as `maintained` and not as prune candidates.

## Handoff

End with the archive summary path, artifact classifications, workflow inventory updates, prune candidate list, and the recommended next lifecycle entry. If file deletion is desired, tell the user to explicitly request `artifact-prune`.
