---
name: artifact-prune
description: Use only when the user explicitly asks to prune/delete completed DDD website workflow artifacts; performs git-backed safety checks, keeps maintained and active files plus archive summaries, and deletes completed intermediate .ai artifacts listed as prune candidates.
---

# Artifact Prune

## Purpose

Delete completed intermediate `.ai` artifacts after compression, using git as the long-term full-fidelity record. This skill is manual and is not part of the default lifecycle. Use it only when the user explicitly asks to prune or delete completed workflow files.

## Workflow

1. Confirm the user explicitly requested pruning/deletion. Do not infer this from normal workflow progress.
2. Read `.ai/workflow.md`, `.ai/project-context.md`, relevant `.ai/archive/<archive-id>.md`, and git status.
3. Verify git safety:
   - repository has git history.
   - working tree is clean, or the user explicitly approves committing/staging before prune.
   - files selected for deletion are tracked in git or their decisions are captured in archive summaries.
4. Classify files as `keep_maintained`, `keep_active`, `delete_completed`, or `blocked`.
5. Delete only `delete_completed` files.
6. Update `.ai/workflow.md` artifact inventory and prune notes when allowed.
7. Report kept files, deleted files, blocked files, and next lifecycle entry.

## Prune Rules

- This skill is manually invoked only. It is not a default handoff from Learning Loop or Artifact Compression.
- Keep always-maintained files:
  - `.ai/workflow.md`
  - `.ai/project-context.md`
  - current maintained foundation/domain artifacts, including `.ai/domain/project.md` and stable `.ai/domain/<bounded-context>.md`.
  - active `.ai/domain-impact/<intent-id>.md` files for current work.
  - current active change artifacts.
  - `.ai/archive/<archive-id>.md` summaries.
- Delete completed intermediate artifacts only after their decisions are captured in archive summaries.
- Never delete active work, unresolved release risks, unreviewed learning outcomes, audit/security/incident evidence, or files marked `maintained`/`active`.
- Block pruning when git is unavailable, the working tree is unsafe, or required trace cannot be preserved.

## Handoff

End with deleted files, kept files, blocked files, workflow inventory changes, and the next lifecycle entry. Do not proceed into new lifecycle work unless the user explicitly approves.
