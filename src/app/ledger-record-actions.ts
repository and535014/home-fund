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
  const parsed = parseCreateLedgerRecordForm(formData);

  if (!parsed.ok) {
    redirect(createRecordRedirectUrl(parsed.month, parsed.reason));
  }

  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );

  if (!currentMember.ok) {
    redirect(createRecordRedirectUrl(parsed.month, "permission_denied"));
  }

  const result = await createLedgerRecordInDatabase(
    currentMember.member,
    parsed.command,
    {
      prisma: getPrismaClient(),
    },
  );

  if (!result.ok) {
    redirect(createRecordRedirectUrl(parsed.month, result.reason));
  }

  revalidatePath("/");
  redirect(createRecordRedirectUrl(parsed.month, "success"));
}

function createRecordRedirectUrl(month: string, result: string): string {
  return `/?month=${encodeURIComponent(month)}&create=${encodeURIComponent(result)}#new-record`;
}
