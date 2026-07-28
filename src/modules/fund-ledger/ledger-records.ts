export type LedgerRecordType = "income" | "expense";
export type LedgerRecordStatus = "active" | "voided";

export type LedgerCategory = {
  id: string;
  type: LedgerRecordType;
  status: "active" | "archived";
};

export type ReimbursementStatus =
  | "not_applicable"
  | "not_refundable"
  | "refundable"
  | "reimbursed";

type RecurringLedgerTrace = {
  recurringEventLabel?: string;
};

export type CreateIncomeRecordCommand = {
  type: "income";
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  sourceMemberId: string;
  note?: string;
};

export type CreateExpenseRecordCommand = {
  type: "expense";
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  paymentSource: "fund" | "member";
  payerMemberId?: string;
  note?: string;
};

export type CreateLedgerRecordCommand =
  | CreateIncomeRecordCommand
  | CreateExpenseRecordCommand;

export type IncomeLedgerRecord = RecurringLedgerTrace & {
  id: string;
  type: "income";
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  createdByMemberId: string;
  sourceMemberId: string;
  note?: string;
  reimbursementStatus: "not_applicable";
  status: LedgerRecordStatus;
};

export type ExpenseLedgerRecord = RecurringLedgerTrace & {
  id: string;
  type: "expense";
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  createdByMemberId: string;
  paymentSource: "fund" | "member";
  payerMemberId?: string;
  note?: string;
  reimbursementStatus: "not_refundable" | "refundable" | "reimbursed";
  status: LedgerRecordStatus;
};

export type LedgerRecord = IncomeLedgerRecord | ExpenseLedgerRecord;

export type PersistedLedgerRecord = LedgerRecord & {
  version: number;
};

export type PersistedExpenseLedgerRecord = ExpenseLedgerRecord & {
  version: number;
};

export function isActiveLedgerRecord(record: LedgerRecord): boolean {
  return record.status === "active";
}
