"use client";

import { toast } from "sonner";
import { loadReimbursementPaymentByLedgerRecordAction } from "./reimbursement-payment-readback-actions";
import type { ReimbursementPaymentSearchResult } from "./reimbursement-payment-ui";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export function loadReimbursementPaymentForLedgerRecord(
  record: LedgerRecord,
  onLoaded: (payment: ReimbursementPaymentSearchResult) => void,
) {
  loadReimbursementPaymentByLedgerRecordAction(record.id).then((result) => {
    if (!result.ok) {
      toast.error("退款紀錄載入失敗", {
        description: result.message,
        id: `load-reimbursement-payment-${record.id}`,
      });
      return;
    }

    if (!result.record) {
      toast.error("找不到退款紀錄", {
        description: "這筆支出目前沒有可顯示的退款紀錄。",
        id: `missing-reimbursement-payment-${record.id}`,
      });
      return;
    }

    onLoaded(result.record);
  });
}
