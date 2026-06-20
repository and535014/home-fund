---
id: edit-delete-ledger-records
stage: intent-intake
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: feature_change
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/domain/home-family-fund.md
  - .ai/spec/story-ledger-record-corrections.md
  - .ai/archive/archive-record-list-detail-modal-2026-06-20.md
  - .ai/archive/archive-remove-standalone-create-record-entry-2026-06-20.md
outputs:
  - scoped_intent
  - lifecycle_routing
trace_links:
  - .ai/spec/story-ledger-record-corrections.md
  - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-21
---

# Edit and Delete Ledger Records Intent

## Request

User request: "我希望可以編輯、刪除紀錄"

The product should let authorized household users correct or remove ledger records from the existing record browsing/detail experience, while preserving role-based ownership boundaries and accurate monthly financial totals.

## Classification

- project_type: feature_change
- affected_surfaces: record list, record detail modal, edit form, delete confirmation, dashboard monthly data refresh, backend/API or server actions, ledger data, auth/permissions, reimbursement/reporting read models, tests
- target_users: general members, finance managers, admins
- primary_outcome: Mistaken income or expense records can be corrected or removed without allowing unauthorized users to mutate someone else's records.
- release_target: local_dev

## Scope

- Add an authorized edit path for existing income and expense records.
- Add an authorized delete path for existing income and expense records.
- Surface edit/delete affordances from the existing record list/detail flow rather than reintroducing standalone records routes.
- Enforce permissions server-side:
  - general members can edit and delete records they created.
  - admins can edit and delete any record.
  - finance managers can edit records for others.
  - finance managers cannot delete other members' records in the MVP permission set.
- Ensure deleted records no longer affect monthly totals, category summaries, or reimbursement calculations.
- Preserve Traditional Chinese UI copy and dark-theme-first product direction.

## Non-Goals

- No production deployment readiness claim.
- No bank sync, payment execution, or accounting export.
- No standalone `/records` or `/records/new` route restoration.
- No role-management redesign beyond existing authorization rules.
- No final decision in this gate on hard delete vs archived/voided deletion semantics.

## Success Criteria

- Authorized users can find and complete edit/delete actions from the current record browsing experience.
- Unauthorized users cannot edit or delete records through UI affordances or direct server calls.
- Editing keeps ledger, reimbursement, and report read models coherent after refresh.
- Deleting removes the record from user-facing monthly totals and reimbursement calculations.
- Destructive deletion requires a clear confirmation in Traditional Chinese.
- The behavior has BDD/E2E coverage for owner, admin, finance manager, and unauthorized member boundaries before implementation.

## Constraints and Assumptions

- Existing foundation remains Next.js, React, TypeScript, Prisma/PostgreSQL, Better Auth, Vitest, Playwright, Tailwind, and shadcn-style local components.
- The homepage remains the only create-record entry point; this feature extends correction actions from record browsing/detail.
- Existing durable domain rules in `.ai/domain/home-family-fund.md` are valid.
- Existing draft story `.ai/spec/story-ledger-record-corrections.md` is the closest behavior seed, but needs lifecycle refresh before implementation.
- Deletion semantics are intentionally unresolved until Domain Discovery / Behavior Spec because auditability and reimbursement implications need explicit review.

## Lifecycle Routing

- Domain Discovery: required.
  - Reason: deletion semantics, reimbursement impacts, authorization policy, and record lifecycle state need explicit domain decision.
- Project Foundation Architecture: not required.
  - Reason: existing app foundation and test stack are established and fit this slice.
- Project Foundation Implementation / Init: not required.
  - Reason: scaffold, routing, component, lint, type-check, and E2E baselines already exist.
- Experience Prototype: required.
  - Reason: user-facing edit/delete affordances, forms, destructive confirmation, disabled/hidden actions, and responsive behavior need review before final spec.
- Behavior Spec / BDD / E2E: required.
  - Reason: role-permission matrix and financial read-model consequences must be testable before design/implementation.
- Feature Technical Design: required.
  - Reason: server action/API boundary, persistence semantics, cache refresh, reimbursement/reporting effects, and authorization ownership need explicit design.
- TDD Implementation: required after approved spec and technical design.
- Verification: required after implementation.
- Target-Aware Release: required for `local_dev` readiness after verification.
- Learning Loop: optional for local_dev; recommended if user testing shows uncertainty around destructive action confidence or correction discoverability.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm this captures the desired edit/delete scope.
  - Confirm whether deletion should be explored as hard delete, archived/voided state, or deferred to the next gate.
  - Confirm `local_dev` remains the release target.
- must_check:
  - No implementation starts before Domain Discovery, prototype, behavior spec, and technical design are approved or explicitly accepted as risk.
  - Permission boundaries match household expectations.
  - Record deletion impact on reimbursements and reports is explicitly resolved before coding.
- acceptance_signals:
  - The change has a clear lifecycle path and bounded non-goals.
  - Existing record browsing and creation decisions remain respected.
- unresolved_blockers:
  - Deletion semantics are unresolved by design at Intent Intake.
- next_step:
  - Domain Discovery for `edit-delete-ledger-records`.
