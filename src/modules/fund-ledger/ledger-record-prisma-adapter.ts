import type {
  ExpenseLedgerRecord,
  LedgerRecord,
  ReimbursementStatus,
} from "./ledger-records";

export type PrismaLedgerRecordRow = {
  id: string;
  type: LedgerRecord["type"];
  name: string;
  amountCents: number;
  occurredOn: Date;
  categoryId: string;
  createdByMemberId: string;
  sourceMemberId: string | null;
  paymentSource: "fund" | "member" | null;
  payerMemberId: string | null;
  reimbursementStatus: ReimbursementStatus;
  status: LedgerRecord["status"];
  note: string | null;
};

export type PrismaExpenseLedgerRecordRow = Omit<
  PrismaLedgerRecordRow,
  "sourceMemberId"
>;

export const prismaLedgerRecordSelect = {
  id: true,
  type: true,
  name: true,
  amountCents: true,
  occurredOn: true,
  categoryId: true,
  createdByMemberId: true,
  sourceMemberId: true,
  paymentSource: true,
  payerMemberId: true,
  reimbursementStatus: true,
  status: true,
  note: true,
} as const;

export const prismaExpenseLedgerRecordSelect = {
  id: true,
  type: true,
  name: true,
  amountCents: true,
  occurredOn: true,
  categoryId: true,
  createdByMemberId: true,
  paymentSource: true,
  payerMemberId: true,
  reimbursementStatus: true,
  status: true,
  note: true,
} as const;

export function mapPrismaLedgerRecordToLedgerRecord(
  record: PrismaLedgerRecordRow,
): LedgerRecord {
  const base = baseLedgerRecordFields(record);

  if (record.type === "income") {
    return {
      ...base,
      type: "income",
      sourceMemberId: record.sourceMemberId ?? "",
      reimbursementStatus: "not_applicable",
    };
  }

  return {
    ...base,
    type: "expense",
    paymentSource: record.paymentSource ?? "fund",
    ...(record.payerMemberId ? { payerMemberId: record.payerMemberId } : {}),
    reimbursementStatus: normalizeExpenseReimbursementStatus(
      record.reimbursementStatus,
    ),
  };
}

export function mapPrismaExpenseLedgerRecordToExpenseLedgerRecord(
  record: PrismaExpenseLedgerRecordRow,
): ExpenseLedgerRecord {
  return {
    ...baseLedgerRecordFields(record),
    type: "expense",
    paymentSource: record.paymentSource ?? "fund",
    ...(record.payerMemberId ? { payerMemberId: record.payerMemberId } : {}),
    reimbursementStatus: normalizeExpenseReimbursementStatus(
      record.reimbursementStatus,
    ),
  };
}

function baseLedgerRecordFields(record: {
  id: string;
  name: string;
  amountCents: number;
  occurredOn: Date;
  categoryId: string;
  createdByMemberId: string;
  status: LedgerRecord["status"];
  note: string | null;
}) {
  return {
    id: record.id,
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: record.occurredOn.toISOString().slice(0, 10),
    categoryId: record.categoryId,
    createdByMemberId: record.createdByMemberId,
    status: record.status,
    ...(record.note ? { note: record.note } : {}),
  };
}

function normalizeExpenseReimbursementStatus(
  status: ReimbursementStatus,
): ExpenseLedgerRecord["reimbursementStatus"] {
  return status === "not_applicable" ? "not_refundable" : status;
}
