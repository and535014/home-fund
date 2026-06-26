import { getPrismaClient } from "@/db/prisma";
import { requireAppRouteAccess, type AppAccessSession } from "@/auth/app-access";
import {
  getCategoryReferenceCounts,
  type CategoryCommandPrismaClient,
} from "@/modules/categorization/category-command";
import type { Category } from "@/modules/categorization/category-catalog";
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  isCategoryColorKey,
  isCategoryIconKey,
} from "@/modules/categorization/category-visual-options";
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
  const categories = await prisma.category.findMany({
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
  });
  const referenceCounts = await getCategoryReferenceCounts({
    categoryIds: categories.map((category) => category.id),
    householdId,
    prisma,
  });

  return categories.map((category) => ({
    ...category,
    color: isCategoryColorKey(category.color)
      ? category.color
      : DEFAULT_CATEGORY_COLOR,
    icon: isCategoryIconKey(category.icon) ? category.icon : DEFAULT_CATEGORY_ICON,
    recordCount: referenceCounts.get(category.id) ?? 0,
  }));
}
