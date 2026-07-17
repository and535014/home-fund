ALTER TYPE "RecurringOccurrenceStatus" ADD VALUE IF NOT EXISTS 'blocked';
CREATE TYPE "RecurringOccurrenceBlockedReason" AS ENUM ('archived_category', 'disabled_member');
CREATE TYPE "RecurringPostingActorKind" AS ENUM ('member', 'system');

ALTER TABLE "LedgerImportBatch"
  ADD COLUMN "batchIdentity" TEXT;
UPDATE "LedgerImportBatch"
SET "batchIdentity" = 'legacy-batch:' || "id"
WHERE "batchIdentity" IS NULL;
ALTER TABLE "LedgerImportBatch"
  ALTER COLUMN "batchIdentity" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "LedgerImportBatch" ALTER COLUMN "batchIdentity" SET NOT NULL;

ALTER TABLE "LedgerImportRow"
  ADD COLUMN "rowIdentity" TEXT,
  ADD COLUMN "failureReason" TEXT;
UPDATE "LedgerImportRow"
SET "rowIdentity" = 'legacy-row:' || "id"
WHERE "rowIdentity" IS NULL;
ALTER TABLE "LedgerImportRow"
  ALTER COLUMN "rowIdentity" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "LedgerImportRow" ALTER COLUMN "rowIdentity" SET NOT NULL;

ALTER TABLE "RecurringOccurrence"
  ADD COLUMN "blockedReason" "RecurringOccurrenceBlockedReason",
  ADD COLUMN "postingActorKind" "RecurringPostingActorKind";
UPDATE "RecurringOccurrence"
SET "postingActorKind" = 'member'
WHERE "postedByMemberId" IS NOT NULL;

CREATE UNIQUE INDEX "LedgerImportBatch_householdId_batchIdentity_key"
  ON "LedgerImportBatch"("householdId", "batchIdentity");
CREATE UNIQUE INDEX "LedgerImportRow_batchId_rowIdentity_key"
  ON "LedgerImportRow"("batchId", "rowIdentity");
