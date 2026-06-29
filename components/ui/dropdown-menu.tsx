'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type DropdownMenuContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | undefined>(undefined)

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu provider')
  }
  return context
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen } = useDropdownMenu()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      ...props,
      onClick: (event: React.MouseEvent) => {
        props.onClick?.(event)
        setOpen((prev) => !prev)
      },
      'aria-expanded': open,
    })
  }

  return (
    <button
      type="button"
      {...props}
      aria-expanded={open}
      onClick={(event) => {
        props.onClick?.(event)
        setOpen((prev) => !prev)
      }}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  className,
  align = 'end',
}: React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' | 'center' }) {
  const { open, setOpen } = useDropdownMenu()

  useEffect(() => {
    if (!open) return
    const handlePointerDown = () => setOpen(false)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[12rem] rounded-md border border-gray-200 bg-white p-1 shadow-lg',
        align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2 py-1.5 text-sm', className)}>{children}</div>
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-gray-100" />
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn('flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50', className)}
      onClick={(event) => {
        onClick?.(event)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
