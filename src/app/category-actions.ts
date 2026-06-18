"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentMemberFromHeaders } from "@/auth/server-current-member";
import { getPrismaClient } from "@/db/prisma";
import {
  archiveCategoryInDatabase,
  createCategoryInDatabase,
  renameCategoryInDatabase,
} from "@/modules/categorization/category-command";
import type { Category } from "@/modules/categorization/category-catalog";

export async function createCategoryAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readFormValue(formData, "returnTo"));
  const type = readCategoryType(formData);
  const name = readFormValue(formData, "name") ?? "";

  if (!type) {
    redirect(categoryRedirectUrl(returnTo, "invalid_name", "create"));
  }

  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );

  if (!currentMember.ok) {
    redirect(categoryRedirectUrl(returnTo, "permission_denied", "create"));
  }

  const result = await createCategoryInDatabase(
    currentMember.member,
    { type, name },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    redirect(categoryRedirectUrl(returnTo, result.reason, "create"));
  }

  revalidateCategoryPaths(returnTo);
  redirect(categoryRedirectUrl(returnTo, "created"));
}

export async function renameCategoryAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readFormValue(formData, "returnTo"));
  const categoryId = readFormValue(formData, "categoryId");
  const name = readFormValue(formData, "name") ?? "";

  if (!categoryId) {
    redirect(categoryRedirectUrl(returnTo, "category_not_found", "rename"));
  }

  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );

  if (!currentMember.ok) {
    redirect(categoryRedirectUrl(returnTo, "permission_denied", "rename"));
  }

  const result = await renameCategoryInDatabase(
    currentMember.member,
    { categoryId, name },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    redirect(categoryRedirectUrl(returnTo, result.reason, "rename"));
  }

  revalidateCategoryPaths(returnTo);
  redirect(categoryRedirectUrl(returnTo, "renamed"));
}

export async function archiveCategoryAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readFormValue(formData, "returnTo"));
  const categoryId = readFormValue(formData, "categoryId");

  if (!categoryId) {
    redirect(categoryRedirectUrl(returnTo, "category_not_found", "archive"));
  }

  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );

  if (!currentMember.ok) {
    redirect(categoryRedirectUrl(returnTo, "permission_denied", "archive"));
  }

  const result = await archiveCategoryInDatabase(
    currentMember.member,
    { categoryId },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    redirect(categoryRedirectUrl(returnTo, result.reason, "archive"));
  }

  revalidateCategoryPaths(returnTo);
  redirect(categoryRedirectUrl(returnTo, "archived"));
}

function categoryRedirectUrl(
  returnTo: string,
  result: string,
  action?: "create" | "rename" | "archive",
): string {
  const params = new URLSearchParams({
    categoryResult: result,
  });

  if (action) {
    params.set("categoryAction", action);
  }

  return `${returnTo}?${params.toString()}`;
}

function readCategoryType(formData: FormData): Category["type"] | undefined {
  const value = readFormValue(formData, "type");

  return value === "income" || value === "expense" ? value : undefined;
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function revalidateCategoryPaths(returnTo: string) {
  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath(returnTo);
}

function sanitizeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/categories";
  }

  return value;
}
