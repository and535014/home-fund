ALTER TABLE "Category"
ADD COLUMN "color" TEXT NOT NULL DEFAULT 'gold',
ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'tags',
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "Category"
SET "color" = CASE
    WHEN "name" IN ('房租', '網路費') THEN 'blue'
    WHEN "name" IN ('薪資', '生活費') THEN 'teal'
    WHEN "name" IN ('餐飲') THEN 'rose'
    WHEN "name" IN ('交通') THEN 'lime'
    WHEN "name" IN ('日用品') THEN 'gold'
    ELSE 'gold'
  END,
  "icon" = CASE
    WHEN "name" = '房租' THEN 'home'
    WHEN "name" = '薪資' THEN 'badge-dollar-sign'
    WHEN "name" = '生活費' THEN 'piggy-bank'
    WHEN "name" = '日用品' THEN 'shopping-cart'
    WHEN "name" = '網路費' THEN 'wifi'
    WHEN "name" = '餐飲' THEN 'utensils'
    WHEN "name" = '交通' THEN 'bus'
    ELSE 'tags'
  END;

WITH ordered_categories AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "householdId", "type", "status"
      ORDER BY
        CASE WHEN "status" = 'active' THEN 0 ELSE 1 END,
        "name",
        "id"
    ) * 10 AS "nextSortOrder"
  FROM "Category"
)
UPDATE "Category"
SET "sortOrder" = ordered_categories."nextSortOrder"
FROM ordered_categories
WHERE "Category"."id" = ordered_categories."id";

CREATE INDEX "Category_householdId_type_status_sortOrder_idx"
ON "Category"("householdId", "type", "status", "sortOrder");
