CREATE TYPE "MemberInvitationStatus" AS ENUM ('pending', 'accepted', 'revoked');

CREATE TABLE "MemberInvitation" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "googleAccountEmail" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "previewToken" TEXT,
  "status" "MemberInvitationStatus" NOT NULL DEFAULT 'pending',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MemberInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberInvitation_tokenHash_key" ON "MemberInvitation"("tokenHash");
CREATE INDEX "MemberInvitation_householdId_status_expiresAt_idx" ON "MemberInvitation"("householdId", "status", "expiresAt");
CREATE INDEX "MemberInvitation_memberId_status_idx" ON "MemberInvitation"("memberId", "status");
CREATE INDEX "MemberInvitation_googleAccountEmail_status_idx" ON "MemberInvitation"("googleAccountEmail", "status");

ALTER TABLE "MemberInvitation" ADD CONSTRAINT "MemberInvitation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MemberInvitation" ADD CONSTRAINT "MemberInvitation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberInvitation" ADD CONSTRAINT "MemberInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
