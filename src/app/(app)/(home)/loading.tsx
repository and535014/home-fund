import {
	HomePageLoading,
	PageLoading,
} from "@/components/layout/page-loading";

export default function Loading() {
	return (
		<PageLoading label="首頁載入中">
			<HomePageLoading />
		</PageLoading>
	);
}
