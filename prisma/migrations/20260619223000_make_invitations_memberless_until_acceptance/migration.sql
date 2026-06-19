ALTER TABLE "MemberInvitation" DROP CONSTRAINT "MemberInvitation_memberId_fkey";

ALTER TABLE "MemberInvitation" ALTER COLUMN "memberId" DROP NOT NULL;

ALTER TABLE "MemberInvitation"
ADD CONSTRAINT "MemberInvitation_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
