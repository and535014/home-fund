import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageLayoutProps = {
  children: ReactNode;
  contentClassName?: string;
  footer?: ReactNode;
  header?: ReactNode;
};

export function PageLayout({
  children,
  contentClassName,
  footer,
  header,
}: PageLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          className={cn(
            "w-full px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] sm:px-5 md:pb-5 lg:px-6",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
}

export type PageHeaderProps = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  hideOnMobile?: boolean;
  hideTitleOnMobile?: boolean;
  title: ReactNode;
};

export function PageHeader({
  actions,
  description,
  eyebrow,
  hideOnMobile = false,
  hideTitleOnMobile = false,
  title,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "shrink-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4 lg:px-8",
        hideOnMobile && "hidden md:block",
      )}
    >
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className={cn(hideTitleOnMobile && "hidden md:block")}>
          {eyebrow ? (
            <p className="text-label text-muted-foreground">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-subheading text-foreground sm:text-heading">
            {title}
          </h2>
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
  className?: string;
};

export function PageFooter({ children, className }: PageFooterProps) {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-col gap-2 border-t border-border bg-background/95 px-4 pb-3 pt-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6",
        className,
      )}
    >
      {children}
    </footer>
  );
}

export type MobileActionBarProps = {
  children: ReactNode;
};

export function MobileActionBar({ children }: MobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.28)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-2">
        {children}
      </div>
    </div>
  );
}
