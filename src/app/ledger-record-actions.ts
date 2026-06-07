"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentMemberFromHeaders } from "@/auth/server-current-member";
import { getPrismaClient } from "@/db/prisma";
import {
  createLedgerRecordInDatabase,
} from "@/modules/fund-ledger/ledger-record-command";
import { parseCreateLedgerRecordForm } from "./ledger-record-form";

export async function createLedgerRecordAction(formData: FormData) {
  const createIntent = readCreateRecordIntent(formData);
  const parsed = parseCreateLedgerRecordForm(formData);

  if (!parsed.ok) {
    redirect(createRecordRedirectUrl(parsed.month, parsed.reason, createIntent));
  }

  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );

  if (!currentMember.ok) {
    redirect(createRecordRedirectUrl(parsed.month, "permission_denied", createIntent));
  }

  const result = await createLedgerRecordInDatabase(
    currentMember.member,
    parsed.command,
    {
      prisma: getPrismaClient(),
    },
  );

  if (!result.ok) {
    redirect(createRecordRedirectUrl(parsed.month, result.reason, createIntent));
  }

  revalidatePath("/");
  redirect(createRecordRedirectUrl(parsed.month, "success"));
}

function createRecordRedirectUrl(
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

  return `/?${params.toString()}`;
}

function readCreateRecordIntent(formData: FormData): "income" | "expense" | undefined {
  const value = formData.get("createIntent");

  return value === "income" || value === "expense" ? value : undefined;
}
