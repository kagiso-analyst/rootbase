"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tabsRootVariants = cva(
  "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
  {
    variants: {
      orientation: {
        horizontal: "data-[orientation=horizontal]:flex-col",
        vertical: "data-[orientation=vertical]:flex-row",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function Tabs({
  className,
  orientation = "horizontal",
  defaultValue,
  value,
  onValueChange,
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn(tabsRootVariants({ orientation }), className)}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground data-[orientation=horizontal]:h-8 data-[orientation=vertical]:h-fit data-[orientation=vertical]:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-gray-100",
        line: "gap-1 bg-transparent",
        pills: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      role="tablist"
      {...props}
    />
  )
}

const tabsTriggerVariants = cva(
  "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap text-gray-600 transition-all data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start hover:text-gray-900 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-gray-900 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: [
          "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
          "dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-gray-100",
        ],
        line: [
          "rounded-none bg-transparent data-[state=active]:bg-transparent",
          "after:absolute after:bg-gray-900 after:opacity-0 after:transition-opacity",
          "data-[orientation=horizontal]:after:inset-x-0 data-[orientation=horizontal]:after:bottom-[-5px] data-[orientation=horizontal]:after:h-0.5",
          "data-[orientation=vertical]:after:inset-y-0 data-[orientation=vertical]:after:-right-1 data-[orientation=vertical]:after:w-0.5",
          "data-[state=active]:after:opacity-100",
          "dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent",
        ],
        pills: [
          "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
          "dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-gray-100",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsTrigger({ 
  className, 
  variant = "default",
  ...props 
}: TabsPrimitive.Tab.Props & VariantProps<typeof tabsTriggerVariants>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      data-variant={variant}
      className={cn(tabsTriggerVariants({ variant }), className)}
      role="tab"
      {...props}
    />
  )
}

function TabsContent({ 
  className,
  ...props 
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-sm outline-none",
        "animate-in fade-in-0 data-[state=active]:animate-in",
        className
      )}
      role="tabpanel"
      {...props}
    />
  )
}

export { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
  tabsRootVariants,
}