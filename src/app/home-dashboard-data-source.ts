import type { Category } from "../modules/categorization/category-catalog";
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  isCategoryColorKey,
  isCategoryIconKey,
} from "../modules/categorization/category-visual-options";
import type { LedgerRecord } from "../modules/fund-ledger/ledger-records";
import {
  mapPrismaLedgerRecordToLedgerRecord,
  prismaLedgerRecordSelect,
  type PrismaLedgerRecordRow,
} from "../modules/fund-ledger/ledger-record-prisma-adapter";
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

export type HomeDashboardPrismaClient = {
  member: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: {
        id: true;
        householdId: true;
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
      where: {
        householdId: string;
      };
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
      const [householdMembers, categories, records] =
        await Promise.all([
          prisma.member.findMany({
            where: {
              householdId,
            },
            select: {
              id: true,
              householdId: true,
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
            where: {
              householdId,
            },
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
              householdId,
              occurredOn: monthDateRange(month),
              status: "active",
            },
            select: prismaLedgerRecordSelect,
            orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }],
          }),
        ]);

      return {
        householdMembers: householdMembers.map(mapPrismaMemberToHouseholdMember),
        categories: categories.map(mapPrismaCategoryToCategory),
        records: records.map(mapPrismaLedgerRecordToLedgerRecord),
      };
    },
    async getSearchPageData(householdId: string): Promise<HomeDashboardData> {
      const [householdMembers, categories] = await Promise.all([
        prisma.member.findMany({
          where: {
            householdId,
          },
          select: {
            id: true,
            householdId: true,
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
          where: {
            householdId,
          },
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
