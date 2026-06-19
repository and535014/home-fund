WITH pending_invitation_members AS (
  UPDATE "MemberInvitation"
  SET "memberId" = NULL
  WHERE "status" = 'pending'
    AND "memberId" IS NOT NULL
  RETURNING "memberId"
)
DELETE FROM "MemberCapabilityAssignment"
WHERE "memberId" IN (
  SELECT "memberId" FROM pending_invitation_members
);

WITH pending_invitation_members AS (
  SELECT "id"
  FROM "Member"
  WHERE "status" = 'invited'
)
DELETE FROM "MemberRoleAssignment"
WHERE "memberId" IN (
  SELECT "id" FROM pending_invitation_members
);

DELETE FROM "Member"
WHERE "status" = 'invited';
