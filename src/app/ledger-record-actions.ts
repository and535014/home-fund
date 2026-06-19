"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import {
  createLedgerRecordInDatabase,
} from "@/modules/fund-ledger/ledger-record-command";
import { parseCreateLedgerRecordForm } from "./ledger-record-form";

export async function createLedgerRecordAction(formData: FormData) {
  const createIntent = readCreateRecordIntent(formData);
  const returnTo = sanitizeReturnTo(readFormValue(formData, "returnTo"));
  const parsed = parseCreateLedgerRecordForm(formData);

  if (!parsed.ok) {
    redirect(createRecordRedirectUrl(returnTo, parsed.month, parsed.reason, createIntent));
  }

  const session = await requireAuthenticatedMember();

  const result = await createLedgerRecordInDatabase(
    session.access.member,
    parsed.command,
    {
      prisma: getPrismaClient(),
    },
  );

  if (!result.ok) {
    redirect(createRecordRedirectUrl(returnTo, parsed.month, result.reason, createIntent));
  }

  revalidatePath("/");
  revalidatePath(returnTo);
  redirect(createRecordRedirectUrl(returnTo, parsed.month, "success"));
}

function createRecordRedirectUrl(
  returnTo: string,
  month: string,
  result: string,
  createIntent?: "income" | "expense",
): string {
  const params = new URLSearchParams({ month });

  if (result === "success") {
    params.set("create", "success");
  } else {
    params.set("create", createIntent ?? "income");
    params.set("result", result);
  }

  return `${returnTo}?${params.toString()}`;
}

function readCreateRecordIntent(formData: FormData): "income" | "expense" | undefined {
  const value = formData.get("createIntent");

  return value === "income" || value === "expense" ? value : undefined;
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function sanitizeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/";
  }

  return value;
}
