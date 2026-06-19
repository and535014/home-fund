"use client";

import { createContext, useContext } from "react";
import type { HomeDashboardData } from "./home-dashboard-data-source";
import type { HomeDashboardView } from "./home-access";

export type RecordCreateMode = "income" | "expense";

export type RecordCreateData = {
  canCreateRecordsForOthers: boolean;
  categories: HomeDashboardData["categories"];
  members: HomeDashboardData["householdMembers"];
  profile: HomeDashboardView["profile"];
};

export type RecordCreateContextValue = RecordCreateData & {
  close: () => void;
  mode: RecordCreateMode | null;
  openExpense: () => void;
  openIncome: () => void;
  onRecordCreated: () => void;
};

export const RecordCreateContext =
  createContext<RecordCreateContextValue | null>(null);

export function useRecordCreate() {
  const context = useContext(RecordCreateContext);

  if (!context) {
    throw new Error(
      "Record create components must be rendered inside RecordCreateScope.",
    );
  }

  return context;
}
