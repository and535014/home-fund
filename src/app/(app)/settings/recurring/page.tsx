import { redirect } from "next/navigation";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { getPrismaClient } from "@/db/prisma";
import { loadHouseholdCategories } from "@/modules/categorization/category-query";
import {
  loadRecurringEventsForSettings,
  type RecurringEventSettingsPrismaClient,
} from "@/modules/recurring/recurring-event-query";
import { RecurringEventsPanel } from "./recurring-rules-prototype";

export default async function RecurringSettingsPage() {
  const session = await requireAuthenticatedMember();

  if (!session.accessHints.actions.canManageRecurringEvents) {
    redirect("/");
  }

  const prisma = getPrismaClient();
  const householdId = session.access.member.householdId;
  const [categories, events] = await Promise.all([
    loadHouseholdCategories({ householdId, prisma }),
    loadRecurringEventsForSettings({
      householdId,
      prisma: prisma as unknown as RecurringEventSettingsPrismaClient,
    }),
  ]);

  return (
    <PageLayout
      contentClassName="h-full min-h-0 overflow-hidden"
      header={
        <PageHeader
          hideOnMobile
          title="週期事件"
        />
      }
    >
      <RecurringEventsPanel
        categories={categories}
        events={events}
      />
    </PageLayout>
  );
}
