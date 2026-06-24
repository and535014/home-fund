import {
  PageLoading,
  SettingsListLoading,
} from "@/components/layout/page-loading";

export default function Loading() {
  return (
    <PageLoading label="成員頁載入中">
      <SettingsListLoading />
    </PageLoading>
  );
}
