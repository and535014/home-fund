-- E2E-only fixture data.
--
-- This file is loaded after prisma/seed.sql by e2e/setup-db.sh.
-- __SEED_GOOGLE_ACCOUNT_EMAIL__ is replaced with E2E_SEED_GOOGLE_ACCOUNT_EMAIL.

UPDATE "Member"
SET "googleSubject" = 'google-e2e-admin',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'member-admin';

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
    'member-bind-unbound',
    'household-demo',
    '未綁定測試成員',
    NULL,
    NULL,
    'invited',
    CURRENT_TIMESTAMP
  ),
  (
    'member-bind-waiting',
    'household-demo',
    '待綁定測試成員',
    NULL,
    NULL,
    'invited',
    CURRENT_TIMESTAMP
  ),
  (
    'member-bind-expired',
    'household-demo',
    '失效測試成員',
    NULL,
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
  ('member-mei', 'general_member'),
  ('member-kai', 'general_member'),
  ('member-fin', 'finance_manager'),
  ('member-e2e-disabled', 'general_member'),
  ('member-bind-unbound', 'general_member'),
  ('member-bind-waiting', 'finance_manager'),
  ('member-bind-expired', 'general_member')
ON CONFLICT ("memberId", "role") DO NOTHING;

INSERT INTO "MemberInvitation" (
  "id",
  "householdId",
  "memberId",
  "googleAccountEmail",
  "tokenHash",
  "tokenCiphertext",
  "tokenIv",
  "tokenAuthTag",
  "status",
  "expiresAt",
  "createdById",
  "updatedAt"
)
VALUES (
  'invite-seed-invited',
  'household-demo',
  'member-kai',
  NULL,
  'fb6bd43e35b03ee100246562795d5393a4973b110770b5d5aeda04f398d79cdb',
  'vcIlWWAJBRhuOqD-zpz2fRw',
  'AAAAAAAAAAAAAAAA',
  'sfVjNJsDNX8cp26lPxDJsA',
  'pending',
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  'member-admin',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE
SET "googleAccountEmail" = EXCLUDED."googleAccountEmail",
    "tokenHash" = EXCLUDED."tokenHash",
    "tokenCiphertext" = EXCLUDED."tokenCiphertext",
    "tokenIv" = EXCLUDED."tokenIv",
    "tokenAuthTag" = EXCLUDED."tokenAuthTag",
    "status" = EXCLUDED."status",
    "expiresAt" = EXCLUDED."expiresAt",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "MemberInvitation" (
  "id",
  "householdId",
  "memberId",
  "googleAccountEmail",
  "tokenHash",
  "tokenCiphertext",
  "tokenIv",
  "tokenAuthTag",
  "status",
  "expiresAt",
  "acceptedAt",
  "createdById",
  "updatedAt"
)
VALUES
  (
    'invite-bind-waiting',
    'household-demo',
    'member-bind-waiting',
    NULL,
    '7b7f3ca2ecde44cd7a8b0d216422c52597a219d5b82dd8dda258ef5f10059365',
    'vcIlWWACAgBjY7Ky04f0dhVNd6Vcw0Q',
    'AAAAAAAAAAAAAAAA',
    'oYWU-BUKe2o-G0bv6Jt9eg',
    'pending',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    NULL,
    'member-admin',
    CURRENT_TIMESTAMP
  ),
  (
    'invite-bind-expired',
    'household-demo',
    'member-bind-expired',
    NULL,
    '718787f67d6f60856c0de6df7c2c18cce70dbf59d9a59759ea4144e4f9114d2a',
    'vcIlWWACAgBjY6CryprvfRZNd6Vcw0Q',
    'AAAAAAAAAAAAAAAA',
    'G59RKDFmSAvtbeagq99Mng',
    'pending',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    NULL,
    'member-admin',
    CURRENT_TIMESTAMP
  ),
  (
    'invite-bind-used',
    'household-demo',
    'member-bind-waiting',
    NULL,
    '49af168cd435107c5396259c7178152c4a20929efcc52c837bbf7c6191cd9b0b',
    'vcIlWWACAgBjY7Cg35ewbB0LZqQ',
    'AAAAAAAAAAAAAAAA',
    'OPMNLggAYjwCrELLqO_OqQ',
    'accepted',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    CURRENT_TIMESTAMP,
    'member-admin',
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE
SET "memberId" = EXCLUDED."memberId",
    "googleAccountEmail" = EXCLUDED."googleAccountEmail",
    "tokenHash" = EXCLUDED."tokenHash",
    "tokenCiphertext" = EXCLUDED."tokenCiphertext",
    "tokenIv" = EXCLUDED."tokenIv",
    "tokenAuthTag" = EXCLUDED."tokenAuthTag",
    "status" = EXCLUDED."status",
    "expiresAt" = EXCLUDED."expiresAt",
    "acceptedAt" = EXCLUDED."acceptedAt",
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
  ),
  (
    'expense-reimbursed-internet-june',
    'household-demo',
    'expense',
    '已退款網路費',
    128000,
    DATE '2026-05-15',
    'expense-internet',
    'member-mei',
    NULL,
    'member',
    'member-mei',
    'reimbursed',
    '已退款網路費',
    CURRENT_TIMESTAMP
  ),
  (
    'expense-reimbursed-parking-june',
    'household-demo',
    'expense',
    '已退款停車費',
    32000,
    DATE '2026-05-16',
    'expense-dining',
    'member-kai',
    NULL,
    'member',
    'member-kai',
    'reimbursed',
    '已退款停車費',
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

INSERT INTO "ReimbursementBatch" (
  "id",
  "householdId",
  "reimbursedById",
  "reimbursedAt"
)
VALUES
  (
    'batch-e2e-reimbursed-internet',
    'household-demo',
    'member-fin',
    TIMESTAMP '2026-06-18 09:00:00'
  ),
  (
    'batch-e2e-reimbursed-parking',
    'household-demo',
    'member-fin',
    TIMESTAMP '2026-06-20 09:00:00'
  )
ON CONFLICT ("id") DO UPDATE
SET "householdId" = EXCLUDED."householdId",
    "reimbursedById" = EXCLUDED."reimbursedById",
    "reimbursedAt" = EXCLUDED."reimbursedAt";

INSERT INTO "ReimbursementBatchItem" (
  "reimbursementBatchId",
  "ledgerRecordId"
)
VALUES
  ('batch-e2e-reimbursed-internet', 'expense-reimbursed-internet-june'),
  ('batch-e2e-reimbursed-parking', 'expense-reimbursed-parking-june')
ON CONFLICT ("reimbursementBatchId", "ledgerRecordId") DO NOTHING;

INSERT INTO "ReimbursementPayment" (
  "id",
  "householdId",
  "reimbursementBatchId",
  "paidToMemberId",
  "paidFromSource",
  "method",
  "amountCents",
  "paidOn",
  "note",
  "recordedByMemberId"
)
VALUES
  (
    'payment-e2e-reimbursed-internet',
    'household-demo',
    'batch-e2e-reimbursed-internet',
    'member-mei',
    'household_fund',
    'bank_transfer',
    128000,
    DATE '2026-06-18',
    '末五碼 5521',
    'member-fin'
  ),
  (
    'payment-e2e-reimbursed-parking',
    'household-demo',
    'batch-e2e-reimbursed-parking',
    'member-kai',
    'household_fund',
    'cash',
    32000,
    DATE '2026-06-20',
    '停車費現金退款',
    'member-fin'
  )
ON CONFLICT ("id") DO UPDATE
SET "householdId" = EXCLUDED."householdId",
    "reimbursementBatchId" = EXCLUDED."reimbursementBatchId",
    "paidToMemberId" = EXCLUDED."paidToMemberId",
    "paidFromSource" = EXCLUDED."paidFromSource",
    "method" = EXCLUDED."method",
    "amountCents" = EXCLUDED."amountCents",
    "paidOn" = EXCLUDED."paidOn",
    "note" = EXCLUDED."note",
    "recordedByMemberId" = EXCLUDED."recordedByMemberId";

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
SELECT
  'search-pagination-income-' || lpad(series::text, 3, '0'),
  'household-demo',
  'income',
  '搜尋分頁測試 ' || lpad(series::text, 3, '0'),
  10000 + series,
  DATE '2026-06-01',
  'income-living',
  'member-fin',
  'member-fin',
  NULL,
  NULL,
  'not_applicable',
  '搜尋分頁測試 ' || lpad(series::text, 3, '0'),
  CURRENT_TIMESTAMP
FROM generate_series(1, 105) AS series
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
