-- Development seed data.
--
-- This file is a template used by prisma/seed.sh.
-- __SEED_GOOGLE_ACCOUNT_EMAIL__ is replaced with SEED_GOOGLE_ACCOUNT_EMAIL.

INSERT INTO "Household" ("id", "name", "updatedAt")
VALUES ('household-demo', '家庭共用金', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET "name" = EXCLUDED."name",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Allow local seed identities to move between seeded members without hitting
-- unique constraints from a previous seed run.
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
VALUES
  (
    'member-admin',
    'household-demo',
    'Admin',
    '__SEED_GOOGLE_ACCOUNT_EMAIL__',
    'google-e2e-admin',
    'active',
    CURRENT_TIMESTAMP
  ),
  (
    'member-mei',
    'household-demo',
    'Mei',
    'mei@example.com',
    'google-e2e-general',
    'active',
    CURRENT_TIMESTAMP
  ),
  (
    'member-kai',
    'household-demo',
    'Kai',
    'kai@example.com',
    NULL,
    'active',
    CURRENT_TIMESTAMP
  ),
  (
    'member-fin',
    'household-demo',
    'Lin',
    NULL,
    'google-e2e-linked',
    'active',
    CURRENT_TIMESTAMP
  ),
  (
    'member-e2e-disabled',
    'household-demo',
    'Disabled Lin',
    'e2e-disabled@example.com',
    'google-e2e-disabled',
    'disabled',
    CURRENT_TIMESTAMP
  ),
  (
    'member-seed-invited',
    'household-demo',
    'seed-invited@example.com',
    'seed-invited@example.com',
    NULL,
    'invited',
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE
SET "displayName" = EXCLUDED."displayName",
    "googleAccountEmail" = EXCLUDED."googleAccountEmail",
    "googleSubject" = EXCLUDED."googleSubject",
    "status" = EXCLUDED."status",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MemberRoleAssignment" ("memberId", "role")
VALUES
  ('member-admin', 'admin'),
  ('member-mei', 'general_member'),
  ('member-kai', 'general_member'),
  ('member-fin', 'finance_manager'),
  ('member-e2e-disabled', 'general_member'),
  ('member-seed-invited', 'general_member')
ON CONFLICT ("memberId", "role") DO NOTHING;

INSERT INTO "MemberInvitation" (
  "id",
  "householdId",
  "memberId",
  "googleAccountEmail",
  "tokenHash",
  "previewToken",
  "status",
  "expiresAt",
  "createdById",
  "updatedAt"
)
VALUES (
  'invite-seed-invited',
  'household-demo',
  'member-seed-invited',
  'seed-invited@example.com',
  'fb6bd43e35b03ee100246562795d5393a4973b110770b5d5aeda04f398d79cdb',
  'seed-invite-token',
  'pending',
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  'member-admin',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE
SET "googleAccountEmail" = EXCLUDED."googleAccountEmail",
    "tokenHash" = EXCLUDED."tokenHash",
    "previewToken" = EXCLUDED."previewToken",
    "status" = EXCLUDED."status",
    "expiresAt" = EXCLUDED."expiresAt",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MemberCapabilityAssignment" ("memberId", "capability")
VALUES
  ('member-fin', 'manage_categories')
ON CONFLICT ("memberId", "capability") DO NOTHING;

INSERT INTO "User" (
  "id",
  "name",
  "email",
  "emailVerified",
  "image",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'user-e2e-admin',
    'Admin E2E User',
    'user-e2e-admin@seed.local',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'user-e2e-linked',
    'Linked E2E User',
    'user-e2e-linked@seed.local',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'user-e2e-unlinked',
    'Unlinked E2E User',
    'user-e2e-unlinked@seed.local',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'user-e2e-general',
    'General E2E User',
    'user-e2e-general@seed.local',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'user-e2e-disabled',
    'Disabled E2E User',
    'user-e2e-disabled@seed.local',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE
SET "name" = EXCLUDED."name",
    "email" = EXCLUDED."email",
    "emailVerified" = EXCLUDED."emailVerified",
    "image" = EXCLUDED."image",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Account" (
  "id",
  "accountId",
  "providerId",
  "userId",
  "accessToken",
  "refreshToken",
  "idToken",
  "accessTokenExpiresAt",
  "refreshTokenExpiresAt",
  "scope",
  "password",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'account-e2e-admin-google',
    'google-e2e-admin',
    'google',
    'user-e2e-admin',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'account-e2e-linked-google',
    'google-e2e-linked',
    'google',
    'user-e2e-linked',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'account-e2e-unlinked-google',
    'google-e2e-unlinked',
    'google',
    'user-e2e-unlinked',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'account-e2e-general-google',
    'google-e2e-general',
    'google',
    'user-e2e-general',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'account-e2e-disabled-google',
    'google-e2e-disabled',
    'google',
    'user-e2e-disabled',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE
SET "accountId" = EXCLUDED."accountId",
    "providerId" = EXCLUDED."providerId",
    "userId" = EXCLUDED."userId",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Category" ("id", "householdId", "type", "name", "status", "updatedAt")
VALUES
  ('income-rent', 'household-demo', 'income', '房租', 'active', CURRENT_TIMESTAMP),
  ('income-living', 'household-demo', 'income', '生活費', 'active', CURRENT_TIMESTAMP),
  ('expense-grocery', 'household-demo', 'expense', '日用品', 'active', CURRENT_TIMESTAMP),
  ('expense-internet', 'household-demo', 'expense', '網路費', 'active', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET "name" = EXCLUDED."name",
    "status" = EXCLUDED."status",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "LedgerRecord" (
  "id",
  "householdId",
  "type",
  "name",
  "amountCents",
  "occurredOn",
  "categoryId",
  "createdByMemberId",
  "sourceMemberId",
  "paymentSource",
  "payerMemberId",
  "reimbursementStatus",
  "note",
  "updatedAt"
)
VALUES
  (
    'income-rent-june',
    'household-demo',
    'income',
    '六月房租',
    12000000,
    DATE '2026-06-05',
    'income-rent',
    'member-mei',
    'member-mei',
    NULL,
    NULL,
    'not_applicable',
    '六月房租',
    CURRENT_TIMESTAMP
  ),
  (
    'income-living-june',
    'household-demo',
    'income',
    '六月生活費',
    8000000,
    DATE '2026-06-10',
    'income-living',
    'member-kai',
    'member-kai',
    NULL,
    NULL,
    'not_applicable',
    '六月生活費',
    CURRENT_TIMESTAMP
  ),
  (
    'expense-grocery-june',
    'household-demo',
    'expense',
    '日用品代墊',
    642000,
    DATE '2026-06-09',
    'expense-grocery',
    'member-mei',
    NULL,
    'member',
    'member-mei',
    'refundable',
    '日用品代墊',
    CURRENT_TIMESTAMP
  ),
  (
    'expense-supplies-june',
    'household-demo',
    'expense',
    '補充用品代墊',
    188000,
    DATE '2026-06-13',
    'expense-grocery',
    'member-kai',
    NULL,
    'member',
    'member-kai',
    'refundable',
    '補充用品代墊',
    CURRENT_TIMESTAMP
  ),
  (
    'expense-internet-june',
    'household-demo',
    'expense',
    '網路費',
    89900,
    DATE '2026-06-05',
    'expense-internet',
    'member-fin',
    NULL,
    'fund',
    NULL,
    'not_refundable',
    '網路費',
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE
SET "amountCents" = EXCLUDED."amountCents",
    "name" = EXCLUDED."name",
    "occurredOn" = EXCLUDED."occurredOn",
    "categoryId" = EXCLUDED."categoryId",
    "createdByMemberId" = EXCLUDED."createdByMemberId",
    "sourceMemberId" = EXCLUDED."sourceMemberId",
    "paymentSource" = EXCLUDED."paymentSource",
    "payerMemberId" = EXCLUDED."payerMemberId",
    "reimbursementStatus" = EXCLUDED."reimbursementStatus",
    "note" = EXCLUDED."note",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RecurringRule" (
  "id",
  "householdId",
  "type",
  "amountCents",
  "categoryId",
  "sourceMemberId",
  "paymentSource",
  "payerMemberId",
  "postingMode",
  "dayOfMonth",
  "note",
  "active",
  "updatedAt"
)
VALUES
  (
    'rule-living-kai',
    'household-demo',
    'income',
    8000000,
    'income-living',
    'member-kai',
    NULL,
    NULL,
    'reminder',
    10,
    'Kai 每月生活費提醒',
    true,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE
SET "amountCents" = EXCLUDED."amountCents",
    "categoryId" = EXCLUDED."categoryId",
    "sourceMemberId" = EXCLUDED."sourceMemberId",
    "postingMode" = EXCLUDED."postingMode",
    "dayOfMonth" = EXCLUDED."dayOfMonth",
    "note" = EXCLUDED."note",
    "active" = EXCLUDED."active",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RecurringOccurrence" (
  "id",
  "householdId",
  "recurringRuleId",
  "month",
  "status",
  "ledgerRecordId",
  "updatedAt"
)
VALUES (
  'occurrence-living-kai',
  'household-demo',
  'rule-living-kai',
  '2026-06',
  'pending',
  NULL,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("recurringRuleId", "month") DO UPDATE
SET "status" = EXCLUDED."status",
    "ledgerRecordId" = EXCLUDED."ledgerRecordId",
    "updatedAt" = CURRENT_TIMESTAMP;
