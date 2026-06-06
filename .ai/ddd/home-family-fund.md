---
id: ddd-home-family-fund
stage: ddd
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - idea-home-family-fund
outputs:
  - domain_events
  - command_event_matrix
  - aggregate_candidates
  - bounded_context_candidates
trace_links:
  - .ai/idea/home-family-fund.md
reviewed_at:
---

# Home Family Fund Event Storming

## Delivery Profile
This artifact inherits `mvp` delivery and `local_dev` release target from `idea-home-family-fund`. Discovery is constrained to a single household web app where all functional pages require login, core workflows work on desktop and mobile, and payment execution, bank sync, and production hosting concerns remain outside the first release.

## Ubiquitous Language
| Term | Meaning | Context |
|---|---|---|
| Household fund | The shared family money pool being tracked. | Fund ledger |
| Member | A logged-in household participant who can browse all records. | Identity and access |
| Admin | Member who can invite members, manage account information and permissions, and edit or delete any record. | Identity and access |
| Finance manager | Member who can create or edit records for others and perform reimbursements. | Financial operations |
| General member | Member who can create records for themselves and edit or delete only records they created. | Identity and access |
| Record owner | The member who created a ledger record and controls ordinary edit/delete rights. | Authorization |
| Payer member | The member who paid an expense upfront or provided income. | Ledger |
| Income record | Confirmed money received into the household fund, categorized by source/member. | Ledger |
| Expense record | Confirmed money spent from the household fund or paid upfront by a member. | Ledger |
| Category | User-managed classification for income or expenses. | Categorization |
| Recurring rule | A monthly income or expense definition that can create or remind about expected ledger activity. | Recurring schedule |
| Immediate posting | Recurring rule mode that books an item into the ledger automatically for the target month. | Recurring schedule |
| Reminder-based posting | Recurring rule mode that creates a pending item until a member confirms that money was actually received or paid. | Recurring schedule |
| Pending recurring item | Expected income or expense not yet counted in ledger totals. | Recurring schedule |
| Monthly report | Month-organized read model of income, expenses, categories, pending items, and reimbursement status. | Reporting |
| Reimbursable expense | Expense paid upfront by a member and eligible to be paid back. | Reimbursement |
| Reimbursement | One-time settlement action marking selected reimbursable expenses as paid back. | Reimbursement |

## Event Timeline
| Order | Domain Event | Triggering Command | Actor | Business Outcome |
|---:|---|---|---|---|
| 1 | Member invited | Invite member | Admin | A new household participant can be added under admin control. |
| 2 | Member account updated | Update member account | Admin | Display name or account details stay recognizable to the household. |
| 3 | Member permissions changed | Change member permissions | Admin | Role-based access reflects household responsibilities. |
| 4 | Category created | Create category | Admin or authorized manager | Income and expenses can be classified by household language. |
| 5 | Category updated | Update category | Admin or authorized manager | Category names and status remain useful for reporting. |
| 6 | Income recorded | Record income | Member, Admin, or Finance manager | Received household money is included in monthly ledger totals. |
| 7 | Expense recorded | Record expense | Member, Admin, or Finance manager | Household spending or member-paid upfront cost is captured. |
| 8 | Member-paid expense marked reimbursable | Mark expense reimbursable | Member, Admin, or Finance manager | The reimbursement table can include expenses paid upfront by members. |
| 9 | Ledger record corrected | Correct ledger record | Record owner, Admin, or Finance manager | Mistakes can be fixed under permission rules. |
| 10 | Ledger record deleted | Delete ledger record | Record owner or Admin | Invalid records can be removed under ownership and admin rules. |
| 11 | Recurring rule created | Create recurring rule | Admin or authorized manager | Expected monthly income or expense can be tracked consistently. |
| 12 | Recurring rule updated | Update recurring rule | Admin or authorized manager | Schedule, category, amount, or posting policy can change. |
| 13 | Immediate recurring item posted | Post immediate recurring item | Recurring posting policy | Auto-posted fixed items affect the monthly ledger. |
| 14 | Recurring reminder created | Create recurring reminder | Recurring reminder policy | Expected but unconfirmed money is visible without affecting ledger totals. |
| 15 | Recurring reminder confirmed | Confirm recurring reminder | Authorized member | A pending expected item becomes a real income or expense record. |
| 16 | Monthly records viewed | View monthly records | Member | Household members can inspect all records for a month. |
| 17 | Monthly report generated | Generate monthly report | Member | The household sees monthly income, expenses, categories, and status. |
| 18 | Monthly reimbursement table generated | Generate reimbursement table | Member | Amounts owed to each member are visible by month. |
| 19 | Reimbursement expenses selected | Select expenses for reimbursement | Finance manager | The finance manager chooses exact expenses to settle. |
| 20 | Expenses reimbursed | Mark selected expenses reimbursed | Finance manager | Selected expenses are settled once and excluded from future unpaid reimbursement totals. |

## Policies
| When Event Happens | Policy / Rule | Command Issued | Notes |
|---|---|---|---|
| Member attempts to access functionality | All functional pages require login. | Authenticate member | Applies before any domain command is allowed. |
| Member permissions changed | New permissions determine allowed commands immediately. | Re-evaluate authorization | Admin is the only role that changes permissions in MVP. |
| General member records income or expense | The payer/source member must be themselves. | Record income or Record expense | Admin and finance manager can record on behalf of another member. |
| General member attempts correction or deletion | The member must be the record owner. | Correct ledger record or Delete ledger record | Other members' records are read-only to general members. |
| Admin attempts record management | Admin can create, edit, or delete any member's record. | Record, Correct, or Delete ledger record | Admin delete rights are explicit. |
| Finance manager attempts record management | Finance manager can create or edit records for others. | Record or Correct ledger record | Whether finance managers can delete others' records remains open. |
| Expense recorded with upfront payer | If the payer member should be paid back, the expense becomes reimbursable. | Mark expense reimbursable | Needs clear data distinction between household-funded and member-paid expenses. |
| Recurring rule reaches monthly schedule | Posting mode decides whether it affects totals immediately. | Post immediate recurring item or Create recurring reminder | Immediate posting counts in ledger; reminder does not. |
| Pending recurring item is confirmed | Confirmed reminder creates actual income or expense record. | Record income or Record expense | Confirmation should preserve trace to the recurring rule. |
| Monthly report requested | Include confirmed ledger records, categories, pending recurring items, and reimbursement status. | Generate monthly report | Reporting is a read model, not a separate source of truth. |
| Reimbursement table requested | Group unpaid reimbursable expenses by month and payer member. | Generate reimbursement table | Must trace totals to individual expenses. |
| Finance manager marks reimbursement | Each selected expense may be reimbursed only once. | Mark selected expenses reimbursed | Prevents double-counting settled expenses. |

## Aggregate Candidates
| Aggregate | Events Owned | Invariants | Open Questions |
|---|---|---|---|
| Household | Member invited, Member account updated, Member permissions changed | Only admins manage members and permissions; every functional user belongs to the household. | Is MVP strictly one household, or should the model allow future household IDs now? |
| MemberAccount | Member account updated, Member permissions changed | Display name identifies the member in records; permissions must map to known MVP roles. | Can a member hold admin and finance manager roles at the same time? |
| LedgerRecord | Income recorded, Expense recorded, Member-paid expense marked reimbursable, Ledger record corrected, Ledger record deleted | Records have amount, month/date, category, creator, and payer/source member; general members can modify only owned records; deleted records must not appear in totals. | Should deletion be hard delete or archived/voided state for auditability? |
| CategoryCatalog | Category created, Category updated | Income and expense records reference valid categories; categories are user-managed. | Which roles can manage categories? |
| RecurringRule | Recurring rule created, Recurring rule updated, Immediate recurring item posted, Recurring reminder created, Recurring reminder confirmed | Posting mode is either immediate or reminder-based; reminder-based items do not affect totals until confirmed. | How are missed or duplicate monthly occurrences prevented? |
| ReimbursementBatch | Reimbursement expenses selected, Expenses reimbursed | Only finance managers perform reimbursement; selected expenses can be reimbursed once; reimbursement totals trace to expense IDs. | Does reimbursement reduce fund balance or only mark settlement state? |
| MonthlyReport | Monthly records viewed, Monthly report generated, Monthly reimbursement table generated | Reports derive from ledger, recurring, category, and reimbursement data by month. | Which mobile report summaries are required for MVP? |

## Bounded Context Candidates
| Context | Language | Responsibilities | Upstream / Downstream |
|---|---|---|---|
| Identity and Access | member, admin, finance manager, general member, permission, account information | Login gate, member invitation, account profile, role assignment, authorization decisions. | Upstream to all contexts because commands require authenticated/authorized members. |
| Fund Ledger | income record, expense record, payer member, record owner, reimbursable expense | Create, correct, delete, and browse confirmed financial records; enforce record ownership rules. | Uses Identity and Access for authorization; feeds Reporting and Reimbursement. |
| Categorization | category, income category, expense category | Manage category options and classify ledger records. | Feeds Fund Ledger and Reporting. |
| Recurring Schedule | recurring rule, immediate posting, reminder-based posting, pending recurring item | Manage monthly expected items, auto-post immediate items, and confirm reminder items. | Creates ledger records in Fund Ledger; feeds Reporting with pending items. |
| Reimbursement | reimbursement table, selected expense, reimbursed expense, payer member | Calculate unpaid member-paid expenses by month and mark selected expenses reimbursed once. | Uses Fund Ledger expenses and Identity and Access finance-manager permissions; feeds Reporting. |
| Reporting | monthly records, monthly report, category summary, reimbursement status | Month-based views for records, category totals, pending recurring items, and reimbursement status. | Downstream read model from Ledger, Categorization, Recurring Schedule, and Reimbursement. |
| Responsive Web Experience | desktop layout, mobile layout, browse flow, create flow, report flow, reimbursement flow | Ensure core workflows are usable on desktop and mobile. | Presentation concern downstream from all domain contexts; not source of financial truth. |

## Visual Model

- type: event_flow
- title: Monthly Household Fund Flow
- nodes:
  - id: actor_member
    label: Member
    kind: actor
  - id: actor_admin
    label: Admin
    kind: actor
  - id: actor_finance_manager
    label: Finance manager
    kind: actor
  - id: command_record_income
    label: Record income
    kind: command
  - id: command_record_expense
    label: Record expense
    kind: command
  - id: event_income_recorded
    label: Income recorded
    kind: event
  - id: event_expense_recorded
    label: Expense recorded
    kind: event
  - id: aggregate_ledger_record
    label: LedgerRecord
    kind: aggregate
  - id: command_create_recurring_rule
    label: Create recurring rule
    kind: command
  - id: aggregate_recurring_rule
    label: RecurringRule
    kind: aggregate
  - id: policy_posting_mode
    label: Posting mode policy
    kind: policy
  - id: event_immediate_posted
    label: Immediate recurring item posted
    kind: event
  - id: event_reminder_created
    label: Recurring reminder created
    kind: event
  - id: command_confirm_reminder
    label: Confirm recurring reminder
    kind: command
  - id: event_reminder_confirmed
    label: Recurring reminder confirmed
    kind: event
  - id: command_generate_reimbursement_table
    label: Generate reimbursement table
    kind: command
  - id: event_reimbursement_table_generated
    label: Monthly reimbursement table generated
    kind: event
  - id: command_mark_reimbursed
    label: Mark selected expenses reimbursed
    kind: command
  - id: event_expenses_reimbursed
    label: Expenses reimbursed
    kind: event
  - id: aggregate_reimbursement_batch
    label: ReimbursementBatch
    kind: aggregate
  - id: context_reporting
    label: Reporting
    kind: context
- edges:
  - from: actor_member
    to: command_record_income
    label: creates own income
  - from: actor_member
    to: command_record_expense
    label: creates own expense
  - from: actor_admin
    to: command_record_income
    label: can record for anyone
  - from: actor_finance_manager
    to: command_record_expense
    label: can record for others
  - from: command_record_income
    to: event_income_recorded
    label: causes
  - from: command_record_expense
    to: event_expense_recorded
    label: causes
  - from: event_income_recorded
    to: aggregate_ledger_record
    label: stored by
  - from: event_expense_recorded
    to: aggregate_ledger_record
    label: stored by
  - from: actor_admin
    to: command_create_recurring_rule
    label: configures
  - from: command_create_recurring_rule
    to: aggregate_recurring_rule
    label: changes
  - from: aggregate_recurring_rule
    to: policy_posting_mode
    label: evaluated monthly by
  - from: policy_posting_mode
    to: event_immediate_posted
    label: immediate
  - from: policy_posting_mode
    to: event_reminder_created
    label: reminder
  - from: event_reminder_created
    to: command_confirm_reminder
    label: awaits
  - from: command_confirm_reminder
    to: event_reminder_confirmed
    label: causes
  - from: event_reminder_confirmed
    to: aggregate_ledger_record
    label: creates confirmed record
  - from: actor_member
    to: command_generate_reimbursement_table
    label: views
  - from: command_generate_reimbursement_table
    to: event_reimbursement_table_generated
    label: causes
  - from: event_reimbursement_table_generated
    to: context_reporting
    label: feeds
  - from: actor_finance_manager
    to: command_mark_reimbursed
    label: settles
  - from: command_mark_reimbursed
    to: event_expenses_reimbursed
    label: causes
  - from: event_expenses_reimbursed
    to: aggregate_reimbursement_batch
    label: recorded by

## Risks and Open Questions
- Currency and locale are unresolved; Taiwan locale and TWD may be likely but should be confirmed before implementation.
- Role composition is unresolved: admin and finance manager may need to be independent roles that one member can both hold.
- Category and recurring-rule management permissions are unresolved; current artifact marks them as admin or authorized manager.
- Finance manager delete permission is unresolved; current domain assumes finance managers can create/edit for others and only admins can delete any member's record.
- Member invitation mechanism is unresolved: email invitation, invite link, or manually created accounts.
- Reminder delivery is unresolved; MVP can use in-app pending reminders unless external notification is selected later.
- Expense split rules are unresolved; MVP assumes one category and one upfront payer unless changed.
- Reimbursement accounting effect is unresolved; current model marks settlement state and leaves whether fund balance changes as an open policy decision.
- Deletion semantics are unresolved; hard delete is simpler, but void/archive may better protect financial history.
- RWD acceptance needs concrete workflow priority: browse, create, monthly report, reimbursement, and member management may need different mobile density.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate event names and whether they match household financial language.
  - Confirm permission boundaries for admin, finance manager, and general member.
  - Confirm whether reimbursement is only settlement status or also a fund-balance transaction.
  - Confirm category and recurring-rule management roles.
- must_check:
  - Events are business facts in past tense, not technical operations.
  - Commands show actor intent and can drive later story slicing.
  - Policies cover login, authorization, recurring posting, reminder confirmation, and one-time reimbursement.
  - Aggregates identify invariants without forcing implementation architecture.
  - Bounded contexts separate identity, ledger, recurring, reimbursement, reporting, and responsive presentation language.
- acceptance_signals:
  - Story slicing can derive separate slices for login/access, member management, ledger entry, category management, recurring rules, reports, reimbursement, and RWD.
  - Unresolved questions are explicit and do not block initial story slicing.
  - Domain rules protect against unauthorized edits, unconfirmed reminder totals, and double reimbursement.
- unresolved_blockers:
  - None for moving to Story Slicing.
- next_step:
  - story-slicing
