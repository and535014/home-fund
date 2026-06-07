ALTER TABLE "LedgerRecord" ADD COLUMN "name" TEXT;

UPDATE "LedgerRecord"
SET "name" = COALESCE(NULLIF("note", ''), "categoryId")
WHERE "name" IS NULL;

ALTER TABLE "LedgerRecord" ALTER COLUMN "name" SET NOT NULL;
