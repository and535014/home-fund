"use client";

import { Plus } from "lucide-react";
import { useRecordCreate } from "@/app/record-create-context";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function RecordCreateSidebarButton() {
  const { openExpense } = useRecordCreate();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          aria-label="新增紀錄"
          className="size-11! justify-center bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground group-data-[collapsible=icon]:size-11!"
          onClick={openExpense}
          title="新增紀錄"
          tooltip="新增紀錄"
          type="button"
        >
          <Plus aria-hidden="true" size={18} />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
