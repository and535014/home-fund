-- Local development seed for the real app flow.
--
-- This file intentionally avoids demo members, seeded invitations, ledger
-- records, recurring rules, and Better Auth test users. E2E fixtures live in
-- prisma/seed.e2e.sql and are loaded only by e2e/setup-db.sh.
-- __SEED_GOOGLE_ACCOUNT_EMAIL__ is replaced with SEED_GOOGLE_ACCOUNT_EMAIL.

DELETE FROM "RecurringOccurrence"
WHERE "id" IN ('occurrence-living-kai')
   OR "recurringRuleId" IN ('rule-living-kai');

DELETE FROM "RecurringRule"
WHERE "id" IN ('rule-living-kai');

DELETE FROM "ReimbursementBatchItem"
WHERE "ledgerRecordId" IN (
  SELECT "id"
  FROM "LedgerRecord"
  WHERE "id" IN (
      'income-rent-june',
      'income-living-june',
      'expense-grocery-june',
      'expense-supplies-june',
      'expense-internet-june'
    )
     OR "createdByMemberId" IN (
      'member-mei',
      'member-kai',
      'member-fin',
      'member-e2e-disabled',
      'member-seed-invited'
    )
     OR "sourceMemberId" IN (
      'member-mei',
      'member-kai',
      'member-fin',
      'member-e2e-disabled',
      'member-seed-invited'
    )
     OR "payerMemberId" IN (
      'member-mei',
      'member-kai',
      'member-fin',
      'member-e2e-disabled',
      'member-seed-invited'
    )
)
OR "reimbursementBatchId" IN (
  SELECT "id"
  FROM "ReimbursementBatch"
  WHERE "reimbursedById" IN (
    'member-mei',
    'member-kai',
    'member-fin',
    'member-e2e-disabled',
    'member-seed-invited'
  )
);

DELETE FROM "ReimbursementBatch"
WHERE "reimbursedById" IN (
  'member-mei',
  'member-kai',
  'member-fin',
  'member-e2e-disabled',
  'member-seed-invited'
);

UPDATE "RecurringOccurrence"
SET "ledgerRecordId" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "ledgerRecordId" IN (
  SELECT "id"
  FROM "LedgerRecord"
  WHERE "createdByMemberId" IN (
      'member-mei',
      'member-kai',
      'member-fin',
      'member-e2e-disabled',
      'member-seed-invited'
    )
     OR "sourceMemberId" IN (
      'member-mei',
      'member-kai',
      'member-fin',
      'member-e2e-disabled',
      'member-seed-invited'
    )
     OR "payerMemberId" IN (
      'member-mei',
      'member-kai',
      'member-fin',
      'member-e2e-disabled',
      'member-seed-invited'
    )
);

DELETE FROM "LedgerRecord"
WHERE "id" IN (
  'income-rent-june',
  'income-living-june',
  'expense-grocery-june',
  'expense-supplies-june',
  'expense-internet-june'
)
OR "createdByMemberId" IN (
  'member-mei',
  'member-kai',
  'member-fin',
  'member-e2e-disabled',
  'member-seed-invited'
)
OR "sourceMemberId" IN (
  'member-mei',
  'member-kai',
  'member-fin',
  'member-e2e-disabled',
  'member-seed-invited'
)
OR "payerMemberId" IN (
  'member-mei',
  'member-kai',
  'member-fin',
  'member-e2e-disabled',
  'member-seed-invited'
);

DELETE FROM "MemberInvitation"
WHERE "id" IN ('invite-seed-invited')
   OR "memberId" IN ('member-seed-invited');

DELETE FROM "MemberCapabilityAssignment"
WHERE "memberId" IN (
  'member-mei',
  'member-kai',
  'member-fin',
  'member-e2e-disabled',
  'member-seed-invited'
);

DELETE FROM "MemberRoleAssignment"
WHERE "memberId" IN (
  'member-mei',
  'member-kai',
  'member-fin',
  'member-e2e-disabled',
  'member-seed-invited'
);

DELETE FROM "Member"
WHERE "id" IN (
  'member-mei',
  'member-kai',
  'member-fin',
  'member-e2e-disabled',
  'member-seed-invited'
);

DELETE FROM "Account"
WHERE "id" IN (
  'account-e2e-admin-google',
  'account-e2e-linked-google',
  'account-e2e-unlinked-google',
  'account-e2e-general-google',
  'account-e2e-disabled-google'
);

DELETE FROM "User"
WHERE "id" IN (
  'user-e2e-admin',
  'user-e2e-linked',
  'user-e2e-unlinked',
  'user-e2e-general',
  'user-e2e-disabled'
);

INSERT INTO "Household" ("id", "name", "updatedAt")
VALUES ('household-demo', '家庭共用金', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET "name" = EXCLUDED."name",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Allow the configured local Google account to become the admin without
-- colliding with older seed runs.
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
SET "displayName" = EXCLUDED."displayName",
    "googleAccountEmail" = EXCLUDED."googleAccountEmail",
    "status" = EXCLUDED."status",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MemberRoleAssignment" ("memberId", "role")
VALUES ('member-admin', 'admin')
ON CONFLICT ("memberId", "role") DO NOTHING;

INSERT INTO "Category" ("id", "householdId", "type", "name", "color", "icon", "sortOrder", "status", "updatedAt")
VALUES
  ('income-rent', 'household-demo', 'income', '房租', 'blue', 'home', 10, 'active', CURRENT_TIMESTAMP),
  ('income-living', 'household-demo', 'income', '生活費', 'teal', 'piggy-bank', 20, 'active', CURRENT_TIMESTAMP),
  ('income-old', 'household-demo', 'income', '舊收入', 'lime', 'badge-dollar-sign', 30, 'archived', CURRENT_TIMESTAMP),
  ('expense-grocery', 'household-demo', 'expense', '日用品', 'gold', 'shopping-cart', 10, 'active', CURRENT_TIMESTAMP),
  ('expense-internet', 'household-demo', 'expense', '網路費', 'violet', 'wifi', 20, 'active', CURRENT_TIMESTAMP),
  ('expense-dining', 'household-demo', 'expense', '餐飲', 'rose', 'utensils', 30, 'active', CURRENT_TIMESTAMP),
  ('expense-old-dining', 'household-demo', 'expense', '舊餐飲', 'rose', 'utensils', 40, 'archived', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET "name" = EXCLUDED."name",
    "color" = EXCLUDED."color",
    "icon" = EXCLUDED."icon",
    "sortOrder" = EXCLUDED."sortOrder",
    "status" = EXCLUDED."status",
    "updatedAt" = CURRENT_TIMESTAMP;
