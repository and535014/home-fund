import {
  PageLoading,
  SettingsAccountLoading,
} from "@/components/layout/page-loading";

export default function Loading() {
  return (
    <PageLoading label="帳號資訊載入中">
      <SettingsAccountLoading />
    </PageLoading>
  );
}
