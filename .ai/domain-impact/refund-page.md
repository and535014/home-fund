---
id: domain-impact-refund-page
stage: domain-impact
status: review
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/refund-page.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/reimbursement-payment-flow.md
  - .ai/domain-impact/search-reimbursement-payment-records.md
outputs:
  - domain_delta
  - downstream_impacts
trace_links:
  intent:
    - .ai/intent/refund-page.md
  maintained_domain_artifacts:
    - .ai/domain/home-family-fund.md
reviewed_at: 2026-06-27
---

# Domain Impact for Refund Page

## Summary

- intent_id: refund-page
- maintained_domain_artifacts_updated: `.ai/domain/home-family-fund.md`
- bounded_contexts_touched: Reimbursement, Fund Ledger, Reporting, Identity and Access, Responsive Web Experience
- impact_type: new_behavior, changed_policy, changed_state, changed_language

## Domain Delta

| Area | Added | Changed | Removed | Reason |
|---|---|---|---|---|
| ubiquitous_language | Refund page, refund page member scope, refund page selection. | `退款` can now name a dedicated workspace in addition to reimbursement actions and refund records. | The durable rule that standalone refund work is retired. | Users need a focused month-scoped workspace for unpaid expenses, completed refund records, and batch refund. |
| events | Refund page entry revealed; Refund page opened; Refund page member scope changed; Refund page unpaid expenses selected; Refund page batch reimbursement confirmed. | Batch reimbursement now has another entry point besides `/search`; monthly reporting includes a dedicated refund workspace read model. | Reimbursement page retired as the current product policy. | The new page changes discovery, selection, and read-model events, but not the underlying settlement invariant. |
| commands | Open refund page; Choose refund page member scope; Select refund page unpaid expenses; Confirm refund page batch reimbursement. | Resolve dashboard navigation becomes device-specific: desktop shows `退款`, mobile bottom tabs omit it. | Direct `/reimbursements` default-404 policy as the durable current-state rule. | Navigation and route behavior must be explicit because current desktop/mobile navigation share one item source. |
| policies | Refund page is authenticated, household-scoped, month-scoped, and can show all-member or member-scoped reimbursement summaries. Refund page selection is temporary and revalidated server-side before mutation. | Batch refund rules apply equally from refund page and search: active member-paid refundable records only, authorized actor only, payment evidence required, one paid-to member per MVP batch. | None. | The page adds a workflow surface, not a new financial truth or payment execution mechanism. |
| aggregates_or_invariants | MonthlyReport owns refund-page read projections; ReimbursementBatch owns refund settlement when selected expenses are submitted. | ReimbursementBatch events include refund-page batch reimbursement as another multi-record settlement path. | None. | Reporting can prepare selection and summaries, but Reimbursement must own status/payment evidence transitions. |
| bounded_contexts | Responsive Web Experience owns device-specific nav exposure for `退款`. Reporting owns refund-page summaries and lists. | Reimbursement remains command owner for batch settlement; Fund Ledger remains owner of expense facts. | None. | Prevent the refund page from becoming a competing ledger or payment aggregate. |
| lifecycle_or_states | Refund page states include loading, empty unpaid list, empty refund records, all-member scope, member scope, selection mode, selected count/amount, detail-open state, and batch refund confirmation. | Completed refund records become visible from both search and refund page, while remaining read-only payment evidence. | Standalone refund route removal state for this active direction. | Prototype and BDD need explicit states before technical design. |

## Domain Decisions

- The product direction now reintroduces a dedicated `退款` page. This supersedes the previous durable rule that refund work is no longer a standalone page.
- The refund page is a month-scoped reimbursement workspace, not an external payment execution surface.
- Desktop primary navigation should expose `退款` below `搜尋`.
- Mobile bottom tab navigation should not expose `退款` in this slice, even though direct authenticated route access may still work.
- The refund page read model must include unpaid member-paid expenses, completed refund records, and summary totals for the selected month and member scope.
- The `全部` scope aggregates across members. Member scopes filter the same summary/list concepts by member.
- Refund page selection is temporary UI/read-model state. It does not grant permission and must be revalidated by the batch reimbursement command.
- Batch reimbursement from the refund page follows existing reimbursement payment-flow invariants: active member-paid refundable expenses only, authorized finance-capable actor, one paid-to member per MVP batch, payment evidence required, and no double-counting as ordinary income/expense.
- Completed refund records shown on the refund page are reimbursement payment evidence and remain distinct from ordinary ledger records.

## Downstream Impact

- prototype_states_or_flows:
  - Show a desktop sidebar entry `退款` below `搜尋`.
  - Show no `退款` item in the mobile bottom tab bar.
  - Add a home `待退款` area action that opens the refund page.
  - Show refund page header with title and month switcher.
  - Show `全部` plus member-scoped tabs or an equivalent reviewed overflow pattern.
  - Show summary values for unpaid count, unpaid amount, and refunded amount.
  - Show unpaid expense list and completed refund record list in each scope.
  - Show selection mode with selected count and selected amount.
  - Show detail readback for unpaid expenses and refund records.
  - Show batch refund confirmation using existing payment evidence expectations.
- bdd_scenarios:
  - Desktop user opens refund page from sidebar below `搜尋`.
  - User opens refund page from the home refund summary action.
  - Mobile user does not see a refund item in the bottom tab bar.
  - User changes month and sees refund summaries/lists for that month.
  - User switches from `全部` to a member scope and sees filtered summaries/lists.
  - Finance-capable user selects unpaid expenses and sees selected count and amount.
  - Finance-capable user batch-refunds eligible same-member unpaid expenses from the refund page.
  - Cross-member, already refunded, fund-paid, income, voided, unauthorized, or cross-household selections are rejected.
  - User opens unpaid expense detail and completed refund record detail from the refund page.
  - Refund records do not affect ordinary monthly income/expense totals.
- technical_design_boundaries:
  - Navigation design must separate desktop sidebar items from mobile tab items or add explicit per-surface visibility metadata.
  - Reporting should own the refund-page read model for summaries, unpaid expense lists, and completed refund record lists.
  - Reimbursement should own batch settlement commands and payment evidence persistence.
  - Fund Ledger supplies active member-paid expense facts and reimbursement status.
  - Identity and Access scopes page access, read visibility, and mutation authority.
  - Technical design must choose the route (`/refunds`, `/reimbursements`, or another URL) and decide whether any old route needs redirect or 404 behavior.
  - Technical design must choose date policy for completed refund records: payment date, original expense date, or another explicit month attribution.
- tdd_domain_tests:
  - Refund-page read model calculates unpaid count, unpaid amount, and refunded amount for all-member and member scopes.
  - Refund-page lists include unpaid member-paid expenses and completed refund payment evidence without mixing ordinary ledger totals.
  - Selection count and amount derive only from selected unpaid eligible expenses.
  - Batch refund from refund page reuses existing same-member/payment-evidence validation.
  - Navigation tests prove desktop includes `退款` and mobile bottom tabs omit it.
  - Permission tests prove non-finance-capable users cannot submit refund mutations even if they can read the page.
- release_or_learning_signals:
  - Local_dev readiness must include desktop and mobile navigation checks.
  - Local_dev readiness must include at least one refund-page batch refund smoke path.
  - Learning should check whether users understand `未退款支出紀錄` versus `退款紀錄`.
  - Learning should check whether hiding `退款` from mobile tabs makes the page too hard to discover on mobile.

## Open Questions and Risks

- product:
  - Should the route be `/refunds`, `/reimbursements`, or another product URL?
  - Should the home action label be `前往退款`, `查看退款`, or another label?
  - If household member count is large, should member scopes remain tabs or become a member filter on narrow widths?
- domain:
  - Which date controls completed refund records in a month-scoped refund page: payment date, original expense date, reimbursement batch date, or another policy?
  - Should general members see all completed refund records or only records relevant to themselves?
- data_or_ownership:
  - Refund page summaries may need a dedicated read model to avoid duplicating search query logic.
  - Result identity must keep unpaid ledger expenses and completed reimbursement payment records distinct.
  - Any old `/reimbursements` route policy must be reconciled with the chosen new route.
- policy_or_permission:
  - Device-specific navigation must not be mistaken for authorization. Direct route access still requires authenticated household scoping.
  - Batch refund selection must not bypass same-paid-to-member and payment evidence requirements.
  - Hiding the mobile tab may reduce discoverability; this is accepted for this slice unless later review changes mobile IA.

## Review Gate

- decision: review
- reviewer_focus:
  - Confirm the standalone refund page is reintroduced and supersedes the previous retirement rule.
  - Confirm desktop sidebar includes `退款` below `搜尋`, while mobile bottom tabs omit it.
  - Confirm refund page scope and summaries are month/member scoped.
  - Confirm refund page batch reimbursement reuses existing settlement invariants.
- must_check:
  - Durable domain model is updated in `.ai/domain/home-family-fund.md`.
  - This file contains only the intent-specific domain delta.
  - Prototype, BDD, and technical design consume the route, member-scope, navigation, and date-policy questions.
  - Refund payment evidence remains separate from ordinary ledger totals.
- acceptance_signals:
  - Experience Prototype can model page structure, navigation visibility, tabs, lists, selection, and detail readback.
  - Behavior Spec can define route, authorization, month/member scope, selection, batch refund, and no-double-count scenarios.
  - Technical Design can decide read-model ownership, route behavior, navigation metadata, and command reuse.
- unresolved_blockers:
  - Route choice and completed-refund month attribution need downstream decisions.
  - General-member refund-record visibility needs confirmation if the prototype exposes records involving other members.
- next_step:
  - Experience Prototype for `refund-page`.
