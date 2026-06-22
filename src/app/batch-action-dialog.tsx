"use client";

import { AlertTriangle, HandCoins, Trash2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import {
  canBatchDeleteRecord,
  canBatchRefundRecord,
  formatAmount,
  sumRecordAmounts,
} from "./record-search-batch-utils";

export function BatchActionDialog({
  action,
  actor,
  onCancel,
  onConfirm,
  records,
}: {
  action: "delete" | "refund" | null;
  actor: HouseholdAccessProfile;
  onCancel: () => void;
  onConfirm: (eligibleRecords: LedgerRecord[]) => void;
  records: LedgerRecord[];
}) {
  const isDelete = action === "delete";
  const eligibleRecords = records.filter((record) =>
    isDelete
      ? canBatchDeleteRecord(actor, record)
      : canBatchRefundRecord(actor, record),
  );
  const skippedCount = records.length - eligibleRecords.length;
  const eligibleTotalCents = sumRecordAmounts(eligibleRecords);

  return (
    <Dialog open={Boolean(action)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isDelete ? "確認批次刪除" : "確認批次退款"}</DialogTitle>
          <DialogDescription>
            {isDelete
              ? "符合條件的紀錄會從目前結果與月報統計中移除。"
              : "符合條件的代墊支出會標記為已退款。"}
          </DialogDescription>
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

          {!isDelete ? (
            <div className="rounded-card border border-border p-3">
              <p className="text-caption text-muted-foreground">退款總金額</p>
              <p className="mt-1 text-heading text-expense">
                {formatAmount(eligibleTotalCents)}
              </p>
            </div>
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
            disabled={eligibleRecords.length === 0}
            onClick={() => onConfirm(eligibleRecords)}
            type="button"
            variant={isDelete ? "destructive" : "default"}
          >
            {isDelete ? <Trash2 /> : <HandCoins />}
            {isDelete ? "確認刪除" : "確認退款"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
