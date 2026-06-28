-- CreateEnum
CREATE TYPE "RecurringScheduleAnchor" AS ENUM ('fixed_day', 'month_end');

-- AlterTable: RecurringRule
ALTER TABLE "RecurringRule"
  ADD COLUMN "name" TEXT,
  ADD COLUMN "scheduleAnchor" "RecurringScheduleAnchor" NOT NULL DEFAULT 'fixed_day',
  ALTER COLUMN "dayOfMonth" DROP NOT NULL,
  ADD COLUMN "createdByMemberId" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "RecurringRule"
SET
  "name" = COALESCE("name", '週期事件'),
  "createdByMemberId" = COALESCE(
    "createdByMemberId",
    (
      SELECT "Member"."id"
      FROM "Member"
      WHERE "Member"."householdId" = "RecurringRule"."householdId"
      ORDER BY "Member"."createdAt" ASC
      LIMIT 1
    )
  );

DELETE FROM "RecurringRule"
WHERE "createdByMemberId" IS NULL;

ALTER TABLE "RecurringRule"
  ALTER COLUMN "name" SET NOT NULL,
  ALTER COLUMN "createdByMemberId" SET NOT NULL;

-- AlterTable: RecurringOccurrence
ALTER TABLE "RecurringOccurrence"
  ADD COLUMN "targetDate" DATE,
  ADD COLUMN "postedByMemberId" TEXT,
  ADD COLUMN "postedAt" TIMESTAMP(3);

UPDATE "RecurringOccurrence"
SET "targetDate" = (
  WITH month_start AS (
    SELECT TO_DATE("RecurringOccurrence"."month" || '-01', 'YYYY-MM-DD') AS value
  ),
  rule_day AS (
    SELECT COALESCE(
      (
        SELECT "RecurringRule"."dayOfMonth"
        FROM "RecurringRule"
        WHERE "RecurringRule"."id" = "RecurringOccurrence"."recurringRuleId"
      ),
      1
    ) AS value
  )
  SELECT month_start.value
    + (
      LEAST(
        rule_day.value,
        EXTRACT(
          DAY FROM (month_start.value + INTERVAL '1 month - 1 day')
        )::INT
      ) - 1
    )
  FROM month_start, rule_day
)
WHERE "targetDate" IS NULL;

ALTER TABLE "RecurringOccurrence"
  ALTER COLUMN "targetDate" SET NOT NULL;

-- CreateIndex
CREATE INDEX "RecurringRule_householdId_type_active_idx" ON "RecurringRule"("householdId", "type", "active");

-- AddForeignKey
ALTER TABLE "RecurringRule"
  ADD CONSTRAINT "RecurringRule_createdByMemberId_fkey"
  FOREIGN KEY ("createdByMemberId") REFERENCES "Member"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RecurringOccurrence"
  ADD CONSTRAINT "RecurringOccurrence_postedByMemberId_fkey"
  FOREIGN KEY ("postedByMemberId") REFERENCES "Member"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
