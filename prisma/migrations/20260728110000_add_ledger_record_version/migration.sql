ALTER TABLE "LedgerRecord"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD CONSTRAINT "LedgerRecord_version_positive" CHECK ("version" >= 1);
