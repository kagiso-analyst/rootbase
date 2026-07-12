// components/ui/sonner.tsx

"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { 
  CircleCheckIcon, 
  InfoIcon, 
  TriangleAlertIcon, 
  OctagonXIcon, 
  Loader2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const Toaster = ({ 
  className,
  position = "top-right",
  expand = false,
  richColors = true,
  closeButton = true,
  visibleToasts = 5,
  ...props 
}: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    // ✅ Wrap Sonner in a div to prevent hydration issues
    <div className="fixed z-50 top-0 right-0 w-full pointer-events-none">
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className={cn("toaster group", className)}
        position={position}
        expand={expand}
        richColors={richColors}
        closeButton={closeButton}
        visibleToasts={visibleToasts}
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
          loading: <Loader2Icon className="size-4 animate-spin" />,
        }}
        toastOptions={{
          classNames: {
            toast: cn(
              "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
              "group-[.toaster]:border group-[.toaster]:border-gray-200/80",
              "group-[.toaster]:backdrop-blur-sm pointer-events-auto"
            ),
            title: "group-[.toast]:font-semibold group-[.toast]:text-sm",
            description: "group-[.toast]:text-gray-500 group-[.toast]:text-xs",
            actionButton: "group-[.toast]:bg-[#2D6A4F] group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium hover:group-[.toast]:bg-[#1B4332]",
            cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium hover:group-[.toast]:bg-gray-200",
            closeButton: "group-[.toast]:bg-white group-[.toast]:text-gray-400 group-[.toast]:border group-[.toast]:border-gray-200 group-[.toast]:rounded-full group-[.toast]:h-6 group-[.toast]:w-6 group-[.toast]:p-0 hover:group-[.toast]:bg-gray-100",
          },
          style: {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
          } as React.CSSProperties,
        }}
        {...props}
      />
    </div>
  )
}

// ===== TOAST HELPERS =====
import { toast } from "sonner"

export function showSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 4000,
  })
}

export function showError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 5000,
  })
}

export function showWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 4000,
  })
}

export function showInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 3000,
  })
}

export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string
    error: string
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  })
}

export { Toaster, toast }