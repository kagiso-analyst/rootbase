// components/ui/separator.tsx

"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "@/lib/utils"

interface SeparatorProps extends SeparatorPrimitive.Props {
  variant?: "default" | "dashed" | "dotted"
  thickness?: "default" | "thin" | "thick"
}

function Separator({
  className,
  orientation = "horizontal",
  variant = "default",
  thickness = "default",
  ...props
}: SeparatorProps) {
  const thicknessClasses = {
    thin: "data-horizontal:h-px data-vertical:w-px",
    default: "data-horizontal:h-[2px] data-vertical:w-[2px]",
    thick: "data-horizontal:h-[3px] data-vertical:w-[3px]",
  }

  const variantClasses = {
    default: "bg-gray-200",
    dashed: "border-0 bg-transparent data-horizontal:border-t-2 data-horizontal:border-dashed data-vertical:border-l-2 data-vertical:border-dashed border-gray-300",
    dotted: "border-0 bg-transparent data-horizontal:border-t-2 data-horizontal:border-dotted data-vertical:border-l-2 data-vertical:border-dotted border-gray-300",
  }

  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0",
        thicknessClasses[thickness],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Separator }