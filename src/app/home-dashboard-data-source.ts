import type { Category } from "../modules/categorization/category-catalog";
import type { LedgerRecord } from "../modules/fund-ledger/ledger-records";
import type { HouseholdMemberAccount } from "../modules/identity-access/member-management";
import type { RecurringOccurrence } from "../modules/recurring-schedule/recurring-rules";
import { mapPrismaMemberToHouseholdMember } from "../auth/current-member-data-source";

export type HomeDashboardData = {
  householdMembers: HouseholdMemberAccount[];
  categories: Category[];
  records: LedgerRecord[];
  pendingOccurrences: RecurringOccurrence[];
};

type PrismaMemberRow = Parameters<typeof mapPrismaMemberToHouseholdMember>[0];

type PrismaCategoryRow = {
  id: string;
  type: Category["type"];
  name: string;
  status: Category["status"];
};

type PrismaLedgerRecordRow = {
  id: string;
  type: LedgerRecord["type"];
  name: string;
  amountCents: number;
  occurredOn: Date;
  categoryId: string;
  createdByMemberId: string;
  sourceMemberId: string | null;
  paymentSource: "fund" | "member" | null;
  payerMemberId: string | null;
  reimbursementStatus: LedgerRecord["reimbursementStatus"];
  note: string | null;
};

type PrismaRecurringOccurrenceRow = {
  id: string;
  recurringRuleId: string;
  month: string;
  status: RecurringOccurrence["status"] | "skipped";
  ledgerRecordId: string | null;
};

export type HomeDashboardPrismaClient = {
  member: {
    findMany(args: {
      select: {
        id: true;
        displayName: true;
        googleAccountEmail: true;
        googleSubject: true;
        status: true;
        roles: {
          select: {
            role: true;
          };
        };
        capabilities: {
          select: {
            capability: true;
          };
        };
      };
      orderBy: {
        displayName: "asc";
      };
    }): Promise<PrismaMemberRow[]>;
  };
  category: {
    findMany(args: {
      select: {
        id: true;
        type: true;
        name: true;
        status: true;
      };
      orderBy: [{ type: "asc" }, { name: "asc" }];
    }): Promise<PrismaCategoryRow[]>;
  };
  ledgerRecord: {
    findMany(args: {
      where: {
        occurredOn: {
          gte: Date;
          lt: Date;
        };
      };
      select: {
        id: true;
        type: true;
        name: true;
        amountCents: true;
        occurredOn: true;
        categoryId: true;
        createdByMemberId: true;
        sourceMemberId: true;
        paymentSource: true;
        payerMemberId: true;
        reimbursementStatus: true;
        note: true;
      };
      orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }];
    }): Promise<PrismaLedgerRecordRow[]>;
  };
  recurringOccurrence: {
    findMany(args: {
      where: {
        month: string;
        status: "pending";
      };
      select: {
        id: true;
        recurringRuleId: true;
        month: true;
        status: true;
        ledgerRecordId: true;
      };
      orderBy: {
        createdAt: "asc";
      };
    }): Promise<PrismaRecurringOccurrenceRow[]>;
  };
};

export function createHomeDashboardDataSource(
  prisma: HomeDashboardPrismaClient,
) {
  return {
    async getMonthlyDashboardData(month: string): Promise<HomeDashboardData> {
      const [householdMembers, categories, records, pendingOccurrences] =
        await Promise.all([
          prisma.member.findMany({
            select: {
              id: true,
              displayName: true,
              googleAccountEmail: true,
              googleSubject: true,
              status: true,
              roles: {
                select: {
                  role: true,
                },
              },
              capabilities: {
                select: {
                  capability: true,
                },
              },
            },
            orderBy: {
              displayName: "asc",
            },
          }),
          prisma.category.findMany({
            select: {
              id: true,
              type: true,
              name: true,
              status: true,
            },
            orderBy: [{ type: "asc" }, { name: "asc" }],
          }),
          prisma.ledgerRecord.findMany({
            where: {
              occurredOn: monthDateRange(month),
            },
            select: {
              id: true,
              type: true,
              name: true,
              amountCents: true,
              occurredOn: true,
              categoryId: true,
              createdByMemberId: true,
              sourceMemberId: true,
              paymentSource: true,
              payerMemberId: true,
              reimbursementStatus: true,
              note: true,
            },
            orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }],
          }),
          prisma.recurringOccurrence.findMany({
            where: {
              month,
              status: "pending",
            },
            select: {
              id: true,
              recurringRuleId: true,
              month: true,
              status: true,
              ledgerRecordId: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          }),
        ]);

      return {
        householdMembers: householdMembers.map(mapPrismaMemberToHouseholdMember),
        categories: categories.map(mapPrismaCategoryToCategory),
        records: records.map(mapPrismaLedgerRecordToLedgerRecord),
        pendingOccurrences: pendingOccurrences.map(
          mapPrismaRecurringOccurrenceToRecurringOccurrence,
        ),
      };
    },
  };
}

export function mapPrismaLedgerRecordToLedgerRecord(
  record: PrismaLedgerRecordRow,
): LedgerRecord {
  const base = {
    id: record.id,
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: formatDateOnly(record.occurredOn),
    categoryId: record.categoryId,
    createdByMemberId: record.createdByMemberId,
    ...(record.note ? { note: record.note } : {}),
  };

  if (record.type === "income") {
    return {
      ...base,
      type: "income",
      sourceMemberId: record.sourceMemberId ?? "",
      reimbursementStatus: "not_applicable",
    };
  }

  return {
    ...base,
    type: "expense",
    paymentSource: record.paymentSource ?? "fund",
    ...(record.payerMemberId ? { payerMemberId: record.payerMemberId } : {}),
    reimbursementStatus:
      record.reimbursementStatus === "not_applicable"
        ? "not_refundable"
        : record.reimbursementStatus,
  };
}

function mapPrismaCategoryToCategory(category: PrismaCategoryRow): Category {
  return {
    id: category.id,
    type: category.type,
    name: category.name,
    status: category.status,
  };
}

function mapPrismaRecurringOccurrenceToRecurringOccurrence(
  occurrence: PrismaRecurringOccurrenceRow,
): RecurringOccurrence {
  return {
    id: occurrence.id,
    recurringRuleId: occurrence.recurringRuleId,
    month: occurrence.month,
    status: occurrence.status === "posted" ? "posted" : "pending",
    ...(occurrence.ledgerRecordId
      ? { ledgerRecordId: occurrence.ledgerRecordId }
      : {}),
  };
}

function monthDateRange(month: string): { gte: Date; lt: Date } {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
    lt: new Date(Date.UTC(year, monthNumber, 1)),
  };
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
