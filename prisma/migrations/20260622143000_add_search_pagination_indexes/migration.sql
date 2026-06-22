-- Add stable cursor pagination indexes for server-backed search results.
CREATE INDEX "LedgerRecord_search_occurred_cursor_idx" ON "LedgerRecord"("householdId", "status", "occurredOn", "id");
CREATE INDEX "LedgerRecord_search_type_cursor_idx" ON "LedgerRecord"("householdId", "status", "type", "occurredOn", "id");
CREATE INDEX "LedgerRecord_search_category_cursor_idx" ON "LedgerRecord"("householdId", "status", "categoryId", "occurredOn", "id");
CREATE INDEX "LedgerRecord_search_amount_cursor_idx" ON "LedgerRecord"("householdId", "status", "amountCents", "occurredOn", "id");
CREATE INDEX "LedgerRecord_search_reimbursement_cursor_idx" ON "LedgerRecord"("householdId", "status", "reimbursementStatus", "occurredOn", "id");
