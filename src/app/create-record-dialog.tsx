"use client";

import { useState } from "react";
import { RecordEntryPanel } from "./record-entry-panel";
import type { HomeDashboardData } from "./home-dashboard-data-source";
import type { HomeDashboardView } from "./home-access";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CreateRecordDialog({
  canCreateRecordsForOthers,
  categories,
  defaultOpen,
  feedback,
  members,
  mode,
  month,
  profile,
  returnTo,
}: {
  canCreateRecordsForOthers: boolean;
  categories: HomeDashboardData["categories"];
  defaultOpen: boolean;
  feedback: string | undefined;
  members: HomeDashboardData["householdMembers"];
  mode: "income" | "expense";
  month: string;
  profile: HomeDashboardView["profile"];
  returnTo: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
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
        <RecordEntryPanel
          canCreateRecordsForOthers={canCreateRecordsForOthers}
          categories={categories}
          feedback={feedback}
          members={members}
          mode={mode}
          month={month}
          profile={profile}
          returnTo={returnTo}
        />
      </DialogContent>
    </Dialog>
  );
}
