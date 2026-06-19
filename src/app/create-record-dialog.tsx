"use client";
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
  members,
  mode,
  month,
  onOpenChange,
  onSuccess,
  open,
  profile,
  returnTo,
}: {
  canCreateRecordsForOthers: boolean;
  categories: HomeDashboardData["categories"];
  members: HomeDashboardData["householdMembers"];
  mode: "income" | "expense";
  month: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
  profile: HomeDashboardView["profile"];
  returnTo: string;
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
        <RecordEntryPanel
          canCreateRecordsForOthers={canCreateRecordsForOthers}
          categories={categories}
          members={members}
          mode={mode}
          month={month}
          onSuccess={onSuccess}
          profile={profile}
          returnTo={returnTo}
        />
      </DialogContent>
    </Dialog>
  );
}
