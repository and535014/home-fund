"use client";

import { Plus } from "lucide-react";
import { useRecordCreate } from "@/app/record-create-context";
import { Button } from "@/components/ui/button";

export function RecordCreateSidebarButton() {
  const { openExpense } = useRecordCreate();

  return (
    <Button className="h-11 w-full justify-center" onClick={openExpense} type="button">
      <Plus aria-hidden="true" size={18} />
      <span className="truncate">新增紀錄</span>
    </Button>
  );
}
