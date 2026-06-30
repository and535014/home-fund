import type { Category } from "../modules/categorization/category-catalog";
import {
  loadHouseholdCategories,
  type CategoryQueryPrismaClient,
} from "../modules/categorization/category-query";
import type { LedgerRecord } from "../modules/fund-ledger/ledger-records";
import {
  mapPrismaLedgerRecordToLedgerRecord,
  prismaLedgerRecordSelect,
  type PrismaLedgerRecordRow,
} from "../modules/fund-ledger/ledger-record-prisma-adapter";
import type { HouseholdMemberAccount } from "../modules/identity-access/member-management";
import {
  loadHouseholdMembers,
  type HouseholdMemberQueryPrismaClient,
} from "../modules/identity-access/household-member-query";
import {
  loadPendingRecurringOccurrenceRecordsForMonth,
  type PendingRecurringOccurrencePrismaClient,
  type PendingRecurringOccurrenceRecord,
} from "../modules/recurring/recurring-occurrence-query";

export type HomeDashboardData = {
  householdMembers: HouseholdMemberAccount[];
  categories: Category[];
  pendingRecurringRecords: PendingRecurringOccurrenceRecord[];
  records: LedgerRecord[];
  yearlyRecords: LedgerRecord[];
};

export type HomeDashboardPrismaClient =
  HouseholdMemberQueryPrismaClient &
  CategoryQueryPrismaClient &
  PendingRecurringOccurrencePrismaClient & {
  ledgerRecord: {
    findMany(args: {
      where: {
        householdId: string;
        occurredOn?: { gte: Date; lt: Date };
        status: "active";
      };
      select: typeof prismaLedgerRecordSelect;
      orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }];
    }): Promise<PrismaLedgerRecordRow[]>;
  };
};

export function createHomeDashboardDataSource(
  prisma: HomeDashboardPrismaClient,
) {
  return {
    async getMonthlyDashboardData(
      householdId: string,
      month: string,
    ): Promise<HomeDashboardData> {
      const [householdMembers, categories, records, yearlyRecords, pendingRecurringRecords] =
        await Promise.all([
          loadHouseholdMembers({ householdId, prisma }),
          loadHouseholdCategories({ householdId, prisma }),
          prisma.ledgerRecord.findMany({
            where: {
              householdId,
              occurredOn: monthDateRange(month),
              status: "active",
            },
            select: prismaLedgerRecordSelect,
            orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }],
          }),
          prisma.ledgerRecord.findMany({
            where: {
              householdId,
              occurredOn: yearDateRange(month),
              status: "active",
            },
            select: prismaLedgerRecordSelect,
            orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }],
          }),
          loadPendingRecurringOccurrenceRecordsForMonth({
            householdId,
            month,
            prisma,
          }),
        ]);

      return {
        householdMembers,
        categories,
        pendingRecurringRecords,
        records: records.map(mapPrismaLedgerRecordToLedgerRecord),
        yearlyRecords: yearlyRecords.map(mapPrismaLedgerRecordToLedgerRecord),
      };
    },
    async getSearchPageData(householdId: string): Promise<HomeDashboardData> {
      const [householdMembers, categories] = await Promise.all([
        loadHouseholdMembers({ householdId, prisma }),
        loadHouseholdCategories({ householdId, prisma }),
      ]);

      return {
        householdMembers,
        categories,
        pendingRecurringRecords: [],
        records: [],
        yearlyRecords: [],
      };
    },
  };
}

function monthDateRange(month: string): { gte: Date; lt: Date } {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
    lt: new Date(Date.UTC(year, monthNumber, 1)),
  };
}

function yearDateRange(month: string): { gte: Date; lt: Date } {
  const [year] = month.split("-").map(Number);

  return {
    gte: new Date(Date.UTC(year, 0, 1)),
    lt: new Date(Date.UTC(year + 1, 0, 1)),
  };
}
