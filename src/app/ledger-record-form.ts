import type {
  CreateLedgerRecordCommand,
} from "@/modules/fund-ledger/ledger-records";
import type {
  UpdateLedgerRecordInDatabaseCommand,
  VoidLedgerRecordInDatabaseCommand,
} from "@/modules/fund-ledger/ledger-record-command";
import type {
  MarkExpensesReimbursedCommand,
} from "@/modules/reimbursement/reimbursements";

export type ParseCreateLedgerRecordFormResult =
  | {
      ok: true;
      command: CreateLedgerRecordCommand;
    }
  | {
      ok: false;
      reason:
        | "invalid_record_type"
        | "missing_name"
        | "invalid_amount"
        | "missing_category"
        | "missing_source_member"
        | "invalid_payment_source"
        | "missing_payer_member";
    };

export function parseCreateLedgerRecordForm(
  formData: FormData,
): ParseCreateLedgerRecordFormResult {
  const type = readFormString(formData, "recordType");
  const name = readFormString(formData, "name");
  const amountCents = parseAmountCents(readFormString(formData, "amountTwd"));
  const occurredOn = readFormString(formData, "occurredOn");
  const categoryId = readFormString(formData, "categoryId");
  const note = readOptionalFormString(formData, "note");

  if (!name) {
    return { ok: false, reason: "missing_name" };
  }

  if (amountCents === null) {
    return { ok: false, reason: "invalid_amount" };
  }

  if (!categoryId) {
    return { ok: false, reason: "missing_category" };
  }

  if (type === "income") {
    const sourceMemberId = readFormString(formData, "sourceMemberId");

    if (!sourceMemberId) {
      return { ok: false, reason: "missing_source_member" };
    }

    return {
      ok: true,
      command: {
        type: "income",
        name,
        amountCents,
        occurredOn,
        categoryId,
        sourceMemberId,
        ...(note ? { note } : {}),
      },
    };
  }

  if (type !== "expense") {
    return { ok: false, reason: "invalid_record_type" };
  }

  const paymentSource = readFormString(formData, "paymentSource");

  if (paymentSource === "fund") {
    return {
      ok: true,
      command: {
        type: "expense",
        name,
        amountCents,
        occurredOn,
        categoryId,
        paymentSource,
        ...(note ? { note } : {}),
      },
    };
  }

  if (paymentSource !== "member") {
    return { ok: false, reason: "invalid_payment_source" };
  }

  const payerMemberId = readFormString(formData, "payerMemberId");

  if (!payerMemberId) {
    return { ok: false, reason: "missing_payer_member" };
  }

  return {
    ok: true,
    command: {
      type: "expense",
      name,
      amountCents,
      occurredOn,
      categoryId,
      paymentSource,
      payerMemberId,
      ...(note ? { note } : {}),
    },
  };
}

export type ParseUpdateLedgerRecordFormResult =
  | {
      ok: true;
      command: UpdateLedgerRecordInDatabaseCommand;
    }
  | {
      ok: false;
      reason:
        | "missing_record_id"
        | "invalid_record_type"
        | "missing_name"
        | "invalid_amount"
        | "missing_category"
        | "missing_source_member"
        | "invalid_payment_source"
        | "missing_payer_member";
    };

export type ParseVoidLedgerRecordFormResult =
  | {
      ok: true;
      command: VoidLedgerRecordInDatabaseCommand;
    }
  | {
      ok: false;
      reason: "missing_record_id";
    };

export type ParseReimburseLedgerRecordFormResult =
  | {
      ok: true;
      command: MarkExpensesReimbursedCommand;
    }
  | {
      ok: false;
      reason: "missing_record_id";
    };

export function parseUpdateLedgerRecordForm(
  formData: FormData,
): ParseUpdateLedgerRecordFormResult {
  const recordId = readFormString(formData, "recordId");

  if (!recordId) {
    return { ok: false, reason: "missing_record_id" };
  }

  const parsedCreate = parseCreateLedgerRecordForm(formData);

  if (!parsedCreate.ok) {
    return parsedCreate;
  }

  const command = parsedCreate.command;

  if (command.type === "income") {
    return {
      ok: true,
      command: {
        recordId,
        name: command.name,
        amountCents: command.amountCents,
        occurredOn: command.occurredOn,
        categoryId: command.categoryId,
        sourceMemberId: command.sourceMemberId,
        ...(command.note ? { note: command.note } : {}),
      },
    };
  }

  return {
    ok: true,
    command: {
      recordId,
      name: command.name,
      amountCents: command.amountCents,
      occurredOn: command.occurredOn,
      categoryId: command.categoryId,
      paymentSource: command.paymentSource,
      ...(command.payerMemberId ? { payerMemberId: command.payerMemberId } : {}),
      ...(command.note ? { note: command.note } : {}),
    },
  };
}

export function parseVoidLedgerRecordForm(
  formData: FormData,
): ParseVoidLedgerRecordFormResult {
  const recordId = readFormString(formData, "recordId");

  if (!recordId) {
    return { ok: false, reason: "missing_record_id" };
  }

  return {
    ok: true,
    command: { recordId },
  };
}

export function parseReimburseLedgerRecordForm(
  formData: FormData,
): ParseReimburseLedgerRecordFormResult {
  const recordId = readFormString(formData, "recordId");

  if (!recordId) {
    return { ok: false, reason: "missing_record_id" };
  }

  return {
    ok: true,
    command: { selectedExpenseIds: [recordId] },
  };
}

function parseAmountCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/u.test(value)) {
    return null;
  }

  const [dollars, cents = ""] = value.split(".");
  const amountCents = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));

  return amountCents > 0 ? amountCents : null;
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalFormString(formData: FormData, key: string): string | undefined {
  const value = readFormString(formData, key);

  return value || undefined;
}
