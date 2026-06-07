"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      richColors={false}
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-card group-[.toaster]:border-border group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:shadow-lg group-[.toaster]:shadow-black/25",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:rounded-button group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:rounded-button group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
