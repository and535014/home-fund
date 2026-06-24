export const REIMBURSEMENT_PAYMENT_METHODS = [
  "bank_transfer",
  "cash",
  "other",
] as const;

export type ReimbursementPaymentMethod =
  typeof REIMBURSEMENT_PAYMENT_METHODS[number];

export type ReimbursementPaymentEvidenceInput = {
  method: ReimbursementPaymentMethod;
  paidOn: string;
  note?: string;
};

export type ReimbursementPaymentEvidenceRejectionReason =
  | "missing_payment_method"
  | "invalid_payment_method"
  | "missing_payment_date"
  | "invalid_payment_date";

export type ReimbursementPaymentEvidenceValidationResult =
  | {
      ok: true;
      payment: ReimbursementPaymentEvidenceInput;
    }
  | {
      ok: false;
      reason: ReimbursementPaymentEvidenceRejectionReason;
    };

export function validateReimbursementPaymentEvidence(input: {
  method?: string | null;
  paidOn?: string | null;
  note?: string | null;
}): ReimbursementPaymentEvidenceValidationResult {
  const method = input.method?.trim() ?? "";
  const paidOn = input.paidOn?.trim() ?? "";
  const note = input.note?.trim() ?? "";

  if (!method) {
    return { ok: false, reason: "missing_payment_method" };
  }

  if (!isReimbursementPaymentMethod(method)) {
    return { ok: false, reason: "invalid_payment_method" };
  }

  if (!paidOn) {
    return { ok: false, reason: "missing_payment_date" };
  }

  if (!isDateOnly(paidOn)) {
    return { ok: false, reason: "invalid_payment_date" };
  }

  return {
    ok: true,
    payment: {
      method,
      paidOn,
      ...(note ? { note } : {}),
    },
  };
}

export function isReimbursementPaymentMethod(
  value: string,
): value is ReimbursementPaymentMethod {
  return REIMBURSEMENT_PAYMENT_METHODS.includes(
    value as ReimbursementPaymentMethod,
  );
}

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
