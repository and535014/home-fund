import { redirect } from "next/navigation";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { getPrismaClient } from "@/db/prisma";
import { CsvImportPanel } from "./csv-import-panel";

export default async function ImportSettingsPage() {
  const session = await requireAuthenticatedMember();

  if (!session.accessHints.actions.canImportLedgerRecords) {
    redirect("/");
  }

  const prisma = getPrismaClient();
  const householdId = session.access.member.householdId;
  const [members, categories] = await Promise.all([
    prisma.member.findMany({
      where: {
        householdId,
      },
      orderBy: {
        displayName: "asc",
      },
      select: {
        id: true,
        displayName: true,
      },
    }),
    prisma.category.findMany({
      where: {
        householdId,
        status: "active",
      },
      orderBy: [
        { type: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        type: true,
      },
    }),
  ]);

  return (
    <PageLayout
      contentClassName="flex h-full min-h-0 flex-col"
      header={
        <PageHeader
          hideOnMobile
          title="CSV 匯入"
        />
      }
    >
      <CsvImportPanel categories={categories} members={members} />
    </PageLayout>
  );
}
