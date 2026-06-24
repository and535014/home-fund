-- Add payment evidence for reimbursement settlement without creating ledger expenses.
CREATE TYPE "ReimbursementPaymentSource" AS ENUM ('household_fund');
CREATE TYPE "ReimbursementPaymentMethod" AS ENUM ('bank_transfer', 'cash', 'other');

CREATE TABLE "ReimbursementPayment" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "reimbursementBatchId" TEXT NOT NULL,
  "paidToMemberId" TEXT NOT NULL,
  "paidFromSource" "ReimbursementPaymentSource" NOT NULL DEFAULT 'household_fund',
  "method" "ReimbursementPaymentMethod" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "paidOn" DATE NOT NULL,
  "note" TEXT,
  "recordedByMemberId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReimbursementPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReimbursementPayment_reimbursementBatchId_key" ON "ReimbursementPayment"("reimbursementBatchId");
CREATE INDEX "ReimbursementPayment_householdId_paidOn_idx" ON "ReimbursementPayment"("householdId", "paidOn");
CREATE INDEX "ReimbursementPayment_paidToMemberId_paidOn_idx" ON "ReimbursementPayment"("paidToMemberId", "paidOn");

ALTER TABLE "ReimbursementPayment"
  ADD CONSTRAINT "ReimbursementPayment_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReimbursementPayment"
  ADD CONSTRAINT "ReimbursementPayment_reimbursementBatchId_fkey"
  FOREIGN KEY ("reimbursementBatchId") REFERENCES "ReimbursementBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReimbursementPayment"
  ADD CONSTRAINT "ReimbursementPayment_paidToMemberId_fkey"
  FOREIGN KEY ("paidToMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReimbursementPayment"
  ADD CONSTRAINT "ReimbursementPayment_recordedByMemberId_fkey"
  FOREIGN KEY ("recordedByMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
