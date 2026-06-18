import {
  CalendarClock,
  Home,
  ListChecks,
  ReceiptText,
  Repeat,
} from "lucide-react";
import { HomeDashboardLayout } from "../../home-dashboard-layout";
import { RecurringReminderConfirmationPrototype } from "./recurring-reminder-confirmation-prototype";

export default function RecurringReminderConfirmationPrototypePage() {
  return (
    <HomeDashboardLayout
      canCreateOwnRecords
      currentMonth="2026-06"
      displayName="Lin"
      navigationItems={[
        { label: "月報", href: "#", icon: Home, active: true },
        { label: "紀錄", href: "#", icon: ReceiptText, active: false },
        { label: "確認", href: "#pending-title", icon: ListChecks, active: false },
        { label: "週期", href: "#", icon: Repeat, active: false },
      ]}
      showMonthSwitcher={false}
      subtitle="Experience Prototype · 2026-06"
      title="週期提醒確認 Prototype"
    >
      <RecurringReminderConfirmationPrototype />
      <p className="mt-4 flex items-center gap-2 text-caption text-muted-foreground">
        <CalendarClock aria-hidden="true" size={14} />
        這是 production-stack prototype：使用 Next route、React state、既有 dashboard shell 和 UI components，資料為本地 fixture。
      </p>
    </HomeDashboardLayout>
  );
}
