---
id: ver-home-family-fund-reimbursement-settlement-ui
stage: verification
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - impl-home-family-fund-reimbursement-settlement-ui
  - vd-home-family-fund-reimbursement-settlement-ui
  - story-mvp-hardening-reimbursement-settlement-ui
  - exp-story-mvp-hardening-reimbursement-settlement-ui
  - arch-home-family-fund-reimbursement-settlement-ui
  - ddd-home-family-fund
outputs:
  - test_results
  - review_findings
  - domain_rule_check
  - deploy_readiness_recommendation
trace_links:
  implementation:
    - .ai/implementation/home-family-fund-reimbursement-settlement-ui.md
  verification_design:
    - .ai/spec/home-family-fund-reimbursement-settlement-ui.md
  domain_rules:
    - Only finance managers perform reimbursement.
    - Selected refundable expenses can be marked reimbursed once.
    - Reimbursed expenses are excluded from refundable totals.
reviewed_at: 2026-06-18
---

# Verification Report for Reimbursement Settlement UI

## Naming Trace

- story_id: story-mvp-hardening-reimbursement-settlement-ui
- verification_report_id: ver-home-family-fund-reimbursement-settlement-ui
- implementation_id: impl-home-family-fund-reimbursement-settlement-ui
- verification_design_id: vd-home-family-fund-reimbursement-settlement-ui
- change_id: reimbursement-settlement-ui
- route_slug: /
- test_files:
  - e2e-db/reimbursement-settlement.spec.ts
  - src/modules/reimbursement/reimbursements.test.ts
- deploy_or_release_slug: local_dev

## Delivery Profile
This verification result supports `local_dev` under the `mvp` delivery profile. It proves the reimbursement settlement browser flow, local server action, Prisma transaction path, and dashboard read-model refresh against deterministic local DB seed data. It does not imply production OAuth, deployment, observability, or audit-readiness.

## Run Tests
| Command / Check | Result | Evidence |
|---|---|---|
| `pnpm type-check` | Passed | Prisma generated client and `tsc --noEmit` completed successfully. |
| `pnpm lint` | Passed | ESLint completed successfully after sequential run. A first parallel run failed because concurrent `prisma generate` commands raced on generated directories; this is a command orchestration issue, not a code finding. |
| `pnpm test` | Passed | Vitest: 24 test files passed, 105 tests passed. |
| `pnpm test:e2e:db e2e-db/reimbursement-settlement.spec.ts` | Passed | Chromium DB E2E: 3 tests passed: empty selection disabled, general member controls hidden, finance manager reimburses selected member-paid expense. |
| Code review: transaction persistence | Passed with accepted risk | `markExpensesReimbursedInDatabase` creates `ReimbursementBatch` with nested `items` and then updates selected ledger records to `reimbursed` inside `prisma.$transaction`. |
| Code review: dashboard read model exclusion | Passed | Existing reimbursement table read model filters only `paymentSource === "member"` and `reimbursementStatus === "refundable"`, and DB E2E proves settled Mei expense leaves the table. |

## Review
| Finding | Severity | Evidence | Resolution |
|---|---|---|---|
| No blocking correctness findings. | none | Tests and code review passed for local_dev scope. | Approve for local_dev verification. |
| Direct forged server-action submission by non-finance member is not browser-tested. | accepted risk | Verification design allowed "direct settlement action or attempt visible UI if exposed"; implemented E2E verifies non-finance controls are absent, while domain command tests enforce permission denial. | Accepted for MVP because Next server action ids are not stable public API and authorization is enforced in `markExpensesReimbursed`. |
| Invalid/stale selection is covered at domain level, not by a DB integration test. | accepted risk | Existing reimbursement domain tests cover empty, missing, not-refundable, already-reimbursed, and permission denial. Persistence wrapper currently relies on the same domain command before transaction writes. | Accepted for this slice; add a DB-level race/conflict test before production readiness or batch-history work. |
| Concurrent `prisma generate` commands race when run in parallel. | low | Parallel verification run caused `EEXIST` under `src/generated/prisma`; sequential `pnpm lint` and `pnpm test` passed. | Use sequential quality gate commands unless scripts are changed to avoid concurrent generation. |

## Domain Rule Check
| Rule / Language / Boundary | Source Artifact | Implementation Evidence | Result |
|---|---|---|---|
| Only finance managers perform reimbursement. | `.ai/domain/home-family-fund.md`, `.ai/spec/home-family-fund-reimbursement-settlement-ui.md` | UI uses `canPerformReimbursement`; server action resolves current member; domain command calls `authorize(actor, { type: "perform_reimbursement" })`; E2E shows general member has no settlement controls. | Pass |
| Selected refundable expenses can be marked reimbursed once. | DDD Reimbursement policy and `Expenses reimbursed` event | Persistence wrapper loads selected expense records and calls `markExpensesReimbursed`; domain rejects missing, not-refundable, and already-reimbursed ids before writes. | Pass with accepted DB race risk |
| Settlement creates traceable reimbursement batch/items. | Architecture ADR-2 | Persistence wrapper creates `ReimbursementBatch` and nested `ReimbursementBatchItem` rows in the same transaction as status updates. | Pass by code review |
| Reimbursed expenses are excluded from refundable totals. | DDD Reporting/Reimbursement read model rule | E2E settles Mei's `$6,420` expense, then verifies pending count drops from 2 to 1 and Mei/$6,420 disappear while Kai/$1,880 remains. | Pass |
| Browser workflow uses controlled auth and deterministic seed, not Google OAuth. | Verification AC9 | E2E uses `x-e2e-auth-user-id` for `user-e2e-linked` and `user-e2e-general`; DB setup resets and seeds `home_fund_e2e`. | Pass |
| UI language and states remain domain-aligned. | Experience design copy constraints | UI copy uses `退款表`, `待處理`, `已選取`, `執行退款`, `確認退款`, and localized alert text. | Pass |

## Deploy / Launch Readiness Recommendation

- launch_readiness_required: false
- release_target_supported: local_dev
- deploy_readiness_next: not_needed
- reason: This verification target is MVP/local development hardening. Production deployment concerns, real Google OAuth, observability, backup/restore, and public launch checks are explicitly outside the current release target.
- risks_before_launch:
  - Add DB-level conflict/race handling and test for simultaneous settlement of the same expense.
  - Decide whether batch history must be visible to users for audit/reconciliation.
  - Add mobile viewport smoke for dense reimbursement selection before broader user testing.
  - Run full DB E2E suite and production-like build/deploy checks before any non-local release.
- recommended_next_skill: workflow-review

## Traceability
| Implementation Item | Test Plan Item | BDD Scenario | AC | Story | Domain Event / Rule |
|---|---|---|---|---|---|
| `ReimbursementSettlementPanel` grouped selectable rows | Finance manager settles one expense | Finance manager settles a selected refundable expense | AC1, AC2 | Reimbursement settlement UI | Reimbursement expenses selected |
| Selected count/total and disabled empty action | Empty selection guarded | Stale or invalid reimbursement selection is rejected | AC2, AC6 | Reimbursement settlement UI | Selected refundable expenses can be marked reimbursed once |
| Confirmation dialog and server action form | Finance manager settles one expense | Finance manager settles a selected refundable expense | AC3 | Reimbursement settlement UI | Expenses reimbursed |
| `markExpensesReimbursedAction` current-member boundary | General member denied settlement | General member cannot settle reimbursements | AC7, AC8, AC9 | Reimbursement settlement UI | Only finance managers perform reimbursement |
| `markExpensesReimbursedInDatabase` transaction | Integration/contract persistence | Finance manager settles a selected refundable expense | AC4, AC6 | Reimbursement settlement UI | Expenses reimbursed |
| Dashboard refresh after redirect | Finance manager settles one expense | Finance manager settles a selected refundable expense | AC5 | Reimbursement settlement UI | Reimbursed expenses excluded from refundable totals |
| Localized alert reason mapping | Manual/code review and error state checks | General member cannot settle reimbursements | AC8 | Reimbursement settlement UI | Permission/conflict feedback |

## Code Map Freshness
This implementation added a new app-local UI component, server action, and reimbursement persistence wrapper. Existing code-understanding artifacts are still directionally accurate for the MVP, but any future impact analysis involving reimbursement persistence, batch history, or server-action boundaries should refresh code understanding before further slicing.

## Decision
Pass with accepted risks for `local_dev`.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm accepted risk around DB-level conflict/race coverage is acceptable for MVP local_dev.
  - Confirm batch persistence without batch-history UI remains acceptable.
  - Confirm sequential quality gate execution is the expected repo practice while scripts run `prisma generate`.
- must_check:
  - Finance manager can select and confirm a refundable expense.
  - General member cannot access settlement controls.
  - Settled expense leaves the reimbursement table and total.
  - Server-side domain command still enforces permission and invalid-state rejection.
- acceptance_signals:
  - `pnpm type-check` passed.
  - `pnpm lint` passed.
  - `pnpm test` passed.
  - `pnpm test:e2e:db e2e-db/reimbursement-settlement.spec.ts` passed.
- unresolved_blockers:
  - None for local_dev.
- next_step:
  - workflow-review
