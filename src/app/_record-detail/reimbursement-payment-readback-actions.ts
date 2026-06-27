"use server";

import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { authorize } from "@/modules/identity-access/authorization";
import {
  mapReimbursementPaymentSearchResult,
  reimbursementPaymentSelect,
  type ReimbursementPaymentSearchResult,
} from "@/modules/reimbursement/reimbursement-payment-search-query";

export type LoadReimbursementPaymentByLedgerRecordResult =
  | {
      ok: true;
      record: ReimbursementPaymentSearchResult | null;
    }
  | {
      ok: false;
      reason: "load_failed" | "unauthorized";
      message: string;
    };

export type LoadReimbursementPaymentsByLedgerRecordIdsResult =
  | {
      ok: true;
      recordsByLedgerRecordId: Record<string, ReimbursementPaymentSearchResult | null>;
    }
  | {
      ok: false;
      reason: "load_failed" | "unauthorized";
      message: string;
    };

export async function loadReimbursementPaymentByLedgerRecordAction(
  recordId: string,
): Promise<LoadReimbursementPaymentByLedgerRecordResult> {
  const session = await requireAuthenticatedMember();
  const authorization = authorize(session.access.member, {
    type: "browse_household_records",
  });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "目前帳號無法讀取退款紀錄。",
    };
  }

  try {
    const prisma = getPrismaClient();
    const householdId = session.access.member.householdId;
    const row = await prisma.reimbursementPayment.findFirst({
      where: {
        householdId,
        reimbursementBatch: {
          householdId,
          items: {
            some: {
              ledgerRecordId: recordId,
              ledgerRecord: {
                householdId,
              },
            },
          },
        },
      },
      orderBy: [{ paidOn: "desc" }, { id: "desc" }],
      select: reimbursementPaymentSelect,
    });

    return {
      ok: true,
      record: row ? mapReimbursementPaymentSearchResult(row) : null,
    };
  } catch {
    return {
      ok: false,
      reason: "load_failed",
      message: "退款紀錄載入失敗，請稍後再試。",
    };
  }
}

export async function loadReimbursementPaymentsByLedgerRecordIdsAction(
  recordIds: string[],
): Promise<LoadReimbursementPaymentsByLedgerRecordIdsResult> {
  const session = await requireAuthenticatedMember();
  const authorization = authorize(session.access.member, {
    type: "browse_household_records",
  });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "目前帳號無法讀取退款紀錄。",
    };
  }

  const selectedRecordIds = [...new Set(recordIds)].filter(Boolean);

  if (selectedRecordIds.length === 0) {
    return {
      ok: true,
      recordsByLedgerRecordId: {},
    };
  }

  try {
    const prisma = getPrismaClient();
    const householdId = session.access.member.householdId;
    const rows = await prisma.reimbursementPayment.findMany({
      where: {
        householdId,
        reimbursementBatch: {
          householdId,
          items: {
            some: {
              ledgerRecordId: {
                in: selectedRecordIds,
              },
              ledgerRecord: {
                householdId,
              },
            },
          },
        },
      },
      orderBy: [{ paidOn: "desc" }, { id: "desc" }],
      select: reimbursementPaymentSelect,
    });
    const selectedRecordIdSet = new Set(selectedRecordIds);
    const recordsByLedgerRecordId: Record<string, ReimbursementPaymentSearchResult | null> =
      Object.fromEntries(selectedRecordIds.map((recordId) => [recordId, null]));

    rows.forEach((row) => {
      const reimbursementPayment = mapReimbursementPaymentSearchResult(row);

      reimbursementPayment.linkedRecords.forEach((record) => {
        if (
          selectedRecordIdSet.has(record.id) &&
          !recordsByLedgerRecordId[record.id]
        ) {
          recordsByLedgerRecordId[record.id] = reimbursementPayment;
        }
      });
    });

    return {
      ok: true,
      recordsByLedgerRecordId,
    };
  } catch {
    return {
      ok: false,
      reason: "load_failed",
      message: "退款紀錄載入失敗，請稍後再試。",
    };
  }
}
