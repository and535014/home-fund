"use client";

import { useRef } from "react";
import { AlertTriangle, HandCoins, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAmount } from "@/lib/format";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import {
  canBatchReimburseRecord,
  sumRecordAmounts,
} from "../_lib/record-search-batch-utils";
import { ReimbursementPaymentFields } from "@/app/_record-detail/reimbursement-payment-fields";

export function BatchRefundDialog({
  actor,
  onCancel,
  onConfirm,
  open,
  records,
}: {
  actor: HouseholdAccessProfile;
  onCancel: () => void;
  onConfirm: (eligibleRecords: LedgerRecord[], formData: FormData) => void;
  open: boolean;
  records: LedgerRecord[];
}) {
  const reimbursementFormRef = useRef<HTMLFormElement>(null);
  const eligibleRecords = records.filter((record) =>
    canBatchReimburseRecord(actor, record),
  );
  const skippedCount = records.length - eligibleRecords.length;
  const eligibleTotalCents = sumRecordAmounts(eligibleRecords);
  const paidToMemberIds = [
    ...new Set(
      eligibleRecords
        .map((record) => (record.type === "expense" ? record.payerMemberId : null))
        .filter((memberId): memberId is string => Boolean(memberId)),
    ),
  ];
  const hasSinglePaidToMember = paidToMemberIds.length === 1;
  const hasCrossMemberSelection = paidToMemberIds.length > 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent aria-describedby={undefined} className="max-w-md">
        <DialogHeader>
          <DialogTitle>確認批次退款</DialogTitle>
        </DialogHeader>

        <DialogBody className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-border p-3">
              <p className="text-caption text-muted-foreground">將處理</p>
              <p className="mt-1 text-heading">{eligibleRecords.length} 筆</p>
            </div>
            <div className="rounded-card border border-border p-3">
              <p className="text-caption text-muted-foreground">略過</p>
              <p className="mt-1 text-heading">{skippedCount} 筆</p>
            </div>
          </div>

          <div className="rounded-card border border-border p-3">
            <p className="text-caption text-muted-foreground">退款總金額</p>
            <p className="mt-1 text-heading text-expense">
              {formatAmount(eligibleTotalCents)}
            </p>
          </div>

          {hasSinglePaidToMember && eligibleRecords.length > 0 ? (
            <form ref={reimbursementFormRef}>
              <ReimbursementPaymentFields idPrefix="batch-reimbursement" />
            </form>
          ) : null}

          {hasCrossMemberSelection ? (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertDescription>
                批次退款一次只能選擇同一位代墊成員的紀錄。
              </AlertDescription>
            </Alert>
          ) : null}

          {skippedCount > 0 ? (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertDescription>
                不符合權限、狀態或退款條件的紀錄會保留不變。
              </AlertDescription>
            </Alert>
          ) : null}
        </DialogBody>

        <DialogFooter className="mt-4">
          <Button onClick={onCancel} type="button" variant="outline">
            <X />
            取消
          </Button>
          <Button
            disabled={eligibleRecords.length === 0 || !hasSinglePaidToMember}
            onClick={() => {
              if (!reimbursementFormRef.current) {
                return;
              }

              onConfirm(
                eligibleRecords,
                new FormData(reimbursementFormRef.current),
              );
            }}
            type="button"
          >
            <HandCoins />
            確認退款
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
