"use client";
import type { ReactNode } from "react";
import type { RecordCreateMode } from "./record-create-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CreateRecordDialog({
  children,
  mode,
  onOpenChange,
  open,
}: {
  children: ReactNode;
  mode: RecordCreateMode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="max-w-xl"
        disableOutsidePointerDown
        forceMount
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "income" ? "新增收入" : "新增紀錄"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            依序選擇紀錄類型、分類、金額、名稱、支付者、日期與備註。
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
