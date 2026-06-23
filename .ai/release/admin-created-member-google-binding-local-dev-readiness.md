---
id: release-admin-created-member-google-binding-local-dev-readiness
stage: release
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-created-member-google-binding.md
  - .ai/spec/admin-created-member-google-binding.md
  - .ai/technical-design/admin-created-member-google-binding.md
  - .ai/implementation/admin-created-member-google-binding.md
  - .ai/verification/admin-created-member-google-binding.md
outputs:
  - local_dev_release_assessment
  - release_checks
  - runtime_config
  - migration_assessment
  - accepted_risks
  - next_gate
trace_links:
  verification:
    - .ai/verification/admin-created-member-google-binding.md
  implementation:
    - .ai/implementation/admin-created-member-google-binding.md
  current_code:
    - package.json
    - README.md
    - .env.example
    - prisma/schema.prisma
    - prisma/migrations/20260623093000_encrypt_member_binding_tokens/migration.sql
    - playwright.config.ts
reviewed_at: 2026-06-23
---

# Admin-Created Member Google Binding Local Dev Readiness

## Decision

- decision: ready_for_local_dev_review
- release_target_supported: local_dev
- production_readiness: not_ready
- rationale: The slice has passing unit/domain tests, type-check, lint, build, DB-backed E2E, migration deploy in E2E setup, and documented local environment configuration. It is ready for local developer review with Docker PostgreSQL, local Google OAuth credentials, and controlled-auth E2E. It has not been assessed for preview, staging, or production.

## Included Local Dev Scope

- Admin-created member records under `/settings/members`.
- Member role and display-name capture before Google binding.
- Member-specific binding links under `/members/bind?token=...`.
- Encrypted binding token storage for admin re-copy.
- Active-link re-copy and expired-link regeneration.
- Google sign-in token preservation through `/auth/google`.
- Binding callback at `/members/bind/callback`.
- Binding acceptance that updates an existing invited member in one transaction.
- Rejection of missing, invalid, expired, used, disabled-target, already-bound-target, and already-linked-account paths.

## Release Checks

| Check | Command / Evidence | Status |
|---|---|---|
| Unit/domain/component tests | `corepack pnpm test` | pass, 35 files / 173 tests |
| Type checking | `corepack pnpm type-check` | pass |
| Lint | `corepack pnpm lint` | pass |
| Build | `corepack pnpm build` | pass, route list includes `/settings/members`, `/members/bind`, and `/members/bind/callback` |
| Targeted member-binding E2E | `corepack pnpm test:e2e e2e/admin-member-invitations.spec.ts` | pass, 7 tests |
| Full DB-backed E2E | `corepack pnpm test:e2e` | pass, 44 tests |
| Migration deploy in local/E2E path | `test:e2e` setup applies 11 migrations including `20260623093000_encrypt_member_binding_tokens` | pass |
| Local config documentation | `README.md`, `.env.example`, `e2e/.env.example` include `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY` | pass |

## Runtime Config

Required for local review:

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SEED_GOOGLE_ACCOUNT_EMAIL`

Local setup remains:

1. `corepack pnpm install`
2. `corepack pnpm db:up`
3. Fill `.env` from `.env.example`, including `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`.
4. `corepack pnpm db:deploy`
5. `corepack pnpm db:seed`
6. `corepack pnpm dev`

## Data And Migration Assessment

- Migration `20260623093000_encrypt_member_binding_tokens` drops plaintext `previewToken`, adds encrypted token fields, and creates a partial unique index for one pending invitation per member.
- E2E deploy verified the migration from a clean local database.
- Local rollback is database-reset oriented: stop the app, reset or recreate the local Docker database, and rerun migrations/seeds from the current branch.
- Production rollback is not assessed. The migration drops `previewToken`, so production rollback would require explicit backup/restore planning before any production release.

## Auth And Permission Assessment

- Controlled-auth E2E verifies general login remains separate from binding.
- Non-admin users cannot reach member management actions.
- Existing active, inactive, unlinked, general member, and finance manager access checks still pass in the full E2E suite.
- Real Google OAuth smoke is still manual for local_dev; automated tests intentionally avoid real Google credentials.

## Smoke Checks For Local Review

Recommended manual smoke after starting local dev:

- Sign in with the seeded admin Google account.
- Open `/settings/members`.
- Create a new member with `一般成員`.
- Generate and copy a binding link.
- Open the binding link in a signed-out browser profile and confirm the Google sign-in entry appears.
- Confirm missing/invalid links at `/members/bind` show `綁定連結無法使用`.
- Confirm bound and disabled members do not show binding actions.

## Accepted Local Dev Risks

- Automated OAuth callback binding uses controlled session/test coverage, not real Google OAuth end-to-end.
- E2E requires local PostgreSQL availability and resets the E2E database.
- Quality scripts that run `prisma generate` should run sequentially; parallel runs can race while cleaning generated Prisma directories.
- `MemberInvitation.memberId` remains nullable for legacy compatibility.
- Production secret rotation, backup/restore, monitoring, audit logging, abuse prevention, and hosted OAuth callback checks are out of scope for this local_dev release.

## Not Production Ready

Production readiness remains blocked until these are assessed:

- Hosted environment target and database target.
- Production `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY` storage and rotation policy.
- Production Google OAuth origin and redirect URI.
- Migration backup/restore and rollback plan for dropping `previewToken`.
- Real OAuth smoke for admin create-link-bind flow.
- Monitoring/logging/error reporting and incident response path.
- Abuse prevention, rate limiting, audit trails, and token lifecycle operations beyond regenerate-after-expiry.

## Handoff

- decision: ready_for_user_local_dev_review
- recommended_next_skill: learning-loop
- next_step: Define or explicitly skip learning signals for this local_dev slice before artifact compression.
