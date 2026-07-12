// components/ui/input.tsx

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"

interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean
  success?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  showPasswordToggle?: boolean
}

function Input({ 
  className, 
  type, 
  error, 
  success,
  icon,
  iconPosition = "left",
  showPasswordToggle = false,
  disabled,
  ...props 
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const inputType = showPasswordToggle && showPassword ? "text" : type

  // Determine if we should show an icon
  const hasIcon = Boolean(icon)
  const hasErrorIcon = error && !icon
  const hasSuccessIcon = success && !icon && !error

  // Determine padding based on icon positions
  const paddingLeft = (hasIcon || hasErrorIcon || hasSuccessIcon) && iconPosition === "left" ? "pl-9" : "pl-3"
  const paddingRight = (icon && iconPosition === "right") || showPasswordToggle ? "pr-9" : "pr-3"

  return (
    <div className="relative w-full">
      <InputPrimitive
        type={inputType}
        data-slot="input"
        data-error={error}
        data-success={success}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-200",
          "placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          // Normal state
          "border-gray-200 focus-visible:border-[#2D6A4F] focus-visible:ring-[#2D6A4F]/20",
          // Error state
          error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
          // Success state
          success && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20",
          // Padding
          paddingLeft,
          paddingRight,
          className
        )}
        disabled={disabled}
        {...props}
      />

      {/* Left Icon */}
      {hasIcon && iconPosition === "left" && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}

      {/* Error Icon */}
      {hasErrorIcon && iconPosition === "left" && (
        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 pointer-events-none" />
      )}

      {/* Success Icon */}
      {hasSuccessIcon && iconPosition === "left" && (
        <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />
      )}

      {/* Right Icon */}
      {hasIcon && iconPosition === "right" && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}

      {/* Password Toggle */}
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}

      {/* Error/Help Text */}
      {error && typeof error === "string" && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export { Input }