import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  archiveCategory,
  createCategory,
  renameCategory,
  type ArchiveCategoryCommand,
  type Category,
  type CategoryCatalogResult,
  type CreateCategoryCommand,
  type RenameCategoryCommand,
} from "./category-catalog";

const DEFAULT_HOUSEHOLD_ID = "household-demo";

export type CategoryCommandPrismaClient = {
  category: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: {
        id: true;
        type: true;
        name: true;
        status: true;
      };
    }): Promise<Category[]>;
    create(args: {
      data: {
        id: string;
        householdId: string;
        type: Category["type"];
        name: string;
        status: Category["status"];
      };
    }): Promise<unknown>;
    update(args: {
      where: {
        id: string;
      };
      data: Partial<Pick<Category, "name" | "status">>;
    }): Promise<unknown>;
  };
  ledgerRecord: {
    groupBy(args: {
      by: ["categoryId"];
      where: {
        householdId: string;
        categoryId: {
          in: string[];
        };
      };
      _count: {
        _all: true;
      };
    }): Promise<Array<{ categoryId: string; _count: { _all: number } }>>;
  };
};

export type CategoryCommandDatabaseContext = {
  prisma: CategoryCommandPrismaClient;
  householdId?: string;
  generateId?: () => string;
};

export async function createCategoryInDatabase(
  actor: AuthenticatedMember,
  command: CreateCategoryCommand,
  context: CategoryCommandDatabaseContext,
): Promise<CategoryCatalogResult> {
  const householdId = context.householdId ?? DEFAULT_HOUSEHOLD_ID;
  const categories = await loadCategories(context.prisma, householdId);
  const result = createCategory(actor, command, {
    categories,
    generateId: context.generateId,
  });

  if (!result.ok) {
    return result;
  }

  await context.prisma.category.create({
    data: {
      ...result.category,
      householdId,
    },
  });

  return result;
}

export async function renameCategoryInDatabase(
  actor: AuthenticatedMember,
  command: RenameCategoryCommand,
  context: CategoryCommandDatabaseContext,
): Promise<CategoryCatalogResult> {
  const householdId = context.householdId ?? DEFAULT_HOUSEHOLD_ID;
  const categories = await loadCategories(context.prisma, householdId);
  const result = renameCategory(actor, command, { categories });

  if (!result.ok) {
    return result;
  }

  await context.prisma.category.update({
    where: {
      id: result.category.id,
    },
    data: {
      name: result.category.name,
    },
  });

  return result;
}

export async function archiveCategoryInDatabase(
  actor: AuthenticatedMember,
  command: ArchiveCategoryCommand,
  context: CategoryCommandDatabaseContext,
): Promise<CategoryCatalogResult> {
  const householdId = context.householdId ?? DEFAULT_HOUSEHOLD_ID;
  const categories = await loadCategories(context.prisma, householdId);
  const result = archiveCategory(actor, command, { categories });

  if (!result.ok) {
    return result;
  }

  await context.prisma.category.update({
    where: {
      id: result.category.id,
    },
    data: {
      status: result.category.status,
    },
  });

  return result;
}

export async function getCategoryReferenceCounts({
  categoryIds,
  householdId = DEFAULT_HOUSEHOLD_ID,
  prisma,
}: {
  categoryIds: string[];
  householdId?: string;
  prisma: CategoryCommandPrismaClient;
}): Promise<Map<string, number>> {
  const counts = new Map(categoryIds.map((categoryId) => [categoryId, 0]));

  if (categoryIds.length === 0) {
    return counts;
  }

  const rows = await prisma.ledgerRecord.groupBy({
    by: ["categoryId"],
    where: {
      householdId,
      categoryId: {
        in: categoryIds,
      },
    },
    _count: {
      _all: true,
    },
  });

  rows.forEach((row) => {
    counts.set(row.categoryId, row._count._all);
  });

  return counts;
}

function loadCategories(
  prisma: CategoryCommandPrismaClient,
  householdId: string,
): Promise<Category[]> {
  return prisma.category.findMany({
    where: {
      householdId,
    },
    select: {
      id: true,
      type: true,
      name: true,
      status: true,
    },
  });
}
