import * as React from "react";

import { cn } from "@/lib/utils";

const dateInputClassName =
  "max-w-full appearance-none px-2 py-0 text-sm leading-none [&::-webkit-date-and-time-value]:flex [&::-webkit-date-and-time-value]:h-full [&::-webkit-date-and-time-value]:min-w-0 [&::-webkit-date-and-time-value]:items-center [&::-webkit-date-and-time-value]:text-left";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10.5 w-full min-w-0 rounded-input border border-input bg-background px-3 py-1 text-body transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-label file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        type === "date" && dateInputClassName,
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
