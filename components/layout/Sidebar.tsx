// components/layout/Sidebar.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bell, Cloud, BookOpen, BarChart2, Leaf, PawPrint,
  Package, Building2, CheckSquare, Wrench, TrendingUp,
  FolderOpen, Settings, Calculator, Zap, Menu, X,
  ChevronDown, ChevronRight, Sparkles, Crown
} from 'lucide-react'
import { useFarm } from '@/lib/farm-context'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo' // 👈 ADD THIS

// ===== NAVIGATION ITEMS =====
const navItems = [
  { href: '/dashboard',        label: 'Dashboard',       icon: LayoutDashboard, color: 'text-emerald-400' },
  { href: '/notifications',    label: 'Notifications',   icon: Bell, color: 'text-amber-400' },
  { href: '/weather',          label: 'Weather',         icon: Cloud, color: 'text-sky-400' },
  { href: '/journal',          label: 'Journal',         icon: BookOpen, color: 'text-purple-400' },
  { href: '/finances',         label: 'Finances',        icon: BarChart2, color: 'text-green-400' },
  { href: '/crops',            label: 'Crops',           icon: Leaf, color: 'text-emerald-400' },
  { href: '/livestock',        label: 'Livestock',       icon: PawPrint, color: 'text-amber-400' },
  { href: '/inventory',        label: 'Inventory',       icon: Package, color: 'text-blue-400' },
  { href: '/suppliers',        label: 'Suppliers',       icon: Building2, color: 'text-indigo-400' },
  { href: '/tasks',            label: 'Tasks',           icon: CheckSquare, color: 'text-rose-400' },
  { href: '/equipment',        label: 'Equipment',       icon: Wrench, color: 'text-orange-400' },
  { href: '/analytics',        label: 'Analytics',       icon: TrendingUp, color: 'text-cyan-400' },
  { href: '/analytics/costs',  label: 'Cost Calculator', icon: Calculator, color: 'text-teal-400' },
  { href: '/documents',        label: 'Documents',       icon: FolderOpen, color: 'text-yellow-400' },
  { href: '/subscription',     label: 'Upgrade Plan',    icon: Zap, color: 'text-yellow-400' },
  { href: '/settings',         label: 'Settings',        icon: Settings, color: 'text-gray-400' },
]

// ===== SECTION DIVIDERS =====
const navSections = [
  {
    title: 'Main',
    items: ['/dashboard', '/notifications', '/weather', '/journal']
  },
  {
    title: 'Operations',
    items: ['/finances', '/crops', '/livestock', '/inventory', '/suppliers']
  },
  {
    title: 'Management',
    items: ['/tasks', '/equipment', '/analytics', '/analytics/costs', '/documents']
  },
  {
    title: 'System',
    items: ['/subscription', '/settings']
  }
]

function NavLinks({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { currentFarm } = useFarm()
  
  return (
    <>
      {/* Farm indicator */}
      {currentFarm && (
        <div className="px-3 py-2 mb-2 bg-[#2D6A4F]/30 rounded-lg border border-[#2D6A4F]/20">
          <p className="text-[10px] text-[#52B788] uppercase tracking-wider font-medium">Active Farm</p>
          <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
            <Leaf size={12} className="text-[#52B788]" />
            {currentFarm.name}
          </p>
        </div>
      )}

      {navSections.map((section) => {
        const hasActiveItem = section.items.some(href => 
          pathname === href || pathname.startsWith(href + '/')
        )
        
        return (
          <div key={section.title} className="mt-1">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="text-[10px] text-[#52B788]/60 uppercase tracking-wider font-medium">
                {section.title}
              </span>
              <div className="flex-1 h-px bg-[#2D6A4F]/40"></div>
            </div>
            {section.items.map((href) => {
              const item = navItems.find(n => n.href === href)
              if (!item) return null
              
              const active = pathname === href || pathname.startsWith(href + '/')
              
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    active
                      ? "bg-[#2D6A4F] text-white shadow-lg shadow-[#2D6A4F]/20"
                      : "text-[#D8F3DC] hover:bg-[#2D6A4F]/40 hover:text-white hover:translate-x-1"
                  )}
                >
                  <item.icon 
                    size={18} 
                    className={cn(
                      "transition-colors",
                      active ? "text-white" : item.color
                    )} 
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" />
                  )}
                </Link>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { currentFarm } = useFarm()

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 bg-[#1B4332] text-white p-2.5 rounded-xl shadow-lg hover:bg-[#2D6A4F] transition-colors"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-[#1B4332] to-[#143025] text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2D6A4F]/50">
          {/* 👇 UPDATED: Use Logo component */}
          <Logo size="md" />
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-1.5 hover:bg-[#2D6A4F]/40 rounded-lg transition-colors"
          >
            <X size={20} className="text-[#52B788]" />
          </button>
        </div>
        <div className="px-3 py-2 border-b border-[#2D6A4F]/30">
          <p className="text-[10px] text-[#52B788] font-medium">
            {currentFarm?.name || 'No Farm Selected'}
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-120px)]">
          <NavLinks onClose={() => setMobileOpen(false)} />
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-gradient-to-b from-[#1B4332] to-[#143025] text-white shadow-xl border-r border-[#2D6A4F]/20">
        {/* 👇 UPDATED: Use Logo component */}
        <div className="px-6 py-5 border-b border-[#2D6A4F]/50">
          <Logo size="md" />
          <p className="text-xs text-[#52B788] mt-1 font-medium">
            Farm Management
          </p>
          {currentFarm && (
            <div className="mt-2 px-2.5 py-1 bg-[#2D6A4F]/30 rounded-lg border border-[#2D6A4F]/20">
              <p className="text-[10px] text-[#52B788] uppercase tracking-wider font-medium">Active Farm</p>
              <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                <Leaf size={12} className="text-[#52B788]" />
                {currentFarm.name}
              </p>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2D6A4F] scrollbar-track-transparent">
          <NavLinks />
        </nav>
        
        <div className="px-6 py-4 border-t border-[#2D6A4F]/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#52B788]/60">© 2026 RootBase</p>
            <span className="text-xs text-[#52B788]/40">v1.0</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-[#52B788]/50">All systems ready</span>
          </div>
        </div>
      </aside>
    </>
  )
}