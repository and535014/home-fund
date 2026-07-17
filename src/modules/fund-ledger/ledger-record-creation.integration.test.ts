import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/db/prisma";
import {
  confirmCsvRows,
  createManualRecord,
  postRecurringOccurrence,
  type ConfirmCsvRowsInput,
} from "./ledger-record-creation";
import { recurringPostingSystemActor } from "@/modules/identity-access/system-actor";

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
  recurringFailureName: "Integration recurring transient failure",
  recurringRaceName: "Integration recurring posted blocked race",
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

  it("posts through a household-scoped system actor without a posting Member", async () => {
    const occurrence = await createRecurringOccurrence({
      householdId: fixture.householdB,
      categoryId: fixture.outsideExpenseCategory,
      createdByMemberId: fixture.outsideMember,
      id: "recurring-system-no-member",
      name: "系統背景入帳",
      type: "expense",
      paymentSource: "fund",
    });

    const result = await postRecurringOccurrence(
      recurringPostingSystemActor(fixture.householdB),
      { occurrenceId: occurrence.id },
    );

    expect(result).toMatchObject({
      status: "posted",
      occurrenceId: occurrence.id,
    });
    const persisted = await prisma.recurringOccurrence.findUnique({
      where: { id: occurrence.id },
      include: { ledgerRecord: true },
    });
    expect(persisted).toMatchObject({
      blockedReason: null,
      postedByMemberId: null,
      postingActorKind: "system",
      status: "posted",
      ledgerRecord: {
        createdByMemberId: fixture.outsideMember,
        payerMemberId: null,
        sourceMemberId: null,
      },
    });
  });

  it("preserves creator and source attribution when only the creator is disabled", async () => {
    const occurrence = await createRecurringOccurrence({
      categoryId: fixture.incomeCategory,
      createdByMemberId: fixture.disabledMember,
      id: "recurring-disabled-creator",
      name: "停用建立者的有效收入",
      sourceMemberId: fixture.generalMember,
      type: "income",
    });

    const result = await postRecurringOccurrence(
      recurringPostingSystemActor(fixture.householdA),
      { occurrenceId: occurrence.id },
    );

    expect(result).toMatchObject({ status: "posted" });
    await expect(prisma.ledgerRecord.findUnique({
      where: { id: result.status === "posted" ? result.recordId : "missing" },
    })).resolves.toMatchObject({
      createdByMemberId: fixture.disabledMember,
      sourceMemberId: fixture.generalMember,
    });
  });

  it("persists archived category as a blocked occurrence without a Ledger record", async () => {
    const occurrence = await createRecurringOccurrence({
      categoryId: fixture.archivedExpenseCategory,
      id: "recurring-archived-category",
      name: "封存分類週期支出",
      type: "expense",
      paymentSource: "fund",
    });

    await expect(postRecurringOccurrence(
      recurringPostingSystemActor(fixture.householdA),
      { occurrenceId: occurrence.id },
    )).resolves.toEqual({
      status: "blocked",
      occurrenceId: occurrence.id,
      reason: "archived_category",
    });
    await expect(prisma.recurringOccurrence.findUnique({
      where: { id: occurrence.id },
    })).resolves.toMatchObject({
      status: "blocked",
      blockedReason: "archived_category",
      ledgerRecordId: null,
      postingActorKind: null,
      postedByMemberId: null,
      postedAt: null,
    });
  });

  it("persists disabled source as blocked without treating the creator as attribution", async () => {
    const occurrence = await createRecurringOccurrence({
      categoryId: fixture.incomeCategory,
      id: "recurring-disabled-source",
      name: "停用收入來源",
      sourceMemberId: fixture.disabledMember,
      type: "income",
    });

    await expect(postRecurringOccurrence(
      recurringPostingSystemActor(fixture.householdA),
      { occurrenceId: occurrence.id },
    )).resolves.toEqual({
      status: "blocked",
      occurrenceId: occurrence.id,
      reason: "disabled_member",
    });
    await expect(prisma.recurringOccurrence.findUnique({
      where: { id: occurrence.id },
    })).resolves.toMatchObject({
      status: "blocked",
      blockedReason: "disabled_member",
      ledgerRecordId: null,
    });
  });

  it("converges concurrent posts on one trace without an orphan Ledger record", async () => {
    const occurrence = await createRecurringOccurrence({
      categoryId: fixture.expenseCategory,
      id: "recurring-posted-race",
      name: "並行入帳",
      type: "expense",
      paymentSource: "fund",
    });
    const actor = recurringPostingSystemActor(fixture.householdA);

    const results = await Promise.all([
      postRecurringOccurrence(actor, { occurrenceId: occurrence.id }),
      postRecurringOccurrence(actor, { occurrenceId: occurrence.id }),
    ]);

    expect(results.map(({ status }) => status).sort()).toEqual([
      "already_posted",
      "posted",
    ]);
    await expect(prisma.ledgerRecord.count({
      where: { name: "並行入帳" },
    })).resolves.toBe(1);
    const persisted = await prisma.recurringOccurrence.findUnique({
      where: { id: occurrence.id },
    });
    expect(persisted?.ledgerRecordId).toBeTruthy();
  });

  it("converges concurrent blocked calls on the stored terminal reason", async () => {
    const occurrence = await createRecurringOccurrence({
      categoryId: fixture.archivedExpenseCategory,
      id: "recurring-blocked-race",
      name: "並行阻擋",
      type: "expense",
      paymentSource: "fund",
    });
    const actor = recurringPostingSystemActor(fixture.householdA);

    const results = await Promise.all([
      postRecurringOccurrence(actor, { occurrenceId: occurrence.id }),
      postRecurringOccurrence(actor, { occurrenceId: occurrence.id }),
    ]);

    expect(results).toEqual([
      {
        status: "blocked",
        occurrenceId: occurrence.id,
        reason: "archived_category",
      },
      {
        status: "blocked",
        occurrenceId: occurrence.id,
        reason: "archived_category",
      },
    ]);
    await expect(prisma.ledgerRecord.count({
      where: { name: "並行阻擋" },
    })).resolves.toBe(0);
  });

  it("rolls a posted attempt back when a blocked transition wins the race", async () => {
    const occurrence = await createRecurringOccurrence({
      categoryId: fixture.expenseCategory,
      id: "recurring-posted-blocked-race",
      name: fixture.recurringRaceName,
      type: "expense",
      paymentSource: "fund",
    });
    const actor = recurringPostingSystemActor(fixture.householdA);
    const advisoryKey = 4_170_717;
    let postingPromise: ReturnType<typeof postRecurringOccurrence> | undefined;
    let results: Awaited<ReturnType<typeof postRecurringOccurrence>>[] = [];

    try {
      await installRecurringRaceTrigger();
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT pg_advisory_xact_lock(${advisoryKey}) IS NULL AS acquired
        `;
        postingPromise = postRecurringOccurrence(actor, {
          occurrenceId: occurrence.id,
        });
        await waitForAdvisoryWaiter(tx, advisoryKey);
        await tx.category.update({
          where: { id: fixture.expenseCategory },
          data: { status: "archived" },
        });
      });
      results = await Promise.all([
        postingPromise!,
        postRecurringOccurrence(actor, { occurrenceId: occurrence.id }),
      ]);
    } finally {
      await prisma.category.update({
        where: { id: fixture.expenseCategory },
        data: { status: "active" },
      });
      await dropRecurringRaceTrigger();
    }

    expect(results).toEqual([
      {
        status: "blocked",
        occurrenceId: occurrence.id,
        reason: "archived_category",
      },
      {
        status: "blocked",
        occurrenceId: occurrence.id,
        reason: "archived_category",
      },
    ]);
    await expect(prisma.ledgerRecord.count({
      where: { name: fixture.recurringRaceName },
    })).resolves.toBe(0);
    await expect(prisma.recurringOccurrence.findUnique({
      where: { id: occurrence.id },
    })).resolves.toMatchObject({
      status: "blocked",
      blockedReason: "archived_category",
      ledgerRecordId: null,
    });
  });

  it("keeps an occurrence pending when PostgreSQL raises a transient posting error", async () => {
    const occurrence = await createRecurringOccurrence({
      categoryId: fixture.expenseCategory,
      id: "recurring-transient-failure",
      name: fixture.recurringFailureName,
      type: "expense",
      paymentSource: "fund",
    });
    let result: Awaited<ReturnType<typeof postRecurringOccurrence>>;

    try {
      await installRecurringFailureTrigger();
      result = await postRecurringOccurrence(
        recurringPostingSystemActor(fixture.householdA),
        { occurrenceId: occurrence.id },
      );
    } finally {
      await dropRecurringFailureTrigger();
    }

    expect(result!).toEqual({
      status: "unavailable",
      occurrenceId: occurrence.id,
    });
    expect(await prisma.recurringOccurrence.findUnique({
      where: { id: occurrence.id },
    })).toMatchObject({
      status: "pending",
      blockedReason: null,
      ledgerRecordId: null,
    });
    await expect(prisma.ledgerRecord.count({
      where: { name: fixture.recurringFailureName },
    })).resolves.toBe(0);
  });

  it("revalidates member household scope and confirmation capability", async () => {
    const outside = await createRecurringOccurrence({
      householdId: fixture.householdB,
      categoryId: fixture.outsideExpenseCategory,
      createdByMemberId: fixture.outsideMember,
      id: "recurring-member-outside-household",
      name: "跨家庭確認",
      type: "expense",
      paymentSource: "fund",
    });
    const denied = await createRecurringOccurrence({
      categoryId: fixture.incomeCategory,
      id: "recurring-member-capability-denied",
      name: "替其他成員確認",
      sourceMemberId: fixture.invitedMember,
      type: "income",
    });

    await expect(postRecurringOccurrence(
      { kind: "member", member: generalMember },
      { occurrenceId: outside.id },
    )).resolves.toEqual({ status: "rejected", reason: "occurrence_not_found" });
    await expect(postRecurringOccurrence(
      { kind: "member", member: generalMember },
      { occurrenceId: denied.id },
    )).resolves.toEqual({ status: "rejected", reason: "permission_denied" });
    await expect(prisma.recurringOccurrence.findUnique({
      where: { id: denied.id },
    })).resolves.toMatchObject({ status: "pending", ledgerRecordId: null });
  });

  it("allows future reminders but rejects future immediate occurrences in Taipei time", async () => {
    const reminder = await createRecurringOccurrence({
      categoryId: fixture.incomeCategory,
      id: "recurring-future-reminder",
      name: "未來提醒入帳",
      postingMode: "reminder",
      sourceMemberId: fixture.generalMember,
      targetDate: "2099-07-28",
      type: "income",
    });
    const immediate = await createRecurringOccurrence({
      categoryId: fixture.incomeCategory,
      id: "recurring-future-immediate",
      name: "未來馬上入帳",
      postingMode: "immediate",
      sourceMemberId: fixture.generalMember,
      targetDate: "2099-07-28",
      type: "income",
    });

    const reminderResult = await postRecurringOccurrence(
      { kind: "member", member: generalMember },
      { occurrenceId: reminder.id },
    );
    expect(reminderResult).toMatchObject({ status: "posted" });
    await expect(prisma.recurringOccurrence.findUnique({
      where: { id: reminder.id },
      include: { ledgerRecord: true },
    })).resolves.toMatchObject({
      status: "posted",
      postingActorKind: "member",
      postedByMemberId: fixture.generalMember,
      postedAt: expect.any(Date),
      blockedReason: null,
      ledgerRecord: {
        createdByMemberId: fixture.financeMember,
        sourceMemberId: fixture.generalMember,
      },
    });
    await expect(postRecurringOccurrence(
      recurringPostingSystemActor(fixture.householdA),
      { occurrenceId: immediate.id },
    )).resolves.toEqual({ status: "rejected", reason: "occurrence_not_due" });
  });

  it("rejects CSV confirmation without import permission before creating a batch", async () => {
    const batchesBefore = await prisma.ledgerImportBatch.count({
      where: { householdId: fixture.householdA },
    });

    await expect(confirmCsvRows(
      { kind: "member", member: generalMember },
      csvConfirmation({
        batchIdentity: "csv-permission-denied",
        rows: [csvRow({ csvRowNumber: 2, name: "未授權匯入" })],
      }),
    )).resolves.toEqual({ ok: false, reason: "permission_denied" });
    await expect(prisma.ledgerImportBatch.count({
      where: { householdId: fixture.householdA },
    })).resolves.toBe(batchesBefore);
  });

  it("does not create an audit batch when no rows were handed off", async () => {
    await expect(confirmCsvRows(csvActor, csvConfirmation({
      batchIdentity: "csv-no-confirmable-rows",
    }))).resolves.toEqual({ ok: false, reason: "no_confirmable_rows" });
    await expect(csvBatch("csv-no-confirmable-rows")).resolves.toBeNull();
  });

  it("rejects reuse of a batch identity with a different file fingerprint", async () => {
    const first = await confirmCsvRows(csvActor, csvConfirmation({
      batchIdentity: "csv-fingerprint-mismatch",
      fileFingerprint: "file-original",
      rows: [csvRow({ csvRowNumber: 2, name: "原始批次列" })],
    }));
    const mismatch = await confirmCsvRows(csvActor, csvConfirmation({
      batchIdentity: "csv-fingerprint-mismatch",
      fileFingerprint: "file-changed",
      rows: [csvRow({ csvRowNumber: 3, name: "錯誤批次列" })],
    }));

    expect(first.ok && first.rows[0]?.status).toBe("created");
    expect(mismatch).toEqual({ ok: false, reason: "batch_identity_mismatch" });
    await expect(prisma.ledgerRecord.count({
      where: { name: "錯誤批次列" },
    })).resolves.toBe(0);
    await expect(csvBatch("csv-fingerprint-mismatch")).resolves.toMatchObject({
      importedRowCount: 1,
      failedRowCount: 0,
      skippedRowCount: 0,
    });
  });

  it("commits valid CSV rows independently from terminal domain rejections", async () => {
    const result = await confirmCsvRows(csvActor, csvConfirmation({
      batchIdentity: "csv-partial-success",
      fileFingerprint: "file-partial-success",
      rows: [
        csvRow({
          csvRowNumber: 2,
          name: "CSV 有效列",
        }),
        csvRow({
          csvRowNumber: 3,
          name: "CSV 停用成員列",
          paymentSource: "member",
          payerMemberId: fixture.disabledMember,
        }),
      ],
    }));

    expect(result.ok && result.rows.map(({ status }) => status)).toEqual([
      "created",
      "rejected",
    ]);
    expect(result.ok && result.rows[1]).toMatchObject({
      reason: "disabled_member",
      retryable: false,
    });
    await expect(prisma.ledgerRecord.count({
      where: { name: { in: ["CSV 有效列", "CSV 停用成員列"] } },
    })).resolves.toBe(1);

    const batch = await csvBatch("csv-partial-success");
    expect(batch).toMatchObject({
      importedRowCount: 1,
      failedRowCount: 1,
      skippedRowCount: 0,
    });
    await expect(prisma.ledgerImportRow.findMany({
      where: { batchId: batch?.id },
      orderBy: { csvRowNumber: "asc" },
    })).resolves.toMatchObject([
      { status: "imported", failureReason: null },
      { status: "failed", failureReason: "disabled_member" },
    ]);
  });

  it("returns already_imported when the same batch row identity is retried", async () => {
    const input = csvConfirmation({
      batchIdentity: "csv-retry",
      fileFingerprint: "file-retry",
      rows: [csvRow({ csvRowNumber: 2, name: "CSV 重送列" })],
    });

    const first = await confirmCsvRows(csvActor, input);
    const retried = await confirmCsvRows(csvActor, input);

    expect(first.ok && first.rows[0]).toMatchObject({ status: "created" });
    expect(retried.ok && retried.rows[0]).toMatchObject({
      status: "already_imported",
      recordId: first.ok && first.rows[0].status === "created"
        ? first.rows[0].recordId
        : "missing",
    });
    await expect(prisma.ledgerRecord.count({
      where: { name: "CSV 重送列" },
    })).resolves.toBe(1);
    await expect(csvBatch("csv-retry")).resolves.toMatchObject({
      importedRowCount: 1,
      failedRowCount: 0,
      skippedRowCount: 0,
    });
  });

  it("resolves concurrent confirms of the same new row without a duplicate record", async () => {
    const input = csvConfirmation({
      batchIdentity: "csv-same-row-race",
      fileFingerprint: "file-same-row-race",
      rows: [csvRow({ csvRowNumber: 2, name: "冪等列" })],
    });

    const results = await Promise.all([
      confirmCsvRows(csvActor, input),
      confirmCsvRows(csvActor, input),
    ]);

    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.flatMap((result) =>
      result.ok ? result.rows.map((row) => row.status) : [],
    ).sort()).toEqual(["already_imported", "created"]);
    expect(await prisma.ledgerRecord.count({ where: { name: "冪等列" } })).toBe(1);
    await expect(csvBatch("csv-same-row-race")).resolves.toMatchObject({
      importedRowCount: 1,
      failedRowCount: 0,
      skippedRowCount: 0,
    });
  });

  it("atomically increments counters for concurrent different rows in one new batch", async () => {
    const common = {
      batchIdentity: "csv-different-row-race",
      fileFingerprint: "file-different-row-race",
    };

    const results = await Promise.all([
      confirmCsvRows(csvActor, csvConfirmation({
        ...common,
        rows: [csvRow({ csvRowNumber: 2, name: "並行列 A" })],
      })),
      confirmCsvRows(csvActor, csvConfirmation({
        ...common,
        rows: [csvRow({ csvRowNumber: 3, name: "並行列 B" })],
      })),
    ]);

    expect(results.every((result) =>
      result.ok && result.rows[0]?.status === "created",
    )).toBe(true);
    await expect(csvBatch("csv-different-row-race")).resolves.toMatchObject({
      importedRowCount: 2,
      failedRowCount: 0,
      skippedRowCount: 0,
    });
  });

  it("treats identical fingerprints under different identities as warnings only", async () => {
    const sharedFingerprint = "same-warning-fingerprint";
    const first = await confirmCsvRows(csvActor, csvConfirmation({
      batchIdentity: "csv-fingerprint-a",
      fileFingerprint: "file-fingerprint-a",
      rows: [csvRow({
        csvRowNumber: 2,
        name: "相同內容可匯入",
        rowFingerprint: sharedFingerprint,
      })],
    }));
    const second = await confirmCsvRows(csvActor, csvConfirmation({
      batchIdentity: "csv-fingerprint-b",
      fileFingerprint: "file-fingerprint-b",
      rows: [csvRow({
        csvRowNumber: 9,
        name: "相同內容可匯入",
        rowFingerprint: sharedFingerprint,
      })],
    }));

    expect(first.ok && first.rows[0]?.status).toBe("created");
    expect(second.ok && second.rows[0]?.status).toBe("created");
    await expect(prisma.ledgerRecord.count({
      where: { name: "相同內容可匯入" },
    })).resolves.toBe(2);
  });

  it("rolls back only the row whose PostgreSQL audit write fails", async () => {
    const result = await confirmCsvRows(csvActor, csvConfirmation({
      batchIdentity: "csv-row-rollback",
      fileFingerprint: "file-row-rollback",
      rows: [
        csvRow({ csvRowNumber: 2, name: "交易成功列" }),
        csvRow({
          csvRowNumber: 3,
          name: "交易回滾列",
          rowFingerprint: null as unknown as string,
        }),
      ],
    }));

    expect(result.ok && result.rows).toEqual([
      expect.objectContaining({ status: "created" }),
      expect.objectContaining({
        status: "rejected",
        reason: "unavailable",
        retryable: true,
      }),
    ]);
    await expect(prisma.ledgerRecord.count({
      where: { name: "交易成功列" },
    })).resolves.toBe(1);
    await expect(prisma.ledgerRecord.count({
      where: { name: "交易回滾列" },
    })).resolves.toBe(0);

    const batch = await csvBatch("csv-row-rollback");
    await expect(prisma.ledgerImportRow.count({
      where: { batchId: batch?.id },
    })).resolves.toBe(1);
    expect(batch).toMatchObject({
      importedRowCount: 1,
      failedRowCount: 0,
      skippedRowCount: 0,
    });
  });

  it("preserves source-rejected and skipped rows as terminal audit", async () => {
    const result = await confirmCsvRows(csvActor, csvConfirmation({
      batchIdentity: "csv-source-audit",
      fileFingerprint: "file-source-audit",
      rows: [],
      sourceRejectedRows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        rowFingerprint: "invalid-2",
        reason: "member_not_found",
      }],
      skippedRows: [{
        rowIdentity: "csv-row:3",
        csvRowNumber: 3,
        rowFingerprint: "skipped-3",
      }],
    }));

    expect(result).toMatchObject({
      ok: true,
      rows: [{
        rowIdentity: "csv-row:2",
        status: "rejected",
        reason: "member_not_found",
        retryable: false,
      }],
      skippedRows: [{ rowIdentity: "csv-row:3", status: "skipped" }],
    });
    const batch = await csvBatch("csv-source-audit");
    expect(batch).toMatchObject({
      importedRowCount: 0,
      failedRowCount: 1,
      skippedRowCount: 1,
    });
    await expect(prisma.ledgerImportRow.findMany({
      where: { batchId: batch?.id },
      orderBy: { csvRowNumber: "asc" },
    })).resolves.toMatchObject([
      { status: "failed", failureReason: "member_not_found" },
      { status: "skipped", failureReason: null },
    ]);
  });

  it("replays the persisted terminal rejection after its mapping changes", async () => {
    const failedInput = csvConfirmation({
      batchIdentity: "csv-terminal-replay",
      fileFingerprint: "file-terminal-replay",
      rows: [csvRow({
        csvRowNumber: 2,
        name: "終端失敗列",
        paymentSource: "member",
        payerMemberId: fixture.disabledMember,
      })],
    });

    const first = await confirmCsvRows(csvActor, failedInput);
    const replay = await confirmCsvRows(csvActor, {
      ...failedInput,
      rows: [csvRow({
        csvRowNumber: 2,
        name: "終端失敗列已修正",
      })],
    });

    expect(first.ok && first.rows[0]).toMatchObject({
      status: "rejected",
      reason: "disabled_member",
      retryable: false,
    });
    expect(replay.ok && replay.rows[0]).toMatchObject({
      status: "rejected",
      reason: "disabled_member",
      retryable: false,
    });
    await expect(csvBatch("csv-terminal-replay")).resolves.toMatchObject({
      importedRowCount: 0,
      failedRowCount: 1,
      skippedRowCount: 0,
    });
    await expect(prisma.ledgerRecord.count({
      where: { name: "終端失敗列已修正" },
    })).resolves.toBe(0);
  });

  it("replays a persisted imported row into rows when the handoff later marks it skipped", async () => {
    const input = csvConfirmation({
      batchIdentity: "csv-imported-to-skipped-replay",
      rows: [csvRow({ csvRowNumber: 2, name: "匯入後改為略過" })],
    });

    const first = await confirmCsvRows(csvActor, input);
    const replay = await confirmCsvRows(csvActor, {
      ...input,
      rows: [],
      skippedRows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        rowFingerprint: "changed-skipped-fingerprint",
      }],
    });

    expect(first.ok && first.rows).toEqual([
      expect.objectContaining({ status: "created" }),
    ]);
    expect(replay).toMatchObject({
      ok: true,
      rows: [expect.objectContaining({
        rowIdentity: "csv-row:2",
        status: "already_imported",
      })],
      skippedRows: [],
    });
    await expect(csvBatch("csv-imported-to-skipped-replay")).resolves.toMatchObject({
      importedRowCount: 1,
      failedRowCount: 0,
      skippedRowCount: 0,
    });
    await expect(prisma.ledgerRecord.count({
      where: { name: "匯入後改為略過" },
    })).resolves.toBe(1);
    await expect(csvRowTraces("csv-imported-to-skipped-replay")).resolves.toMatchObject([
      {
        status: "imported",
        failureReason: null,
        rowFingerprint: "fingerprint-2",
      },
    ]);
  });

  it("replays a persisted failed row into rows when the handoff later marks it skipped", async () => {
    const input = csvConfirmation({
      batchIdentity: "csv-failed-to-skipped-replay",
      rows: [csvRow({
        csvRowNumber: 2,
        name: "失敗後改為略過",
        paymentSource: "member",
        payerMemberId: fixture.disabledMember,
      })],
    });

    const first = await confirmCsvRows(csvActor, input);
    const replay = await confirmCsvRows(csvActor, {
      ...input,
      rows: [],
      skippedRows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        rowFingerprint: "changed-skipped-fingerprint",
      }],
    });

    expect(first.ok && first.rows).toMatchObject([{
      status: "rejected",
      reason: "disabled_member",
      retryable: false,
    }]);
    expect(replay).toMatchObject({
      ok: true,
      rows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        status: "rejected",
        reason: "disabled_member",
        retryable: false,
      }],
      skippedRows: [],
    });
    await expect(csvBatch("csv-failed-to-skipped-replay")).resolves.toMatchObject({
      importedRowCount: 0,
      failedRowCount: 1,
      skippedRowCount: 0,
    });
    await expect(prisma.ledgerRecord.count({
      where: { name: "失敗後改為略過" },
    })).resolves.toBe(0);
    await expect(csvRowTraces("csv-failed-to-skipped-replay")).resolves.toMatchObject([
      {
        status: "failed",
        failureReason: "disabled_member",
        rowFingerprint: "fingerprint-2",
      },
    ]);
  });

  it("replays a persisted skipped row into skippedRows when the handoff later makes it active", async () => {
    const input = csvConfirmation({
      batchIdentity: "csv-skipped-to-active-replay",
      skippedRows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        rowFingerprint: "initial-skipped-fingerprint",
      }],
    });

    const first = await confirmCsvRows(csvActor, input);
    const replay = await confirmCsvRows(csvActor, {
      ...input,
      rows: [csvRow({ csvRowNumber: 2, name: "略過後改為匯入" })],
      skippedRows: [],
    });

    expect(first).toMatchObject({
      ok: true,
      rows: [],
      skippedRows: [{ rowIdentity: "csv-row:2", status: "skipped" }],
    });
    expect(replay).toMatchObject({
      ok: true,
      rows: [],
      skippedRows: [{ rowIdentity: "csv-row:2", status: "skipped" }],
    });
    await expect(csvBatch("csv-skipped-to-active-replay")).resolves.toMatchObject({
      importedRowCount: 0,
      failedRowCount: 0,
      skippedRowCount: 1,
    });
    await expect(prisma.ledgerRecord.count({
      where: { name: "略過後改為匯入" },
    })).resolves.toBe(0);
    await expect(csvRowTraces("csv-skipped-to-active-replay")).resolves.toMatchObject([
      {
        status: "skipped",
        failureReason: null,
        rowFingerprint: "initial-skipped-fingerprint",
      },
    ]);
  });

  it("replays a persisted skipped row into skippedRows when the handoff later rejects it", async () => {
    const recordsBefore = await prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    });
    const input = csvConfirmation({
      batchIdentity: "csv-skipped-to-rejected-replay",
      skippedRows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        rowFingerprint: "initial-skipped-fingerprint",
      }],
    });

    const first = await confirmCsvRows(csvActor, input);
    const replay = await confirmCsvRows(csvActor, {
      ...input,
      sourceRejectedRows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        rowFingerprint: "changed-rejected-fingerprint",
        reason: "member_not_found",
      }],
      skippedRows: [],
    });

    expect(first).toMatchObject({
      ok: true,
      rows: [],
      skippedRows: [{ rowIdentity: "csv-row:2", status: "skipped" }],
    });
    expect(replay).toMatchObject({
      ok: true,
      rows: [],
      skippedRows: [{ rowIdentity: "csv-row:2", status: "skipped" }],
    });
    await expect(csvBatch("csv-skipped-to-rejected-replay")).resolves.toMatchObject({
      importedRowCount: 0,
      failedRowCount: 0,
      skippedRowCount: 1,
    });
    await expect(prisma.ledgerRecord.count({
      where: { householdId: fixture.householdA },
    })).resolves.toBe(recordsBefore);
    await expect(csvRowTraces("csv-skipped-to-rejected-replay")).resolves.toMatchObject([
      {
        status: "skipped",
        failureReason: null,
        rowFingerprint: "initial-skipped-fingerprint",
      },
    ]);
  });
});

const csvActor = { kind: "member", member: financeMember } as const;

function csvConfirmation(
  input: Partial<ConfirmCsvRowsInput> & Pick<ConfirmCsvRowsInput, "batchIdentity">,
): ConfirmCsvRowsInput {
  return {
    batchIdentity: input.batchIdentity,
    fileName: input.fileName ?? "ledger.csv",
    fileFingerprint: input.fileFingerprint ?? `file-${input.batchIdentity}`,
    rows: input.rows ?? [],
    sourceRejectedRows: input.sourceRejectedRows ?? [],
    skippedRows: input.skippedRows ?? [],
  };
}

function csvRow({
  csvRowNumber,
  name,
  paymentSource = "fund",
  payerMemberId,
  rowFingerprint = `fingerprint-${csvRowNumber}`,
}: {
  csvRowNumber: number;
  name: string;
  paymentSource?: "fund" | "member";
  payerMemberId?: string;
  rowFingerprint?: string;
}): ConfirmCsvRowsInput["rows"][number] {
  return {
    rowIdentity: `csv-row:${csvRowNumber}`,
    csvRowNumber,
    rowFingerprint,
    draft: {
      type: "expense",
      name,
      amountCents: 1_000,
      occurredOn: "2026-07-17",
      categoryId: fixture.expenseCategory,
      paymentSource,
      ...(payerMemberId ? { payerMemberId } : {}),
    },
  };
}

function csvBatch(batchIdentity: string) {
  return prisma.ledgerImportBatch.findUnique({
    where: {
      householdId_batchIdentity: {
        householdId: fixture.householdA,
        batchIdentity,
      },
    },
  });
}

async function csvRowTraces(batchIdentity: string) {
  const batch = await csvBatch(batchIdentity);

  return prisma.ledgerImportRow.findMany({
    where: { batchId: batch?.id },
    orderBy: { csvRowNumber: "asc" },
  });
}

async function cleanupCreationFixtures() {
  await dropRecurringFailureTrigger();
  await dropRecurringRaceTrigger();
  await prisma.recurringOccurrence.deleteMany({
    where: { householdId: { in: [fixture.householdA, fixture.householdB] } },
  });
  await prisma.recurringRule.deleteMany({
    where: { householdId: { in: [fixture.householdA, fixture.householdB] } },
  });
  await prisma.ledgerImportBatch.deleteMany({
    where: { householdId: { in: [fixture.householdA, fixture.householdB] } },
  });
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

async function createRecurringOccurrence({
  categoryId,
  createdByMemberId = fixture.financeMember,
  householdId = fixture.householdA,
  id,
  name,
  paymentSource,
  postingMode = "immediate",
  sourceMemberId,
  payerMemberId,
  targetDate = "2026-07-17",
  type,
}: {
  categoryId: string;
  createdByMemberId?: string;
  householdId?: string;
  id: string;
  name: string;
  paymentSource?: "fund" | "member";
  postingMode?: "immediate" | "reminder";
  sourceMemberId?: string;
  payerMemberId?: string;
  targetDate?: string;
  type: "income" | "expense";
}) {
  const recurringRuleId = `rule-${id}`;
  await prisma.recurringRule.create({
    data: {
      id: recurringRuleId,
      householdId,
      name,
      type,
      amountCents: 12_300,
      categoryId,
      sourceMemberId: sourceMemberId ?? null,
      paymentSource: paymentSource ?? null,
      payerMemberId: payerMemberId ?? null,
      postingMode,
      scheduleAnchor: "fixed_day",
      dayOfMonth: Number(targetDate.slice(-2)),
      createdByMemberId,
    },
  });

  return prisma.recurringOccurrence.create({
    data: {
      id,
      householdId,
      recurringRuleId,
      month: targetDate.slice(0, 7),
      targetDate: new Date(`${targetDate}T00:00:00.000Z`),
      status: "pending",
    },
  });
}

async function installRecurringFailureTrigger() {
  await dropRecurringFailureTrigger();
  await prisma.$executeRawUnsafe(`
    CREATE FUNCTION integration_recurring_posting_failure() RETURNS trigger AS $$
    BEGIN
      IF NEW."name" = '${fixture.recurringFailureName}' THEN
        RAISE EXCEPTION 'integration recurring transient failure' USING ERRCODE = '40001';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    CREATE TRIGGER integration_recurring_posting_failure_trigger
    BEFORE INSERT ON "LedgerRecord"
    FOR EACH ROW EXECUTE FUNCTION integration_recurring_posting_failure();
  `);
}

async function dropRecurringFailureTrigger() {
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS integration_recurring_posting_failure_trigger ON "LedgerRecord";
    DROP FUNCTION IF EXISTS integration_recurring_posting_failure();
  `);
}

async function installRecurringRaceTrigger() {
  await dropRecurringRaceTrigger();
  await prisma.$executeRawUnsafe(`
    CREATE FUNCTION integration_recurring_posting_race() RETURNS trigger AS $$
    BEGIN
      IF NEW."name" = '${fixture.recurringRaceName}' THEN
        PERFORM pg_advisory_xact_lock(4170717);
        PERFORM pg_sleep(0.5);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    CREATE TRIGGER integration_recurring_posting_race_trigger
    BEFORE INSERT ON "LedgerRecord"
    FOR EACH ROW EXECUTE FUNCTION integration_recurring_posting_race();
  `);
}

async function dropRecurringRaceTrigger() {
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS integration_recurring_posting_race_trigger ON "LedgerRecord";
    DROP FUNCTION IF EXISTS integration_recurring_posting_race();
  `);
}

async function waitForAdvisoryWaiter(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  advisoryKey: number,
) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const [row] = await tx.$queryRaw<{ waiting: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_locks
        WHERE locktype = 'advisory'
          AND granted = false
          AND classid = 0
          AND objid = ${advisoryKey}::oid
      ) AS waiting
    `;
    if (row?.waiting) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Recurring race posting attempt did not reach the advisory gate");
}
