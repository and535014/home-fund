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
  getBatchRefundDialogState,
} from "@/app/_reimbursement/batch-refund-client";
import { ReimbursementPaymentFields } from "@/app/_record-detail/reimbursement-payment-fields";

export function BatchRefundDialog({
  actor,
  isPending = false,
  onCancel,
  onConfirm,
  open,
  records,
}: {
  actor: HouseholdAccessProfile;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: (eligibleRecords: LedgerRecord[], formData: FormData) => void;
  open: boolean;
  records: LedgerRecord[];
}) {
  const reimbursementFormRef = useRef<HTMLFormElement>(null);
  const {
    eligibleRecords,
    eligibleTotalCents,
    hasCrossMemberSelection,
    hasSinglePaidToMember,
    skippedCount,
  } = getBatchRefundDialogState(actor, records);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isPending && !isOpen && onCancel()}
    >
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
              <ReimbursementPaymentFields
                disabled={isPending}
                idPrefix="batch-reimbursement"
              />
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
          <Button
            disabled={isPending}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            <X />
            取消
          </Button>
          <Button
            disabled={
              isPending || eligibleRecords.length === 0 || !hasSinglePaidToMember
            }
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
            {isPending ? "退款中..." : "確認退款"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
