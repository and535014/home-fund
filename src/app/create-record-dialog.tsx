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
      <DialogContent disableOutsidePointerDown forceMount>
        <DialogHeader>
          <DialogTitle>
            {mode === "income" ? "新增收入" : "新增支出"}
          </DialogTitle>
          <DialogDescription>
            {mode === "income"
              ? "建立家庭成員繳交的房租、生活費或其他收入。"
              : "建立基金直接支出，或成員先代墊的支出。"}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
