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
  const [isCreatePending, setCreatePending] = useState(false);

  const close = useCallback(() => {
    if (!isCreatePending) {
      setMode(null);
    }
  }, [isCreatePending]);
  const openIncome = useCallback(() => {
    setMode("income");
  }, []);
  const openExpense = useCallback(() => {
    setMode("expense");
  }, []);
  const handleRecordCreated = useCallback(() => {
    setCreatePending(false);
    setMode(null);
    router.refresh();
    toast.success("紀錄已新增", {
      description: "已更新目前月份紀錄與摘要。",
      id: "create-record-success",
    });
  }, [router]);
  const handleRecurringEventCreated = useCallback(() => {
    setCreatePending(false);
    setMode(null);
    toast.success("週期事件已新增", {
      description: "正式儲存會在後續實作接上週期事件資料。",
      id: "create-recurring-event-success",
    });
  }, []);

  const value = useMemo<RecordCreateContextValue>(
    () => ({
      ...createRecord,
      close,
      isCreatePending,
      mode,
      openExpense,
      openIncome,
      onRecordCreated: handleRecordCreated,
      onRecurringEventCreated: handleRecurringEventCreated,
      setCreatePending,
    }),
    [
      close,
      createRecord,
      handleRecordCreated,
      handleRecurringEventCreated,
      isCreatePending,
      mode,
      openExpense,
      openIncome,
    ],
  );

  return (
    <RecordCreateContext.Provider value={value}>
      {children}
      {mode ? (
        <CreateRecordDialog
          mode={mode}
          onOpenChange={(nextOpen) => {
            if (!nextOpen && !isCreatePending) {
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
