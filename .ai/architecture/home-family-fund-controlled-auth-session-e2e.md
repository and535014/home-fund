---
id: arch-home-family-fund-controlled-auth-session-e2e
stage: architecture
status: draft
delivery_profile: mvp
release_target: local_dev
inputs:
  - story-mvp-hardening-controlled-auth-session-e2e
  - ddd-home-family-fund
  - cu-home-family-fund
  - ia-home-family-fund-mvp-hardening
  - arch-home-family-fund-db-backed-dashboard-e2e
outputs:
  - architecture_decisions
  - boundaries
  - data_ownership
  - integration_contracts
trace_links:
  stories:
    - .ai/stories/story-mvp-hardening-controlled-auth-session-e2e.md
  bounded_contexts:
    - Identity and Access
    - Responsive Web Experience
  domain_events:
    - Member invited
    - Member account updated
    - Monthly records viewed
reviewed_at: 2026-06-16
---

# Controlled Auth Session E2E Architecture

## Delivery Profile
This architecture targets `local_dev` under the MVP profile. It proves browser-visible access states through the app-owned current-member mapping boundary without depending on external Google OAuth. It is not production OAuth verification and does not claim Better Auth provider callback coverage.

MVP-accepted risks: a non-production controlled auth contract is allowed for deterministic E2E; real Google OAuth, cookie format compatibility, CSRF/state handling, and production callback configuration remain deferred.

## Context and Forces
- The existing fixture header `x-e2e-current-member-email` bypasses Better Auth and returns a fixed finance-manager member.
- The completed DB-backed dashboard E2E now proves Prisma dashboard reads, but still enters through a fixed auth fixture.
- The story requires linked, unlinked, inactive, and unauthenticated states to be proven in browser flows.
- The current app-owned boundary is `getCurrentMemberFromHeaders` -> `resolveCurrentMemberFromRequest` -> `resolveCurrentMember` -> `resolveHouseholdAccess`.
- Better Auth tables (`User`, `Account`, `Session`) already exist in Prisma, but manually generating a valid Better Auth browser cookie is more coupled to library internals than the MVP needs.
- Local E2E already uses a dedicated `home_fund_e2e` database; controlled auth seed data should reuse that isolated database.

## Boundaries
| Boundary | Owns | Collaborates With | Reason |
|---|---|---|---|
| Controlled Auth E2E Harness | Test-only auth request contract, seeded auth/member states, Playwright assertions | Playwright, Prisma, current-member boundary | Keeps deterministic browser auth states outside production and outside external Google OAuth. |
| Current-Member Boundary | Session user to Google identity to household member mapping | Better Auth API or controlled E2E auth API, Prisma data source, Identity and Access domain | This is the behavior under test; E2E should not bypass it with a fixed member object. |
| Better Auth Persistence Boundary | `User` and `Account` rows used by current-member data source | Prisma seed/setup, controlled auth API | Provides provider/account identity rows without coupling to Better Auth cookie internals. |
| Household Member State Boundary | Active, disabled, invited/unlinked member rows | Identity and Access, Dashboard access states | Owns whether a resolved Google identity can view household data. |
| Legacy Fixture Smoke Boundary | Existing `x-e2e-current-member-email` fixed member shortcut | Fixture smoke E2E only | Remains available for fast UI smoke, but does not satisfy controlled auth/session coverage. |

## Routing, Layout, and Metadata

- route_ownership: Existing homepage `/` remains the only surface for access-state verification.
- layout_boundaries: Existing `DashboardAccessScreen` and `HomeDashboardLayout` remain unchanged.
- navigation_config_owner: No navigation changes.
- breadcrumb_or_title_source: No breadcrumb/title changes.
- route_metadata_source: No metadata changes.
- permission_visibility_enforcement: Server-side current-member resolution remains the source of truth before dashboard data is exposed.
- seo_metadata_generation: Not applicable for local-dev auth E2E.
- content_or_cms_contract: Not applicable.

## Data Ownership
| Data / Model | Owner | Readers | Consistency Need |
|---|---|---|---|
| `User` rows for controlled E2E | Controlled Auth E2E Harness | Controlled auth API, Better Auth-compatible data source if later needed | Must identify linked, unlinked, and inactive scenarios deterministically. |
| `Account` rows with `providerId = google` | Better Auth Persistence Boundary | `current-member-data-source.listAccountsForUser` | Must map a controlled session user to a Google subject. |
| `Member` rows and role/capability assignments | Household Member State Boundary | `current-member-data-source.listHouseholdMembers`, Identity and Access | Must include active linked member, disabled linked member, and no matching member for unlinked account. |
| Controlled auth request header | Controlled Auth E2E Harness | `getCurrentMemberFromHeaders` | Must be disabled in production and should return only a session user, not a fully resolved member. |
| Dashboard data | Dashboard Read Boundary from DB-backed E2E | Homepage dashboard | Linked active scenario may reuse `home_fund_e2e` seed data for dashboard visibility. |

## Integration Contracts
| Producer | Consumer | Contract | Failure / Retry Notes |
|---|---|---|---|
| E2E setup script | `home_fund_e2e` database | Seeds `User`, `Account`, and member rows for linked active, unlinked, and disabled-member scenarios. | If rows are missing, controlled auth E2E should fail at visible access-state assertions. |
| Playwright controlled auth test | Homepage | Sends a non-production header such as `x-e2e-auth-user-id` for the desired seeded user. | The test must not send `x-e2e-current-member-email`; otherwise it would bypass current-member mapping. |
| `getCurrentMemberFromHeaders` | Current-member resolution | In non-production only, converts controlled header into an auth API result `{ user }`, then calls `resolveCurrentMemberFromRequest` with the real Prisma-backed current-member data source. | In production, the controlled header is ignored and Better Auth is used normally. |
| Current-member data source | Identity and Access | Loads Better Auth `Account` rows and household members from Prisma, then maps through `resolveCurrentMember`. | Unlinked Google account returns `google_account_not_linked`; disabled/invited member returns `member_not_active`. |
| Homepage access screen | Playwright assertions | Shows sign-in gate, account-not-linked state, inactive-member state, or dashboard according to current-member result. | Household data must not appear for blocked states. |

## ADRs
### ADR-1: Use a Controlled Auth API Header, Not a Better Auth Cookie
- Status: accepted
- Decision: For local MVP E2E, use a production-disabled header contract such as `x-e2e-auth-user-id` to construct only the Better Auth session user in `getCurrentMemberFromHeaders`.
- Rationale: The story needs the app-owned current-member mapping boundary, not external OAuth or Better Auth cookie internals. A header returning only `{ user }` still exercises account lookup, member lookup, and domain access resolution.
- Consequences: This does not prove real Better Auth cookie/session serialization. That remains a deferred production/OAuth concern.

### ADR-2: Seed Better Auth-Compatible `User` and `Account` Rows
- Status: accepted
- Decision: Controlled auth E2E state should be seeded into `home_fund_e2e` using the existing Better Auth-compatible Prisma models.
- Rationale: The current-member data source already reads `Account` rows by user id. Seeded rows make linked/unlinked states visible through the same data source the app uses.
- Consequences: The E2E DB setup must add deterministic auth rows alongside household seed data.

### ADR-3: Keep Legacy Fixed-Member Header Only for Fixture Smoke
- Status: accepted
- Decision: `x-e2e-current-member-email` may remain for existing smoke tests, but controlled auth E2E must not use it.
- Rationale: The fixed-member header bypasses the current-member mapping boundary and cannot prove linked, unlinked, or inactive account behavior.
- Consequences: Verification reports must distinguish fixture auth smoke from controlled current-member coverage.

### ADR-4: Production Must Ignore All E2E Auth Controls
- Status: accepted
- Decision: Controlled auth headers and fixed-member headers remain disabled when `NODE_ENV === "production"`.
- Rationale: Test hooks must not become deployable access paths.
- Consequences: Contract tests must verify production bypass behavior for controlled auth headers.

## Visual Model

- type: architecture_map
- title: Controlled Auth Session E2E Boundary Map
- nodes:
  - id: playwright
    label: Playwright controlled auth E2E
    kind: frontend
  - id: controlled_header
    label: x-e2e-auth-user-id
    kind: integration
  - id: current_member
    label: getCurrentMemberFromHeaders
    kind: backend
  - id: controlled_auth_api
    label: controlled auth API result
    kind: module
  - id: data_source
    label: current-member Prisma data source
    kind: module
  - id: identity_access
    label: Identity and Access
    kind: bounded_context
  - id: auth_tables
    label: User and Account rows
    kind: data_store
  - id: member_rows
    label: Member status rows
    kind: data_store
  - id: access_screen
    label: Homepage access states
    kind: frontend
- edges:
  - from: playwright
    to: controlled_header
    label: sends scenario user id
  - from: controlled_header
    to: current_member
    label: read in non-production
  - from: current_member
    to: controlled_auth_api
    label: creates session user only
  - from: current_member
    to: data_source
    label: uses real Prisma data source
  - from: data_source
    to: auth_tables
    label: loads accounts
  - from: data_source
    to: member_rows
    label: loads household members
  - from: data_source
    to: identity_access
    label: resolves access
  - from: identity_access
    to: access_screen
    label: selects visible state

## Open Risks
- This architecture intentionally does not verify Better Auth cookie generation or Google OAuth callback behavior.
- A new controlled auth header is a test hook and must remain non-production only.
- If future Better Auth schema changes rename `User` or `Account` fields, seed data and data-source tests must change.
- The existing `x-e2e-current-member-email` fixture remains a parallel path; documentation and tests must keep its purpose narrow.

## Review Gate

- decision: approve
- reviewer_focus:
  - Confirm a controlled header returning only a session user is acceptable for local-dev MVP E2E.
  - Confirm Better Auth-compatible `User`/`Account` rows are the right seed contract.
  - Confirm real Google OAuth remains out of scope.
- must_check:
  - Controlled auth E2E must not send `x-e2e-current-member-email`.
  - Production ignores controlled auth headers.
  - Linked, unlinked, and inactive states go through current-member data source and Identity and Access.
- acceptance_signals:
  - Verification design can define AC and Playwright scenarios for the four access states.
  - Implementation can add setup seed rows and tests without redesigning auth.
- unresolved_blockers:
  - None for verification design.
- next_step:
  - verification-design
