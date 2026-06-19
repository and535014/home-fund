"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MobileActionBar } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { CreateRecordDialog } from "./create-record-dialog";
import type { ReadyMonthlyWorkspaceContext } from "./monthly-workspace-context";

type RecordCreateMode = "income" | "expense";
type RecordCreateProps = {
  context: ReadyMonthlyWorkspaceContext;
};
const OPEN_RECORD_CREATE_EVENT = "home-fund:open-record-create";

export function RecordCreateHeaderActions({ context }: RecordCreateProps) {
  if (!context.homeView.accessHints.actions.canCreateOwnRecords) {
    return null;
  }

  return (
    <>
      <Button
        className="hidden md:inline-flex"
        onClick={() => openRecordCreateDialog("income")}
        type="button"
        variant="secondary"
      >
        <TrendingUp aria-hidden="true" size={18} />
        <span>新增收入</span>
      </Button>
      <Button
        className="hidden md:inline-flex"
        onClick={() => openRecordCreateDialog("expense")}
        type="button"
      >
        <TrendingDown aria-hidden="true" size={18} />
        <span>新增支出</span>
      </Button>
    </>
  );
}

export function RecordCreateMobileActionBar({ context }: RecordCreateProps) {
  if (!context.homeView.accessHints.actions.canCreateOwnRecords) {
    return null;
  }

  return (
    <MobileActionBar>
      <Button
        className="h-12 min-w-0 flex-1 px-3"
        onClick={() => openRecordCreateDialog("income")}
        size="lg"
        type="button"
        variant="secondary"
      >
        <TrendingUp aria-hidden="true" size={18} />
        <span className="truncate">收入</span>
      </Button>
      <Button
        className="h-12 min-w-0 flex-1 px-3"
        onClick={() => openRecordCreateDialog("expense")}
        size="lg"
        type="button"
      >
        <TrendingDown aria-hidden="true" size={18} />
        <span className="truncate">支出</span>
      </Button>
    </MobileActionBar>
  );
}

export function RecordCreateDialogHost({ context }: RecordCreateProps) {
  const router = useRouter();
  const [mode, setMode] = useState<RecordCreateMode | null>(null);
  const open = mode !== null;

  useEffect(() => {
    function openDialog(event: Event) {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      if (event.detail === "income" || event.detail === "expense") {
        setMode(event.detail);
      }
    }

    window.addEventListener(OPEN_RECORD_CREATE_EVENT, openDialog);
    return () => {
      window.removeEventListener(OPEN_RECORD_CREATE_EVENT, openDialog);
    };
  }, []);

  const handleSuccess = useCallback(() => {
    setMode(null);
    router.refresh();
    toast.success("紀錄已新增", {
      description: "已更新本月紀錄與摘要。",
      id: "create-record-success",
    });
  }, [router]);

  if (!mode) {
    return null;
  }

  return (
    <CreateRecordDialog
      canCreateRecordsForOthers={
        context.homeView.accessHints.actions.canCreateRecordsForOthers
      }
      categories={context.dashboardData.categories}
      members={context.dashboardData.householdMembers}
      mode={mode}
      month={context.month}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setMode(null);
        }
      }}
      onSuccess={handleSuccess}
      open={open}
      profile={context.homeView.profile}
      returnTo={context.returnTo}
    />
  );
}

function openRecordCreateDialog(mode: RecordCreateMode) {
  window.dispatchEvent(
    new CustomEvent<RecordCreateMode>(OPEN_RECORD_CREATE_EVENT, {
      detail: mode,
    }),
  );
}
