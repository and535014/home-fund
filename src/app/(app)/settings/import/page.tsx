import { redirect } from "next/navigation";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { CsvImportPrototype } from "./csv-import-prototype";

export default async function ImportSettingsPage() {
  const session = await requireAuthenticatedMember();

  if (!session.accessHints.actions.canPerformReimbursement) {
    redirect("/");
  }

  return (
    <PageLayout
      header={
        <PageHeader
          hideOnMobile
          title="CSV 匯入"
        />
      }
    >
      <CsvImportPrototype />
    </PageLayout>
  );
}
