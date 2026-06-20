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
        className="max-w-xl gap-0 overflow-hidden p-0"
        disableOutsidePointerDown
        forceMount
      >
        <DialogHeader className="border-b border-border px-6 py-6 pr-10 text-center">
          <DialogTitle className="text-heading">
            {mode === "income" ? "新增收入" : "新增紀錄"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            依序選擇紀錄類型、分類、金額、名稱、成員、日期與備註。
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
