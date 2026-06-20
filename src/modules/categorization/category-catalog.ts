import {
  authorize,
  type AuthenticatedMember,
  type AuthorizationResult,
} from "../identity-access/authorization";
import type { LedgerRecordType } from "../fund-ledger/ledger-records";
import {
  deriveDefaultCategoryVisual,
  isCategoryColorKey,
  isCategoryIconKey,
  type CategoryColorKey,
  type CategoryIconKey,
} from "./category-visual-options";

export type Category = {
  id: string;
  type: LedgerRecordType;
  name: string;
  color: CategoryColorKey;
  icon: CategoryIconKey;
  sortOrder: number;
  status: "active" | "archived";
};

export type CategoryCatalogContext = {
  categories: Category[];
  generateId?: () => string;
};

export type CategoryCatalogResult =
  | {
      ok: true;
      category: Category;
      events: ("Category created" | "Category updated")[];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "invalid_name"
        | "invalid_color"
        | "invalid_icon"
        | "invalid_order"
        | "category_not_found"
        | "archived_category"
        | "duplicate_active_category_name";
      authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
    };

export type CreateCategoryCommand = {
  color?: string;
  icon?: string;
  type: LedgerRecordType;
  name: string;
};

export type UpdateCategoryCommand = {
  categoryId: string;
  color: string;
  icon: string;
  name: string;
};

export type RenameCategoryCommand = {
  categoryId: string;
  name: string;
};

export type ArchiveCategoryCommand = {
  categoryId: string;
};

export type ReorderCategoriesCommand = {
  orderedCategoryIds: string[];
  type: LedgerRecordType;
};

export function createCategory(
  actor: AuthenticatedMember,
  command: CreateCategoryCommand,
  context: CategoryCatalogContext,
): CategoryCatalogResult {
  const permission = canManageCategories(actor);

  if (permission.ok === false) {
    return permission;
  }

  const name = normalizeName(command.name);

  if (!name) {
    return { ok: false, reason: "invalid_name" };
  }

  if (hasDuplicateActiveName(context.categories, command.type, name)) {
    return { ok: false, reason: "duplicate_active_category_name" };
  }

  const visual = deriveDefaultCategoryVisual(name);
  const color = command.color ?? visual.color;
  const icon = command.icon ?? visual.icon;

  if (!isCategoryColorKey(color)) {
    return { ok: false, reason: "invalid_color" };
  }

  if (!isCategoryIconKey(icon)) {
    return { ok: false, reason: "invalid_icon" };
  }

  return {
    ok: true,
    category: {
      id: context.generateId?.() ?? crypto.randomUUID(),
      type: command.type,
      name,
      color,
      icon,
      sortOrder: nextSortOrder(context.categories, command.type),
      status: "active",
    },
    events: ["Category created"],
  };
}

export function updateCategory(
  actor: AuthenticatedMember,
  command: UpdateCategoryCommand,
  context: CategoryCatalogContext,
): CategoryCatalogResult {
  const permission = canManageCategories(actor);

  if (permission.ok === false) {
    return permission;
  }

  const category = findCategory(context.categories, command.categoryId);

  if (!category) {
    return { ok: false, reason: "category_not_found" };
  }

  if (category.status === "archived") {
    return { ok: false, reason: "archived_category" };
  }

  const name = normalizeName(command.name);

  if (!name) {
    return { ok: false, reason: "invalid_name" };
  }

  if (!isCategoryColorKey(command.color)) {
    return { ok: false, reason: "invalid_color" };
  }

  if (!isCategoryIconKey(command.icon)) {
    return { ok: false, reason: "invalid_icon" };
  }

  if (
    hasDuplicateActiveName(
      context.categories.filter((candidate) => candidate.id !== category.id),
      category.type,
      name,
    )
  ) {
    return { ok: false, reason: "duplicate_active_category_name" };
  }

  return {
    ok: true,
    category: {
      ...category,
      name,
      color: command.color,
      icon: command.icon,
    },
    events: ["Category updated"],
  };
}

export function renameCategory(
  actor: AuthenticatedMember,
  command: RenameCategoryCommand,
  context: CategoryCatalogContext,
): CategoryCatalogResult {
  const category = findCategory(context.categories, command.categoryId);

  if (!category) {
    return updateCategory(
      actor,
      {
        categoryId: command.categoryId,
        color: "gold",
        icon: "tags",
        name: command.name,
      },
      context,
    );
  }

  return updateCategory(
    actor,
    {
      categoryId: command.categoryId,
      color: category.color,
      icon: category.icon,
      name: command.name,
    },
    context,
  );
}

export function archiveCategory(
  actor: AuthenticatedMember,
  command: ArchiveCategoryCommand,
  context: CategoryCatalogContext,
): CategoryCatalogResult {
  const permission = canManageCategories(actor);

  if (permission.ok === false) {
    return permission;
  }

  const category = findCategory(context.categories, command.categoryId);

  if (!category) {
    return { ok: false, reason: "category_not_found" };
  }

  return {
    ok: true,
    category: {
      ...category,
      status: "archived",
    },
    events: ["Category updated"],
  };
}

export function reorderCategories(
  actor: AuthenticatedMember,
  command: ReorderCategoriesCommand,
  context: CategoryCatalogContext,
): CategoryCatalogResult {
  const permission = canManageCategories(actor);

  if (permission.ok === false) {
    return permission;
  }

  const activeTypeCategories = listAvailableCategories(
    context.categories,
    command.type,
  );
  const activeIds = new Set(activeTypeCategories.map((category) => category.id));
  const orderedIds = command.orderedCategoryIds;
  const orderedIdSet = new Set(orderedIds);

  if (
    orderedIds.length !== activeTypeCategories.length ||
    orderedIdSet.size !== orderedIds.length ||
    orderedIds.some((categoryId) => !activeIds.has(categoryId))
  ) {
    return { ok: false, reason: "invalid_order" };
  }

  const categoriesById = new Map(
    activeTypeCategories.map((category) => [category.id, category]),
  );
  const reorderedCategories = orderedIds.map((categoryId, index) => ({
    ...categoriesById.get(categoryId)!,
    sortOrder: (index + 1) * 10,
  }));

  return {
    ok: true,
    category: reorderedCategories[0],
    events: ["Category updated"],
  };
}

export function listAvailableCategories(
  categories: Category[],
  type: LedgerRecordType,
): Category[] {
  return categories
    .filter((category) => category.type === type && category.status === "active")
    .sort(compareCategoryOrder);
}

function canManageCategories(
  actor: AuthenticatedMember,
): Extract<CategoryCatalogResult, { ok: false }> | { ok: true } {
  const authorization = authorize(actor, { type: "manage_categories" });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "permission_denied",
      authorizationReason: authorization.reason,
    };
  }

  return { ok: true };
}

function normalizeName(name: string): string {
  return name.trim();
}

function hasDuplicateActiveName(
  categories: Category[],
  type: LedgerRecordType,
  name: string,
): boolean {
  return categories.some(
    (category) =>
      category.type === type &&
      category.status === "active" &&
      category.name === name,
  );
}

function findCategory(
  categories: Category[],
  categoryId: string,
): Category | undefined {
  return categories.find((category) => category.id === categoryId);
}

function nextSortOrder(categories: Category[], type: LedgerRecordType): number {
  const maxSortOrder = categories
    .filter((category) => category.type === type && category.status === "active")
    .reduce((max, category) => Math.max(max, category.sortOrder), 0);

  return maxSortOrder + 10;
}

function compareCategoryOrder(left: Category, right: Category): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return left.name.localeCompare(right.name);
}
