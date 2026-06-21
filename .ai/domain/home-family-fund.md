---
id: ddd-home-family-fund
stage: ddd
status: draft
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - idea-home-family-fund
  - admin-only-category-management
outputs:
  - domain_events
  - command_event_matrix
  - aggregate_candidates
  - bounded_context_candidates
trace_links:
  - .ai/intent/home-family-fund.md
  - .ai/intent/admin-only-category-management.md
  - .ai/intent/admin-google-oauth-member-invitations.md
reviewed_at: 2026-06-18
---

# Home Family Fund Event Storming

## Delivery Profile
This artifact inherits `mvp` delivery and `local_dev` release target from `idea-home-family-fund`. Discovery is constrained to a single household web app where all functional pages require login, core workflows work on desktop and mobile, and payment execution, bank sync, and production hosting concerns remain outside the first release.

## Ubiquitous Language
| Term | Meaning | Context |
|---|---|---|
| Household fund | The shared family money pool being tracked. | Fund ledger |
| Member | A household participant who signs in with Google and can browse all records after being recognized by the app. | Identity and access |
| Invited member | A household participant pre-created by an admin through an invite, usually by Google email, who cannot access household data until the app's activation/linking policy is satisfied. | Identity and access |
| Admin | Member who can invite members, manage account information and permissions, and edit or delete any record. | Identity and access |
| Finance manager | Member who can create or edit records for others and perform reimbursements; MVP does not grant delete permission for other members' records. | Financial operations |
| General member | Member who can create records for themselves and edit or delete only records they created. | Identity and access |
| Display name | App-owned member name shown to all household users in navigation, member lists, records, reports, and attribution. Defaults from Google profile name when first linked, but admins can edit it. | Identity and access |
| Avatar | Member image sourced from Google profile data for this slice. Admins cannot edit avatars. | Identity and access |
| Google profile defaults | Name and image returned by Google OAuth and used to initialize member display name and avatar when available. | Identity and access |
| Sign-in gate | The unauthenticated state where users start Google sign-in. It may live on `/` or a dedicated login route depending on UX design. | Identity and access / Web experience |
| Logout | Member action that ends the app session and returns the browser to an unauthenticated sign-in surface so another Google account can be selected. | Identity and access |
| Record owner | The member who created a ledger record and controls ordinary edit/delete rights. | Authorization |
| Payer member | The member who paid an expense upfront or provided income. | Ledger |
| Income record | Confirmed money received into the household fund, categorized by source/member. | Ledger |
| Expense record | Confirmed household spending paid either directly from the fund or upfront by a member. | Ledger |
| Ledger record correction | An authorized change to an existing income or expense record's editable financial details. | Ledger |
| Ledger record deletion | User-facing removal of a mistaken record from active monthly views; implemented as a voided ledger record for auditability and relationship safety unless a future production audit decision changes it. | Ledger |
| Voided ledger record | A ledger record intentionally excluded from monthly totals, category summaries, and refundable expense calculations while retaining its identity for audit and relationship integrity. | Ledger / Reporting |
| Category | Admin-managed classification for income or expenses. | Categorization |
| Category management | Admin-only workflow for maintaining income and expense categories. | Categorization |
| Category sidebar entry | Navigation entry for category management; visible only to admins. | Identity and access |
| Category visual identity | The admin-managed color and icon used to recognize a category across forms, records, and reports. | Categorization / Reporting |
| Category color | A selected color from the approved category palette; used for badges, selectors, and category summary charts. | Categorization / Reporting |
| Category icon | A selected icon key from the approved category icon registry, backed by the app's Lucide icon set. | Categorization / Web experience |
| Category sort order | Admin-managed active-category order within a household and category type; used by new-record category choices. | Categorization / Fund ledger |
| Active category | Category available for new income or expense records. | Categorization |
| Archived category | Category unavailable for new records but still readable on historical records and reports. | Categorization / Reporting |
| Recurring rule | A monthly income or expense definition that can create or remind about expected ledger activity. | Recurring schedule |
| Immediate posting | Recurring rule mode that books an item into the ledger automatically for the target month. | Recurring schedule |
| Reminder-based posting | Recurring rule mode that creates a pending item until a member confirms that money was actually received or paid. | Recurring schedule |
| Pending recurring item | Expected income or expense not yet counted in ledger totals. | Recurring schedule |
| Monthly report | Month-organized read model of income, expenses, categories, pending items, and reimbursement status. | Reporting |
| Fund-paid expense | Expense paid directly from the household fund; it is not refundable to a member. | Ledger |
| Member-paid expense | Expense paid upfront by a member; it starts as refundable/unreimbursed and appears in the reimbursement table until settled. | Reimbursement |
| Refundable expense | Member-paid expense that has not yet been reimbursed. | Reimbursement |
| Reimbursed expense | Member-paid expense that a finance manager has marked as reimbursed. | Reimbursement |
| Reimbursement | One-time settlement action marking selected member-paid expenses as reimbursed. The user-facing action may be labeled `退款`, but the MVP does not execute an external money transfer. | Reimbursement |
| Record detail reimbursement | A single-record reimbursement action launched from an eligible member-paid expense detail dialog after confirmation. | Reimbursement / Responsive Web Experience |

## Event Timeline
| Order | Domain Event | Triggering Command | Actor | Business Outcome |
|---:|---|---|---|---|
| 1 | Member invited | Invite member | Admin | A new household participant can be added under admin control. |
| 2 | Member account updated | Update member account | Admin | Display name or account details stay recognizable to the household. |
| 3 | Member permissions changed | Change member permissions | Admin | Role-based access reflects household responsibilities. |
| 4 | Category management entry revealed | Resolve dashboard navigation | Admin | Admins can discover category management from the sidebar. |
| 5 | Category management entry withheld | Resolve dashboard navigation | Finance manager or General member | Non-admin members do not see a management entry they cannot use. |
| 6 | Category management page opened | Open category management page | Admin | Admin can review and maintain income and expense categories. |
| 7 | Category management page access denied | Open category management page | Finance manager or General member | Non-admin direct visits do not expose category management. |
| 8 | Category created | Create category | Admin | Income and expenses can be classified by household language. |
| 9 | Category renamed | Rename category | Admin | Active category labels remain useful without changing historical references. |
| 10 | Category archived | Archive category | Admin | Category is removed from new-record choices while historical records remain understandable. |
| 11 | Category visual identity changed | Change category visual identity | Admin | Category color and icon stay recognizable across category management, record forms, historical records, and reports. |
| 12 | Category order changed | Reorder categories | Admin | Active category choices appear in the household's preferred order when members create records. |
| 13 | Category management command rejected | Create, rename, archive, change visual identity, or reorder category | Finance manager or General member | Non-admin category mutations do not change the catalog. |
| 14 | Income recorded | Record income | Member, Admin, or Finance manager | Received household money is included in monthly ledger totals. |
| 15 | Expense recorded | Record expense | Member, Admin, or Finance manager | Household spending is captured with a payment source of fund-paid or member-paid. |
| 16 | Member-paid expense became refundable | Record member-paid expense | Member, Admin, or Finance manager | A member-paid expense appears in the reimbursement table as refundable/unreimbursed. |
| 17 | Ledger record corrected | Correct ledger record | Record owner, Admin, or Finance manager | Mistakes can be fixed under permission rules. |
| 18 | Ledger record voided | Delete ledger record | Record owner or Admin | Invalid records are removed from active financial views under ownership and admin rules while retaining audit trace. |
| 19 | Recurring rule created | Create recurring rule | Admin or authorized manager | Expected monthly income or expense can be tracked consistently. |
| 20 | Recurring rule updated | Update recurring rule | Admin or authorized manager | Schedule, category, amount, or posting policy can change. |
| 21 | Immediate recurring item posted | Post immediate recurring item | Recurring posting policy | Auto-posted fixed items affect the monthly ledger. |
| 22 | Recurring reminder created | Create recurring reminder | Recurring reminder policy | Expected but unconfirmed money is visible without affecting ledger totals. |
| 23 | Recurring reminder confirmed | Confirm recurring reminder | Authorized member | A pending expected item becomes a real income or expense record. |
| 24 | Monthly records viewed | View monthly records | Member | Household members can inspect all records for a month. |
| 25 | Monthly report generated | Generate monthly report | Member | The household sees monthly income, expenses, categories, and status. |
| 26 | Monthly reimbursement table generated | Generate reimbursement table | Member | Amounts owed to each member are visible by month. |
| 27 | Reimbursement expenses selected | Select expenses for reimbursement | Finance manager | The finance manager chooses exact expenses to settle. |
| 28 | Expenses reimbursed | Mark selected expenses reimbursed | Finance manager | Selected expenses are settled once and excluded from future unpaid reimbursement totals. |
| 29 | Record detail reimbursement confirmed | Confirm record detail reimbursement | Finance manager | A finance manager confirms the `退款` action for one eligible refundable member-paid expense from the record detail dialog. |
| 30 | Record detail expense reimbursed | Reimburse record detail expense | Finance manager | One eligible member-paid expense is marked reimbursed from its record detail and excluded from future unpaid reimbursement totals. |

## Identity and Access Membership Events
| Domain Event | Triggering Command | Actor | Business Outcome |
|---|---|---|---|
| Admin signed in with Google | Sign in with Google | Admin | A seeded or previously linked admin can access household functions through a real Google OAuth session. |
| Member invited by email | Invite member by Google email | Admin | A future household participant is registered under admin control before accessing household data. |
| Invited Google account matched | Sign in with Google | Invited member | The app recognizes the intended Google email and can apply the selected activation/linking policy. |
| Member profile initialized from Google | Complete first Google account link | System | New member display name and avatar have sensible defaults from Google profile data. |
| Member display name changed | Update member display name | Admin | The name all household users see changes without changing Google identity. |
| Logout completed | Log out | Member | The current session ends and a different Google account can be selected. |

## Policies
| When Event Happens | Policy / Rule | Command Issued | Notes |
|---|---|---|---|
| Member attempts to access functionality | All functional pages require Google sign-in and app-owned member authorization. | Authenticate member | Google proves identity; the app decides household membership, roles, and capabilities. |
| Admin needs to invite a household participant | MVP invitation uses an admin-owned invitation flow; email-based invitation is the leading local_dev policy unless Domain Discovery selects invite links. | Invite member by Google email | Real email delivery may be out of scope for local_dev; the app still records invite state. |
| Google account signs in for the first time | Google profile name and image can initialize display name and avatar, but app-owned membership decides access. | Link Google account | Display name becomes app-owned after initialization; avatar remains Google-owned for this slice. |
| Admin updates member profile | Admin can update display name only; admins cannot edit avatars. | Update member display name | The updated display name is visible to all users wherever member names appear. |
| Member wants to edit own profile | Self-service display-name/avatar editing is deferred from this slice. | None in MVP slice | Profile management remains admin-only for display name; avatar remains Google-sourced. |
| Member logs out | Logout ends the Better Auth/app session and returns to an unauthenticated sign-in surface. | Log out | Enables switching Google accounts and verifies invitation/wrong-account states. |
| Member permissions changed | New permissions determine allowed commands immediately. | Re-evaluate authorization | Admin is the only role that changes permissions in MVP. |
| Dashboard navigation is resolved | Category management sidebar entry is visible only to admins. | Resolve dashboard navigation | Finance managers and general members must not see the category entry, even if they have `manage_categories` capability. |
| Category management page is requested | Only admins can browse category management. | Open category management page | Direct route access must be denied server-side for non-admin members; hidden sidebar is not sufficient. |
| Category management command is submitted | Only admins can create, rename, archive, change visual identity, or reorder categories. | Create, Rename, Archive, Change category visual identity, or Reorder categories | `manage_categories` capability is dormant for category management in this MVP slice unless future approved delegation reintroduces it. |
| Category is created | New active categories receive a required color, icon, and sort position. If the admin does not choose them, system defaults are applied. | Create category | Default sort position appends the category to the end of its income/expense type. Defaults must be deterministic for seeds and migrations. |
| Category visual identity is changed | Category color must come from the approved category palette, and category icon must come from the approved Lucide-backed icon registry. | Change category visual identity | Arbitrary remote images and free-form icon names are outside MVP. Palette choice protects contrast and visual consistency. |
| Category order is changed | Active categories can be manually reordered within the same household and category type. | Reorder categories | Ordering controls the category options for new income/expense records. Missing sort positions fall back to deterministic name ordering only for recovery/migration compatibility. |
| Category is archived | Archived categories remain readable but unavailable for new records. | Archive category | Historical records and reports keep category labels; new income/expense forms list only active categories. |
| Archived category is displayed | Archived categories retain their last saved color and icon for historical records and admin review. | View records or reports | Archived categories do not participate in active-category ordering used by new-record forms. Editing archived visual identity is deferred unless a future approved slice explicitly requires it. |
| General member records income or expense | The payer/source member must be themselves. | Record income or Record expense | Admin and finance manager can record on behalf of another member. |
| General member attempts correction or deletion | The member must be the record owner. | Correct ledger record or Delete ledger record | Other members' records are read-only to general members. |
| Admin attempts record management | Admin can create, edit, or delete any member's record. | Record, Correct, or Delete ledger record | Admin delete rights are explicit. |
| Finance manager attempts record management | Finance manager can create or edit records for others, but cannot delete other members' records in the MVP permission set. | Record or Correct ledger record | Admins can later adjust finance-manager permissions as the product evolves. |
| Ledger record is corrected | Editable fields can change only if the target category remains valid for the record type and the resulting payment/source member choices are still authorized. | Correct ledger record | Correction must update monthly totals, category summaries, and refundable expense calculations after refresh. |
| Ledger record is deleted | Deletion means voiding the record for MVP local_dev: active reports, record lists, category summaries, and reimbursement tables exclude it, but its identity is retained for audit trace and existing relational references. | Delete ledger record | Hard deletion is deferred because reimbursed expenses can be referenced by reimbursement batches and because financial corrections benefit from traceability. |
| Reimbursed member-paid expense is deleted | Voiding a reimbursed expense must preserve the historical reimbursement batch trace and remove the expense from active monthly financial summaries. | Delete ledger record | Technical design must decide whether the UI permits this directly, requires admin-only treatment, or blocks it with explanatory copy for MVP. |
| Expense recorded with fund payment source | Fund-paid expenses do not enter the reimbursement table. | Record expense | Payment source distinguishes fund-paid from member-paid expenses. |
| Expense recorded with member payment source | Member-paid expenses become refundable/unreimbursed and appear in the reimbursement table until reimbursed. | Record member-paid expense | This is the "可退款" state before settlement. |
| Recurring rule reaches monthly schedule | Posting mode decides whether it affects totals immediately. | Post immediate recurring item or Create recurring reminder | Immediate posting counts in ledger; reminder does not. |
| Pending recurring item is confirmed | Confirmed reminder creates actual income or expense record. | Record income or Record expense | Confirmation should preserve trace to the recurring rule. |
| Monthly report requested | Include confirmed ledger records, categories, pending recurring items, and reimbursement status. | Generate monthly report | Reporting is a read model, not a separate source of truth. |
| Reimbursement table requested | Group refundable member-paid expenses by month and payer member. | Generate reimbursement table | Must trace totals to individual expenses. |
| Finance manager marks reimbursement | Each selected refundable expense may be marked reimbursed only once. | Mark selected expenses reimbursed | Changes status from refundable/unreimbursed to reimbursed and prevents double-counting. |
| Record detail reimbursement requested | A record detail `退款` action is available only for active member-paid expenses that are currently refundable, and only to actors authorized to perform reimbursement. | Reimburse record detail expense | Income records, fund-paid expenses, voided records, already reimbursed expenses, and unauthorized actors must not create reimbursement state changes. |
| Record detail reimbursement submitted | The actor must confirm before the selected expense is marked reimbursed. | Confirm record detail reimbursement | Confirmation protects against accidental one-record settlement from the detail dialog. |

## Aggregate Candidates
| Aggregate | Events Owned | Invariants | Open Questions |
|---|---|---|---|
| Household | Member invited, Member account updated, Member permissions changed, Member invited by email | Only admins manage members and permissions; every functional user belongs to the household. | Is MVP strictly one household, or should the model allow future household IDs now? |
| MemberAccount | Member account updated, Member permissions changed, Invited Google account matched, Member profile initialized from Google, Member display name changed | Display name identifies the member in records and is app-owned; avatar is Google-owned for this slice; permissions must map to known MVP roles; admins can adjust finance-manager permissions over time. | Can a member hold admin and finance manager roles at the same time? Should invited members auto-activate on email match or require admin approval? |
| LedgerRecord | Income recorded, Expense recorded, Member-paid expense became refundable, Ledger record corrected, Ledger record voided | Records have amount, month/date, category, creator, payment source, payer/source member, reimbursement status when member-paid, and active/voided lifecycle; general members can modify only owned records; voided records must not appear in active totals, record lists, category summaries, or refundable expense calculations. | Should a reimbursed member-paid expense be directly voidable in MVP, admin-only, or blocked until reimbursement reversal exists? |
| CategoryCatalog | Category created, Category renamed, Category archived, Category visual identity changed, Category order changed, Category management command rejected | Income and expense records reference valid categories; only admins create, rename, archive, change visual identity, and reorder categories; active categories are available for new records; active category choices are ordered by household/type sort order; archived categories remain readable with their saved visual identity for historical records and reports. | Should category name uniqueness compare only active categories, or also archived categories of the same type? |
| RecurringRule | Recurring rule created, Recurring rule updated, Immediate recurring item posted, Recurring reminder created, Recurring reminder confirmed | Posting mode is either immediate or reminder-based; reminder-based items do not affect totals until confirmed. | How are missed or duplicate monthly occurrences prevented? |
| ReimbursementBatch | Reimbursement expenses selected, Expenses reimbursed, Record detail reimbursement confirmed, Record detail expense reimbursed | Only finance managers perform reimbursement; selected refundable expenses can be marked reimbursed once; reimbursement totals trace to expense IDs; record-detail reimbursement is the single-expense variant of the same settlement invariant. | Does reimbursement reduce fund balance or only mark settlement state? |
| MonthlyReport | Monthly records viewed, Monthly report generated, Monthly reimbursement table generated | Reports derive from ledger, recurring, category, and reimbursement data by month. | Which mobile report summaries are required for MVP? |

## Bounded Context Candidates
| Context | Language | Responsibilities | Upstream / Downstream |
|---|---|---|---|
| Identity and Access | member, invited member, Google account, admin, finance manager, general member, permission, display name, avatar, account information, logout | Google sign-in gate, logout, member invitation/linking, account profile defaults, admin-managed display names, role assignment, authorization decisions. | Upstream to all contexts because commands require authenticated/authorized members and member names appear throughout financial records and reports. |
| Fund Ledger | income record, expense record, payment source, payer member, record owner, fund-paid expense, member-paid expense | Create, correct, delete, and browse confirmed financial records; enforce record ownership rules. | Uses Identity and Access for authorization; feeds Reporting and Reimbursement. |
| Categorization | category, income category, expense category, category visual identity, category color, category icon, category sort order, active category, archived category | Admin-only category management, category lifecycle, visual identity, and active-category ordering; classify ledger records by active categories while preserving archived labels and visual identity for history. | Uses Identity and Access for admin-only authorization; feeds Fund Ledger and Reporting. |
| Recurring Schedule | recurring rule, immediate posting, reminder-based posting, pending recurring item | Manage monthly expected items, auto-post immediate items, and confirm reminder items. | Creates ledger records in Fund Ledger; feeds Reporting with pending items. |
| Reimbursement | reimbursement table, refundable expense, selected expense, reimbursed expense, payer member, record detail reimbursement | Calculate refundable member-paid expenses by month and mark selected expenses reimbursed once, including a single-record path from the record detail dialog. | Uses Fund Ledger expenses and Identity and Access finance-manager permissions; feeds Reporting. |
| Reporting | monthly records, monthly report, category summary, category color, reimbursement status | Month-based views for records, category totals, pending recurring items, and reimbursement status; category summaries use persisted category visual identity when available. | Downstream read model from Ledger, Categorization, Recurring Schedule, and Reimbursement. |
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
- Primary UI locale is decided as Traditional Chinese (`zh-TW`); currency remains unresolved, with TWD likely for MVP.
- Role composition is unresolved: admin and finance manager may need to be independent roles that one member can both hold.
- Category management permission is decided for MVP: only admins can see the category sidebar entry, browse category management, create categories, rename categories, or archive categories. `manage_categories` capability is dormant for this workflow unless future delegation is approved.
- Category visual identity and ordering are decided for MVP: admins can configure active categories with approved palette colors, approved Lucide-backed icons, and manual order within each category type; new categories append to their type by default; archived categories retain visual identity for history but do not participate in new-record ordering.
- Recurring-rule management permissions remain unresolved; current artifact marks them as admin or authorized manager.
- Finance manager delete permission is decided for MVP: finance managers cannot delete other members' records. Admin-managed permission expansion may allow this later if explicitly enabled.
- Member invitation/linking mechanism is narrowed for the active slice: admin-managed Google email invitation is the leading MVP path, with invite links, first-login approval, and manual account linking still to be evaluated during targeted discovery.
- Display-name ownership is decided for the active slice: Google profile can provide the default, but app-owned display name is what everyone sees, and admins can edit display names.
- Avatar ownership is decided for the active slice: Google profile provides the avatar, and admins cannot edit avatars. Whether avatar syncs every login or is copied once remains open.
- Self-service profile editing is deferred from the active slice; non-admin members cannot edit their own display name in this MVP path.
- Logout is required for the active slice so users can end sessions and switch Google accounts; exact UI placement and return route remain UX decisions.
- Reminder delivery is unresolved; MVP can use in-app pending reminders unless external notification is selected later.
- Expense split rules are unresolved; MVP assumes one category and one upfront payer unless changed.
- Reimbursement accounting effect is unresolved; current model changes member-paid expenses from refundable/unreimbursed to reimbursed and leaves whether fund balance changes as an open policy decision.
- Record detail reimbursement wording is decided for the active slice: the button label is `退款`, and it marks an eligible member-paid expense reimbursed after confirmation; it does not execute an external payment transfer.
- Deletion semantics are unresolved; hard delete is simpler, but void/archive may better protect financial history.
- RWD acceptance needs concrete workflow priority: browse, create, monthly report, reimbursement, and member management may need different mobile density.

## Review Gate

- decision: approve
- reviewer_focus:
  - Validate event names and whether they match household financial language.
  - Confirm permission boundaries for admin, finance manager, and general member.
  - Confirm whether reimbursement is only settlement status or also a fund-balance transaction.
  - Confirm recurring-rule management roles.
- must_check:
  - Events are business facts in past tense, not technical operations.
  - Commands show actor intent and can drive later story slicing.
  - Policies cover login, authorization, recurring posting, reminder confirmation, and one-time reimbursement.
  - Aggregates identify invariants without forcing implementation architecture.
  - Bounded contexts separate identity, ledger, recurring, reimbursement, reporting, and responsive presentation language.
- acceptance_signals:
  - Story slicing can derive separate slices for login/access, member management, admin-only category management, ledger entry, recurring rules, reports, reimbursement, and RWD.
  - Unresolved questions are explicit and do not block initial story slicing.
  - Domain rules protect against unauthorized edits, unconfirmed reminder totals, and double reimbursement.
- unresolved_blockers:
  - None for moving to Story Slicing.
- next_step:
  - story-slicing
