// components/ui/label.tsx

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LabelProps extends React.ComponentProps<"label"> {
  required?: boolean
  disabled?: boolean
  size?: "sm" | "default" | "lg"
}

function Label({ 
  className, 
  required, 
  disabled,
  size = "default",
  children,
  ...props 
}: LabelProps) {
  const sizes = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base"
  }

  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-1.5 font-medium select-none",
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 text-sm" aria-hidden="true">*</span>
      )}
    </label>
  )
}

export { Label }