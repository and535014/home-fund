---
id: record-search-sort-filter
stage: intent-intake
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
project_type: feature_change
inputs:
  - .ai/workflow.md
  - .ai/project-context.md
  - .ai/domain/home-family-fund.md
  - .ai/spec/story-monthly-records-and-reports.md
  - .ai/archive/archive-record-list-detail-modal-2026-06-20.md
  - .ai/archive/archive-edit-delete-ledger-records-2026-06-21.md
  - .ai/archive/archive-record-detail-reimbursement-2026-06-21.md
outputs:
  - intent_intake
  - lifecycle_routing
trace_links:
  bounded_contexts:
    - Fund Ledger
    - Reporting
    - Reimbursement
    - Identity and Access
    - Responsive Web Experience
  domain_events:
    - Monthly records viewed
    - Monthly report generated
    - Monthly reimbursement table generated
  related_slices:
    - record-list-detail-modal
    - edit-delete-ledger-records
    - record-detail-reimbursement
reviewed_at: 2026-06-21
---

# Intent Intake: Record Search, Sort, and Filter

## Intent

User request: "我希望可以透過輸入關鍵字搜尋紀錄，並且可以排序、篩選特定類型、特定付款人以及特定時間區間的紀錄"

Household members should be able to narrow the dashboard record list with a keyword search, sort the results, and filter records by record type, payer member, and date range so they can find historical income and expense records without scanning an entire month manually.

## Classification

- project_type: feature_change
- affected_surfaces: dashboard record list, record detail entry flow, monthly report/read model, filter controls, sort controls, URL or client state, backend/API or server data query, Prisma data access, authorization, E2E coverage, local_dev release readiness
- target_users: household members browsing records, finance managers reviewing reimbursable expenses, admins auditing household fund activity
- business_outcome: make record review faster and more reliable as ledger history grows, while preserving authenticated household-wide visibility and existing record detail/edit/delete/reimbursement behavior.
- release_target: local_dev

## Scope

In scope:

- Add keyword search for ledger records across all approved user-visible record fields: record name, note, category name, member display names, type/payment-source labels, and other visible record metadata selected in the later behavior spec.
- Add sorting for the record list.
- Add filters for:
  - record type, such as income and expense.
  - category, using active categories only; archived categories must not be searchable/filterable.
  - member or fund participation in the transaction, so users can find a person's or the household fund's expenses/income without needing separate income-source and expense-payer mental models.
  - reimbursement status, so users can find refunded or not-yet-refunded records.
  - date range across record occurrence dates, supporting start-only, end-only, or start-and-end ranges.
- Keep filters compatible with the existing dashboard record list and record detail modal.
- Preserve current permission rules: authenticated household members can browse household records, while mutation actions remain governed by the existing edit/delete/reimbursement rules.
- Keep Traditional Chinese UI copy and dark-theme-first interface direction.
- Ensure filtered/sorted results do not include voided records unless a later approved spec explicitly chooses an audit view.

## Non-Goals

- No production deployment readiness claim.
- No bank sync, payment execution, export, or advanced accounting report redesign.
- No new standalone `/records` route unless a later prototype/spec explicitly approves a route change.
- No changes to record creation, edit/delete authorization, or reimbursement eligibility.
- No saved views, sharing filter presets, full-text search infrastructure, or cross-household search in this slice.
- No final implementation decision in this gate on whether query state lives in URL search params, local component state, or server actions.

## Success Criteria

- Users can enter a keyword and see matching active records without losing access to record detail actions.
- Users can sort records by newest first, oldest first, highest amount first, and lowest amount first.
- Users can filter by type, category, member/fund participation, reimbursement status, and date range, independently and in combination.
- Empty-result and reset states are clear in Traditional Chinese.
- Filtering and sorting remain coherent with monthly totals/reporting expectations decided in the behavior spec.
- Query behavior has focused BDD/E2E coverage for combined filters, keyword search, sort order, empty results, and record detail access from filtered results before implementation.

## Constraints and Assumptions

- Existing foundation remains Next.js, React, TypeScript, Prisma/PostgreSQL, Better Auth, Vitest, Playwright, Tailwind, and shadcn-style local components.
- The existing dashboard remains the primary record browsing surface.
- Existing durable domain rules in `.ai/domain/home-family-fund.md` are valid.
- "特定類型" means ledger record type, initially income vs expense, unless the next gate expands it.
- "分類" means the ledger record category. Archived categories are not searchable/filterable in this slice.
- "特定付款人" is refined by user feedback into a broader member/fund participation filter: users should be able to find records involving a specific member or the household fund across both income and expense records.
- "特定時間區間" means filtering by the record occurrence date, not created-at or updated-at timestamps. Users may enter only a start date, only an end date, or both.
- Date range may coexist with or replace the current month selection based on the lower-risk implementation path discovered in downstream gates, as long as the UI supports optional start and end boundaries.
- "已退款 / 未退款" filtering applies to reimbursement-relevant records. The next gate should define whether income and fund-paid expenses are excluded from these results, treated as not applicable, or only included when no reimbursement-status filter is active.
- The local MVP should prefer a simple, inspectable search/filter behavior before introducing external search services.

## Intake Decisions

- Keyword search scope: include all relevant visible record fields rather than record title only.
- Sort options: newest first, oldest first, highest amount first, and lowest amount first.
- Category filter: include category as a first-class filter, limited to active categories only.
- Date range shape: support optional start and optional end date; exact relationship with the existing monthly dashboard selector remains a downstream design decision.
- Payer/member wording: use a broader member/fund participation concept so a user can find records for a person or for the household fund across expenses and income.
- Reimbursement status filter: include refunded and not-yet-refunded states.

## Required Downstream Gates

- Domain Discovery / Domain Impact: required.
  - Reason: this changes record browsing language around payer/source member, date range semantics, voided record visibility, and reporting expectations.
- Project Foundation Architecture: not required.
  - Reason: existing app foundation and test stack are established and fit this slice.
- Project Foundation Implementation / Init: not required.
- Experience Prototype: required.
  - Reason: user-facing search, sort, filter controls, combined state, empty/reset states, and responsive layout need review before final behavior spec.
- Behavior Spec / BDD / E2E: required before technical design.
  - Reason: keyword matching fields, sort options, filter combinations, date boundaries, empty results, and detail-dialog continuity must be testable.
- Feature Technical Design: required.
  - Reason: data query ownership, state persistence, cache/revalidation behavior, Prisma filters, and performance boundaries need explicit decisions.
- TDD Implementation: required after approved spec and technical design.
- Verification: required.
- Target-Aware Release: required for `local_dev` readiness after verification.
- Learning Loop: optional for local_dev; recommended if user review raises uncertainty about control discoverability, default sort order, or payer/source wording.
- Artifact Compression: required after the slice completes.

## Open Questions

- Should filters update the URL so refresh/back/forward preserve the current query?
- Should the date range replace the current month selection, constrain it, or coexist with it? User is open to the easier/lower-risk implementation as long as optional start/end dates are supported.
- What is the final Traditional Chinese label for the broader member/fund participation filter?
- How should reimbursement-status filtering handle records that are not reimbursement-applicable, such as income and fund-paid expenses?

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm this captures the desired search, sort, type filter, category filter, payer/member/fund filter, reimbursement-status filter, and date-range filter scope.
  - Confirm that keyword search should cover all relevant visible record fields.
  - Confirm that the member/fund participation filter captures the desired "某個人 或是基金的支出或收入" behavior.
- must_check:
  - No implementation starts before Domain Discovery, prototype, behavior spec, and technical design are approved or explicitly accepted as risk.
  - Filter wording does not confuse expense payer with income source member.
  - Existing record detail, edit/delete, and reimbursement actions remain reachable from filtered results.
- acceptance_signals:
  - The change has a clear lifecycle path and bounded non-goals.
  - Existing dashboard-first record browsing direction remains respected.
  - Query behavior can be covered with BDD/E2E before implementation.
- unresolved_blockers:
  - Date-range/month interaction, final Traditional Chinese filter label, and reimbursement-not-applicable handling are unresolved by design at Intent Intake.
- next_step:
  - Domain Discovery / Domain Impact for `record-search-sort-filter`.
