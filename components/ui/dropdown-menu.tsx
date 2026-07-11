'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type DropdownMenuContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | undefined>(undefined)

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu provider')
  }
  return context
}

export function DropdownMenu({ 
  children, 
  defaultOpen = false 
}: { 
  children: React.ReactNode
  defaultOpen?: boolean 
}) {
  const [open, setOpen] = useState(defaultOpen)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    if (!open) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen, triggerRef } = useDropdownMenu()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(event)
    setOpen((prev) => !prev)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen((prev) => !prev)
    }
  }

  if (asChild && React.isValidElement(children)) {
    // Clone the child with our props, casting the event types
    const childProps = {
      ...props,
      ref: triggerRef,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      'aria-expanded': open,
      'aria-haspopup': true,
    }
    return React.cloneElement(children as React.ReactElement<any>, childProps)
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      aria-expanded={open}
      aria-haspopup={true}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  className,
  align = 'end',
  sideOffset = 8,
}: React.HTMLAttributes<HTMLDivElement> & { 
  align?: 'start' | 'end' | 'center'
  sideOffset?: number 
}) {
  const { open, setOpen, triggerRef, contentRef } = useDropdownMenu()

  // Handle click outside
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        contentRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    // Use pointerdown for better mobile support
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open, setOpen, contentRef, triggerRef])

  // Handle focus trap
  useEffect(() => {
    if (!open) return

    const focusableElements = contentRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements?.[0] as HTMLElement
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    // Focus first element when opened
    setTimeout(() => firstElement?.focus(), 0)
    
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [open, contentRef])

  if (!open) return null

  const alignClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 min-w-[12rem] rounded-md border border-gray-200 bg-white p-1 shadow-lg',
        'animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in',
        alignClasses[align],
        className
      )}
      style={{ marginTop: sideOffset }}
      role="menu"
      aria-orientation="vertical"
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ 
  children, 
  className,
  inset,
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div 
      className={cn(
        'px-2 py-1.5 text-sm font-semibold text-gray-900',
        inset && 'pl-8',
        className
      )}
      role="presentation"
    >
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('my-1 h-px bg-gray-200', className)} role="separator" />
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDropdownMenu()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    onClick?.(event)
    setOpen(false)
  }

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-gray-700',
        'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      role="menuitem"
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// Add dropdown menu group for better organization
export function DropdownMenuGroup({ 
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('py-1', className)} role="group" {...props}>
      {children}
    </div>
  )
}

// Add dropdown menu shortcut
export function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-gray-400', className)}
      {...props}
    />
  )
}