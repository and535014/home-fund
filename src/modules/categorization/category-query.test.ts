import { describe, expect, it, vi } from "vitest";
import {
  loadActiveCategoryOptions,
  loadCategoryLookups,
  loadHouseholdCategories,
} from "./category-query";

describe("category query", () => {
  it("loads household categories with visual fallback mapping", async () => {
    const prisma = {
      category: {
        findMany: vi.fn(async () => [
          {
            id: "expense-grocery",
            type: "expense" as const,
            name: "日用品",
            color: "unknown",
            icon: "unknown",
            sortOrder: 10,
            status: "active" as const,
          },
        ]),
      },
    };

    await expect(loadHouseholdCategories({
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual([
      {
        id: "expense-grocery",
        type: "expense",
        name: "日用品",
        color: "gold",
        icon: "tags",
        sortOrder: 10,
        status: "active",
      },
    ]);
    expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { householdId: "household-demo" },
      orderBy: [
        { type: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    }));
  });

  it("loads active category options for input surfaces", async () => {
    const prisma = {
      category: {
        findMany: vi.fn(async () => [
          { id: "expense-food", type: "expense" as const, name: "餐飲" },
        ]),
      },
    };

    await expect(loadActiveCategoryOptions({
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual([
      { id: "expense-food", type: "expense", name: "餐飲" },
    ]);
    expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        householdId: "household-demo",
        status: "active",
      },
    }));
  });

  it("loads category lookups for domain validation", async () => {
    const prisma = {
      category: {
        findMany: vi.fn(async () => [
          { id: "income-living", type: "income" as const, status: "active" as const },
        ]),
      },
    };

    await expect(loadCategoryLookups({
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual([
      { id: "income-living", type: "income", status: "active" },
    ]);
  });
});
