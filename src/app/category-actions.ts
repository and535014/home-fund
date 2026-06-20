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
} from "@/modules/categorization/category-command";
import type { Category } from "@/modules/categorization/category-catalog";

export type CategoryActionCode =
  | "permission_denied"
  | "invalid_name"
  | "category_not_found"
  | "archived_category"
  | "duplicate_active_category_name"
  | "unknown_error";

export type CreateCategoryActionField = "name" | "type";
export type CreateCategoryActionState = ActionState<
  { categoryId: string; name: string; type: Category["type"] },
  CreateCategoryActionField,
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

export async function createCategoryAction(
  _previousState: CreateCategoryActionState,
  formData: FormData,
): Promise<CreateCategoryActionState> {
  const type = readCategoryType(formData);
  const name = readFormValue(formData, "name") ?? "";

  if (!type) {
    return createCategoryError("invalid_name", "type");
  }

  const session = await requireServerActionAccess({ type: "manage_categories" });

  const result = await createCategoryInDatabase(
    session.access.member,
    { type, name },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    return createCategoryError(result.reason, "name");
  }

  revalidateCategoryPaths();
  return actionSuccess("分類已新增", {
    categoryId: result.category.id,
    name: result.category.name,
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

function archiveCategoryError(
  code: CategoryActionCode,
): ArchiveCategoryActionState {
  return categoryError<ArchiveCategoryActionState, ArchiveCategoryActionField>(
    code,
    "categoryId",
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
    invalid_name: "請輸入分類名稱。",
    permission_denied: "只有管理者可以管理分類。",
    unknown_error: "分類管理失敗，請稍後再試。",
  };

  const fieldErrors = ["invalid_name", "duplicate_active_category_name"].includes(code)
    ? { [field]: [messages[code]] }
    : undefined;

  return actionError(messages[code], {
    code,
    fieldErrors,
  }) as TState;
}
