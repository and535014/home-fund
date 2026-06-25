---
id: prototype-csv-import-financial-records
stage: experience-prototype
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/csv-import-financial-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/csv-import-financial-records.md
  - .ai/foundation-architecture/home-family-fund.md
outputs:
  - production_stack_prototype
  - ux_acceptance_criteria_draft
  - e2e_scenario_candidates
trace_links:
  routes:
    - src/app/(app)/settings/import/page.tsx
  components:
    - src/app/(app)/settings/import/csv-import-prototype.tsx
    - src/app/(app)/settings/layout.tsx
reviewed_at: 2026-06-25
---

# Experience Prototype: CSV Import Financial Records

## Prototype Summary

- route: `/settings/import`
- review_url: `http://localhost:3000/settings/import`
- run_command: `npm run dev`
- frontend_stack: Next.js App Router, React client components, TypeScript, Tailwind CSS, local shadcn-style components, Lucide icons
- component_library_usage: existing PageLayout, PageHeader, Item, Table, Badge, Button, Input, NativeSelect components
- fixture_or_mock_strategy: Uses hard-coded prototype rows for ledger import only. No CSV parsing, server validation, persistence, schema, or file storage is implemented in this gate.
- release_target: `local_dev`

## UX Direction

- CSV import lives under `設定 > CSV 匯入` because it is a privileged bulk write workflow, not a search-result action.
- The page starts with a central import button and a template download button.
- Pressing the central import button opens the browser file picker directly.
- Template download is available before file selection only.
- Selecting a file shows the page-level preview state.
- Preview state has two flat review areas:
  - `匯入檔案`
  - `預覽表格`
- Preview areas do not use cards, section titles, borders, or background fills.
- The file area supports icon-only remove and replace actions.
- Selected file information uses the existing outline Item component pattern; it is content-width on desktop and full-width on narrow screens.
- Remove actions use destructive styling; replace and add-back actions use secondary styling.
- Each preview row supports icon-only remove/add-back actions, member mapping change, and category mapping change.
- Member and category mapping are automatically matched from display name and category name, then corrected in preview if needed.
- Direct reimbursement payment CSV import is removed from this prototype; a future reimbursement reconciliation flow would need manual expense linking.
- Pressing `匯入` simulates the final import, shows a toast, and resets the page state.

## States Covered

- Authorized finance/admin user sees `CSV 匯入` in settings navigation.
- `/settings/import` renders a central import button and a template download button.
- File selection happens directly from the import button.
- Ledger preview shows income, fund-paid expense, and member-paid expense rows.
- Summary shows active import rows, removed rows, and rows needing attention.
- Row preview shows CSV row number, type, date, content, amount, member mapping, category mapping, status, and icon row action.
- Individual rows can be removed and added back.
- Member and category mappings can be changed per row after preview.
- `匯入` shows a toast and resets page state.
- Unprivileged users are redirected away by the route guard.

## Interaction Details

- The central import button opens the browser file picker directly.
- Template download generates the ledger CSV template from prototype data.
- File input is a prototype control and does not parse a real CSV yet; selecting a file seeds fixture preview rows.
- Preview rows are seeded from automatic display-name and category-name matching.
- Preview rows expose their own member/category select controls for correction after preview.
- Removed rows remain visible and can be added back.
- `匯入` is enabled when at least one active row remains and no active row has an error.
- The import action is a frontend simulation: it shows a toast and resets local UI state.

## Responsive Baseline

- Desktop: pre-preview state centers the import action; preview state places content-width file controls above the table and summary counts in the table footer.
- Tablet/mobile: preview blocks collapse into one column; table remains horizontally scrollable through the existing Table wrapper.
- Tablet/mobile: member and category mapping columns keep enough minimum width for full option labels instead of compressing the select text.
- Settings mobile nav includes `CSV 匯入` with the same label as the page title.
- Buttons stack on narrow screens and align right on wider screens.
- Preview state avoids card wrappers around file, summary, and table areas.
- Import surfaces use project design tokens (`card`, `card-foreground`, `border`, `muted`, `primary`, `destructive`, `warning`) instead of browser/default visual styling.
- TableFooter token styling is owned by the shared Table component, not page-local overrides.

## Accessibility And Focus

- Main sections use `aria-label` for `匯入設定` and `匯入預覽`.
- Alerts use the existing `role="alert"` component for validation and prototype success states.
- Primary page actions use visible text labels; file and table row actions are icon-only with `aria-label`.
- Destructive remove actions are visually distinct from reversible add-back and replace actions.
- Removed rows, table footer, warning status, and initial file-drop surface use project semantic tokens.
- Disabled confirmation is paired with visible warning copy when errors exist.
- Table columns preserve row numbers so validation messages can reference CSV rows in BDD/E2E.

## Draft UX Acceptance Criteria

- Import entry point is reachable from settings only for finance-capable users.
- Users can download a ledger CSV template before selecting a file.
- Ledger template uses `type` to distinguish income, fund-paid expense, and member-paid expense; it does not include a separate `payment_source` column.
- Selecting a file creates the preview state.
- Member/category matching happens automatically from display name and category name.
- Preview state contains a flat file area and a table with summary counts in `TableFooter`.
- File area supports icon-only remove and replace actions.
- Row table supports remove, add back, member mapping changes, and category mapping changes.
- Ledger import can preview income, fund-paid expense, and member-paid expense rows.
- Reimbursement payment import is not available in this slice.
- `匯入` shows completion feedback and resets page state.

## E2E Scenario Candidates

- Finance-capable user opens `/settings/import` from settings navigation.
- General member direct visit to `/settings/import` redirects away.
- User downloads the ledger CSV template, clicks the import button, selects a CSV file, and sees automatically matched preview rows.
- User removes one preview row and adds it back.
- User changes member and category mapping for an individual preview row.
- User imports valid preview rows, sees a toast, and returns to the initial page state.
- Mobile viewport shows settings `CSV 匯入` tab, file controls, table actions, and import button without text clipping.

## Known Gaps

- CSV parsing, encoding handling, file-size limits, and delimiter/date/amount contract are not implemented.
- Template download is prototype-only and does not finalize the CSV contract.
- No server-side import validation or persistence exists.
- No Prisma schema exists for import history, import batches, or raw CSV retention.
- No real matching API exists for member/category/ledger-record references.
- Duplicate detection and idempotency are unresolved.
- All-or-nothing versus partial-success commit semantics are unresolved.
- Reimbursement payment import is intentionally deferred to a future reconciliation workflow.
- The route guard currently reuses reimbursement permission as the prototype proxy for import access; Behavior Spec and Technical Design must decide exact import authorization.

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm `/settings/import` is the right IA location.
  - Confirm removing refund payment CSV import is acceptable for this slice.
  - Confirm error rows should block confirmation until partial/all-or-nothing policy is decided.
  - Confirm the preview table includes the right information for users to trust row matching.
- must_check:
  - Prototype remains frontend review work; parsing, backend validation, persistence, and schema are deferred.
  - Behavior Spec must define authorization, target selection, row validation, confirmation, redirect, and responsive E2E scenarios.
  - Technical Design must define CSV contracts, parser ownership, transactions, import history, duplicate policy, and reimbursement linkage.
- acceptance_signals:
  - User approved route placement, preview structure, and error-blocking behavior.
  - Prototype gives enough evidence to write BDD/E2E scenarios.
- unresolved_blockers:
  - Exact import permission and commit semantics remain unresolved for Behavior Spec.
- next_step:
  - Behavior Spec / BDD / E2E for `csv-import-financial-records`.
