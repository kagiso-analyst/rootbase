// components/ui/checkbox.tsx

"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-gray-300 transition-all duration-200 outline-none focus-visible:border-[#2D6A4F] focus-visible:ring-3 focus-visible:ring-[#2D6A4F]/20 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-[#2D6A4F] data-checked:bg-[#2D6A4F] data-checked:text-white hover:border-[#2D6A4F] hover:bg-[#D8F3DC]/50 dark:bg-input/30",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-transform duration-200 scale-0 data-checked:scale-100 [&>svg]:size-3.5"
      >
        <CheckIcon className="stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }