import {
  validateReimbursementPaymentEvidence,
  type ReimbursementPaymentEvidenceRejectionReason,
  type ReimbursementPaymentMethod,
} from "./reimbursement-payment";

export type CorrectReimbursementPaymentEvidenceInput = {
  method?: string | null;
  paidOn?: string | null;
  note?: string | null;
};

export type CorrectReimbursementPaymentEvidenceResult =
  | {
      ok: true;
      payment: {
        method: ReimbursementPaymentMethod;
        paidOn: string;
        note: string | null;
      };
    }
  | {
      ok: false;
      reason: ReimbursementPaymentEvidenceRejectionReason;
    };

export function correctReimbursementPaymentEvidence(
  input: CorrectReimbursementPaymentEvidenceInput,
): CorrectReimbursementPaymentEvidenceResult {
  const validation = validateReimbursementPaymentEvidence(input);

  if (!validation.ok) {
    return validation;
  }

  const note = input.note?.trim() ?? "";

  return {
    ok: true,
    payment: {
      method: validation.payment.method,
      paidOn: validation.payment.paidOn,
      note: note || null,
    },
  };
}
