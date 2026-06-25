CREATE INDEX "ReimbursementPayment_search_paid_on_cursor_idx"
  ON "ReimbursementPayment" ("householdId", "paidOn", "id");

CREATE INDEX "ReimbursementPayment_search_member_paid_on_cursor_idx"
  ON "ReimbursementPayment" ("householdId", "paidToMemberId", "paidOn", "id");

CREATE INDEX "ReimbursementPayment_search_amount_cursor_idx"
  ON "ReimbursementPayment" ("householdId", "amountCents", "paidOn", "id");
