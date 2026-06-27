import type { Category } from "@/modules/categorization/category-catalog";
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  isCategoryColorKey,
  isCategoryIconKey,
} from "@/modules/categorization/category-visual-options";

export type PrismaCategoryRow = {
  id: string;
  type: Category["type"];
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  status: Category["status"];
};

export type CategoryOption = Pick<Category, "id" | "name" | "type">;
export type CategoryLookup = Pick<Category, "id" | "status" | "type">;
export type ImportCategoryLookup = Pick<Category, "id" | "name" | "status" | "type">;

export const categorySelect = {
  id: true,
  type: true,
  name: true,
  color: true,
  icon: true,
  sortOrder: true,
  status: true,
} as const;

export const categoryLookupSelect = {
  id: true,
  type: true,
  status: true,
} as const;

export const importCategoryLookupSelect = {
  id: true,
  type: true,
  name: true,
  status: true,
} as const;

export type CategoryOrderBy = [
  { type: "asc" },
  { sortOrder: "asc" },
  { name: "asc" },
];

export const categoryOrderBy: CategoryOrderBy = [
  { type: "asc" },
  { sortOrder: "asc" },
  { name: "asc" },
];

export type CategoryQueryPrismaClient = {
  category: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: typeof categorySelect;
      orderBy: CategoryOrderBy;
    }): Promise<PrismaCategoryRow[]>;
  };
};

export type ActiveCategoryOptionQueryPrismaClient = {
  category: {
    findMany(args: {
      where: {
        householdId: string;
        status: "active";
      };
      select: {
        id: true;
        name: true;
        type: true;
      };
      orderBy: CategoryOrderBy;
    }): Promise<CategoryOption[]>;
  };
};

export type CategoryLookupQueryPrismaClient = {
  category: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: typeof categoryLookupSelect;
    }): Promise<CategoryLookup[]>;
  };
};

export type ImportCategoryLookupQueryPrismaClient = {
  category: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: typeof importCategoryLookupSelect;
    }): Promise<ImportCategoryLookup[]>;
  };
};

export async function loadHouseholdCategories({
  householdId,
  prisma,
}: {
  householdId: string;
  prisma: CategoryQueryPrismaClient;
}): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: {
      householdId,
    },
    select: categorySelect,
    orderBy: categoryOrderBy,
  });

  return rows.map(mapPrismaCategoryToCategory);
}

export function loadActiveCategoryOptions({
  householdId,
  prisma,
}: {
  householdId: string;
  prisma: ActiveCategoryOptionQueryPrismaClient;
}): Promise<CategoryOption[]> {
  return prisma.category.findMany({
    where: {
      householdId,
      status: "active",
    },
    orderBy: categoryOrderBy,
    select: {
      id: true,
      name: true,
      type: true,
    },
  });
}

export function loadCategoryLookups({
  householdId,
  prisma,
}: {
  householdId: string;
  prisma: CategoryLookupQueryPrismaClient;
}): Promise<CategoryLookup[]> {
  return prisma.category.findMany({
    where: {
      householdId,
    },
    select: categoryLookupSelect,
  });
}

export function loadImportCategoryLookups({
  householdId,
  prisma,
}: {
  householdId: string;
  prisma: ImportCategoryLookupQueryPrismaClient;
}): Promise<ImportCategoryLookup[]> {
  return prisma.category.findMany({
    where: {
      householdId,
    },
    select: importCategoryLookupSelect,
  });
}

export function mapPrismaCategoryToCategory(category: PrismaCategoryRow): Category {
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
