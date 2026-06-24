import {
  PageLoading,
  SettingsAccountLoading,
} from "@/components/layout/page-loading";

export default function Loading() {
  return (
    <PageLoading label="設定內容載入中">
      <SettingsAccountLoading />
    </PageLoading>
  );
}
