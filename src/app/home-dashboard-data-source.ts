import type { Category } from "../modules/categorization/category-catalog";
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  isCategoryColorKey,
  isCategoryIconKey,
} from "../modules/categorization/category-visual-options";
import type { LedgerRecord } from "../modules/fund-ledger/ledger-records";
import type { HouseholdMemberAccount } from "../modules/identity-access/member-management";
import { mapPrismaMemberToHouseholdMember } from "../auth/current-member-data-source";

export type HomeDashboardData = {
  householdMembers: HouseholdMemberAccount[];
  categories: Category[];
  records: LedgerRecord[];
};

type PrismaMemberRow = Parameters<typeof mapPrismaMemberToHouseholdMember>[0];

type PrismaCategoryRow = {
  id: string;
  type: Category["type"];
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
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
  status: LedgerRecord["status"];
  note: string | null;
};

const ledgerRecordSelect = {
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
  status: true,
  note: true,
} as const;

export type HomeDashboardPrismaClient = {
  member: {
    findMany(args: {
      select: {
        id: true;
        displayName: true;
        avatarUrl: true;
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
        color: true;
        icon: true;
        sortOrder: true;
        status: true;
      };
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }];
    }): Promise<PrismaCategoryRow[]>;
  };
  ledgerRecord: {
    findMany(args: {
      where: { occurredOn?: { gte: Date; lt: Date }; status: "active" };
      select: typeof ledgerRecordSelect;
      orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }];
    }): Promise<PrismaLedgerRecordRow[]>;
  };
};

export function createHomeDashboardDataSource(
  prisma: HomeDashboardPrismaClient,
) {
  return {
    async getMonthlyDashboardData(month: string): Promise<HomeDashboardData> {
      const [householdMembers, categories, records] =
        await Promise.all([
          prisma.member.findMany({
            select: {
        id: true,
        displayName: true,
        avatarUrl: true,
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
              color: true,
              icon: true,
              sortOrder: true,
              status: true,
            },
            orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
          }),
          prisma.ledgerRecord.findMany({
            where: {
              occurredOn: monthDateRange(month),
              status: "active",
            },
            select: ledgerRecordSelect,
            orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }],
          }),
        ]);

      return {
        householdMembers: householdMembers.map(mapPrismaMemberToHouseholdMember),
        categories: categories.map(mapPrismaCategoryToCategory),
        records: records.map(mapPrismaLedgerRecordToLedgerRecord),
      };
    },
    async getSearchPageData(): Promise<HomeDashboardData> {
      const [householdMembers, categories] = await Promise.all([
        prisma.member.findMany({
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
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
            color: true,
            icon: true,
            sortOrder: true,
            status: true,
          },
          orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        }),
      ]);

      return {
        householdMembers: householdMembers.map(mapPrismaMemberToHouseholdMember),
        categories: categories.map(mapPrismaCategoryToCategory),
        records: [],
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
    status: record.status,
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
    color: isCategoryColorKey(category.color)
      ? category.color
      : DEFAULT_CATEGORY_COLOR,
    icon: isCategoryIconKey(category.icon) ? category.icon : DEFAULT_CATEGORY_ICON,
    sortOrder: category.sortOrder,
    status: category.status,
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
