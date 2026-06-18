---
id: impl-home-family-fund-browser-create-record-flow
stage: implementation
status: implemented
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-browser-create-record-flow
  - vd-home-family-fund-browser-create-record-flow
  - arch-home-family-fund-browser-create-record-flow
outputs:
  - e2e-db/create-record.spec.ts
  - src/app/create-record-dialog.tsx
  - src/app/page.tsx
  - src/app/home-dashboard-layout.tsx
  - src/app/record-entry-panel.tsx
  - src/components/ui/dialog.tsx
trace_links:
  stories:
    - .ai/spec/story-mvp-hardening-browser-create-record-flow.md
  verification_design:
    - .ai/spec/home-family-fund-browser-create-record-flow.md
  architecture:
    - .ai/technical-design/home-family-fund-browser-create-record-flow.md
reviewed_at: 2026-06-16
---

# Implementation Log: Browser Create-Record Flow

## Scope
Implemented the MVP hardening story that proves income, fund-paid expense, member-paid expense, and server-side validation recovery through the real browser form, controlled auth, server action, and `home_fund_e2e` database.

## Changes
| Area | Files | Summary |
|---|---|---|
| DB-backed browser coverage | `e2e-db/create-record.spec.ts` | Added serial Playwright coverage for income creation, fund-paid expense creation, member-paid expense creation, and missing-category server validation recovery. |
| Dialog ownership | `src/app/create-record-dialog.tsx`, `src/app/page.tsx`, `src/app/home-dashboard-layout.tsx` | Moved create-record dialog root/content into a client boundary so `/?month=...&create=income|expense` can open the correct dialog from server-rendered page state. |
| Search param handling | `src/app/page.tsx` | Added `readSearchParam` helper so page logic handles both object-style Next search params and `URLSearchParams` in tests/runtime boundaries. |
| Form controls | `src/app/record-entry-panel.tsx` | Replaced Radix select usage in the create form with styled native selects for payment source, category, and member selection. The payment-source select now submits `member` or `fund` directly instead of relying on a derived hidden input. |
| Dialog primitive | `src/components/ui/dialog.tsx` | Rendered dialog overlay/content in place rather than through `DialogPortal`, preserving fixed positioning while avoiding initial-open portal mount gaps in this Next/RSC flow. |

## TDD / Debug Notes
| Cycle | Result | Follow-up |
|---|---|---|
| Initial DB E2E | Failed because initial query-opened dialog content did not mount under the previous server/client composition. | Extracted `CreateRecordDialog` into a client component and moved dialog ownership out of `HomeDashboardLayout`. |
| Dialog mounted, Radix select blocked | Failed on category selection because Radix select content was unstable in the initial-open dialog flow. | Reworked create-record form to use native select controls for form-critical fields. |
| Fund-paid expense created refundable row | Failed because hidden `paymentSource` could lag behind the selected expense type. | Made the payment-source native select submit `paymentSource` directly. |
| Targeted DB E2E | Passed 4 create-record scenarios. | Ran full DB E2E and full local checks. |

## Verification Performed
| Command | Result |
|---|---|
| `corepack pnpm test:e2e:db e2e-db/create-record.spec.ts` | Passed: 4 tests |
| `corepack pnpm test:e2e:db` | Passed: 10 tests |
| `corepack pnpm test` | Passed: 24 files / 105 tests |
| `corepack pnpm type-check` | Passed |
| `corepack pnpm lint` | Passed |
| `corepack pnpm test:e2e` | Passed: 8 tests |

## Accepted MVP Constraints
- General-member permission matrix remains out of scope for this story and stays in the later `story-mvp-hardening-permission-matrix-browser-checks` slice.
- Server-side error redirect still does not preserve every typed field value; this matches the accepted MVP error contract.
- Success is proven by visible dashboard/reimbursement output rather than toast timing.

## Review Gate
- decision: approve
- reviewer_focus:
  - Confirm browser tests create records only through the real UI/server action path.
  - Confirm fund-paid and member-paid reimbursement behavior diverges correctly.
  - Confirm native selects are acceptable for this MVP form-critical flow.
- must_check:
  - DB-backed E2E does not insert created rows directly.
  - Dialog deep links remain `/?month=YYYY-MM&create=income|expense`.
  - Shared dialog in-place rendering does not regress existing E2E.
- acceptance_signals:
  - Full DB-backed E2E, unit, type-check, lint, and non-DB E2E are passing.
- unresolved_blockers:
  - None for local_dev verification.
- next_step:
  - verification-runner
