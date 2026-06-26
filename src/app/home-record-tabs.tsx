"use client";

import { useMemo, useState } from "react";

import { RecordListDetail } from "@/app/_record-detail/record-list-detail";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

type HomeRecordTab = "all" | "expense" | "income";

const emptyMessages: Record<HomeRecordTab, string> = {
  all: "這個月份尚無紀錄。",
  expense: "這個月份尚無支出紀錄。",
  income: "這個月份尚無收入紀錄。",
};

export function HomeRecordTabs({
  actor,
  categories,
  categoriesById,
  memberNames,
  records,
}: {
  actor: HouseholdAccessProfile;
  categories: Category[];
  categoriesById: Record<string, Category>;
  memberNames: Record<string, string>;
  records: LedgerRecord[];
}) {
  const [activeTab, setActiveTab] = useState<HomeRecordTab>("all");
  const filteredRecords = useMemo(
    () =>
      records.filter((record) => activeTab === "all" || record.type === activeTab),
    [activeTab, records],
  );

  return (
    <Tabs
      className="flex h-full min-h-0 flex-col gap-3"
      onValueChange={(value) => setActiveTab(value as HomeRecordTab)}
      value={activeTab}
    >
      <TabsList
        aria-label="紀錄篩選"
        className="w-full shrink-0"
        variant="line"
      >
        <TabsTrigger value="all">全部收支</TabsTrigger>
        <TabsTrigger value="expense">支出紀錄</TabsTrigger>
        <TabsTrigger value="income">收入紀錄</TabsTrigger>
      </TabsList>
      <div className="min-h-0 flex-1 overflow-hidden">
        <RecordListDetail
          actor={actor}
          categories={categories}
          categoriesById={categoriesById}
          emptyMessage={emptyMessages[activeTab]}
          memberNames={memberNames}
          records={filteredRecords}
        />
      </div>
    </Tabs>
  );
}
