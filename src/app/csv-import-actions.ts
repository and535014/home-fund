"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireServerActionAccess } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import {
  confirmLedgerImportInDatabase,
  previewLedgerImportInDatabase,
  type LedgerImportCommandPrismaClient,
} from "@/modules/fund-ledger/ledger-import-command";
import type { LedgerImportRowOverride } from "@/modules/fund-ledger/ledger-import";

const maxCsvBytes = 1024 * 1024;
const previewTokenMaxAgeMs = 30 * 60 * 1000;

export async function previewCsvImportAction(formData: FormData) {
  const session = await requireServerActionAccess({ type: "import_ledger_records" });
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      ok: false as const,
      reason: "invalid_file_type" as const,
      message: "請選擇 CSV 檔案。",
    };
  }

  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    return {
      ok: false as const,
      reason: "invalid_file_type" as const,
      message: "請選擇 CSV 檔案。",
    };
  }

  if (file.size > maxCsvBytes) {
    return {
      ok: false as const,
      reason: "file_too_large" as const,
      message: "CSV 檔案不可超過 1 MB。",
    };
  }

  const csv = await file.text();
  const result = await previewLedgerImportInDatabase(
    session.access.member,
    { csv },
    {
      prisma: getPrismaClient() as unknown as LedgerImportCommandPrismaClient,
    },
  );

  if (!result.ok) {
    return {
      ...result,
      fileName: file.name,
    };
  }

  return {
    ...result,
    fileName: file.name,
    previewToken: createPreviewToken(csv),
  };
}

export async function confirmCsvImportAction(formData: FormData) {
  const session = await requireServerActionAccess({ type: "import_ledger_records" });
  const previewToken = String(formData.get("previewToken") ?? "");
  const tokenResult = verifyPreviewToken(previewToken);
  const fileName = String(formData.get("fileName") ?? "ledger-import.csv");
  const removedCsvRowNumbers = parseRemovedRows(
    String(formData.get("removedCsvRowNumbers") ?? "[]"),
  );
  const overrides = parseOverrides(String(formData.get("overrides") ?? "[]"));

  if (!tokenResult.ok) {
    return {
      ok: false as const,
      reason: "preview_expired" as const,
    };
  }

  const result = await tryConfirmLedgerImport(
    session.access.member,
    {
      csv: tokenResult.csv,
      fileName,
      removedCsvRowNumbers,
      overrides,
    },
    {
      prisma: getPrismaClient() as unknown as LedgerImportCommandPrismaClient,
    },
  );

  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/settings/import");
  }

  return result;
}

export async function repreviewCsvImportAction(formData: FormData) {
  const session = await requireServerActionAccess({ type: "import_ledger_records" });
  const previewToken = String(formData.get("previewToken") ?? "");
  const tokenResult = verifyPreviewToken(previewToken);
  const overrides = parseOverrides(String(formData.get("overrides") ?? "[]"));

  if (!tokenResult.ok) {
    return {
      ok: false as const,
      reason: "preview_expired" as const,
      message: "CSV 預覽已過期，請重新選擇檔案。",
    };
  }

  return previewLedgerImportInDatabase(
    session.access.member,
    {
      csv: tokenResult.csv,
      overrides,
    },
    {
      prisma: getPrismaClient() as unknown as LedgerImportCommandPrismaClient,
    },
  );
}

function createPreviewToken(csv: string): string {
  const payload = Buffer.from(JSON.stringify({
    csv,
    createdAt: Date.now(),
  })).toString("base64url");
  const signature = signPreviewPayload(payload);

  return `${payload}.${signature}`;
}

function verifyPreviewToken(token: string):
  | {
      ok: true;
      csv: string;
    }
  | {
      ok: false;
    } {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return { ok: false };
  }

  const expectedSignature = signPreviewPayload(payload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return { ok: false };
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as {
      createdAt?: unknown;
      csv?: unknown;
    };

    if (
      typeof parsed.csv !== "string" ||
      typeof parsed.createdAt !== "number" ||
      Date.now() - parsed.createdAt > previewTokenMaxAgeMs
    ) {
      return { ok: false };
    }

    return {
      ok: true,
      csv: parsed.csv,
    };
  } catch {
    return { ok: false };
  }
}

function signPreviewPayload(payload: string): string {
  return createHmac("sha256", previewTokenSecret())
    .update(payload)
    .digest("base64url");
}

function previewTokenSecret(): string {
  return process.env.CSV_IMPORT_PREVIEW_SECRET ?? "local-dev-preview-secret";
}

async function tryConfirmLedgerImport(
  ...args: Parameters<typeof confirmLedgerImportInDatabase>
): Promise<
  Awaited<ReturnType<typeof confirmLedgerImportInDatabase>> | {
    ok: false;
    reason: "unexpected_error";
    message: string;
  }
> {
  try {
    return await confirmLedgerImportInDatabase(...args);
  } catch (error) {
    console.error("CSV import confirmation failed", error);

    return {
      ok: false,
      reason: "unexpected_error",
      message: "CSV 匯入失敗，請稍後再試；若問題持續，請檢查 production 資料庫 migration 是否已套用。",
    };
  }
}

function parseOverrides(value: string): LedgerImportRowOverride[] {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const candidate = item as Record<string, unknown>;

      if (!Number.isInteger(candidate.csvRowNumber)) {
        return [];
      }

      return [{
        csvRowNumber: candidate.csvRowNumber as number,
        ...(typeof candidate.memberId === "string"
          ? { memberId: candidate.memberId }
          : {}),
        ...(typeof candidate.categoryId === "string"
          ? { categoryId: candidate.categoryId }
          : {}),
      }];
    });
  } catch {
    return [];
  }
}

function parseRemovedRows(value: string): number[] {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is number =>
      Number.isInteger(item) && item > 1,
    );
  } catch {
    return [];
  }
}
