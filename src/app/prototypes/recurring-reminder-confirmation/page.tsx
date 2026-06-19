import {
  CalendarClock,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { APP_NAVIGATION_ICONS } from "@/components/layout/app-navigation-icons";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { RecurringReminderConfirmationPrototype } from "./recurring-reminder-confirmation-prototype";

export default function RecurringReminderConfirmationPrototypePage() {
  return (
    <AuthenticatedLayout
      accountOverride={{ displayName: "Lin" }}
      navigation={[
        { label: "月報", href: "#", icon: APP_NAVIGATION_ICONS.home },
        { label: "紀錄", href: "#", icon: APP_NAVIGATION_ICONS.receiptText },
        { label: "確認", href: "#pending-title", icon: APP_NAVIGATION_ICONS.listChecks },
        { label: "週期", href: "#", icon: APP_NAVIGATION_ICONS.repeat },
      ]}
    >
      <PageLayout
        header={
          <PageHeader
            eyebrow="Experience Prototype · 2026-06"
            title="週期提醒確認 Prototype"
          />
        }
      >
        <RecurringReminderConfirmationPrototype />
        <p className="mt-4 flex items-center gap-2 text-caption text-muted-foreground">
          <CalendarClock aria-hidden="true" size={14} />
          這是 production-stack prototype：使用 Next route、React state、既有 dashboard shell 和 UI components，資料為本地 fixture。
        </p>
      </PageLayout>
    </AuthenticatedLayout>
  );
}
