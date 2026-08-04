// components/ui/Logo.tsx

'use client'

import { cn } from '@/lib/utils'
import { Leaf } from 'lucide-react'

interface LogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showBadge?: boolean
}

const sizeMap = {
  sm: { text: 'text-lg', icon: 20, container: 'h-8', gap: 'gap-2' },
  md: { text: 'text-xl', icon: 24, container: 'h-9', gap: 'gap-2.5' },
  lg: { text: 'text-2xl', icon: 28, container: 'h-10', gap: 'gap-3' },
  xl: { text: 'text-3xl', icon: 32, container: 'h-12', gap: 'gap-3' },
}

export function Logo({ variant = 'full', size = 'md', className, showBadge = false }: LogoProps) {
  const sizes = sizeMap[size]

  if (variant === 'icon') {
    return (
      <div className={cn("flex items-center justify-center", sizes.container, className)}>
        <div className="w-8 h-8 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-xl flex items-center justify-center shadow-sm">
          <Leaf size={18} className="text-[#52B788]" />
        </div>
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <span className={cn("font-bold text-[#1B4332] tracking-tight", sizes.text, className)}>
        RootBase
      </span>
    )
  }

  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      {/* Logo icon */}
      <div className="w-8 h-8 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
        <Leaf size={18} className="text-[#52B788]" />
      </div>
      <span className={cn("font-bold text-[#1B4332] tracking-tight", sizes.text)}>
        RootBase
      </span>
      {showBadge && (
        <span className="text-[10px] bg-[#D8F3DC] text-[#2D6A4F] px-2 py-0.5 rounded-full font-medium">
          Beta
        </span>
      )}
    </div>
  )
}

// For SVG version (using your gemini-svg.svg)
export function LogoWithSVG({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src="/rootbase-logo.svg" 
        alt="RootBase" 
        className={cn(sizes[size], "object-contain")}
      />
      <span className="font-bold text-[#1B4332] text-xl tracking-tight">
        RootBase
      </span>
    </div>
  )
}

export default Logo