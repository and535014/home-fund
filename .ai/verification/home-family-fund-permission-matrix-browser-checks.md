---
id: ver-home-family-fund-permission-matrix-browser-checks
stage: verification
status: passed
delivery_profile: mvp
release_target: local_dev
inputs:
  - impl-home-family-fund-permission-matrix-browser-checks
  - vd-home-family-fund-permission-matrix-browser-checks
outputs:
  - test_results
  - review_findings
  - domain_rule_check
  - deploy_readiness_recommendation
trace_links:
  implementation:
    - .ai/implementation/home-family-fund-permission-matrix-browser-checks.md
  verification_design:
    - .ai/verification-design/home-family-fund-permission-matrix-browser-checks.md
  domain_rules:
    - Authorization is command-level.
    - General members act only on self-owned records.
    - Finance managers can create records for others.
reviewed_at: 2026-06-18
---

# Verification Report for Permission Matrix Browser Checks

## Naming Trace

- story_id: story-mvp-hardening-permission-matrix-browser-checks
- verification_report_id: ver-home-family-fund-permission-matrix-browser-checks
- implementation_id: impl-home-family-fund-permission-matrix-browser-checks
- verification_design_id: vd-home-family-fund-permission-matrix-browser-checks
- change_id: home-family-fund-mvp-hardening
- route_slug: `/`
- test_files: `e2e-db/permission-matrix.spec.ts`
- deploy_or_release_slug: local_dev

## Delivery Profile
This verification result supports `local_dev` under the MVP profile. Passing these checks proves local controlled-auth permission behavior, not production OAuth, production deployment, or reimbursement mutation authorization.

## Run Tests
| Command / Check | Result | Evidence |
|---|---|---|
| `corepack pnpm test:e2e:db e2e-db/permission-matrix.spec.ts` | Pass | 4 permission-matrix tests passed. |
| `corepack pnpm test:e2e:db` | Pass | 14 DB-backed tests passed, including auth, dashboard, create-record, and permission-matrix specs. |
| `corepack pnpm test` | Pass | 24 test files / 105 tests passed. |
| `corepack pnpm type-check` | Pass | `tsc --noEmit` completed successfully. |
| `corepack pnpm lint` | Pass | ESLint completed with no findings. |
| `corepack pnpm test:e2e` | Pass | 8 non-DB Playwright smoke tests passed. |
| `.ai` artifact validation | Pass | All `.ai` markdown artifacts include required frontmatter keys. |

## Review
| Finding | Severity | Evidence | Resolution |
|---|---|---|---|
| No blocking findings. | None | Reviewed `e2e-db/permission-matrix.spec.ts` and `prisma/seed.sql`. | Approved for `local_dev`. |
| Reimbursement permission is not covered. | Accepted scope risk | Verification design AC10 and architecture ADR-1 defer it until a reimbursement mutation UI/action exists. | Accepted for this story. |

## Domain Rule Check
| Rule / Language / Boundary | Source Artifact | Implementation Evidence | Result |
|---|---|---|---|
| Authorization is command-level. | DDD policy, story AC | E2E mutates hidden member inputs before submitting the real server-action form; denied attempts redirect with `permission_denied`. | Pass |
| General members act only on self-owned records. | DDD policy | `user-e2e-general` can browse but cannot create income or member-paid expense for `member-kai`. | Pass |
| Finance managers can create records for others. | DDD policy | `user-e2e-linked` creates `E2E 權限允許收入` for another member and dashboard shows it. | Pass |
| Permission feedback is visible and localized. | Experience design | Denied scenarios assert `role=alert` contains `目前帳號沒有新增這筆紀錄的權限。` | Pass |
| Tests do not depend on Google OAuth. | Architecture ADR-2 | Controlled auth header resolves seeded Better Auth-compatible user/account rows. | Pass |

## Deploy / Launch Readiness Recommendation

- launch_readiness_required: false
- release_target_supported: local_dev
- deploy_readiness_next: not_needed
- reason: This is a local MVP hardening story. Production deployment target, OAuth callback configuration, monitoring, rollback, and secrets remain deferred.
- risks_before_launch: production OAuth smoke, reimbursement mutation authorization, audit logging, and deployment readiness are not covered.
- recommended_next_skill: story-slicing for the next MVP hardening slice, likely reimbursement settlement UI path or recurring reminder confirmation UI path.

## Traceability
| Implementation Item | Test Plan Item | BDD Scenario | AC | Story | Domain Event / Rule |
|---|---|---|---|---|---|
| `user-e2e-general` seed fixture | Integration controlled auth fixture | General member is blocked from creating income for another member | AC1, AC9 | permission matrix browser checks | Member permissions changed |
| Denied income E2E | DB-backed permission matrix E2E | General member is blocked from creating income for another member | AC2-AC4 | same | General members act only on self-owned records |
| Denied member-paid expense E2E | DB-backed permission matrix E2E | General member is blocked from creating member-paid expense for another member | AC5-AC7 | same | Authorization is command-level |
| Finance-manager allowed E2E | DB-backed permission matrix E2E | Finance manager can create for another member | AC8 | same | Finance managers can create records for others |
| Reimbursement deferral | Manual/artifact review | n/a | AC10 | same | Reimbursement mutation permission deferred |

## Decision
Pass for `local_dev` with accepted scope risk that reimbursement permission checks wait for a reimbursement mutation surface.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm permission denial remains server-action/domain enforced.
  - Confirm general-member fixture remains linked and active in seed data.
  - Confirm reimbursement permission is picked up by a later mutation story.
- must_check:
  - Full DB-backed E2E remains green.
  - Denied unique record names stay absent from dashboard.
  - Alert role/copy remains stable.
- acceptance_signals:
  - `test:e2e:db`, `test`, `type-check`, `lint`, `test:e2e`, and artifact validation pass.
- unresolved_blockers:
  - None for local_dev create-record permission matrix.
- next_step:
  - Continue to the next MVP hardening story.
