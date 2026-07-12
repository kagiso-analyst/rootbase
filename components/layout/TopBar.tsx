// components/ui/dropdown-menu.tsx - Simplified working version

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ===== DROPDOWN CONTEXT =====
type DropdownContextType = {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const DropdownContext = React.createContext<DropdownContextType | null>(null)

function useDropdown() {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error('useDropdown must be used within DropdownMenu')
  return context
}

// ===== DROPDOWN MENU =====
export function DropdownMenu({ 
  children, 
  defaultOpen = false 
}: { 
  children: React.ReactNode
  defaultOpen?: boolean 
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  )
}

// ===== TRIGGER =====
export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdown()

  return (
    <button
      ref={(node) => {
        if (ref) {
          if (typeof ref === 'function') ref(node)
          else ref.current = node
        }
        triggerRef.current = node
      }}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2',
        className
      )}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

// ===== CONTENT =====
export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' | 'center' }
>(({ className, children, align = 'end', ...props }, ref) => {
  const { open, contentRef } = useDropdown()

  if (!open) return null

  const alignClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }

  return (
    <div
      ref={(node) => {
        if (ref) {
          if (typeof ref === 'function') ref(node)
          else ref.current = node
        }
        contentRef.current = node
      }}
      className={cn(
        'absolute z-50 min-w-[12rem] rounded-md border border-gray-200 bg-white p-1 shadow-lg',
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = 'DropdownMenuContent'

// ===== LABEL =====
export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

// ===== SEPARATOR =====
export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('-mx-1 my-1 h-px bg-gray-200', className)} {...props} />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

// ===== ITEM =====
export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { setOpen } = useDropdown()
  return (
    <button
      ref={ref}
      className={cn(
        'flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 focus:outline-none',
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuItem.displayName = 'DropdownMenuItem'