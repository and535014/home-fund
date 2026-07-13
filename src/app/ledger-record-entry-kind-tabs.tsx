"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LEDGER_RECORD_ENTRY_KIND,
  type LedgerRecordEntryKind,
} from "./ledger-record-entry-kind";

export function LedgerRecordEntryKindTabs({
  disabled = false,
  entryKind,
  onEntryKindChange,
}: {
  disabled?: boolean;
  entryKind: LedgerRecordEntryKind;
  onEntryKindChange: (entryKind: LedgerRecordEntryKind) => void;
}) {
  return (
    <Tabs
      className="gap-0"
      onValueChange={(value) => onEntryKindChange(value as LedgerRecordEntryKind)}
      value={entryKind}
    >
      <TabsList aria-label="紀錄類型" className="w-full" variant="line">
        <TabsTrigger disabled={disabled} value={LEDGER_RECORD_ENTRY_KIND.memberExpense}>
          成員支出
        </TabsTrigger>
        <TabsTrigger disabled={disabled} value={LEDGER_RECORD_ENTRY_KIND.income}>
          收入
        </TabsTrigger>
        <TabsTrigger disabled={disabled} value={LEDGER_RECORD_ENTRY_KIND.fundExpense}>
          基金支出
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
