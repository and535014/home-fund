-- AlterEnum
ALTER TYPE "LedgerImportRowStatus" ADD VALUE 'failed';

-- AlterTable
ALTER TABLE "LedgerImportBatch" ADD COLUMN "failedRowCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "LedgerImportBatch" ALTER COLUMN "failedRowCount" DROP DEFAULT;
