import { getPrismaClient } from "@/db/prisma";
import { requireAppRouteAccess, type AppAccessSession } from "@/auth/app-access";
import {
  getCategoryReferenceCounts,
  type CategoryCommandPrismaClient,
} from "@/modules/categorization/category-command";
import type { Category } from "@/modules/categorization/category-catalog";
import {
  loadHouseholdCategories,
} from "@/modules/categorization/category-query";
import type { AppSearchParams } from "./route-search-params";

export type CategoryWithReferenceCount = Category & {
  recordCount: number;
};

export type ReadyCategoryManagementContext = Omit<
  AppAccessSession,
  never
> & {
  kind: "category-management";
  categories: CategoryWithReferenceCount[];
};

export type CategoryManagementContext = ReadyCategoryManagementContext;

export async function loadCategoryManagementContext({
  searchParams,
}: {
  searchParams?: AppSearchParams;
}): Promise<CategoryManagementContext> {
  await searchParams;
  const session = await requireAppRouteAccess("categories");
  const categories = await listCategoriesWithReferenceCounts(
    getPrismaClient(),
    session.access.member.householdId,
  );

  return {
    ...session,
    kind: "category-management",
    categories,
  };
}

async function listCategoriesWithReferenceCounts(
  prisma: CategoryCommandPrismaClient,
  householdId: string,
): Promise<CategoryWithReferenceCount[]> {
  const categories = await loadHouseholdCategories({ householdId, prisma });
  const referenceCounts = await getCategoryReferenceCounts({
    categoryIds: categories.map((category) => category.id),
    householdId,
    prisma,
  });

  return categories.map((category) => ({
    ...category,
    recordCount: referenceCounts.get(category.id) ?? 0,
  }));
}
