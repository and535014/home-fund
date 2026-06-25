---
id: spec-csv-import-financial-records
stage: behavior-spec
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/csv-import-financial-records.md
  - .ai/domain/home-family-fund.md
  - .ai/domain-impact/csv-import-financial-records.md
  - .ai/prototype/csv-import-financial-records.md
  - .ai/foundation-architecture/home-family-fund.md
outputs:
  - acceptance_criteria
  - bdd_scenarios
  - e2e_design
  - test_plan
trace_links:
  prototype:
    - .ai/prototype/csv-import-financial-records.md
  production_route:
    - /settings/import
  target_components:
    - src/app/(app)/settings/import/page.tsx
    - src/app/(app)/settings/import/csv-import-prototype.tsx
    - src/app/(app)/settings/layout.tsx
  expected_domain_modules:
    - src/modules/fund-ledger
    - src/modules/identity-access
    - src/modules/categories
    - src/modules/reimbursement
    - src/modules/reporting
reviewed_at: 2026-06-25
---

# CSV Import Financial Records Behavior Spec

## Decision Summary

- decision: approved_for_feature_technical_design
- prototype_status: approved by user feedback on 2026-06-25
- primary_route: `/settings/import`
- navigation_label: `CSV 匯入`
- import_target: ledger records only: income, fund-paid expense, member-paid expense
- excluded_target: direct reimbursement payment CSV import
- permission_policy: admins and finance managers can import ledger records; general members cannot import
- csv_template_policy: provide a downloadable ledger template before file selection
- csv_contract: `type,date,name,amount,member,category,note`
- payment_source_policy: no `payment_source` column; `type` determines income, fund-paid expense, or member-paid expense
- matching_policy: auto-match member display name and category name; unresolved or ambiguous matches require preview correction
- duplicate_policy: no silent automatic deduplication; likely duplicates are counted in preview summary but do not become row-level `需處理`
- commit_policy: user may remove rows before import; confirmation imports valid active rows and records invalid active rows as failed so partial success is allowed
- next_gate: Feature Technical Design

## Final Acceptance Criteria

1. `CSV 匯入` is visible in settings navigation only to users authorized to perform ledger import.
2. Direct visits to `/settings/import` by unauthorized or unauthenticated users do not expose the import workflow.
3. The page title and settings navigation label both read `CSV 匯入`.
4. Before a file is selected, the page shows a centered `匯入收支紀錄` action and a `下載範本` action.
5. Activating `匯入收支紀錄` opens the browser file picker directly; no modal opens before file selection.
6. The downloadable template contains exactly `type,date,name,amount,member,category,note`.
7. The template does not contain `payment_source`.
8. `type` accepts only `income`, `fund_expense`, and `member_expense`.
9. `date` uses `YYYY-MM-DD`.
10. `amount` must be a positive Taiwan-dollar amount; negative amounts and zero are invalid.
11. `member` references an existing household member display name, except `fund_expense` may use the household fund source as defined by Technical Design.
12. `category` references an existing active category whose type matches the row type.
13. `note` is optional.
14. Selecting a CSV file creates the preview state and does not create, update, void, or reimburse any financial records.
15. After file selection, the template download action is not shown.
16. The selected file is shown with an outline `Item`, a file icon, icon-only remove and replace actions, no extra icon border, and no extra icon background.
17. On desktop, the selected-file `Item` uses content width; on narrow screens it may use full width.
18. Removing the selected file resets the page to the initial state.
19. Replacing the selected file opens the browser file picker and refreshes the preview for the new file.
20. Member and category mapping are automatically matched by exact display name and exact category name.
21. Case, whitespace, and duplicate-name normalization rules must be decided in Technical Design; ambiguous matches are not guessed.
22. Each preview row shows the CSV row number, starting at `2` because row `1` is the header.
23. Each preview row shows type, date, content, amount, member mapping, category mapping, status, and an icon-only row action.
24. Users can change the mapped member for each preview row before import.
25. Users can change the mapped category for each preview row before import.
26. Users can remove any preview row.
27. Removed rows remain visible and can be added back.
28. Removed rows do not count toward importable rows, validation blockers, duplicate summary counts, or created records.
29. Row remove actions use destructive semantic styling.
30. Row add-back and file replace actions use non-destructive secondary styling.
31. Summary counts `匯入列`, `已移除`, `需處理`, and `疑似重複` are shown in `TableFooter`.
32. Import areas are flat: no extra Card wrapper, no section title, no section background, and no section border around file, summary, or preview table areas.
33. Table and footer styling use shared project design tokens, with TableFooter token styling owned by the shared Table component.
34. Rows with invalid type, date, amount, member, category, or unsupported reimbursement-payment data show row-level Traditional Chinese validation reasons.
35. A member-paid expense row imports as an ordinary member-paid expense in `待退款` state.
36. A fund-paid expense row imports as an ordinary fund-paid expense and never enters reimbursement.
37. An income row imports as an ordinary income record.
38. CSV import never records reimbursement payment evidence and never marks imported member-paid expenses as reimbursed.
39. Reimbursement-payment CSV rows are rejected as unsupported for this slice.
40. Existing records that exactly or strongly match an import row are counted as possible duplicates in the preview summary.
41. Duplicate rows within the same uploaded CSV are counted as possible duplicates in the preview summary.
42. The app does not silently remove, merge, or skip duplicate rows.
43. `匯入` is disabled when there are no remaining rows to import.
44. `匯入` remains enabled when at least one remaining row is importable, even if other remaining rows still need handling.
45. Users may remove rows with `需處理` or import the currently valid rows and let invalid active rows be recorded as failed; duplicate-only rows remain importable unless removed.
46. Confirming import writes one import batch in a server-side transaction, creates records for valid active rows, audits removed rows as skipped, and audits invalid active rows as failed.
47. If server-side validation changes between preview and confirmation, valid active rows may still be imported while invalid active rows are reported and audited as failed.
48. Successful import shows a toast with final server counts in `成功`, `失敗`, `略過` order and resets the page state.
49. Successful import refreshes monthly records, search results, category summaries, and reimbursement-derived read models.
50. Server-side authorization, validation, duplicate detection, and persistence are authoritative; client preview is advisory.
51. UI copy uses Traditional Chinese with Taiwan wording.
52. Desktop and mobile layouts do not clip file names, action icons, status labels, or mapping select values.

## BDD Scenarios

### Scenario: Authorized User Opens CSV Import From Settings

Given an admin or finance manager is signed in  
When they open settings  
Then the settings navigation contains `CSV 匯入`  
When they activate `CSV 匯入`  
Then `/settings/import` opens  
And the page title is `CSV 匯入`  
And the page shows `匯入收支紀錄` and `下載範本`

### Scenario: General Member Cannot Access Import

Given a general member is signed in  
When they open settings  
Then the settings navigation does not contain `CSV 匯入`  
When they visit `/settings/import` directly  
Then the import workflow is not shown

### Scenario: User Downloads Ledger Template

Given an authorized user is on `/settings/import` before selecting a file  
When they activate `下載範本`  
Then a CSV template is downloaded  
And the header is `type,date,name,amount,member,category,note`  
And the template has no `payment_source` column

### Scenario: User Selects A CSV File And Reviews Preview

Given an authorized user is on `/settings/import`  
When they activate `匯入收支紀錄`  
And choose a CSV file  
Then no modal appears  
And the selected file is shown with a file icon  
And `下載範本` is no longer shown  
And a preview table shows rows starting from CSV row `2`  
And member and category mappings are filled by automatic name matching  
And summary counts appear in the table footer

### Scenario: User Corrects Row Mapping Before Import

Given a CSV preview contains an imported row  
When the user changes the row's member mapping  
And changes the row's category mapping  
Then the row keeps the corrected member and category values  
And the corrected values are used when the row is imported

### Scenario: User Removes And Adds Back A Row

Given a CSV preview contains three rows  
When the user removes row `3`  
Then row `3` remains visible as removed  
And `已移除` increases by one  
And `匯入列` decreases by one  
When the user adds row `3` back  
Then row `3` counts toward import again

### Scenario: Invalid Rows Block Import Until Removed Or Corrected

Given a CSV preview contains a row with an unknown category  
Then the row status is `需處理`  
And `匯入` remains enabled only if another active row is importable  
When the user changes the category mapping to a valid category  
Then the row status becomes importable  
And `匯入` is enabled if at least one active row is importable

### Scenario: Duplicate Rows Are Flagged Instead Of Silently Removed

Given the uploaded CSV contains a row that likely duplicates an existing ledger record  
When the preview is validated  
Then the row remains importable  
And the preview footer increases `疑似重複`  
And the app does not automatically remove, merge, or skip that row  
When the user imports without removing it  
Then the duplicate candidate row is imported with the other valid rows

### Scenario: Import Valid Rows Atomically

Given an authorized user previews valid income, fund-paid expense, and member-paid expense rows  
When they activate `匯入`  
Then all valid active rows are created in one server-side transaction  
And the income appears in monthly records and reports  
And the fund-paid expense appears as a fund-paid expense  
And the member-paid expense appears as `待退款`  
And no reimbursement payment evidence is created  
And a success toast appears with final `成功`, `失敗`, and `略過` counts  
And the page resets to the initial import state

### Scenario: Server Validation Fails At Confirmation

Given a preview contains one valid row and one row whose referenced category is archived before confirmation  
When the user activates `匯入`  
Then the valid row is imported  
And the affected row is audited as failed  
And the success toast reports the final success and failure counts

### Scenario: Reimbursement Payment CSV Is Rejected

Given an authorized user uploads a CSV whose target data is reimbursement payment evidence  
When the file is validated  
Then the preview shows row-level `需處理` errors for unsupported data  
And `匯入` remains disabled unless unsupported rows are removed  
And no reimbursement payment or reimbursement batch is created

### Scenario: Mobile Preview Remains Usable

Given an authorized user opens `/settings/import` on a mobile viewport  
When they select a CSV file  
Then the selected-file controls fit without overlap  
And the preview table can scroll horizontally  
And member/category select controls show full option labels without clipping  
And icon-only actions have accessible names

## E2E Design

| Scenario | Route | Fixture | Viewport | Selectors / Assertions |
|---|---|---|---|---|
| Authorized navigation | `/settings/import` from settings | admin or finance-manager session | desktop | Navigation/link `CSV 匯入`; heading `CSV 匯入`; buttons `匯入收支紀錄`, `下載範本`. |
| Unauthorized direct visit | `/settings/import` | general-member session | desktop | No import file input or `匯入收支紀錄`; assert redirect or access-denied behavior decided in Technical Design. |
| Template download | `/settings/import` | authorized session | desktop | Button `下載範本`; downloaded CSV header equals `type,date,name,amount,member,category,note`; no `payment_source`. |
| File preview happy path | `/settings/import` | valid CSV file with income, fund expense, member expense | desktop | File chooser from `匯入收支紀錄`; selected file item; no `下載範本`; table row numbers `2`, `3`, `4`; footer `匯入列 3 列`, `已移除 0 列`, `需處理 0 列`. |
| Mapping correction | `/settings/import` | CSV with automatically matched rows | desktop | Select `第 2 列成員對照`; select `第 2 列分類對照`; changed values remain visible. |
| Remove and add back row | `/settings/import` | valid CSV with three rows | desktop | Button `移除第 3 列`; footer count changes; button `加回第 3 列`; footer count restores. |
| Duplicate summary does not block import | `/settings/import` | CSV row matching existing ledger record | desktop | Footer shows `疑似重複`; row remains `可匯入`; `匯入` remains enabled when all rows have no blocking validation errors. |
| Unsupported reimbursement payment | `/settings/import` | reimbursement payment CSV fixture | desktop | Row status `需處理`; unsupported-target message; no created reimbursement payment after attempted direct action. |
| Import success | `/settings/import` | valid CSV with three ledger rows | desktop | Button `匯入`; toast `匯入完成`; page returns to initial state; monthly/search/reimbursement read-model assertions covered by integration or follow-up E2E. |
| Mobile layout | `/settings/import` | valid CSV with long file name and long labels | mobile | File item not clipped; icon buttons visible; table horizontally scrolls; member/category selects show `家庭基金` and `生活收入` labels. |

## Fixture And Data Strategy

- Reuse the local household seed with admin, finance manager, and general member sessions.
- Add CSV fixtures under the E2E fixture strategy decided in Technical Design:
  - valid ledger import with one `income`, one `fund_expense`, and one `member_expense`.
  - invalid category/member rows.
  - duplicate-against-existing-ledger row.
  - duplicate-within-file rows.
  - unsupported reimbursement payment rows.
  - long file name and long Traditional Chinese display/category names for mobile layout.
- Seed active income and expense categories separately so category type validation can be tested.
- Seed at least one existing ledger record matching a duplicate fixture.
- Seed reimbursement assertions by checking imported member-paid rows become refundable and fund-paid rows do not.

## Test Plan

- Unit tests:
  - CSV header validation accepts only the approved ledger header.
  - Row type validation accepts `income`, `fund_expense`, and `member_expense`.
  - Amount/date parsing rejects malformed, zero, and negative values.
  - Member and category matching reports missing and ambiguous matches.
  - Duplicate detection reports likely duplicates without silently removing rows.
- Domain/integration tests:
  - Authorized admin and finance manager can validate and confirm imports.
  - General member direct command submission is rejected.
  - Import confirmation creates ordinary ledger records under existing ledger invariants.
  - Imported member-paid expenses become refundable and not reimbursed.
  - Reimbursement payment rows cannot create reimbursement batches or payment evidence.
  - Confirmation allows partial success by importing valid active rows and auditing invalid active rows as failed.
  - Preview-only upload creates no ledger records.
- E2E tests:
  - Authorized happy path from settings navigation through file selection, preview, mapping, row removal, import, toast, and reset.
  - Validation failure blocks import; duplicate warning is summarized without blocking import.
  - Unauthorized navigation/direct-visit behavior.
  - Mobile layout with horizontally scrollable table and unclipped select labels.
- Manual checks:
  - Template opens cleanly in common spreadsheet tools without changing header names.
  - UI copy uses Taiwan wording and Traditional Chinese.
  - Icons-only actions have accessible names and semantic color.

## Open Questions For Technical Design

- Should exact duplicate detection use only canonical row fields, a persisted import fingerprint, or both?
- Should the app store import batches and row validation results for audit, retry, or rollback?
- Should raw CSV contents be retained, discarded after import, or stored with a retention policy?
- What row count and file size limit are acceptable for synchronous `local_dev` import?
- How should duplicate display names or category names be disambiguated in the UI if the current app allows them?
- Should `fund_expense` require `member` to be blank, `家庭基金`, or a fixed internal fund token in the CSV?

## Review Gate

- decision: approved
- reviewer_focus:
  - Confirm admins and finance managers are the right import actors.
  - Confirm duplicate rows should be summarized without blocking import, with no silent automatic deduplication.
  - Confirm partial success for valid active rows is the right MVP policy.
  - Confirm the CSV contract and template header are acceptable.
- must_check:
  - Feature Technical Design must define parser ownership, server action/API shape, transaction boundaries, import history, duplicate algorithm, and exact authorization capability.
  - Implementation must not treat preview validation as the final authority.
  - Reimbursement payment import remains out of scope.
- acceptance_signals:
  - BDD scenarios are specific enough to become E2E and integration tests.
  - Duplicate and reimbursement decisions are explicit enough for technical design.
  - Mobile and accessibility expectations from the prototype are preserved.
- unresolved_blockers:
  - Exact duplicate algorithm, import persistence/history, file limits, and ambiguous-name disambiguation remain technical design decisions.
- next_step:
  - Feature Technical Design for `csv-import-financial-records`.
