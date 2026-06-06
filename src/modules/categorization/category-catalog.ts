import {
  authorize,
  type AuthenticatedMember,
  type AuthorizationResult,
} from "../identity-access/authorization";
import type { LedgerRecordType } from "../fund-ledger/ledger-records";

export type Category = {
  id: string;
  type: LedgerRecordType;
  name: string;
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
        | "category_not_found"
        | "archived_category"
        | "duplicate_active_category_name";
      authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
    };

export type CreateCategoryCommand = {
  type: LedgerRecordType;
  name: string;
};

export type RenameCategoryCommand = {
  categoryId: string;
  name: string;
};

export type ArchiveCategoryCommand = {
  categoryId: string;
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

  return {
    ok: true,
    category: {
      id: context.generateId?.() ?? crypto.randomUUID(),
      type: command.type,
      name,
      status: "active",
    },
    events: ["Category created"],
  };
}

export function renameCategory(
  actor: AuthenticatedMember,
  command: RenameCategoryCommand,
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
    },
    events: ["Category updated"],
  };
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

export function listAvailableCategories(
  categories: Category[],
  type: LedgerRecordType,
): Category[] {
  return categories.filter(
    (category) => category.type === type && category.status === "active",
  );
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
