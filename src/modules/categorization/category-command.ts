import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  loadHouseholdCategories,
  type CategoryQueryPrismaClient,
} from "./category-query";
import {
  archiveCategory,
  createCategory,
  renameCategory,
  reorderCategories,
  unarchiveCategory,
  updateCategory,
  type ArchiveCategoryCommand,
  type Category,
  type CategoryCatalogResult,
  type CreateCategoryCommand,
  type ReorderCategoriesCommand,
  type RenameCategoryCommand,
  type UnarchiveCategoryCommand,
  type UpdateCategoryCommand,
} from "./category-catalog";

export type CategoryCommandPrismaClient = {
  category: CategoryQueryPrismaClient["category"] & {
    create(args: {
      data: {
        id: string;
        householdId: string;
        type: Category["type"];
        name: string;
        color: Category["color"];
        icon: Category["icon"];
        sortOrder: number;
        status: Category["status"];
      };
    }): Promise<unknown>;
    update(args: {
      where: {
        id: string;
      };
      data: Partial<{
        color: UpdateCategoryCommand["color"];
        icon: UpdateCategoryCommand["icon"];
        name: string;
        sortOrder: number;
        status: "active" | "archived";
      }>;
    }): Promise<unknown>;
  };
  $transaction?<T>(callback: (transaction: CategoryCommandPrismaClient) => Promise<T>): Promise<T>;
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
  householdId: string;
  generateId?: () => string;
};

export async function createCategoryInDatabase(
  actor: AuthenticatedMember,
  command: CreateCategoryCommand,
  context: CategoryCommandDatabaseContext,
): Promise<CategoryCatalogResult> {
  const householdId = context.householdId;
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
  const householdId = context.householdId;
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

export async function updateCategoryInDatabase(
  actor: AuthenticatedMember,
  command: UpdateCategoryCommand,
  context: CategoryCommandDatabaseContext,
): Promise<CategoryCatalogResult> {
  const householdId = context.householdId;
  const categories = await loadCategories(context.prisma, householdId);
  const result = updateCategory(actor, command, { categories });

  if (!result.ok) {
    return result;
  }

  await context.prisma.category.update({
    where: {
      id: result.category.id,
    },
    data: {
      color: result.category.color,
      icon: result.category.icon,
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
  const householdId = context.householdId;
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

export async function unarchiveCategoryInDatabase(
  actor: AuthenticatedMember,
  command: UnarchiveCategoryCommand,
  context: CategoryCommandDatabaseContext,
): Promise<CategoryCatalogResult> {
  const householdId = context.householdId;
  const runTransaction = context.prisma.$transaction
    ? (callback: (transaction: CategoryCommandPrismaClient) => Promise<CategoryCatalogResult>) =>
        context.prisma.$transaction!(callback)
    : (callback: (transaction: CategoryCommandPrismaClient) => Promise<CategoryCatalogResult>) =>
        callback(context.prisma);

  return runTransaction(async (prisma) => {
    const categories = await loadCategories(prisma, householdId);
    const result = unarchiveCategory(actor, command, { categories });

    if (!result.ok) {
      return result;
    }

    await prisma.category.update({
      where: {
        id: result.category.id,
      },
      data: {
        sortOrder: result.category.sortOrder,
        status: result.category.status,
      },
    });

    return result;
  });
}

export async function reorderCategoriesInDatabase(
  actor: AuthenticatedMember,
  command: ReorderCategoriesCommand,
  context: CategoryCommandDatabaseContext,
): Promise<CategoryCatalogResult> {
  const householdId = context.householdId;
  const runTransaction = context.prisma.$transaction
    ? (callback: (transaction: CategoryCommandPrismaClient) => Promise<CategoryCatalogResult>) =>
        context.prisma.$transaction!(callback)
    : (callback: (transaction: CategoryCommandPrismaClient) => Promise<CategoryCatalogResult>) =>
        callback(context.prisma);

  return runTransaction(async (prisma) => {
    const categories = await loadCategories(prisma, householdId);
    const result = reorderCategories(actor, command, { categories });

    if (!result.ok) {
      return result;
    }

    await Promise.all(
      command.orderedCategoryIds.map((categoryId, index) =>
        prisma.category.update({
          where: {
            id: categoryId,
          },
          data: {
            sortOrder: (index + 1) * 10,
          },
        }),
      ),
    );

    return result;
  });
}

export async function getCategoryReferenceCounts({
  categoryIds,
  householdId,
  prisma,
}: {
  categoryIds: string[];
  householdId: string;
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
  return loadHouseholdCategories({ householdId, prisma });
}
