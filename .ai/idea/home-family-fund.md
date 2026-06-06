---
id: idea-home-family-fund
stage: idea
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - user_prompt:2026-06-06-family-accounting-web-app
  - user_prompt:2026-06-06-permissions-and-rwd
outputs:
  - product_brief
trace_links:
  - source:user_prompt:2026-06-06
  - source:user_prompt:2026-06-06-permissions-and-rwd
reviewed_at:
---

# Home Family Fund

## Problem
Families that share household money need a clear way to track money coming in, money going out, and reimbursements owed to members who pay expenses in advance. Without a shared record, it is hard to know whether monthly contributions were actually received, which fixed expenses have already been booked, and who should be reimbursed for which purchases.

## Audience
Primary users are members of one household who contribute to and spend from a shared family fund.

Key actors:

- Admin: invites members, manages member account information and permissions, and can create, edit, or delete any household record.
- Finance manager: can create records on behalf of other members, edit other members' records, and perform reimbursements.
- General member: can browse all records, create income and expenses for themselves, and edit or delete only records they created.
- Reimbursement payer: a finance manager responsible for reviewing the monthly reimbursement table and marking selected expenses as reimbursed.

Success is decided by the household users who need monthly records, reimbursement amounts, and category reports to be accurate enough to settle shared money.

## Desired Outcome
The household can maintain a trusted monthly ledger for shared funds, know which member contributions have been received, track fixed recurring income and expenses, and settle reimbursements for member-paid expenses without manually recalculating totals.

## Delivery Profile
This is an `mvp` targeting `local_dev`.

Readiness for this target means authenticated users can create and manage income, expenses, categories, recurring rules, monthly records, and reimbursement state in a local web app flow. Production concerns such as multi-household tenancy, external payment integrations, bank synchronization, and advanced audit/compliance controls are outside the first release unless later selected.

## Initial Scope
The first useful version should include:

- Authentication gate: all functional pages require login.
- Permission-controlled functionality: roles determine who can create records for others, edit or delete records, manage members, and perform reimbursements.
- Flexible finance permissions: MVP defaults finance managers to creating and editing others' records without deleting them, while admins can adjust finance-manager permissions later as the product evolves.
- Member management: admins can invite new members, manage member permissions, and update account information such as display names.
- Income recording: create income entries with amount, date/month, payer/source member, category, and notes.
- Expense recording: create expense entries with amount, date/month, category, notes, and payer member when a family member paid upfront.
- Record ownership rules: general members can create income and expenses for themselves and can modify or delete only records they created.
- Elevated record management: admins and finance managers can create income or expenses on behalf of other members and can modify other members' records; admins can also delete any member's records.
- Category management: create, edit, archive, or otherwise manage categories for both income and expenses.
- Recurring income and expense rules: define monthly recurring records such as rent, living expenses, internet fees, or other fixed items.
- Recurring booking policy: each recurring rule can be set to immediate posting or reminder-based posting.
- Immediate posting: recurring items such as auto-charged internet fees can be created in the ledger automatically for the relevant month.
- Reminder-based posting: recurring items such as monthly living expenses should appear as pending/reminder items until money is actually received or paid, then be confirmed into the ledger.
- Reimbursement table: a dedicated view showing, by month, how much should be reimbursed to each member for expenses they paid upfront.
- Expense-level reimbursement: finance managers can select individual expenses and mark them as reimbursed once, so reimbursement state is tied to the underlying expense.
- Monthly report entry point: users can view monthly income, expenses, categories, and reimbursement status.
- Create-entry entry point: users have a clear place to create income or expense records.
- Responsive web experience: desktop and mobile layouts both support the core browse, create, report, and reimbursement workflows.

## Non-Goals
The MVP should not solve:

- Bank account connection, credit card import, or automatic receipt scanning.
- Actual money transfer or payment execution.
- Tax reporting, accounting exports, or regulatory compliance workflows.
- Complex budget forecasting beyond monthly records and category summaries.
- Multi-household or organization-level permission models.
- Fine-grained custom permission builders beyond the MVP roles of admin, finance manager, and general member.
- Mobile native applications.
- Detailed audit logging beyond basic record status needed for reimbursement and monthly reporting.

## Constraints
Functional constraints:

- All application functionality must require login.
- Every authenticated member can browse all household records.
- General members can add income and expenses only for themselves and can edit or delete only records they created.
- Admins can create, edit, and delete records for any member.
- Finance managers can create and edit records for other members when needed for financial operations.
- Finance managers cannot delete other members' records in the current MVP permission set.
- Only finance managers can perform reimbursement actions.
- Only admins can invite members, manage member permissions, and update member account information such as display names.
- Income and expenses must both support categories.
- Categories must be manageable by users, not hard-coded only.
- Recurring income and expense rules must distinguish between immediate posting and reminder-based confirmation.
- Reminder-based recurring items must not affect actual ledger totals until confirmed.
- Reimbursement must support per-expense selection and one-time reimbursement marking.
- Monthly reporting and reimbursement views must be organized by month.
- The web interface must support responsive layouts for both desktop and mobile use.

Operational assumptions:

- MVP is for a single household or family fund, unless later changed.
- Currency, timezone, and date handling should be consistent for household monthly settlement; exact currency is unresolved.
- The initial app can run locally and does not yet require production hosting, backups, or external notification delivery.

## Success Metrics
The idea worked if:

- A household can complete one monthly cycle of contributions, expenses, recurring items, reports, and reimbursements in the app without spreadsheet recalculation.
- Members can confidently browse shared records while being prevented from editing or deleting records they do not own.
- Admins can manage household membership, member display names, and member permissions.
- Finance managers can create or correct records for others and complete reimbursement actions.
- Users can identify which reminder-based recurring income or expense items are still pending for a month.
- Users can see each member's monthly reimbursement amount and trace it back to individual expenses.
- Users can mark selected expenses as reimbursed once and avoid double-counting them in later reimbursement calculations.
- Users can manage categories and use them consistently in monthly reports.

## Open Questions
- What currency and locale should be assumed for amounts and monthly reports?
- Are admin and finance manager separate assignable roles, or can one member hold both roles at the same time?
- Who is allowed to manage categories and recurring rules: admin only, finance manager, or both?
- Should member invitations be email-based, link-based, or manually created accounts for MVP?
- Should recurring reminders generate in-app reminders only, or are email/push/LINE notifications required later?
- Can an expense be split across categories or members, or is one category and one upfront payer enough for MVP?
- Should reimbursements reduce the shared fund balance, or are they recorded only as settlement state against member-paid expenses?
- Should household contributions such as rent and living expenses be modeled as income from members, separate contribution types, or both?

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm whether the first release is a single-household MVP with local development as the target.
  - Validate that recurring posting, reminders, and reimbursement behavior match the household settlement process.
  - Validate the admin, finance manager, and general member permission boundaries before architecture planning.
  - Confirm which workflows must be fully optimized on mobile in the MVP.
- must_check:
  - Actors are clear enough for Event Storming.
  - Business outcomes include monthly ledger accuracy, pending recurring items, and member-paid expense reimbursement settlement.
  - Policy constraints for immediate posting, reminder confirmation, and one-time reimbursement are explicit.
  - Permission constraints for browsing, record ownership, elevated editing, reimbursement, and member management are explicit.
  - Non-goals keep payment execution and bank integrations out of scope.
- acceptance_signals:
  - Event Storming can identify commands, events, policies, and aggregates from this brief without inventing product intent.
  - Story slicing can separate authentication, authorization, member management, entry creation, recurring rules, reports, category management, and reimbursement flows.
  - Open questions are limited to decisions that can be resolved during DDD or early architecture.
- unresolved_blockers:
  - None for moving to Event Storming.
- next_step:
  - ddd-event-storming
