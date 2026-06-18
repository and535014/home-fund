"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("grid gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: "default" | "line"
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "group text-muted-foreground data-[variant=default]:inline-grid data-[variant=default]:h-12 data-[variant=default]:grid-cols-2 data-[variant=default]:items-center data-[variant=default]:rounded-button data-[variant=default]:border data-[variant=default]:border-border data-[variant=default]:bg-muted/35 data-[variant=default]:p-1 data-[variant=line]:inline-flex data-[variant=line]:min-h-11 data-[variant=line]:items-end data-[variant=line]:gap-5 data-[variant=line]:border-b data-[variant=line]:border-border",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-2 text-label whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        "group-data-[variant=default]:h-10 group-data-[variant=default]:rounded-button group-data-[variant=default]:px-4 group-data-[variant=default]:data-[state=active]:bg-primary group-data-[variant=default]:data-[state=active]:text-primary-foreground group-data-[variant=default]:data-[state=inactive]:hover:bg-accent group-data-[variant=default]:data-[state=inactive]:hover:text-accent-foreground",
        "group-data-[variant=line]:-mb-px group-data-[variant=line]:h-11 group-data-[variant=line]:border-b-2 group-data-[variant=line]:border-transparent group-data-[variant=line]:px-0 group-data-[variant=line]:data-[state=active]:border-primary group-data-[variant=line]:data-[state=active]:text-foreground group-data-[variant=line]:data-[state=inactive]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
