import {
  PageLoading,
  SettingsListLoading,
} from "@/components/layout/page-loading";

export default function Loading() {
  return (
    <PageLoading label="分類頁載入中">
      <SettingsListLoading />
    </PageLoading>
  );
}
