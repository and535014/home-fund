ALTER TABLE "ReimbursementPayment"
ADD COLUMN "editedAt" TIMESTAMP(3),
ADD COLUMN "editedByMemberId" TEXT;

ALTER TABLE "ReimbursementPayment"
ADD CONSTRAINT "ReimbursementPayment_editedByMemberId_fkey"
FOREIGN KEY ("editedByMemberId") REFERENCES "Member"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ReimbursementPayment_editedByMemberId_idx"
ON "ReimbursementPayment" ("editedByMemberId");
