ALTER TABLE "MemberInvitation"
  DROP COLUMN "previewToken",
  ADD COLUMN "tokenCiphertext" TEXT,
  ADD COLUMN "tokenIv" TEXT,
  ADD COLUMN "tokenAuthTag" TEXT;

CREATE UNIQUE INDEX "MemberInvitation_one_pending_per_member"
  ON "MemberInvitation"("memberId")
  WHERE "memberId" IS NOT NULL AND "status" = 'pending';
