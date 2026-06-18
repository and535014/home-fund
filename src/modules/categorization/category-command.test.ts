import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  archiveCategoryInDatabase,
  createCategoryInDatabase,
  getCategoryReferenceCounts,
  renameCategoryInDatabase,
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
    status: "active" as const,
  },
  {
    id: "category-expense-grocery",
    type: "expense" as const,
    name: "日用品",
    status: "active" as const,
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
      name: "網路費",
    }, {
      prisma,
      generateId: () => "category-expense-internet",
    });

    expect(result).toMatchObject({
      ok: true,
      category: {
        id: "category-expense-internet",
        type: "expense",
        name: "網路費",
        status: "active",
      },
    });
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        id: "category-expense-internet",
        householdId: "household-demo",
        type: "expense",
        name: "網路費",
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
});
