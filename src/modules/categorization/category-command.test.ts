import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  archiveCategoryInDatabase,
  createCategoryInDatabase,
  getCategoryReferenceCounts,
  renameCategoryInDatabase,
  reorderCategoriesInDatabase,
  unarchiveCategoryInDatabase,
  updateCategoryInDatabase,
  type CategoryCommandPrismaClient,
} from "./category-command";

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const generalMember: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const categories = [
  {
    id: "category-income-rent",
    type: "income" as const,
    name: "房租",
    color: "blue" as const,
    icon: "home" as const,
    sortOrder: 10,
    status: "active" as const,
  },
  {
    id: "category-expense-grocery",
    type: "expense" as const,
    name: "日用品",
    color: "gold" as const,
    icon: "shopping-cart" as const,
    sortOrder: 10,
    status: "active" as const,
  },
  {
    id: "category-expense-internet",
    type: "expense" as const,
    name: "網路費",
    color: "violet" as const,
    icon: "wifi" as const,
    sortOrder: 20,
    status: "active" as const,
  },
  {
    id: "category-expense-archived",
    type: "expense" as const,
    name: "舊分類",
    color: "rose" as const,
    icon: "tags" as const,
    sortOrder: 30,
    status: "archived" as const,
  },
];

function createPrismaStub(
  overrides: Partial<CategoryCommandPrismaClient> = {},
): CategoryCommandPrismaClient {
  return {
    category: {
      findMany: vi.fn().mockResolvedValue(categories),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      ...overrides.category,
    },
    ledgerRecord: {
      groupBy: vi.fn().mockResolvedValue([]),
      ...overrides.ledgerRecord,
    },
  };
}

describe("category command database adapter", () => {
  it("creates an active category after domain validation passes", async () => {
    const prisma = createPrismaStub();

    const result = await createCategoryInDatabase(admin, {
      type: "expense",
      name: "水電費",
      color: "blue",
      icon: "home",
    }, {
      prisma,
      generateId: () => "category-expense-internet",
    });

    expect(result).toMatchObject({
      ok: true,
      category: {
        id: "category-expense-internet",
        type: "expense",
        name: "水電費",
        status: "active",
      },
    });
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        id: "category-expense-internet",
        householdId: "household-demo",
        type: "expense",
        name: "水電費",
        color: "blue",
        icon: "home",
        sortOrder: 30,
        status: "active",
      },
    });
  });

  it("does not write when category creation is rejected", async () => {
    const prisma = createPrismaStub();

    const result = await createCategoryInDatabase(generalMember, {
      type: "expense",
      name: "網路費",
    }, { prisma });

    expect(result).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "admin_required",
    });
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it("renames active categories in the database", async () => {
    const prisma = createPrismaStub();

    const result = await renameCategoryInDatabase(admin, {
      categoryId: "category-expense-grocery",
      name: "家庭用品",
    }, { prisma });

    expect(result).toMatchObject({
      ok: true,
      category: {
        id: "category-expense-grocery",
        name: "家庭用品",
      },
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: {
        id: "category-expense-grocery",
      },
      data: {
        name: "家庭用品",
      },
    });
  });

  it("updates category name and visual identity in the database", async () => {
    const prisma = createPrismaStub();

    const result = await updateCategoryInDatabase(admin, {
      categoryId: "category-expense-grocery",
      color: "teal",
      icon: "home",
      name: "家庭用品",
    }, { prisma });

    expect(result).toMatchObject({
      ok: true,
      category: {
        id: "category-expense-grocery",
        color: "teal",
        icon: "home",
        name: "家庭用品",
      },
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: {
        id: "category-expense-grocery",
      },
      data: {
        color: "teal",
        icon: "home",
        name: "家庭用品",
      },
    });
  });

  it("archives categories by updating status", async () => {
    const prisma = createPrismaStub();

    const result = await archiveCategoryInDatabase(admin, {
      categoryId: "category-expense-grocery",
    }, { prisma });

    expect(result).toMatchObject({
      ok: true,
      category: {
        id: "category-expense-grocery",
        status: "archived",
      },
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: {
        id: "category-expense-grocery",
      },
      data: {
        status: "archived",
      },
    });
  });

  it("unarchives categories by updating status and appended sort order", async () => {
    const prisma = createPrismaStub({
      $transaction: vi.fn(async (callback) => callback(prisma)),
    } as Partial<CategoryCommandPrismaClient>);

    const result = await unarchiveCategoryInDatabase(admin, {
      categoryId: "category-expense-archived",
    }, { prisma });

    expect(result).toMatchObject({
      ok: true,
      category: {
        id: "category-expense-archived",
        sortOrder: 30,
        status: "active",
      },
      events: ["Category unarchived"],
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: {
        id: "category-expense-archived",
      },
      data: {
        sortOrder: 30,
        status: "active",
      },
    });
  });

  it("does not write when unarchive is rejected", async () => {
    const prisma = createPrismaStub();

    const result = await unarchiveCategoryInDatabase(generalMember, {
      categoryId: "category-expense-archived",
    }, { prisma });

    expect(result).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "admin_required",
    });
    expect(prisma.category.update).not.toHaveBeenCalled();
  });

  it("counts historical ledger references by category", async () => {
    const prisma = createPrismaStub({
      ledgerRecord: {
        groupBy: vi.fn().mockResolvedValue([
          { categoryId: "category-expense-grocery", _count: { _all: 2 } },
        ]),
      },
    });

    await expect(getCategoryReferenceCounts({
      prisma,
      categoryIds: ["category-expense-grocery", "category-income-rent"],
    })).resolves.toEqual(new Map([
      ["category-expense-grocery", 2],
      ["category-income-rent", 0],
    ]));
  });

  it("reorders active categories transactionally within the requested type", async () => {
    const prisma = createPrismaStub({
      $transaction: vi.fn(async (callback) => callback(prisma)),
    } as Partial<CategoryCommandPrismaClient>);

    const result = await reorderCategoriesInDatabase(admin, {
      type: "expense",
      orderedCategoryIds: [
        "category-expense-internet",
        "category-expense-grocery",
      ],
    }, { prisma });

    expect(result).toMatchObject({
      ok: true,
      events: ["Category updated"],
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: {
        id: "category-expense-internet",
      },
      data: {
        sortOrder: 10,
      },
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: {
        id: "category-expense-grocery",
      },
      data: {
        sortOrder: 20,
      },
    });
  });
});
