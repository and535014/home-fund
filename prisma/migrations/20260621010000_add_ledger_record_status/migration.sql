-- CreateEnum
CREATE TYPE "LedgerRecordStatus" AS ENUM ('active', 'voided');

-- AlterTable
ALTER TABLE "LedgerRecord" ADD COLUMN "status" "LedgerRecordStatus" NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "LedgerRecord_householdId_status_occurredOn_idx" ON "LedgerRecord"("householdId", "status", "occurredOn");

-- CreateIndex
CREATE INDEX "LedgerRecord_householdId_status_reimbursementStatus_occurredOn_idx" ON "LedgerRecord"("householdId", "status", "reimbursementStatus", "occurredOn");
