// components/ui/tabs.tsx

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
        vertical: "data-[orientation=vertical]:flex-row data-[orientation=vertical]:gap-4",
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
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-1 text-gray-500 data-[orientation=horizontal]:h-10 data-[orientation=horizontal]:flex-row data-[orientation=vertical]:h-fit data-[orientation=vertical]:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-gray-100/80 backdrop-blur-sm",
        line: "gap-2 bg-transparent border-b border-gray-200 data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-r",
        pills: "gap-1 bg-transparent",
        underline: "gap-0 bg-transparent border-b-2 border-gray-200/50",
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
  "relative inline-flex h-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-gray-900 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: [
          "text-gray-600 hover:text-gray-900 hover:bg-white/50",
          "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
        ],
        line: [
          "rounded-none bg-transparent text-gray-500 hover:text-gray-700",
          "data-[state=active]:bg-transparent data-[state=active]:text-[#2D6A4F]",
          "after:absolute after:bg-[#2D6A4F] after:opacity-0 after:transition-all after:duration-200",
          "data-[orientation=horizontal]:after:inset-x-0 data-[orientation=horizontal]:after:bottom-[-2px] data-[orientation=horizontal]:after:h-0.5",
          "data-[orientation=vertical]:after:inset-y-0 data-[orientation=vertical]:after:-right-1 data-[orientation=vertical]:after:w-0.5",
          "data-[state=active]:after:opacity-100",
        ],
        pills: [
          "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50",
          "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
        ],
        underline: [
          "rounded-none bg-transparent text-gray-500 hover:text-gray-700 data-[state=active]:text-[#2D6A4F]",
          "after:absolute after:inset-x-0 after:bottom-[-2px] after:h-0.5 after:bg-[#2D6A4F] after:scale-x-0 after:transition-transform after:duration-200",
          "data-[state=active]:after:scale-x-100",
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
        "flex-1 text-sm outline-none pt-2",
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