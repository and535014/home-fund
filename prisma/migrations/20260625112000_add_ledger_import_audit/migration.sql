-- CreateEnum
CREATE TYPE "LedgerImportBatchStatus" AS ENUM ('imported', 'failed');

-- CreateEnum
CREATE TYPE "LedgerImportRowStatus" AS ENUM ('imported', 'skipped');

-- CreateTable
CREATE TABLE "LedgerImportBatch" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileFingerprint" TEXT NOT NULL,
    "status" "LedgerImportBatchStatus" NOT NULL,
    "importedRowCount" INTEGER NOT NULL,
    "skippedRowCount" INTEGER NOT NULL,
    "createdByMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerImportRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "csvRowNumber" INTEGER NOT NULL,
    "rowFingerprint" TEXT NOT NULL,
    "status" "LedgerImportRowStatus" NOT NULL,
    "ledgerRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerImportBatch_householdId_createdAt_idx" ON "LedgerImportBatch"("householdId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerImportBatch_householdId_fileFingerprint_idx" ON "LedgerImportBatch"("householdId", "fileFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerImportRow_ledgerRecordId_key" ON "LedgerImportRow"("ledgerRecordId");

-- CreateIndex
CREATE INDEX "LedgerImportRow_batchId_csvRowNumber_idx" ON "LedgerImportRow"("batchId", "csvRowNumber");

-- CreateIndex
CREATE INDEX "LedgerImportRow_rowFingerprint_idx" ON "LedgerImportRow"("rowFingerprint");

-- CreateIndex
CREATE INDEX "LedgerImportRow_ledgerRecordId_idx" ON "LedgerImportRow"("ledgerRecordId");

-- AddForeignKey
ALTER TABLE "LedgerImportBatch" ADD CONSTRAINT "LedgerImportBatch_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerImportBatch" ADD CONSTRAINT "LedgerImportBatch_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerImportRow" ADD CONSTRAINT "LedgerImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LedgerImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerImportRow" ADD CONSTRAINT "LedgerImportRow_ledgerRecordId_fkey" FOREIGN KEY ("ledgerRecordId") REFERENCES "LedgerRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
