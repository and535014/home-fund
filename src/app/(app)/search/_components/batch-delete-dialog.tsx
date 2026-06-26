"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
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
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import { canBatchDeleteRecord } from "../_lib/record-search-batch-utils";

export function BatchDeleteDialog({
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
  onConfirm: (eligibleRecords: LedgerRecord[]) => void;
  open: boolean;
  records: LedgerRecord[];
}) {
  const eligibleRecords = records.filter((record) =>
    canBatchDeleteRecord(actor, record),
  );
  const skippedCount = records.length - eligibleRecords.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isPending && !isOpen && onCancel()}
    >
      <DialogContent aria-describedby={undefined} className="max-w-md">
        <DialogHeader>
          <DialogTitle>確認批次刪除</DialogTitle>
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

          {skippedCount > 0 ? (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertDescription>
                不符合權限、狀態或刪除條件的紀錄會保留不變。
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
            disabled={isPending || eligibleRecords.length === 0}
            onClick={() => onConfirm(eligibleRecords)}
            type="button"
            variant="destructive"
          >
            <Trash2 />
            {isPending ? "刪除中..." : "確認刪除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
