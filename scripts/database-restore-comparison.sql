SELECT concat_ws(
  '|',
  (SELECT count(*)::text FROM "Household"),
  (SELECT count(*)::text FROM "Member"),
  (SELECT count(*)::text FROM "Category"),
  (SELECT count(*)::text FROM "LedgerRecord"),
  (SELECT count(*)::text FROM "RecurringRule"),
  (SELECT count(*)::text FROM "RecurringOccurrence"),
  (SELECT count(*)::text FROM "ReimbursementPayment"),
  (SELECT count(*)::text FROM "_prisma_migrations"),
  (SELECT coalesce(max("updatedAt")::text, '') FROM "Household"),
  (SELECT coalesce(max("updatedAt")::text, '') FROM "Member"),
  (SELECT coalesce(max("updatedAt")::text, '') FROM "LedgerRecord")
);
