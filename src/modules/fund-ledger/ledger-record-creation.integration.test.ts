import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/db/prisma";

const runIntegration = process.env.RUN_DATABASE_INTEGRATION === "1";
const integrationDescribe = runIntegration ? describe : describe.skip;
const prisma = createPrismaClient(
  process.env.E2E_DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e",
);

integrationDescribe("ledger record creation persistence contract", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("exposes import identities and recurring audit state in PostgreSQL", async () => {
    const columns = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('LedgerImportBatch', 'LedgerImportRow', 'RecurringOccurrence')
    `;
    const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('LedgerImportBatch', 'LedgerImportRow')
    `;
    const statuses = await prisma.$queryRaw<{ enumlabel: string }[]>`
      SELECT enumlabel
      FROM pg_enum
      INNER JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'RecurringOccurrenceStatus'
      ORDER BY enumsortorder
    `;

    const columnNames = columns.map(({ column_name }) => column_name);
    const indexNames = indexes.map(({ indexname }) => indexname);
    const occurrenceStatuses = statuses.map(({ enumlabel }) => enumlabel);

    expect(columnNames).toEqual(expect.arrayContaining([
      "batchIdentity",
      "rowIdentity",
      "failureReason",
      "blockedReason",
      "postingActorKind",
    ]));
    expect(indexNames).toEqual(expect.arrayContaining([
      "LedgerImportBatch_householdId_batchIdentity_key",
      "LedgerImportRow_batchId_rowIdentity_key",
    ]));
    expect(occurrenceStatuses).toContain("blocked");
  });
});
