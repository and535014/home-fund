"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/app/action-state";
import { requireServerActionAccess } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import {
  archiveCategoryInDatabase,
  createCategoryInDatabase,
  renameCategoryInDatabase,
  reorderCategoriesInDatabase,
  updateCategoryInDatabase,
} from "@/modules/categorization/category-command";
import type { Category } from "@/modules/categorization/category-catalog";
import type {
  CategoryColorKey,
  CategoryIconKey,
} from "@/modules/categorization/category-visual-options";

export type CategoryActionCode =
  | "permission_denied"
  | "invalid_name"
  | "invalid_color"
  | "invalid_icon"
  | "invalid_order"
  | "category_not_found"
  | "archived_category"
  | "duplicate_active_category_name"
  | "unknown_error";

export type CreateCategoryActionField = "color" | "icon" | "name" | "type";
export type CreateCategoryActionState = ActionState<
  {
    categoryId: string;
    color: CategoryColorKey;
    icon: CategoryIconKey;
    name: string;
    sortOrder: number;
    type: Category["type"];
  },
  CreateCategoryActionField,
  CategoryActionCode
>;

export type UpdateCategoryActionField = "categoryId" | "color" | "icon" | "name";
export type UpdateCategoryActionState = ActionState<
  {
    categoryId: string;
    color: CategoryColorKey;
    icon: CategoryIconKey;
    name: string;
  },
  UpdateCategoryActionField,
  CategoryActionCode
>;

export type RenameCategoryActionField = "categoryId" | "name";
export type RenameCategoryActionState = ActionState<
  { categoryId: string; name: string },
  RenameCategoryActionField,
  CategoryActionCode
>;

export type ArchiveCategoryActionField = "categoryId";
export type ArchiveCategoryActionState = ActionState<
  { categoryId: string },
  ArchiveCategoryActionField,
  CategoryActionCode
>;

export type ReorderCategoryActionField = "categoryIds" | "type";
export type ReorderCategoryActionState = ActionState<
  { categoryIds: string[]; type: Category["type"] },
  ReorderCategoryActionField,
  CategoryActionCode
>;

export async function createCategoryAction(
  _previousState: CreateCategoryActionState,
  formData: FormData,
): Promise<CreateCategoryActionState> {
  const type = readCategoryType(formData);
  const name = readFormValue(formData, "name") ?? "";
  const color = readFormValue(formData, "color");
  const icon = readFormValue(formData, "icon");

  if (!type) {
    return createCategoryError("invalid_name", "type");
  }

  const session = await requireServerActionAccess({ type: "manage_categories" });

  const result = await createCategoryInDatabase(
    session.access.member,
    { color, icon, type, name },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    return createCategoryError(result.reason, createCategoryFieldForReason(result.reason));
  }

  revalidateCategoryPaths();
  return actionSuccess("分類已新增", {
    categoryId: result.category.id,
    color: result.category.color,
    icon: result.category.icon,
    name: result.category.name,
    sortOrder: result.category.sortOrder,
    type: result.category.type,
  });
}

export async function renameCategoryAction(
  _previousState: RenameCategoryActionState,
  formData: FormData,
): Promise<RenameCategoryActionState> {
  const categoryId = readFormValue(formData, "categoryId");
  const name = readFormValue(formData, "name") ?? "";

  if (!categoryId) {
    return renameCategoryError("category_not_found", "categoryId");
  }

  const session = await requireServerActionAccess({ type: "manage_categories" });

  const result = await renameCategoryInDatabase(
    session.access.member,
    { categoryId, name },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    return renameCategoryError(result.reason, "name");
  }

  revalidateCategoryPaths();
  return actionSuccess("分類已更新", {
    categoryId: result.category.id,
    name: result.category.name,
  });
}

export async function updateCategoryAction(
  _previousState: UpdateCategoryActionState,
  formData: FormData,
): Promise<UpdateCategoryActionState> {
  const categoryId = readFormValue(formData, "categoryId");
  const color = readFormValue(formData, "color") ?? "";
  const icon = readFormValue(formData, "icon") ?? "";
  const name = readFormValue(formData, "name") ?? "";

  if (!categoryId) {
    return updateCategoryError("category_not_found", "categoryId");
  }

  const session = await requireServerActionAccess({ type: "manage_categories" });

  const result = await updateCategoryInDatabase(
    session.access.member,
    { categoryId, color, icon, name },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    return updateCategoryError(result.reason, updateCategoryFieldForReason(result.reason));
  }

  revalidateCategoryPaths();
  return actionSuccess("分類已更新", {
    categoryId: result.category.id,
    color: result.category.color,
    icon: result.category.icon,
    name: result.category.name,
  });
}

export async function archiveCategoryAction(
  _previousState: ArchiveCategoryActionState,
  formData: FormData,
): Promise<ArchiveCategoryActionState> {
  const categoryId = readFormValue(formData, "categoryId");

  if (!categoryId) {
    return archiveCategoryError("category_not_found");
  }

  const session = await requireServerActionAccess({ type: "manage_categories" });

  const result = await archiveCategoryInDatabase(
    session.access.member,
    { categoryId },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    return archiveCategoryError(result.reason);
  }

  revalidateCategoryPaths();
  return actionSuccess("分類已封存", {
    categoryId: result.category.id,
  });
}

export async function reorderCategoriesAction(
  _previousState: ReorderCategoryActionState,
  formData: FormData,
): Promise<ReorderCategoryActionState> {
  const type = readCategoryType(formData);
  const categoryIds = formData
    .getAll("categoryIds")
    .filter((value): value is string => typeof value === "string");

  if (!type) {
    return reorderCategoryError("invalid_order", "type");
  }

  const session = await requireServerActionAccess({ type: "manage_categories" });

  const result = await reorderCategoriesInDatabase(
    session.access.member,
    { type, orderedCategoryIds: categoryIds },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    return reorderCategoryError(result.reason, "categoryIds");
  }

  revalidateCategoryPaths();
  return actionSuccess("分類排序已更新", {
    categoryIds,
    type,
  });
}

function readCategoryType(formData: FormData): Category["type"] | undefined {
  const value = readFormValue(formData, "type");

  return value === "income" || value === "expense" ? value : undefined;
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function revalidateCategoryPaths() {
  revalidatePath("/");
  revalidatePath("/settings/categories");
}

function createCategoryError(
  code: CategoryActionCode,
  field: CreateCategoryActionField,
): CreateCategoryActionState {
  return categoryError<CreateCategoryActionState, CreateCategoryActionField>(
    code,
    field,
  );
}

function renameCategoryError(
  code: CategoryActionCode,
  field: RenameCategoryActionField,
): RenameCategoryActionState {
  return categoryError<RenameCategoryActionState, RenameCategoryActionField>(
    code,
    field,
  );
}

function updateCategoryError(
  code: CategoryActionCode,
  field: UpdateCategoryActionField,
): UpdateCategoryActionState {
  return categoryError<UpdateCategoryActionState, UpdateCategoryActionField>(
    code,
    field,
  );
}

function archiveCategoryError(
  code: CategoryActionCode,
): ArchiveCategoryActionState {
  return categoryError<ArchiveCategoryActionState, ArchiveCategoryActionField>(
    code,
    "categoryId",
  );
}

function reorderCategoryError(
  code: CategoryActionCode,
  field: ReorderCategoryActionField,
): ReorderCategoryActionState {
  return categoryError<ReorderCategoryActionState, ReorderCategoryActionField>(
    code,
    field,
  );
}

function categoryError<
  TState extends ActionState<unknown, TField, CategoryActionCode>,
  TField extends string,
>(code: CategoryActionCode, field: TField): TState {
  const messages: Record<CategoryActionCode, string> = {
    archived_category: "封存分類不可修改。",
    category_not_found: "找不到這個分類。",
    duplicate_active_category_name: "同類型已有啟用中的相同分類名稱。",
    invalid_color: "請選擇有效的分類顏色。",
    invalid_icon: "請選擇有效的分類 icon。",
    invalid_name: "請輸入分類名稱。",
    invalid_order: "分類排序無效，請重新整理後再試。",
    permission_denied: "只有管理者可以管理分類。",
    unknown_error: "分類管理失敗，請稍後再試。",
  };

  const fieldErrors = [
    "invalid_color",
    "invalid_icon",
    "invalid_name",
    "duplicate_active_category_name",
  ].includes(code)
    ? { [field]: [messages[code]] }
    : undefined;

  return actionError(messages[code], {
    code,
    fieldErrors,
  }) as TState;
}

function createCategoryFieldForReason(
  reason: CategoryActionCode,
): CreateCategoryActionField {
  if (reason === "invalid_color") {
    return "color";
  }

  if (reason === "invalid_icon") {
    return "icon";
  }

  return "name";
}

function updateCategoryFieldForReason(
  reason: CategoryActionCode,
): UpdateCategoryActionField {
  if (reason === "invalid_color") {
    return "color";
  }

  if (reason === "invalid_icon") {
    return "icon";
  }

  if (reason === "category_not_found") {
    return "categoryId";
  }

  return "name";
}
