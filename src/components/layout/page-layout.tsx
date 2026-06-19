import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageLayoutProps = {
  children: ReactNode;
  contentClassName?: string;
  footer?: ReactNode;
  header?: ReactNode;
  overlays?: ReactNode;
};

export function PageLayout({
  children,
  contentClassName,
  footer,
  header,
  overlays,
}: PageLayoutProps) {
  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto w-full max-w-7xl px-4 py-5 pb-28 sm:px-6 md:pb-5 lg:px-8",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
      {footer}
      {overlays}
    </div>
  );
}

export type PageHeaderProps = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-label text-muted-foreground">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-heading text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-caption text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export type PageContentProps = {
  children: ReactNode;
};

export function PageContent({ children }: PageContentProps) {
  return <main>{children}</main>;
}

export type PageFooterProps = {
  children: ReactNode;
};

export function PageFooter({ children }: PageFooterProps) {
  return <footer>{children}</footer>;
}

export type MobileActionBarProps = {
  children: ReactNode;
};

export function MobileActionBar({ children }: MobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.28)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-2">
        {children}
      </div>
    </div>
  );
}
