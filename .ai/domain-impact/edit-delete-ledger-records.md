---
id: domain-impact-edit-delete-ledger-records
stage: domain-impact
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/edit-delete-ledger-records.md
  - .ai/domain/home-family-fund.md
  - .ai/spec/story-ledger-record-corrections.md
  - prisma/schema.prisma
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/edit-delete-ledger-records.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-21
---

# Domain Impact for Edit and Delete Ledger Records

## Summary

- intent_id: edit-delete-ledger-records
- maintained_domain_artifacts_updated: `.ai/domain/home-family-fund.md`
- bounded_contexts_touched: Fund Ledger, Identity and Access, Reimbursement, Reporting, Responsive Web Experience
- impact_type: changed_rule, changed_policy, changed_state, changed_language

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Ledger record correction, ledger record deletion, voided ledger record. | Delete is user-facing language, but the domain state is voided for MVP. | Hard delete as the default domain meaning. | Financial records and reimbursement references need audit-safe lifecycle language. |
| events | Ledger record voided. | Prior `Ledger record deleted` language is narrowed to the user-facing command outcome and represented durably as voided. | None. | Active reports must exclude deleted records without losing traceability. |
| commands | Correct ledger record, Delete ledger record. | Delete command now targets a voiding transition rather than physical removal by default. | None. | UX can still say delete while technical design preserves record identity. |
| policies | Corrected records must remain valid for category type, source/payer member, payment source, and actor authorization; voided records are excluded from active monthly reads. | Finance managers can edit other members' records but cannot delete other members' records in MVP. | None. | Existing authorization model already has edit/delete command boundaries; specs need full matrix coverage. |
| aggregates_or_invariants | LedgerRecord has an active/voided lifecycle for correction/deletion behavior. | LedgerRecord invariant now excludes voided records from active reporting and reimbursement calculations. | Deletion semantics open question for basic active records. | Prisma currently has no lifecycle field, and reimbursement batch items restrict hard deletion. |
| bounded_contexts | Reimbursement and Reporting consume active-only ledger records. | Fund Ledger owns correction and voiding; Identity and Access owns command authorization. | None. | Downstream read models must not each invent deletion behavior. |
| lifecycle_or_states | Active ledger record, voided ledger record. | Reimbursed member-paid expense deletion remains a special risk requiring spec/design decision. | None. | Reimbursement reversal is not currently modeled, so deletion after settlement needs explicit handling. |

## Domain Decisions

- MVP deletion semantics: use a voided lifecycle state, not physical hard delete, for the domain model.
- Active record lists, monthly totals, category summaries, and reimbursement tables must exclude voided records.
- Existing reimbursement batch history should keep its trace to any record that later becomes voided.
- General members can correct/delete only records they created.
- Admins can correct/delete any record.
- Finance managers can correct records for others but cannot delete records created by others in the MVP permission set.
- Editing a member-paid expense can change reimbursement implications only if the resulting record remains internally consistent; Behavior Spec must define whether already reimbursed records are editable, restricted, or require admin-only handling.

## Downstream Impact

- prototype_states_or_flows:
  - Record detail shows edit and delete actions only when the actor is eligible.
  - Edit flow reuses create-record field language where possible, with clear save/cancel/error states.
  - Delete flow uses a Traditional Chinese destructive confirmation and communicates that the record leaves active monthly views.
  - Unauthorized users see read-only details without misleading inactive buttons.
  - Reimbursed member-paid expense correction/deletion needs an explicit prototype state if allowed or blocked.
- bdd_scenarios:
  - Owner edits own income and expense records.
  - Owner deletes own active income and expense records.
  - General member cannot edit or delete another member's record by UI or direct action.
  - Admin edits and deletes another member's record.
  - Finance manager edits another member's record but cannot delete it.
  - Voided records disappear from monthly totals, category summaries, record list, and refundable reimbursement table.
  - Reimbursed expense edit/delete behavior is covered according to the approved spec decision.
- technical_design_boundaries:
  - Fund Ledger should own correction and voiding commands.
  - Identity and Access should continue to authorize `edit_ledger_record` and `delete_ledger_record`.
  - Persistence likely needs a ledger lifecycle/status field, because current Prisma `LedgerRecord` has no active/voided state and reimbursement batch items restrict hard deletion.
  - Reporting and Reimbursement query/read-model builders should consume active-only records from a shared boundary rather than duplicating filters.
  - Cache revalidation must refresh `/`, `/reimbursements`, and any future monthly record surface.
- tdd_domain_tests:
  - Authorization matrix for edit/delete owner/admin/finance/general cases.
  - Correction validation for amount/date/category/type/payment source/source member/payer member.
  - Voiding excludes records from reporting and reimbursement read models.
  - Reimbursed expense special-case behavior.
  - Server-action or command tests for direct unauthorized mutation attempts.
- release_or_learning_signals:
  - Local_dev release must include migration readiness if a ledger lifecycle field is added.
  - Manual smoke should verify totals before/after edit/delete and role-specific affordance visibility.
  - Learning can watch whether users understand "刪除" removes active totals while preserving trace behind the scenes.

## Open Questions and Risks

- product:
  - Should the UI expose edit/delete for already reimbursed member-paid expenses, or block them until reimbursement reversal exists?
  - Should users see any label/history for voided records, or should they simply disappear from the MVP active record list?
- domain:
  - If an already reimbursed record is corrected, should the reimbursement batch remain historical, be recalculated, or require a reversal command first?
- data_or_ownership:
  - A lifecycle/status field probably requires a Prisma migration and active-only filtering across dashboard/reimbursement/reporting queries.
  - Existing local data must default existing records to active.
- policy_or_permission:
  - Finance-manager delete restrictions are settled for MVP, but future admin-configurable delegation remains possible.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm voided lifecycle is acceptable for MVP "delete" behavior.
  - Decide reimbursed member-paid expense edit/delete handling before Behavior Spec.
  - Confirm downstream prototype/spec/design impacts are complete.
- must_check:
  - Durable domain rules are in `.ai/domain/home-family-fund.md`, not only this impact file.
  - Prototype, BDD, and technical design all consume active/voided lifecycle.
  - Reimbursement risks are not hidden behind generic delete wording.
- acceptance_signals:
  - Experience Prototype can design action visibility, edit form, delete confirmation, and blocked reimbursed-expense state.
  - Behavior Spec can define role and read-model assertions.
  - Technical Design can evaluate schema migration and shared active-record filtering.
- unresolved_blockers:
  - Reimbursed member-paid expense correction/deletion behavior needs approval before implementation.
- next_step:
  - Experience Prototype for `edit-delete-ledger-records`.
