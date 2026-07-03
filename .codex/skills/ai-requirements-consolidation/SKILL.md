---
name: ai-requirements-consolidation
description: Use when converting old .ai workflow artifacts, intents, prototypes, plans, specs, verification reports, archives, or domain-impact notes into .ai/requirements with one concise markdown file per requirement.
---

# AI Requirements Consolidation

## Core Principle

Use `.ai/requirements/` as a compact historical record: one requirement, feature, fix, or shipped slice per `.md` file. Preserve traceability and decisions without keeping the old workflow machinery alive.

## Inputs

- Old `.ai/intent/`, `.ai/prototype/`, `.ai/spec/`, `.ai/technical-design/`, `.ai/implementation/`, `.ai/verification/`, `.ai/archive/`, `.ai/domain-impact/`, and similar workflow folders.
- Existing `.ai/requirements/` files if consolidation is incremental.
- Git history only when local artifacts are ambiguous.

## Output Shape

```text
.ai/requirements/
  admin-google-oauth-member-invitations.md
  batch-search-record-actions.md
  category-archive-visibility-toggle.md
```

Use stable kebab-case filenames based on the requirement name. Do not include dates unless the same requirement name would collide.

Each file should use this structure:

```markdown
# Requirement Name

## Summary

## Decisions

## Acceptance Criteria

## Evidence

## Follow-ups
```

Omit sections that have no useful content. Keep each file concise.

## Procedure

1. Inventory old `.ai` artifacts and group them by requirement, feature, fix, or shipped slice.
2. Prefer the user-visible requirement name over internal workflow step names.
3. For each group, extract:
   - problem or user need
   - accepted product / domain decisions
   - acceptance criteria or success signals
   - verification evidence
   - unresolved follow-ups
4. Write or update exactly one `.ai/requirements/<slug>.md` for that requirement.
5. Preserve links to source artifacts only when the source artifact will remain after cleanup.
6. After all useful content is consolidated, remove old `.ai` workflow artifacts only when the user explicitly approved cleanup.

## Grouping Rules

- One user-facing feature slice usually becomes one requirement file.
- A bug fix becomes its own file when it has distinct evidence or future risk.
- A follow-up that only clarifies the same feature should merge into the existing requirement file.
- Domain-wide rules belong in `.ai/domain/`, not `.ai/requirements/`.
- Active task markers, workflow docs, and project context files are not requirements by themselves.

## Content Rules

- Write in Traditional Chinese unless the repo uses another language.
- Keep domain terms in English when they are code-facing or already established.
- Prefer bullets over long narrative.
- Do not copy full old artifacts verbatim.
- Keep implementation evidence concrete: file paths, test commands, PR links, release notes, or accepted gaps.

## Verification

- Run `find .ai/requirements -maxdepth 1 -type f | sort`.
- Run `rg -n "^# " .ai/requirements`.
- Run `git diff --check`.
- Confirm every removed old `.ai` artifact either became part of one requirement file, moved into `.ai/domain/`, or was intentionally discarded as workflow noise.
