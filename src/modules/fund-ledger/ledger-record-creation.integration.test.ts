import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/db/prisma";
import { createManualRecord } from "./ledger-record-creation";

const runIntegration = process.env.RUN_DATABASE_INTEGRATION === "1";
const integrationDescribe = runIntegration ? describe : describe.skip;
const prisma = createPrismaClient(
  process.env.E2E_DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e",
);

const fixture = {
  householdA: "integration-ledger-creation-household-a",
  householdB: "integration-ledger-creation-household-b",
  financeMember: "integration-ledger-creation-finance",
  generalMember: "integration-ledger-creation-general",
  invitedMember: "integration-ledger-creation-invited",
  disabledMember: "integration-ledger-creation-disabled",
  outsideMember: "integration-ledger-creation-outside-member",
  incomeCategory: "integration-ledger-creation-income-category",
  expenseCategory: "integration-ledger-creation-expense-category",
  archivedExpenseCategory:
    "integration-ledger-creation-archived-expense-category",
  outsideExpenseCategory:
    "integration-ledger-creation-outside-expense-category",
} as const;

const financeMember = {
  id: fixture.financeMember,
  householdId: fixture.householdA,
  googleAccountLinked: true,
  roles: ["finance_manager" as const],
};

const generalMember = {
  id: fixture.generalMember,
  householdId: fixture.householdA,
  googleAccountLinked: true,
  roles: ["general_member" as const],
};

integrationDescribe("ledger record creation persistence contract", () => {
  beforeAll(async () => {
    await cleanupCreationFixtures();

    await prisma.household.createMany({
      data: [
        { id: fixture.householdA, name: "Manual creation A" },
        { id: fixture.householdB, name: "Manual creation B" },
      ],
    });
    await prisma.member.createMany({
      data: [
        {
          id: fixture.financeMember,
          householdId: fixture.householdA,
          displayName: "Finance",
          status: "active",
        },
        {
          id: fixture.generalMember,
          householdId: fixture.householdA,
          displayName: "General",
          status: "active",
        },
        {
          id: fixture.invitedMember,
          householdId: fixture.householdA,
          displayName: "Invited",
          status: "invited",
        },
        {
          id: fixture.disabledMember,
          householdId: fixture.householdA,
          displayName: "Disabled",
          status: "disabled",
        },
        {
          id: fixture.outsideMember,
          householdId: fixture.householdB,
          displayName: "Outside",
          status: "active",
        },
      ],
    });
    await prisma.memberRoleAssignment.create({
      data: { memberId: fixture.financeMember, role: "finance_manager" },
    });
    await prisma.category.createMany({
      data: [
        {
          id: fixture.incomeCategory,
          householdId: fixture.householdA,
          type: "income",
          name: "Income",
          status: "active",
        },
        {
          id: fixture.expenseCategory,
          householdId: fixture.householdA,
          type: "expense",
          name: "Expense",
          status: "active",
        },
        {
          id: fixture.archivedExpenseCategory,
          householdId: fixture.householdA,
          type: "expense",
          name: "Archived expense",
          status: "archived",
        },
        {
          id: fixture.outsideExpenseCategory,
          householdId: fixture.householdB,
          type: "expense",
          name: "Outside expense",
          status: "active",
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanupCreationFixtures();
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

  it("creates a member-paid expense with invited payer attribution", async () => {
    const result = await createManualRecord(
      { kind: "member", member: financeMember },
      {
        type: "expense",
        name: "代墊晚餐",
        amountCents: 12_800,
        occurredOn: "2026-07-17",
        categoryId: fixture.expenseCategory,
        paymentSource: "member",
        payerMemberId: fixture.invitedMember,
      },
    );

    expect(result).toMatchObject({ ok: true });
    await expect(prisma.ledgerRecord.findUnique({
      where: { id: result.ok ? result.recordId : "missing" },
    })).resolves.toMatchObject({
      createdByMemberId: fixture.financeMember,
      payerMemberId: fixture.invitedMember,
      reimbursementStatus: "refundable",
      status: "active",
    });
  });

  it("rejects disabled attribution members without writing a record", async () => {
    const recordsBefore = await prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    });

    await expect(createManualRecord(
      { kind: "member", member: financeMember },
      {
        type: "expense",
        name: "停車費",
        amountCents: 500,
        occurredOn: "2026-07-17",
        categoryId: fixture.expenseCategory,
        paymentSource: "member",
        payerMemberId: fixture.disabledMember,
      },
    )).resolves.toEqual({ ok: false, reason: "disabled_member" });

    await expect(prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    })).resolves.toBe(recordsBefore);
  });

  it("rejects a category outside the actor household without writing", async () => {
    const recordsBefore = await prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    });

    await expect(createManualRecord(
      { kind: "member", member: financeMember },
      {
        type: "expense",
        name: "跨家庭分類",
        amountCents: 500,
        occurredOn: "2026-07-17",
        categoryId: fixture.outsideExpenseCategory,
        paymentSource: "fund",
      },
    )).resolves.toEqual({ ok: false, reason: "missing_category" });

    await expect(prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    })).resolves.toBe(recordsBefore);
  });

  it("rejects a payer outside the actor household without writing", async () => {
    const recordsBefore = await prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    });

    await expect(createManualRecord(
      { kind: "member", member: financeMember },
      {
        type: "expense",
        name: "跨家庭代墊",
        amountCents: 500,
        occurredOn: "2026-07-17",
        categoryId: fixture.expenseCategory,
        paymentSource: "member",
        payerMemberId: fixture.outsideMember,
      },
    )).resolves.toEqual({ ok: false, reason: "member_outside_household" });

    await expect(prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    })).resolves.toBe(recordsBefore);
  });

  it("rejects an income source outside the actor household without writing", async () => {
    const recordsBefore = await prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    });

    await expect(createManualRecord(
      { kind: "member", member: financeMember },
      {
        type: "income",
        name: "跨家庭收入來源",
        amountCents: 500,
        occurredOn: "2026-07-17",
        categoryId: fixture.incomeCategory,
        sourceMemberId: fixture.outsideMember,
      },
    )).resolves.toEqual({ ok: false, reason: "member_outside_household" });

    await expect(prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    })).resolves.toBe(recordsBefore);
  });

  it("does not let a general member create for another member", async () => {
    await expect(createManualRecord(
      { kind: "member", member: generalMember },
      {
        type: "expense",
        name: "其他人的代墊",
        amountCents: 500,
        occurredOn: "2026-07-17",
        categoryId: fixture.expenseCategory,
        paymentSource: "member",
        payerMemberId: fixture.invitedMember,
      },
    )).resolves.toEqual({ ok: false, reason: "permission_denied" });
  });

  it("rejects archived categories", async () => {
    await expect(createManualRecord(
      { kind: "member", member: financeMember },
      {
        type: "expense",
        name: "封存分類支出",
        amountCents: 500,
        occurredOn: "2026-07-17",
        categoryId: fixture.archivedExpenseCategory,
        paymentSource: "fund",
      },
    )).resolves.toEqual({ ok: false, reason: "archived_category" });
  });

  it("creates fund-paid expenses as not refundable", async () => {
    const result = await createManualRecord(
      { kind: "member", member: financeMember },
      {
        type: "expense",
        name: "基金採買",
        amountCents: 500,
        occurredOn: "2026-07-17",
        categoryId: fixture.expenseCategory,
        paymentSource: "fund",
      },
    );

    expect(result).toMatchObject({ ok: true });
    await expect(prisma.ledgerRecord.findUnique({
      where: { id: result.ok ? result.recordId : "missing" },
    })).resolves.toMatchObject({
      reimbursementStatus: "not_refundable",
      payerMemberId: null,
    });
  });
});

async function cleanupCreationFixtures() {
  await prisma.ledgerRecord.deleteMany({
    where: { householdId: { in: [fixture.householdA, fixture.householdB] } },
  });
  await prisma.category.deleteMany({
    where: { householdId: { in: [fixture.householdA, fixture.householdB] } },
  });
  await prisma.memberRoleAssignment.deleteMany({
    where: {
      memberId: {
        in: [
          fixture.financeMember,
          fixture.generalMember,
          fixture.invitedMember,
          fixture.disabledMember,
          fixture.outsideMember,
        ],
      },
    },
  });
  await prisma.member.deleteMany({
    where: { householdId: { in: [fixture.householdA, fixture.householdB] } },
  });
  await prisma.household.deleteMany({
    where: { id: { in: [fixture.householdA, fixture.householdB] } },
  });
}
