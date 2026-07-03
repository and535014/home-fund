---
name: ai-domain-curation
description: Use when consolidating or pruning .ai/domain artifacts into long-lived domain knowledge, especially when old DDD, event storming, domain-impact, workflow, or requirement-level notes need to become concise bounded-context files.
---

# AI Domain Curation

## Core Principle

Keep `.ai/domain/` as durable product knowledge, not a history log. Preserve language, rules, lifecycle, ownership, invariants, and unresolved domain questions that should still shape future work.

## Inputs

- Existing `.ai/domain/` files.
- Legacy `.ai/ddd/`, `.ai/domain-impact/`, `.ai/intent/`, or archived requirement files when needed for source material.
- Current code or product behavior only when domain truth is unclear.

## Output Shape

Use one overview plus stable bounded-context files when the domain is large enough:

```text
.ai/domain/
  project-or-product.md
  identity-access.md
  fund-ledger.md
  categorization.md
  recurring-schedule.md
  reimbursement.md
  reporting.md
```

Use different context names when the product language calls for them. Do not create one domain file per feature, request, ticket, or session.

## Procedure

1. Read existing domain artifacts and identify repeated terms, rules, roles, lifecycle states, and open questions.
2. Separate long-lived domain knowledge from delivery history.
3. Choose bounded contexts only when language, ownership, lifecycle, or invariants differ meaningfully.
4. Write concise context files with these sections:
   - `核心概念`
   - `Lifecycle` when state changes matter
   - `Invariants`
   - `開放問題`
5. Keep the overview file focused on context map, cross-context rules, and shared vocabulary.
6. Remove workflow metadata, review gates, acceptance criteria, implementation logs, release notes, and one-off task evidence from domain files.
7. If a detail is historical but still useful, move or leave it in `.ai/requirements/` instead of `.ai/domain/`.

## Keep

- Ubiquitous language that future users, tests, UI copy, or code naming should reuse.
- Role and permission boundaries.
- State transitions and lifecycle policies.
- Ownership rules between contexts.
- Financial, authorization, audit, or no-double-count invariants.
- Open questions that affect future product or implementation decisions.

## Remove

- Frontmatter from old workflows unless it still carries domain meaning.
- Event storming timelines after their durable rules are extracted.
- Review gates, acceptance signals, and next-step workflow notes.
- Implementation details, test logs, release evidence, and commit notes.
- Per-requirement deltas that do not change the long-term model.

## Verification

- Run `find .ai/domain -maxdepth 1 -type f | sort`.
- Run `rg -n "workflow_version|release_target|Review Gate|Event Timeline|Visual Model|current-task|project-context|workflow\\.md" .ai/domain`.
- Run `git diff --check`.
- Summarize which durable rules were preserved and which delivery-history material was removed or moved.
