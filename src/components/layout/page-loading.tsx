import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageLoading({
  className,
  label = "載入中",
  children,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      className={cn(
        "h-full min-h-0 overflow-hidden",
        className,
      )}
      role="status"
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

export function HomePageLoading() {
  return (
    <>
      <LoadingHeader actionWidth="w-36" titleWidth="w-24" />
      <div className="grid w-full gap-7 px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] sm:px-5 md:h-full md:min-h-0 md:gap-4 md:px-6 md:py-5 md:pb-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.85fr)] lg:px-6 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,0.92fr)]">
        <div className="grid gap-7 md:min-h-0 md:grid-rows-[auto_minmax(0,1fr)_minmax(0,1.15fr)] md:gap-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Skeleton className="h-20 rounded-card md:h-24" />
            <Skeleton className="h-20 rounded-card md:h-24" />
            <Skeleton className="h-20 rounded-card md:h-24" />
          </div>

          <Skeleton className="hidden rounded-card md:block md:h-full md:min-h-40" />

          <div className="grid gap-7 md:min-h-0 md:gap-4 lg:grid-cols-2">
            <PanelSkeleton lines={2} titleWidth="w-16" />
            <PanelSkeleton lines={4} titleWidth="w-20" />
          </div>
        </div>

        <RecordListSkeleton />
      </div>
    </>
  );
}

export function SearchPageLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5 px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:px-5 md:px-6 md:py-5">
      <div className="flex items-center gap-2">
        <Skeleton className="size-10 rounded-button md:hidden" />
        <Skeleton className="h-10 min-w-0 flex-1 rounded-button" />
        <Skeleton className="size-10 rounded-button" />
        <Skeleton className="size-10 rounded-button" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid gap-2">
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton className="hidden sm:grid" />
          <ListRowSkeleton className="hidden md:grid" />
        </div>
      </div>
      <div className="grid gap-3 border-t border-border pt-3 md:hidden">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-10 rounded-button" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-10 rounded-button" />
            <Skeleton className="h-9 w-10 rounded-button" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsAccountLoading() {
  return (
    <>
      <LoadingHeader titleWidth="w-24" />
      <div className="px-4 py-6 sm:px-5 md:px-6 md:py-5">
        <div className="grid gap-3">
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
        </div>
      </div>
    </>
  );
}

export function SettingsListLoading() {
  return (
    <>
      <LoadingHeader actionWidth="w-28" titleWidth="w-16" />
      <div className="grid gap-3 px-4 py-6 sm:grid-cols-2 sm:px-5 md:grid-cols-2 md:px-6 md:py-5 xl:grid-cols-3">
        <SettingsCardSkeleton />
        <SettingsCardSkeleton />
        <SettingsCardSkeleton />
        <SettingsCardSkeleton className="hidden sm:grid" />
        <SettingsCardSkeleton className="hidden xl:grid" />
      </div>
    </>
  );
}

function LoadingHeader({
  actionWidth,
  titleWidth,
}: {
  actionWidth?: string;
  titleWidth: string;
}) {
  return (
    <div className="hidden shrink-0 border-b border-border bg-background/95 px-6 py-4 md:block lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className={cn("h-5", titleWidth)} />
          <Skeleton className="h-3 w-40" />
        </div>
        {actionWidth ? <Skeleton className={cn("h-10 rounded-button", actionWidth)} /> : null}
      </div>
    </div>
  );
}

function PanelSkeleton({
  lines,
  titleWidth,
}: {
  lines: number;
  titleWidth: string;
}) {
  return (
    <div className="grid content-start gap-3">
      <Skeleton className={cn("h-4", titleWidth)} />
      <div className="grid gap-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton className="h-4 w-full" key={index} />
        ))}
      </div>
    </div>
  );
}

function ListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2.5rem_minmax(0,1fr)_4rem] items-center gap-3 py-2",
        className,
      )}
    >
      <Skeleton className="size-10 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="grid justify-items-end gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function RecordListSkeleton() {
  return (
    <div className="grid min-h-88 content-start gap-3 lg:min-h-0 lg:border-l lg:border-border lg:pl-4">
      <Skeleton className="h-4 w-12" />
      <div className="grid gap-2">
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton className="hidden md:grid" />
        <ListRowSkeleton className="hidden md:grid" />
      </div>
    </div>
  );
}

function SettingsRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-border px-4 py-3">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

function SettingsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 rounded-card border border-border p-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="grid gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
