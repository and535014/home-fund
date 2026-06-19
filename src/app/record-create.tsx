"use client";

import {
  useCallback,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CreateRecordDialog } from "./create-record-dialog";
import { RecordEntryPanel } from "./record-entry-panel";
import {
  RecordCreateContext,
  useRecordCreate,
  type RecordCreateContextValue,
  type RecordCreateData,
  type RecordCreateMode,
} from "./record-create-context";
export type { RecordCreateData } from "./record-create-context";

export function RecordCreateScope({
  children,
  createRecord,
}: {
  children: ReactNode;
  createRecord: RecordCreateData;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<RecordCreateMode | null>(null);

  const close = useCallback(() => {
    setMode(null);
  }, []);
  const openIncome = useCallback(() => {
    setMode("income");
  }, []);
  const openExpense = useCallback(() => {
    setMode("expense");
  }, []);
  const handleRecordCreated = useCallback(() => {
    setMode(null);
    router.refresh();
    toast.success("紀錄已新增", {
      description: "已更新本月紀錄與摘要。",
      id: "create-record-success",
    });
  }, [router]);

  const value = useMemo<RecordCreateContextValue>(
    () => ({
      ...createRecord,
      close,
      mode,
      openExpense,
      openIncome,
      onRecordCreated: handleRecordCreated,
    }),
    [close, createRecord, mode, openExpense, openIncome, handleRecordCreated],
  );

  return (
    <RecordCreateContext.Provider value={value}>
      {children}
      {mode ? (
        <CreateRecordDialog
          mode={mode}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              close();
            }
          }}
          open
        >
          <RecordEntryPanel />
        </CreateRecordDialog>
      ) : null}
    </RecordCreateContext.Provider>
  );
}

export function RecordCreateActions({
  buttonClassName,
  size,
}: {
  buttonClassName?: string;
  size?: ComponentProps<typeof Button>["size"];
}) {
  const { openExpense, openIncome } = useRecordCreate();

  return (
    <>
      <Button
        className={buttonClassName}
        onClick={openIncome}
        size={size}
        type="button"
        variant="secondary"
      >
        <TrendingUp aria-hidden="true" size={18} />
        <span className="truncate">新增收入</span>
      </Button>
      <Button
        className={buttonClassName}
        onClick={openExpense}
        size={size}
        type="button"
      >
        <TrendingDown aria-hidden="true" size={18} />
        <span className="truncate">新增支出</span>
      </Button>
    </>
  );
}
