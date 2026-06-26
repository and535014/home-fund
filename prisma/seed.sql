-- Production-safe bootstrap seed for the real app flow.
--
-- This file creates or updates only the minimum baseline data required for a
-- real environment to accept the first admin login. It intentionally leaves
-- domain data such as categories empty so production starts from the user's
-- real setup. It must remain safe to run more than once against production:
-- do not delete user, member, ledger, category, invitation, reimbursement,
-- recurring, or Better Auth data here.
--
-- E2E fixtures live in prisma/seed.e2e.sql and are loaded only by
-- e2e/setup-db.sh after the E2E database has been recreated.
-- __SEED_GOOGLE_ACCOUNT_EMAIL__ is replaced with SEED_GOOGLE_ACCOUNT_EMAIL.

INSERT INTO "Household" ("id", "name", "updatedAt")
VALUES ('household-demo', '家庭共用金', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Allow the configured Google account to become the admin without colliding
-- with older bootstrap runs.
UPDATE "Member"
SET "googleAccountEmail" = NULL
WHERE "googleAccountEmail" = '__SEED_GOOGLE_ACCOUNT_EMAIL__'
  AND "id" <> 'member-admin';

INSERT INTO "Member" (
  "id",
  "householdId",
  "displayName",
  "googleAccountEmail",
  "googleSubject",
  "status",
  "updatedAt"
)
VALUES (
  'member-admin',
  'household-demo',
  'Admin',
  '__SEED_GOOGLE_ACCOUNT_EMAIL__',
  NULL,
  'active',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE
SET "googleAccountEmail" = EXCLUDED."googleAccountEmail",
    "status" = EXCLUDED."status",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MemberRoleAssignment" ("memberId", "role")
VALUES ('member-admin', 'admin')
ON CONFLICT ("memberId", "role") DO NOTHING;
