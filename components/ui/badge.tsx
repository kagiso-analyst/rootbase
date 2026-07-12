// components/ui/badge.tsx

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-[#2D6A4F] text-white hover:bg-[#1B4332]",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        destructive: "bg-red-100 text-red-700 hover:bg-red-200",
        outline: "border border-gray-200 text-gray-700 hover:bg-gray-50",
        success: "bg-green-100 text-green-700 hover:bg-green-200",
        warning: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
        info: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
        pink: "bg-pink-100 text-pink-700 hover:bg-pink-200",
        orange: "bg-orange-100 text-orange-700 hover:bg-orange-200",
        cyan: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }